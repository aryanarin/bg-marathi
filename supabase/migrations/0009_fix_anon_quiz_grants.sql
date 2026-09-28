-- 0009_fix_anon_quiz_grants.sql
-- Security fix: lock down the `anon` role's access to quiz_questions.
--
-- Background: 0007 revoked the table-level SELECT from `authenticated` and
-- re-granted only the non-answer columns. It did NOT touch `anon`, which still
-- carried Supabase's default full-table SELECT grant -- including
-- correct_option and explanation. A behaviour test with the anon key confirmed
-- the answer key was readable by an unauthenticated client.
--
-- Quizzes are a signed-in feature: there is no reason for `anon` to read
-- questions at all. So we remove anon's access entirely rather than mirror the
-- column list. The RLS SELECT policies on quiz_questions already target
-- `authenticated` only, so this closes the last door.

revoke all on public.quiz_questions from anon;

-- Defence in depth: also ensure anon cannot read the other quiz-related tables.
-- Their RLS policies already target `authenticated`, but revoking the base
-- grant means a missing/again-default grant can never silently expose them.
revoke all on public.quiz_attempts from anon;
revoke all on public.quiz_answers from anon;

-- verse_progress and reading_sessions are per-user and their policies target
-- `authenticated`; remove any anon base grant for the same reason.
revoke all on public.verse_progress from anon;
revoke all on public.reading_sessions from anon;

-- profiles: anon has no policy, but revoke the base grant so the intent is
-- explicit and grep-able.
revoke all on public.profiles from anon;
