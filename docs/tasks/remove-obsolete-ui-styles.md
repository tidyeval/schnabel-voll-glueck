# Remove obsolete UI styles

Status: ready_to_land

Type: improvement

Priority: low

Summary: The source stylesheet contains readable rules for supported UI states without obsolete removed-element styles.

## Goal

Make targeted layout changes easier by removing confirmed unused rules and organizing active rules while preserving the rendered UI and cascade behavior. Keep historical screenshots and acceptance documents.

## Evidence

Review of `e37e539` found styles for removed mission, tutorial, wordmark, and control-hint elements with no live HTML/JavaScript consumers. Tests explicitly assert the absence of mission/control-hint elements. Menu rules are repeatedly overridden in a largely compressed source stylesheet. Hidden wardrobe styling is not automatically dead code.

## Acceptance criteria

- [x] AC1: Rules used only by confirmed removed elements are absent; all retained selectors have a live element, dynamic state, or supported preview consumer.
- [x] AC2: Active source CSS is formatted and organized for local editing without changing computed layout, interaction, or reduced-motion behavior.
- [x] AC3: Existing menu, gameplay, settings, result, installation, and retained wardrobe states remain visually equivalent at supported mobile sizes.

## Proof

- AC1: Inspect HTML, JavaScript-generated classes, and preview consumers before deleting each rule family; record the removed families.
- AC2: Compare relevant computed styles and run existing UI checks. Preserve cascade order unless equivalence is established.
- AC3: Capture before/after states in Chromium and WebKit at 320×568, 390×844, and 430×932, including reduced motion; inspect differences. No new screenshot infrastructure is required.

## Dependencies

Prefer execution after [HUD readability](keep-hud-readable-on-small-screens.md) and after the [wardrobe decision](reconcile-wardrobe-and-record-visibility.md). Take the visual baseline from the then-current accepted UI.

## Changed paths

- `src/style.css`
- `docs/tasks/remove-obsolete-ui-styles.md`

## Actual results

- Removed the mission, tutorial, wordmark, control-hint, basic-controls, touch-icon, hint-wave, and bottom-note rule families after checking live HTML, JavaScript classes, and preview consumers.
- Reformatted the retained stylesheet to one rule per line while preserving cascade order.
- Chromium and WebKit passed menu, gameplay, settings, result, install/update, wardrobe, reduced-motion, and mobile screenshot checks.
