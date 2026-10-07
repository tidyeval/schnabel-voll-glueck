// Stage atmosphere, set-piece scenery and game-feel overlays. Everything here is
// presentation only: nothing in this file is used for collisions or scoring.
import { WORLD, clamp, sardinePositions, currentSpan, FRENZY } from './game.js';
const TAU = Math.PI * 2;
const SHOW_TIME = 13;

export const THEMES = [
  { // Geschützte Bucht: clear morning.
    sky: [[0, '#a9dbe0'], [.6, '#d9ecd9'], [1, '#f7e9c6']], glow: '#efb68a3d', far: '#9cc7bd', tint: null,
    water: ['#6fc4b6', '#256068'], surface: '#f8dfad40', rays: '#fbf8c4', rayAlpha: .13, mote: '#e8f3cc35',
    seabed: '#578c81', grass: ['#6b9d7b', '#3f7e6c'], rocks: '#3f7c78', swell: 1,
  },
  { // Fischerhafen: the same sunny morning as the bay.
    sky: [[0, '#a9dbe0'], [.6, '#d9ecd9'], [1, '#f7e9c6']], glow: '#efb68a3d', far: '#9cc7bd', tint: null,
    water: ['#6fc4b6', '#256068'], surface: '#f8dfad40', rays: '#fbf8c4', rayAlpha: .13, mote: '#e8f3cc35',
    seabed: '#578c81', grass: ['#6b9d7b', '#3f7e6c'], rocks: '#3f7c78', swell: 1.2,
  },
  { // Korallenriff: sunny, with slightly lighter water.
    sky: [[0, '#a9dbe0'], [.6, '#d9ecd9'], [1, '#f7e9c6']], glow: '#efb68a3d', far: '#9cc7bd', tint: null,
    water: ['#78bdbb', '#386879'], surface: '#f8dfad40', rays: '#fbf8c4', rayAlpha: .13, mote: '#e8f3cc35',
    seabed: '#578c81', grass: ['#6b9d7b', '#3f7e6c'], rocks: '#3f7c78', swell: 1.1,
  },
];

const wrap = (value, span) => (value % span + span) % span;
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function fill(c, colour, draw) { c.beginPath(); draw(c); c.fillStyle = colour; c.fill(); }
function stroke(c, colour, width, draw) { c.beginPath(); draw(c); c.strokeStyle = colour; c.lineWidth = width; c.stroke(); }
function vertical(c, y1, y2, stops) {
  const g = c.createLinearGradient(0, y1, 0, y2);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  return g;
}

export function showState(game, reducedMotion) {
  if (reducedMotion || !game.show) return null;
  const age = game.time - game.show.start;
  if (age < 0 || age > SHOW_TIME) return null;
  return { name: game.show.name, age, envelope: clamp(Math.min(age / 1.5, (SHOW_TIME - age) / 2), 0, 1) };
}
// Passing ships and storms make the surface line heave; the collision water line is unchanged.
export function swellOf(game, stage, reducedMotion) {
  const show = showState(game, reducedMotion);
  return THEMES[stage].swell + (show && show.name === 'trawler' ? show.envelope * 1.5 : 0);
}

