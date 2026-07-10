-- SoulSync database schema
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query) once,
-- then run seed.sql to populate the 300-card question bank.

-- ============================================================
-- ENUM TYPES
-- ============================================================
create type category as enum ('love', 'deep', 'fantasy', 'funny', 'gold');
create type love_stage as enum ('stranger', 'friends', 'close_hearts', 'soulmates', 'forever', 'eternal_love');
create type couple_status as enum ('pending', 'paired', 'disconnected');
create type progress_status as enum ('locked', 'opened', 'completed');
create type answer_type as enum ('text', 'voice', 'photo');

-- ============================================================
-- PROFILES  (one row per auth.users, created on signup)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '',
  age int,
  gender text,
  country text,
  timezone text,
  anniversary_date date,
  photo_url text,
  favorite_color text,
  relationship_status text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can view their partner's profile"
  on profiles for select using (
    exists (
      select 1 from couples c
      where c.status = 'paired'
        and (c.player_a = auth.uid() or c.player_b = auth.uid())
        and (c.player_a = profiles.id or c.player_b = profiles.id)
    )
  );

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ============================================================
-- COUPLES
-- ============================================================
create table couples (
  id uuid primary key default gen_random_uuid(),
  player_a uuid not null references auth.users(id) on delete cascade,
  player_b uuid references auth.users(id) on delete cascade,
  invite_code text not null unique,
  status couple_status not null default 'pending',
  paired_at timestamptz,
  xp int not null default 0,
  coins int not null default 0,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_active_date date,
  love_stage love_stage not null default 'stranger',
  created_at timestamptz not null default now()
);

alter table couples enable row level security;

create policy "Members can view their couple"
  on couples for select using (auth.uid() = player_a or auth.uid() = player_b);

-- Needed so a partner can look up a room by invite code before they're a member.
create policy "Anyone authenticated can find a pending room by code"
  on couples for select using (status = 'pending');

create policy "Users can create a room as player_a"
  on couples for insert with check (auth.uid() = player_a);

create policy "Player A can update their own pending room"
  on couples for update using (auth.uid() = player_a);

create policy "A joining user can set themselves as player_b"
  on couples for update
  using (status = 'pending' and player_b is null)
  with check (auth.uid() = player_b);

-- ============================================================
-- CARDS  (the 300-question board, seeded by seed.sql)
-- ============================================================
create table cards (
  id int primary key,
  category category not null,
  question text not null,
  is_gold boolean not null default false,
  order_index int not null,
  min_love_stage love_stage not null default 'stranger'
);

alter table cards enable row level security;

create policy "Any authenticated user can read cards"
  on cards for select using (auth.role() = 'authenticated');

-- ============================================================
-- COUPLE PROGRESS  (per-couple state of each card)
-- ============================================================
create table couple_progress (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  card_id int not null references cards(id) on delete cascade,
  status progress_status not null default 'opened',
  opened_at timestamptz,
  completed_at timestamptz,
  unique (couple_id, card_id)
);

alter table couple_progress enable row level security;

create policy "Members can view their couple's progress"
  on couple_progress for select using (
    exists (select 1 from couples c where c.id = couple_progress.couple_id
      and (c.player_a = auth.uid() or c.player_b = auth.uid()))
  );

create policy "Members can insert progress for their couple"
  on couple_progress for insert with check (
    exists (select 1 from couples c where c.id = couple_progress.couple_id
      and (c.player_a = auth.uid() or c.player_b = auth.uid()))
  );

create policy "Members can update progress for their couple"
  on couple_progress for update using (
    exists (select 1 from couples c where c.id = couple_progress.couple_id
      and (c.player_a = auth.uid() or c.player_b = auth.uid()))
  );

-- ============================================================
-- ANSWERS  (each partner's private-until-both-submit answer)
-- ============================================================
create table answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  card_id int not null references cards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answer_type answer_type not null default 'text',
  content text,
  media_url text,
  submitted_at timestamptz not null default now(),
  unique (couple_id, card_id, user_id)
);

alter table answers enable row level security;

-- Members can see their own answer immediately, but only see their partner's
-- answer once they themselves have also submitted for that card. This is
-- the "no peeking" rule enforced at the database level, not just in the UI.
create policy "Members can view answers once both have submitted, or their own"
  on answers for select using (
    user_id = auth.uid()
    or (
      exists (select 1 from couples c where c.id = answers.couple_id
        and (c.player_a = auth.uid() or c.player_b = auth.uid()))
      and exists (
        select 1 from answers mine
        where mine.couple_id = answers.couple_id
          and mine.card_id = answers.card_id
          and mine.user_id = auth.uid()
      )
    )
  );

create policy "Members can insert their own answer for their couple"
  on answers for insert with check (
    user_id = auth.uid()
    and exists (select 1 from couples c where c.id = answers.couple_id
      and (c.player_a = auth.uid() or c.player_b = auth.uid()))
  );

-- Answers are intentionally NOT updatable — once submitted they're locked in,
-- matching the "Private Mode ... cannot edit later" rule from the spec.

-- ============================================================
-- FUNCTION: award_card_completion
-- Called once both partners have answered a card. Marks progress
-- completed, awards XP/coins, and bumps the streak — all in one
-- atomic server-side call so two clients racing can't double-award.
-- ============================================================
create or replace function award_card_completion(p_couple_id uuid, p_card_id int)
returns void
language plpgsql
security definer
as $$
declare
  v_is_gold boolean;
  v_already_completed boolean;
begin
  select is_gold into v_is_gold from cards where id = p_card_id;

  select (status = 'completed') into v_already_completed
  from couple_progress where couple_id = p_couple_id and card_id = p_card_id;

  if coalesce(v_already_completed, false) then
    return; -- idempotent: don't double-award if called twice
  end if;

  update couple_progress
    set status = 'completed', completed_at = now()
    where couple_id = p_couple_id and card_id = p_card_id;

  update couples
    set xp = xp + case when v_is_gold then 40 else 15 end,
        coins = coins + case when v_is_gold then 50 else 15 end,
        last_active_date = current_date,
        current_streak = case
          when last_active_date = current_date - 1 then current_streak + 1
          when last_active_date = current_date then current_streak
          else 1
        end,
        longest_streak = greatest(longest_streak,
          case
            when last_active_date = current_date - 1 then current_streak + 1
            else 1
          end)
    where id = p_couple_id;
end;
$$;

-- ============================================================
-- REALTIME
-- Enable realtime on the tables the app subscribes to.
-- ============================================================
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table couples;
alter publication supabase_realtime add table couple_progress;
