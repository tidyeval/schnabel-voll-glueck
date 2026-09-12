# Progressively vary underwater encounters across three stages

Status: in_progress

Type: improvement

Priority: medium

Summary: The existing three-stage journey gradually demands more depth selection and timing through varied, readable underwater encounters with reachable escape routes.

## Goal

Keep the three existing stages and make repeated journeys less predictable while increasing challenge steadily. Players should progress from avoiding a single shark to navigating staggered or parallel pairs, choosing a gap, changing depth, or surfacing in time. Mistakes should be understandable from visible warning and movement.

The user specifically finds shark and turtle appearance patterns too repetitive and wants upper, middle, and lower underwater appearances, followed later by simultaneous or slightly staggered appearances on two depths. This task captures the subsequently accepted proposal; it does not authorize extra stages or a new difficulty-selection menu.

## Current evidence

At `e37e539`, `src/game.js` uses fixed encounter sequences and mostly fixed horizontal offsets. Fish and animal depth choices partly share one random variant. Sharks can converge toward Pip after spawning at different depths. The world-speed curve reaches its maximum after 90 active seconds.

A deterministic model journey using the existing route controller completed stages in approximately 62.0, 50.4, and 49.0 active seconds: about 161 seconds overall. These are a technical baseline, not human completion-time targets or proof of enjoyable difficulty.

After the first implementation, human playtesting found the journey still too easy. The second tuning pass therefore moves paired decisions earlier, rotates their open depth, reduces later encounter spacing, and shortens later warning windows while retaining a proven escape.

## Agreed direction

- Retain three stages: bay, harbor, and reef, with their existing visual identities.
- Use clearly separated upper, middle, and lower underwater bands. Allow modest variation within each band; do not expose fixed rails in the controls.
- Introduce single sharks first, then staggered pairs, then parallel pairs and alternating sequences. Initially cap simultaneous sharks at two; do not create a three-band shark wall.
- Keep turtles friendly and harmless. They may vary across the same bands and appear in groups, but cannot count as blocking hazards or as evidence that a route requires evasion.
- Preserve the recognizable passage in paired encounters. Tracking and lunges must not silently collapse it after the player commits; use constrained movement and readable anticipation.
- Vary complete encounter patterns, including bands and offsets, rather than independently randomizing every actor. Preserve introductions before combinations and avoid identical consecutive pattern/band assignments.
- Follow demanding pairs with an easier collecting and breathing opportunity. Fish routes should support genuine choices rather than repeatedly placing fish and sharks on the same route.
- Keep steering, cargo effects, and air capacity unchanged. Following Android playtesting, make sustained flight expensive and distinguish fatal obstacles from energy-draining contacts.

## Starting progression for tuning

Use active stage progress, not menu/pause/feeding time, to locate the following phases. Approximate 20-second thirds are a starting mental model, not fixed timers; changed pace can change stage duration.

| Stage | First third | Middle third | Final third |
| --- | --- | --- | --- |
| Bay | Single animals and broad escape routes | Single sharks on changing bands | First generously staggered shark pair after single-band behavior is established |
| Harbor | Reintroduce known forms with varied bands | Staggered pairs become more common | Introduce parallel pairs with a clearly readable passage |
| Reef | Consolidate known pairs | Alternate parallel and staggered patterns | More demanding combinations and shorter, still sufficient decision windows |

Start tuning world speed around 180 → 200 → 220 → 240 units/second across the journey's stage boundaries. Extend the rise through the third stage instead of reaching the maximum halfway through the second. Direct stage starts should use the same stage-entry baseline as a continuous journey. Derive actor offsets from actual travel time, cargo-dependent movement, and reaction allowance; do not assume a visually open gap is reachable.

These numeric values are tuning seeds. Record the final chosen values and rationale in the implementation results and update the current README behavior accordingly.

## Acceptance criteria

