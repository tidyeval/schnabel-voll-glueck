import { STAGES } from './stages.js';
import { localeFrom } from './i18n.js';
import { PLUMAGES, BEAKS, SHIRTS } from './looks.js';
export const unlocks = { classic: 0, flower: 25, sailor: 80, hawaii: 150 };
/** Outfits a player unlocked by going from `before` to `after` collected fish. */
export const newOutfits = (before, after) => Object.keys(unlocks).filter(outfit => before < unlocks[outfit] && after >= unlocks[outfit]);
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const attemptIds = value => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && id))] : [];
// Saved stage numbers by save layout: where each old stage index sits today.
// No layout: bay, harbor, reef (before the lagoon). Layout 4: bay, harbor, lagoon, reef, storm.
// Layout 5 (now): bay, harbor, lagoon, storm, reef: the storm comes before the reef finale.
const LAYOUT = 5, OLD_STAGES = { 4: [0, 1, 2, 4, 3], legacy: [0, 1, 4] };
const stageMap = layout => layout === LAYOUT ? null : OLD_STAGES[layout] || OLD_STAGES.legacy;
const remapStage = (layout, stage) => { const map = stageMap(layout); return map ? map[stage] : stage; };
const remapBests = (layout, list) => { const map = stageMap(layout); return map && Array.isArray(list) ? STAGES.map((_, i) => list[map.indexOf(i)]) : list; };
export function readProgress(raw) {
  let saved;
  try { saved = JSON.parse(raw); } catch { /* Old or unavailable storage starts fresh. */ }
  saved = saved && typeof saved === 'object' ? saved : {};
  if (saved.layout !== LAYOUT) saved = { ...saved, bests: remapBests(saved.layout, saved.bests), difficultyBests: Object.fromEntries(Object.entries(saved.difficultyBests || {}).map(([id, list]) => [id, remapBests(saved.layout, list)])) };
  // Swapping storm and reef: whoever had reached the storm (the old fifth) keeps every stage open.
  // completed counts finished stages from the start, so it stays as it was; at worst the storm counts as done.
  const prefs = { layout: LAYOUT, record: count(saved.record), totalFish: count(saved.totalFish), outfit: 'classic', plumage: 'white', beak: 'orange', shirt: 'coral', music: true, sound: true, haptics: true, tutorial: false, language: localeFrom(saved.language), attemptIds: attemptIds(saved.attemptIds),
    completed: Math.min(STAGES.length, count(saved.completed)), bests: STAGES.map((_, i) => Math.max(count(saved.bests?.[i]), ...['easy', 'medium', 'hard'].map(id => count(saved.difficultyBests?.[id]?.[i])))),
    // Journey points carried into each stage, so leaving for the menu or closing the app keeps them.
    carry: saved.layout === LAYOUT ? STAGES.map((_, i) => count(saved.carry?.[i])) : STAGES.map(() => 0) };
  for (const key of ['music', 'sound', 'haptics', 'tutorial']) if (typeof saved[key] === 'boolean') prefs[key] = saved[key];
  if (Object.hasOwn(PLUMAGES, saved.plumage)) prefs.plumage = saved.plumage;
  if (Object.hasOwn(BEAKS, saved.beak)) prefs.beak = saved.beak;
  if (Object.hasOwn(SHIRTS, saved.shirt)) prefs.shirt = saved.shirt;
  if (Object.hasOwn(unlocks, saved.outfit) && prefs.totalFish >= unlocks[saved.outfit]) prefs.outfit = saved.outfit;
  return prefs;
}
export function applyAttempt(prefs, attempt) {
  if (!attempt || typeof attempt.id !== 'string' || !attempt.id || prefs.attemptIds.includes(attempt.id)) return false;
  const raw = remapStage(attempt.layout, attempt.stage);
  const stage = Number.isInteger(raw) && raw >= 0 && raw < STAGES.length ? raw : null;
  if (stage === null) return false;
  prefs.attemptIds.push(attempt.id);
  prefs.totalFish += count(attempt.fish);
  prefs.bests[stage] = Math.max(prefs.bests[stage], count(attempt.score));
  if (attempt.endReason === 'complete') {
    prefs.completed = Math.max(prefs.completed, stage + 1);
    if (stage + 1 < STAGES.length) prefs.carry[stage + 1] = count(attempt.score);
  }
  return true;
}
export function attemptFromGame(game, id) {
  if (!game.ended || typeof id !== 'string' || !id) return null;
  return { id, layout: LAYOUT, stage: game.stage, fish: game.fish, score: game.score, endReason: game.endReason };
}
export function recordAttempt(prefs, game, id = `legacy-${game.stage}-${game.score}-${game.fish}`) {
  if (game.accounted || !game.ended) return false;
  game.accounted = true;
  return applyAttempt(prefs, attemptFromGame(game, id));
}
