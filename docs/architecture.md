# Architecture

## Goal

A web platform for studying the Bhagavad Gita in Marathi. Individual learners
read verses, track their progress, attend scheduled online classes and attempt
quizzes. One administrator manages all content.

This document explains how the system is put together and, more importantly,
**why**. Read it before making structural changes.

## Guiding constraints

Priorities, in order, as set by the project brief:

1. Correctness
2. Security
3. Simplicity
4. Mobile usability
5. Content readability
6. Maintainability
7. Performance
8. Visual polish

Simplicity sitting above performance is deliberate. This application serves a
study group, not a million users. Avoid caching layers, queues and abstractions
that buy performance at the cost of a maintainer's understanding.

## Stack

| Concern         | Choice                                   |
| --------------- | ---------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19        |
| Language        | TypeScript, `strict` mode                |
| Styling         | Tailwind CSS v4 (CSS-first tokens)       |
| Components      | shadcn-style local components + Radix    |
| Icons           | lucide-react                             |
| Database        | Supabase Postgres                        |
| Auth            | Supabase Auth (email + password)         |
| Authorization   | Postgres Row Level Security + server-side guards |
| Forms           | react-hook-form + Zod                    |
| Unit tests      | Vitest + Testing Library                 |
| E2E tests       | Playwright                               |
| Hosting         | Vercel                                   |
| Audio           | External URLs (see "Audio")              |

There is no separate backend service, no ORM, no Redis, no Docker in
production and no CMS. Next.js server code talks to Postgres through the
Supabase client. That is the whole data path.

### Why no ORM

Supabase's client is already a typed query builder, and RLS means authorization
lives in the database. Adding Prisma or Drizzle would mean either bypassing RLS
with a direct connection (losing the security model) or maintaining two sources
of schema truth. Neither is worth it at this size.

## Repository layout

```
.
├── content/              JSON scripture content, validated before import
├── docs/                 This documentation
├── supabase/migrations/  SQL migrations, applied in filename order
└── web/                  The Next.js application
    ├── scripts/          Node CLI scripts (validate, import)
    ├── src/
    │   ├── app/          Routes. Directory structure defines URLs.
    │   ├── components/   React components
    │   │   ├── ui/       Generic primitives (Button, Card, ...)
    │   │   └── layout/   Shell (header, footer, navigation)
    │   ├── lib/          Non-React logic
    │   │   ├── auth/     Authorization guards
    │   │   ├── content/  Content file schema
    │   │   ├── supabase/ Database clients
    │   │   └── validation/ Zod schemas
    │   └── proxy.ts      Session refresh (was middleware.ts)
    └── tests/
        ├── unit/         Vitest
        └── e2e/          Playwright
```

`web/` is a subdirectory rather than the repository root so that a future
`mobile/` app can sit beside it and share `content/` and `supabase/`.

### Route groups

Parentheses create a route group: it shares a layout without adding a URL
segment.

| Group       | URL prefix | Layout                                   |
| ----------- | ---------- | ---------------------------------------- |
| `(auth)`    | none       | Narrow centred card, no navigation       |
| `(learner)` | none       | Header nav on desktop, tab bar on mobile |
| `(admin)`   | `/admin`   | Sidebar navigation                       |

So `src/app/(learner)/dashboard/page.tsx` serves `/dashboard`.

## The layered model

```
Browser
  │
  ├─ proxy.ts ............... refresh session, optimistic redirect
  │
  ├─ Server Component ....... calls requireUser() / requireAdmin()
  │    └─ Data access layer .. lib/auth/guards.ts, lib/data/*
  │         └─ Supabase client (anon key, acts as the user)
  │              └─ Postgres + RLS  ← the real boundary
  │
  └─ Server Action .......... re-checks authorization independently
```

Data flows in one direction. Server Components read; Server Actions write.
Client Components receive data as props and never query the database for
privileged data themselves.

## Security model

Authorization is enforced in **three independent places**. Any one of them
failing does not expose data.

### 1. Postgres Row Level Security (the real boundary)

Every table has RLS enabled. Policies are written in terms of `auth.uid()`, so
the database itself decides what a given user may read or write. Because the
browser only ever holds the anon key, a user cannot bypass this even by calling
the Supabase REST API directly with a crafted request.

See `docs/database.md` for the policy set.

### 2. Server-side guards (the ergonomic boundary)

`lib/auth/guards.ts` exposes `getCurrentUser()`, `requireUser()` and
`requireAdmin()`. Pages and Server Actions call these. They read the role from
the `profiles` table server-side.

