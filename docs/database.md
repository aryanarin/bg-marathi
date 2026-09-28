# Database

Supabase Postgres. This document is the schema and Row Level Security plan for
Phase 2, written before the SQL so the security model can be reviewed on its
own.

Everything here is enforced **in the database**. The application's server-side
guards are a second layer, not the only one.

## Conventions

- Primary keys are `uuid` with `default gen_random_uuid()`.
- Timestamps are `timestamptz`, never naive `timestamp`.
- `created_at`/`updated_at` default to `now()`; `updated_at` is maintained by a
  trigger rather than trusted from the client.
- Foreign keys always declare `on delete` behaviour explicitly.
- Text content is stored as `text`, never `varchar(n)`. Length limits belong in
  Zod, where they can produce a decent error message.
- Migrations live in `supabase/migrations/` and are named
  `NNNN_description.sql`. They are applied in filename order and are never
  edited once applied.

## Migration order

Order matters because of dependencies:

| File                              | Contents                                  |
| --------------------------------- | ----------------------------------------- |
| `0001_extensions_and_helpers.sql` | Extensions, `set_updated_at()`, `is_admin()` |
| `0002_profiles.sql`               | `profiles` + signup trigger               |
| `0003_content.sql`                | `chapters`, `verses`                      |
| `0004_progress.sql`               | `verse_progress`, `reading_sessions`      |
| `0005_classes.sql`                | `classes`                                 |
| `0006_quizzes.sql`                | `quizzes`, `quiz_questions`, `quiz_attempts`, `quiz_answers` |
| `0007_rls_policies.sql`           | All RLS policies and column grants        |
| `0008_functions.sql`              | `submit_quiz_attempt()`, progress helpers |

RLS is enabled per table in the table's own migration, so a table is never
readable before its policies exist. Policies themselves are grouped in `0007`
so the whole access model can be read in one file.

## Tables

### profiles

Mirrors `auth.users` with application-level fields. Supabase owns `auth.users`;
we never write to it directly.

| Column       | Type        | Notes                                      |
| ------------ | ----------- | ------------------------------------------ |
| `id`         | uuid PK     | FK → `auth.users(id)` `on delete cascade`  |
| `email`      | text        | not null                                   |
| `full_name`  | text        | nullable                                   |
| `avatar_url` | text        | nullable                                   |
| `role`       | text        | not null, default `'user'`, check in (`user`,`admin`) |
| `created_at` | timestamptz | default `now()`                            |
| `updated_at` | timestamptz | default `now()`, trigger-maintained        |

`role` is `text` with a check constraint rather than a Postgres `enum`, because
adding a value to an enum in a migration is awkward and the set is unlikely to
grow beyond two.

A row is created automatically by an `after insert on auth.users` trigger, so a
signed-up user always has a profile. The trigger hard-codes `role = 'user'`: a
new account can never be created as an administrator.

### chapters

| Column          | Type        | Notes                        |
| --------------- | ----------- | ---------------------------- |
| `id`            | uuid PK     |                              |
| `chapter_number`| integer     | not null, **unique**, check 1–18 |
| `name_sanskrit` | text        | not null                     |
| `name_marathi`  | text        | not null                     |
| `description`   | text        | nullable                     |
| `total_verses`  | integer     | not null, check > 0          |
| `display_order` | integer     | not null                     |
| `created_at`    | timestamptz |                              |
| `updated_at`    | timestamptz |                              |

`total_verses` is stored and administrator-editable rather than derived from a
count of `verses`, for two reasons. It records how many verses the chapter
*should* have, which lets progress read "12 of 47" correctly while only 12 have
been imported. And editions disagree on verse counts (chapter 13 is 34 or 35
depending on the edition), so this must not be a hard-coded constant.

### verses

