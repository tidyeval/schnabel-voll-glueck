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
const factory = new Function('window', 'fetch', 'musicURL', code + '\nreturn createAudio;');
const settings = { music: true, sound: false };
let fetches = 0;
const audio = factory(window, async () => { fetches++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(0) }; }, 'music.mp3')(settings);
audio.start(); await new Promise(resolve => setImmediate(resolve));
const music = gains[1].gain;
context.currentTime = 50; audio.update(50); assert.equal(music.value, .8);
context.currentTime = 97; audio.update(97); assert.equal(music.value, .4);
context.currentTime = 99.9; audio.update(99.9); assert.ok(music.value < .02);
context.currentTime = 100; audio.update(100); assert.equal(music.value, 0);
context.currentTime = 101.5; audio.update(101.5); assert.equal(music.value, .8);
assert.equal(sources[1].loop, true);
settings.music = false; audio.update(102); assert.equal(music.value, 0);
audio.pause(); assert.equal(context.state, 'suspended');
audio.start(); assert.equal(context.state, 'running'); assert.equal(fetches, 1);
console.log('Music fade-out, loop fade-in, mute and pause/resume passed');