The role is **never** taken from a request body, header, cookie or any other
client-supplied value. `requireAdmin()` reads it from the database on every
call, wrapped in React's `cache()` so repeated calls in one render cost one
query.

### 3. Proxy redirects (a convenience only)

`proxy.ts` refreshes the Supabase session and redirects signed-out visitors away
from private routes. This is an **optimistic** check that saves a wasted render
and gives a better user experience. It is explicitly *not* relied upon, for two
documented reasons:

- Server Actions are dispatched as POST requests to the route they are used on,
  so a change to the proxy `matcher` could silently remove coverage from an
  action.
- Proxy runs on prefetches, so it must stay cheap and avoid role lookups.

### Why not check authorization in layouts

A layout does not re-render on every navigation, and it does not control whether
its child segments execute. A layout that returns `null` for an unauthorized
user does not prevent nested pages or Server Actions from running. Checks
therefore live in pages and actions, next to the data they protect. The learner
and admin layouts carry a comment stating this so the omission is not mistaken
for an oversight.

### The three Supabase clients

| File                        | Key          | Used by                     | RLS     |
| --------------------------- | ------------ | --------------------------- | ------- |
| `lib/supabase/client.ts`    | anon         | Client Components           | Enforced |
| `lib/supabase/server.ts`    | anon         | Server Components, Actions  | Enforced |
| `lib/supabase/admin.ts`     | service role | Admin reads, import scripts | **BYPASSED** |

`admin.ts` starts with `import "server-only"`, so importing it from client code
is a build error rather than a runtime leak. `getServiceRoleKey()` additionally
throws if `window` is defined.

Reach for the admin client only when an operation genuinely cannot be expressed
as the signed-in user — for example the import script, which has no session at
all. Never use it to work around an inconvenient RLS policy; fix the policy.

### Untrusted input

- Every form is validated with Zod on the client (for feedback) **and again on
  the server** (for trust). Client validation is never the only check.
- Meeting URLs are the sharpest edge: the administrator pastes them and learners
  click them. `meetingUrlSchema` requires `https:`, which blocks `javascript:`
  and `data:` URLs, and rejects embedded credentials. Unit tests cover these
  cases explicitly.
- External links open with `rel="noopener noreferrer"`.
- No `dangerouslySetInnerHTML`. Content is stored and rendered as plain text
  with `white-space: pre-line`, so there is no HTML sanitisation problem to get
  wrong.
- Reading durations reported by the browser are clamped server-side.

## Reading timer

Requirement: track time spent learning, without counting a tab left open
overnight.

Approach:

1. A client timer starts when a verse page mounts.
2. It pauses on `visibilitychange` when the tab is hidden, and on a long idle
   period with no interaction.
3. On unmount, or when the reader finishes, the elapsed time is sent to a Server
   Action.
4. The server clamps the value to `MAX_SESSION_SECONDS` (30 minutes) and rejects
   anything under `MIN_SESSION_SECONDS` (5 seconds).
5. A `reading_sessions` row is inserted and `verse_progress.total_time_seconds`
   is incremented.

The client value is a *hint*. The clamp is the guarantee, because the client is
user-controlled.

Two tables rather than one because they answer different questions:
`reading_sessions` is an append-only log (useful for "when did they study"),
while `verse_progress.total_time_seconds` is the running total the dashboard
reads without aggregating thousands of rows.

## Audio

Audio files live outside the application and the database. Each verse stores
`audio_url` and `audio_provider`.

The frontend treats `audio_url` as an opaque external media URL and plays it
with a native `<audio>` element. It has no knowledge of the hosting provider.
`audio_provider` exists only to record where a file came from, so a future
migration between providers can be scripted.

Audio is never uploaded to Vercel and never stored as a blob in Postgres. If
`audio_url` is null or the file fails to load, the player renders a quiet
"audio unavailable" state and the rest of the verse page works normally.

> **Hosting note.** Google Drive share links do not work as an `<audio src>`:
> Drive returns an HTML viewer page rather than audio bytes, and the download
> workaround is rate-limited and unreliable, particularly on mobile Safari.
> Supabase Storage is the recommended host. Because the provider is captured in
> a column and never assumed in code, this decision is reversible.

## Quizzes

The answer key must not reach the browser before submission.

- `QuizQuestion` (with `correct_option`) is a server-side type.
- `PublicQuizQuestion` omits `correct_option` and `explanation`. This is what an
  in-progress attempt receives.
