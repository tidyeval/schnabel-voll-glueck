import test from 'node:test';
import assert from 'node:assert/strict';
import { Matter } from '@tidyeval/game-platform/matter';
import { createGame, step } from '../src/game.js';
import { attachPhysics, physicsSnapshot, releasePhysics } from '../src/physics.js';

test('the game advances the supplied Matter engine and keeps Pip aligned with its body', () => {
  const engine = Matter.Engine.create(), g = createGame(() => .5);
  attachPhysics(g, engine); g.items = []; g.nextEncounter = Infinity;
  for (let i = 0; i < 90; i++) step(g, 1 / 120, true);
  const state = physicsSnapshot(g);
  assert.equal(state.engine, 'matter'); assert.equal(state.bodies, 1);
  assert.ok(state.time > 749 && state.time < 751, 'the actual Matter clock advanced');
  assert.deepEqual(state.player, { x: g.player.x, y: g.player.y });
  assert.ok(g.player.y > 370, 'holding really moves Pip underwater');
  releasePhysics(g); assert.equal(Matter.Composite.allBodies(engine.world).length, 0);
});

test('without Matter integration the movement acceptance check fails', () => {
  const g = createGame(() => .5); g.items = []; g.nextEncounter = Infinity;
  const original = Matter.Engine.update;
  try {
    Matter.Engine.update = () => {};
    for (let i = 0; i < 90; i++) step(g, 1 / 120, true);
    assert.throws(() => assert.ok(g.player.y > 370));
  } finally { Matter.Engine.update = original; releasePhysics(g); }
});