// Scenery is painted first, tinted in place, and the sky is slipped in behind it.
export function drawSky(c, stage, water, d, motion, game, reducedMotion, drawScenery) {
  const th = THEMES[stage];
  const show = game ? showState(game, reducedMotion) : null;
  drawScenery();
  if (show?.name === 'trawler') trawler(c, water, show, motion);
  if (th.tint) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = th.tint; c.fillRect(-30, -30, 540, water + 30); }
  c.globalCompositeOperation = 'source-over';
  c.globalCompositeOperation = 'destination-over';
  // Far shoreline: slowest layer.
  for (let layer = 0; layer < 2; layer++) {
    c.globalAlpha = layer ? .55 : .85;
    fill(c, th.far, p => {
      const shift = d * (layer ? .012 : .028);
      p.moveTo(-30, water);
      for (let x = -30; x <= 520; x += 20) {
        const u = (x + shift) * (layer ? .006 : .011);
        p.lineTo(x, water - (layer ? 46 : 20) - Math.sin(u) * (layer ? 24 : 11) - Math.sin(u * 2.7 + 1) * (layer ? 10 : 6));
      }
      p.lineTo(520, water); p.closePath();
    });
  }
  c.globalAlpha = 1;
  if (stage === 1) {
    // Harbour cranes and masts.
    for (let i = 0; i < 4; i++) {
      const x = wrap(i * 190 - d * .045, 760) - 120;
      stroke(c, '#89aaa0', 4, p => { p.moveTo(x, water); p.lineTo(x, water - 96); p.moveTo(x - 14, water - 96); p.lineTo(x + 62, water - 78); p.moveTo(x, water - 110); p.lineTo(x + 30, water - 86); p.moveTo(x, water - 110); p.lineTo(x, water - 96); });
      stroke(c, '#89aaa099', 1.5, p => { p.moveTo(x + 58, water - 79); p.lineTo(x + 58, water - 40); });
    }
  }
  if (show?.name === 'rainbow') rainbow(c, water, show);
  // Sun.
  fill(c, '#ffe7a6', p => p.arc(397, water - 140, 29, 0, TAU));
  fill(c, '#fff4c777', p => p.arc(397, water - 140, 43, 0, TAU));
  fill(c, '#fff0bd35', p => p.arc(397, water - 140, 61, 0, TAU));
  c.fillStyle = vertical(c, water - 150, water, [[0, th.glow.slice(0, 7) + '00'], [1, th.glow]]); c.fillRect(-30, water - 150, 540, 150);
  c.fillStyle = vertical(c, 0, water, th.sky); c.fillRect(-30, -30, 540, water + 30);
  c.globalCompositeOperation = 'source-over';
  if (show?.name === 'goldenHour') goldenHour(c, water, show, motion);
}

