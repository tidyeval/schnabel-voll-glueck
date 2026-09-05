# Visual polish · Ticket #1

Warm cream, coral and turquoise; softly shaded characters, expressive faces, articulated swimming/flying and restrained environmental movement. All existing character types were reviewed together in the contact sheets. Pip's outfits, full pouch, chicks, fisherman/net, diver and surfer are included.

## Acceptance evidence

| Criterion | Evidence and result |
| --- | --- |
| AC1 · Complete character treatment | Before/after contact sheets below. Reviewed faces, connected limbs, silhouette and consistent palette at game scale; all named character types represented. |
| AC2 · Animation and transitions | `tests/polish.html` is a reproducible animated preview: Pip flight/dive/cargo/trick, all animals, casting/aiming/surfing, feeding, low air and all outfits. Actual breach/trick/feeding state transitions also pass the game tests. |
| AC3 · Environment | Before/after menu and terrain images below. Warm sky/water, shaded clouds and foliage, uneven rock outlines, layered boulders, nest, wood and whirlpool reviewed. Terrain outlines are shared with collision detection. |
| AC4 · Readability and rules | 19/19 `npm test` checks passed, including whole-round safe routes, nets, fish cargo, air, trick completion and organic terrain corners. Dense-scene screenshot reviewed: upper/lower animals remain separated by a visible fish route. Difficulty, points and controls unchanged. |
| AC5 · Mobile and reduced motion | `node tests/polish-ui.mjs` passed in Chromium and WebKit at 320×568, 390×844 and 430×932, normal/reduced motion. Button bounds, no persistent hint block, frozen paused canvas and low-air HUD checked. `tests/polish.mjs` also checks that reduced-motion terrain stays visually static. |
| AC6 · Stability, offline and performance | Build and `npm run test:browser` passed in Chromium/WebKit. `node tests/pwa.mjs` passed real waiting-worker activation, offline recovery and preserved records. Frame measurements are recorded below. |

Additional user changes: a raised warm-gold **Los gehts!** button; permanent control/trick instructions removed from the start page and retained in settings; low air communicated by Pip's concerned face, breath bubbles, a pulsing air display and the existing short sound, without the large low-air text popup. Reduced motion retains the concerned face and numeric warning without animated breath bubbles. General one-time onboarding/event-feedback changes remain a proposal, outside this visual delivery.

## Visual comparisons

[Characters before](polish/characters-before.png) · [Characters after](polish/characters-after.png)

[World before](polish/world-before.png) · [World after](polish/world-after.png)

[Terrain before](polish/terrain-before.png) · [Terrain after](polish/terrain-after.png)

[Animation states](polish/animation-states.png) · [Dense scene](polish/dense.png) · [320px start](polish/start-320.png) · [Low air](polish/low-air.png)

## Reproduce

Baseline: commit `206168d439c345bfa5e182775e3dc18974c0fae1`.

```sh
mkdir -p test-results/polish/before
git show 206168d:src/art.js > test-results/polish/before/art.js
git show 206168d:src/game.js > test-results/polish/before/game.js
npm run dev -- --port 5175
# In another terminal:
node tests/polish.mjs before
node tests/polish.mjs after
# For visual captures without repeating measurement:
POLISH_SHOTS_ONLY=1 node tests/polish.mjs after
```

Open `http://localhost:5175/tests/polish.html` for the animation preview. Add `?stage=before` for the baseline. Select scenes/outfits, pause or enable reduced motion. The preview isolates visual states; it is not a playable round. Production interaction checks use `npm run build`, the preview server on port 4173, `npm run test:browser`, `node tests/polish-ui.mjs` and `node tests/pwa.mjs`.

## Performance

30 seconds per identical dense scene and browser, same host, no simulated clock. Apple M3 Max, macOS arm64, viewport 390×844, device scale 2, canvas backing resolution 960×1700. Timing is requestAnimationFrame p95, not a physical Android/iPhone benchmark. Raw results: [before](polish/performance-before.json), [after](polish/performance-after.json). Physical mobile-device performance remains unverified.

| Browser | p95 before | p95 after | Result |
| --- | --- | --- | --- |
| chromium 153.0.8010.12 | 16.8 ms | 16.7 ms | PASS, within 20% limit |
| webkit 26.6 | 18.0 ms | 18.0 ms | PASS, within 20% limit |
