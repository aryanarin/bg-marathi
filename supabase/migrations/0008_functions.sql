-- 0008_functions.sql
-- Server-side functions for operations that must not be trusted to the client:
-- quiz scoring (needs the answer key, which learners cannot read) and progress
-- recording (must clamp durations and upsert atomically).

-- ---------------------------------------------------------------------------
-- record_reading_session(verse_id, duration)
--
-- Inserts a reading_sessions row and upserts verse_progress, incrementing the
-- running total, in one call. duration is clamped to the column check anyway
-- (5..1800), so a lying client cannot record an implausible session.
--
-- security invoker (the default): runs as the calling user, so RLS applies and
-- the user can only ever write their own rows.
-- ---------------------------------------------------------------------------
create or replace function public.record_reading_session(
  p_verse_id uuid,
  p_duration integer
)
returns void
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_now  timestamptz := now();
  v_dur  integer := greatest(5, least(1800, coalesce(p_duration, 0)));
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.reading_sessions (user_id, verse_id, started_at, ended_at, duration_seconds)
  values (v_user, p_verse_id, v_now - make_interval(secs => v_dur), v_now, v_dur);

  insert into public.verse_progress (user_id, verse_id, total_time_seconds)
  values (v_user, p_verse_id, v_dur)
  on conflict (user_id, verse_id) do update
    set total_time_seconds = public.verse_progress.total_time_seconds + excluded.total_time_seconds,
        updated_at = now();
end;
$$;

-- ---------------------------------------------------------------------------
-- set_verse_progress(verse_id, is_read, is_memorized)
--
-- Idempotent toggle for the "Completed reading" / "Memorized" actions. Upserts
-- so it never creates duplicate rows, and stamps read_at / memorized_at the
-- first time each flag becomes true. Passing null leaves that flag unchanged.
-- ---------------------------------------------------------------------------
create or replace function public.set_verse_progress(
  p_verse_id     uuid,
  p_is_read      boolean default null,
  p_is_memorized boolean default null
)
returns public.verse_progress
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_row  public.verse_progress;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  insert into public.verse_progress (user_id, verse_id, is_read, is_memorized, read_at, memorized_at)
  values (
    v_user,
    p_verse_id,
    coalesce(p_is_read, false),
    coalesce(p_is_memorized, false),
    case when p_is_read then now() end,
    case when p_is_memorized then now() end
  )
  on conflict (user_id, verse_id) do update set
    is_read = coalesce(p_is_read, public.verse_progress.is_read),
    is_memorized = coalesce(p_is_memorized, public.verse_progress.is_memorized),
    -- Stamp the timestamp only on the false -> true transition, so re-marking
    -- does not keep moving it.
    read_at = case
      when p_is_read is true and public.verse_progress.read_at is null then now()
      when p_is_read is false then null
      else public.verse_progress.read_at
    end,
    memorized_at = case
      when p_is_memorized is true and public.verse_progress.memorized_at is null then now()
      when p_is_memorized is false then null
      else public.verse_progress.memorized_at
    end,
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_quiz_attempt(attempt_id, answers)
--
-- The one place a score can be written. security definer so it can read
-- correct_option, which learners cannot select. It:
--   1. verifies the attempt belongs to the caller and is still in progress
--   2. scores each answer against the key, server-side
--   3. writes quiz_answers rows and finalises the attempt (sets completed_at)
--   4. returns the score plus a per-question breakdown incl. explanations
--
-- answers is jsonb: [{ "question_id": "...", "selected_option": "a" }, ...]
-- ---------------------------------------------------------------------------
create or replace function public.submit_quiz_attempt(
  p_attempt_id uuid,
  p_answers    jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user      uuid := auth.uid();
  v_attempt   public.quiz_attempts;
  v_answer    jsonb;
  v_qid       uuid;
  v_selected  text;
  v_correct   text;
  v_is_correct boolean;
  v_score     integer := 0;
  v_breakdown jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  select * into v_attempt
  from public.quiz_attempts
  where id = p_attempt_id
  for update;

  if not found then
    raise exception 'attempt not found';
  end if;
  if v_attempt.user_id <> v_user then
    raise exception 'not your attempt';
  end if;
  if v_attempt.completed_at is not null then
    raise exception 'attempt already submitted';
  end if;

  -- Score each submitted answer against the key.
  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    v_qid := (v_answer ->> 'question_id')::uuid;
    v_selected := v_answer ->> 'selected_option';

    select correct_option into v_correct
    from public.quiz_questions
    where id = v_qid and quiz_id = v_attempt.quiz_id;

    -- Ignore any question id that is not part of this quiz.
    if not found then
      continue;
    end if;

    v_is_correct := (v_selected is not null and v_selected = v_correct);
    if v_is_correct then
      v_score := v_score + 1;
    end if;

    insert into public.quiz_answers (attempt_id, question_id, selected_option, is_correct)
    values (p_attempt_id, v_qid, v_selected, v_is_correct)
    on conflict (attempt_id, question_id) do update
      set selected_option = excluded.selected_option,
          is_correct = excluded.is_correct;

    v_breakdown := v_breakdown || jsonb_build_object(
      'question_id', v_qid,
      'selected_option', v_selected,
      'correct_option', v_correct,
      'is_correct', v_is_correct,
      'explanation', (select explanation from public.quiz_questions where id = v_qid)
    );
  end loop;

  update public.quiz_attempts
  set score = v_score,
      completed_at = now()
  where id = p_attempt_id;

  return jsonb_build_object(
    'attempt_id', p_attempt_id,
    'score', v_score,
    'total_questions', v_attempt.total_questions,
    'answers', v_breakdown
  );
end;
$$;

revoke all on function public.record_reading_session(uuid, integer) from public;
revoke all on function public.set_verse_progress(uuid, boolean, boolean) from public;
revoke all on function public.submit_quiz_attempt(uuid, jsonb) from public;
grant execute on function public.record_reading_session(uuid, integer) to authenticated;
grant execute on function public.set_verse_progress(uuid, boolean, boolean) to authenticated;
grant execute on function public.submit_quiz_attempt(uuid, jsonb) to authenticated;
