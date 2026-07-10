-- Run this once in your Supabase SQL Editor to fix a bug in the original
-- schema.sql: the policy that lets a partner join a room via invite code
-- would reject its own update after succeeding, because Postgres re-checks
-- the policy's USING condition against the NEW row by default when no
-- explicit WITH CHECK is given — and after joining, status is no longer
-- 'pending'. This replaces it with a correct WITH CHECK clause.

drop policy if exists "A joining user can set themselves as player_b" on couples;

create policy "A joining user can set themselves as player_b"
  on couples for update
  using (status = 'pending' and player_b is null)
  with check (auth.uid() = player_b);
