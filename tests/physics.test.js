import test from 'node:test';
import assert from 'node:assert/strict';
import { Matter } from '@tidyeval/game-platform/matter';
import { beakPosition, createGame, step } from '../src/game.js';
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

test('every contact kind is decided by Matter queries', async () => {
  const { shape, touches, grow } = await import('../src/physics.js');
  assert.ok(touches(shape.point(10, 0), shape.circle(0, 0, 12)));
  assert.ok(!touches(shape.point(13, 0), shape.circle(0, 0, 12)));
  assert.ok(touches(shape.point(30, 0), shape.ellipse(0, 0, 36, 32)) && !touches(shape.point(0, 33), shape.ellipse(0, 0, 36, 32)));
  assert.ok(touches(shape.circle(0, 0, 18), shape.box(15, -5, 40, 5)) && !touches(shape.circle(0, 0, 18), shape.box(19, -5, 40, 5)));
  assert.ok(touches(shape.point(-25, 0), grow(shape.box(0, -5, 10, 5), 26)));
  assert.equal(touches(shape.point(0, 0), null), false);
  const g = createGame(() => .5); g.nextEncounter = Infinity;
  const place = () => { const b = beakPosition(g.player); g.items = [{ kind: 'fish', x: b.x, y: b.y }]; g.speed = 0; };
  const original = { point: Matter.Query.point, collides: Matter.Query.collides };
  try {
    Matter.Query.point = () => []; Matter.Query.collides = () => [];
    place(); step(g, 1 / 60, false);
    assert.equal(g.fish, 0, 'with Matter queries disabled nothing is caught');
  } finally { Object.assign(Matter.Query, original); }
  place(); step(g, 1 / 60, false);
  assert.equal(g.fish, 1, 'Matter reports the catch');
  releasePhysics(g);
});
