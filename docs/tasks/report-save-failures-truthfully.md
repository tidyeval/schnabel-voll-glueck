# Report save failures truthfully

Status: ready_to_land

Type: bugfix

Priority: high

Summary: Results confirm persistence only after a successful write and retain an actionable failure message otherwise.

## Goal

Let players distinguish completing a stage in memory from saving it durably, and retry a failed save without duplicating rewards.

## Evidence

Review of `e37e539`: with `Storage.prototype.setItem` throwing `QuotaExceededError`, a real-input completed stage displayed “Dein Fortschritt ist gespeichert.” while the stored value remained null. The separate error toast disappeared after three seconds. `persist()` does not return an outcome to `finish()`.

## Acceptance criteria

- [x] AC1: A failed write never produces a successful-save claim; the result dialog retains a visible and accessible failure message until resolution or dismissal.
- [x] AC2: A retry after storage becomes available saves the completed result exactly once, including fish, records, and stage unlocks, and replaces the failure state with confirmed success.
- [x] AC3: Persistent storage failure does not crash gameplay or prevent replay; successful saves retain normal progression and result behavior.

## Proof

- AC1: Complete a real-input stage with a forced write failure; assert absent storage and persistent error state after more than three seconds.
- AC2: Restore writes and retry twice; reload and assert exact fish totals, records, and completion.
- AC3: Exercise continued failure and a normal save in Chromium and WebKit; reuse relevant progress and browser checks.

## Dependencies

Implement after [cross-tab persistence](preserve-progress-across-tabs.md), reusing its persistence ownership and idempotency behavior.

## Changed paths

- `src/main.js`
- `src/progress.js`
- `index.html`
- `src/style.css`
- `tests/progress-browser.mjs`
- `docs/tasks/report-save-failures-truthfully.md`

## Actual results

- The result dialog now reports failed persistence persistently and exposes an accessible retry action.
- A successful retry replaces the failure message and the attempt ledger prevents duplicate fish, records, or unlocks.
- Chromium and WebKit passed forced persistent failure, recovery, repeated retry, reload, and normal-save checks.
