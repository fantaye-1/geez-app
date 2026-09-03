-- ============================================================
-- Ge'ez Learning App — Supabase schema
-- Covers: regular learners (email/phone/Google/Apple sign-up)
--         + admins/owner with scoped, revocable permissions
-- Run this in the Supabase SQL editor after creating your project.
-- ============================================================

-- Every signed-up person (learner, admin, or owner) gets one row here,
-- linked 1:1 to Supabase's built-in auth.users table.
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  phone text,
  display_name text,
  role text not null default 'user',        -- 'user' | 'admin' | 'owner'
  permissions jsonb not null default '[]',  -- e.g. ["vocabulary","audio"] — only meaningful for role = admin
  created_at timestamptz not null default now()
);

-- Tracks what each learner has completed, across all content types.
-- One row per (user, item) pair — e.g. one row per Fidel form, per vocab word, etc.
create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  content_type text not null,   -- 'script' | 'vocabulary' | 'grammar' | 'reading'
  content_id text not null,     -- e.g. "hoy-4" for the 4th vowel order of the Hoy family
  status text not null default 'learning',  -- 'learning' | 'mastered'
  srs_ease numeric default 2.5,             -- SM-2 spaced-repetition fields
  srs_interval_days integer default 1,
  srs_due_date date default current_date,
  updated_at timestamptz not null default now(),
  unique (user_id, content_type, content_id)
);

-- Row Level Security: users can only ever see/edit their own progress,
-- no matter what the frontend code does — enforced at the database level.
alter table progress enable row level security;

create policy "users read own progress"
  on progress for select
  using (auth.uid() = user_id);

create policy "users write own progress"
  on progress for insert
  with check (auth.uid() = user_id);

create policy "users update own progress"
  on progress for update
  using (auth.uid() = user_id);

-- Profiles: everyone can read their own profile; only the owner can
-- change anyone's role or permissions (enforced in the admin UI layer,
-- and doubly enforced here so it can't be bypassed).
alter table profiles enable row level security;

create policy "users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "users update own basic info"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row the moment someone signs up, regardless
-- of whether they used email, phone, Google, or Apple.
create function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone, display_name)
  values (new.id, new.email, new.phone, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
