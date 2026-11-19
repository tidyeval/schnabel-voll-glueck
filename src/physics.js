import { Matter, createPhysicsWorld, setVelocity } from '@tidyeval/game-platform/matter';

const worlds = new WeakMap();

export function attachPhysics(game, engine) {
  releasePhysics(game);
  const world = createPhysicsWorld(engine);
  const body = world.add(Matter.Bodies.circle(game.player.x, game.player.y, 18, {
    inertia: Infinity, frictionAir: 0, isSensor: true, label: 'Pip',
  }));
  worlds.set(game, { world, body });
}

/** The controller chooses swim velocity; Matter advances Pip's actual body. */
export function movePlayerBody(game, dt, vy) {
  if (!worlds.has(game)) attachPhysics(game);
  const { world, body } = worlds.get(game), p = game.player;
  Matter.Body.setPosition(body, { x: p.x, y: p.y });
  setVelocity(body, 0, vy);
  world.step(dt);
  p.x = body.position.x; p.y = body.position.y;
}

export function physicsSnapshot(game) {
  const state = worlds.get(game);
  return state ? { engine: 'matter', bodies: Matter.Composite.allBodies(state.world.engine.world).length, time: state.world.engine.timing.timestamp,
    player: { ...state.body.position } } : null;
}

export function syncPlayerBody(game) {
  const state = worlds.get(game);
  if (state) { Matter.Body.setPosition(state.body, { x: game.player.x, y: game.player.y }); setVelocity(state.body, 0, game.player.vy); }
}

export function releasePhysics(game) {
  worlds.get(game)?.world.dispose(); worlds.delete(game);
}
