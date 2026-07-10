import type { Category } from '@/types'

// This is a starter set. The real, authoritative question bank lives in
// supabase/seed.sql (300 rows) and is queried live from the `cards` table.
// Keep this file only as an offline fallback / preview.
export const SAMPLE_QUESTIONS: Record<Category, string[]> = {
  love: [
    'What memory of us makes you smile every time?',
    'When did you first realize you loved me?',
    "What's your favorite thing I do without realizing it?",
    'If you could relive one date with me, which would it be?',
    'What song reminds you of us?'
  ],
  deep: [
    "What's a fear you've never told anyone?",
    "What part of yourself are you still learning to accept?",
    "What does 'home' mean to you?",
    "What's something you needed growing up that you didn't get?",
    'What would you want to change about how you handle conflict?'
  ],
  fantasy: [
    'If we could teleport anywhere for one night, where would we go?',
    'Describe our dream house in another life.',
    "If we swapped lives for a day, what's the first thing you'd do?",
    'What superpower would make long distance easier?'
  ],
  funny: [
    "What's the weirdest thing you find attractive about me?",
    "If I were a snack, which one and why?",
    "What's your most embarrassing autocorrect fail texting me?",
    "Act out how you'd react if I showed up at your door right now."
  ],
  gold: [
    'Compliment your partner for 60 seconds — voice only.',
    'Draw each other from memory and send it.',
    'Send a selfie of exactly how you look right now.',
    'Sing 10 seconds of a song that reminds you of them.',
    'Describe your first impression of them, honestly.'
  ]
}
