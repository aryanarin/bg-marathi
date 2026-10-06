# Android App (TWA)

The Android app is a **Trusted Web Activity (TWA)**: a thin native shell that
runs the live website `https://gita.bhakti.eu.org` fullscreen, with no browser
UI. It shares the **same Supabase backend** as the website — the same verses,
audio, users, admin, and auth. Every web deploy updates the app automatically.

- Package ID: `eu.org.bhakti.gita`
- Launcher name: भगवद्गीता
- Bound origin: `https://gita.bhakti.eu.org`
- App icon: the project logo (`logo/BG-Marathi Logo.png`)

## Why a TWA (not React Native / Capacitor)

The website is a server-rendered Next.js app with cookie-based auth. A TWA runs
the real site exactly as Chrome does, so auth, server actions, RLS, and session
refresh all work unchanged with zero backend changes and one codebase. See the
exploration notes in the project history for the full rationale.

## Prerequisites

Already installed on the build machine:

- JDK 17 (`C:\Tools\Java\jdk-17.0.12+7`)
- Android SDK (`C:\Tools\Android\Sdk`) with `build-tools;36.1.0` and
  `platforms;android-34`
- Gradle (the project also has a committed Gradle wrapper, `./gradlew`)

## Project layout

```
android/
  app/
    src/main/
      AndroidManifest.xml        TWA LauncherActivity + Digital Asset Links filter
      res/values/colors.xml      theme / splash / icon-background colours
      res/values/styles.xml      app theme (Material.Light.NoActionBar)
      res/values/asset_statements.xml  binds the web origin
      res/mipmap-*/              launcher icons (all densities, from the logo)
      res/drawable/splash.xml    splash screen
    build.gradle                 app module: TWA config, signing, androidbrowserhelper
  build.gradle                   root
  settings.gradle
  android.keystore               release signing key (DO NOT COMMIT / lose this)
  twa-manifest.json              Bubblewrap-style config (reference)
```

## Signing key

The release key lives at `android/android.keystore`:

- alias: `gita`
- store password: `gita2026`
- key password: `gita2026`
- SHA-256: `DF:D3:7A:BE:D8:F4:BA:29:CF:31:53:46:86:5E:33:2D:29:C1:49:4C:44:A3:07:B0:75:CD:2A:16:9E:FF:B9:59`

> Keep this keystore and its passwords safe and backed up. Publishing an update
> to the Play Store requires signing with the **same** key. The keystore is
> intentionally gitignored. Rotating the key means users must reinstall.

## Digital Asset Links

For the app to run without a browser address bar, the website serves
`/.well-known/assetlinks.json` (in `web/public/.well-known/assetlinks.json`),
which lists the app package and the signing key's SHA-256. It is already
deployed with the site. Verify:

```
https://gita.bhakti.eu.org/.well-known/assetlinks.json
```

If you ever re-sign with a different key, update the fingerprint in that file.

## Build

```bash
cd android
export JAVA_HOME="C:/Tools/Java/jdk-17.0.12+7"
export ANDROID_HOME="C:/Tools/Android/Sdk"

# Signed release APK (direct install / sideload):
./gradlew :app:assembleRelease

# Signed release AAB (Play Store upload):
./gradlew :app:bundleRelease
```

Outputs:

- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

A copy of the current release APK is kept at
`dist/bhagavad-gita-marathi-v1.0.0.apk`.

## Install on a device

1. Copy the APK to the phone (or `adb install`).
2. Enable "Install unknown apps" for the file manager / browser used.
3. Tap the APK to install.

```bash
# Over USB with debugging enabled:
"C:/Tools/Android/Sdk/platform-tools/adb" install -r dist/bhagavad-gita-marathi-v1.0.0.apk
```

On first launch the app verifies Digital Asset Links against the live site. If
verification passes, it opens fullscreen with no browser bar. (If it ever shows
a bar, the assetlinks.json or the signing fingerprint is out of sync.)

## Releasing an update

1. Bump `versionCode` (and `versionName`) in `android/app/build.gradle`.
2. Rebuild (`assembleRelease` for APK, `bundleRelease` for Play Store).
3. Because the app only wraps the website, **content and feature changes ship
   via the normal web deploy** — you only need a new APK/AAB for native-level
   changes (icon, name, target SDK, Play Store requirements).

## Play Store (optional, later)

- Upload the **AAB** to Play Console.
- Google re-signs with its own key under Play App Signing; add Google's
  SHA-256 to `assetlinks.json` as a second fingerprint when that happens.
- Prepare a store listing (icon, feature graphic, screenshots, description).
