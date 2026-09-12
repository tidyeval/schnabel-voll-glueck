# Preserve progress across browser tabs

Status: ready_to_land

Type: bugfix

Priority: high

Summary: Settings changes and completed attempts preserve progress saved by other open tabs.

## Goal

Prevent stale in-memory preferences from replacing newer saved fish, stage records, and unlocks. Keep the existing save format readable and the local-only product model.

## Evidence

Review of `e37e539`: `src/main.js` loads preferences once and `persist()` writes the entire snapshot. In both Chromium and WebKit, one tab banked 2 fish and a 20-point record; changing music in an older second tab replaced both with zero.

## Acceptance criteria

- [x] AC1: Changing one setting in an older tab preserves newer fish totals, stage records, unlocks, and unrelated preferences from another tab.
- [x] AC2: Two distinct attempts completed in separate tabs each contribute their fish exactly once, including overlapping save operations; stage records and completion never regress.
- [x] AC3: Repeated completion handling cannot credit an attempt twice. Existing saves and difficulty-record migration remain supported.

## Proof

- AC1: Reproduce the two-tab sequence in Chromium and WebKit and assert the complete persisted state after changing a setting.
- AC2: Exercise overlapping attempt saves and reload both tabs; check the exact combined fish total, maximum records, and unlocked stages. A stale-read fix alone is insufficient proof of concurrent safety.
- AC3: Reuse progress tests and add only the missing cross-tab/idempotency cases; run the existing browser adventure check.

## Changed paths

- `src/main.js`
- `src/progress.js`
- `tests/progress.test.js`
- `tests/progress-browser.mjs`
- `docs/tasks/preserve-progress-across-tabs.md`

## Actual results

- Added an append-only per-attempt ledger and idempotent attempt identifiers while retaining the existing `pelican-v1` snapshot format.
- Settings writes merge the latest stored progress, and storage events refresh open tabs.
- Chromium and WebKit passed the stale-tab, three-attempt overlap, reload, and duplicate-retry scenarios. Unit progress tests and the full browser smoke check also passed.
