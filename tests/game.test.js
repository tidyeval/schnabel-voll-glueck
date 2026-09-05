import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, WORLD, netShape, hitsNet, beakPosition } from '../src/game.js';

test('Pip dives, catches a school, earns the mission once, survives a hit and finishes a round', () => {
  const g = createGame(() => .5);
  g.items = [];
  for (let i = 0; i < 60; i++) step(g, 1 / 60, true);
  assert.ok(g.player.y > WORLD.water, 'holding dives into the sea');
  for (let i = 0; i < 120; i++) step(g, 1 / 60, false);
  assert.ok(g.player.y < WORLD.water, 'releasing returns to the sky');
  g.player.y = 470; g.player.vy = 0; g.player.wet = true; g.energy = 50;
  g.items = Array.from({ length: 5 }, () => ({ kind: 'fish', ...beakPosition(g.player) }));
  let events = step(g, 1 / 60, true);
  assert.equal(g.fish, 5); assert.equal(g.score, 160); assert.equal(g.mission, true);
  assert.equal(events.filter(e => e.kind === 'mission').length, 1);
  assert.ok(g.energy > 69); assert.equal(g.items.length, 0);
  g.items = [{ kind: 'fish', ...beakPosition(g.player), golden: true }];
  events = step(g, 1 / 60, true);
  assert.equal(g.score, 260); assert.ok(!events.some(e => e.kind === 'mission'));
  g.items = [{ kind: 'shark', x: g.player.x, y: g.player.y, baseY: g.player.y }];
  const before = g.energy;
  step(g, 1 / 60, true); assert.ok(Math.abs(g.energy - (before - 23)) < .1); assert.equal(g.combo, 0);
  step(g, 1 / 60, true); assert.ok(Math.abs(g.energy - (before - 23)) < .1, 'invulnerability prevents repeated damage');
  g.items = []; g.player.invincible = 0; g.energy = .001; g.time = 20;
  assert.ok(step(g, 1 / 60, false).some(e => e.kind === 'end'));
  assert.deepEqual(step(g, 1, true), [], 'ended runs cannot award more fish');
  const timed = createGame(); timed.time = WORLD.duration - .01;
  assert.ok(step(timed, .02, false).some(e => e.kind === 'end'));
});

test('nets leave clear escape routes, boundaries hold and long frames do not teleport Pip', () => {
  for (const y of [200, 640]) {
    const g = createGame(); g.player.y = y; g.items = [{ kind: 'boat', x: g.player.x + 70, y: WORLD.water, cast: 2.2 }];
    assert.ok(!step(g, .01, false).some(e => e.kind === 'hurt'));
  }
  const g = createGame(); g.player.y = 450; g.items = [{ kind: 'boat', x: g.player.x + 70, y: WORLD.water, cast: 2.2 }];
  assert.ok(step(g, .01, true).some(e => e.kind === 'hurt'));
  const before = g.player.y; step(g, 100, true); assert.ok(g.player.y - before < 15);
  for (let i = 0; i < 1000; i++) { g.energy = 100; step(g, .05, true); }
  assert.ok(g.player.y <= 710, 'Pip remains above the mission panel');
  assert.ok(g.items.length < 35, 'offscreen entities are discarded');
});

