import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function createAudio(settings) {
  let context, master, sea, seaGain, noteAt = 0, note = 0, active = false;
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
      if (context.currentTime > noteAt) {
        if (settings.music) { const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 440, 523.25, 392]; tone(notes[note % notes.length], 1.3, .045); if (note % 4 === 0) tone(notes[note % notes.length] / 2, 2, .04); }
        note++; noteAt = context.currentTime + .55;
      }
    },
    effect(kind) {
      if (settings.sound) {
        if (kind === 'catch') { tone(880, .12, .13); tone(1174, .18, .09, 'sine', .06); }
        if (kind === 'splash' || kind === 'netSplash') tone(190, .2, kind === 'netSplash' ? .09 : .05, 'triangle');
        if (kind === 'breach') { tone(392, .18, .06); tone(587, .25, .04, 'sine', .08); }
        if (kind === 'warning' || kind === 'airWarning') { tone(660, .13, .07, 'triangle'); tone(520, .18, .05, 'triangle', .15); }
        if (kind === 'hurt') { tone(160, .22, .08, 'triangle'); tone(120, .22, .05, 'triangle', .12); }
        if (kind === 'mission' || kind === 'end') [523, 659, 784, 1046].forEach((f, i) => tone(f, .4, .08, 'sine', i * .1));
      }
      if (settings.haptics && ['catch', 'hurt', 'mission'].includes(kind)) {
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: kind === 'hurt' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
        else if (navigator.vibrate) navigator.vibrate(kind === 'hurt' ? 60 : 10);
      }
    },
  };
}
