# Version all precached assets

Status: ready_to_land

Type: bugfix

Priority: high

Summary: Changes to any precached public file produce an installable service-worker update.

## Goal

Make offline cache versions reflect the actual delivered contents, including public icons and the web manifest, while preserving user-controlled activation and existing saves.

## Evidence

Review of `e37e539`: two isolated builds with only the public manifest description changed emitted different manifests but identical service workers. `vite.config.js` hashes the bundle without public-file contents. `tests/pwa.mjs` forces update detection by appending a deployment comment, so it does not establish build-driven detection.

## Acceptance criteria

- [x] AC1: Changing only the manifest or a precached icon changes the emitted service worker/cache version; identical delivered contents produce the same version.
- [x] AC2: An existing installation detects a real public-file-only deployment, waits for explicit activation, and serves the new content after activation and an offline restart.
- [x] AC3: Updates retain progress and unrelated origin caches and work at both `/` and the repository's Pages base path.

## Proof

- AC1: Build isolated fixtures with unchanged contents, a manifest-only change, and an icon-only change; compare the emitted cache identifiers.
- AC2: Extend the PWA check to serve two actual builds instead of relying solely on synthetic worker comments; inspect the cached response offline.
- AC3: Reuse scoped-cache/progress checks and run local hosting checks at both configured bases.

## Changed paths

- `vite.config.js`
- `scripts/sw-template.js`
- `tests/pwa.mjs`
- `tests/hosting.mjs`
- `docs/tasks/version-all-precached-assets.md`

## Actual results

- The offline version now hashes sorted emitted bundle contents plus every public precache input: the manifest and all three icons.
- Isolated-build tests proved deterministic versions and version changes for manifest-only, icon-only, and bundle changes.
- A real two-deployment PWA test passed explicit waiting-worker activation, offline restart, progress retention, and scoped-cache behavior; root and Pages-base hosting checks passed.
