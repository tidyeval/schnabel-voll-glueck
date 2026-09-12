# Reconcile wardrobe and stage-record visibility

Status: ready_to_land

Type: improvement

Priority: medium

Summary: Align the accessible menu, documented rewards, and tests with the intended wardrobe and stage-record behavior.

## Goal

Resolve the discrepancy between implemented/persisted outfit rewards and their inaccessible menu entry, together with the permanently hidden stage record.

## Evidence

At `e37e539`, `index.html` marks `wardrobe` and `stage-best` as hidden and `src/main.js` never reveals them. The README describes outfit unlocks and the wardrobe; the browser test explicitly requires the wardrobe to remain hidden. Commit `ae5735d` introduced these hidden attributes with the former difficulty selector. This establishes the change, not the current product rationale.

## Open decisions

- Should players again access the wardrobe, should it move to settings, or should the feature remain unavailable and its documentation change?
- Should the selected stage's best score be visible, and where should it appear?
- If access remains removed, which persisted outfit behavior must remain for existing players?

## Decision

Restore the wardrobe as a menu action and show the selected stage's best score below the stage selector. This follows the implemented reward model and current README. Preserve all existing outfits and unlock thresholds.

## Acceptance criteria

- [x] AC1: The menu exposes the wardrobe, shows the selected stage's best score, and updates that score when the selected stage changes.
- [x] AC2: Locked outfits remain unavailable; unlocked outfits can be selected and remain selected after reload without changing gameplay behavior.
- [x] AC3: The restored controls fit supported small screens alongside install/update controls and remain keyboard accessible in Chromium and WebKit.

## Proof

- AC1: Seed distinct stage records, change the stage selection, and assert the visible matching score.
- AC2: Exercise locked and unlocked outfit selection, reload, and inspect the selected outfit preference and rendered Pip state.
- AC3: Extend the existing 320×568, 390×844, and 430×932 menu checks in Chromium and WebKit, including keyboard interaction.

Do not remove stored possessions. The implementation must be checked for unlock thresholds, selection persistence, and small-screen layout.

## Changed paths

- `index.html`
- `src/main.js`
- `src/style.css`
- `README.md`
- `tests/browser.mjs`
- `tests/menu-ui.mjs`
- `docs/tasks/reconcile-wardrobe-and-record-visibility.md`

## Actual results

- Restored the wardrobe menu action and the selected stage's visible best score.
- Locked outfits remain disabled; unlocked selections persist and visibly change Pip.
- Chromium and WebKit passed stage-record switching, keyboard wardrobe access, outfit persistence, install/update coexistence, and all supported small-screen layouts.
