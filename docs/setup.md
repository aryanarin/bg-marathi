# Setup

How to get the project running, from nothing to a working local site.

Tasks are labelled:

- **[YOU]** — a manual action only you can do (accounts, dashboards, secrets)
- **[AGENT]** — already done, or something I do on request

---

## Prerequisites

| Tool    | Version | Check                |
| ------- | ------- | -------------------- |
| Node.js | 20.9+   | `node --version`     |
| npm     | 10+     | `npm --version`      |
| Git     | any     | `git --version`      |

This machine has Node 24.21.0 and npm 11.18.0. Git is installed at
`C:\Program Files\Git\cmd\git.exe` but is **not on PATH** — either add it to
PATH or use the full path.

---

## 1. Install dependencies — [AGENT, done]

```bash
cd web
npm install
```

Verify the toolchain:

```bash
npm run verify     # typecheck + lint + unit tests
npm run build      # production build
```

All of these pass with no Supabase configuration. The app deliberately boots
without credentials and serves public pages, so you can confirm the toolchain
before touching Supabase.

---

## 2. Create a Supabase project — [YOU]

**Where:** https://supabase.com/dashboard

1. Sign in (GitHub is fine) and click **New project**.
2. Fill in:
   - **Name:** `bhagavad-gita` (anything)
   - **Database Password:** generate a strong one and **save it in a password
     manager**. You will not be shown it again. You do not need it for the app,
     only for direct `psql` access.
   - **Region:** choose the one closest to your users. For an audience in India,
     **Mumbai (ap-south-1)** — region affects every query's latency and cannot
     be changed later without recreating the project.
   - **Plan:** Free is sufficient to start.
3. Click **Create new project** and wait ~2 minutes.

**Expected result:** the project dashboard loads and the database shows as
healthy.

**Send me:** nothing yet.

---

## 3. Collect the API credentials — [YOU]

**Where:** Supabase Dashboard → your project → **Project Settings** (gear icon)
→ **API Keys**

Copy three values:

| Label in dashboard        | Goes into                       | Secret? |
| ------------------------- | ------------------------------- | ------- |
| **Project URL** (Data API)| `NEXT_PUBLIC_SUPABASE_URL`      | No      |
| **anon** / **public**     | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No      |
| **service_role**          | `SUPABASE_SERVICE_ROLE_KEY`     | **YES** |

On the `anon` key: it is *designed* to be public and ships in the browser
bundle. It carries no privileges of its own — every request made with it is
filtered by Row Level Security. Exposing it is expected, not a leak.

On the `service_role` key: it **bypasses Row Level Security completely**. Treat
it like a database root password. It must never appear in client code, a
`NEXT_PUBLIC_` variable, a screenshot, a support ticket, or a git commit. If it
is ever exposed, rotate it immediately in the same dashboard screen.

**Send me:** nothing. I never need these values — you put them in a file I don't
read. If you want me to confirm the *shape* is right, tell me the URL's
subdomain only.

---

## 4. Create `.env.local` — [YOU]

**Where:** the `web/` directory, beside `package.json`.

Copy the template:

```bash
cd web
copy .env.example .env.local      # Windows
# cp .env.example .env.local      # macOS/Linux
```

Then fill in the values from step 3:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` is git-ignored and must never be committed. `.env.example` is
tracked and must never contain real values.

**Expected result:**

```bash
npm run dev
```

The site loads at http://localhost:3000 with no environment errors in the
terminal.

---

## 5. Apply the database migrations — [YOU, after Phase 2]

Migrations do not exist yet. This section documents the procedure for when they
do.

**Where:** Supabase Dashboard → **SQL Editor** → **New query**

For each file in `supabase/migrations/`, in filename order:

1. Open the file, copy its entire contents.
2. Paste into the SQL Editor.
3. Click **Run**.
4. Confirm "Success. No rows returned" before moving to the next file.

Order matters — later migrations reference earlier tables. Do not skip or
reorder.

**Expected result:** Dashboard → **Table Editor** lists `profiles`, `chapters`,
`verses`, `verse_progress`, `reading_sessions`, `classes`, `quizzes`,
`quiz_questions`, `quiz_attempts`, `quiz_answers`, each showing
"RLS enabled".

**Verify RLS is actually on** — this is worth checking by hand, because a table
with RLS off is readable by every signed-in user:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Every row must show `rowsecurity = true`. If any shows `false`, stop and tell
me.

**Send me:** the output of that query if anything looks wrong.

---

## 6. Generate TypeScript types — [YOU, after step 5]

```bash
cd web
npx supabase gen types typescript --project-id <your-project-ref> --schema public > src/lib/database.types.ts
```

Your project ref is the subdomain of your Project URL
(`https://<ref>.supabase.co`).

**Expected result:** `src/lib/database.types.ts` exists and `npm run typecheck`
passes.

**Send me:** confirmation that this succeeded. I then rewire `src/lib/types.ts`
to alias the generated types.

---

## 7. Create the administrator account — [YOU, after Phase 3]

There is no "make me an admin" button, by design. The signup trigger
hard-codes `role = 'user'`, so the first administrator is promoted manually.

1. Register normally through the website with the administrator's email address.
2. Confirm the email.
3. In Supabase → **SQL Editor**, run:

```sql
update public.profiles
set role = 'admin'
where email = 'the-exact-address@example.com';
```

4. Confirm exactly one row was affected:

```sql
select email, role from public.profiles where role = 'admin';
```

**Expected result:** one row, the intended address, `role = 'admin'`. If you see
zero rows, the email does not match a registered account. If you see more than
one, investigate before continuing.

**Send me:** confirmation that the admin can reach `/admin`.

---

## 8. Configure SMTP for auth emails — [YOU]

Supabase's built-in email service is rate-limited and not for production. See
**`docs/email-setup.md`** for the full walkthrough.

---

## 9. Audio hosting — [YOU, decision needed]

See **"Audio hosting" in `docs/content-import.md`**. This is an open decision
and currently blocks the audio player. Summary: Google Drive share links do not
work as an `<audio src>`; Supabase Storage is recommended.

---

## Environment variables reference

| Variable | Required | Exposed to browser | Purpose |
| -------- | -------- | ------------------ | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Yes | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Yes | Public key; all access filtered by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | **No** | Admin ops and import; **bypasses RLS** |
| `NEXT_PUBLIC_SITE_URL` | Yes | Yes | Canonical origin for auth redirects, OG tags, sitemap |

Only prefix a variable with `NEXT_PUBLIC_` if it is genuinely safe in a public
bundle. Anything in a `NEXT_PUBLIC_` variable is readable by anyone who opens
devtools.

SMTP credentials are **not** in this list. They live in the Supabase dashboard;
the application never sends email itself and so never holds them.

---

## Common problems

**"Invalid or missing public environment variables"**
`.env.local` is missing, in the wrong directory (it belongs in `web/`, not the
repository root), or the dev server was started before the file was created.
Restart `npm run dev` after editing it.

**Devanagari renders as boxes**
The Google Fonts fetch at build time failed, usually a network issue. Check the
build output for a font error and rebuild. The CSS falls back to `Nirmala UI` on
Windows, so boxes mean no Devanagari font is available at all.

**Auth emails never arrive**
Almost always SMTP configuration. See `docs/email-setup.md`. Check Supabase →
**Authentication** → **Logs** for the send attempt and its error.

**`git` is not recognized**
Git is installed but not on PATH on this machine. Use
`"C:\Program Files\Git\cmd\git.exe"` or add `C:\Program Files\Git\cmd` to your
PATH environment variable.
