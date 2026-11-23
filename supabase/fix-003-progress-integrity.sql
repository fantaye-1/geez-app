-- ============================================================
-- 003 — Progress table integrity
--
-- Run this ONCE in the Supabase SQL editor if your project was set up
-- with an older copy of setup.sql (safe to run again). New projects
-- already get this from setup.sql.
--
-- Row-level security stops learners touching other people's rows, but
-- anyone signed in can still write any value into their OWN rows from
-- the browser console. These checks keep the data in the shapes the app
-- understands, and updated_at now comes from the database clock instead
-- of the learner's device.
-- ============================================================

-- Rows that would break the new checks. Expect none; fix or delete any
-- that show up before running the rest.
select id, user_id, content_type, content_id, status, srs_ease, srs_interval_days
from public.progress
where content_type not in ('script', 'vocabulary', 'grammar', 'reading')
   or status not in ('learning', 'mastered')
   or char_length(content_id) not between 1 and 64
   or srs_ease is null or srs_ease not between 1 and 5
   or srs_interval_days is null or srs_interval_days not between 1 and 3650
   or srs_due_date is null;

-- Fill the SRS defaults on any row that was saved without them.
update public.progress set srs_ease = 2.5 where srs_ease is null;
update public.progress set srs_interval_days = 1 where srs_interval_days is null;
update public.progress set srs_due_date = current_date where srs_due_date is null;

alter table public.progress
  alter column srs_ease set not null,
  alter column srs_interval_days set not null,
  alter column srs_due_date set not null;

alter table public.progress drop constraint if exists progress_content_type_check;
alter table public.progress add constraint progress_content_type_check
  check (content_type in ('script', 'vocabulary', 'grammar', 'reading'));

alter table public.progress drop constraint if exists progress_status_check;
alter table public.progress add constraint progress_status_check
  check (status in ('learning', 'mastered'));

alter table public.progress drop constraint if exists progress_content_id_check;
alter table public.progress add constraint progress_content_id_check
  check (char_length(content_id) between 1 and 64);

-- The app keeps ease in 1.3–2.8 and intervals in 1–180 days; the
-- database allows some headroom so tuning the algorithm needs no migration.
alter table public.progress drop constraint if exists progress_srs_ease_check;
alter table public.progress add constraint progress_srs_ease_check
  check (srs_ease between 1 and 5);

alter table public.progress drop constraint if exists progress_srs_interval_check;
alter table public.progress add constraint progress_srs_interval_check
  check (srs_interval_days between 1 and 3650);

-- updated_at is always the server's time.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists progress_set_updated_at on public.progress;
create trigger progress_set_updated_at
  before insert or update on public.progress
  for each row execute procedure public.set_updated_at();
