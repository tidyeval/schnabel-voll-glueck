import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, WORLD } from '../src/game.js';
import { STAGES } from '../src/stages.js';
import { DEEP_HAZARDS, SURFACE_HAZARDS, SHAPES, SCHOOL } from '../src/formations.js';

// Every wave of every stage, with many random starts: which formation came up, and its fish.
function waves(seeds = 40) {
  const out = [];
  for (let s = 0; s < seeds; s++) for (let stage = 0; stage < STAGES.length; stage++) {
    let n = s * 7919 + stage; const random = () => (n = (n * 16807) % 2147483647) / 2147483647;
    const g = createGame(random, stage);
    for (let wave = 0; wave < STAGES[stage].encounters.length; wave++) {
      g.items = []; g.distance = g.nextEncounter; step(g, .01, false);
      const trace = g.encounterTrace.at(-1);
      out.push({ ...trace, items: g.items, fish: g.items.filter(i => i.kind === 'fish' && i.route === wave && i.lane === 'main' && !i.golden) });
    }
  }
  return out;
}

test('runs roll different formations, each only where it fits', () => {
  const all = waves(), seen = new Set(all.map(w => w.formation));
  for (const name of ['arc', 'wave', 'steps', 'school', 'stragglers', 'ramp']) assert.ok(seen.has(name), `${name} occurs`);
  for (const w of all) {
    const [kind, ...companions] = w.entry.split('-');
    if (['boat', 'reef', 'buoy', 'island', 'mangrove', 'coral'].includes(kind)) assert.equal(w.formation, 'fixed', w.entry);
    if (['turtle', 'gull', 'whirlpool'].includes(kind)) assert.equal(w.formation, 'fixed', `${w.entry} keeps its arc`);
    if (!SHAPES[w.formation] && w.formation !== 'fixed') {
      assert.equal(companions.length, 0, `${w.formation} only on a single-creature wave`);
      assert.ok([...DEEP_HAZARDS, ...SURFACE_HAZARDS].includes(kind), `${w.formation} on ${kind}`);
      if (w.formation === 'ramp') assert.ok(DEEP_HAZARDS.includes(kind), 'ramp needs a clear surface');
    }
  }
});

test('free formations keep clear of the hazard they share the water with', () => {
  for (const w of waves().filter(w => ['school', 'stragglers', 'ramp'].includes(w.formation))) {
    const [kind] = w.entry.split('-');
    const deepest = Math.max(...w.fish.map(f => f.y + (f.bob ? SCHOOL.bob : 0))), highest = Math.min(...w.fish.map(f => f.y - (f.bob ? SCHOOL.bob : 0)));
    if (DEEP_HAZARDS.includes(kind)) assert.ok(deepest <= 615, `${w.formation} over ${kind} reaches ${deepest}`);
    assert.ok(highest >= WORLD.water + 35, `${w.formation} stays under water (${highest})`);
    if (SURFACE_HAZARDS.includes(kind)) assert.ok(highest >= WORLD.water + 55, `${w.formation} under ${kind} at ${highest}`);
  }
});

test('a school rises and sinks together; a ramp ends in two leaping fish', () => {
  const school = waves().find(w => w.formation === 'school');
  const g = createGame(() => .5); g.nextEncounter = Infinity; g.player.y = 265;
  g.items = school.fish.map(f => ({ ...f }));
  const before = g.items.map(f => f.y);
  for (let i = 0; i < 30; i++) step(g, 1 / 30, false);
  const moved = g.items.map((f, i) => f.y - before[i]);
  assert.ok(Math.abs(moved[0]) > 10, 'the school moves');
  assert.ok(moved.every(d => Math.abs(d - moved[0]) < 2), 'all in step');
  const ramp = waves().find(w => w.formation === 'ramp');
  assert.equal(ramp.items.filter(i => i.kind === 'fish' && i.leap === 0).length, 2);
});
