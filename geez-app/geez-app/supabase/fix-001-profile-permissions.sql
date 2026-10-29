-- ============================================================
-- Fix 001 — stop learners from changing their own role/permissions
--
-- Run this ONCE in the Supabase SQL editor if your project was set up
-- with an older copy of setup.sql. New projects already get this from
-- setup.sql and don't need it. Safe to run more than once.
-- ============================================================

-- Only let users update their own row, and keep it their own row.
drop policy if exists "users update own basic info" on profiles;
create policy "users update own basic info"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Only display_name and phone are editable from the browser.
revoke update on profiles from anon, authenticated;
grant update (display_name, phone) on profiles to authenticated;

-- Pin search_path on the security-definer signup trigger.
alter function public.handle_new_user() set search_path = '';

-- Check: if anyone already promoted themselves, they show up here.
select id, email, role, permissions
from profiles
where role <> 'user' or permissions <> '[]'::jsonb;
