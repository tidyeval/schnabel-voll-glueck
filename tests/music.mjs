import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const gains = [], sources = [];
class AudioContext {
  currentTime = 0; sampleRate = 10; state = 'running'; destination = {};
  createGain() { const node = { gain: { value: 0, setTargetAtTime(value) { this.value = value; } }, connect() {} }; gains.push(node); return node; }
  createBuffer() { return { getChannelData: () => new Float32Array(30) }; }
  createBufferSource() { const node = { connect() {}, start() {} }; sources.push(node); return node; }
  decodeAudioData() { return Promise.resolve({ duration: 100 }); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
}
let context;
const window = { AudioContext: class extends AudioContext { constructor() { super(); context = this; } } };
const code = (await readFile(new URL('../src/audio.js', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '').replace('export function', 'function');
const factory = new Function('window', 'fetch', 'musicURL', 'menuMusicURL', code + '\nreturn createAudio;');
const settings = { music: true, sound: false };
let fetches = 0;
const audio = factory(window, async () => { fetches++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) }; }, 'music.mp3', 'menu.mp3')(settings);
audio.start(); await new Promise(resolve => setImmediate(resolve));
const music = gains[1].gain;
context.currentTime = 50; audio.update(50); assert.equal(music.value, .8);
context.currentTime = 97; audio.update(97); assert.equal(music.value, .4);
context.currentTime = 99.9; audio.update(99.9); assert.ok(music.value < .02);
context.currentTime = 100; audio.update(100); assert.equal(music.value, 0);
context.currentTime = 101.5; audio.update(101.5); assert.equal(music.value, .8);
assert.equal(sources[2].loop, true);
settings.music = false; audio.update(102); assert.equal(music.value, 0);
audio.pause(); assert.equal(context.state, 'suspended');
audio.start(); assert.equal(context.state, 'running'); assert.equal(fetches, 2);
settings.music = true; audio.start('menu'); audio.update(102);
assert.equal(gains[1].gain.value, 0); assert.equal(gains[2].gain.value, .8); assert.equal(gains[3].gain.value, 0);
audio.start(); assert.equal(gains[2].gain.value, 0, 'switching to gameplay immediately silences menu music');
audio.update(102); assert.equal(gains[1].gain.value, .8); assert.equal(gains[2].gain.value, 0);
settings.music = false; audio.start('menu'); audio.update(102); assert.equal(gains[2].gain.value, 0);
console.log('Music fade-out, loop fade-in, mute and pause/resume passed');

// Decode both bundled tracks in both engines; the mock above proves the envelope.
const { chromium, webkit } = await import('@playwright/test');
const { readdir } = await import('node:fs/promises');
const { createHash } = await import('node:crypto');
const tracks = (await readdir(new URL('../dist/assets/', import.meta.url))).filter(name => /^(soundtrack|menu-music)-/.test(name));
assert.equal(tracks.length, 2);
for (const track of tracks) {
  const expected = createHash('sha256').update(await readFile(new URL(`../src/assets/${track.startsWith('soundtrack-') ? 'soundtrack' : 'menu-music'}.mp3`, import.meta.url))).digest('hex');
  for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
    const browser = await engine.launch();
    try {
      const page = await browser.newPage(); await page.goto(process.env.PELICAN_URL || 'http://localhost:4173');
      const result = await page.evaluate(async track => {
        const response = await fetch(new URL(`assets/${track}`, location.href));
        if (!response.ok) throw new Error('Bundled music failed to load');
        const bytes = await response.arrayBuffer();
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = await context.decodeAudioData(bytes); await context.close();
        return { hash, duration: buffer.duration, channels: buffer.numberOfChannels };
      }, track);
      assert.equal(result.hash, expected); assert.ok(result.duration > 0); assert.equal(result.channels, 2);
      console.log(`${name}: bundled stereo track decoded, ${result.duration.toFixed(2)}s; source hash matches`);
    } finally { await browser.close(); }
  }

}

// Exercise real menu/game/result transitions with actual browser audio nodes.
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await page.addInitScript(() => {
      window.audioTargets = [];
      const Base = window.AudioContext || window.webkitAudioContext;
      window.AudioContext = class extends Base {
        constructor() { super(); window.testAudioContext = this; }
        createGain() {
          const gain = super.createGain();
          window.audioTargets.push(gain);
          return gain;
        }
      };
    });
    await page.goto(process.env.PELICAN_URL || 'http://localhost:4173');
    await page.touchscreen.tap(195, 180);
    await page.waitForFunction(() => audioTargets[2]?.gain.value > .1 && audioTargets[1]?.gain.value < .001);
    await page.locator('#settings').tap();
    await page.locator('#music').uncheck();
    await page.waitForFunction(() => audioTargets[2]?.gain.value < .001);
    await page.locator('#music').check();
    await page.waitForFunction(() => audioTargets[2]?.gain.value > .1);
    await page.locator('.close-settings').tap();
    await page.locator('#play').tap();
    await page.waitForFunction(() => audioTargets[1]?.gain.value > .1 && audioTargets[2]?.gain.value < .001);
    // Coasting now hits the opening fisherman, exercising an actual game over.
    await page.locator('#result-dialog').waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => audioTargets[2]?.gain.value > .1 && audioTargets[1]?.gain.value < .001);
    await page.locator('#back-home').tap();
    await page.waitForFunction(() => audioTargets[2]?.gain.value > .1 && audioTargets[1]?.gain.value < .001);
    await page.locator('#play').tap();
    await page.locator('#pause').tap();
    await page.waitForFunction(() => testAudioContext.state === 'suspended');
    await page.locator('#quit').tap();
    await page.waitForFunction(() => testAudioContext.state === 'running' && audioTargets[2]?.gain.value > .1 && audioTargets[1]?.gain.value < .001);
    console.log(`${name}: tap unlock, menu mute, gameplay, game over, home and quit-after-pause music passed`);
  } finally { await browser.close(); }
}