- [x] AC1: Exactly three playable stages remain. Sharks and turtles use all three underwater bands across representative seeded runs, with no identical consecutive encounter-form/band assignment and no reliance on turtles as damaging or blocking obstacles.
- [x] AC2: Single, staggered-pair, and parallel-pair encounters are observable in play and introduced in that order. Paired decisions begin by the middle of the bay, occur more frequently in later stages, rotate the open depth, and never activate more than two sharks.
- [x] AC3: World pace and encounter spacing become distinctly tighter across all three stages. Later warning windows shorten gradually but retain at least 0.45 seconds for a visible reaction; pauses, feeding, and menus do not advance progression.
- [x] AC4: Pair fish routes visibly communicate the changing safe passage while optional golden fish reward risk. Every pair remains escapable from representative entry states with full cargo under actual shark tracking and dash movement.
- [x] AC5: Multiple complete journeys remain finishable under normal energy and air rules with actual input control after the stronger tuning. Existing damage, tricks, banking, unlocks, and replay remain correct.
- [ ] AC6: Representative encounters remain readable in Chromium and WebKit at small mobile sizes and with reduced motion. Human playtesting covers the progression and repeated attempts; feedback on repetition, warning clarity, difficulty, and failure causes is recorded and material issues are addressed before declaring the balancing complete.
- [x] AC7: Flying drains 8 energy per second after the opening grace period, while underwater movement retains its 3-energy drain.
- [x] AC8: Direct contact with a shark, fisherman, reef, or diver immediately ends the current stage. Other harmful creatures retain one-time energy damage and contact protection.

## Proof

- AC1: Generate deterministic encounter traces for several seeds and inspect band coverage and consecutive signatures; retain harmless-turtle tests. Check appearances visually, not just actor spawn coordinates.
- AC2: Inspect traces and controlled browser scenes for introduction order, distinct bands, parallel/offset timing, and the maximum active shark count. Count actors across encounter boundaries, not only within one spawn operation.
- AC3: Assert phase-dependent pattern eligibility and pace continuity, including direct starts, replay, stage transitions, pause, and feeding. Inspect traces for recovery opportunities; do not demand monotonically harder individual encounters.
- AC4: Extend the existing model/controller checks with pattern-specific escape inputs, representative entry depths, empty/full cargo, relevant air states, and supported frame intervals. Include an explicit reaction delay before evasion and record the chosen allowance. Verify complete trajectories through moving paired hazards; do not use only static geometry or remove hazards for the proof.
- AC5: Reuse complete-route model tests and the real-input browser adventure check with representative seeds. Extend the controller only as necessary to react to visible hazards; it must not rewrite game state or rely on future hidden random choices. Run existing relevant rule and progress tests.
- AC6: Capture and inspect single, staggered, parallel, urgent-air, and recovery scenes at 320×568 and 390×844 in both engines, including reduced motion. Record human attempts across all stages and at least repeated journeys, noting hit timing, death causes, remaining air, perceived repetition, and whether the player understood the escape. Automated completion alone cannot establish this criterion.
- AC7: Compare dry and submerged exhaustion time from full energy with no pickups and verify that normal routes remain playable.
- AC8: Exercise each fatal contact and representative nonfatal creatures through the game model, asserting the end reason, end event, and retained energy damage behavior.

## Implementation order

1. Establish varied single-band appearances and reproducible encounter traces.
2. Add staggered pairs with movement-aware escape checks.
3. Add parallel pairs and retain their readable passages during attacks.
4. Tune progression, pace, and recovery across all three stages; validate normal runs and human feedback.

Keep these steps in this one owning task. Prefer small data descriptions and existing game/test mechanisms over a general procedural-generation framework, new dependencies, or external telemetry.

## Dependencies

[HUD readability](keep-hud-readable-on-small-screens.md) should be completed before final small-screen readability and human balancing acceptance, so unreadable air information does not confound feedback. Encounter modeling can proceed independently.

## Changed paths

- `src/game.js`
- `src/art.js`
- `src/main.js`
- `tests/game.test.js`
- `tests/lanes.test.js`
- `tests/pacing.test.js`
- `tests/route-controller.js`
- `tests/adventure.mjs`
- `tests/adventure-visual.mjs`
- `tests/polish.html`
- `README.md`
- `docs/tasks/progressively-vary-underwater-encounters.md`

## Actual results

- Kept the three stages and added stable upper, middle, and lower animal bands. Authored encounter traces vary band assignments and cap active sharks at two.
- Bay introduces a generously staggered pair; harbor adds recurring staggered and the first parallel pair; reef alternates both forms. Turtle and fish recovery waves follow demanding pairs.
- Sharks stay near their announced band during tracking and attack, so a chosen passage does not silently collapse. Pair spawning waits for an earlier shark to clear.
- Pace now rises continuously from 180 to 240 world units per second through 165 active journey seconds, with direct stage baselines at 0, 60, and 110 seconds. Pause, menu, and feeding time remain excluded.
- The first pass passed all pair variants with a 0.45-second reaction allowance, including full cargo, and 162 complete routes. Chromium and WebKit each completed all three stages with real key input, banking, replay, reload, and offline restart.
- Controlled contact sheets passed in both engines for single, staggered, parallel, recovery, and reduced-motion scenes. Human feedback found the first pass too easy; the stronger second pass requires renewed proof and playtesting.

