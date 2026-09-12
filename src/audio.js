import menuMusicURL from './assets/menu-music.mp3?url';
import musicURL from './assets/soundtrack.mp3?url';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function createAudio(settings) {
  let context, master, sea, seaGain, active = false, scene = 'playing';
  const tracks = [];
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
      for (const [name, url] of [['playing', musicURL], ['menu', menuMusicURL]]) {
        const track = { name, gain: context.createGain(), start: 0, duration: 0 };
        track.gain.gain.value = 0; track.gain.connect(master); tracks.push(track);
        fetch(url).then(response => {
          if (!response.ok) throw new Error('Music unavailable');
          return response.arrayBuffer();
        }).then(data => context.decodeAudioData(data)).then(buffer => {
          const music = context.createBufferSource(); music.buffer = buffer; music.loop = true;
          music.connect(track.gain); track.duration = buffer.duration; track.start = context.currentTime; music.start();
        }).catch(() => { /* Effects remain available if a track cannot load. */ });
      }
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
  function selectScene(nextScene) {
    scene = nextScene;
    if (!context) return;
    // A scene switch must never leave the previous track audible until the
    // next animation frame. This matters most when Start is tapped on mobile.
    for (const track of tracks) {
      if (track.name === scene) continue;
      const gain = track.gain.gain;
      gain.cancelScheduledValues?.(context.currentTime);
      gain.setValueAtTime?.(0, context.currentTime);
      gain.setTargetAtTime(0, context.currentTime, .001);
    }
  }
  return {
    start(nextScene = 'playing') { init(); selectScene(nextScene); active = true; },
    pause() { active = false; if (context) { seaGain.gain.setTargetAtTime(0, context.currentTime, .08); context.suspend().catch(() => {}); } },
    update(time) {
      if (!context || !active) return;
      seaGain.gain.setTargetAtTime(settings.sound && scene === 'playing' ? .27 + Math.sin(time * .5) * .08 : 0, context.currentTime, .15);
      for (const track of tracks) {
        if (!track.duration) continue;
        const position = (context.currentTime - track.start) % track.duration;
        const envelope = Math.min(1, position / 1.5, (track.duration - position) / Math.min(6, track.duration / 2));
        track.gain.gain.setTargetAtTime(settings.music && scene === track.name ? envelope * .8 : 0, context.currentTime, .08);
      }
    },
    effect(kind) {
      if (settings.sound) {
        if (kind === 'catch') { tone(880, .12, .13); tone(1174, .18, .09, 'sine', .06); }
        if (kind === 'splash' || kind === 'netSplash') tone(190, .2, kind === 'netSplash' ? .09 : .05, 'triangle');
        if (kind === 'breach') { tone(392, .18, .06); tone(587, .25, .04, 'sine', .08); }
        if (kind === 'warning' || kind === 'airWarning') { tone(660, .13, .07, 'triangle'); tone(520, .18, .05, 'triangle', .15); }
        if (kind === 'hurt') { tone(160, .22, .08, 'triangle'); tone(120, .22, .05, 'triangle', .12); }
        if (kind === 'mission' || kind === 'trick' || kind === 'delivery' || kind === 'end') [523, 659, 784, 1046].forEach((f, i) => tone(f, .4, .08, 'sine', i * .1));
      }
      if (settings.haptics && ['catch', 'hurt', 'mission'].includes(kind)) {
        if (Capacitor.isNativePlatform()) Haptics.impact({ style: kind === 'hurt' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});
        else if (navigator.vibrate) navigator.vibrate(kind === 'hurt' ? 60 : 10);
      }
    },
  };
}
