import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, paceAt } from '../src/game.js';
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
  const { events } = run(g, 3, (g, t) => t > .9);
  assert.equal(g.ended, false);
  assert.equal(events.filter(e => e.kind === 'bounce').length >= 1, true);
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
