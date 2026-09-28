# Deployment

Deploying to Vercel with Supabase as the backend.

Tasks are labelled **[YOU]** (manual, only you can do it) or **[AGENT]** (done,
or something I do on request).

## Prerequisites

Before deploying, these must be done:

- [ ] Supabase project created (`docs/setup.md` steps 2–3)
- [ ] Migrations applied and RLS verified (`docs/setup.md` step 5)
- [ ] Custom SMTP configured (`docs/email-setup.md`)
- [ ] `npm run verify` and `npm run build` pass locally

Deploying before RLS is verified would expose the database. Do not skip that
check.

---

## 1. Push to GitHub — [YOU]

Vercel deploys from a Git repository.

Git is installed on this machine but **not on PATH**. Use the full path or add
`C:\Program Files\Git\cmd` to PATH.

```bash
cd "C:\Users\ysary\Downloads\stitch_marathi_bhagavad_gita_learning_app"

"C:\Program Files\Git\cmd\git.exe" init
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Phase 1: project foundation and UI shell"
```

Then create an empty repository on GitHub (no README, no .gitignore — the
project has both) and:

```bash
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/<you>/<repo>.git
"C:\Program Files\Git\cmd\git.exe" branch -M main
"C:\Program Files\Git\cmd\git.exe" push -u origin main
```

**Before pushing, confirm no secrets are staged:**

```bash
"C:\Program Files\Git\cmd\git.exe" status
```

`web/.env.local` must **not** appear. It is git-ignored, but check anyway — a
service-role key in Git history is a rotate-everything event.

**Make the repository private** unless you have a reason not to.

**Expected result:** the code appears on GitHub and `web/.env.local` is absent.

---

## 2. Import into Vercel — [YOU]

**Where:** https://vercel.com/new

1. Sign in with GitHub.
2. Select your repository → **Import**.
3. Configure:

| Setting | Value |
| ------- | ----- |
| Framework Preset | Next.js (auto-detected) |
| **Root Directory** | **`web`** |
| Build Command | `next build` (default) |
| Output Directory | leave default |
| Install Command | `npm install` (default) |

**Root Directory is the one setting you must change.** The Next.js app lives in
`web/`, not the repository root. If this is wrong the build fails with "no
Next.js version detected".

4. **Do not deploy yet** — add environment variables first (next step). If you
   already clicked Deploy, it will fail; add the variables and redeploy.

---

## 3. Add environment variables — [YOU]

**Where:** Vercel project → **Settings** → **Environment Variables**

Add all four, for **Production**, **Preview** and **Development**:

| Name | Value | Notes |
| ---- | ----- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key | Public by design |
| `SUPABASE_SERVICE_ROLE_KEY` | your service-role key | **Secret. Never prefix with `NEXT_PUBLIC_`.** |
| `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` | No trailing slash |

For `NEXT_PUBLIC_SITE_URL`, use your real domain in Production. If you have not
set up a custom domain yet, use the `.vercel.app` URL and update it later — auth
redirect links and Open Graph URLs are built from this value, so a wrong value
means broken confirmation emails.

Vercel encrypts all variables at rest, but anything named `NEXT_PUBLIC_*` is
inlined into the browser bundle at build time and is therefore public. Only the
three non-public values are actually secret, and only `SUPABASE_SERVICE_ROLE_KEY`
is dangerous.

**Then deploy.**

**Expected result:** the build succeeds and the site loads at
`https://<project>.vercel.app`.

---

## 4. Update Supabase redirect URLs — [YOU]

Auth emails link back to the site, and Supabase only permits redirects to an
allowlist.

**Where:** Supabase → **Authentication** → **URL Configuration**

**Site URL:**
```
https://your-domain.com
```

**Redirect URLs:**
```
https://your-domain.com/**
https://<project>.vercel.app/**
https://<project>-*.vercel.app/**
http://localhost:3000/**
```

The third entry covers Vercel preview deployments, which get a unique subdomain
per commit. Without it, auth will not work in previews.

Keep `localhost` so local development continues to work.

**Expected result:** registering on the deployed site sends an email whose link
returns you to the deployed site, signed in.

---

## 5. Custom domain — [YOU, optional]

**Where:** Vercel project → **Settings** → **Domains** → enter your domain

Vercel shows the DNS records to add. At your registrar:

**Apex domain** (`example.com`):
```
Type: A      Name: @      Value: 76.76.21.21
```

**Subdomain** (`www` or `gita`):
```
Type: CNAME  Name: www    Value: cname.vercel-dns.com
```

