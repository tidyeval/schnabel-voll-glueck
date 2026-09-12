import './style.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { createGame, step, press, WORLD, STAGES, airState } from './game.js';
import { drawWorld } from './art.js';
import { createAudio } from './audio.js';
import { readProgress, recordAttempt, attemptFromGame, applyAttempt, unlocks } from './progress.js';

const $ = id => document.getElementById(id);
const app = $('app'), canvas = $('world'), ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STORAGE_KEY = 'pelican-v1', ATTEMPT_PREFIX = `${STORAGE_KEY}-attempt:`;
function storedProgress() {
  const progress = readProgress(localStorage.getItem(STORAGE_KEY));
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(ATTEMPT_PREFIX)) continue;
    try { applyAttempt(progress, JSON.parse(localStorage.getItem(key))); } catch { /* Ignore malformed ledger entries. */ }
  }
  return progress;
}
let initial;
try { initial = storedProgress(); } catch { initial = readProgress(); }
const prefs = initial;
try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch { /* A later explicit save will report failure. */ }
let selectedStage = Math.min(prefs.completed, STAGES.length - 1);
const audio = createAudio(prefs);
let game = createGame(), mode = 'menu', holding = false, effects = [], last = 0, animation = 0, toastUntil = 0, needsDraw = true;
function text(id, value) { if ($(id).textContent !== String(value)) $(id).textContent = value; }
function syncPrefs(latest) { Object.assign(prefs, latest); }
function persistSettings(key) {
  try {
    const latest = storedProgress(); latest[key] = prefs[key];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(latest)); syncPrefs(latest); return true;
  } catch { toast('Deine Einstellung konnte gerade nicht gespeichert werden.'); return false; }
}
function persistAttempt(attempt) {
  try {
    localStorage.setItem(ATTEMPT_PREFIX + attempt.id, JSON.stringify(attempt));
    const latest = storedProgress();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(latest)); syncPrefs(latest); return true;
  } catch { return false; }
}
function toast(message) { text('toast', message); $('toast').classList.remove('hidden'); toastUntil = performance.now() + 3000; }
function clock(seconds) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
function refreshMenu() {
  document.querySelector('.record').hidden = prefs.record === 0;
  text('record', prefs.record.toLocaleString('de-DE')); text('wallet', `${prefs.totalFish} Fische`);
  $('stages').replaceChildren(...STAGES.map((stage, i) => {
    const option = document.createElement('option'); option.value = i;
    option.textContent = `${i < prefs.completed ? '✓ ' : ''}${stage.name}${i > prefs.completed ? ' · noch verschlossen' : ''}`;
    option.disabled = i > prefs.completed; return option;
  }));
  $('stages').value = selectedStage;
  text('stage-best', `Rekord: ${prefs.bests[selectedStage]} Punkte`);
  text('play-label', prefs.completed ? 'Weiter gehts!' : 'Los gehts!');
}
$('stages').onchange = () => { selectedStage = Number($('stages').value); refreshMenu(); };

