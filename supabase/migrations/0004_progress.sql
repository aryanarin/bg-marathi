-- 0004_progress.sql
-- Per-user reading and memorization progress, and the reading-session log.

-- ---------------------------------------------------------------------------
-- verse_progress: one row per (user, verse). The unique constraint is what
-- prevents duplicate progress records -- writes upsert on it.
-- ---------------------------------------------------------------------------
create table public.verse_progress (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  verse_id           uuid not null references public.verses (id) on delete cascade,
  is_read            boolean not null default false,
  is_memorized       boolean not null default false,
  read_at            timestamptz,
  memorized_at       timestamptz,
  total_time_seconds integer not null default 0 check (total_time_seconds >= 0),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (user_id, verse_id)
);

create index verse_progress_user_id_idx on public.verse_progress (user_id);
create index verse_progress_verse_id_idx on public.verse_progress (verse_id);

create trigger verse_progress_set_updated_at
  before update on public.verse_progress
  for each row execute function public.set_updated_at();

alter table public.verse_progress enable row level security;

-- ---------------------------------------------------------------------------
-- reading_sessions: append-only log of study sessions.
--
-- The duration bounds mirror MIN/MAX_SESSION_SECONDS in the app (5s..1800s).
-- Enforcing them here too means a bug in a Server Action, or a direct API call,
-- still cannot record an implausible session (e.g. a tab left open overnight).
-- ---------------------------------------------------------------------------
create table public.reading_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  verse_id         uuid not null references public.verses (id) on delete cascade,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  duration_seconds integer not null check (duration_seconds between 5 and 1800),
  created_at       timestamptz not null default now()
);

create index reading_sessions_user_id_started_at_idx
  on public.reading_sessions (user_id, started_at desc);

alter table public.reading_sessions enable row level security;
