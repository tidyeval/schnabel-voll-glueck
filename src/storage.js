import { Capacitor } from '@capacitor/core';
import { createProgressStore } from '@tidyeval/game-platform/storage';
import { readProgress, applyAttempt } from './progress.js';

const STORAGE_KEY = 'pelican-phaser-matter-v1';

const store = createProgressStore({ key: STORAGE_KEY, read: readProgress, apply: applyAttempt, durable: Capacitor.isNativePlatform() });
export const prepareProgress = store.ready;
export const isProgressKey = store.isKey;
export const readStoredProgress = store.load;
export const saveSetting = store.saveSetting;
export const saveAttempt = store.saveAttempt;

/** Startup remains playable without storage; explicit saves report errors separately. */
export function restoreProgress() {
  if (Capacitor.isNativePlatform()) return readStoredProgress();
  let prefs;
  try { prefs = readStoredProgress(); } catch { prefs = readProgress(); }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* A later explicit save will report failure. */ }
  return prefs;
}
