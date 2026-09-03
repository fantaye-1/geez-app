# Ge'ez learning app — starter project

This is step 1 of the build roadmap: a working Next.js + TypeScript + Supabase project skeleton.

## Setup (run these on your own machine)

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create your Supabase project**
   - Go to https://supabase.com, create a new project
   - In the SQL editor, run the schema from `supabase/setup.sql` (included in this project)
   - Go to Settings -> API and copy your Project URL and anon public key

3. **Set up environment variables**
   ```
   cp .env.example .env.local
   ```
   Then paste your Supabase URL and anon key into `.env.local`

4. **Run the dev server**
   ```
   npm run dev
   ```
   Open http://localhost:3000 — it should say "Supabase connected. Ready to build."

5. **Push to GitHub**
   ```
   git init
   git add .
   git commit -m "Initial project setup"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

6. **Deploy to Vercel** (once you're ready)
   - Import the GitHub repo at https://vercel.com/new
   - Add the same two environment variables from `.env.local` in Vercel's project settings
   - Deploy — then point your existing domain at it in Vercel's Domains tab

## What's next
Once this is running and connected, the next step is converting the Fidel trainer prototype into `app/learn/script/page.tsx` using this same project structure.
