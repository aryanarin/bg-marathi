-- 0007_rls_policies.sql
-- All Row Level Security policies and column-level grants, in one file so the
-- whole access model can be read at once.
--
-- With RLS enabled and no matching policy, access is denied. Each policy below
-- opens exactly one door. The `anon` role gets nothing here beyond what a
-- policy explicitly allows.

-- ===========================================================================
-- profiles
-- ===========================================================================

-- Read own profile; admins read all.
create policy "read own profile or admin reads all"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- Update own profile. Column-level grants below restrict WHICH columns, and the
-- prevent_role_change trigger (0002) blocks role escalation as defence in depth.
create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins may update any profile (this is the only path that can change a role,
-- because the trigger allows it only when is_admin()).
create policy "admin updates any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Column-level privilege: a learner can change only these two fields. role and
-- email are simply not updatable by the authenticated role, regardless of any
-- policy. This is the primary defence against self-promotion to admin.
--
-- NOTE: the admin "update any profile" path also runs as the authenticated
-- role, so admins change roles through is_admin() SQL / server actions using
-- the service role, not through a column the browser can PATCH. See docs.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- No insert policy: profiles are created only by the handle_new_user trigger,
-- which runs as security definer. No delete policy: account deletion cascades
-- from auth.users and is an admin/dashboard action.

-- ===========================================================================
-- chapters and verses: world-readable content, admin-managed
-- ===========================================================================

create policy "anyone reads chapters"
  on public.chapters for select
  to anon, authenticated
  using (true);

create policy "admins manage chapters"
  on public.chapters for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "anyone reads verses"
  on public.verses for select
  to anon, authenticated
  using (true);

create policy "admins manage verses"
  on public.verses for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===========================================================================
-- verse_progress: strictly own rows; admins may read
-- ===========================================================================

create policy "read own progress"
  on public.verse_progress for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin reads all progress"
  on public.verse_progress for select
  to authenticated
  using (public.is_admin());

create policy "insert own progress"
  on public.verse_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "update own progress"
  on public.verse_progress for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No delete: progress is not user-deletable. Clearing it is an admin/dashboard
-- action if ever needed.

-- ===========================================================================
-- reading_sessions: insert and read own; admins may read
-- ===========================================================================

create policy "read own sessions"
  on public.reading_sessions for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin reads all sessions"
  on public.reading_sessions for select
  to authenticated
  using (public.is_admin());

create policy "insert own sessions"
  on public.reading_sessions for insert
  to authenticated
  with check (user_id = auth.uid());

-- Append-only: no update or delete policy.

-- ===========================================================================
-- classes: published visible to all authenticated; admins manage
-- ===========================================================================

create policy "read published classes or admin"
  on public.classes for select
  to authenticated
  using (is_published or public.is_admin());

create policy "admins manage classes"
  on public.classes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===========================================================================
-- quizzes: published visible; admins manage
-- ===========================================================================

create policy "read published quizzes or admin"
  on public.quizzes for select
  to authenticated
  using (is_published or public.is_admin());

create policy "admins manage quizzes"
  on public.quizzes for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ===========================================================================
-- quiz_questions: readable for published quizzes, BUT the answer key columns
-- are revoked at the column level so a learner can never read them.
-- ===========================================================================

create policy "read questions of published quizzes or admin"
  on public.quiz_questions for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.quizzes q
      where q.id = quiz_id and q.is_published
    )
  );

create policy "admins manage questions"
  on public.quiz_questions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The critical control: learners may select every column EXCEPT correct_option
-- and explanation. A crafted request for those columns is rejected by Postgres,
-- not merely filtered by the application.
revoke select on public.quiz_questions from authenticated;
grant select (
  id, quiz_id, question,
  option_a, option_b, option_c, option_d,
  display_order, created_at, updated_at
) on public.quiz_questions to authenticated;

-- ===========================================================================
-- quiz_attempts: own rows; immutable once submitted
-- ===========================================================================

create policy "read own attempts"
  on public.quiz_attempts for select
  to authenticated
  using (user_id = auth.uid());

create policy "admin reads all attempts"
  on public.quiz_attempts for select
  to authenticated
  using (public.is_admin());

create policy "insert own attempts"
  on public.quiz_attempts for insert
  to authenticated
  with check (user_id = auth.uid());

-- Update only while in progress. Once completed_at is set, the USING clause no
-- longer matches the row, so no further update can touch it -- a resubmission
-- cannot change a recorded score.
create policy "update own in-progress attempts"
  on public.quiz_attempts for update
  to authenticated
  using (user_id = auth.uid() and completed_at is null)
  with check (user_id = auth.uid());

-- ===========================================================================
-- quiz_answers: tied to the owning attempt, writable only while in progress
-- ===========================================================================

create policy "read own answers"
  on public.quiz_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id and a.user_id = auth.uid()
    )
  );

create policy "admin reads all answers"
  on public.quiz_answers for select
  to authenticated
  using (public.is_admin());

create policy "insert answers for own in-progress attempt"
  on public.quiz_answers for insert
  to authenticated
  with check (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
        and a.completed_at is null
    )
  );

create policy "update answers for own in-progress attempt"
  on public.quiz_answers for update
  to authenticated
  using (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
        and a.completed_at is null
    )
  )
  with check (
    exists (
      select 1 from public.quiz_attempts a
      where a.id = attempt_id
        and a.user_id = auth.uid()
        and a.completed_at is null
    )
  );
