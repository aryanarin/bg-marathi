-- 0010_chapter_publish.sql
-- Chapter-level publish/unpublish.
--
-- Until now chapters (and their verses) were world-readable the moment they
-- existed. The admin needs to prepare a chapter's content fully, then reveal it
-- only once it has been audited. This adds an is_published flag to chapters and
-- gates both chapters and verses behind it for non-admins, mirroring the
-- published-only model already used by classes and quizzes.

-- New column. Default false so a freshly imported chapter is hidden until the
-- admin audits and publishes it. Existing rows are left unpublished too, which
-- is the safe default; the admin publishes chapter 1 explicitly after review.
alter table public.chapters
  add column if not exists is_published boolean not null default false;

-- Index the common learner filter.
create index if not exists chapters_published_display_order_idx
  on public.chapters (display_order) where is_published;

-- Replace the open "anyone reads chapters" policy with a published-or-admin one.
drop policy if exists "anyone reads chapters" on public.chapters;

create policy "read published chapters or admin"
  on public.chapters for select
  to anon, authenticated
  using (is_published or public.is_admin());

-- Verses: a verse is visible only if its chapter is published (or the caller is
-- an admin). This prevents reaching an unpublished chapter's verses directly by
-- id. Replace the open "anyone reads verses" policy.
drop policy if exists "anyone reads verses" on public.verses;

create policy "read verses of published chapters or admin"
  on public.verses for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.chapters c
      where c.id = verses.chapter_id and c.is_published
    )
  );
