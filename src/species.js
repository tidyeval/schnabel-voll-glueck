// Fish species as gameplay: how often each appears per stage (weight), how it dodges Pip and what it is worth.
// evade: how far (px) it swims out of Pip's way once he is within `wary` px; quick: how fast it reacts (1/s).
// points: base points before combo and frenzy (a golden fish stays 50).
export const FISH_SPECIES = {
  classic: { points: 10, evade: 0, wary: 220, quick: 5 },
  sardine: { points: 6, evade: 35, wary: 160, quick: 6 },
  mackerel: { points: 15, evade: 80, wary: 220, quick: 8 },
  angelfish: { points: 12, evade: 30, wary: 180, quick: 3 },
  flyingfish: { points: 15, evade: 55, wary: 200, quick: 6 },
  clownfish: { points: 10, evade: 0, wary: 0, quick: 0 },
  lanternfish: { points: 20, evade: 50, wary: 200, quick: 5 },
  tang: { points: 30, evade: 100, wary: 240, quick: 9 },
};

// Weighted species per stage id; Pip's coral-pink favourite ('classic') appears everywhere but the reef.
export const STAGE_SPECIES = {
  bay: { classic: 6, sardine: 4 },
  harbor: { classic: 5, mackerel: 3, sardine: 2 },
  lagoon: { classic: 5, angelfish: 4, mackerel: 1 },
  storm: { flyingfish: 5, classic: 3, mackerel: 2 },
  reef: { clownfish: 6, lanternfish: 3, tang: 1 },
};

/** Picks a species for a stage from a random number in [0, 1). */
export function pickSpecies(stageId, roll) {
  const table = Object.entries(STAGE_SPECIES[stageId] || { classic: 1 });
  let left = roll * table.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [id, weight] of table) if ((left -= weight) < 0) return id;
  return table.at(-1)[0];
}