| Column             | Type        | Notes                                   |
| ------------------ | ----------- | --------------------------------------- |
| `id`               | uuid PK     |                                         |
| `chapter_id`       | uuid        | not null, FK → `chapters(id)` `on delete cascade` |
| `verse_number`     | integer     | not null, check > 0                     |
| `sanskrit_text`    | text        | not null                                |
| `word_to_word`     | text        | nullable                                |
| `translation`      | text        | nullable                                |
| `purport`          | text        | nullable                                |
| `easy_explanation` | text        | nullable — **administrator-authored**   |
| `example`          | text        | nullable — **administrator-authored**   |
| `audio_url`        | text        | nullable                                |
| `audio_provider`   | text        | nullable, check in (`supabase_storage`,`google_drive`,`external`) |
| `display_order`    | integer     | not null                                |
| `created_at`       | timestamptz |                                         |
| `updated_at`       | timestamptz |                                         |

**Unique:** `(chapter_id, verse_number)`.

`easy_explanation` and `example` are nullable because the administrator writes
them by hand, after import. The application never generates them.

The content columns are nullable so a verse can be imported in stages, but the
import script requires `word_to_word`, `translation` and `purport` to be present
in the JSON. Nullable here is about partial data entry, not optional content.

### verse_progress

One row per user per verse. The unique constraint is what prevents duplicate
progress records: writes use `insert ... on conflict (user_id, verse_id) do
update`, so marking a verse read twice updates one row instead of creating two.

| Column               | Type        | Notes                                    |
| -------------------- | ----------- | ---------------------------------------- |
| `id`                 | uuid PK     |                                          |
| `user_id`            | uuid        | not null, FK → `profiles(id)` `on delete cascade` |
| `verse_id`           | uuid        | not null, FK → `verses(id)` `on delete cascade` |
| `is_read`            | boolean     | not null, default `false`                |
| `is_memorized`       | boolean     | not null, default `false`                |
| `read_at`            | timestamptz | nullable                                 |
| `memorized_at`       | timestamptz | nullable                                 |
| `total_time_seconds` | integer     | not null, default 0, check >= 0          |
| `created_at`         | timestamptz |                                          |
| `updated_at`         | timestamptz |                                          |

**Unique:** `(user_id, verse_id)`.

### reading_sessions

An append-only log. Answers "when did they study", which the running total in
`verse_progress` cannot.

| Column             | Type        | Notes                                     |
| ------------------ | ----------- | ----------------------------------------- |
| `id`               | uuid PK     |                                           |
| `user_id`          | uuid        | not null, FK → `profiles(id)` `on delete cascade` |
| `verse_id`         | uuid        | not null, FK → `verses(id)` `on delete cascade` |
| `started_at`       | timestamptz | not null                                  |
| `ended_at`         | timestamptz | not null                                  |
| `duration_seconds` | integer     | not null, check between 5 and 1800        |

The `duration_seconds` check mirrors `MIN_SESSION_SECONDS` and
`MAX_SESSION_SECONDS` in the application. Duplicating the rule in the database
is deliberate: it means a bug in the Server Action, or a direct API call, still
cannot record an eight-hour "reading session".

No `updated_at`: sessions are immutable once written.

### classes

| Column             | Type        | Notes                                    |
| ------------------ | ----------- | ---------------------------------------- |
| `id`               | uuid PK     |                                          |
| `title`            | text        | not null                                 |
| `description`      | text        | nullable                                 |
| `class_date`       | date        | not null                                 |
| `class_time`       | time        | not null                                 |
| `meeting_platform` | text        | not null, check in (`google_meet`,`zoom`,`other`) |
| `meeting_url`      | text        | not null, check `meeting_url like 'https://%'` |
| `is_published`     | boolean     | not null, default `false`                |
| `created_by`       | uuid        | nullable, FK → `profiles(id)` `on delete set null` |
| `created_at`       | timestamptz |                                          |
| `updated_at`       | timestamptz |                                          |

The `https://` check is a coarse backstop. Real validation is
`meetingUrlSchema`, which also rejects embedded credentials and hostnames
without a dot. Both exist because this value ends up in an anchor a learner
clicks.

`created_by` is `on delete set null` rather than `cascade`: deleting an
administrator account must not delete the class schedule.

