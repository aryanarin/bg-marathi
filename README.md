# श्रीमद्भगवद्गीता — Bhagavad Gita Learning Platform

A web platform for studying the Bhagavad Gita in Marathi. Learners read verses
with word-to-word meaning, translation, purport and Sanskrit audio; track what
they have read and memorized; attend scheduled online classes; and attempt
quizzes after each class.

One administrator manages all content, classes and quizzes.

## Status

**Phase 1 complete** — project foundation and UI shell.

| Phase | Scope | State |
| ----- | ----- | ----- |
| 1 | Foundation, design system, UI shell, content validator | **Complete** |
| 2 | Supabase schema and Row Level Security | Blocked — needs a Supabase project |
| 3 | Authentication | Pending |
| 4 | Chapters and verses | Blocked — needs source content |
| 5 | Progress and reading timer | Pending |
| 6 | Classes | Pending |
| 7 | Quizzes | Pending |
| 8 | Admin dashboard | Pending |
| 9 | Testing and security review | Pending |
| 10 | Deployment | Pending |

Phase 1 verification: 46 unit tests, 15 end-to-end tests, typecheck, lint and
production build all pass.

### What blocks the next phases

Two things need you, not me:

1. **A Supabase project** — see `docs/setup.md`. Blocks Phase 2 onward.
2. **The Marathi source text** — the requirements email references
   `bhagvad-gita-marathi-_compress.pdf`, which was not included in the shared
   folder. Verse text, word-to-word, translation and purport all come from it,
   and I will not fabricate scripture. Blocks Phase 4 content.

One decision is also open: **audio hosting**. Google Drive share links do not
work as audio sources; Supabase Storage is recommended. See
`docs/content-import.md`.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase (Postgres, Auth, RLS) · Zod · react-hook-form · Vitest · Playwright ·
deployed on Vercel.

No separate backend, no ORM, no Redis, no Docker in production, no CMS, and no
Google Meet or Zoom API integration — the administrator simply pastes a meeting
link.

## Getting started

```bash
cd web
npm install
npm run dev
```

The site runs at http://localhost:3000. It deliberately boots and serves public
pages **without** Supabase configured, so you can verify the toolchain before
setting up a database. Private routes redirect to sign-in until Supabase is
configured (failing closed, not open).

To connect a database, follow `docs/setup.md`.

## Commands

Run from `web/`:

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve a production build |
| `npm run verify` | Typecheck + lint + unit tests |
| `npm run typecheck` | TypeScript, no emit |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests, watch mode |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run content:validate` | Validate `content/*.json` before import |

`npm run verify` is the gate to run after any change.

## Layout

```
.
├── content/              Scripture JSON, one file per chapter
├── docs/                 Documentation (start with architecture.md)
├── supabase/migrations/  SQL migrations, applied in filename order
└── web/                  The Next.js application
    ├── scripts/          CLI scripts (content validation, import)
    ├── src/
    │   ├── app/          Routes; directory structure defines URLs
    │   ├── components/   ui/ primitives, layout/ shell
    │   ├── lib/          auth, content, supabase, validation, types
    │   └── proxy.ts      Session refresh (Next.js 16 renamed middleware)
    └── tests/            unit/ (Vitest), e2e/ (Playwright)
```

`web/` is a subdirectory so a future `mobile/` Android app can sit beside it and
share `content/` and the Supabase schema.

## Documentation

| Document | Read it for |
| -------- | ----------- |
| [`docs/architecture.md`](docs/architecture.md) | How the system works and why. **Start here.** |
| [`docs/database.md`](docs/database.md) | Schema, indexes and the RLS security model |
| [`docs/setup.md`](docs/setup.md) | Getting from nothing to a working local site |
| [`docs/deployment.md`](docs/deployment.md) | Deploying to Vercel |
| [`docs/content-import.md`](docs/content-import.md) | Content format, validation, audio hosting |
| [`docs/admin-guide.md`](docs/admin-guide.md) | Using the admin interface |
| [`docs/email-setup.md`](docs/email-setup.md) | SMTP for authentication emails |

Each document marks tasks as **[YOU]** (manual action) or **[AGENT]** (my work),
so it is always clear who does what.

## Security summary

Authorization is enforced in three independent layers, so no single failure
exposes data:

1. **Postgres Row Level Security** — the real boundary. The browser only ever
   holds the anon key, so the database decides what each user may read or write,
   even for direct API calls.
2. **Server-side guards** — `requireUser()` / `requireAdmin()` read the role from
   the database. A role is never taken from any client-supplied value.
3. **Proxy redirects** — a convenience that avoids wasted renders. Explicitly
   *not* relied upon, because proxy matchers also gate Server Actions.

Specific protections worth knowing about:

- A user cannot promote themselves to admin. Column-level grants make `role`
  unwritable by learner accounts, backed by a trigger.
- Quiz answer keys are not readable by learner accounts at the database level,
  not merely hidden in the UI.
- A submitted quiz attempt is immutable.
- Meeting URLs must be `https://`, which blocks `javascript:` and `data:` URLs.
- The service-role key is guarded by `server-only` imports and a runtime
  browser check.

See `docs/architecture.md` and `docs/database.md` for the reasoning.

## Design

Warm parchment surfaces, temple gold accents, saffron for actions, and aged-ink
text rather than pure black. Mobile-first: a bottom tab bar on phones, header
navigation on desktop.

Typography is three families with distinct jobs — Literata for Latin body text,
Noto Sans Devanagari for Marathi prose, and Tiro Devanagari Marathi for verse
display. Devanagari gets noticeably looser line height than Latin, because
matras sit above the baseline and conjuncts descend below it; tighter leading
clips them.

Accessibility is built in rather than retrofitted: semantic landmarks, one `<h1>`
per page, a skip link, visible focus rings, 44px minimum touch targets, and zoom
deliberately left enabled.

## Contributing

Work phase by phase. After each phase: `npm run verify`, then `npm run build`,
then update the relevant docs, then commit.

The priority order for any tradeoff is: correctness, security, simplicity,
mobile usability, content readability, maintainability, performance, visual
polish. Simplicity above performance is deliberate — this serves a study group,
not a million users.

## Content attribution

Verse text, translations and purports are based on *Bhagavad-gītā As It Is* by
His Divine Grace A. C. Bhaktivedanta Swami Prabhupāda, Marathi edition. Content
is supplied by the project owner; none of it is generated.