- RLS on `quiz_questions` permits learners to read questions for published
  quizzes but a database view / column selection excludes the answer column;
  scoring happens in a Server Action that reads the key server-side.
- A completed attempt (`completed_at IS NOT NULL`) is immutable: the RLS update
  policy refuses to modify it, so a resubmission cannot change a score.

Correct answers and explanations are returned only after submission, on the
result page.

## Caching

`cacheComponents` (Partial Prerendering) is **deliberately off**.

Nearly every authenticated page in this application is per-user and must render
per request. Reading `cookies()` — which the Supabase server client does on
every call — opts a route into dynamic rendering automatically. That gives the
guarantee we need (no authenticated page is ever statically cached or shared
between users) with no extra machinery.

Public pages that do not read cookies are prerendered at build time.

If Cache Components is adopted later, per-user data must be keyed on the user id
inside an unexported function, because cache keys and tags are stored in plain
text.

## Error handling

| File                    | Catches                                  |
| ----------------------- | ---------------------------------------- |
| `app/error.tsx`         | Errors in a route segment                |
| `app/global-error.tsx`  | Errors in the root layout itself         |
| `app/not-found.tsx`     | 404s                                     |
| `app/loading.tsx`       | Suspense fallback                        |

Users see a plain Marathi message. Raw Postgres and Supabase errors are never
rendered; they go to the server log via `console.error`, and the user is shown
the non-sensitive `error.digest` so a report can be matched to a log entry.

Next.js 16 note: the error boundary prop is `retry`, not `reset`.

## Accessibility

Not a later pass. Built in:

- Semantic landmarks, exactly one `<h1>` per page, ordered headings.
- A skip link as the first focusable element.
- A single visible focus ring, never removed.
- Minimum 44px touch targets on interactive controls.
- Zoom is not disabled — clamping `maximum-scale` would fail WCAG 1.4.4 and hurt
  precisely the readers most likely to need it.
- Status and progress conveyed by text and ARIA, not colour alone.
- `prefers-reduced-motion` respected.
- `lang` attributes (`mr`, `sa`) so screen readers pronounce Devanagari
  correctly.

Full WCAG conformance requires manual testing with real assistive technology and
expert review; the above is the engineering baseline, not a certification.

## Typography

Three families, each with a purpose:

- **Literata** — Latin body text. Designed for screen reading.
- **Noto Sans Devanagari** — Marathi UI and prose. The broadest free Devanagari
  glyph coverage, which matters for conjuncts and rare matras.
- **Tiro Devanagari Marathi** — Sanskrit verse display, drawn specifically for
  Marathi orthography.

Devanagari gets `line-height: 1.95` (and `2.1` for verses) rather than the Latin
default. This is not a stylistic preference: matras sit above the baseline and
conjuncts descend below it, and tighter leading clips them.

## Mobile-first

The product is used mostly on phones, so the phone layout is the default and
desktop is the enhancement, not the reverse.

- Primary navigation is a bottom tab bar on phones (reachable one-handed) and
  header links on desktop.
- `pb-[env(safe-area-inset-bottom)]` keeps tabs clear of the iPhone home
  indicator.
- Base font size is slightly larger than typical for long-form reading comfort.
- Reading measure is capped at roughly 60–65 characters.

Playwright runs against Pixel 7, iPhone 14 and desktop Chrome viewports.

## Planning for the Android app

The brief anticipates an Android app after the website. What makes that
straightforward later:

- All business rules live in Postgres (RLS, constraints) or in Server Actions,
  not in React components, so a native client inherits the same guarantees.
- Supabase has a first-class Android SDK that speaks to the same database and
  auth with the same policies.
- `content/` JSON is platform-neutral.
- Nothing about the schema is web-specific.

A native app can therefore be built against the existing database without
server changes. The PWA manifest also makes the site installable in the
meantime.

## Phases

| Phase | Scope                          | State       |
| ----- | ------------------------------ | ----------- |
| 1     | Foundation and UI shell        | Complete    |
| 2     | Schema and RLS                 | Blocked on Supabase project |
| 3     | Authentication                 | Pending     |
| 4     | Chapters and verses            | Pending     |
| 5     | Progress and timer             | Pending     |
| 6     | Classes                        | Pending     |
| 7     | Quizzes                        | Pending     |
| 8     | Admin dashboard                | Pending     |
| 9     | Testing and security review    | Pending     |
| 10    | Deployment documentation       | Pending     |

Each phase ends with `npm run verify` (typecheck, lint, unit tests) plus a
production build before moving on.
