# Avoid redrawing unchanged paused frames

Status: ready_to_land

Type: improvement

Priority: low

Summary: A paused game redraws the canvas only when a visible change requires it.

## Goal

Remove repeated full-scene drawing during an unchanged pause without changing simulation timing, resumed input, or necessary resize rendering. Keep the change local; a new rendering framework is unnecessary.

## Evidence

At `e37e539`, `src/main.js` invokes `drawWorld()` on every animation frame regardless of pause state. A paused Chromium/WebKit probe counted 62/63 canvas `clearRect()` calls per simulated second. This measures redundant work, not a battery-saving percentage.

## Acceptance criteria

- [x] AC1: After the initial paused frame, an unchanged paused game performs no additional full-scene canvas redraws over one simulated second.
- [x] AC2: Resizing during pause redraws a correct, nonblank frozen scene; resuming immediately restores drawing and input without advancing the simulation by the paused duration.
- [x] AC3: Pause via button, Escape, settings, or focus loss preserves the same frozen game state and audio behavior. Overlay/toast behavior remains functional.

## Proof

- AC1: Count canvas redraws after entering pause in Chromium and WebKit; compare with the recorded 62/63-call baseline.
- AC2: Exercise paused resize and resume, checking canvas content, breath, energy, and elapsed game time.
- AC3: Reuse and extend the existing pause checks only for uncovered triggers; run the normal browser smoke check.

## Changed paths

- `src/main.js`
- `tests/polish-ui.mjs`
- `tests/browser.mjs`
- `docs/tasks/avoid-redrawing-unchanged-paused-frames.md`

## Actual results

- A paused frame is redrawn only when the canvas is invalidated, such as after resize.
- Chromium and WebKit recorded zero repeated clears during an unchanged paused second and exactly one clear after explicit resize.
- Button, Escape, settings, focus-loss, audio, frozen-state, breath, and resumed-input browser checks passed.