function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
function start(elapsed) {
  closeDialogs(); game = createGame(Math.random, selectedStage, elapsed); game.attemptId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; effects = []; mode = 'playing'; holding = false;
  $('start').classList.add('hidden'); $('hud').classList.remove('hidden'); $('pause').classList.remove('hidden');
  $('toast').classList.add('hidden'); audio.start(); updateHud(); canvas.focus();
}
function home() {
  selectedStage = Math.min(prefs.completed, STAGES.length - 1);
  closeDialogs(); mode = 'menu'; holding = false; effects = []; audio.pause();
  $('start').classList.remove('hidden'); $('hud').classList.add('hidden'); $('pause').classList.add('hidden'); refreshMenu(); $('play').focus();
}
function pause(showDialog = true) {
  if (mode !== 'playing') return;
  mode = 'paused'; holding = false; audio.pause();
  if (showDialog) $('pause-dialog').showModal();
}
function resume() { closeDialogs(); holding = false; mode = 'playing'; last = performance.now(); audio.start(); canvas.focus(); }
function finish() {
  if (mode === 'ended') return;
  const record = game.score > prefs.bests[game.stage];
  game.ended = true; const attempt = attemptFromGame(game, game.attemptId); recordAttempt(prefs, game, game.attemptId);
  const complete = game.endReason === 'complete';
  const final = complete && game.stage === STAGES.length - 1;
  $('next-stage').classList.toggle('hidden', !complete || final);
  text('again', 'Nochmal');
  mode = 'ended'; holding = false; game.ended = true;
  const saved = persistAttempt(attempt); $('retry-save').classList.toggle('hidden', saved);
  text('result-kicker', complete ? (final ? 'ALLE NESTER ERREICHT' : 'NEST ERREICHT') : record ? 'NEUER ETAPPENREKORD' : STAGES[game.stage].name);
  text('result-title', { puffer: 'Ein aufgeblasener Kugelfisch!', island: 'Die Insel erwischt!', reef: 'Am Felsen hängen geblieben!', buoy: 'Eine Boje erwischt!', coral: 'An den Korallen hängen geblieben!', diver: 'Taucher voraus!', harpoon: 'Von der Harpune erwischt!', surfer: 'Surfer voraus!', gull: 'Möwe im Anflug!', jelly: 'Eine Qualle erwischt!', driftwood: 'Treibholz voraus!', air: 'Die Luft ist aus!', shark: 'Vom Hai erwischt!', net: 'Im Netz gelandet!', fisher: 'Fischer voraus!', energy: 'Keine Energie mehr!', complete: final ? 'Alle Küken satt. Herz auch.' : 'Willkommen im Nest!' }[game.endReason] || 'Bis zur nächsten Runde!');
  text('result-score', game.score); text('result-fish', game.fish); text('result-combo', game.bestCombo); text('result-time', clock(game.time));
  const resultMessage = complete ? (final ? 'Pip hat alle drei Nester erreicht. Besuche deine Lieblingsbucht wieder!' : `Weiter zum ${STAGES[game.stage + 1].name === 'Fischerhafen' ? 'Fischerhafen' : 'Korallenriff'}.`) : game.mission ? '✦ Tauchmission geschafft! +100 Punkte' : 'Nächstes Ziel: 5 Fische in einem Tauchgang.';
  text('result-mission', saved ? `${resultMessage} Dein Fortschritt ist gespeichert.` : `${resultMessage} Dein Fortschritt konnte nicht gespeichert werden.`);
  closeDialogs(); $('result-dialog').showModal(); $('pause').classList.add('hidden'); audio.effect('end');
}
function updateHud() {
  text('score', game.score); text('time', clock(Math.floor(game.time)));
  const energy = Math.ceil(game.energy); $('energy').style.width = energy + '%'; $('energy').style.background = energy < 25 ? '#d78560' : '#5c9e79';
  text('energy-value', energy); document.querySelector('.energy-track').setAttribute('aria-valuenow', energy);
  const p = game.player;
  $('air').classList.toggle('hidden', !p.wet && p.breath >= WORLD.breath);
  const { level, urgency } = airState(p, game.cargo);
  $('air').classList.toggle('low-air', level > 0);
  const pulse = reducedMotion ? 2 : 2 + (1 + Math.sin(animation * (5 + urgency * 5))) * 2;
  $('status-panel').style.boxShadow = level ? `0 0 0 ${pulse}px #ffd59a66` : '';
  text('air-label', level ? 'AUFTAUCHEN' : 'LUFT');
  text('air-value', `${p.breath.toFixed(1)} s`);
  $('air-fill').style.width = `${p.breath / WORLD.breath * 100}%`;
  document.querySelector('.air-track').setAttribute('aria-valuemax', WORLD.breath);
  document.querySelector('.air-track').setAttribute('aria-valuenow', p.breath.toFixed(1));
}
canvas.tabIndex = 0;
$('play').onclick = () => start(); $('again').onclick = () => { selectedStage = game.stage; start(); };
$('next-stage').onclick = () => { selectedStage = Math.min(game.stage + 1, STAGES.length - 1); start(game.elapsed + game.time); }; $('back-home').onclick = home;
$('pause').onclick = () => pause(); $('resume').onclick = resume;
$('quit').onclick = finish;
$('settings').onclick = () => { pause(false); $('settings-dialog').showModal(); };
function afterSettings() { $('settings-dialog').close(); if (mode === 'paused') $('pause-dialog').showModal(); }
$('settings-dialog').querySelector('.close').onclick = afterSettings;
$('settings-dialog').querySelector('.close-settings').onclick = afterSettings;
for (const key of ['music', 'sound', 'haptics']) { $(key).checked = prefs[key]; $(key).onchange = () => { prefs[key] = $(key).checked; persistSettings(key); }; }
$('wardrobe').onclick = () => {
  text('wardrobe-wallet', `${prefs.totalFish} Fische gesammelt. Welcher Look darf’s sein?`);
  document.querySelectorAll('[data-outfit]').forEach(button => {
    button.disabled = prefs.totalFish < unlocks[button.dataset.outfit];
    button.setAttribute('aria-pressed', String(prefs.outfit === button.dataset.outfit));
  });
  $('wardrobe-dialog').showModal();
};
$('wardrobe-dialog').querySelector('.close').onclick = () => $('wardrobe-dialog').close();
document.querySelectorAll('[data-outfit]').forEach(button => button.onclick = () => {
  if (prefs.totalFish < unlocks[button.dataset.outfit]) return;
  prefs.outfit = button.dataset.outfit; persistSettings('outfit'); $('wardrobe-dialog').close();
});
$('retry-save').onclick = () => {
  const attempt = attemptFromGame(game, game.attemptId);
  if (!persistAttempt(attempt)) return;
  $('retry-save').classList.add('hidden');
  const message = $('result-mission').textContent.replace('Dein Fortschritt konnte nicht gespeichert werden.', '').trim();
  text('result-mission', `${message} Dein Fortschritt ist gespeichert.`);
};
window.addEventListener('storage', event => {
  if (event.key !== STORAGE_KEY && !event.key?.startsWith(ATTEMPT_PREFIX)) return;
  try { syncPrefs(storedProgress()); if (mode === 'menu') refreshMenu(); } catch { /* Keep the current in-memory state. */ }
});
$('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); resume(); });
$('settings-dialog').addEventListener('cancel', event => { event.preventDefault(); afterSettings(); });
$('result-dialog').addEventListener('cancel', event => { event.preventDefault(); home(); });
app.addEventListener('pointerdown', event => {
  if (mode !== 'playing' || event.target.closest('button, dialog, input')) return;
  event.preventDefault(); if (!holding) press(game); holding = true; app.setPointerCapture(event.pointerId);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) app.addEventListener(name, () => { holding = false; });
window.addEventListener('keydown', event => {
  if (event.code === 'Space' && mode === 'playing' && !event.target.closest('button, input, dialog')) { event.preventDefault(); if (!event.repeat && !holding) press(game); holding = true; }
  if (event.code === 'Escape' && mode === 'playing') { event.preventDefault(); pause(); }
});
window.addEventListener('keyup', event => { if (event.code === 'Space') { holding = false; if (mode === 'playing') event.preventDefault(); } });
window.addEventListener('blur', () => pause());
document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); audio.pause(); } });
if (Capacitor.isNativePlatform()) {
  App.addListener('appStateChange', ({ isActive }) => { if (!isActive) { pause(); audio.pause(); } });
  App.addListener('backButton', () => {
    if ($('settings-dialog').open) afterSettings();
    else if ($('wardrobe-dialog').open) $('wardrobe-dialog').close();
    else if (mode === 'playing') pause();
    else if (mode === 'paused') resume();
    else if (mode === 'ended') home();
    else App.minimizeApp();
  });
}
function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = WORLD.width * ratio; canvas.height = WORLD.height * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  needsDraw = true;
}
window.addEventListener('resize', resize); resize(); refreshMenu();
function frame(now) {
  const dt = Math.min(.05, Math.max(0, (now - (last || now)) / 1000)); last = now;
  if (mode === 'playing' || mode === 'menu') animation += dt;
  if (mode === 'playing') {
    for (const event of step(game, dt, holding)) {
      if (event.kind === 'end') { finish(); break; }
      if (event.x !== undefined && event.kind !== 'warning') effects.push({ ...event, life: 1 });
      audio.effect(event.kind);
      if (event.kind === 'delivery') holding = false;
    }
    updateHud();
  }
  if (mode !== 'paused') { for (const effect of effects) effect.life -= dt; effects = effects.filter(e => e.life > 0); }
  if (now > toastUntil) $('toast').classList.add('hidden');
  audio.update(animation);
  if (mode !== 'paused' || needsDraw) {
    drawWorld(ctx, game, mode, reducedMotion && mode === 'menu' ? 0 : animation, prefs.outfit, effects, reducedMotion);
    needsDraw = false;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
let installPrompt, registration, applyingUpdate = false, reloadReady = false;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
$('install').hidden = Capacitor.isNativePlatform() || standalone();
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; $('install').hidden = false; });
window.addEventListener('appinstalled', () => { installPrompt = null; $('install').hidden = true; });
$('install').onclick = async () => {
  if (!installPrompt) { $('install-help').showModal(); return; }
  const prompt = installPrompt; installPrompt = null;
  try { await prompt.prompt(); } catch { $('install-help').showModal(); }
};
$('install-help').querySelector('button').onclick = () => $('install-help').close();
function updateStatus() {
  const downloading = Boolean(registration?.installing);
  $('update').disabled = downloading;
  text('update', reloadReady || registration?.waiting ? 'Update verfügbar · neu laden' : downloading ? 'Update wird geladen …' : 'Updates prüfen');
}
$('update').onclick = async () => {
  if (reloadReady) { location.reload(); return; }
  if (registration?.waiting) { applyingUpdate = true; registration.waiting.postMessage({ type: 'SKIP_WAITING' }); return; }
  if (!registration) { toast('Offline-Modus wird noch vorbereitet.'); return; }
  $('update').disabled = true; text('update', 'Update wird geprüft …');
  try {
    await registration.update();
    // update() finishes the check, not the installation of the downloaded files.
    if (registration.installing) toast('Update wird geladen. Bitte die App geöffnet lassen.');
    else if (registration.waiting) toast('Update bereit. Jetzt neu laden.');
    else toast('Deine App ist auf dem aktuellen Stand.');
  } catch { toast('Update-Prüfung fehlgeschlagen. Bitte die Internetverbindung prüfen.'); }
  finally { updateStatus(); }
};
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (applyingUpdate) location.reload();
    else if (hadController) { reloadReady = true; updateStatus(); }
  });
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' }).then(reg => {
    registration = reg; $('update').hidden = false;
    const watchDownload = () => {
      const worker = reg.installing; updateStatus();
      worker?.addEventListener('statechange', () => {
        updateStatus();
        if (worker.state === 'installed' && reg.waiting) toast('Update bereit – im Startmenü neu laden.');
        if (worker.state === 'redundant') toast('Update konnte nicht geladen werden. Bitte erneut prüfen.');
      });
    };
    watchDownload(); reg.addEventListener('updatefound', watchDownload);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) reg.update().catch(() => {});
    });
  }).catch(() => toast('Offline-Modus gerade nicht verfügbar.'));
}
