// Design ontology and tokens (design/*.json): shared validation plus Schnabelglück's own
// cross-checks between those files and the code. Format: @tidyeval/game-platform DESIGN-FORMAT.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkDesignFiles, formatDesignErrors } from '@tidyeval/game-platform/design';
import { STAGES } from '../src/stages.js';
import { locales, translations } from '../src/i18n.js';
import { createGame, hazardShape, rollRare, step } from '../src/game.js';
import { createJuice } from '../src/juice.js';
import { drawStorm } from '../src/scenery.js';

const root = new URL('../', import.meta.url);
const source = path => readFileSync(new URL(path, root), 'utf8');
const { errors, ontology, tokens } = await checkDesignFiles(root);
const entities = ontology?.entities ?? [];
const entity = id => entities.find(e => e.id === id);
const sorted = values => [...new Set(values)].sort();
const css = source('src/style.css');

test('design files pass the shared validator', () => {
  assert.deepEqual(errors, [], formatDesignErrors(errors));
});

test('every encounter kind and combination in STAGES is an ontology entity and vice versa', () => {
  const entries = STAGES.flatMap(stage => stage.encounters);
  const kinds = sorted(entries.flatMap(entry => entry.split('-')));
  const declared = sorted(entities.filter(e => e.properties?.encounterKind === true).map(e => e.id));
  assert.deepEqual(declared, kinds, 'entities with properties.encounterKind must be exactly the kinds used in STAGES encounters');
  const patterns = sorted(entries.filter(entry => entry.includes('-')));
  const declaredPatterns = sorted(entities.filter(e => e.concept === 'EncounterPattern').map(e => e.id));
  assert.deepEqual(declaredPatterns, patterns, 'EncounterPattern entities must be exactly the combination entries in STAGES');
});

test('stage entities, introductions, appearances, set pieces and rare moments match STAGES', () => {
  const seen = new Set();
  const relations = type => sorted(ontology.relations.filter(r => r.type === type).map(r => `${r.from} > ${r.to}`));
  const appears = [], pieces = [], rare = [];
  STAGES.forEach((stage, order) => {
    const node = entity(`stage.${stage.id}`);
    assert.ok(node, `missing ontology entity stage.${stage.id}`);
    assert.equal(node.concept, 'Stage');
    const { startElapsed, sharkWarning, night } = stage;
    assert.deepEqual({ order: node.properties.order, startElapsed: node.properties.startElapsed, sharkWarning: node.properties.sharkWarning, night: node.properties.night }, { order, startElapsed, sharkWarning, night }, `stage.${stage.id} properties`);
    const introduced = [];
    for (const kind of stage.encounters.flatMap(entry => entry.split('-'))) if (!seen.has(kind)) { seen.add(kind); introduced.push(kind); }
    assert.deepEqual(node.properties.introduces, introduced, `stage.${stage.id} introduces`);
    for (const id of new Set(stage.encounters.flatMap(entry => [...entry.split('-'), ...(entry.includes('-') ? [entry] : [])]))) appears.push(`${id} > stage.${stage.id}`);
    for (const piece of [...stage.setPieces.calm, ...stage.setPieces.shows]) pieces.push(`stage.${stage.id} > ${piece}`);
    if (stage.rareMoment) rare.push(`stage.${stage.id} > ${stage.rareMoment}`);
  });
  assert.equal(entities.filter(e => e.concept === 'Stage').length, STAGES.length, 'one Stage entity per stage');
  const encounterIds = new Set(entities.filter(e => e.properties?.encounterKind || e.concept === 'EncounterPattern').map(e => e.id));
  assert.deepEqual(relations('appearsIn').filter(edge => encounterIds.has(edge.split(' > ')[0])), sorted(appears), 'appearsIn relations of encounter kinds');
  assert.deepEqual(relations('offersSetPiece'), sorted(pieces), 'offersSetPiece relations');
  assert.deepEqual(relations('hasRareMoment'), sorted(rare), 'hasRareMoment relations');
});

