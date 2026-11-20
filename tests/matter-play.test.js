import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, paceAt, ENERGY } from '../src/game.js';
import { physicsSnapshot, releasePhysics } from '../src/physics.js';
import { STAGES } from '../src/stages.js';

// Solid terrain, momentum and flow forces (shown in the bay; every stage plays this way).
const bay = setup => {
  const g = createGame(() => .5, 0); g.nextEncounter = Infinity; setup(g); return g;
};
const run = (g, seconds, hold = () => false) => {
  const events = [], speeds = [];
  for (let t = 0; t < seconds && !g.ended; t += 1 / 60) { events.push(...step(g, 1 / 60, hold(g, t))); speeds.push(g.speed); }
  return { events, speeds };
};

test('every stage bounces Pip off its terrain instead of ending the run', () => {
  for (const [stage, kind, y] of [[0, 'buoy', 400], [1, 'coral', 650], [2, 'mangrove', 300], [3, 'reef', 420]]) {
    const g = createGame(() => .5, stage); g.nextEncounter = Infinity;
    Object.assign(g.player, { y, wet: y > 372 }); g.items = [{ kind, x: 260 }];
    const { events } = run(g, 1.2, () => false);
    assert.equal(g.ended, false, kind); assert.ok(events.some(e => e.kind === 'bounce'), `${kind} bounces`);
    releasePhysics(g);
  }
});

test('an island bounces Pip and costs speed instead of ending the run', () => {
  const island = { kind: 'island', x: 300 };
  const g = bay(g => { Object.assign(g.player, { y: 600, wet: true }); g.items = [island]; });
  const { events, speeds } = run(g, 1, () => true);
  assert.equal(g.ended, false);
  assert.ok(events.some(e => e.kind === 'bounce'), 'Matter reports the bump');
  assert.ok(physicsSnapshot(g).bodies > 1, 'the island is a body in the Matter world');
  assert.ok(Math.min(...speeds) < 20, 'the world nearly stops at the rock');
  run(g, 4);
  assert.equal(g.ended, false);
  assert.ok(island.x < g.player.x - 150, 'releasing lets Pip fly over the island and travel on');
  assert.ok(g.speed > 140, 'Pip swims back up to speed');
  releasePhysics(g);
});

test('a buoy bounces a surface swimmer, who then dives under it', () => {
  const buoy = { kind: 'buoy', x: 250 };
  const g = bay(g => { Object.assign(g.player, { y: 400, wet: true }); g.items = [buoy]; });
  const before = g.energy, { events } = run(g, 3, (g, t) => t > .9);
  const bounces = events.filter(e => e.kind === 'bounce').length;
  assert.equal(g.ended, false);
  assert.equal(bounces >= 1, true);
  assert.ok(g.energy <= before - bounces * ENERGY.bounce + 1, 'every bounce costs energy');
  assert.ok(buoy.x < g.player.x, 'Pip got past the buoy');
});

test('a current carries Pip and fish faster; the pace returns after it', () => {
  const current = { kind: 'current', x: 100, y: 535, length: 560 }, fish = { kind: 'fish', x: 300, y: 535, calm: true };
  const g = bay(g => { Object.assign(g.player, { y: 535, wet: true }); g.items = [current, fish]; });
  const keepBand = g => g.player.y < 535;
  run(g, 1.5, keepBand);
  assert.ok(g.speed > paceAt(0).speed * 1.25, `riding the current speeds Pip up (${g.speed.toFixed(0)})`);
  assert.ok(fish.drift.x > 30, 'the fish drifts with the water');
  run(g, 5, keepBand);
  assert.ok(Math.abs(g.speed - paceAt(g.time).speed) < 15, 'after the current Pip settles to the pace');
});

test('a whirlpool drags Pip and draws fish towards it, but releasing escapes', () => {
  const pool = { kind: 'whirlpool', x: 330, y: 620 }, fish = { kind: 'fish', x: 420, y: 560, calm: true };
  const g = bay(g => { Object.assign(g.player, { y: 680, wet: true }); g.items = [pool, fish]; });
  const before = Math.hypot(fish.x - pool.x, fish.y - pool.y);
  const { speeds } = run(g, 2.5);
  assert.ok(Math.max(...speeds) - Math.min(...speeds) > 50, 'the pull changes Pip\'s speed');
  assert.ok(Math.hypot(fish.x - pool.x, fish.y - pool.y) < before * .8, 'the fish is drawn in');
  assert.equal(g.ended, false); assert.equal(g.player.wet, false, 'releasing still escapes the pull');
});

test('the pre-built bay current runs into a whirlpool set piece', () => {
  const g = createGame(() => .5, 0);
  const wave = [...g.pieces.entries()].find(([, piece]) => piece === 'current')[0];
  for (let i = 0; i <= wave; i++) { g.items = []; g.distance = g.nextEncounter; step(g, .01, false); }
  const current = g.items.find(item => item.kind === 'current'), pool = g.items.find(item => item.kind === 'whirlpool');
  assert.ok(current && pool?.setPiece && pool.x > current.x + current.length / 2 && pool.y > current.y);
});

// The great white: once per stage from the harbour on, slower than Pip, escapable by surfacing.
const chase = (stage = 1) => {
  const g = createGame(() => .5, stage); g.items = []; g.nextEncounter = Infinity; g.wave = g.chaseWave;
  Object.assign(g.player, { y: 560, wet: true }); return g;
};
test('the great white never appears in the bay', () => {
  const g = createGame(() => .5, 0); assert.equal(g.chaseWave, Infinity);
});
test('a great white that catches Pip at the same depth ends the run', () => {
  const g = chase(), events = [];
  // Pip holds his depth: the shark closes in from behind.
  for (let t = 0; t < 8 && !g.ended; t += 1 / 60) { g.player.y = 560; g.player.vy = 0; g.player.breath = 10; g.energy = Math.max(g.energy, 60); events.push(...step(g, 1 / 60, false)); }
  assert.ok(events.some(e => e.kind === 'chase'), 'it is announced');
  assert.equal(events.filter(e => e.kind === 'hurt').length, 1, 'one bite');
  assert.equal(g.ended, true, 'a bite ends the run');
  assert.equal(g.endReason, 'shark');
});
test('surfacing shakes off the great white without a bite', () => {
  const g = chase(), events = [];
  for (let t = 0; t < 1.6; t += 1 / 60) { g.player.y = 560; g.player.vy = 0; events.push(...step(g, 1 / 60, true)); }
  for (let t = 0; t < 6 && !g.ended; t += 1 / 60) events.push(...step(g, 1 / 60, false));
  assert.ok(events.some(e => e.kind === 'chase'));
  assert.equal(events.some(e => e.kind === 'hurt'), false);
  assert.equal(g.items.some(i => i.kind === 'whiteshark'), false, 'it has left');
});