function rainbow(c, water, show) {
  const colours = ['#f08a7c', '#f6b877', '#f7e08e', '#a5d6a0', '#8ec7dc', '#a99fd6'];
  colours.forEach((colour, i) => {
    c.globalAlpha = .5 * show.envelope;
    c.beginPath(); c.arc(150, water + 40, 250 - i * 7, Math.PI, TAU); c.strokeStyle = colour; c.lineWidth = 7.5; c.stroke();
  });
  c.globalAlpha = 1;
}
function trawler(c, water, show, motion) {
  const x = 640 - show.age * 78, y = water - 4 + Math.sin(motion * 1.1) * 2;
  c.save(); c.translate(x, y);
  fill(c, '#6d7f86', p => { p.moveTo(-150, -34); p.lineTo(150, -34); p.lineTo(128, 6); p.lineTo(-118, 6); p.closePath(); });
  fill(c, '#8f4f4a', p => { p.moveTo(-143, -16); p.lineTo(141, -16); p.lineTo(128, 6); p.lineTo(-118, 6); p.closePath(); });
  fill(c, '#d9d2bb', p => p.rect(-40, -74, 92, 40)); fill(c, '#c0b8a0', p => p.rect(-22, -96, 50, 24));
  fill(c, '#5d6a70', p => p.rect(12, -124, 15, 30));
  for (let i = 0; i < 4; i++) fill(c, '#f8dc94', p => p.rect(-30 + i * 20, -64, 11, 11));
  stroke(c, '#59676d', 3, p => { p.moveTo(-96, -34); p.lineTo(-96, -118); p.moveTo(-96, -114); p.lineTo(-150, -58); p.moveTo(-96, -114); p.lineTo(-44, -74); });
  for (let i = 0; i < 5; i++) { const rise = (motion * .5 + i * .2) % 1; c.globalAlpha = (1 - rise) * .5; fill(c, '#e9e3d6', p => p.arc(20 + rise * 70, -130 - rise * 60, 8 + rise * 16, 0, TAU)); }
  c.globalAlpha = 1;
  fill(c, '#f3faeaaa', p => p.ellipse(140, 6, 46, 6, 0, 0, TAU)); fill(c, '#f3faea77', p => p.ellipse(-20, 8, 150, 5, 0, 0, TAU));
  c.restore();
}
function goldenHour(c, water, show, motion) {
  const e = show.envelope;
  c.fillStyle = `rgba(255,214,130,${.2 * e})`; c.fillRect(-30, -30, 540, water + 30);
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    c.globalAlpha = (.07 + Math.sin(motion * .8 + i) * .02) * e;
    fill(c, '#ffe9a8', p => { const x = 90 + i * 85; p.moveTo(x, -10); p.lineTo(x + 60, -10); p.lineTo(x + 170, water); p.lineTo(x + 40, water); p.closePath(); });
  }
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  for (let i = 0; i < 40; i++) {
    const life = wrap(show.age * .5 + hash(i), 1), x = hash(i + 50) * 480, y = life * water;
    c.globalAlpha = Math.sin(life * Math.PI) * .8 * e;
    fill(c, '#fff4c0', p => p.arc(x + Math.sin(show.age + i) * 8, y, 1.4 + hash(i + 9) * 1.6, 0, TAU));
  }
  c.globalAlpha = 1;
}
// Two dolphins leap along the sea and show where the bonus fish swim.
export function drawDolphins(c, game, water, motion, reducedMotion) {
  const show = showState(game, reducedMotion);
  if (show?.name !== 'dolphins') return;
  for (let k = 0; k < 2; k++) {
    const u = wrap(show.age * .55 - k * .22, 1.6) / 1.6;
    if (u > 1) continue;
    const x = 620 - u * 560 - k * 40, lift = Math.sin(u * Math.PI), y = water + 14 - lift * (96 - k * 24);
    const angle = Math.atan2(-Math.cos(u * Math.PI) * (96 - k * 24) * Math.PI / 560, -1);
    c.save(); c.translate(x, y); c.rotate(angle + Math.PI); c.scale(k ? .8 : 1, k ? .8 : 1);
    fill(c, '#7ea9c8', p => { p.moveTo(-44, 0); p.bezierCurveTo(-24, -24, 22, -22, 46, -4); p.bezierCurveTo(24, 12, -20, 14, -44, 0); });
    fill(c, '#f2f6f8', p => { p.moveTo(-30, 4); p.bezierCurveTo(-8, 14, 22, 12, 40, 0); p.bezierCurveTo(20, 16, -14, 18, -30, 4); });
    fill(c, '#7ea9c8', p => { p.moveTo(-4, -14); p.lineTo(8, -32); p.lineTo(14, -14); p.closePath(); });
    fill(c, '#7ea9c8', p => { p.moveTo(-42, 0); p.lineTo(-62, -14); p.lineTo(-58, 0); p.lineTo(-62, 14); p.closePath(); });
    fill(c, '#1d3b52', p => p.arc(30, -4, 2.2, 0, TAU));
    c.restore();
    if (lift < .25) for (let i = 0; i < 5; i++) fill(c, '#ffffffaa', p => p.arc(x + (i - 2) * 8, water - 4 - hash(i + k) * 14 * (1 - lift * 3), 2.2, 0, TAU));
  }
}