Date and time are separate columns rather than one `timestamptz` because the
administrator thinks in local wall-clock terms ("Sunday at 7:30pm") and the
group is in a single timezone. Storing an instant would invite conversion bugs
for no benefit here.

### quizzes

| Column         | Type        | Notes                                     |
| -------------- | ----------- | ----------------------------------------- |
| `id`           | uuid PK     |                                           |
| `title`        | text        | not null                                  |
| `description`  | text        | nullable                                  |
| `chapter_id`   | uuid        | nullable, FK → `chapters(id)` `on delete set null` |
| `verse_start`  | integer     | nullable                                  |
| `verse_end`    | integer     | nullable                                  |
| `is_published` | boolean     | not null, default `false`                 |
| `created_by`   | uuid        | nullable, FK → `profiles(id)` `on delete set null` |
| `created_at`   | timestamptz |                                           |
| `updated_at`   | timestamptz |                                           |

Check constraint: `verse_end >= verse_start` when both are present. Per the
requirements a quiz typically covers the 4–5 verses from one class.

### quiz_questions

| Column           | Type        | Notes                                    |
| ---------------- | ----------- | ---------------------------------------- |
| `id`             | uuid PK     |                                          |
| `quiz_id`        | uuid        | not null, FK → `quizzes(id)` `on delete cascade` |
| `question`       | text        | not null                                 |
| `option_a`       | text        | not null                                 |
| `option_b`       | text        | not null                                 |
| `option_c`       | text        | not null                                 |
| `option_d`       | text        | not null                                 |
| `correct_option` | text        | not null, check in (`a`,`b`,`c`,`d`)     |
| `explanation`    | text        | nullable                                 |
| `display_order`  | integer     | not null                                 |
| `created_at`     | timestamptz |                                          |
| `updated_at`     | timestamptz |                                          |

`correct_option` and `explanation` are protected by **column-level grants**, not
by RLS. See "Protecting the answer key" below.

### quiz_attempts

| Column            | Type        | Notes                                    |
| ----------------- | ----------- | ---------------------------------------- |
| `id`              | uuid PK     |                                          |
| `quiz_id`         | uuid        | not null, FK → `quizzes(id)` `on delete cascade` |
| `user_id`         | uuid        | not null, FK → `profiles(id)` `on delete cascade` |
| `score`           | integer     | not null, default 0, check >= 0          |
| `total_questions` | integer     | not null, check > 0                      |
| `started_at`      | timestamptz | not null, default `now()`                |
| `completed_at`    | timestamptz | nullable — null means in progress        |

`completed_at IS NULL` is the "in progress" marker, and the RLS update policy
uses it to make a finished attempt immutable.

Repeat attempts are allowed (no unique constraint on `(quiz_id, user_id)`): a
learner revising a chapter should be able to retake a quiz. The result page
shows the most recent attempt.

### quiz_answers

| Column            | Type        | Notes                                    |
| ----------------- | ----------- | ---------------------------------------- |
| `id`              | uuid PK     |                                          |
| `attempt_id`      | uuid        | not null, FK → `quiz_attempts(id)` `on delete cascade` |
| `question_id`     | uuid        | not null, FK → `quiz_questions(id)` `on delete cascade` |
| `selected_option` | text        | nullable, check in (`a`,`b`,`c`,`d`)     |
| `is_correct`      | boolean     | not null, default `false`                |

**Unique:** `(attempt_id, question_id)` — one answer per question per attempt.

`selected_option` is nullable so a skipped question is recorded as answered-but-
blank rather than missing, which keeps "unanswered" and "not reached"
distinguishable on the result page.

`is_correct` is computed server-side by `submit_quiz_attempt()` and never
supplied by the client.

## Indexes

Primary keys and unique constraints are indexed automatically. Additional
indexes, each justified by a query the application actually runs:

