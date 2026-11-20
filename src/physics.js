import { Matter, accelerate, createPhysicsWorld, polygonBody, setVelocity, velocity } from '@tidyeval/game-platform/matter';

const worlds = new WeakMap();

/*
 * Pip is a solid body with real horizontal momentum. Its physics x is game.distance + screen x,
 * so terrain is static in physics space and the camera follows Pip.
 */
export function attachPhysics(game, engine) {
  releasePhysics(game);
  const world = createPhysicsWorld(engine);
  const body = world.add(Matter.Bodies.circle(game.player.x + game.distance, game.player.y, 18, {
    inertia: Infinity, frictionAir: 0, friction: 0, frictionStatic: 0, restitution: .45, label: 'Pip',
  }));
  const state = { world, body, terrain: new Map(), bumped: null };
  state.onCollide = event => {
    for (const pair of event.pairs) if (pair.bodyA === body || pair.bodyB === body) state.bumped ??= { ...body.position };
  };
  Matter.Events.on(world.engine, 'collisionStart', state.onCollide);
  worlds.set(game, state);
}

/** Solid terrain bodies follow the items; each block is placed once, in physics space. */
function syncTerrain(state, game, terrain) {
  const present = new Set(terrain.map(entry => entry.item));
  for (const [item, bodies] of state.terrain) if (!present.has(item)) { bodies.forEach(b => state.world.remove(b)); state.terrain.delete(item); }
  for (const { item, blocks } of terrain) {
    if (state.terrain.has(item)) continue;
    state.terrain.set(item, blocks.map(block => state.world.add(polygonBody(block.points.map(point => ({ x: point.x + game.distance, y: point.y })),
      { isStatic: true, restitution: .45, friction: 0, frictionStatic: 0, label: item.kind })))); 
  }
}

/**
 * One step. Pip starts with velocity (vx, vy); forceAt(screenX, y) returns acceleration in
 * units/s² and is applied on every Matter substep. Terrain blocks collide and bounce Pip.
 * @returns {{ moved: number, vx: number, vy: number, y: number, bumped: {x: number, y: number} | null }}
 */
export function movePlayerSolid(game, dt, vx, vy, terrain, forceAt) {
  if (!worlds.has(game)) attachPhysics(game);
  const state = worlds.get(game), { world, body } = state, p = game.player, base = game.distance;
  syncTerrain(state, game, terrain);
  Matter.Body.setPosition(body, { x: base + p.x, y: p.y });
  setVelocity(body, vx, vy);
  state.bumped = null;
  world.step(dt, () => {
    const force = forceAt(body.position.x - base, body.position.y);
    if (force.x || force.y) accelerate(body, force.x, force.y);
  });
  const v = velocity(body);
  return { moved: body.position.x - base - p.x, vx: v.x, vy: v.y, y: body.position.y,
    bumped: state.bumped && { x: state.bumped.x - base, y: state.bumped.y } };
}

export function physicsSnapshot(game) {
  const state = worlds.get(game);
  if (!state) return null;
  const x = state.body.position.x - (state.syncedAt ?? 0);
  return { engine: 'matter', bodies: Matter.Composite.allBodies(state.world.engine.world).length,
    time: state.world.engine.timing.timestamp, player: { x: Math.round(x * 1e6) / 1e6, y: state.body.position.y } };
}

export function syncPlayerBody(game) {
  const state = worlds.get(game), p = game.player;
  if (!state) return;
  state.syncedAt = game.distance;
  Matter.Body.setPosition(state.body, { x: p.x + state.syncedAt, y: p.y });
  setVelocity(state.body, p.vx, p.vy);
}

export function releasePhysics(game) {
  const state = worlds.get(game);
  if (!state) return;
  Matter.Events.off(state.world.engine, 'collisionStart', state.onCollide);
  state.world.dispose(); worlds.delete(game);
}

/*
 * Contact shapes. Every touch in the game (catches, hazards, pickups, zones) is decided by
 * Matter: shapes become sensor bodies and Matter.Query answers whether they overlap.
 * A point is Pip's beak or centre; it is tested with Matter.Query.point.
 */
export const shape = {
  point: (x, y) => ({ type: 'point', x, y }),
  circle: (x, y, r) => ({ type: 'ellipse', x, y, rx: r, ry: r }),
  ellipse: (x, y, rx, ry) => ({ type: 'ellipse', x, y, rx, ry }),
  box: (left, top, right, bottom) => ({ type: 'box', left, top, right, bottom }),
  polygon: points => ({ type: 'polygon', points }),
};

/** The same shape enlarged by margin on every side, for near-miss zones. */
export function grow(s, margin) {
  if (!s) return s;
  if (s.type === 'ellipse') return shape.ellipse(s.x, s.y, s.rx + margin, s.ry + margin);
  if (s.type === 'box') return shape.box(s.left - margin, s.top - margin, s.right + margin, s.bottom + margin);
  throw new Error(`grow() supports ellipse and box shapes, not ${s.type}`);
}

function bounds(s) {
  if (s.type === 'point') return { min: { x: s.x, y: s.y }, max: { x: s.x, y: s.y } };
  if (s.type === 'ellipse') return { min: { x: s.x - s.rx, y: s.y - s.ry }, max: { x: s.x + s.rx, y: s.y + s.ry } };
  if (s.type === 'box') return { min: { x: s.left, y: s.top }, max: { x: s.right, y: s.bottom } };
  return Matter.Bounds.create(s.points);
}

function body(s) {
  const options = { isSensor: true, isStatic: true };
  if (s.type === 'box') return Matter.Bodies.rectangle((s.left + s.right) / 2, (s.top + s.bottom) / 2, s.right - s.left, s.bottom - s.top, options);
  if (s.type === 'polygon') return polygonBody(s.points, options);
  // A 32-gon drawn around the ellipse, so its flat sides never fall inside the true outline.
  const b = Matter.Bodies.polygon(s.x, s.y, 32, 1 / Math.cos(Math.PI / 32), options);
  Matter.Body.scale(b, s.rx, s.ry);
  return b;
}

/** True when Matter reports the two shapes overlapping. A missing shape touches nothing. */
export function touches(a, b) {
  if (!a || !b) return false;
  if (!Matter.Bounds.overlaps(bounds(a), bounds(b))) return false;
  if (a.type === 'point' && b.type === 'point') return a.x === b.x && a.y === b.y;
  if (b.type === 'point') [a, b] = [b, a];
  if (a.type === 'point') return Matter.Query.point([body(b)], a).length > 0;
  return Matter.Query.collides(body(a), [body(b)]).length > 0;
}
