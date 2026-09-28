-- 0005_classes.sql
-- Scheduled online classes. The admin enters a meeting URL; there is no Meet or
-- Zoom API integration.

create table public.classes (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text,
  class_date       date not null,
  class_time       time not null,
  meeting_platform text not null check (meeting_platform in ('google_meet', 'zoom', 'other')),
  -- Coarse backstop. Real validation is meetingUrlSchema in the app, which also
  -- rejects embedded credentials and dot-less hosts. Both exist because this
  -- value becomes an anchor a learner clicks.
  meeting_url      text not null check (meeting_url like 'https://%'),
  is_published     boolean not null default false,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.classes.created_by is
  'set null on delete: removing an admin account must not delete the class schedule.';

-- Partial index: learners only ever query upcoming published classes.
create index classes_published_date_idx
  on public.classes (class_date, class_time) where is_published;

create trigger classes_set_updated_at
  before update on public.classes
  for each row execute function public.set_updated_at();

alter table public.classes enable row level security;
