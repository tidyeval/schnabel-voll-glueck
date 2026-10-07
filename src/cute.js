// Shared cuteness helpers and the small background residents of each stage.
// Presentation only: residents never collide and never score.
const TAU = Math.PI * 2;
const wrap = (value, span) => (value % span + span) % span;
function ellipse(c, x, y, rx, ry, fill, rotation = 0) { c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU); c.fillStyle = fill; c.fill(); }
function path(c, fill, draw, stroke, width = 1) {
  c.beginPath(); draw(c); if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.lineCap = 'round'; c.stroke(); }
}

// Every creature blinks on its own rhythm; returns how open the eye is.
export function blink(t, seed) { const k = ((t + seed * 2.37) % 3.4 + 3.4) % 3.4; return k < .16 ? Math.abs(k - .08) / .08 : 1; }
// Big glossy eyes with two highlights carry most of the cuteness.
export function cuteEye(c, x, y, r, open = 1, colour = '#294b49') {
  if (open < .3) { path(c, null, p => { p.moveTo(x - r * .9, y); p.quadraticCurveTo(x, y + r * .55, x + r * .9, y); }, colour, Math.max(1, r * .38)); return; }
  ellipse(c, x, y, r * .88, r * open, colour);
  ellipse(c, x - r * .3, y - r * .36 * open, r * .34, r * .34 * open, '#fffdf1');
  ellipse(c, x + r * .28, y + r * .34 * open, r * .15, r * .15 * open, '#fffdf1cc');
}
// Contented closed eyes: a little upside-down smile.
export function happyEye(c, x, y, r, colour = '#294b49') {
  path(c, null, p => { p.moveTo(x - r, y + r * .3); p.quadraticCurveTo(x, y - r * .9, x + r, y + r * .3); }, colour, Math.max(1, r * .4));
}
export function star(c, x, y, r, colour, rotation = 0) {
  path(c, colour, p => { for (let i = 0; i < 10; i++) { const a = rotation + i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * .45 : r; i ? p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : p.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } p.closePath(); });
}
const blush = (c, x, y, r) => ellipse(c, x, y, r, r * .6, '#ff8f9a66');

// Which residents live in each stage. A run picks a few and scatters them (see game.decor).
export const RESIDENTS = [['crab', 'starfish', 'bottle'], ['crab', 'cat', 'bottle'], ['octopus', 'seahorse', 'starfish']];

