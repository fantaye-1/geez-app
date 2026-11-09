# ግዕዝ Learn Ge'ez

A free, open platform for learning **Ge'ez**, the classical language of Ethiopia and Eritrea and the liturgical language of the Ethiopian and Eritrean Orthodox Churches. It teaches through interactive script, vocabulary, grammar and reading lessons.

Built with Next.js, TypeScript, Tailwind CSS and Supabase.

## What you can do today

- **Fidel chart** (`/learn/script`): all 26 classical letter families in their seven vowel forms (182 letters). Tap any letter to see its sound, family and vowel order.
- **Fidel practice** (`/learn/script/practice`): 10-question rounds, from letter → sound or sound → letter. Wrong choices include a look-alike family (ሀ/ሐ/ኀ, ሰ/ሠ, አ/ዐ…), so you have to read the vowel mark.
- **Sign in by email**: one-click magic link, no password.
- **Letter audio**: tap **Hear it** on the chart. The owner (and admins with the `audio` permission) can record any letter right in the chart with the microphone: record, listen back, save.
- **Saved progress with spaced repetition**: every answer is saved. Letters you miss come back tomorrow, and letters you know come back after 3 days, ~8 days, ~3 weeks and so on. A letter counts as *mastered* after three on-time correct reviews. **Review due letters** quizzes only what's due today, and the chart marks mastered letters with a gold dot.

Everything except saving progress works without an account.

## Roadmap

- [x] Fidel chart
- [x] Fidel practice quiz
- [x] Email sign-in
- [x] Saved progress and spaced repetition
- [x] Letter audio (record in the app)
- [ ] Record all 182 letters
- [ ] Google sign-in
- [ ] Vocabulary (ቃል): core words from prayer, scripture and everyday use
- [ ] Grammar (ሰዋስው)
- [ ] Reading (ንባብ): short classical texts, line by line
- [ ] Admin tools for adding lessons (owner/admin roles are already in the schema)

## Tech stack

| | |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router), React 18, TypeScript |
| Styling | Tailwind CSS; Fraunces, Literata, IBM Plex Mono and Noto Sans Ethiopic |
| Backend | [Supabase](https://supabase.com): Postgres, Auth, row-level security |
| Hosting | Vercel |

## Getting started

**Requirements:** Node.js 18+ and a free Supabase project.

1. **Install**
   ```bash
   git clone https://github.com/fantaye-1/geez-app.git
   cd geez-app
   npm install
   ```

2. **Set up Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In the **SQL editor**, run [`supabase/setup.sql`](supabase/setup.sql). It creates the `profiles` and `progress` tables, their row-level security policies, and the trigger that creates a profile on sign-up.
   - Already ran an older copy of `setup.sql`? Also run [`supabase/fix-001-profile-permissions.sql`](supabase/fix-001-profile-permissions.sql) once.
   - For letter audio, run [`supabase/fix-002-letter-audio.sql`](supabase/fix-002-letter-audio.sql). To record, make yourself owner once in the SQL editor: `update profiles set role = 'owner' where email = 'you@example.com';`
   - Under **Authentication → URL Configuration**, add `http://localhost:3000` (and your live URL) to **Redirect URLs**, so the sign-in link brings you back to the app.

3. **Add your keys**
   ```bash
   cp .env.example .env.local
   ```
   Paste your **Project URL** and **anon public key** from Supabase → Project Settings → API. `.env.local` is git-ignored. Never put the `service_role` key in a `NEXT_PUBLIC_` variable.

4. **Run it**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Without Supabase keys the lessons still work, but sign-in is hidden.

| Command | |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |

### Deploying

Import the repo at [vercel.com/new](https://vercel.com/new), add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the project settings, and deploy. Then add the deployed URL to Supabase's Redirect URLs.

## Project structure

```
app/
  page.tsx                     Home page
  login/page.tsx               Email sign-in
  learn/script/page.tsx        Fidel chart
  learn/script/practice/       Practice quiz
components/SiteHeader.tsx      Header with sign-in / sign-out
components/LetterRecorder.tsx  Record / listen back / save a letter
lib/
  fidel.ts                     The 26 families × 7 orders, generated from Unicode
  fidelQuiz.ts                 Builds quiz rounds and wrong-answer choices
  srs.ts                       Spaced-repetition schedule (simplified SM-2)
  progress.ts                  Loads and saves progress in Supabase
  letterAudio.ts               Lists, plays and uploads letter recordings
  useUser.ts                   Current-user hook
  supabaseClient.ts            Supabase client (null when not configured)
supabase/
  setup.sql                    Database schema and security policies
  fix-001-*.sql                One-time patch for older setups
  fix-002-letter-audio.sql     Audio storage bucket and who may record
```

## How it works

- **Letters are generated, not typed.** In Unicode, each Ge'ez family takes 8 consecutive code points, and the 7 vowel orders are the first 7 of them. `lib/fidel.ts` builds all 182 letters from 26 starting points, and every one was checked against its official Unicode name.
- **Progress rows** are stored as `content_type = 'script'`, `content_id = 'hoy-4'` (family + vowel order), so future lessons can share the same table.
- **Security:** row-level security limits every learner to their own progress. Learners can edit only their display name and phone, never their role or permissions.

## Author

Built by [Abrham Fantaye](https://github.com/fantaye-1). Suggestions and corrections, especially from Ge'ez teachers and readers, are welcome through [issues](https://github.com/fantaye-1/geez-app/issues).