test('every stage has a name in every locale', () => {
  for (const stage of STAGES) for (const locale of locales) assert.ok(stage.names[locale]?.trim(), `${stage.id} has no ${locale} name`);
});

const keyPaths = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) => typeof child === 'object' ? keyPaths(child, `${prefix}${key}.`) : [`${prefix}${key}`]);
const lookup = (locale, path) => path.split('.').reduce((entry, part) => entry?.[part], translations[locale]);

test('every translation key exists in de, en and es and every referenced key is defined', () => {
  assert.deepEqual(sorted(Object.keys(translations)), sorted(locales));
  const all = sorted(locales.flatMap(locale => keyPaths(translations[locale])));
  for (const locale of locales) {
    for (const path of all) {
      const value = lookup(locale, path);
      assert.ok(typeof value === 'string' && value.trim(), `${locale} is missing translation ${path}`);
      const placeholders = text => sorted(text.match(/\{\w+\}/g) || []);
      assert.deepEqual(placeholders(value), placeholders(lookup('de', path) ?? ''), `${locale}.${path} must use the same {placeholders} as de`);
    }
  }
  const html = source('index.html'), code = ['src/main.js', 'src/i18n.js'].map(source).join('\n');
  const referenced = [
    ...[...html.matchAll(/data-i18n(?:-html|-aria-label)?="([^"]+)"/g)].map(m => m[1]),
    ...[...code.matchAll(/\bt\('([\w.]+)'/g)].map(m => m[1]),
    ...[...code.matchAll(/'(fx\w+|show[A-Z]\w+)'/g)].map(m => m[1]),
  ];
  assert.ok(referenced.length > 50, `found ${referenced.length} referenced keys`);
  for (const key of new Set(referenced)) for (const locale of locales) assert.ok(typeof lookup(locale, key) === 'string', `${key} is used but missing in ${locale}`);
});

// One-off shades in style.css that are not design tokens (mostly translucent shadows and
// desktop-only frame text). A new colour must become a token in design/tokens.json or be added here.
const CSS_COLOUR_EXCEPTIONS = [
  '#00000055', '#10294a88', '#123d3b33', '#123d3b40', '#164a4938', '#164f4920', '#164f4930', '#1d3a3a33', '#21575008', '#254c4920',
  '#275e4b15', '#275e4b23', '#28565c', '#2a503326', '#347c7033', '#47746a', '#5e8881', '#65897b', '#668b7c', '#6e9e7c', '#7ca49960',
  '#82948a', '#83968a', '#d1f3df33', '#d6975c', '#e5edd0', '#e9e5c2', '#eaf0dd', '#effef0', '#fff6d7', '#fff6dc',
  '#fff6df', '#fff8d8', '#ffffff2a',
];
test('colours in style.css come from design tokens or are listed exceptions', () => {
  const tokenColours = new Set(Object.values(tokens.tokens).filter(token => token.type === 'color' && !String(token.value).startsWith('{')).map(token => token.value.toLowerCase()));
  const used = sorted([...css.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g)].map(m => m[0].toLowerCase()));
  const unknown = used.filter(colour => !tokenColours.has(colour) && !CSS_COLOUR_EXCEPTIONS.includes(colour));
  assert.deepEqual(unknown, [], 'add these colours to design/tokens.json (or to CSS_COLOUR_EXCEPTIONS with a reason)');
  const stale = CSS_COLOUR_EXCEPTIONS.filter(colour => !used.includes(colour) || tokenColours.has(colour));
  assert.deepEqual(stale, [], 'remove exceptions that are unused or already tokens');
});

test('literal colour tokens match the colour in their evidence', () => {
  for (const [id, token] of Object.entries(tokens.tokens)) {
    const colours = token.type === 'color' ? [token.value] : token.type === 'gradient' ? token.value.map(stop => stop.color) : [];
    for (const colour of colours.filter(value => !value.startsWith('{'))) {
      assert.ok(token.evidence.some(e => e.contains.toLowerCase().includes(colour.toLowerCase())), `${id}: ${colour} does not occur in its evidence strings`);
    }
  }
});

