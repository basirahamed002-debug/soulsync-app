-- Seeds the `cards` table with 300 questions.
-- Run this AFTER schema.sql, once, in the Supabase SQL Editor.
-- Questions gradually deepen: cards 1-100 are lighter, 101-200 go deeper,
-- 201-300 are the most vulnerable/future-facing. Gold special cards are
-- sprinkled in roughly every 12th card.

do $$
declare
  love_qs text[] := array[
    'What memory of us makes you smile every time?',
    'When did you first realize you loved me?',
    'What''s your favorite thing I do without realizing it?',
    'If you could relive one date with me, which would it be?',
    'What song reminds you of us?',
    'What''s the smallest thing I''ve done that meant the most to you?',
    'When do you feel most loved by me?',
    'What''s a moment you wish you could freeze in time with me?',
    'What do you love most about how we communicate?',
    'What made you fall for me, beyond looks?',
    'What''s your favorite photo of us and why?',
    'When did you know I was "the one" to try long distance for?',
    'What''s a quality of mine that surprised you the more you knew me?',
    'What do you miss most about me on hard days?',
    'What''s something I say often that you secretly love?',
    'What do you think our friends would say makes us work?',
    'What''s the most romantic thing I''ve ever done for you?',
    'How has loving me changed you?',
    'What do you look forward to most about our next visit?',
    'What''s one thing you never get tired of hearing from me?'
  ];
  deep_qs text[] := array[
    'What''s a fear you''ve never told anyone?',
    'What part of yourself are you still learning to accept?',
    'What does "home" mean to you?',
    'What''s something you needed growing up that you didn''t get?',
    'What would you want to change about how you handle conflict?',
    'What''s a belief you held for years and later let go of?',
    'When do you feel most misunderstood?',
    'What''s something you''re proud of that you rarely talk about?',
    'What does it mean to you to feel truly safe with someone?',
    'What''s a wound from your past that still shows up in our relationship?',
    'What do you need from me when you''re struggling, even if you don''t ask?',
    'What''s something you''ve never forgiven yourself for?',
    'What does love look like when the excitement fades?',
    'What''s a hard truth about yourself you''ve come to accept?',
    'What do you think is your biggest emotional blind spot?',
    'What''s something about your family you hope we do differently?',
    'What makes you feel small, and why?',
    'What''s a risk you''re scared to take, in life or in us?',
    'What do you think I don''t fully understand about you yet?',
    'What would you want to say to your younger self about love?'
  ];
  fantasy_qs text[] := array[
    'If we could teleport anywhere for one night, where would we go?',
    'Describe our dream house in another life.',
    'If we swapped lives for a day, what''s the first thing you''d do?',
    'What superpower would make long distance easier?',
    'If we opened a business together, what would it be?',
    'What would our theme song be if our love story were a movie?',
    'If you could give us one shared "magic power" as a couple, what would it be?',
    'What would our dream retirement look like?',
    'If we could live in any era of history together, which would you pick?',
    'What would our pet, if we had one, be named and act like?',
    'If we had unlimited money for one trip, where are we going?',
    'What fictional couple do we remind you of, and why?',
    'If we co-wrote a book about us, what would the title be?',
    'What would our wedding look like if money were no object?',
    'If you could design our future home office/studio, what''s in it?'
  ];
  funny_qs text[] := array[
    'What''s the weirdest thing you find attractive about me?',
    'If I were a snack, which one and why?',
    'What''s your most embarrassing autocorrect fail texting me?',
    'Act out how you''d react if I showed up at your door right now.',
    'What''s the pettiest thing you''ve ever been annoyed at me for?',
    'What''s a nickname for me that would never catch on but is funny anyway?',
    'What''s the most ridiculous thing you''ve done to get my attention?',
    'If our relationship were a sitcom, what would the theme song be?',
    'What''s your impression of me when I''m sleepy?',
    'What weird food combo do you secretly love that I''d judge you for?',
    'What''s the most chaotic thing that''s happened on one of our calls?',
    'If I had a warning label, what would it say?',
    'What''s a silly argument we''ve had that makes you laugh now?',
    'What would your "villain origin story" be if I annoyed you enough?',
    'What''s the weirdest dream you''ve had about me?'
  ];
  gold_qs text[] := array[
    'Compliment your partner for 60 seconds — voice only.',
    'Draw each other from memory and send it.',
    'Send a selfie of exactly how you look right now.',
    'Sing 10 seconds of a song that reminds you of them.',
    'Describe your first impression of them, honestly.',
    'Send a voice note saying your favorite thing about them today.',
    'Share your happiest memory together as a voice recording.',
    'Tell your biggest dream for the two of you, out loud.',
    'Send a photo of your current view, right now.',
    'Record yourself describing your perfect day with them.',
    'Tell them, on voice, one thing you''re grateful for about them this week.',
    'Send a childhood photo and one line about the kid in it.',
    'Describe, out loud, what you pictured your future looking like before you met them.',
    'Send a voice note reading them a compliment like a love letter.',
    'Record a 20-second "why I chose you" message.'
  ];
  cat_names text[] := array['love','deep','fantasy','funny'];
  q_arrays text[][] := array[love_qs, deep_qs, fantasy_qs, funny_qs];
  idx_per_cat int[] := array[0,0,0,0];
  stage love_stage;
  cat_i int;
  chosen_cat text;
  chosen_q text;
  arr text[];
  i int;
begin
  for i in 1..300 loop
    stage := case
      when i <= 60 then 'stranger'::love_stage
      when i <= 130 then 'friends'::love_stage
      when i <= 200 then 'close_hearts'::love_stage
      when i <= 250 then 'soulmates'::love_stage
      when i <= 285 then 'forever'::love_stage
      else 'eternal_love'::love_stage
    end;

    if i % 12 = 0 then
      -- Gold special card
      chosen_q := gold_qs[((i / 12) - 1) % array_length(gold_qs, 1) + 1];
      insert into cards (id, category, question, is_gold, order_index, min_love_stage)
      values (i, 'gold', chosen_q, true, i, stage);
    else
      cat_i := (i % 4) + 1; -- cycles love/deep/fantasy/funny
      chosen_cat := cat_names[cat_i];
      arr := q_arrays[cat_i];
      idx_per_cat[cat_i] := idx_per_cat[cat_i] + 1;
      chosen_q := arr[((idx_per_cat[cat_i] - 1) % array_length(arr, 1)) + 1];
      insert into cards (id, category, question, is_gold, order_index, min_love_stage)
      values (i, chosen_cat::category, chosen_q, false, i, stage);
    end if;
  end loop;
end $$;

-- Sanity check: should return 300
-- select count(*) from cards;
