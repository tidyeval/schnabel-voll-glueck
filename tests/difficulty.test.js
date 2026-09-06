import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, WORLD } from '../src/game.js';
import { readProgress, recordAttempt } from '../src/progress.js';

test('difficulty changes reserves and consequences while preserving steering', () => {
  const runs = ['easy', 'medium', 'hard'].map(id => createGame(() => .5, 0, id));
  for (const g of runs) { g.items = []; g.nextEncounter = Infinity; }
  assert.deepEqual(runs.map(g => g.player.breath), [10, 8, 7]);
  for (let i = 0; i < 300; i++) for (const g of runs) step(g, .01, i < 100);
  assert.equal(runs[0].player.y, runs[1].player.y);
  assert.equal(runs[1].player.y, runs[2].player.y);
  assert.ok(runs[0].energy > runs[1].energy && runs[1].energy > runs[2].energy);
  const losses = runs.map(g => {
    g.player.y = 500; g.player.wet = true;
    g.items = [{ kind: 'harpoon', x: 118, y: 500, vx: 0, vy: 0, life: 2 }];
    const before = g.energy; step(g, .01, false); return before - g.energy;
  });
  assert.ok(losses[0] < losses[1] && losses[1] < losses[2]);
  for (const g of runs) {
    g.items = []; g.player.y = 265; g.player.wet = false; g.player.breath = 0;
    for (let i = 0; i < 200; i++) step(g, .01, false);
    assert.equal(g.player.breath, g.rules.breath, 'two seconds above water fully refill each profile');
  }
});

test('old saves survive, difficulty persists and new records remain separate', () => {
  const prefs = readProgress(JSON.stringify({ bests: [900, 800, 700], completed: 2, totalFish: 42, outfit: 'flower', difficulty: 'easy' }));
  assert.equal(prefs.difficulty, 'easy');
  for (const [difficulty, score] of [['easy', 400], ['medium', 200], ['hard', 100]]) {
    const g = createGame(Math.random, 0, difficulty);
    Object.assign(g, { ended: true, endReason: 'complete', score, fish: 5 });
    assert.equal(recordAttempt(prefs, g), true); assert.equal(recordAttempt(prefs, g), false);
    assert.equal(prefs.difficultyBests[difficulty][0], score);
  }
  assert.deepEqual(prefs.bests, [900, 800, 700], 'legacy results are retained without assigning them to a new profile');
  assert.equal(prefs.completed, 2); assert.equal(prefs.totalFish, 57); assert.equal(prefs.outfit, 'flower');
  assert.deepEqual(readProgress(JSON.stringify(prefs)), prefs);
  for (const difficulty of ['wrong', '__proto__', 'constructor', null, 1, ['easy'], { toString: 'easy' }]) {
    assert.equal(createGame(Math.random, 0, difficulty).difficulty, 'medium');
    assert.equal(readProgress(JSON.stringify({ difficulty })).difficulty, 'medium');
  }
  assert.equal(createGame().player.breath, WORLD.breath);
});