// Declarations of the first rule whose selector list is exactly `selector`.
function rule(selector) {
  const match = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(m => m[1].trim() === selector);
  assert.ok(match, `style.css has no rule for ${selector}`);
  return match[2];
}
test('button styles centre their text', () => {
  for (const [selector, needed] of [
    ['.primary', ['justify-content:center', 'text-align:center', 'align-items:center']],
    ['.quiet-button', ['justify-content:center', 'align-items:center']],
    ['.icon-button', ['place-items:center']],
    ['.language-picker button', ['place-items:center']],
    ['.stage-step', ['place-items:center']],
  ]) for (const declaration of needed) assert.ok(rule(selector).includes(declaration), `${selector} must declare ${declaration} so its text stays centred`);
  assert.ok(rule('dialog').includes('text-align:center'), 'dialog text, including the coach skip and links, is centred');
});

test('the result screen offers only next nest or this nest again as main actions', () => {
  const dialog = source('index.html').match(/<dialog id="result-dialog">([\s\S]*?)<\/dialog>/)?.[1];
  assert.ok(dialog, 'index.html has a #result-dialog');
  const buttons = [...dialog.matchAll(/<button id="([^"]+)" class="([^"]+)"[^>]*data-i18n="([^"]+)"/g)].map(([, id, cls, key]) => ({ id, cls, key }));
  assert.deepEqual(buttons.filter(b => b.cls.split(' ').includes('primary')).map(b => b.id), ['next-stage', 'again']);
  assert.ok(buttons.filter(b => !b.cls.split(' ').includes('primary')).every(b => b.cls.split(' ').includes('quiet-button')), 'every other result button is quiet');
  const main = source('src/main.js');
  assert.ok(main.includes("$('next-stage').classList.toggle('hidden', !complete || final);"), 'next nest only after a completed (non-final) nest');
  assert.ok(main.includes("text('again', complete && !final ? t('again') : t('retryStage'));"), "'this nest again' after a nest, otherwise 'try again'");
  assert.ok(main.includes("$('again').className = complete && !final ? 'quiet-button' : 'primary';"), 'replaying a finished nest is the quiet option');
  for (const locale of locales) assert.ok(translations[locale].next && translations[locale].again && translations[locale].retryStage);
});

