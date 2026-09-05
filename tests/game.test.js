import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, WORLD, netShape, hitsNet, beakPosition, press, hitsBoat } from '../src/game.js';

test('Pip dives, catches a school, earns the mission once, ends immediately on a hit', () => {
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
  assert.ok(step(g, 1 / 60, true).some(e => e.kind === 'end'));
  assert.equal(g.endReason, 'shark');
  const score = g.score;
  assert.deepEqual(step(g, 1, true), [], 'ended runs cannot award more fish');
  assert.equal(g.score, score);
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
  const bounds = createGame(); bounds.items = []; bounds.nextEncounter = Infinity;
  const before = bounds.player.y; step(bounds, 100, true); assert.ok(bounds.player.y - before < 15);
  for (let i = 0; i < 1000; i++) { bounds.player.breath = WORLD.breath; step(bounds, .05, true); }
  assert.equal(bounds.player.y, 710);
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
  for (let i = 0; i < 160; i++) splashes += step(g, .01, true).filter(e => e.kind === 'netSplash').length;
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

test('air warns, replenishes above water, and exhaustion ends the run immediately', () => {
  const g = createGame(); g.items = []; g.nextEncounter = Infinity;
  let warned = 0;
  for (let i = 0; i < 600 && !g.ended; i++) warned += step(g, 1 / 60, true).filter(e => e.kind === 'airWarning').length;
  assert.equal(warned, 1); assert.equal(g.ended, true); assert.equal(g.endReason, 'air');
  assert.equal(g.player.breath, 0); assert.equal(g.player.wet, true);
  assert.deepEqual(step(g, .05, false), []);
  const fresh = createGame(); fresh.player.breath = 1;
  for (let i = 0; i < 120; i++) step(fresh, 1 / 60, false);
  assert.equal(fresh.player.breath, WORLD.breath);
});

test('fisher, hull and net contact end immediately, while the difficulty grows gradually', () => {
  for (const [y, offset, cast, reason] of [[280, 7, -1, 'fisher'], [360, 0, -1, 'fisher'], [450, 70, 2.2, 'net']]) {
    const g = createGame(); g.player.y = y;
    g.items = [{ kind: 'boat', x: g.player.x + offset, cast }];
    assert.equal(step(g, .01, false).filter(e => e.kind === 'end').length, 1);
    assert.equal(g.endReason, reason);
  }
  const speeds = [], gaps = [];
  for (const time of [0, 60, 120]) {
    const g = createGame(); g.time = time; g.distance = g.nextEncounter;
    const before = g.nextEncounter; step(g, .01, false);
    speeds.push(g.speed); gaps.push(g.nextEncounter - before);
  }
  assert.ok(speeds[0] < speeds[1] && speeds[1] < speeds[2]);
  assert.ok(gaps[0] > gaps[1] && gaps[1] > gaps[2]);
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
  assert.ok(g.items.every(i => ['fish', 'bubble'].includes(i.kind)), 'rest encounter contains no hazard');
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
      outOfAir ||= g.endReason === 'air';
    }
    assert.equal(hits, 0, `safe route, seed ${seed}`);
    assert.equal(outOfAir, false, 'rest windows provide enough time to breathe');
    assert.ok(g.fish > 150 && g.time > 149, 'a playable route lasts the whole round');
  }
});

test('sharks track faster later, telegraph a fixed dash, and stop pursuing above water', () => {
  const movement = [];
  for (const time of [0, 120]) {
    const g = createGame(); g.time = time; g.player.y = 450; g.player.wet = true;
    const shark = { kind: 'shark', x: 470, y: 640 }; g.items = [shark];
    for (let i = 0; i < 10; i++) step(g, .05, true);
    movement.push(640 - shark.y);
    shark.x = 350; step(g, .01, true); assert.equal(shark.phase, 'warn');
    for (let i = 0; i < 18; i++) step(g, .05, true);
    assert.equal(shark.phase, 'dash'); const direction = shark.dashY;
    g.player.y = 420; step(g, .01, false); assert.equal(shark.dashY, direction);
    g.player.y = 265; g.player.wet = false; step(g, .01, false); assert.equal(shark.phase, 'cruise');
  }
  assert.ok(movement[1] > movement[0] * 2);
});

