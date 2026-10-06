# Native Android App (React Native / Expo)

A true native Android app (not a webview) that shares the **same Supabase
backend** as the website — the same chapters, verses, audio, users, progress,
quizzes, classes, and admin role. A learner signs in on the web or the app and
sees the same account and progress, because both talk to the same database
(`mjavrqbierktlafrkoxu`) with the public anon key under row-level security.

- Framework: Expo SDK 57, React Native 0.86, expo-router, TypeScript
- Location: `mobile/`
- Android package: `eu.org.bhakti.gita.app` (distinct from the TWA
  `eu.org.bhakti.gita`, so both can coexist)
- App icon + splash: the project logo

## Architecture

| Concern | How |
| --- | --- |
| Auth | `@supabase/supabase-js` `signInWithPassword` / `signUp`, token-based, session persisted in AsyncStorage (`src/lib/supabase.ts`, `src/lib/auth.tsx`) |
| Data | Same tables + RPCs as web (`src/lib/data.ts`, `src/lib/admin-data.ts`) |
| Progress writes | `set_verse_progress`, `record_reading_session` RPCs |
| Quiz submit | `submit_quiz_attempt` RPC (answer key only revealed post-submit) |
| Audio | `expo-audio` `useAudioPlayer` streaming the public Storage mp3s |
| Navigation | `expo-router` file routes in `src/app/` |
| Admin | role-gated screens (`profiles.role === 'admin'`) |

The anon key and Supabase URL are public (safe to ship; RLS enforces access).
They live in `mobile/.env` (`EXPO_PUBLIC_*`) with hardcoded fallbacks in
`src/lib/config.ts`, so the app builds even without the env file.

## Screens

- Auth: login, register, forgot password (Marathi)
- Tabs: Dashboard (progress summary, next class, recent quiz), Chapters,
  Progress, Quizzes, Classes
- Chapter detail: verse list with read/memorized indicators
- Verse reader: Sanskrit (with line breaks), word-to-word, translation,
  purport, easy explanation, example; audio player; mark read/memorized;
  reading-time tracking; prev/next
- Quiz: intro + past attempts → answer MCQs → submit → results with
  explanations → retake
- Classes: join the meeting link
- Admin: verse editor, chapter publish toggle, class/quiz publish management

## Run locally (development)

```bash
cd mobile
npm install
npx expo start          # scan the QR with Expo Go for a quick preview
```

> Expo Go includes the native modules used here (expo-audio, async-storage,
> vector-icons), so most of the app runs in Expo Go. For a production-faithful
> build, use the EAS build below.

Checks:

```bash
npm run typecheck       # tsc --noEmit
npm run lint            # expo lint
npx expo-doctor         # project/dependency validation (expects 21/21)
```

## Build an installable APK with EAS (cloud)

EAS builds, signs, and returns an APK/AAB from the cloud — no Android Studio
needed. This requires a **free Expo account** (your login).

```bash
cd mobile

# 1. Log in (one time)
npx eas-cli@latest login

# 2. Link the project (one time) — creates the EAS project + projectId
npx eas-cli@latest init

# 3. Build a signed APK you can install directly (preview profile)
npx eas-cli@latest build --platform android --profile preview
```

- EAS generates and stores the Android signing keystore for you (Expo-managed
  credentials) — you don't manage a keystore by hand.
- When the build finishes, EAS prints a URL to download the `.apk`. Install it
  on any Android phone (enable "install unknown apps").

### Play Store build

```bash
npx eas-cli@latest build --platform android --profile production
```

This produces an `.aab` (the `production` profile uses `app-bundle` and
`autoIncrement`). Upload it in Play Console, or use
`npx eas-cli@latest submit --platform android` after configuring submit
credentials.

## Build profiles (`eas.json`)

- `development` — dev client APK for debugging with native modules
- `preview` — internal-distribution **APK** for sideloading/testing
- `production` — **AAB** with auto-incrementing version code for the Play Store

## Updating

- JS/UI changes can ship over-the-air with `npx eas-cli@latest update` (after
  `eas update:configure`), without a new store submission.
- Native changes (new native module, SDK bump, icon/permission changes) need a
  new build.

## What the user must run

Everything is prepared. The only steps that need your Expo account:

1. `cd mobile && npx eas-cli@latest login`
2. `npx eas-cli@latest init`
3. `npx eas-cli@latest build --platform android --profile preview`

Then download and install the APK from the link EAS prints.
