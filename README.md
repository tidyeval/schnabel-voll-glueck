# Schnabelglück · Phaser + Matter

Separate experimental edition. The previous game, its release, saves and native app stay intact. This worktree has experiment-specific storage/cache keys and a different native app identifier. Deployment workflows are disabled; nothing is published automatically.

The shared platform source and authoritative design are maintained in `../game-platform/ARCHITECTURE.md`. The exact package archive is tracked under `vendor/`; a standalone checkout needs no sibling directory to build. Edit the shared source, pack a new version and adopt that archive rather than editing vendored copies.

```sh
npm ci
npm run dev
npm test
npm run build
```

Phaser owns scheduling; Matter owns physical integration and collision. Existing procedural art and game rules are retained. Passing the inherited tests alone does not certify a completed migration. Phone performance and game feel still need real-device acceptance.

The pre-migration README is retained at [docs/README-before-phaser-matter.md](docs/README-before-phaser-matter.md) as historical context; its feature and validation claims do not describe this experimental edition.


## Native experimental builds

Synchronize the production web build with `npm run native:sync`. Android: run `./gradlew assembleDebug` in `android/` with JDK 21 or newer and `ANDROID_HOME` set to the Android SDK. The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`.

For an unsigned iOS simulator build:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /tmp/schnabelglueck-phaser-matter-ios CODE_SIGNING_ALLOWED=NO build
```

Android debug and iOS simulator builds passed on 2026-11-11. Simulator installation and app launch were also checked with the separate experimental app ID. Physical-device installation, audio and performance remain open. These commands do not publish the app.
