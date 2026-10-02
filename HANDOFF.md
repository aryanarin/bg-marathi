# Project Handoff — Marathi Bhagavad Gita Learning Platform

Paste this whole file into a new session to continue. It is the single source of
truth for where the project stands and what is left.

## How to use this in a new session

Start the new chat with: "Read HANDOFF.md in the project root and continue from
there." The assistant should read this file first, then the referenced docs only
as needed.

---

## 1. What this project is

A mobile-first web platform for studying the Bhagavad Gita in Marathi. Learners
read verses (Sanskrit + word-to-word + translation + purport + admin-written
easy-explanation/example + audio), track read/memorized progress and time,
attend scheduled online classes, and take quizzes. One administrator (a
Marathi-speaking devotee, non-technical) manages all content in the browser.

Owner does NOT read Marathi. The plan: ship the site now with draft content
already loaded; the Marathi admin corrects verses in-browser later. Do not try
to perfect the Marathi text.

## 2. Tech stack (all built, working)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase
(Postgres + Auth + RLS + Storage) · Zod · Vitest + Playwright · deploy on Vercel.

- Project root: `C:\Users\ysary\Downloads\stitch_marathi_bhagavad_gita_learning_app`
- The Next.js app lives in the `web/` subdirectory (NOT repo root).
- Windows. `git` is NOT on PATH — use `"C:\Program Files\Git\cmd\git.exe"`.
- GitHub repo: `https://github.com/aryanarin/bg-marathi.git` (private), branch `main`.

## 3. IMPORTANT Next.js 16 gotchas (verified, don't relearn)

- `middleware.ts` is renamed to `proxy.ts` (Node runtime, no `runtime` config). It's at `web/src/proxy.ts`.
- `cookies()`, `headers()`, `params`, `searchParams` are ASYNC.
- `error.tsx` boundary prop is `retry`, not `reset`.
- Dynamic `<Link href>`/`redirect()` with template strings need `as Route` (typedRoutes is on).
- Read `web/node_modules/next/dist/docs/` before writing Next code; `web/AGENTS.md` is auto-managed, commit it as-is.

## 4. Phases — all COMPLETE and committed

1. Foundation + UI shell · 2. DB schema + RLS · 3. Auth · 4. Chapters/verses ·
5. Progress + reading timer · 6. Classes · 7. Quizzes · 8. Admin dashboard (full
CRUD). Plus: git-scm-inspired redesign (light+dark theme, toggle), audio mirror,
Chanakya PDF extraction, chapter-1 draft content imported.

Git log (newest first): `chore: trigger Vercel deploy`, `Add content import
script; import chapter 1 draft`, `Track extract_chapter.py`, `Add Chanakya PDF
extraction pipeline`, `Wire dashboard/progress to real data + demo seed`,
`Phase 8: admin`, `Phases 6-7`, `Redesign git-scm`, `Phases 4-5`, `Phase 3`,
`Phase 2`, `Phase 1`, `Initial commit`. Working tree is clean.

## 5. Supabase (live project, already set up)

- Project ref: `mjavrqbierktlafrkoxu`, region Mumbai (ap-south-1).
- URL: `https://mjavrqbierktlafrkoxu.supabase.co`
- All 9 migrations applied (`supabase/migrations/`), RLS on all 10 tables, verified
  with 6 live integration tests (`npm run test:rls`).
- Audio: all 657 recitation files mirrored to public Storage bucket `verse-audio`
  (path `verse-audio/CC/Bg-CC-VV.mp3`). Range requests + caching verified.
- Content: chapter 1 imported — 46 verses with draft Marathi text containing
  review markers `[?]` and `[पुनरावलोकन आवश्यक]`. Verses are PUBLIC as soon as
  they exist (no per-verse publish gate), so the admin's edits show instantly.
- Credentials live in `web/.env.local` (git-ignored, never committed):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, `SUPABASE_DB_URL`
  (pooler host `aws-0-ap-south-1.pooler.supabase.com`, user `postgres.<ref>`;
  the direct `db.<ref>` host is IPv6-only and does NOT resolve on this network).
- SMTP for auth emails: owner says configured (Gmail).

## 6. Security notes (do not regress)

- Three Supabase clients: `client.ts` (browser, anon), `server.ts` (server, anon,
  RLS enforced), `admin.ts` (service-role, BYPASSES RLS, `server-only`, scripts
  only). A previous model wrongly piped the service-role key through the cookie
  path — that was reverted. NEVER do that.
- Authorization lives in the data access layer (`requireUser`/`requireAdmin` in
  `web/src/lib/auth/guards.ts`) + Postgres RLS. proxy.ts and layouts are NOT the
  boundary. Every admin Server Action re-checks `requireAdmin()`.
