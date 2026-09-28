-- 0006_quizzes.sql
-- Quizzes, questions, attempts and answers.

create table public.quizzes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  chapter_id   uuid references public.chapters (id) on delete set null,
  verse_start  integer,
  verse_end    integer,
  is_published boolean not null default false,
  created_by   uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  check (verse_end is null or verse_start is null or verse_end >= verse_start)
);

create index quizzes_published_created_at_idx
  on public.quizzes (created_at desc) where is_published;

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

alter table public.quizzes enable row level security;

-- ---------------------------------------------------------------------------
-- quiz_questions
--
-- correct_option and explanation are protected by column-level SELECT grants in
-- 0007, not by RLS -- RLS cannot hide a column. Learner accounts simply cannot
-- read those two columns, so the answer key never reaches the browser before
-- submission. Scoring is done server-side by submit_quiz_attempt() in 0008.
-- ---------------------------------------------------------------------------
create table public.quiz_questions (
  id             uuid primary key default gen_random_uuid(),
  quiz_id        uuid not null references public.quizzes (id) on delete cascade,
  question       text not null,
  option_a       text not null,
  option_b       text not null,
  option_c       text not null,
  option_d       text not null,
  correct_option text not null check (correct_option in ('a', 'b', 'c', 'd')),
  explanation    text,
  display_order  integer not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index quiz_questions_quiz_id_display_order_idx
  on public.quiz_questions (quiz_id, display_order);

create trigger quiz_questions_set_updated_at
  before update on public.quiz_questions
  for each row execute function public.set_updated_at();

alter table public.quiz_questions enable row level security;

-- ---------------------------------------------------------------------------
-- quiz_attempts
--
-- completed_at null means "in progress". The RLS update policy in 0007 uses
-- that to make a submitted attempt immutable. No unique (quiz_id, user_id):
-- retaking a quiz is allowed and creates a new attempt.
-- ---------------------------------------------------------------------------
create table public.quiz_attempts (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references public.quizzes (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  score           integer not null default 0 check (score >= 0),
  total_questions integer not null check (total_questions > 0),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index quiz_attempts_user_id_idx on public.quiz_attempts (user_id);
create index quiz_attempts_quiz_id_idx on public.quiz_attempts (quiz_id);

alter table public.quiz_attempts enable row level security;

-- ---------------------------------------------------------------------------
-- quiz_answers: one row per question per attempt.
--
-- is_correct is computed server-side by submit_quiz_attempt(), never supplied
-- by the client. selected_option is nullable so a skipped question is recorded
-- as answered-but-blank rather than missing.
-- ---------------------------------------------------------------------------
create table public.quiz_answers (
  id              uuid primary key default gen_random_uuid(),
  attempt_id      uuid not null references public.quiz_attempts (id) on delete cascade,
  question_id     uuid not null references public.quiz_questions (id) on delete cascade,
  selected_option text check (selected_option in ('a', 'b', 'c', 'd')),
  is_correct      boolean not null default false,

  unique (attempt_id, question_id)
);

create index quiz_answers_attempt_id_idx on public.quiz_answers (attempt_id);

alter table public.quiz_answers enable row level security;
