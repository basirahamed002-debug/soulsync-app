# SoulSync

A relationship game for long-distance couples. React + TypeScript + Tailwind + Supabase.

This is a **real, working starting codebase** — auth, pairing, realtime card sync, and the
answer/reveal flow are wired to an actual Postgres database via Supabase, not mocked. It is not
the full 100+ feature spec (see "What's not built yet" below) — it's the solid core to build the
rest on top of.

---

## 1. Set up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) → sign up → **New Project**. Pick a region close to
   your users, set a database password, wait for it to finish provisioning.
2. Open **SQL Editor** in the left sidebar → **New query**.
3. Paste the entire contents of `supabase/schema.sql` → **Run**. This creates all tables, security
   rules, and the `award_card_completion` function.
4. New query again → paste `supabase/seed.sql` → **Run**. This populates the 300-card board.
5. Go to **Project Settings → API**. Copy the **Project URL** and the **anon public** key.
6. (Optional, for Google login) Go to **Authentication → Providers → Google**, follow Supabase's
   instructions to add your Google OAuth client ID/secret, and add your site URL under
   **Authentication → URL Configuration → Redirect URLs** (e.g. `http://localhost:5173/**` while
   developing, plus your real domain once deployed).

## 2. Run it locally

Requires [Node.js](https://nodejs.org) 18+.

```bash
cd soulsync-app
npm install
cp .env.example .env
```

Open `.env` and paste in your Supabase URL + anon key from step 1.5 above:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then:

```bash
npm run dev
```

Open the printed `localhost` URL. Sign up with two different email addresses in two browser
windows (or one normal + one incognito) to test pairing as both partners.

## 3. Deploy it for real

1. Push this folder to a new GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import that repo.
3. Vercel auto-detects Vite. Before deploying, add your environment variables under
   **Settings → Environment Variables**: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same
   values as your `.env`).
4. Deploy. You'll get a live `https://your-app.vercel.app` URL.
5. Go back to Supabase → **Authentication → URL Configuration** and add your real Vercel URL to
   the allowed redirect URLs, or Google login will fail in production.

That's a real, live, shareable app at that point — two people can sign up, pair with a code, and
play the board together in real time from anywhere.

---

## What's built

- Email + Google auth (Supabase Auth)
- Profile creation
- Couple pairing via invite code, with realtime "partner joined" detection
- 300-card mystery board, seeded from `supabase/seed.sql`, categorized (Love/Deep/Fantasy/Funny/Gold)
- Question flow: private answer submission → realtime detection when partner answers →
  simultaneous reveal, enforced by Postgres row-level security (you cannot even query your
  partner's answer via the API until you've submitted your own)
- XP, coins, and streak tracking via an atomic Postgres function (`award_card_completion`) so two
  clients submitting at once can't double-award or corrupt the streak count
- Love Journey stage progression UI
- Memory Book (auto-populated from completed cards)
- Mobile-first PWA shell (manifest.json included)

## What's not built yet (from your original spec)

This was a large spec — here's what still needs work, roughly in the order I'd tackle it:

- **Voice recording** — the UI toggle exists in `CardModal.tsx` but actual recording
  (MediaRecorder API) + upload to Supabase Storage + waveform playback isn't wired up yet.
- **Photo answers** — same story, needs Supabase Storage bucket + upload flow.
- **Video Date Mode**, **Spin Wheel**, **Daily/Weekly Challenges**, **Achievements**, **Love
  Calendar**, **Customization/Themes**, **background music**, **emoji reactions on reveal**,
  **notifications** (would need a push service like OneSignal or web push + a Supabase Edge
  Function/cron).
- **AI features** (weekly summaries, date ideas, monthly love letter) — would call the Claude API
  from a Supabase Edge Function, triggered on a schedule.
- **Admin panel** — a separate protected route/app for managing questions, users, and reports.
- **Monetization** — free/premium gating, payments (Stripe is the standard pairing with Vercel +
  Supabase).
- **Question bank depth** — `seed.sql` currently cycles ~90 handcrafted questions across 300 slots
  in escalating difficulty tiers, so some repeat. Your spec asked for 500+ unique, never-repeating
  questions — worth expanding the arrays in `seed.sql` before a real launch, or building the admin
  panel first and adding them there.

## Recommended next step

Open this folder in **Claude Code** (desktop app) to keep building — it can run `npm run dev` live,
catch and fix errors as you go, and help you tackle the remaining features from the list above one
at a time.
