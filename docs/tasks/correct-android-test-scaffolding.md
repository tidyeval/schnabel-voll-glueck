# Correct Android test scaffolding

Status: ready_to_land

Type: bugfix

Priority: low

Summary: The Android package-identity test targets the actual game and the unrelated arithmetic sample is removed.

## Goal

Keep the existing native test entry point truthful without treating package identity as proof of gameplay, haptics, or lifecycle handling.

## Evidence

At `e37e539`, `ExampleInstrumentedTest.java` expects `com.getcapacitor.app`, while `android/app/build.gradle` sets `applicationId` to `de.pelican.game`. `ExampleUnitTest.java` tests only `2 + 2 == 4`. The review did not run Android instrumentation.

## Acceptance criteria

- [x] AC1: The instrumented package-identity assertion passes against the configured game application on an Android emulator or device.
- [x] AC2: The unrelated arithmetic sample is removed; test discovery still includes the package-identity check.

## Proof

- AC1: Run the repository's connected Android instrumentation task with the required local SDK/JDK and an available emulator/device; record the actual result and environment.
- AC2: Inspect test discovery/output and confirm that only the irrelevant arithmetic sample was removed. Package identity protection remains; no gameplay protection was supplied by that sample.

If native execution is unavailable, leave AC1 unproven rather than reporting a successful native test based on source inspection.

## Changed paths

- `android/app/src/androidTest/java/de/pelican/game/AppIdentityTest.java`
- `android/app/src/test/java/com/getcapacitor/myapp/ExampleUnitTest.java`
- `docs/tasks/correct-android-test-scaffolding.md`

## Actual results

- Removed the unrelated arithmetic sample and replaced the stale Capacitor package assertion with `de.pelican.game.AppIdentityTest`.
- `:app:connectedDebugAndroidTest` discovered and passed one test on `Medium_Phone_API_36` (Android 16) using the local Android SDK and OpenJDK.
