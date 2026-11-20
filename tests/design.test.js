// Design ontology and tokens (design/*.json): shared validation plus Schnabelglück's own
// cross-checks between those files and the code. Format: @tidyeval/game-platform DESIGN-FORMAT.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkComponents, checkDesignFiles, colourEvidence, constantsMatch, cssColourInventory, entitiesOf, formatDesignErrors, localeParity, relationPairs, requireDescriptions, setEquals } from '@tidyeval/game-platform/design';
import { STAGES } from '../src/stages.js';
import { locales, translations } from '../src/i18n.js';
import * as GAME from '../src/game.js';
import { CONTACT_DAMAGE, ENERGY, FLOW, WORLD, createGame, hazardShape, netShape, paceAt, rollRare, step, terrainBlocks } from '../src/game.js';
import { createJuice } from '../src/juice.js';
import { drawStorm } from '../src/scenery.js';

const root = new URL('../', import.meta.url);
const source = path => readFileSync(new URL(path, root), 'utf8');
const { errors, warnings, stats, ontology, tokens } = await checkDesignFiles(root);
const entities = ontology?.entities ?? [];
const entity = id => entities.find(e => e.id === id);
const ids = list => list.map(e => e.id);
const built = list => list.filter(e => (e.status ?? 'built') === 'built');
const sorted = values => [...new Set(values)].sort();
const css = source('src/style.css');
const none = (messages, hint) => assert.deepEqual(messages, [], hint ? `${hint}\n${messages.join('\n')}` : messages.join('\n'));

test('design files pass the shared validator', t => {
  assert.deepEqual(errors, [], formatDesignErrors(errors));
  t.diagnostic(`entities ${stats.entities} ${JSON.stringify(stats.byStatus)}; rules ${JSON.stringify(stats.rules)}; tokens ${stats.tokens}; warnings ${warnings.length}`);
  // Manual rules are allowed only where automation is impossible (feel, device orientation).
  assert.ok(stats.rules.manual <= 2, `${stats.rules.manual} manual rules; automate new principles instead`);
});

test('every encounter kind and combination in STAGES is an ontology entity and vice versa', () => {
  const entries = STAGES.flatMap(stage => stage.encounters);
  none(setEquals(entries.flatMap(entry => entry.split('-')), ids(entities.filter(e => e.properties?.encounterKind === true)), 'entities with properties.encounterKind (kinds used in STAGES encounters)'));
  none(setEquals(entries.filter(entry => entry.includes('-')), ids(entitiesOf(ontology, 'EncounterPattern')), 'EncounterPattern entities (combination entries in STAGES)'));
});

test('stage entities, introductions, appearances, set pieces and rare moments match STAGES', () => {
  const seen = new Set();
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
  none(setEquals(STAGES.map(s => `stage.${s.id}`), ids(entitiesOf(ontology, 'Stage')), 'Stage entities'));
  const encounterIds = new Set(entities.filter(e => e.properties?.encounterKind || e.concept === 'EncounterPattern').map(e => e.id));
  none(setEquals(appears, relationPairs(ontology, 'appearsIn').filter(edge => encounterIds.has(edge.split(' > ')[0])), 'appearsIn relations of encounter kinds'));
  none(setEquals(pieces, relationPairs(ontology, 'offersSetPiece'), 'offersSetPiece relations'));
  none(setEquals(rare, relationPairs(ontology, 'hasRareMoment'), 'hasRareMoment relations'));
});

test('every stage has a name in every locale', () => {
  for (const stage of STAGES) for (const locale of locales) assert.ok(stage.names[locale]?.trim(), `${stage.id} has no ${locale} name`);
});

