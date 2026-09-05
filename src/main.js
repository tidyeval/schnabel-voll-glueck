import './style.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { createGame, step, press, WORLD } from './game.js';
import { drawWorld } from './art.js';
import { createAudio } from './audio.js';

const $ = id => document.getElementById(id);
const app = $('app'), canvas = $('world'), ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const defaults = { record: 0, totalFish: 0, outfit: 'classic', music: true, sound: true, haptics: true };
let saved = {};
try { saved = JSON.parse(localStorage.getItem('pelican-v1')) || {}; } catch { /* Storage can be unavailable in private browsers. */ }
const prefs = { ...defaults };
for (const key of ['record', 'totalFish']) if (Number.isSafeInteger(saved[key]) && saved[key] >= 0) prefs[key] = saved[key];
for (const key of ['music', 'sound', 'haptics']) if (typeof saved[key] === 'boolean') prefs[key] = saved[key];
const unlocks = { classic: 0, flower: 25, sailor: 80 };
if (Object.hasOwn(unlocks, saved.outfit) && prefs.totalFish >= unlocks[saved.outfit]) prefs.outfit = saved.outfit;
const audio = createAudio(prefs);
let game = createGame(), mode = 'menu', holding = false, effects = [], last = 0, animation = 0, toastUntil = 0;
function text(id, value) { if ($(id).textContent !== String(value)) $(id).textContent = value; }
function persist() {
  try { localStorage.setItem('pelican-v1', JSON.stringify(prefs)); }
  catch { toast('Dein Browser kann den Rekord gerade nicht speichern.'); }
}
function toast(message) { text('toast', message); $('toast').classList.remove('hidden'); toastUntil = performance.now() + 3000; }
function clock(seconds) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
function refreshMenu() { text('record', prefs.record.toLocaleString('de-DE')); text('wallet', `${prefs.totalFish} Fische`); }
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
function start() {
  closeDialogs(); game = createGame(); effects = []; mode = 'playing'; holding = false;
  $('start').classList.add('hidden'); $('hud').classList.remove('hidden'); $('pause').classList.remove('hidden');
  $('toast').classList.add('hidden'); audio.start(); updateHud(); canvas.focus();
}
function home() {
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
  const record = game.score > prefs.record;
  prefs.record = Math.max(prefs.record, game.score); prefs.totalFish += game.fish;
  mode = 'ended'; holding = false; game.ended = true; persist();
  text('result-kicker', record ? 'GAME OVER · NEUER REKORD!' : 'GAME OVER');
  text('result-title', { gull: 'Möwe im Anflug!', jelly: 'Eine Qualle erwischt!', driftwood: 'Treibholz voraus!', air: 'Die Luft ist aus!', shark: 'Vom Hai erwischt!', net: 'Im Netz gelandet!', fisher: 'Fischer voraus!', energy: 'Keine Energie mehr!', complete: 'Runde geschafft!' }[game.endReason] || 'Bis zur nächsten Runde!');
  text('result-score', game.score); text('result-fish', game.fish); text('result-combo', game.bestCombo); text('result-time', clock(game.time));
  text('result-mission', game.mission ? '✦ Tauchmission geschafft! +100 Punkte' : 'Nächstes Ziel: 5 Fische in einem Tauchgang.');
  closeDialogs(); $('result-dialog').showModal(); $('pause').classList.add('hidden'); audio.effect('end');
}
function updateHud() {
  text('score', game.score); text('time', clock(Math.ceil(WORLD.duration - game.time)));
  const energy = Math.ceil(game.energy); $('energy').style.width = energy + '%'; $('energy').style.background = energy < 25 ? '#d78560' : '#5c9e79';
  text('energy-value', energy); document.querySelector('.energy-track').setAttribute('aria-valuenow', energy);
  const p = game.player;
  $('air').classList.toggle('hidden', !p.wet && p.breath >= WORLD.breath);
  $('air').classList.toggle('low-air', p.breath <= 3);
  text('air-label', p.breath <= 3 ? 'AUFTAUCHEN ↑' : 'TAUCHLUFT');
  text('air-value', `${p.breath.toFixed(1)} s`);
  $('air-fill').style.width = `${p.breath / WORLD.breath * 100}%`;
  $('air').setAttribute('aria-valuenow', p.breath.toFixed(1));
  $('combo').classList.toggle('hidden', game.combo < 5); text('combo', `${Math.min(4, 1 + Math.floor(game.combo / 5))}× KOMBO`);
  text('mission-count', game.mission ? '+100' : `${Math.min(5, game.diveFish)}/5`); text('mission-icon', game.mission ? '✓' : '✧');
  text('mission-text', game.mission ? 'Tauchmission geschafft!' : 'Fange 5 Fische in einem Tauchgang');
  $('tutorial').classList.toggle('hidden', game.fish > 0 || game.time > 5 || p.y > 560);
  text('tutorial', p.wet ? 'Loslassen — und wieder ab nach oben ↑' : 'Halten — abtauchen und Fische fangen ↓');
}
canvas.tabIndex = 0;
$('play').onclick = start; $('again').onclick = start; $('back-home').onclick = home;
$('pause').onclick = () => pause(); $('resume').onclick = resume;
$('quit').onclick = finish;
$('settings').onclick = () => { pause(false); $('settings-dialog').showModal(); };
function afterSettings() { $('settings-dialog').close(); if (mode === 'paused') $('pause-dialog').showModal(); }
$('settings-dialog').querySelector('.close').onclick = afterSettings;
$('settings-dialog').querySelector('.close-settings').onclick = afterSettings;
for (const key of ['music', 'sound', 'haptics']) { $(key).checked = prefs[key]; $(key).onchange = () => { prefs[key] = $(key).checked; persist(); }; }
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
  prefs.outfit = button.dataset.outfit; persist(); $('wardrobe-dialog').close();
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
}
window.addEventListener('resize', resize); resize(); refreshMenu();
function frame(now) {
  const dt = Math.min(.05, Math.max(0, (now - (last || now)) / 1000)); last = now;
  if (mode === 'playing' || mode === 'menu') animation += dt;
  if (mode === 'playing') {
    for (const event of step(game, dt, holding)) {
      if (event.kind === 'end') { finish(); break; }
      if (event.x !== undefined) effects.push({ ...event, life: 1 });
      audio.effect(event.kind);
      if (event.kind === 'trick') toast(`${event.turns === 2 ? 'Doppelter Überschlag' : 'Überschlag'}! +${event.points} Punkte`);
      if (event.kind === 'airBonus') toast('Luftblase! +2 Sekunden Tauchluft');
      if (event.kind === 'mission') toast('✦ Fünf auf einen Tauchgang! +100 Punkte');
      if (event.kind === 'airWarning') toast('Luft wird knapp! Loslassen zum Auftauchen ↑');
    }
    updateHud();
  }
  if (mode !== 'paused') { for (const effect of effects) effect.life -= dt; effects = effects.filter(e => e.life > 0); }
  if (now > toastUntil) $('toast').classList.add('hidden');
  audio.update(animation);
  drawWorld(ctx, game, mode, reducedMotion && mode === 'menu' ? 0 : animation, prefs.outfit, effects, reducedMotion);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
let installPrompt, registration, applyingUpdate = false;
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
$('update').onclick = async () => {
  if (registration?.waiting) { applyingUpdate = true; registration.waiting.postMessage({ type: 'SKIP_WAITING' }); return; }
  try { await registration?.update(); toast(registration?.waiting ? 'Update bereit. Jetzt aktualisieren.' : 'Kein neues Update gefunden.'); }
  catch { toast('Updates benötigen eine Internetverbindung.'); }
};
if (import.meta.env.PROD && !Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (applyingUpdate) location.reload(); });
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(reg => {
    registration = reg; $('update').hidden = false;
    const ready = () => { if (reg.waiting) text('update', 'Update verfügbar · neu laden'); };
    ready(); reg.addEventListener('updatefound', () => reg.installing?.addEventListener('statechange', ready));
  }).catch(() => toast('Offline-Modus gerade nicht verfügbar.'));
}