test('next nest carries the journey score and time, a menu start begins at zero', () => {
  const main = source('src/main.js');
  assert.match(main, /function start\(elapsed, score = 0\) \{/);
  assert.match(main, /game\.score = game\.startScore = score;/);
  assert.match(main, /\$\('next-stage'\)\.onclick = \(\) => \{[^}]*start\(game\.elapsed \+ game\.time, game\.score\);/);
  assert.match(main, /\$\('again'\)\.onclick = \(\) => \{[^}]*start\(undefined, game\.startScore\);/);
  assert.match(main, /\$\('play'\)\.onclick = \(\) => start\(\);/);
});

test('reduced motion disables flashes and shakes', () => {
  const game = { player: { x: 100, y: 300 }, speed: 0 };
  const view = reduced => {
    const juice = createJuice(reduced);
    juice.onEvent({ kind: 'frenzy', x: 100, y: 300 }, game);
    juice.onEvent({ kind: 'hurt', x: 100, y: 300 }, game);
    return { ...juice.view(), timeScale: juice.timeScale(.01) };
  };
  assert.ok(view(false).flash > 0 && view(false).timeScale === 0, 'without reduced motion the frenzy flashes and a hurt stops time briefly');
  const calm = view(true);
  assert.deepEqual({ flash: calm.flash, shakeX: calm.shakeX, shakeY: calm.shakeY, timeScale: calm.timeScale }, { flash: 0, shakeX: 0, shakeY: 0, timeScale: 1 });
  // Lightning: the storm fills the sky with light during a flash, but not with reduced motion.
  const fills = (time, reduced) => {
    let count = 0;
    const context = new Proxy({}, { get: (_, key) => key === 'fillRect' ? () => { count++; } : () => {}, set: () => true });
    drawStorm(context, { time, distance: 0 }, 360, 1, reduced);
    return count;
  };
  let time = 0;
  while (time < 30 && !fills(time, false)) time += .01;
  assert.ok(fills(time, false) > 0, 'the storm flashes without reduced motion');
  assert.equal(fills(time, true), 0, 'no lightning flash with reduced motion');
  const reducedBlocks = [...css.matchAll(/@media \(prefers-reduced-motion:reduce\)\{([^@]*)\}/g)].map(m => m[1]).join('\n');
  assert.match(reducedBlocks, /\.taken \.photo-flash[^{]*\{animation:none\}/, 'the photo flash animation is off with reduced motion');
});

test('dolphins are offered only on the reef', () => {
  assert.deepEqual(STAGES.filter(stage => [...stage.setPieces.calm, ...stage.setPieces.shows].includes('dolphins')).map(stage => stage.id), ['reef']);
});

// Surface traffic from rollRare in game.js; a surface rare moment needs the water to itself.
const SURFACE_KINDS = ['boat', 'driftwood', 'surfer', 'island', 'buoy', 'mangrove'];
test('rare surface moments get the surface to themselves', () => {
  const surfaceMoments = entities.filter(e => e.concept === 'RareMoment' && e.properties?.surface).map(e => e.id);
  assert.deepEqual(sorted(surfaceMoments), ['ducklings', 'otters']);
  let seed = 11; const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (const [index, stage] of STAGES.entries()) {
    if (!surfaceMoments.includes(stage.rareMoment)) continue;
    const busy = wave => (stage.encounters[wave] || '').split('-').some(kind => SURFACE_KINDS.includes(kind));
    for (let run = 0; run < 500; run++) {
      const { wave } = rollRare(index, random);
      // rollRare prefers two quiet waves ahead and falls back to one; both stages offer such waves.
      for (const offset of [-1, 0, 1]) assert.ok(!busy(wave + offset), `${stage.rareMoment} at wave ${wave} meets ${stage.encounters[wave + offset]} on the surface`);
    }
  }
  assert.ok(source('src/cute.js').includes("if (['bottle', 'flamingo', 'mudskipper'].includes(kind) && rareActive(game)) return;"), 'surface residents step aside during a rare moment');
});

test('every danger is harmless or announced before it can hurt', () => {
  // The great white only shows its fin while stalking; a puffer is harmless until fully puffed.
  assert.equal(hazardShape({ kind: 'whiteshark', x: 0, y: 500, phase: 'stalk' }), null);
  for (const phase of ['idle', 'startle', 'inflate', 'deflate', 'rest']) assert.equal(hazardShape({ kind: 'puffer', x: 0, y: 600, phase, timer: 0 }), null, `puffer ${phase}`);
  // Gulls, surfers and terrain announce themselves while still well ahead of Pip.
  for (const item of [{ kind: 'gull', x: 700, y: 285, phase: 0 }, { kind: 'surfer', x: 700, y: 360, escaping: false }, { kind: 'reef', x: 1100 }, { kind: 'island', x: 1100 }]) {
    const game = createGame(() => .5, 1);
    game.nextEncounter = Infinity; game.items = [item];
    let announced = null;
    for (let t = 0; t < 8 && !announced; t += 1 / 60) {
      Object.assign(game.player, { y: 600, wet: true, breath: 8 }); game.energy = 100;
      const events = step(game, 1 / 60, false);
      assert.ok(!events.some(e => e.kind === 'hurt'), `${item.kind} hurt Pip before announcing itself`);
      if (events.some(e => ['warning', 'reefWarning', 'islandWarning'].includes(e.kind))) announced = item.x - game.player.x;
    }
    assert.ok(announced > 150, `${item.kind} must be announced more than 150 px ahead (was ${announced})`);
  }
});