test('bubbles refill capped air once, flying fish award fish without advancing a dive mission', () => {
  const g = createGame(); g.player.breath = 4;
  g.items = [{ kind: 'bubble', x: g.player.x, y: g.player.y }];
  assert.equal(step(g, .01, false).filter(e => e.kind === 'airBonus').length, 1);
  assert.ok(g.player.breath > 6); assert.equal(g.items.length, 0);
  g.player.breath = 7.9; g.items = [{ kind: 'bubble', x: g.player.x, y: g.player.y }]; step(g, .01, false);
  assert.equal(g.player.breath, WORLD.breath);
  const beak = beakPosition(g.player);
  g.items = [{ kind: 'fish', flying: true, x: beak.x, y: beak.y, baseY: beak.y - Math.sin(g.time * 3 + beak.x * .01) * 30 }];
  step(g, .01, false); assert.equal(g.fish, 1); assert.equal(g.diveFish, 0);
});


test('air tricks need a breach and complete turns; double/triple presses award once', () => {
  for (const count of [2, 3]) {
    const g = createGame(); g.items = []; g.nextEncounter = Infinity;
    press(g); press(g); assert.equal(g.player.turns, 0, 'no tricks before a dive');
    g.player.y = 373; g.player.wet = true; g.player.vy = -210;
    step(g, .02, false);
    for (let i = 0; i < count; i++) { press(g); step(g, .05, false); }
    assert.equal(g.score, 0, 'no bonus before a full rotation');
    assert.equal(g.player.turns, count - 1);
    const events = [];
    for (let i = 0; i < 30; i++) events.push(...step(g, .05, false));
    assert.equal(g.score, count === 2 ? 50 : 120);
    assert.equal(events.filter(e => e.kind === 'trick').length, 1);
    press(g); press(g); for (let i = 0; i < 30; i++) step(g, .05, false);
    assert.equal(g.score, count === 2 ? 50 : 120, 'one bonus per breach');
  }
});

test('water and surface collisions cancel incomplete tricks without bonus', () => {
  for (const failure of ['water', 'boat', 'fisher']) {
    const g = createGame(); g.items = []; g.nextEncounter = Infinity;
    g.player.y = 373; g.player.wet = true; g.player.vy = -210; step(g, .02, false);
    press(g); step(g, .05, false); press(g); step(g, .05, false);
    if (failure === 'water') { g.player.y = 375; g.player.vy = 240; }
    else { g.player.y = failure === 'boat' ? 365 : 280; g.items = [{ kind: 'boat', x: g.player.x + (failure === 'boat' ? 80 : 0), cast: -1 }]; }
    step(g, .01, true);
    assert.equal(g.score, 0);
    if (failure === 'water') assert.equal(g.player.turns, 0);
    else assert.equal(g.ended, true);
  }
  assert.ok(hitsBoat({ x: 118, y: 370 }, { x: 198 }), 'bow contact counts before centers meet');
  assert.ok(!hitsBoat({ x: 118, y: 440 }, { x: 118 }), 'clear water below hull remains safe');
});

test('new hazards unlock gradually; quiet waves remain and every hazard appears', () => {
  const g = createGame(); g.time = 105; const seen = new Set();
  for (let i = 0; i < 12; i++) {
    g.items = []; g.distance = g.nextEncounter; step(g, .01, false);
    const hazards = g.items.filter(item => !['fish', 'bubble'].includes(item.kind));
    if (i % 2) assert.equal(hazards.length, 0);
    hazards.forEach(item => seen.add(item.kind));
  }
  assert.deepEqual([...seen], ['boat', 'shark', 'gull', 'jelly', 'driftwood', 'whirlpool']);
  const early = createGame(); early.wave = 4; early.distance = early.nextEncounter; step(early, .01, false);
  assert.ok(!early.items.some(item => ['gull', 'jelly', 'driftwood', 'whirlpool'].includes(item.kind)));
});

test('gulls and driftwood collide, jelly tentacles pulse, whirlpools pull without instant death', () => {
  for (const [kind, y] of [['gull', 285], ['driftwood', 360], ['jelly', 640]]) {
    const g = createGame(); g.player.y = y; g.player.wet = y > 372;
    g.items = [{ kind, x: g.player.x, y }]; step(g, .01, false);
    assert.equal(g.endReason, kind);
  }
  for (const [time, fatal] of [[Math.PI / 4, true], [Math.PI * 3 / 4, false]]) {
    const g = createGame(); g.time = time; g.player.y = 700; g.player.wet = true;
    g.items = [{ kind: 'jelly', x: g.player.x, y: 640 }]; step(g, .001, false);
    assert.equal(g.ended, fatal, 'contracted tentacles leave room below');
  }
  const g = createGame(); g.player.y = 620; g.player.wet = true;
  g.items = [{ kind: 'whirlpool', x: g.player.x, y: 640 }];
  const before = g.player.y; step(g, .01, false); assert.ok(g.player.y > before); assert.equal(g.ended, false);
  for (let i = 0; i < 120; i++) step(g, 1 / 60, false);
  assert.equal(g.player.wet, false, 'releasing escapes the pull');
});