```sql
-- Verse list for a chapter, in order.
create index verses_chapter_id_display_order_idx
  on verses (chapter_id, display_order);

-- "My progress on this verse" — the verse page's hottest lookup.
-- Covered by the unique constraint on (user_id, verse_id).

-- Dashboard aggregates: counts and total time for one user.
create index verse_progress_user_id_idx on verse_progress (user_id);

-- Chapter-wise progress joins progress to verses.
create index verse_progress_verse_id_idx on verse_progress (verse_id);

-- "When did this user study" and admin activity views.
create index reading_sessions_user_id_started_at_idx
  on reading_sessions (user_id, started_at desc);

-- Upcoming published classes.
create index classes_published_date_idx
  on classes (class_date, class_time) where is_published;

-- Published quiz list.
create index quizzes_published_created_at_idx
  on quizzes (created_at desc) where is_published;

-- Questions for a quiz, in order.
create index quiz_questions_quiz_id_display_order_idx
  on quiz_questions (quiz_id, display_order);

-- A user's attempt history, and the admin results view.
create index quiz_attempts_user_id_idx on quiz_attempts (user_id);
create index quiz_attempts_quiz_id_idx on quiz_attempts (quiz_id);

-- Answers for one attempt.
create index quiz_answers_attempt_id_idx on quiz_answers (attempt_id);
```

The two partial indexes (`where is_published`) are small because unpublished
rows are excluded, and they match the only filter learners ever apply.

## Helper functions

### `set_updated_at()`

A trigger function setting `new.updated_at = now()`. Attached to every table
with an `updated_at` column, so the value cannot be back-dated by a client.

### `is_admin()`

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;
```

Three details that matter:

- **`security definer`** is required to avoid infinite recursion. A policy on
  `profiles` that checks "is the caller an admin" by selecting from `profiles`
  would re-trigger the same policy forever. A `security definer` function runs
  as its owner and bypasses RLS, breaking the cycle.
- **`set search_path`** is pinned. Without it, a caller could create a
  same-named table in a schema earlier in their `search_path` and change what
  this function reads — a well-known privilege-escalation route for
  `security definer` functions.
- **`stable`** lets Postgres call it once per statement instead of per row.

## Row Level Security

RLS is enabled on every table, including ones that look harmless:

```sql
alter table <name> enable row level security;
```

With RLS enabled and no matching policy, access is denied. The default is
therefore closed, and each policy below opens exactly one door.

### Reference matrix

| Table              | Learner read              | Learner write              | Admin |
| ------------------ | ------------------------- | -------------------------- | ----- |
| `profiles`         | own row                   | own row, **not `role`**    | all   |
| `chapters`         | all                       | none                       | all   |
| `verses`           | all                       | none                       | all   |
| `verse_progress`   | own rows                  | own rows                   | read all |
| `reading_sessions` | own rows                  | insert own only            | read all |
| `classes`          | published only            | none                       | all   |
| `quizzes`          | published only            | none                       | all   |
| `quiz_questions`   | published quizzes, **answer key column revoked** | none | all |
| `quiz_attempts`    | own rows                  | own, immutable once done   | read all |
| `quiz_answers`     | own rows                  | own, in-progress only      | read all |

### Preventing self-promotion to admin

This is the sharpest edge in the whole schema. A naive policy:

```sql
-- WRONG: lets a user make themselves an administrator.
create policy "users update own profile" on profiles
  for update using (id = auth.uid());
```

RLS operates on rows, not columns, so that policy permits
`update profiles set role = 'admin' where id = auth.uid()`. The user is only
touching their own row, which the policy allows.

Two mechanisms are used together:

**1. Column-level privileges.** Postgres can grant `UPDATE` on specific columns:

```sql
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
```

`role` and `email` are now simply not updatable by the `authenticated` role, no
matter what the policy says.

**2. A guard trigger**, as defence in depth in case a future migration
re-grants too broadly:

```sql
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role cannot be changed';
  end if;
  return new;
