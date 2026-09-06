import { STAGES } from './game.js';
export const unlocks = { classic: 0, flower: 25, sailor: 80 };
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
export function readProgress(raw) {
  let saved;
  try { saved = JSON.parse(raw); } catch { /* Old or unavailable storage starts fresh. */ }
  saved = saved && typeof saved === 'object' ? saved : {};
  const prefs = { record: count(saved.record), totalFish: count(saved.totalFish), outfit: 'classic', music: true, sound: true, haptics: true,
    completed: Math.min(STAGES.length, count(saved.completed)), bests: STAGES.map((_, i) => Math.max(count(saved.bests?.[i]), ...['easy', 'medium', 'hard'].map(id => count(saved.difficultyBests?.[id]?.[i])))) };
  for (const key of ['music', 'sound', 'haptics']) if (typeof saved[key] === 'boolean') prefs[key] = saved[key];
  if (Object.hasOwn(unlocks, saved.outfit) && prefs.totalFish >= unlocks[saved.outfit]) prefs.outfit = saved.outfit;
  return prefs;
}
export function recordAttempt(prefs, game) {
  if (game.accounted || !game.ended) return false;
  game.accounted = true;
  prefs.totalFish += game.fish;
  const bests = prefs.bests;
  bests[game.stage] = Math.max(bests[game.stage], game.score);
  if (game.endReason === 'complete') prefs.completed = Math.max(prefs.completed, game.stage + 1);
  return true;
}