## Second tuning pass results

- Moved the first staggered pair from the bay finale to encounter five and added a second bay pair. Pair counts now rise from two in the bay to three in the harbor and five in the reef; total sharks rise from six to eight to thirteen.
- Pair band selection remembers the previous opening and rotates it when necessary. Normal fish trace the open band, while the golden fish sits on an occupied band as an optional risk.
- Increased pace from 190 to 255 world units per second and reduced base spacing from 900 to 790. Pair warnings step down from 0.85 to 0.70 to 0.58 seconds, above the tested 0.45-second reaction allowance.
- Added real recovery distance after pairs and turtle groups, plus early warning space before blocking terrain. This preserved breathing and full-cargo escapes without removing the tighter hazard sequence.
- All 45 model tests passed, including 162 complete routes and every authored pair escape. Chromium and WebKit completed all three stages through real key input and passed banking, replay, reload, offline, mobile HUD, and reduced-motion checks.
- Renewed human playtesting of the second pass remains the only unchecked part of AC6.
- Android playtesting found sustained flight too safe. Flight now drains 8 energy per second after grace, compared with 3 underwater, limiting a full-energy flight to roughly 14.5 seconds.
- Shark, fisherman, reef, and diver contact now ends the stage immediately. Gull, jellyfish, pufferfish, surfer, driftwood, harpoon, hull, and net contacts retain their energy-damage behavior.
- All 47 model tests passed after the fatal-contact change. Eighteen representative safe routes covered every stage, empty/full cargo, and three frame intervals; the constrained buoy-coral-shark combination retains a clear middle passage.
- Chromium and WebKit each completed the full three-stage journey with real key input, then passed banking, replay, reload, and offline restart. Automated runs collected 94/83/70 fish in Chromium and 95/85/72 in WebKit.


## Third tuning pass — immediate pressure and menu music

Human feedback on 2026-09-12 still found the second pass too easy and too empty. This supersedes the earlier quiet opening: every stage now starts with a visible fisherman, followed within two seconds by a gull and upper-band shark. Opening fish lead beneath the boat. Turtle recovery groups also include a gull, and the total shark counts including opening actors are 7/9/14.

Base spacing now decreases from 700 to 580 world units, with 180 units before terrain, 90 after pairs/turtle groups, and 120 after the guarded corridor. All shark spawns enforce the two-active-shark cap, including single encounters following pairs. Speed, steering, energy and air rules are unchanged.

The supplied Move and Shake MP3 is bundled for the landing screen, nest delivery, stage results, final completion and game over. Gameplay keeps its existing soundtrack. Music settings control both tracks; pause/background suspends audio. The landing page attempts autoplay where allowed; a real tap or key unlocks a suspended mobile audio context. Menu music begins at nest feeding and is preserved when resuming feeding/settling; installation does not guarantee permission for audible autoplay.

Proof for this pass:

- All 49 model tests pass, including 18 complete routes across three stages, two cargo levels and three frame intervals; all authored pair escapes; and the two-shark cap over complete routes. The test controller now chooses a safe destination on its current side of a shark even when already close, instead of crossing the shark to seek greater clearance.
- Chromium and WebKit each completed all three stages using real input, plus banking, replay, reload and offline restart.
- Both bundled MP3s decode in Chromium and WebKit and match their source hashes. Real mobile browser input verifies menu activation, music mute/unmute, gameplay/result/home switches, and quitting after pause.
- Production build and native Android/iOS asset synchronization pass. Android debug APK builds with JDK 23 and the local Android SDK; both packaged MP3 hashes match their sources. Physical-device playtesting of difficulty and audio remains outstanding.
- A deterministic full-route sample has visible actors during 80%/81%/76% of non-final approach play; longest actor-free gaps are 1.50/1.43/1.63 seconds. This measures screen activity, not subjective difficulty.

Additional changed paths for this feedback: `src/audio.js`, `src/assets/menu-music.mp3`, `tests/music.mjs`.