test('every translation key exists in de, en and es and every referenced key is defined', () => {
  none(setEquals(locales, Object.keys(translations), 'translation locales'));
  const html = source('index.html'), code = ['src/main.js', 'src/i18n.js', 'src/art.js'].map(source).join('\n');
  const referenced = [
    ...[...html.matchAll(/data-i18n(?:-html|-aria-label)?="([^"]+)"/g)].map(m => m[1]),
    ...[...code.matchAll(/\b(?:t|translate)\('([\w.]+)'/g)].map(m => m[1]),
    ...[...code.matchAll(/'(fx\w+|show[A-Z]\w+)'/g)].map(m => m[1]),
  ];
  assert.ok(referenced.length > 50, `found ${referenced.length} referenced keys`);
  none(localeParity(translations, { reference: 'de', keys: referenced }));
});

// One-off shades in style.css that are not design tokens. A new colour must become a token in
// design/tokens.json or be added here with its reason.
const shadow = 'translucent shadow or overlay, tuned per element';
const CSS_COLOUR_EXCEPTIONS = {
  '#00000055': shadow, '#10294a88': shadow, '#123d3b33': shadow, '#123d3b40': shadow, '#164a4938': 'install/update button fill (.app-actions)', '#164f4920': shadow, '#164f4930': shadow,
  '#1d3a3a33': shadow, '#21575008': shadow, '#254c4920': shadow, '#275e4b15': shadow, '#275e4b23': shadow, '#2a503326': shadow, '#347c7033': shadow, '#7ca49960': 'thin intro rule',
  '#d1f3df33': '.app-actions divider', '#ffffff2a': 'night energy track', '#28565c': 'test-edition label', '#47746a': "hero label 'Hey, I'm Pip'",
  '#5e8881': 'intro eyebrow text', '#65897b': 'desktop-only .tiny-bird', '#668b7c': 'hero label arrow', '#6e9e7c': 'outfit picker (dormant)', '#82948a': 'desktop-only frame',
  '#83968a': 'desktop-only frame', '#d6975c': 'outfit picker (dormant)', '#e5edd0': 'outfit picker (dormant)', '#eaf0dd': 'outfit picker (dormant)', '#e9e5c2': 'stage select border, overridden by the later borderless rule',
  '#effef0': 'run record label (hidden on the start screen)', '#fff6d7': 'install/update button text (.app-actions)', '#fff6dc': 'stage picker text, overridden by color.ink.on-sea later', '#fff6df': 'stage select background, overridden by the later transparent rule', '#fff8d8': 'run record number (hidden on the start screen)',
};
test('colours in style.css come from design tokens or are listed exceptions', () => {
  none(cssColourInventory(css, tokens, CSS_COLOUR_EXCEPTIONS), 'add these colours to design/tokens.json (or to CSS_COLOUR_EXCEPTIONS with a reason)');
});

test('literal colour tokens match the colour in their evidence', () => {
  none(colourEvidence(tokens));
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

test('reduced motion disables flashes and shakes for every event', () => {
  const game = { player: { x: 100, y: 300 }, speed: 0 };
  // Every event kind juice.js reacts to, with the strongest payload it can carry.
  const kinds = sorted([...source('src/juice.js').matchAll(/event\.kind === '(\w+)'/g)].map(m => m[1]));
  assert.ok(kinds.length >= 12, `found ${kinds.length} juice event kinds`);
  const after = (reduced, kind) => {
    const juice = createJuice(reduced);
    juice.onEvent({ kind, x: 100, y: 300, power: 1, golden: true, combo: 10, points: 50 }, game);
    return { ...juice.view(), timeScale: juice.timeScale(.01) };
  };
  assert.ok(after(false, 'frenzy').flash > 0 && after(false, 'hurt').timeScale === 0 && after(false, 'breach').shakeX !== undefined, 'without reduced motion juice flashes and stops time');
  for (const kind of kinds) {
    const view = after(true, kind);
    assert.deepEqual({ flash: view.flash, shakeX: view.shakeX, shakeY: view.shakeY, timeScale: view.timeScale }, { flash: 0, shakeX: 0, shakeY: 0, timeScale: 1 }, `reduced motion still flashes, shakes or changes time on '${kind}'`);
  }
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

// Simulates one obstacle from properties.telegraph.probe with Pip held at probe.pipY and
// returns when it was announced, when it could first hurt (danger) and when it hurt.
function simulateTelegraph({ announce, danger, probe }) {
  const game = createGame(() => .5, STAGES.findIndex(stage => stage.id === 'reef'));
  game.nextEncounter = Infinity;
  if (probe.spawn === 'chase') { game.items = []; game.chaseWave = 0; game.wave = 0; } else { game.items = [structuredClone(probe.item)]; game.chaseWave = Infinity; }
  const kind = probe.spawn === 'chase' ? 'whiteshark' : probe.item.kind, p = game.player, result = { announce: null, danger: null, hurt: null };
  const [how, arg] = announce.split(':'), [what, detail] = danger.split(':');
  const dangerous = item => {
    if (what === 'spawn') return game.items.some(i => i.kind === detail);
    if (!item) return false;
    if (what === 'phase') return item.phase === detail;
    if (what === 'net') return !!netShape(item);
    if (what === 'fisher') return item.x - 30 <= p.x + 18;
    if (what === 'pull') return item.x - FLOW.whirlRadius <= p.x;
    if (what === 'terrain') return Math.min(...terrainBlocks(item).map(b => b.x)) <= p.x + 18;
    if (what === 'contact') { const s = hazardShape(item); return !!s && (s.type === 'box' ? s.left : s.x - s.rx) <= p.x; }
    throw new Error(`unknown telegraph danger ${danger}`);
  };
  for (let t = 0; t < 12 && !game.ended; t += 1 / 60) {
    Object.assign(p, { y: probe.pipY, vy: 0, wet: probe.pipWet, breath: WORLD.breath }); game.energy = 100;
    const events = step(game, 1 / 60, false), item = game.items.find(i => i.kind === kind);
    const announced = how === 'event' ? events.some(e => arg.split('|').includes(e.kind)) : how === 'phase' ? item?.phase === arg : how === 'visible' ? !!item && item.x - (probe.halfWidth ?? 0) < WORLD.width : null;
    assert.notEqual(announced, null, `unknown telegraph announce ${announce}`);
    if (result.announce === null && announced) result.announce = game.time;
    if (result.danger === null && dangerous(item)) result.danger = game.time;
    if (result.hurt === null && events.some(e => e.kind === 'hurt')) result.hurt = game.time;
  }
  return result;
}
test('every obstacle is telegraphed with its declared lead time', () => {
  const obstacles = entitiesOf(ontology, 'Obstacle');
  assert.ok(obstacles.length >= 17, `found ${obstacles.length} obstacles`);
  for (const obstacle of obstacles) {
    const telegraph = obstacle.properties?.telegraph;
    assert.ok(telegraph?.probe && telegraph.announce && telegraph.danger && telegraph.leadSeconds > 0 && telegraph.channels?.length, `${obstacle.id} needs properties.telegraph { channels, announce, danger, leadSeconds, probe }`);
    const result = simulateTelegraph(telegraph);
    assert.notEqual(result.announce, null, `${obstacle.id} is never announced (${telegraph.announce})`);
    assert.ok(result.hurt === null || result.announce < result.hurt, `${obstacle.id} hurt Pip before it was announced`);
    const first = Math.min(result.danger ?? Infinity, result.hurt ?? Infinity);
    assert.ok(first < Infinity, `${obstacle.id}: the probe never reached its danger (${telegraph.danger}); fix the probe`);
    assert.ok(first - result.announce >= telegraph.leadSeconds - 1e-9, `${obstacle.id}: announced only ${(first - result.announce).toFixed(2)} s before it can hurt; declared lead ${telegraph.leadSeconds} s`);
  }
});

test('ontology constants equal the exported game constants', () => {
  none(constantsMatch(ontology, GAME, { min: 12 }));
  for (const e of entities.filter(e => e.properties?.contactDamage !== undefined)) assert.equal(e.properties.contactDamage, CONTACT_DAMAGE[e.id], `${e.id}: contactDamage differs from CONTACT_DAMAGE`);
  const hazards = new Set(ids(entitiesOf(ontology, 'Hazard')));
  for (const kind of Object.keys(CONTACT_DAMAGE)) assert.ok(hazards.has(kind), `CONTACT_DAMAGE.${kind} has no Hazard entity`);
});

test('contact damage stays within each hazard class band', () => {
  const contract = entity('contract.hazard').properties;
  for (const hazard of entitiesOf(ontology, 'EnergyHazard')) {
    const damage = CONTACT_DAMAGE[hazard.id];
    assert.ok(damage >= contract.energyHazardDamage.min && damage <= contract.energyHazardDamage.max, `${hazard.id}: contact damage ${damage} outside ${contract.energyHazardDamage.min}–${contract.energyHazardDamage.max}`);
  }
  none(setEquals(contract.fatalKinds, ids(entitiesOf(ontology, 'FatalHazard')), 'FatalHazard entities (contract.hazard.fatalKinds)'));
  const fatalLine = source('src/game.js').match(/const fatalHit = ([^;]+);/)[1];
  for (const kind of contract.fatalKinds.filter(kind => kind !== 'fisher')) assert.ok(fatalLine.includes(`item.kind === '${kind}'`), `${kind} is not fatal in resolveHazard`);
  assert.equal(contract.terrainBounceCost, ENERGY.bounce);
  for (const force of entitiesOf(ontology, 'Force')) assert.equal(hazardShape(force.properties.telegraph.probe.item), null, `${force.id} is a Force but has a contact shape`);
});

test('stages follow the pacing contract', () => {
  const pacing = entity('contract.pacing').properties;
  for (const [seconds, speed, spacing] of pacing.pacePoints) assert.deepEqual(paceAt(seconds), { speed, spacing }, `paceAt(${seconds})`);
  assert.deepEqual(pacing.startElapsed, STAGES.map(s => s.startElapsed));
  assert.deepEqual(pacing.sharkWarning, STAGES.map(s => s.sharkWarning));
  assert.deepEqual(pacing.pairPatterns, STAGES.map(s => s.pairPatterns));
  STAGES.forEach((stage, i) => {
    if (i) assert.ok(stage.startElapsed > STAGES[i - 1].startElapsed, `${stage.id} must start later in the journey than ${STAGES[i - 1].id}`);
    assert.equal(stage.encounters.length, pacing.encountersPerStage, `${stage.id} encounters`);
    assert.ok(stage.sharkWarning >= pacing.minSharkWarning, `${stage.id} sharkWarning ${stage.sharkWarning} below ${pacing.minSharkWarning}`);
    for (const [wave, form] of Object.entries(stage.pairPatterns)) {
      assert.ok(['staggered', 'parallel'].includes(form), `${stage.id} pair pattern ${form}`);
      assert.equal(stage.encounters[wave], 'shark-shark', `${stage.id} pairPatterns[${wave}] must sit on a shark pair`);
    }
  });
});

test('every stage satisfies the stage contract and has theme tokens', () => {
  const contract = entity('contract.stage').properties, setPieces = new Set(ids(entitiesOf(ontology, 'SetPiece')));
  for (const stage of STAGES) {
    for (const field of contract.fields) assert.ok(field in stage, `${stage.id} lacks ${field}`);
    for (const field of Object.keys(stage)) assert.ok([...contract.fields, ...contract.optionalFields].includes(field), `${stage.id} has an undocumented field ${field}`);
    assert.deepEqual(sorted(Object.keys(stage.theme)), sorted(contract.themeFields), `${stage.id} theme fields`);
    assert.deepEqual(sorted(Object.keys(stage.setPieces)), sorted(contract.setPieceFields));
    for (const locale of locales) assert.ok(stage.names[locale]?.trim(), `${stage.id} has no ${locale} name`);
    for (const r of stage.residents) assert.equal(entity(r)?.concept, 'Resident', `${stage.id} resident ${r}`);
    none(setEquals([], [...stage.setPieces.calm, ...stage.setPieces.shows].filter(piece => !setPieces.has(piece)), `${stage.id} set pieces without a SetPiece entity`));
    if (stage.rareMoment) assert.equal(entity(stage.rareMoment)?.concept, 'RareMoment');
    const value = id => { const token = tokens.tokens[id]; assert.ok(token, `missing token ${id}`); return token.value; };
    for (const [field, expected] of Object.entries(stage.theme)) {
      const id = `stage.${stage.id}.${field}`;
      if (field === 'sky') assert.deepEqual(value(id).map(s => [s.at, s.color]), expected, id);
      else if (field === 'water') assert.deepEqual(value(id).map(s => s.color), expected, id);
      else if (field === 'grass') assert.deepEqual([value(`${id}.light`), value(`${id}.dark`)], expected, id);
      else if (field === 'tint' && expected === null) assert.equal(value(id), 'none', id);
      else assert.equal(value(id), expected, id);
    }
  }
  none(setEquals(STAGES.flatMap(s => s.residents.map(r => `stage.${s.id} > ${r}`)), relationPairs(ontology, 'hasResident'), 'hasResident relations'));
});

test('events, end reasons and haptics match the code', () => {
  const game = source('src/game.js');
  const union = game.match(/@property \{([^}]+)\} kind\n \*\/\n\nexport const WORLD|@typedef \{object\} GameEvent[\s\S]*?@property \{([^}]+)\} kind/)[2].split('|').map(k => k.replace(/'/g, ''));
  const pushed = game.split('\n').filter(line => /events\.push\(|return \[(\{|\.\.\.events)/.test(line)).flatMap(line => [...line.matchAll(/kind: ([^,}]+)/g)].flatMap(m => [...m[1].matchAll(/(?<!=== )'(\w+)'/g)].map(q => q[1])));
  for (const kind of pushed) assert.ok(union.includes(kind), `event '${kind}' is emitted but missing from the GameEvent typedef`);
  none(setEquals(union, ids(entitiesOf(ontology, 'GameEvent')).map(id => id.slice(6)), 'GameEvent entities'));
  const fatal = game.match(/const fatalHit = ([^;]+);/)[1], reasons = [...game.matchAll(/endReason = '(\w+)'/g)].map(m => m[1]);
  const reachable = sorted([...reasons, 'fisher', ...[...fatal.matchAll(/item\.kind === '(\w+)'/g)].map(m => m[1] === 'whiteshark' ? 'shark' : m[1])]);
  const endReasons = entitiesOf(ontology, 'EndReason');
  none(setEquals(reachable, ids(built(endReasons)).map(id => id.slice(10)), 'built EndReason entities (reasons a run can end with)'));
  // Translated reasons no run can reach are documented as status "unused".
  none(setEquals(Object.keys(translations.de.reasons).filter(r => !reachable.includes(r) && !['final', 'fallback'].includes(r)), ids(endReasons.filter(e => e.status === 'unused')).map(id => id.slice(10)), 'unused EndReason entities'));
  for (const reason of reachable) for (const locale of locales) assert.ok(translations[locale].reasons[reason], `${locale} has no reasons.${reason}`);
  const haptics = Object.fromEntries([...source('src/audio.js').matchAll(/^  (\w+): \{ web: (\[[^\]]*\]|\d+)(?:, native: ImpactStyle\.(\w+))?(?:, success: (true))? \},$/gm)].map(([, name, web, native, success]) => [name, { web: JSON.parse(web), ...(native ? { native } : {}), ...(success ? { nativeSuccess: true } : {}) }]));
  assert.ok(Object.keys(haptics).length >= 10);
  assert.deepEqual(Object.fromEntries(entitiesOf(ontology, 'Haptic').map(e => [e.id.slice(7), e.properties])), haptics, 'Haptic entities equal the HAPTICS table');
});

test('every entity and concept has a description', () => {
  none(requireDescriptions(ontology));
});

test('component selectors exist and their colour tokens are the colours in that CSS', () => {
  none(checkComponents(tokens, css));
});