function crab(c, x, y, t, seed) {
  const step = Math.sin(t * 9), wave = Math.sin(t * 2.2 + seed) > .6 ? Math.sin(t * 14) * .5 : 0;
  c.save(); c.translate(x, y);
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) path(c, null, p => { p.moveTo(side * 9, 2 + i * 2); p.quadraticCurveTo(side * 17, -2 + i * 3 + step * (i % 2 ? 2 : -2), side * 20, 8 + i * 2); }, '#c8644e', 2);
  for (const side of [-1, 1]) {
    c.save(); c.translate(side * 15, -6); c.rotate(side * (-.4 - (side > 0 ? wave : 0)));
    path(c, null, p => { p.moveTo(0, 6); p.lineTo(0, 0); }, '#c8644e', 2.4);
    ellipse(c, 0, -4, 6, 5, '#f2896a'); path(c, '#fdf3e2', p => { p.moveTo(0, -4); p.lineTo(5, -8); p.lineTo(6, -2); p.closePath(); });
    c.restore();
  }
  ellipse(c, 0, 0, 14, 9.5, '#f2896a'); ellipse(c, -3, -3, 7, 3.5, '#ffb59a');
  for (const side of [-1, 1]) { path(c, null, p => { p.moveTo(side * 4, -7); p.lineTo(side * 5, -13); }, '#c8644e', 1.6); cuteEye(c, side * 5, -15, 3.6, blink(t, seed + side), '#3a3030'); }
  blush(c, -8, 1, 2.6); blush(c, 8, 1, 2.6);
  path(c, null, p => { p.moveTo(-2.5, 2); p.quadraticCurveTo(0, 4.5, 2.5, 2); }, '#9c4636', 1.2);
  c.restore();
}
function starfish(c, x, y, t, seed) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * .8 + seed) * .08);
  path(c, '#f4a76a', p => { for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 7 : 16; i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r); } p.closePath(); }, '#d9824f', 1.4);
  for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - Math.PI / 2; ellipse(c, Math.cos(a) * 10, Math.sin(a) * 10, 1.2, 1.2, '#ffd0a0'); }
  cuteEye(c, -3.5, -1, 2.6, blink(t, seed), '#5a3524'); cuteEye(c, 3.5, -1, 2.6, blink(t, seed), '#5a3524');
  blush(c, -6, 3, 2); blush(c, 6, 3, 2);
  path(c, null, p => { p.moveTo(-1.5, 3); p.quadraticCurveTo(0, 4.5, 1.5, 3); }, '#9c5636', 1);
  c.restore();
}
function octopus(c, x, y, t, seed, night) {
  const peek = .5 + .5 * Math.sin(t * .7 + seed);
  c.save(); c.translate(x, y + (1 - peek) * 26);
  if (night) { c.globalCompositeOperation = 'lighter'; ellipse(c, 0, -14, 34, 30, '#ff9fd018'); c.globalCompositeOperation = 'source-over'; }
  for (let i = 0; i < 5; i++) path(c, null, p => { const bx = -14 + i * 7; p.moveTo(bx, -4); p.quadraticCurveTo(bx + Math.sin(t * 2 + i) * 8, 8, bx + (i - 2) * 6, 16); }, '#d986b4', 5);
  path(c, '#e99ac4', p => { p.moveTo(-20, 0); p.bezierCurveTo(-22, -34, 22, -34, 20, 0); p.quadraticCurveTo(0, 6, -20, 0); }, '#b86c98', 1.2);
  ellipse(c, -7, -21, 5, 3, '#ffffff44');
  cuteEye(c, -7, -10, 4.4, blink(t, seed), '#4a2440'); cuteEye(c, 7, -10, 4.4, blink(t, seed), '#4a2440');
  blush(c, -12, -3, 3); blush(c, 12, -3, 3);
  c.restore();
  // The hiding rock in front.
  path(c, night ? '#24506a' : '#4f8580', p => { p.moveTo(x - 34, y + 22); p.quadraticCurveTo(x - 30, y + 4, x - 12, y + 8); p.quadraticCurveTo(x, y + 2, x + 14, y + 8); p.quadraticCurveTo(x + 32, y + 4, x + 36, y + 22); p.closePath(); });
}
function seahorse(c, x, y, t, seed, night) {
  c.save(); c.translate(x, y + Math.sin(t * 1.6 + seed) * 8); c.rotate(Math.sin(t * 1.1 + seed) * .08);
  if (night) { c.globalCompositeOperation = 'lighter'; ellipse(c, 0, 0, 22, 30, '#ffe0801a'); c.globalCompositeOperation = 'source-over'; }
  path(c, null, p => { p.moveTo(2, 8); p.bezierCurveTo(10, 22, -6, 30, 2, 34); p.quadraticCurveTo(8, 36, 6, 30); }, '#e7b85a', 4);
  path(c, '#f4cd6a', p => { p.moveTo(-6, -12); p.bezierCurveTo(-12, 0, -8, 14, 2, 14); p.bezierCurveTo(10, 12, 9, -2, 4, -10); p.closePath(); }, '#cf9b3f', 1);
  ellipse(c, 0, -16, 8, 7.5, '#f4cd6a');
  path(c, '#f4cd6a', p => { p.moveTo(-5, -16); p.lineTo(-17, -14); p.lineTo(-16, -10); p.lineTo(-4, -11); p.closePath(); }, '#cf9b3f', 1);
  path(c, '#f6b04c', p => { p.moveTo(6, -6); p.quadraticCurveTo(14, -2, 8, 6); p.closePath(); });
  for (let i = 0; i < 3; i++) ellipse(c, 2 + i, -24 + i * 3, 2, 2, '#e7a94c');
  cuteEye(c, -1, -17, 3.4, blink(t, seed), '#4a3418'); blush(c, -4, -12, 2.2);
  c.restore();
}
function bottle(c, x, water, t) {
  c.save(); c.translate(x, water - 2 + Math.sin(t * 2.3) * 2.5); c.rotate(-.25 + Math.sin(t * 1.7) * .12);
  path(c, '#b9e3d2cc', p => p.roundRect(-14, -6, 24, 12, 5), '#7fb3a6', 1);
  path(c, '#b9e3d2cc', p => p.rect(9, -3, 7, 6), '#7fb3a6', 1); ellipse(c, 17, 0, 2.5, 3, '#c49a6c');
  path(c, '#fff6dc', p => p.roundRect(-10, -3.5, 15, 7, 2)); path(c, null, p => { p.moveTo(-3, -3.5); p.lineTo(-3, 3.5); }, '#e07a6a', 1.4);
  ellipse(c, -8, -3, 4, 1.2, '#ffffff99');
  c.restore();
}
// The harbour cat naps on a roof; drawn with the houses so it scrolls with them.
export function roofCat(c, x, y, t) {
  c.save(); c.translate(x, y);
  path(c, null, p => { p.moveTo(9, 2); p.quadraticCurveTo(22, 2 + Math.sin(t * 2) * 4, 18, -8 + Math.sin(t * 2) * 3); }, '#e2955a', 3.4);
  ellipse(c, 0, -3, 12, 8, '#f0a868');
  ellipse(c, -9, -10, 7.5, 6.5, '#f0a868');
  path(c, '#f0a868', p => { p.moveTo(-15, -13); p.lineTo(-14, -21); p.lineTo(-9, -15); p.closePath(); p.moveTo(-8, -15); p.lineTo(-4, -21); p.lineTo(-3, -12); p.closePath(); });
  for (const s of [-12, -6]) path(c, null, p => { p.moveTo(s - 1.6, -10); p.quadraticCurveTo(s, -8.6, s + 1.6, -10); }, '#5a3a24', 1.1);
  blush(c, -14, -7, 1.6); blush(c, -4, -7, 1.6);
  for (let i = 0; i < 3; i++) ellipse(c, 2 + i * 4, -6, 1.6, 2.4, '#e2955a');
  const z = (t * .5) % 1;
  c.globalAlpha = 1 - z; c.fillStyle = '#7a6a8a'; c.font = `bold ${6 + z * 4}px sans-serif`; c.fillText('z', -4 + z * 8, -22 - z * 14); c.globalAlpha = 1;
  c.restore();
}

