import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, WORLD, paceAt, STAGES, hitsTerrain } from '../src/game.js';
import { readProgress } from '../src/progress.js';
import { routeController } from './route-controller.js';

test('one continuous pace rises smoothly, carries across nests and excludes paused/feeding time', () => {
  let previous = paceAt(0);
  for (let t = 1; t <= 300; t++) {
    const next = paceAt(t);
    assert.ok(next.speed >= previous.speed && next.speed - previous.speed <= .67);
    assert.ok(next.spacing <= previous.spacing && next.spacing >= 900);
    previous = next;
  }
  const first = createGame(); first.time = 60;
  const next = createGame(Math.random, 1, first.elapsed + first.time);
  assert.equal(next.speed, paceAt(60).speed);
  assert.equal(next.player.breath, WORLD.breath);
  next.feeding = 1; step(next, .05, false); assert.equal(next.elapsed + next.time, 60);
  assert.equal('difficulty' in next, false);
});

test('every authored fish stays underwater and outside terrain, including island and nest routes', () => {
  const depths = new Set();
  for (const seed of [0, .5, .99]) for (let stage = 0; stage < STAGES.length; stage++) {
    const g = createGame(() => seed, stage);
    for (let wave = 0; wave <= STAGES[stage].encounters.length; wave++) {
      g.items = []; g.distance = g.nextEncounter; step(g, .01, false);
      const terrain = g.items.filter(i => ['island', 'reef', 'coral', 'buoy'].includes(i.kind));
      for (const f of g.items.filter(i => i.kind === 'fish')) {
        assert.ok(f.y >= WORLD.water + 35 && f.y <= 710, `${stage}/${wave}: fish at ${f.y}`);
        assert.equal(f.flying, undefined);
        assert.ok(!terrain.some(t => hitsTerrain(f, t)));
        if (!f.golden) depths.add(f.y < 465 ? 'upper' : f.y < 565 ? 'middle' : 'lower');
      }
    }
  }
  assert.deepEqual([...depths].sort(), ['lower','middle','upper']);
});

test('removing difficulty preserves possessions, unlocks and the best previous stage scores', () => {
  const prefs = readProgress(JSON.stringify({ difficulty: 'hard', bests: [900, 0, 100], difficultyBests: {easy: [50, 800, 0], medium: [400, 700, 0], hard: [1000, 0, 200]}, completed: 2, totalFish: 42, outfit: 'flower', music: false }));
  assert.deepEqual(prefs.bests, [1000, 800, 200]);
  assert.equal(prefs.totalFish, 42); assert.equal(prefs.completed, 2); assert.equal(prefs.outfit, 'flower'); assert.equal(prefs.music, false);
  assert.equal('difficulty' in prefs, false); assert.equal('difficultyBests' in prefs, false);
  assert.deepEqual(readProgress(JSON.stringify(prefs)), prefs);
});


test('the journey reaches full pace after ninety seconds and adds sharks in every stage', () => {
  assert.deepEqual(paceAt(45), { speed: 210, spacing: 930 });
  assert.deepEqual(paceAt(90), { speed: 240, spacing: 900 });
  assert.deepEqual(paceAt(300), paceAt(90));
  for (let stage = 0; stage < STAGES.length; stage++) {
    const g = createGame(() => .5, stage);
    let sharks = 0;
    for (let wave = 0; wave < STAGES[stage].encounters.length; wave++) {
      g.items = []; g.distance = g.nextEncounter; step(g, .01, false);
      sharks += g.items.filter(item => item.kind === 'shark').length;
    }
    assert.ok(sharks === [5, 7, 10][stage], `stage ${stage}: ${sharks} sharks`);
  }
});

test('the first shark interrupts the fish route before thirty seconds but leaves an escape', () => {
  const run = avoid => {
    const g = createGame(() => .5), control = routeController(); let hit = false, warned = false;
    for (let i = 0; i < 30 * 60 && !g.ended; i++) {
      let holding = control(g);
      const shark = g.items.find(item => item.kind === 'shark' && !item.hit && item.x > g.player.x - 90 && item.x < g.player.x + 300);
      if (avoid && shark) holding = g.player.y < 600;
      const events = step(g, 1 / 60, holding);
      hit ||= events.some(event => event.kind === 'hurt') && g.items.some(item => item.kind === 'shark' && item.hit);
      warned ||= events.some(event => event.kind === 'warning');
    }
    return { g, hit, warned };
  };
  const following = run(false), evading = run(true);
  assert.equal(following.hit, true); assert.equal(following.warned, true); assert.ok(following.g.time < 30);
  assert.equal(evading.hit, false); assert.equal(evading.g.ended, false); assert.ok(evading.g.wave >= 5);
});
