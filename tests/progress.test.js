import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, recordAttempt, applyAttempt } from '../src/progress.js';
import { createGame } from '../src/game.js';
test('old/invalid saves retain valid possessions and never unlock invalid stages', () => {
  for (const raw of [undefined, 'bad', 'null', '7', '[]', '{"completed":-1,"bests":[null,-4,"7"]}']) {
    const p = readProgress(raw); assert.equal(p.completed, 0); assert.deepEqual(p.bests, [0,0,0,0,0]);
  }
  const old = readProgress(JSON.stringify({record:987,totalFish:100,outfit:'sailor',music:false,sound:false,haptics:false}));
  assert.equal(old.record,987); assert.equal(old.outfit,'sailor'); assert.equal(old.music,false); assert.equal(old.completed,0);
  assert.equal(readProgress('{"completed":8}').completed,5);
});
test('attempts bank fish once, advance only on completion and preserve the legacy record', () => {
  const prefs=readProgress('{"record":987,"totalFish":42}');
  for(let stage=0;stage<4;stage++) {
    const g=createGame(Math.random,stage);g.fish=10;g.score=100;
    assert.equal(recordAttempt(prefs,g),false);
    g.ended=true;g.endReason='complete';assert.equal(recordAttempt(prefs,g),true);assert.equal(recordAttempt(prefs,g),false);
    assert.equal(prefs.completed,stage+1);assert.equal(prefs.totalFish,52+stage*10);
    assert.deepEqual(readProgress(JSON.stringify(prefs)),prefs);
    const fresh=createGame(Math.random,stage);assert.equal(fresh.score,0);assert.equal(fresh.cargo,0);assert.equal(fresh.energy,100);assert.equal(fresh.player.breath,8);assert.equal(fresh.combo,0);assert.equal(fresh.mission,false);
  }
  const failed=createGame(Math.random,1);failed.ended=true;failed.endReason='air';failed.fish=3;recordAttempt(prefs,failed);
  assert.equal(prefs.completed,4);assert.equal(prefs.totalFish,85);assert.equal(prefs.record,987);assert.deepEqual(prefs.bests,[100,100,100,100,0]);
});

test('attempt ledgers merge distinct attempts and ignore repeated identifiers', () => {
  const prefs = readProgress();
  const first = { id: 'tab-a', stage: 0, fish: 4, score: 80, endReason: 'complete' };
  const second = { id: 'tab-b', stage: 0, fish: 6, score: 50, endReason: 'energy' };
  assert.equal(applyAttempt(prefs, first), true);
  assert.equal(applyAttempt(prefs, first), false);
  assert.equal(applyAttempt(prefs, second), true);
  assert.equal(prefs.totalFish, 10); assert.equal(prefs.bests[0], 80); assert.equal(prefs.completed, 1);
  assert.deepEqual(prefs.attemptIds, ['tab-a', 'tab-b']);
});

test('saves from before the lagoon keep their reef record on the reef', () => {
  const prefs = readProgress(JSON.stringify({ completed: 3, bests: [10, 20, 30], totalFish: 5 }));
  assert.deepEqual(prefs.bests, [10, 20, 0, 0, 30]); assert.equal(prefs.completed, 3);
  assert.deepEqual(readProgress(JSON.stringify(prefs)), prefs);
  assert.equal(applyAttempt(prefs, { id: 'old-reef', stage: 2, fish: 1, score: 99, endReason: 'energy' }), true);
  assert.deepEqual(prefs.bests, [10, 20, 0, 0, 99]);
  assert.equal(applyAttempt(prefs, { id: 'new-lagoon', layout: 4, stage: 2, fish: 1, score: 77, endReason: 'complete' }), true);
  assert.deepEqual(prefs.bests, [10, 20, 77, 0, 99]); assert.equal(prefs.completed, 3);
});

test('saves from before the storm moved ahead of the reef keep each record on its own stage', () => {
  // Layout 4 order: bay, harbor, lagoon, reef, storm. Now: bay, harbor, lagoon, storm, reef.
  const prefs = readProgress(JSON.stringify({ layout: 4, completed: 4, bests: [1, 2, 3, 40, 50], totalFish: 9 }));
  assert.deepEqual(prefs.bests, [1, 2, 3, 50, 40]); assert.equal(prefs.completed, 4, 'everything that was open stays open');
  assert.deepEqual(readProgress(JSON.stringify(prefs)), prefs);
  assert.equal(applyAttempt(prefs, { id: 'storm-run', layout: 4, stage: 4, fish: 1, score: 77, endReason: 'energy' }), true);
  assert.deepEqual(prefs.bests, [1, 2, 3, 77, 40], 'an unsaved storm run from the old layout lands on the storm');
});

test('every outfit is available from the start, whatever the fish count; unknown outfits fall back to classic', () => {
  for (const outfit of ['flower', 'sailor', 'hawaii', 'snorkel']) assert.equal(readProgress(JSON.stringify({ totalFish: 0, outfit })).outfit, outfit);
  assert.equal(readProgress(JSON.stringify({ outfit: 'tuxedo' })).outfit, 'classic');
});

test('Pip keeps the saved feather and beak colours; unknown colours fall back to white and orange', () => {
  const saved = readProgress(JSON.stringify({ plumage: 'rose', beak: 'lemon' }));
  assert.equal(saved.plumage, 'rose'); assert.equal(saved.beak, 'lemon');
  const odd = readProgress(JSON.stringify({ plumage: 'teal', beak: 42 }));
  assert.equal(odd.plumage, 'white'); assert.equal(odd.beak, 'orange');
});
test('a finished stage hands its points to the next one, kept across saves', () => {
  const prefs = readProgress('{}');
  assert.deepEqual(prefs.carry, [0, 0, 0, 0, 0]);
  applyAttempt(prefs, { id: 'a', layout: 5, stage: 1, fish: 9, score: 640, endReason: 'energy' });
  assert.equal(prefs.carry[2], 0, 'a failed stage carries nothing on');
  applyAttempt(prefs, { id: 'b', layout: 5, stage: 1, fish: 20, score: 1500, endReason: 'complete' });
  assert.equal(prefs.carry[2], 1500);
  applyAttempt(prefs, { id: 'c', layout: 5, stage: 4, fish: 20, score: 9000, endReason: 'complete' });
  assert.equal(prefs.carry.length, 5, 'the finale hands nothing on');
  assert.deepEqual(readProgress(JSON.stringify(prefs)).carry, [0, 0, 1500, 0, 0]);
});
test('the Hawaiian shirt keeps its saved colour; unknown colours fall back to coral', () => {
  assert.equal(readProgress(JSON.stringify({ outfit: 'hawaii', shirt: 'mint' })).shirt, 'mint');
  assert.equal(readProgress(JSON.stringify({ shirt: 'plaid' })).shirt, 'coral');
});
