import { STAGES } from './game.js';
import { localeFrom } from './i18n.js';
export const unlocks = { classic: 0, flower: 25, sailor: 80 };
const count = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
const attemptIds = value => Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && id))] : [];
export function readProgress(raw) {
  let saved;
  try { saved = JSON.parse(raw); } catch { /* Old or unavailable storage starts fresh. */ }
  saved = saved && typeof saved === 'object' ? saved : {};
  const prefs = { record: count(saved.record), totalFish: count(saved.totalFish), outfit: 'classic', music: true, sound: true, haptics: true, language: localeFrom(saved.language), attemptIds: attemptIds(saved.attemptIds),
    completed: Math.min(STAGES.length, count(saved.completed)), bests: STAGES.map((_, i) => Math.max(count(saved.bests?.[i]), ...['easy', 'medium', 'hard'].map(id => count(saved.difficultyBests?.[id]?.[i])))) };
  for (const key of ['music', 'sound', 'haptics']) if (typeof saved[key] === 'boolean') prefs[key] = saved[key];
  if (Object.hasOwn(unlocks, saved.outfit) && prefs.totalFish >= unlocks[saved.outfit]) prefs.outfit = saved.outfit;
  return prefs;
}
export function applyAttempt(prefs, attempt) {
  if (!attempt || typeof attempt.id !== 'string' || !attempt.id || prefs.attemptIds.includes(attempt.id)) return false;
  const stage = Number.isInteger(attempt.stage) && attempt.stage >= 0 && attempt.stage < STAGES.length ? attempt.stage : null;
  if (stage === null) return false;
  prefs.attemptIds.push(attempt.id);
  prefs.totalFish += count(attempt.fish);
  prefs.bests[stage] = Math.max(prefs.bests[stage], count(attempt.score));
  if (attempt.endReason === 'complete') prefs.completed = Math.max(prefs.completed, stage + 1);
  return true;
}
export function attemptFromGame(game, id) {
  if (!game.ended || typeof id !== 'string' || !id) return null;
  return { id, stage: game.stage, fish: game.fish, score: game.score, endReason: game.endReason };
}
export function recordAttempt(prefs, game, id = `legacy-${game.stage}-${game.score}-${game.fish}`) {
  if (game.accounted || !game.ended) return false;
  game.accounted = true;
  return applyAttempt(prefs, attemptFromGame(game, id));
}