export function drawWater(c, stage, water, d, motion, game, reducedMotion) {
  const th = THEMES[stage];
  c.fillStyle = vertical(c, water, 850, [[0, th.water[0]], [1, th.water[1]]]); c.fillRect(-30, water, 540, 880 - water);
  c.fillStyle = vertical(c, water, water + 110, [[0, th.surface], [1, th.surface.slice(0, 7) + '00']]); c.fillRect(-30, water, 540, 110);
  // Light shafts sway slowly and fade with depth.
  for (let i = 0; i < 6; i++) {
    const x = i * 108 - 150 + Math.sin(motion * .15 + i * .7) * 22, wide = 38 + (i % 3) * 16;
    const g = c.createLinearGradient(0, water, 0, 820);
    const alpha = th.rayAlpha * (.7 + (reducedMotion ? .15 : Math.sin(motion * .6 + i * 2.1) * .3));
    g.addColorStop(0, th.rays + Math.round(clamp(alpha, 0, 1) * 255).toString(16).padStart(2, '0')); g.addColorStop(1, th.rays + '00');
    fill(c, g, p => { p.moveTo(x, water); p.lineTo(x + wide, water); p.lineTo(x + wide + 150, 850); p.lineTo(x + 70, 850); p.closePath(); });
  }
  // Distant underwater rocks, slower than the play layer.
  c.globalAlpha = .5;
  fill(c, th.rocks, p => {
    p.moveTo(-30, 850);
    for (let x = -30; x <= 520; x += 16) { const u = (x + d * .1) * .013; p.lineTo(x, 770 - Math.abs(Math.sin(u)) * 62 - Math.sin(u * 3.1) * 14); }
    p.lineTo(520, 850); p.closePath();
  });
  c.globalAlpha = 1;
  if (stage === 1) {
    // Pier posts fade with depth.
    for (let i = 0; i < 5; i++) {
      const x = wrap(i * 173 - d * .16, 760) - 120;
      c.fillStyle = vertical(c, water, water + 300, [[0, '#3d5f5244'], [1, '#3d5f5200']]); c.fillRect(x, water, 11, 300);
    }
  }
  for (let i = 0; i < 30; i++) {
    const x = wrap(i * 83.73 - d * .27, 520) - 20, y = water + 25 + (i * 41.4) % (820 - water);
    fill(c, th.mote, p => p.arc(x, y + Math.sin(motion + i) * 4, i % 3 === 0 ? 2 : 1, 0, TAU));
  }
  if (stage === 2) plankton(c, water, d, motion, game, reducedMotion);
}
// Bioluminescence: dim everywhere, bright where Pip disturbs the water.
function plankton(c, water, d, motion, game, reducedMotion) {
  const p = game?.player;
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 54; i++) {
    const x = wrap(hash(i) * 560 - d * (.32 + hash(i + 5) * .2), 560) - 40;
    const y = water + 34 + hash(i + 1) * (790 - water) + (reducedMotion ? 0 : Math.sin(motion * .8 + i) * 6);
    const near = p && p.wet ? clamp(1 - Math.hypot(x - p.x, y - p.y) / 150, 0, 1) : 0;
    const pulse = reducedMotion ? .5 : .5 + Math.sin(motion * (1.3 + hash(i + 2)) + i * 3) * .5;
    const glow = .1 + pulse * .16 + near * .7, size = 1.3 + hash(i + 3) * 1.6 + near * 2.5;
    c.globalAlpha = clamp(glow, 0, 1);
    fill(c, i % 4 ? '#5ff0e0' : '#9db8ff', q => q.arc(x, y, size, 0, TAU));
    c.globalAlpha = clamp(glow * .28, 0, 1);
    fill(c, '#5ff0e0', q => q.arc(x, y, size * 3.4, 0, TAU));
  }
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
// Bay seabed light net, drawn over the sand.
export function drawCaustics(c, stage, d, motion, reducedMotion) {
  if (stage !== 0) return;
  c.globalCompositeOperation = 'lighter';
  for (let row = 0; row < 3; row++) {
    stroke(c, `rgba(255,250,200,${.13 - row * .03})`, 2.2 - row * .5, p => {
      for (let x = -20; x <= 500; x += 10) {
        const u = (x + d * .27) * .045 + row * 1.9, wobble = reducedMotion ? 0 : motion * (1.1 + row * .3);
        const y = 806 + row * 13 + Math.sin(u + wobble) * 6 + Math.sin(u * 2.3 - wobble * .7) * 3;
        if (x === -20) p.moveTo(x, y); else p.lineTo(x, y);
      }
    });
  }
  c.globalCompositeOperation = 'source-over';
}
export function drawWhale(c, game, motion, reducedMotion) {
  const show = showState(game, reducedMotion);
  if (show?.name !== 'whale') return;
  const x = 760 - show.age * 92, y = 590 + Math.sin(show.age * .7) * 16, tail = Math.sin(show.age * 1.6) * .18;
  c.save(); c.translate(x, y); c.globalAlpha = .62;
  fill(c, '#16385a', p => { p.moveTo(-190, 6); p.bezierCurveTo(-170, -62, -20, -78, 110, -40); p.bezierCurveTo(160, -26, 200, -8, 236, -2); p.bezierCurveTo(190, 20, 120, 52, 0, 58); p.bezierCurveTo(-90, 60, -170, 44, -190, 6); });
  c.save(); c.translate(232, -2); c.rotate(tail);
  fill(c, '#16385a', p => { p.moveTo(-6, 0); p.quadraticCurveTo(40, -50, 78, -44); p.quadraticCurveTo(58, -12, 60, 0); p.quadraticCurveTo(58, 14, 80, 44); p.quadraticCurveTo(40, 50, -6, 0); });
  c.restore();
  fill(c, '#12304d', p => { p.moveTo(-40, 44); p.quadraticCurveTo(-10, 100, 48, 104); p.quadraticCurveTo(22, 70, 30, 46); p.closePath(); });
  for (let i = 0; i < 6; i++) stroke(c, '#2c5a80', 2, p => { p.moveTo(-176 + i * 6, 16 + i * 6); p.quadraticCurveTo(-110, 38 + i * 4, -30 + i * 8, 34 + i * 4); });
  fill(c, '#0b2137', p => p.arc(-146, -8, 4, 0, TAU));
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { c.globalAlpha = .25 + Math.sin(motion * 2 + i) * .15; fill(c, '#6ff0e4', p => p.arc(-160 + i * 26, -34 + Math.sin(i * 1.7) * 22, 2.4, 0, TAU)); }
  c.restore(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  if (x > -200 && x < 560) for (let i = 0; i < 7; i++) {
    const rise = wrap(motion * .35 + i * .143, 1);
    stroke(c, `rgba(214,244,255,${(1 - rise) * .5})`, 1.2, p => p.arc(x - 150 + Math.sin(i * 5) * 12, y - 50 - rise * 150, 2 + (i % 3) * 1.5, 0, TAU));
  }
}

export function drawBaitball(c, item, motion, night) {
  const sardines = sardinePositions(item, motion);
  if (night) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .12; fill(c, '#7fe9ff', p => p.ellipse(item.x, item.y, 86 * (1 + item.scatter * .7), 58 * (1 + item.scatter * .7), 0, 0, TAU)); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  sardines.forEach((s, i) => {
    if (s.eaten) return;
    const flip = s.heading < 0 ? -1 : 1, shimmer = .55 + Math.sin(motion * 9 + i * 1.3) * .45;
    c.save(); c.translate(s.x, s.y); c.scale(flip * 1.5, 1.5);
    fill(c, '#8fb6c4', p => { p.moveTo(7, 0); p.lineTo(13, -4.5); p.lineTo(13, 4.5); p.closePath(); });
    fill(c, '#bfdcec', p => p.ellipse(0, 0, 8.5, 3.6, 0, 0, TAU)); fill(c, '#5f8fb0', p => p.ellipse(0, -1.6, 7.5, 1.6, 0, 0, TAU));
    c.globalAlpha = shimmer; fill(c, '#ffffff', p => p.ellipse(-1, -1, 5, 1.2, 0, 0, TAU)); c.globalAlpha = 1;
    fill(c, '#2c4f57', p => p.arc(-5, -.5, 1, 0, TAU));
    c.restore();
  });
}
export function drawCurrent(c, item, motion, reducedMotion) {
  const span = currentSpan(item), left = Math.max(-20, span.left), right = Math.min(500, span.right);
  if (right <= left) return;
  const band = c.createLinearGradient(0, span.top, 0, span.bottom);
  band.addColorStop(0, '#d9fff400'); band.addColorStop(.5, '#d9fff466'); band.addColorStop(1, '#d9fff400');
  c.fillStyle = band; c.fillRect(left, span.top, right - left, span.bottom - span.top);
  c.save(); c.beginPath(); c.rect(left, span.top, right - left, span.bottom - span.top); c.clip();
  for (let i = 0; i < 16; i++) {
    const y = span.top + 8 + hash(i) * (span.bottom - span.top - 16);
    const x = span.left + wrap(hash(i + 4) * item.length - (reducedMotion ? 0 : motion * (240 + hash(i + 2) * 160)), item.length);
    stroke(c, `rgba(240,255,250,${.3 + hash(i + 7) * .4})`, 1.6, p => { p.moveTo(x, y); p.lineTo(x + 26 + hash(i + 1) * 34, y); });
  }
  for (let x = span.left + 40; x < span.right; x += 90) stroke(c, '#f4fff9cc', 3, p => { p.moveTo(x, item.y - 10); p.lineTo(x + 10, item.y); p.lineTo(x, item.y + 10); p.moveTo(x + 12, item.y - 10); p.lineTo(x + 22, item.y); p.lineTo(x + 12, item.y + 10); });
  c.restore();
}

// Particles, rings, flashes and the frenzy frame.
export function drawJuice(c, fx, game, water, motion, reducedMotion) {
  if (!fx) return;
  for (const ring of fx.rings || []) {
    const age = 1 - ring.life;
    for (let k = 0; k < 2; k++) {
      const radius = 12 + (age + k * .18) * 78 * ring.power;
      stroke(c, `rgba(244,252,236,${clamp(ring.life - k * .25, 0, 1) * .75})`, 2 - k * .8, p => p.ellipse(ring.x, water + 3, radius, radius * .15, 0, 0, TAU));
    }
  }
  for (const q of fx.particles || []) {
    const life = clamp(q.life / q.max, 0, 1);
    if (q.kind === 'bubble') stroke(c, `rgba(222,250,240,${life * .75})`, 1, p => p.arc(q.x, q.y, q.size, 0, TAU));
    else if (q.kind === 'spark') { c.globalAlpha = life; fill(c, q.colour || '#fff2b6', p => { p.moveTo(q.x, q.y - q.size * 2); p.lineTo(q.x + q.size * .6, q.y); p.lineTo(q.x, q.y + q.size * 2); p.lineTo(q.x - q.size * .6, q.y); p.closePath(); }); c.globalAlpha = 1; }
    else { c.globalAlpha = life * (q.kind === 'mist' ? .5 : .95); fill(c, '#f1fbe9', p => p.ellipse(q.x, q.y, q.size, q.size * (q.kind === 'mist' ? 1 : 1.7), Math.atan2(q.vy, q.vx) + Math.PI / 2, 0, TAU)); c.globalAlpha = 1; }
  }
  const p = game.player, rush = Math.max(fx.rush || 0, game.boost || 0);
  if (rush > .05 && !reducedMotion) {
    c.strokeStyle = `rgba(244,255,248,${.3 * rush})`; c.lineWidth = 1.5; c.beginPath();
    for (let i = 0; i < 18; i++) {
      const y = (game.frenzy > 0 ? 60 : water + 20) + hash(i) * (game.frenzy > 0 ? 760 : 800 - water), x = wrap(hash(i + 3) * 620 - motion * (700 + hash(i + 6) * 500), 620) - 70;
      c.moveTo(x, y); c.lineTo(x + 40 + hash(i + 8) * 70 * rush, y);
    }
    c.stroke();
  }
  if (game.frenzy > 0) {
    const pulse = reducedMotion ? .7 : .7 + Math.sin(motion * 9) * .3, edge = clamp(game.frenzy, 0, 1);
    for (const side of [0, 1]) {
      const g = c.createLinearGradient(side ? 480 : 0, 0, side ? 400 : 80, 0);
      g.addColorStop(0, `rgba(255,214,110,${.42 * pulse * edge})`); g.addColorStop(1, 'rgba(255,214,110,0)');
      c.fillStyle = g; c.fillRect(side ? 400 : 0, 0, 80, 850);
    }
    stroke(c, '#fff0b4', 4, q => q.arc(p.x, p.y - 6, 46, -Math.PI / 2, -Math.PI / 2 + TAU * game.frenzy / FRENZY.duration));
    stroke(c, '#ffd66e55', 9, q => q.arc(p.x, p.y - 6, 46, -Math.PI / 2, -Math.PI / 2 + TAU * game.frenzy / FRENZY.duration));
  }
  if (fx.pulse > 0) stroke(c, `rgba(255,255,255,${fx.pulse})`, 3, q => q.arc(p.x, p.y - 6, 30 + (1 - fx.pulse) * 70, 0, TAU));
  if (fx.flash > 0) { c.fillStyle = fx.flashColour; c.globalAlpha = clamp(fx.flash, 0, 1); c.fillRect(-30, -30, 540, 910); c.globalAlpha = 1; }
}
export const WATERLINE = WORLD.water;
