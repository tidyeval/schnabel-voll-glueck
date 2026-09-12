# Keep the HUD readable on small screens

Status: ready_to_land

Type: improvement

Priority: medium

Summary: A compact shared status panel communicates energy and diving air without an in-play combo badge.

## Goal

Reduce visual competition with the game world. Keep energy and air mechanically separate, but present them in one compact status panel: energy is always visible and air appears only while relevant. Remove the in-play combo badge while retaining combo scoring and the end-of-round best-series result.

## Evidence

Review of `e37e539` at 320×568: computed energy label/value size was 5.44 CSS px, air label 4.96 px, and air value 7.36 px. Existing layout checks establish fit but do not catch these sizes. Menu text already uses bounded font sizes.

## Revised acceptance criteria

- [x] AC1: No combo badge or multiplier appears during play. Combo scoring and the end-of-round best-series value remain unchanged.
- [x] AC2: Energy and air share one compact status panel. Energy remains visible, air appears only while diving or refilling, and urgent air remains unmistakable without merging the two resources.
- [x] AC3: Labels remain at least 10 CSS px and values at least 12 CSS px. The panel and its contents fit without overlap at 320×568, 390×844, and 430×932 in normal and reduced-motion modes.

## Proof

- AC1: Assert that the in-play combo element is absent while model scoring and result output still report the best series.
- AC2: Exercise dry, normal-air, and urgent-air states and verify visibility, independent progress values, and pause behavior.
- AC3: Assert computed sizes and panel/content bounds, then inspect screenshots at all supported sizes in Chromium and WebKit.

## Changed paths

- `src/style.css`
- `src/main.js`
- `index.html`
- `tests/menu-ui.mjs`
- `tests/polish-ui.mjs`
- `docs/tasks/keep-hud-readable-on-small-screens.md`

## Previous proof

The first readability pass established bounded type sizes and separate non-overlapping energy, air, and combo elements. User playtesting then found the combo confusing and the separate energy/air layout too large; the revised criteria supersede that layout.

## Actual results

- Removed the in-play combo element and its update path. Combo points remain unchanged, and Chromium/WebKit verified that the best series still appears in the result dialog.
- Replaced the detached energy bar and air card with one shared panel. Its energy row is permanent; its air row appears while diving or refilling and changes to `AUFTAUCHEN` when urgent.
- At 320×568 the two-row urgent panel remains at most 64 CSS px high. Chromium and WebKit passed label/value minima, internal bounds, dry/dive/urgent states, pause, reduced motion, and screenshots at all three supported mobile sizes.