Use the exact values Vercel displays — the IP above is Vercel's documented apex
address but can change.

DNS propagation takes minutes to a few hours. Vercel provisions a TLS
certificate automatically once the records resolve.

**After the domain is live**, update both:
- `NEXT_PUBLIC_SITE_URL` in Vercel → then **redeploy** (the value is baked in at
  build time)
- Site URL and Redirect URLs in Supabase

**Expected result:** `https://your-domain.com` serves the site with a valid
certificate, and auth emails link to it.

---

## 6. Post-deployment verification — [YOU]

Walk through this on a real phone, not just a desktop browser:

- [ ] Home page loads; Devanagari renders correctly (no boxes)
- [ ] `/chapters` and `/about` load
- [ ] `/dashboard` redirects to `/login` when signed out
- [ ] Registration sends a confirmation email
- [ ] The confirmation link signs you in on the deployed domain
- [ ] Password reset email arrives and works
- [ ] Sign out works
- [ ] `/admin` is unreachable for a normal account
- [ ] `/admin` is reachable for the promoted admin account
- [ ] `https://your-domain.com/robots.txt` lists `/admin` under Disallow
- [ ] `https://your-domain.com/sitemap.xml` renders
- [ ] `https://your-domain.com/manifest.webmanifest` renders
- [ ] The site is installable ("Add to Home Screen") on Android Chrome and iOS Safari

### Verify the service-role key is not exposed

This is worth doing by hand once:

1. Open the deployed site.
2. Open devtools → **Sources** (or **Debugger**).
3. Search all loaded JavaScript for the first 12 characters of your
   service-role key.

**Expected result: zero matches.** If it appears, stop, rotate the key in
Supabase immediately, and tell me — it means something imports
`lib/supabase/admin.ts` from client code, which the `server-only` guard should
have prevented at build time.

---

## Running E2E tests against the deployment — [AGENT/YOU]

```bash
cd web
npx playwright test --project=mobile-chrome
```

By default this builds and starts a local production server. To point at the
deployed site instead:

```bash
# PowerShell
$env:PLAYWRIGHT_TEST_BASE_URL="https://your-domain.com"; npx playwright test
```

Note that E2E tests that create accounts will create **real** rows. Prefer
running the full suite locally, and use the checklist above against production.

---

## Ongoing operations

### Deploys

Every push to `main` deploys to production. Every push to another branch or a
pull request gets a preview deployment with its own URL. Preview deployments
share the same Supabase project, so **preview data is production data** — be
careful with destructive testing.

If you want isolation, create a second Supabase project for previews and give
the Preview environment different variables. Not necessary at this stage.

### Applying new migrations

Migrations are **not** applied automatically. When I add a migration:

1. Pull the latest code.
2. Open the new file in `supabase/migrations/`.
3. Paste and run it in the Supabase SQL Editor.
4. Regenerate types (`docs/setup.md` step 6) if the schema changed.

Apply the migration **before or at the same time as** the deploy that depends on
it, or the deployed app will query columns that do not exist.

### Rollback

**Code:** Vercel → **Deployments** → find a previous good deployment →
**⋯** → **Promote to Production**. Instant, no rebuild.

**Database:** there is no automatic rollback. Supabase Free retains daily
backups; restoring is Dashboard → **Database** → **Backups**. Because restoring
loses data written since the backup, prefer writing a forward-fixing migration
over restoring.

### Monitoring

| What | Where |
| ---- | ----- |
| Build and function logs | Vercel → project → **Logs** |
| Auth events and email sends | Supabase → **Authentication** → **Logs** |
| Slow queries | Supabase → **Database** → **Query Performance** |
| Storage and database usage | Supabase → **Project Settings** → **Usage** |

Watch the Supabase Free tier limits: 500 MB database, 1 GB storage, and projects
pause after 7 days of inactivity. A paused project means the site returns errors
until you resume it from the dashboard — relevant if the study group takes a
break.

---

## Cost

At the intended scale, both free tiers suffice:

| Service | Free tier | Adequate? |
| ------- | --------- | --------- |
| Vercel Hobby | 100 GB bandwidth/month | Yes, comfortably |
| Supabase Free | 500 MB DB, 1 GB storage, 50k MAU | Yes |

The likely first constraint is Supabase **storage**, if all 700 verse audio
files are hosted there. At roughly 300 KB per verse that is ~210 MB, well within
1 GB. Larger or higher-bitrate files could change that.

Vercel Hobby prohibits commercial use. If this becomes a paid offering, Pro is
required.
