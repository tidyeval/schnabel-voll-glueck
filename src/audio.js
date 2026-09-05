import musicURL from './assets/bumpin.mp3?url';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function createAudio(settings) {
  let context, master, sea, seaGain, musicGain, musicStart = 0, musicDuration = 0, active = false;
  function init() {
    if (!context) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context = new Audio(); master = context.createGain(); master.gain.value = .45; master.connect(context.destination);
      const buffer = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) { last = (last + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = last; }
      sea = context.createBufferSource(); sea.buffer = buffer; sea.loop = true;
      musicGain = context.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
      fetch(musicURL).then(response => {
        if (!response.ok) throw new Error('Music unavailable');
        return response.arrayBuffer();
      }).then(data => context.decodeAudioData(data)).then(buffer => {
        const music = context.createBufferSource(); music.buffer = buffer; music.loop = true;
        music.connect(musicGain); musicDuration = buffer.duration; musicStart = context.currentTime; music.start();
      }).catch(() => { /* Sound effects and gameplay remain available if music cannot load. */ });
      seaGain = context.createGain(); seaGain.gain.value = 0; sea.connect(seaGain); seaGain.connect(master); sea.start();
    }
    context.resume().catch(() => {});
  }
  function tone(frequency, duration, volume = .12, type = 'sine', delay = 0) {
    if (!context || context.state !== 'running') return;
    const time = context.currentTime + delay;
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time); gain.gain.linearRampToValueAtTime(volume, time + .015); gain.gain.exponentialRampToValueAtTime(.001, time + duration);
    oscillator.connect(gain); gain.connect(master); oscillator.start(time); oscillator.stop(time + duration + .03);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  return {
    start() { init(); active = true; },
    pause() { active = false; if (context) { seaGain.gain.setTargetAtTime(0, context.currentTime, .08); context.suspend().catch(() => {}); } },
    update(time) {
      if (!context || !active) return;
      seaGain.gain.setTargetAtTime(settings.sound ? .27 + Math.sin(time * .5) * .08 : 0, context.currentTime, .15);
      if (musicDuration) {
        const position = (context.currentTime - musicStart) % musicDuration;
        // Fade for the last six seconds, then gently bring the next loop back in.
        const envelope = Math.min(1, position / 1.5, (musicDuration - position) / Math.min(6, musicDuration / 2));
        musicGain.gain.setTargetAtTime(settings.music ? envelope * .8 : 0, context.currentTime, .05);
      }
    },
    effect(kind) {
      if (settings.sound) {
        if (kind === 'catch') { tone(880, .12, .13); tone(1174, .18, .09, 'sine', .06); }
        if (kind === 'splash' || kind === 'netSplash') tone(190, .2, kind === 'netSplash' ? .09 : .05, 'triangle');
        if (kind === 'breach') { tone(392, .18, .06); tone(587, .25, .04, 'sine', .08); }
        if (kind === 'warning' || kind === 'airWarning') { tone(660, .13, .07, 'triangle'); tone(520, .18, .05, 'triangle', .15); }
        if (kind === 'hurt') { tone(160, .22, .08, 'triangle'); tone(120, .22, .05, 'triangle', .12); }
        if (kind === 'mission' || kind === 'trick' || kind === 'end') [523, 659, 784, 1046].forEach((f, i) => tone(f, .4, .08, 'sine', i * .1));
      }
      if (settings.haptics && ['catch', 'hurt', 'mission'].includes(kind)) {
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: kind === 'hurt' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
        else if (navigator.vibrate) navigator.vibrate(kind === 'hurt' ? 60 : 10);
      }
    },
  };
}
