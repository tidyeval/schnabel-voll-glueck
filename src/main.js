import { setupDiagnostics } from './diagnostics.js';
import { attachPhysics, physicsSnapshot, releasePhysics } from './physics.js';
import { createRuntime } from '@tidyeval/game-platform/runtime';
import { bindLifecycle } from '@tidyeval/game-platform/lifecycle';
import { STAGES } from './stages.js';
import './style.css';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { createGame, step, press, WORLD, airState } from './game.js';
import { drawWorld, pelican } from './art.js';
import { createAudio } from './audio.js';
import { drawPhoto, photoFile, photoScene } from './photo.js';
import { createJuice } from './juice.js';
import { recordAttempt, attemptFromGame, unlocks, newOutfits } from './progress.js';
import { PLUMAGES, BEAKS } from './looks.js';
import { restoreProgress, readStoredProgress, prepareProgress, saveSetting, saveAttempt, isProgressKey } from './storage.js';
import { setupPwa } from './pwa.js';
import { keyAction } from './controls.js';
import { applyTranslations, currentLocale, formatNumber, setLocale, stageName, t } from './i18n.js';

const $ = id => document.getElementById(id);
async function bootstrap() {
$('play').disabled = true;
let prefs;
try { await prepareProgress(); prefs = restoreProgress(); } catch {
  const alert = document.createElement('div'); alert.setAttribute('role', 'alert');
  const locale = navigator.language.slice(0, 2);
  const [message, label] = ({ en: ['Progress could not be loaded. Please reload the app. ', 'Reload'], es: ['No se pudo cargar el progreso. Vuelve a cargar la aplicación. ', 'Recargar'] })[locale] || ['Fortschritt konnte nicht geladen werden. Bitte App neu laden. ', 'Neu laden'];
  alert.textContent = message;
  const retry = document.createElement('button'); retry.textContent = label; retry.onclick = () => location.reload();
  alert.append(retry); $('start').prepend(alert); return;
}
$('play').disabled = false;
const app = $('app'), canvas = $('world'), ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Test shortcut on the dev server only (not in the published build): ?alle unlocks every stage.
if (import.meta.env.DEV && new URLSearchParams(location.search).has('alle')) prefs.completed = Math.max(prefs.completed, STAGES.length - 1);
let selectedStage = Math.min(prefs.completed, STAGES.length - 1);
const audio = createAudio(prefs);
const juice = createJuice(reducedMotion);
const showLabels = { dolphins: 'showDolphins', goldenHour: 'showGoldenHour', shootingStars: 'showShootingStars' };
const labels = { airCatch: ['fxAirCatch', '#fff2b6', true], nearMiss: ['fxNearMiss', '#ffffff'], frenzy: ['fxFrenzy', '#ffd66e', true], feast: ['fxFeast', '#e3f6ff', true], current: ['fxCurrent', '#dffff6'], waveRide: ['fxWaveRide', '#e3f6ff', true] };
let phaserScene, cameraAhead = 0, savePending = false, unseenOutfit = false;
let game = createGame(), mode = 'menu', holding = false, effects = [], animation = 0, toastUntil = 0, needsDraw = true, startHint = false;
// Round-start control hint: shown until the first hold, so a new player sees how to dive before the first obstacle.
function clearStartHint() { if (startHint) { startHint = false; toastUntil = 0; $('toast').classList.add('hidden'); } }
setupDiagnostics('schnabelglueck-phaser-matter', () => ({ mode, stage: selectedStage }));
function text(id, value) { if ($(id).textContent !== String(value)) $(id).textContent = value; }
function syncPrefs(latest) { Object.assign(prefs, latest); }
async function persistSettings(key) {
  try {
    syncPrefs(await saveSetting(key, prefs[key])); return true;
  } catch { toast(t('settingsSaveFailed')); return false; }
}
async function persistAttempt(attempt) {
  try {
    syncPrefs(await saveAttempt(attempt)); return true;
  } catch { return false; }
}
function toast(message) { text('toast', message); $('toast').classList.remove('hidden', 'hint'); toastUntil = performance.now() + 3000; }
function clock(seconds) { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
function refreshLocale() {
  setLocale(prefs.language); applyTranslations();
  $('game-title').innerHTML = { de: 'Schnabel<em>glück</em>', en: 'Happy <em>Beak</em>', es: 'Pico <em>Feliz</em>' }[currentLocale()];
  document.querySelectorAll('[data-locale]').forEach(button => {
    const selected = button.dataset.locale === currentLocale();
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', t(`locales.${button.dataset.locale}`));
  });
  refreshMenu();
}
function refreshMenu() {
  document.querySelector('.record').hidden = prefs.record === 0;
  text('record', formatNumber(prefs.record));
  $('stages').replaceChildren(...STAGES.map((stage, i) => {
    const option = document.createElement('option'); option.value = i;
    option.textContent = `${i < prefs.completed ? '✓ ' : i > prefs.completed ? '🔒 ' : ''}${stageName(i)}`;
    return option;
  }));
  $('stages').value = selectedStage;
  // Locked stages can be browsed, so you can see what is still ahead, but not started.
  const locked = selectedStage > prefs.completed;
  text('stage-best', locked ? t('lockedHint', { stage: stageName(selectedStage - 1) }) : prefs.bests[selectedStage] ? t('best', { score: formatNumber(prefs.bests[selectedStage]) }) : '');
  $('play').disabled = locked;
  $('stage-prev').disabled = selectedStage === 0; $('stage-next').disabled = selectedStage >= STAGES.length - 1;
  text('play-label', prefs.completed ? t('continue') : t('play'));
  refreshWardrobe();
}
$('stages').onchange = () => { selectedStage = Number($('stages').value); refreshMenu(); };
// Arrows step through all stages (locked ones show a lock); the select still opens the full list.
for (const [id, step] of [['stage-prev', -1], ['stage-next', 1]]) $(id).onclick = () => { selectedStage = Math.max(0, Math.min(selectedStage + step, STAGES.length - 1)); refreshMenu(); };
document.querySelectorAll('[data-locale]').forEach(button => button.onclick = () => {
  prefs.language = button.dataset.locale;
  refreshLocale(); persistSettings('language');
});

// End-of-round press photo: viewfinder, flash and click, then the Polaroid can be shared.
let lastResult = null, photoRun = 0, photoReady = null;
function photoCard() {
  const r = lastResult;
  return {
    stage: r.stage, look: pipLook(), score: formatNumber(r.score), fish: formatNumber(r.fish), stageName: stageName(r.stage),
    title: r.final ? t('photoAllNests') : r.complete ? t('photoNest') : t('photoRound'), points: t('points'), fishLabel: t('fish'),
    record: r.record ? t('photoRecord') : null, date: new Intl.DateTimeFormat(currentLocale()).format(new Date()),
    game: { de: 'Schnabelglück', en: 'Happy Beak', es: 'Pico Feliz' }[currentLocale()],
  };
}
function openPhoto() {
  if (!lastResult) return;
  const card = photoCard(), scene = photoScene(card.stage), dialog = $('photo-dialog'), ctx = $('photo-canvas').getContext('2d'), run = ++photoRun;
  photoReady = null; photoFile(card).then(file => { if (run === photoRun) photoReady = file; }).catch(() => {});
  dialog.classList.remove('taken'); dialog.classList.add('shooting'); $('result-dialog').close(); dialog.showModal();
  const began = performance.now();
  const frame = now => {
    if (run !== photoRun || !dialog.open) return;
    const age = (now - began) / 1000;
    drawPhoto(ctx, card, reducedMotion ? 0 : age, scene);
    if (age >= (reducedMotion ? .2 : 1.1) && dialog.classList.contains('shooting')) {
      dialog.classList.replace('shooting', 'taken'); audio.effect('shutter');
    }
    if (age < 3) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
async function sharePhoto() {
  const file = photoReady || await photoFile(photoCard());
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: photoCard().game }); } catch (error) { if (error.name !== 'AbortError') toast(error.message); }
    return;
  }
  // No image sharing here (e.g. desktop): save the photo instead.
  const url = URL.createObjectURL(file), link = Object.assign(document.createElement('a'), { href: url, download: file.name });
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function closePhoto() { photoRun++; $('photo-dialog').close(); $('result-dialog').showModal(); }
$('share-photo').onclick = openPhoto; $('photo-share').onclick = sharePhoto; $('photo-close').onclick = closePhoto;
$('photo-dialog').addEventListener('cancel', event => { event.preventDefault(); closePhoto(); });
function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
// Screen changes happen at once (state stays exact); a soft sea-coloured veil then fades away over them.
function reveal() {
  if (reducedMotion) return;
  const veil = $('veil'); veil.classList.remove('fade'); void veil.offsetWidth; veil.classList.add('fade');
}
// First-run coach in the bay: four short, playable steps, each advancing on what Pip actually does.
const TERRAIN_KINDS = ['island', 'reef', 'buoy', 'coral', 'mangrove'];
const COACH = [
  { key: 'coachDive', done: g => g.player.wet },
  { key: 'coachFish', done: g => g.fish >= 1 },
  { key: 'coachAir', done: g => !g.player.wet },
  { key: 'coachRock', wait: g => g.items.some(i => TERRAIN_KINDS.includes(i.kind) && i.x < 470), hold: 4 },
];
let coach = null;
function endCoach(learned) {
  coach = null; $('coach').classList.add('hidden');
  if (learned && !prefs.tutorial) { prefs.tutorial = true; persistSettings('tutorial'); }
}
function updateCoach() {
  if (!coach || mode !== 'playing') return;
  const step = COACH[coach.step], now = game.time;
  if (step.wait && !coach.shown) {
    // The rock step waits for a rock; if none comes soon, the coach is done.
    if (step.wait(game)) coach.shown = now; else if (now - coach.since > 30) return endCoach(true);
  }
  const visible = !step.wait || coach.shown !== undefined;
  $('coach').classList.toggle('hidden', !visible);
  if (visible) { text('coach-text', t(step.key)); text('coach-step', `${coach.step + 1}/${COACH.length}`); }
  if (step.done?.(game) || (step.hold && coach.shown !== undefined && now - coach.shown > step.hold)) {
    if (coach.step === COACH.length - 1) return endCoach(true);
    coach = { step: coach.step + 1, since: now };
    // The basics are learned once Pip has dived, fished and surfaced; the rock tip is a bonus.
    if (COACH[coach.step].wait && !prefs.tutorial) { prefs.tutorial = true; persistSettings('tutorial'); }
  }
}
$('coach-skip').onclick = () => endCoach(true);
// `score` carries the journey's points into the next nest; a fresh start from the menu begins at 0.
function start(elapsed, score = 0) {
  if (savePending || selectedStage > prefs.completed) return;
  phaserScene?.scene.resume();
  closeDialogs(); cameraAhead = 0; releasePhysics(game); game = createGame(Math.random, selectedStage, elapsed); game.score = game.startScore = score; attachPhysics(game, phaserScene?.matter.world.engine); document.body.classList.toggle('night', STAGES[game.stage].night); game.attemptId = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`; effects = []; juice.reset(); mode = 'playing'; holding = false;
  $('start').classList.add('hidden'); $('hud').classList.remove('hidden'); $('pause').classList.remove('hidden'); $('wardrobe').classList.add('hidden');
  coach = !prefs.tutorial && game.stage === 0 ? { step: 0, since: 0 } : null; $('coach').classList.add('hidden');
  if (!coach) { toast(t('holdHint')); $('toast').classList.add('hint'); startHint = true; }
  audio.start(); updateHud(); canvas.focus(); reveal();
}
function home() {
  if (savePending) return;
  phaserScene?.scene.resume();
  selectedStage = Math.min(prefs.completed, STAGES.length - 1);
  closeDialogs(); mode = 'menu'; holding = false; effects = []; juice.reset(); audio.start('menu');
  $('start').classList.remove('hidden'); $('hud').classList.add('hidden'); $('pause').classList.add('hidden'); $('wardrobe').classList.remove('hidden'); refreshMenu(); $('play').focus(); reveal();
}
function pause(showDialog = true) {
  if (mode !== 'playing') return;
  mode = 'paused'; holding = false; audio.pause(); phaserScene?.scene.pause();
  if (showDialog) $('pause-dialog').showModal();
}
function resume() { phaserScene?.scene.resume(); closeDialogs(); holding = false; mode = 'playing'; audio.start(game.feeding || game.settling ? 'menu' : 'playing'); canvas.focus(); }
async function finish() {
  if (mode === 'ended') return;
  if (coach) endCoach(false);
  const record = game.score > prefs.bests[game.stage];
  game.ended = true; const attempt = attemptFromGame(game, game.attemptId); const fishBefore = prefs.totalFish; recordAttempt(prefs, game, game.attemptId);
  const unlocked = newOutfits(fishBefore, prefs.totalFish); if (unlocked.length) unseenOutfit = true;
  const complete = game.endReason === 'complete';
  const final = complete && game.stage === STAGES.length - 1;
  $('next-stage').classList.toggle('hidden', !complete || final);
  // One clear next step: onwards after a nest, otherwise straight back in. Replaying a finished nest stays a quiet option.
  text('again', complete && !final ? t('again') : t('retryStage'));
  $('again').className = complete && !final ? 'quiet-button' : 'primary';
  mode = 'ended'; holding = false; phaserScene?.scene.resume();
  const buttons = [...$('result-dialog').querySelectorAll('button')]; buttons.forEach(button => { button.disabled = true; });
  savePending = true;
  const pendingSave = persistAttempt(attempt);
  text('result-kicker', complete ? (final ? t('allNests') : t('nestReached')) : record ? t('newRecord') : stageName(game.stage));
  text('result-title', game.endReason === 'complete' && final ? t('reasons.final') : t(`reasons.${game.endReason || 'fallback'}`));
  lastResult = { stage: game.stage, score: game.score, fish: game.fish, record, complete, final };
  text('result-score', formatNumber(game.score)); text('result-fish', formatNumber(game.fish)); text('result-combo', formatNumber(game.bestCombo)); text('result-time', clock(game.time));
  const resultMessage = [final ? t('finalMission') : '', ...unlocked.map(outfit => t('outfitUnlocked', { outfit: t(`outfit_${outfit}`) }))].filter(Boolean).join(' ');
  text('result-mission', resultMessage);
  closeDialogs(); $('result-dialog').showModal(); $('pause').classList.add('hidden'); audio.start('menu'); audio.effect('end'); if (record) audio.effect('record');
  const saved = await pendingSave;
  $('retry-save').classList.toggle('hidden', saved);
  // Saving is only worth a word when it failed.
  text('result-mission', `${resultMessage} ${saved ? '' : t('saveFailed')}`.trim());
  savePending = false;
  buttons.forEach(button => { button.disabled = false; });
}
let shownScore = 0;
function updateHud() {
  updateCoach();
  if (game.score > shownScore) { const score = $('score'); score.classList.remove('pop'); void score.offsetWidth; score.classList.add('pop'); }
  shownScore = game.score;
  text('score', formatNumber(game.score)); text('time', clock(Math.floor(game.time)));
  const energy = Math.ceil(game.energy); $('energy').style.width = energy + '%'; $('energy').style.background = energy < 25 ? '#d78560' : '#5c9e79'; $('status-panel').classList.toggle('low-energy', energy < 25);
  text('energy-value', energy); document.querySelector('.energy-track').setAttribute('aria-valuenow', energy);
  const p = game.player;
  $('air').classList.toggle('hidden', !p.wet && p.breath >= WORLD.breath);
  const { level } = airState(p, game.cargo);
  $('air').classList.toggle('low-air', level > 0);
  text('air-label', level ? t('surface') : t('air'));
  text('air-value', `${p.breath.toFixed(1)} s`);
  $('air-fill').style.width = `${p.breath / WORLD.breath * 100}%`;
  document.querySelector('.air-track').setAttribute('aria-valuemax', WORLD.breath);
  document.querySelector('.air-track').setAttribute('aria-valuenow', p.breath.toFixed(1));
}
canvas.tabIndex = 0;
$('play').onclick = () => start(); $('again').onclick = () => { selectedStage = game.stage; start(undefined, game.startScore); };
$('next-stage').onclick = () => { selectedStage = Math.min(game.stage + 1, STAGES.length - 1); start(game.elapsed + game.time, game.score); }; $('back-home').onclick = home;
$('pause').onclick = () => pause(); $('resume').onclick = resume;
$('quit').onclick = finish;
$('settings').onclick = () => { pause(false); $('settings-dialog').showModal(); };
$('pause-settings').onclick = () => { $('pause-dialog').close(); $('settings-dialog').showModal(); };
function afterSettings() { $('settings-dialog').close(); if (mode === 'paused') $('pause-dialog').showModal(); }
$('settings-dialog').querySelector('.close').onclick = afterSettings;
$('settings-dialog').querySelector('.close-settings').onclick = afterSettings;
for (const key of ['music', 'sound', 'haptics']) { $(key).checked = prefs[key]; $(key).onchange = () => { prefs[key] = $(key).checked; persistSettings(key); }; }
// Pip's wardrobe: collected fish unlock looks; each one is shown as a small portrait of Pip.
function pipLook(outfit = prefs.outfit) { return { outfit, plumage: prefs.plumage, beak: prefs.beak }; }
function portrait(canvas, outfit) {
  const c = canvas.getContext('2d'), size = canvas.width;
  c.clearRect(0, 0, size, size);
  pelican(c, { x: size * .4, y: size * .84, scale: size / 150, time: 0, ...pipLook(outfit), happy: true, reducedMotion: true });
}
// Colour swatches for Pip's feathers and beak: choosing one recolours Pip at once and keeps the wardrobe open.
const SWATCHES = { plumage: PLUMAGES, beak: BEAKS };
for (const [key, table] of Object.entries(SWATCHES)) $(`${key}-swatches`).replaceChildren(...Object.entries(table).map(([id, colours]) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'swatch'; button.dataset[key] = id;
  button.style.background = colours.swatch;
  button.onclick = () => { prefs[key] = id; persistSettings(key); needsDraw = true; refreshWardrobe(); };
  return button;
}));
function refreshWardrobe() {
  portrait($('wardrobe').querySelector('canvas'), prefs.outfit);
  $('wardrobe-new').classList.toggle('hidden', !unseenOutfit);
  text('wardrobe-wallet', t('wardrobeWallet', { fish: formatNumber(prefs.totalFish) }));
  document.querySelectorAll('[data-outfit]').forEach(button => {
    const outfit = button.dataset.outfit, locked = prefs.totalFish < unlocks[outfit];
    button.disabled = locked;
    button.setAttribute('aria-pressed', String(prefs.outfit === outfit));
    button.querySelector('small').textContent = locked ? `🔒 ${t('outfitFrom', { fish: formatNumber(unlocks[outfit]) })}` : unlocks[outfit] ? '' : t('outfitAlways');
    portrait(button.querySelector('canvas'), outfit);
  });
  for (const key of Object.keys(SWATCHES)) document.querySelectorAll(`[data-${key}]`).forEach(button => {
    button.setAttribute('aria-pressed', String(prefs[key] === button.dataset[key]));
    button.setAttribute('aria-label', t(`${key}_${button.dataset[key]}`));
  });
}
$('wardrobe').onclick = () => { unseenOutfit = false; refreshWardrobe(); $('wardrobe-dialog').showModal(); };
$('wardrobe-dialog').querySelector('.close').onclick = () => $('wardrobe-dialog').close();
document.querySelectorAll('[data-outfit]').forEach(button => button.onclick = () => {
  if (prefs.totalFish < unlocks[button.dataset.outfit]) return;
  prefs.outfit = button.dataset.outfit; persistSettings('outfit'); needsDraw = true;
  refreshWardrobe(); $('wardrobe-dialog').close();
});
$('retry-save').onclick = async () => {
  if (savePending) return;
  savePending = true; $('retry-save').disabled = true;
  const attempt = attemptFromGame(game, game.attemptId);
  if (!await persistAttempt(attempt)) { savePending = false; $('retry-save').disabled = false; return; }
  savePending = false; $('retry-save').disabled = false;
  $('retry-save').classList.add('hidden');
  const message = $('result-mission').textContent.replace(t('saveFailed'), '').trim();
  text('result-mission', `${message} ${t('saved')}`);
};
window.addEventListener('storage', async event => {
  if (!isProgressKey(event.key)) return;
  try { await prepareProgress(); syncPrefs(readStoredProgress()); refreshLocale(); } catch { /* Keep the current in-memory state. */ }
});
$('pause-dialog').addEventListener('cancel', event => { event.preventDefault(); resume(); });
$('settings-dialog').addEventListener('cancel', event => { event.preventDefault(); afterSettings(); });
$('result-dialog').addEventListener('cancel', event => { event.preventDefault(); home(); });
app.addEventListener('pointerdown', event => {
  if (mode !== 'playing' || event.target.closest('button, dialog, input')) return;
  event.preventDefault(); if (!holding) press(game); holding = true; clearStartHint(); app.setPointerCapture(event.pointerId);
});
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) app.addEventListener(name, () => { holding = false; });
window.addEventListener('keydown', event => {
  const action = keyAction('keydown', event.code, mode, !!event.target.closest?.('button, input, dialog'));
  if (action === 'dive') { event.preventDefault(); if (!event.repeat && !holding) press(game); holding = true; clearStartHint(); }
  if (action === 'pause') { event.preventDefault(); pause(); }
});
window.addEventListener('keyup', event => { if (keyAction('keyup', event.code, mode) === 'release') { holding = false; if (mode === 'playing') event.preventDefault(); } });
function resumeMenuAudio() {
  if (!document.hidden && (mode === 'menu' || mode === 'ended')) audio.start('menu');
}
bindLifecycle({
  suspend() { pause(); holding = false; audio.pause(); },
  foreground: resumeMenuAudio, gesture: resumeMenuAudio,
  nativeApp: Capacitor.isNativePlatform() ? App : undefined,
  back() {
    if ($('settings-dialog').open) afterSettings();
    else if ($('wardrobe-dialog').open) $('wardrobe-dialog').close();
    else if (mode === 'playing') pause();
    else if (mode === 'paused') resume();
    else if (mode === 'ended') home();
    else App.minimizeApp();
  },
});
// Portrait-only: in a short landscape touch viewport, pause and ask to rotate. Resuming stays explicit.
const landscapeTouch = matchMedia('(orientation: landscape) and (max-height: 500px) and (pointer: coarse)');
function checkOrientation() {
  const dialog = $('rotate-dialog');
  if (landscapeTouch.matches) { pause(); holding = false; if (!dialog.open) dialog.showModal(); }
  else if (dialog.open) dialog.close();
}
$('rotate-dialog').addEventListener('cancel', event => { if (landscapeTouch.matches) event.preventDefault(); });
landscapeTouch.addEventListener('change', checkOrientation);
checkOrientation();
function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = WORLD.width * ratio; canvas.height = WORLD.height * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  needsDraw = true;
  if (mode === 'paused') frame(performance.now(), 0);
}
window.addEventListener('resize', resize); resize(); refreshLocale();
// Autoplay where allowed; the gesture listeners resume a suspended mobile context.
audio.start('menu');
const applyPendingUpdate = setupPwa(toast);
function frame(now, seconds) {
  const dt = Math.min(.05, seconds);
  if (mode === 'playing' || mode === 'menu') animation += dt;
  if (mode === 'menu' && !document.querySelector('dialog[open]')) applyPendingUpdate();
  // On the very first run the sea waits for the first dive, so there is time to read the first tip.
  const waitingForFirstDive = mode === 'playing' && coach?.step === 0 && game.time === 0 && !holding;
  if (waitingForFirstDive) updateHud();
  if (mode === 'playing' && !waitingForFirstDive) {
    const wasFeeding = game.feeding > 0;
    for (const event of step(game, dt * juice.timeScale(dt), holding)) {
      if (event.kind === 'end') { finish(); break; }
      juice.onEvent(event, game);
      if (event.kind === 'catch' && !reducedMotion) phaserScene?.bubbles?.explode(5, event.x, event.y);
      const label = labels[event.kind];
      if (event.x !== undefined && !['warning', 'sardine'].includes(event.kind)) effects.push({ ...event, life: label ? 1.3 : 1, label: label && t(label[0], { points: event.points }), colour: label?.[1], big: label?.[2] });
      if (event.kind === 'show' && showLabels[event.name]) toast(t(showLabels[event.name]));
      if (event.kind === 'roller') toast(t('rollerHint'));
      audio.effect(event.kind, event.golden ? 'golden' : event.name);
      if (event.kind === 'delivery') { holding = false; audio.start('menu'); }
    }
    if (!wasFeeding && game.feeding > 0) audio.start('menu');
    updateHud();
  }
  if (mode !== 'paused') { for (const effect of effects) effect.life -= dt; effects = effects.filter(e => e.life > 0); juice.update(dt, game, mode === 'playing'); }
  if (now > toastUntil) $('toast').classList.add('hidden');
  audio.update(animation);
  if (mode !== 'paused' || needsDraw) {
    const obstacle = mode === 'playing' && game.stage === 0 && !reducedMotion && game.items.some(item => ['island', 'buoy', 'reef'].includes(item.kind) && item.x > 300 && item.x < 750);
    if (mode !== 'paused') cameraAhead += ((obstacle ? 18 : 0) - cameraAhead) * (1 - Math.exp(-dt * 2.5));
    if (mode === 'menu') cameraAhead = 0;
    phaserScene?.cameras?.main?.setScroll(cameraAhead, 0);
    ctx.save(); ctx.translate(-cameraAhead, 0);
    drawWorld(ctx, game, mode, reducedMotion && mode === 'menu' ? 0 : animation, pipLook(), effects, reducedMotion, juice.view());
    ctx.restore();
    needsDraw = false;
  }
}

createRuntime({
  parent: 'phaser-effects', width: WORLD.width, height: WORLD.height,
  create(scene) {
    phaserScene = scene; attachPhysics(game, scene.matter.world.engine);
    const texture = scene.textures.createCanvas('bubble', 12, 12), c = texture.context;
    c.strokeStyle = '#efffe8'; c.lineWidth = 1.5; c.beginPath(); c.arc(6, 6, 4, 0, Math.PI * 2); c.stroke(); texture.refresh();
    scene.bubbles = scene.add.particles(0, 0, 'bubble', { speed: { min: 18, max: 70 }, angle: { min: 190, max: 350 }, gravityY: -35, lifespan: 550, alpha: { start: .9, end: 0 }, scale: { start: 1, end: .3 }, emitting: false });
    document.documentElement.dataset.runtime = 'phaser-matter';
  },
  update: frame,
});

window.gameSnapshot = () => ({ mode, stage: game.stage, time: game.time, score: game.score, physics: physicsSnapshot(game) });

}
bootstrap();