test('fishermen announce a fixed cast, splash once and retrieve their visible net', () => {
  const g = createGame(); g.items = [{ kind: 'boat', x: 481, y: WORLD.water, cast: -1 }];
  const boat = g.items[0];
  const events = step(g, .01, false);
  assert.equal(events.filter(e => e.kind === 'warning').length, 1);
  assert.equal(netShape(boat), null, 'no hidden net during windup');
  let splashes = 0;
  for (let i = 0; i < 84; i++) splashes += step(g, .01, false).filter(e => e.kind === 'netSplash').length;
  assert.equal(netShape(boat), null, 'Pip receives at least 0.85 seconds of windup');
  for (let i = 0; i < 12; i++) step(g, .01, false);
  assert.equal(netShape(boat).phase, 'flight');
  const shape = netShape(boat);
  g.player.y = 740;
  assert.deepEqual(netShape(boat), shape, 'the throw never homes in on Pip');
  for (let i = 0; i < 160; i++) splashes += step(g, .01, false).filter(e => e.kind === 'netSplash').length;
  assert.equal(splashes, 1);
  assert.equal(netShape(boat).phase, 'haul');
  boat.cast = 3.25;
  assert.equal(netShape(boat), null, 'retrieved nets cannot hit Pip');
  for (const cast of [1, 1.5, 2.2, 2.8]) {
    const net = netShape({ x: 300, cast });
    assert.ok(hitsNet({ x: net.x, y: net.y + (net.phase === 'flight' ? 0 : net.depth / 2) + 8 }, net));
    assert.ok(!hitsNet({ x: net.x + net.width + 30, y: net.y + 8 }, net));
  }
});

test('eight seconds of air warn before exhaustion and force a held dive back to the surface', () => {
  const g = createGame(); g.items = []; g.nextEncounter = Infinity;
  let warned = 0, exhausted = false, returned = false;
  for (let i = 0; i < 720; i++) {
    const events = step(g, 1 / 60, true);
    warned += events.filter(e => e.kind === 'airWarning').length;
    if (g.player.surfacing) exhausted = true;
    if (exhausted && !g.player.wet) { returned = true; break; }
  }
  assert.equal(warned, 1); assert.ok(exhausted); assert.ok(returned, 'holding cannot keep Pip submerged forever');
  assert.ok(g.player.breath < 1);
  for (let i = 0; i < 120; i++) step(g, 1 / 60, false);
  assert.ok(Math.abs(g.player.breath - WORLD.breath) < 1e-6); assert.equal(g.player.surfacing, false);
  assert.ok(g.player.breach >= 0);
});

test('encounters alternate routes and rest, with a safe route below the net and above sharks', () => {
  const g = createGame(() => .5); g.items = []; g.distance = 519.9;
  step(g, .01, false);
  assert.equal(g.items.filter(i => i.kind === 'boat').length, 1);
  const route = g.items.filter(i => i.kind === 'fish' && !i.golden);
  assert.equal(route.length, 11);
  assert.ok(route[0].y < route[4].y && route[10].y < route[4].y);
  assert.ok(route.slice(4, 7).every(i => i.y >= 615), 'route clears the sunken net');
  assert.ok(g.items.find(i => i.golden).y > route[4].y + 80, 'gold is an optional detour');
  g.items = []; g.distance = g.nextEncounter;
  step(g, .01, false);
  assert.ok(g.items.every(i => i.kind === 'fish'), 'rest encounter contains no hazard');
  g.items = []; g.distance = g.nextEncounter;
  step(g, .01, false);
  const shark = g.items.find(i => i.kind === 'shark');
  assert.ok(shark);
  assert.ok(g.items.filter(i => i.kind === 'fish' && !i.golden).every(i => i.y < shark.y - 100));
});

test('the main fish routes can be followed through a full round without hits or running out of air', () => {
  for (const seed of [0, .5, .99]) {
    const g = createGame(() => seed);
    let hits = 0, outOfAir = false;
    for (let i = 0; i < 150 * 60; i++) {
      const p = g.player;
      const next = g.items.filter(item => item.kind === 'fish' && !item.golden && item.x > p.x - 12).sort((a, b) => a.x - b.x)[0];
      const target = next && next.x < p.x + 150 && p.breath > 2 ? next.y : 265;
      const events = step(g, 1 / 60, target > p.y + p.vy * .11);
      hits += events.filter(event => event.kind === 'hurt').length;
      outOfAir ||= p.surfacing;
    }
    assert.equal(hits, 0, `safe route, seed ${seed}`);
    assert.equal(outOfAir, false, 'rest windows provide enough time to breathe');
    assert.ok(g.fish > 150 && g.time > 149, 'a playable route lasts the whole round');
  }
});