// Residents scroll with the seabed; each run scatters them differently.
export function drawResidents(c, game, stage, water, d, t, reducedMotion) {
  const decor = game.decor;
  if (!decor) return;
  const night = stage === 2;
  decor.residents.forEach((kind, i) => {
    if (kind === 'cat') return;
    const span = 1500 + i * 230, x = wrap(decor.offsets[i] - d * .92, span) - 80;
    if (x < -90 || x > 570) return;
    const seed = decor.offsets[i] * .01, motion = reducedMotion ? 0 : t;
    // Drawn a third larger so the faces stay readable on a phone.
    const anchor = { crab: 826, starfish: 832, octopus: 806, seahorse: 690, bottle: water }[kind];
    c.save(); c.translate(x, anchor); c.scale(1.35, 1.35); c.translate(-x, -anchor);
    if (kind === 'crab') crab(c, x + (reducedMotion ? 0 : Math.sin(t * .6 + seed) * 22), 826, motion, seed);
    if (kind === 'starfish') starfish(c, x, 832, motion, seed);
    if (kind === 'octopus') octopus(c, x, 806, motion, seed, night);
    if (kind === 'seahorse') seahorse(c, x, 690, motion, seed, night);
    if (kind === 'bottle') bottle(c, x, water, motion);
    c.restore();
  });
}