- Quiz answer key (`correct_option`) is column-revoked from learner roles.
- KNOWN TODO (not urgent): the `SUPABASE_SERVICE_ROLE_KEY` and the DB password
  (`HareKrishna@8657`) appeared in the prior chat transcript. Rotate both in the
  Supabase dashboard once the site is stable, then update Vercel env + `.env.local`.

## 7. Useful npm scripts (run from `web/`)

- `npm run dev` / `build` / `start`
- `npm run verify` (typecheck + lint + 46 unit tests), `npm run test:e2e`,
  `npm run test:rls` (live RLS tests)
- `npm run db:migrate` — apply SQL migrations via SUPABASE_DB_URL
- `npm run audio:mirror -- --source "D:\Bhagavad Gita Marathi Project\BG Verse Pronunciation"`
- `npm run content:validate -- 01`
- `npm run content:import -- 01` (upsert chapter JSON; accepts `.draft.json`)
- `npm run seed:demo`
- `python scripts/extract_chapter.py 1` — decode Chanakya PDF -> `content/chapter-01.draft.json`
  (needs `pip install krutiextract pymupdf`; source PDF at
  `C:\Users\ysary\Downloads\Documents\bhagvad-gita-marathi-_compress.pdf`)

## 8. Content extraction status (for later, not blocking launch)

Source PDF uses the legacy Chanakya font. `web/scripts/extract_chapter.py` decodes
it via `krutiextract` (reads logical char order so matras don't scramble) and
produces ~90% draft Marathi with review flags. The decode works well; per-verse
structural parsing (word-to-word vs translation vs purport split, combined-verse
grouping) is imperfect — intentionally left for the admin to fix in-browser.
Only chapter 1 extracted so far. Other chapters: run `extract_chapter.py N`
(chapter name/description are hard-coded for ch1 — generalize when extending).

## 9. ===== CURRENT TASK: DEPLOYMENT (in progress) =====

Goal: host at **gita.bhakti.eu.org** (bhakti.eu.org is in the owner's Cloudflare).

DONE:
- Code pushed to GitHub `aryanarin/bg-marathi` main.
- Vercel project created; owner added the 4 env vars; owner added the custom domain.
- An empty commit was pushed to trigger the first Vercel build.

REMAINING STEPS (owner does the clicking; assistant guides + can run git/scripts):

1. **Confirm first deploy succeeds.** Vercel → Deployments tab. If no build
   appears or it fails:
   - The #1 cause is **Root Directory not set to `web`**. Fix at Vercel →
     Settings → Build and Deployment → Root Directory = `web`, then Redeploy.
   - If build list is empty, push a commit (Vercel auto-builds on push to main).
   - Paste build logs to diagnose.
2. **Env vars on Vercel** (Production+Preview+Development) — confirm all four:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://gita.bhakti.eu.org`.
   (Vercel does NOT need SUPABASE_DB_URL.)
3. **Cloudflare DNS**: CNAME `gita` -> `cname.vercel-dns.com`, **Proxy = DNS only
   (grey cloud, NOT orange)**. Orange cloud breaks Vercel TLS / causes redirect loops.
4. **Supabase → Authentication → URL Configuration**: Site URL =
   `https://gita.bhakti.eu.org`; add Redirect URL `https://gita.bhakti.eu.org/**`
   (keep `http://localhost:3000/**`).
5. **Create admin**: register on the live site with the admin's email, confirm
   email, then in Supabase SQL Editor:
   `update public.profiles set role='admin' where email='<admin-email>';`
   Admin then edits verses at `/admin` → श्लोक → pick verse → edit all fields → save.
6. **Post-deploy check**: home loads, chapters shows अध्याय १ (46 verses), verse
   page plays audio, login/register email works, `/admin` reachable only by admin,
   light/dark toggle works, robots.txt/sitemap.xml/manifest.webmanifest serve.

## 10. Key file map

- Routes: `web/src/app/` — `(auth)`, `(learner)`, `admin/`, public `chapters/`, `about/`
- Admin CRUD actions: `web/src/lib/data/admin-*.ts`
- Admin verse editor (all fields): `web/src/components/admin/verse-form.tsx`
- Data layer: `web/src/lib/data/*.ts`; auth guards: `web/src/lib/auth/guards.ts`
- Design tokens + themes: `web/src/app/globals.css`; theme toggle:
  `web/src/components/layout/theme-toggle.tsx` + `theme-script.tsx`
- Docs: `docs/deployment.md`, `docs/setup.md`, `docs/content-import.md`,
  `docs/admin-guide.md`, `docs/email-setup.md`, `docs/architecture.md`, `docs/database.md`

## 11. Working style the owner expects

- Owner is non-technical for Marathi content; be concrete and guide clicks for
  external steps (Vercel/Cloudflare/Supabase dashboards) with exact values.
- Correctness > security > simplicity. Don't over-engineer. Verify before claiming.
- Commit per logical change with the full-path git binary. Never commit secrets.
