import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, WORLD, paceAt, STAGES, hitsTerrain } from '../src/game.js';
import { readProgress } from '../src/progress.js';

test('one continuous pace rises smoothly, carries across nests and excludes paused/feeding time', () => {
  let previous = paceAt(0);
  for (let t = 1; t <= 300; t++) {
    const next = paceAt(t);
    assert.ok(next.speed >= previous.speed && next.speed - previous.speed <= .251);
    assert.ok(next.spacing <= previous.spacing && next.spacing >= 980);
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