end;
$$;
```

Only an existing administrator can change a role, and the first administrator is
promoted manually with SQL (see `docs/setup.md`). There is no code path in the
application that writes to `role`.

### Protecting the quiz answer key

The requirement is not to expose correct answers to the browser before
submission. RLS cannot hide a column, and filtering the column out in the
application is not a real control: the browser holds the anon key and can query
the REST API directly with any column list it likes.

Column-level `SELECT` grants solve it properly:

```sql
revoke select on public.quiz_questions from authenticated;
grant select (
  id, quiz_id, question,
  option_a, option_b, option_c, option_d,
  display_order, created_at, updated_at
) on public.quiz_questions to authenticated;
-- correct_option and explanation are deliberately absent.
```

A crafted request for `correct_option` is now rejected by Postgres, not by
politeness. Scoring happens inside `submit_quiz_attempt()`, a `security definer`
function that can read the key, and the result page reads answers and
explanations through that function's output rather than by selecting the column.

The `PublicQuizQuestion` TypeScript type mirrors this grant, so the type system
and the database agree on what a learner may see.

### Making a submitted attempt immutable

```sql
create policy "users update own in-progress attempts" on quiz_attempts
  for update
  using (user_id = auth.uid() and completed_at is null)
  with check (user_id = auth.uid());
```

The `using` clause is evaluated against the **existing** row, so once
`completed_at` is set the row no longer matches and further updates find no
row to modify. A resubmission cannot change a recorded score.

`quiz_answers` gets the same treatment by checking the parent attempt:

```sql
create policy "users write answers for own in-progress attempts" on quiz_answers
  for insert
  with check (
    exists (
      select 1 from quiz_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
        and a.completed_at is null
    )
  );
```

### Published-only visibility

Classes and quizzes use the same shape, so unpublished drafts are invisible to
learners at the database level rather than by a `.eq('is_published', true)` the
application might forget:

```sql
create policy "learners read published classes" on classes
  for select using (is_published or public.is_admin());
```

### Admin policies

Each content table gets one policy per write verb, all gated on `is_admin()`:

```sql
create policy "admins manage chapters" on chapters
  for all using (public.is_admin()) with check (public.is_admin());
```

`for all` covers insert, update and delete. `using` controls which rows are
visible to the operation; `with check` validates the resulting row. Both are
needed — `using` alone would allow inserting rows that the policy would then
refuse to show.

## Server-side functions

### `submit_quiz_attempt(attempt_id uuid, answers jsonb)`

`security definer`, so it can read `correct_option`. Responsibilities:

1. Verify the attempt belongs to `auth.uid()` and `completed_at is null`.
   Otherwise raise.
2. For each submitted answer, read the correct option and insert a
   `quiz_answers` row with a server-computed `is_correct`.
3. Set `score` and `completed_at` on the attempt.
4. Return the score and the per-question breakdown, including explanations.

Scoring lives in the database rather than in a Server Action because it needs
the answer key, which is exactly what we revoked from `authenticated`. Keeping
it here means there is one place where a score can be written.

### `record_reading_session(verse_id uuid, duration integer)`

Inserts a `reading_sessions` row and upserts `verse_progress`, incrementing
`total_time_seconds`, in a single transaction. The `duration` is clamped by the
column check constraint even if the caller lies.

## Generated types

After the migrations are applied, TypeScript types are generated from the live
schema:

```bash
npx supabase gen types typescript --project-id <ref> --schema public \
  > web/src/lib/database.types.ts
```

`web/src/lib/types.ts` currently hand-declares these shapes so Phase 1 could be
typed before the database existed. In Phase 2 it becomes a thin set of aliases
over the generated `Row` types, keeping one source of truth. Do not hand-edit
`database.types.ts`.

## What is deliberately not in the schema

- **No `is_published` on chapters or verses.** The requirement mentions
  "published chapters", but content that exists is meant to be read; a chapter
  with no verses imported is already effectively invisible. Adding a flag would
  create a second, redundant way for content to be hidden.
- **No soft deletes.** There is one administrator and no compliance
  requirement. `on delete cascade` with database backups is simpler and easier
  to reason about.
- **No audit log.** Out of scope for the MVP. Supabase retains Postgres logs.
- **No materialised views for progress.** A few hundred users times 700 verses
  is a small table; the indexed aggregates are fast enough, and a materialised
  view would add refresh logic and staleness for no measurable gain.
