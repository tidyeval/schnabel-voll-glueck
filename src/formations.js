// Fish formations: the shape a school takes through an encounter, rolled anew every wave so runs
// don't repeat. Mockup: docs/formations.html.
//
// Shapes for every school keep the old arc's depth envelope (base .. base + height), so they stay
// as clear of each hazard as the arc was. The free shapes leave that envelope and are only used
// where the water is open: a single creature deep below (jelly, puffer, diver) or a surface hazard
// (driftwood, surfer), with no set piece or rare moment on the same wave. A whirlpool pulls Pip and
// the school towards it, so its wave keeps the arc (see game.js).

/** Depth profiles over a school (k = 0..1 along it), 0 = base depth, 1 = deepest. */
export const SHAPES = {
  arc: k => Math.sin(k * Math.PI),
  // Two dips: dive, rise without surfacing, dive again.
  wave: k => Math.abs(Math.sin(k * Math.PI * 2)),
  // Three steps down: hold a depth, then drop to the next.
  steps: k => k < .3 ? .1 : k < .65 ? .55 : 1,
};
export const DEEP_HAZARDS = ['jelly', 'puffer', 'diver'], SURFACE_HAZARDS = ['driftwood', 'surfer'];
/** Free shapes and how often each is rolled; `deepOnly` shapes need the surface clear. */
export const FORMATIONS = {
  arc: { weight: 2 }, wave: { weight: 2 }, steps: { weight: 2 },
  school: { weight: 1.5 }, stragglers: { weight: 1.5 }, ramp: { weight: 1, deepOnly: true },
};
export const SCHOOL = { centre: 505, rx: 120, ry: 48, bob: 32, speed: 1.3, count: 9 };

/** The formation for this wave: one of SHAPES for a crowded wave, any fitting formation in open water. */
export function pickFormation(kind, companions, open, roll) {
  const free = open && !companions.length && (DEEP_HAZARDS.includes(kind) || SURFACE_HAZARDS.includes(kind));
  const names = Object.keys(FORMATIONS).filter(name => free ? !(FORMATIONS[name].deepOnly && !DEEP_HAZARDS.includes(kind)) : SHAPES[name]);
  const total = names.reduce((sum, name) => sum + FORMATIONS[name].weight, 0);
  let left = roll * total;
  return names.find(name => (left -= FORMATIONS[name].weight) < 0) || names[names.length - 1];
}

/**
 * Fish positions for a formation: [x, y, extra] with x in world pixels at spawn.
 * `base` and `height` are the arc envelope the encounter would have used.
 */
export function formationFish(name, base, height) {
  if (SHAPES[name]) return Array.from({ length: 11 }, (_, i) => [540 + i * 64, base + SHAPES[name](i / 10) * height]);
  if (name === 'school') {
    // A loose shoal, spaced wider than Pip's bite, that rises and sinks together.
    return Array.from({ length: SCHOOL.count }, (_, i) => {
      const a = i * 2.39996, r = Math.sqrt((i + .5) / SCHOOL.count);
      return [800 + Math.cos(a) * r * SCHOOL.rx, SCHOOL.centre + Math.sin(a) * r * SCHOOL.ry, { bob: true }];
    });
  }
  // Single fish at changing depths, too far apart to take every one: Pip picks a line.
  if (name === 'stragglers') return [430, 545, 455, 560, 425, 520, 445, 540, 430].map((y, i) => [560 + i * 80, y]);
  // Down for a run-up, then steeply up to just under the surface: the leapers after it reward the jump.
  return [440, 500, 550, 575, 565, 530, 485, 445, 415, 400].map((y, i) => [540 + i * 64, y]);
}
