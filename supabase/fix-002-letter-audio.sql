-- ============================================================
-- 002 — Letter audio
--
-- Run this ONCE in the Supabase SQL editor (safe to run again).
-- Creates a public "letter-audio" storage bucket. Anyone can listen;
-- only the owner, or an admin with the "audio" permission, can record
-- or replace a recording.
-- ============================================================

-- Who may manage audio. security definer so it can read profiles
-- regardless of the caller's RLS; search_path pinned for safety.
create or replace function public.can_manage_audio()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'owner'
           or (p.role = 'admin' and p.permissions ? 'audio'))
  );
$$;

grant execute on function public.can_manage_audio() to authenticated;

-- Public bucket: files are served by URL without signing in.
-- 1 MB per file is plenty for a one-second recording.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('letter-audio', 'letter-audio', true, 1048576,
        array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone can list letter audio" on storage.objects;
create policy "anyone can list letter audio"
  on storage.objects for select
  using (bucket_id = 'letter-audio');

drop policy if exists "audio managers upload letter audio" on storage.objects;
create policy "audio managers upload letter audio"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'letter-audio' and public.can_manage_audio());

drop policy if exists "audio managers replace letter audio" on storage.objects;
create policy "audio managers replace letter audio"
  on storage.objects for update to authenticated
  using (bucket_id = 'letter-audio' and public.can_manage_audio())
  with check (bucket_id = 'letter-audio' and public.can_manage_audio());

drop policy if exists "audio managers delete letter audio" on storage.objects;
create policy "audio managers delete letter audio"
  on storage.objects for delete to authenticated
  using (bucket_id = 'letter-audio' and public.can_manage_audio());

-- Make yourself the owner (once), replacing the email with yours:
--   update public.profiles set role = 'owner' where email = 'you@example.com';
