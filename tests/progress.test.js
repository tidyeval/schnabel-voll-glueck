import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress, recordAttempt } from '../src/progress.js';
import { createGame } from '../src/game.js';
test('old/invalid saves retain valid possessions and never unlock invalid stages', () => {
  for (const raw of [undefined, 'bad', 'null', '7', '[]', '{"completed":-1,"bests":[null,-4,"7"]}']) {
    const p = readProgress(raw); assert.equal(p.completed, 0); assert.deepEqual(p.bests, [0,0,0]);
  }
  const old = readProgress(JSON.stringify({record:987,totalFish:100,outfit:'sailor',music:false,sound:false,haptics:false}));
  assert.equal(old.record,987); assert.equal(old.outfit,'sailor'); assert.equal(old.music,false); assert.equal(old.completed,0);
  assert.equal(readProgress('{"completed":8}').completed,3);
});
test('attempts bank fish once, advance only on completion and preserve the legacy record', () => {
  const prefs=readProgress('{"record":987,"totalFish":42}');
  for(let stage=0;stage<3;stage++) {
    const g=createGame(Math.random,stage);g.fish=10;g.score=100;
    assert.equal(recordAttempt(prefs,g),false);
    g.ended=true;g.endReason='complete';assert.equal(recordAttempt(prefs,g),true);assert.equal(recordAttempt(prefs,g),false);
    assert.equal(prefs.completed,stage+1);assert.equal(prefs.totalFish,52+stage*10);
    assert.deepEqual(readProgress(JSON.stringify(prefs)),prefs);
    const fresh=createGame(Math.random,stage);assert.equal(fresh.score,0);assert.equal(fresh.cargo,0);assert.equal(fresh.energy,100);assert.equal(fresh.player.breath,8);assert.equal(fresh.combo,0);assert.equal(fresh.mission,false);
  }
  const failed=createGame(Math.random,1);failed.ended=true;failed.endReason='air';failed.fish=3;recordAttempt(prefs,failed);
  assert.equal(prefs.completed,3);assert.equal(prefs.totalFish,75);assert.equal(prefs.record,987);assert.deepEqual(prefs.bests,[100,100,100]);
});
