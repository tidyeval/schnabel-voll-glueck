# Localize Schnabelglück in English and Spanish

Status: done

Type: feature

Summary: Let players choose German, English, or Spanish from the start screen and play the complete game in the selected language.

## Goal

Replace the start-screen wardrobe action with a compact row of small, round German,
British/English, and Spanish flag buttons. Switching the language updates every
player-facing game text and accessibility label without reloading or affecting
progress.

Localize the game title together with the rest of the interface: `Schnabelglück` in
German, `Happy Beak` in English, and `Pico Feliz` in Spanish.

## Product decisions

- Supported locales are German (`de`), English (`en`), and Spanish (`es`).
- The localized game titles are `Schnabelglück` (`de`), `Happy Beak` (`en`), and
  `Pico Feliz` (`es`). This applies to the visible logo, browser/document title,
  metadata, and accessible game name.
- German remains the initial fallback so existing players see today's language until
  they choose another one.
- The selected language is stored locally and restored on the next visit.
- The three language choices use round flag controls, visibly mark the active choice,
  and include localized accessible names so the flags are never the only label.
- Remove the wardrobe action from the start screen. Do not delete or reset existing
  outfit selections, unlocks, fish totals, or other progress.
- Moving the wardrobe elsewhere or redesigning outfit rewards is out of scope.
- The boat name `LÜTTE LOTTE` and the character name `Pip` remain proper names.

## Acceptance criteria

- [x] AC1: The start screen shows three small, round, keyboard-operable language
  controls for German, English, and Spanish in the space formerly occupied by the
  wardrobe action; exactly one control is visibly and programmatically selected.
- [x] AC2: Choosing a language immediately localizes the start screen, stage names,
  HUD, pause/settings/install dialogs, result and failure messages, update/offline
  notices, instructions, buttons, units, number formatting, localized game title,
  document metadata, and relevant ARIA labels in German, English, or Spanish.
- [x] AC3: A selected language survives reload and a new browser session; missing,
  malformed, or unsupported stored values safely fall back to German.
- [x] AC4: The start screen no longer exposes `Pips Garderobe`; changing language
  leaves scores, stage progress, fish totals, unlocks, settings, and any previously
  selected outfit unchanged.
- [x] AC5: All three localized layouts fit the supported small-screen sizes without
  clipped, overlapping, or horizontally scrolling controls and remain usable by
  keyboard in Chromium and WebKit.
- [x] AC6: Existing gameplay, progress persistence, install/update behavior, and
  offline build checks continue to pass.

## Proof

- AC1: A focused browser test inspects all three flag controls, their round styling,
  accessible names, keyboard activation, and selected state.
- AC2: The browser test switches through `de`, `en`, and `es` and asserts
  representative static and dynamic text from the menu, each stage, HUD, settings,
  pause, result/failure, persistence errors, and PWA notices, together with
  `document.documentElement.lang`, the corresponding `Schnabelglück`, `Happy Beak`,
  or `Pico Feliz` title, and localized accessibility labels.
- AC3: Select English and Spanish in separate runs, reload, and assert restoration;
  inject invalid stored locale values and assert the German fallback.
- AC4: Seed progress and an unlocked selected outfit, change languages, reload, and
  assert that the wardrobe action stays absent while the stored gameplay preferences
  and progress are unchanged.
- AC5: Exercise every language at 320×568, 390×844, and 430×932 in Chromium and
  WebKit; assert viewport containment and inspect screenshots of the longest labels.
- AC6: Run the existing unit, browser, progress, PWA, hosting, and offline-build
  checks after the localization tests.

## Dependencies

- Coordinate the overlapping menu changes with
  `docs/tasks/reconcile-wardrobe-and-record-visibility.md`; this newer product
  decision supersedes that task's restored wardrobe placement on the start screen.
- Coordinate shared gameplay/UI paths with the currently active
  `docs/tasks/progressively-vary-underwater-encounters.md` before implementation.

## Changed paths

- `index.html`
- `src/i18n.js`
- `src/main.js`
- `src/style.css`
- `package.json`
- `tests/localization-browser.mjs`
- `tests/i18n.test.js`
- `tests/browser.mjs`
- `tests/menu-ui.mjs`
- `README.md`
- `docs/tasks/localize-game-in-english-and-spanish.md`

## Actual results

- AC1–AC3: `npm run test:localization-browser` passed in Chromium and WebKit. It
  verifies all three flags, keyboard activation, selected state, localized title and
  document language, stage names, menu/settings/HUD copy, persistence, and German
  fallback for invalid stored values.
- AC2: `npm test` includes `tests/i18n.test.js`, which verifies the translated
  failure, save, update, and offline messages for all three locales.
- AC4: `node tests/menu-ui.mjs` verifies the absent wardrobe controls and preserves
  a seeded sailor outfit while switching language; `node tests/browser.mjs` verifies
  the menu no longer exposes the wardrobe after a game.
- AC5: `npm run test:localization-browser` passed at 320×568, 390×844, and 430×932
  in Chromium and WebKit with viewport-containment checks. The Spanish 430×932
  Chromium capture was visually inspected.
- AC6: `npm test` (48 tests), `npm run test:browser`, `node tests/menu-ui.mjs`,
  `node tests/progress-browser.mjs`, `node tests/pwa.mjs`, `npm run build`, and
  `PELICAN_URL=https://tidyeval.github.io/schnabel-voll-glueck/ node tests/hosting.mjs`
  all passed. `git diff --check` passed.

## Landing

- Implemented and pushed to `origin/main` in `44b49ba1df61f76cc30f207829ce6c90217595c3`.
