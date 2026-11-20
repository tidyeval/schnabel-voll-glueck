import { STAGES } from './stages.js';
import { t as translate } from './i18n.js';
import { WORLD, clamp, netShape, playerTilt, terrainBlocks, airState, pufferRadius, LEAP } from './game.js';
import { blink, cuteEye, happyEye, star, drawResidents, roofCat } from './cute.js';
import { drawSky, drawWater, drawCaustics, drawSeabedLife, drawStageHighlight, drawWhale, drawDolphins, drawBaitball, drawCurrent, drawJuice, swellOf, drawRare, drawRollers, drawStorm, rollerLift } from './scenery.js';
const TAU = Math.PI * 2;
function ellipse(c, x, y, rx, ry, fill, rotation = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, TAU); c.fillStyle = fill; c.fill();
}
function path(c, fill, draw, stroke, width = 1) {
  c.beginPath(); draw(c); if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function gradient(c, y1, y2, a, b) {
  const g = c.createLinearGradient(0, y1, 0, y2); g.addColorStop(0, a); g.addColorStop(1, b); return g;
}
function cloud(c, x, y, size, opacity = .65) {
  c.save(); c.translate(x, y); c.scale(size, size); c.globalAlpha = opacity;
  path(c, '#d7c8a842', p => { p.moveTo(-55, 10); p.quadraticCurveTo(0, 25, 51, 11); p.quadraticCurveTo(0, 31, -55, 10); });
  path(c, '#fffaf0', p => { p.moveTo(-58, 8); p.bezierCurveTo(-68, -6, -45, -18, -31, -12); p.bezierCurveTo(-26, -42, 15, -38, 21, -17); p.bezierCurveTo(48, -27, 62, -5, 48, 10); p.quadraticCurveTo(0, 21, -58, 8); });
  ellipse(c, -12, -18, 20, 13, '#fffdf5aa', -.12); c.restore();
}
function palm(c, x, y, scale, t) {
  c.save(); c.translate(x, y); c.scale(scale, scale); c.rotate(Math.sin(t * .5) * .015);
  path(c, gradient(c, -100, 2, '#c4a476', '#897153'), p => { p.moveTo(-6, 2); p.quadraticCurveTo(10, -46, 0, -100); p.lineTo(5, -100); p.quadraticCurveTo(21, -47, 6, 2); p.closePath(); }, '#76654e', 1);
  for (let y = -16; y > -88; y -= 18) path(c, null, p => { p.moveTo(0, y); p.quadraticCurveTo(7, y + 4, 11, y + 1); }, '#dac29477', 1.2);
  for (let i = 0; i < 6; i++) {
    c.save(); c.translate(3, -98); c.rotate((i - 2.5) * .58);
    path(c, i % 2 ? '#6f9e73' : '#477c63', p => { p.moveTo(0, 0); p.quadraticCurveTo(38, -32, 65, 8); p.quadraticCurveTo(47, -1, 36, 3); p.quadraticCurveTo(23, -5, 0, 0); }, '#426b58', .7);
    path(c, null, p => { p.moveTo(4, -2); p.quadraticCurveTo(34, -15, 61, 6); }, '#b3bd7d88', .8); c.restore();
  }
  ellipse(c, 0, -92, 5, 6, '#a17c53'); ellipse(c, 9, -93, 5, 6, '#8e7952'); c.restore();
}
function island(c, x, water, t) {
  c.save(); c.translate(x, water);
  path(c, '#bdd0a9', p => { p.moveTo(-170, -8); p.quadraticCurveTo(-105, -80, -44, -82); p.quadraticCurveTo(-5, -83, 26, -62); p.quadraticCurveTo(62, -32, 120, -6); p.closePath(); }, '#739176', 1);
  path(c, '#f2dfb7', p => { p.moveTo(-170, 0); p.quadraticCurveTo(-88, -23, -4, -10); p.quadraticCurveTo(82, -12, 129, 2); p.quadraticCurveTo(46, 11, -31, 5); p.closePath(); }, '#d0b98d', 1);
  path(c, '#8bb79a', p => { p.moveTo(-130, -10); p.quadraticCurveTo(-65, -80, 10, -51); p.quadraticCurveTo(38, -37, 49, -15); p.closePath(); });
  // Small lighthouse, its rounded silhouette stays readable behind the player.
  path(c, '#fbf2d8', p => { p.moveTo(-57, -52); p.lineTo(-51, -118); p.lineTo(-32, -118); p.lineTo(-25, -52); p.closePath(); });
  path(c, '#e2a078', p => { p.moveTo(-54, -87); p.lineTo(-30, -87); p.lineTo(-29, -74); p.lineTo(-55, -74); p.closePath(); });
  c.fillStyle = '#527c76'; c.fillRect(-51, -129, 20, 12);
  path(c, '#cf8262', p => { p.moveTo(-57, -130); p.lineTo(-41, -142); p.lineTo(-25, -130); p.closePath(); });
  c.fillStyle = '#ffe5a1'; c.fillRect(-44, -126, 6, 8);
  palm(c, 28, -30, .55, t); c.restore();
}
export function fish(c, x, y, scale = 1, golden = false, t = 0, scared = 0, tilt = 0) {
  const swim = Math.sin(t * (tilt ? 16 : 7)) * .16;
  c.save(); c.translate(x, y); c.scale(scale, scale); c.rotate(Math.sin(t * 3) * .035 + tilt);
  const col = golden ? '#f6cd5f' : '#efa98e', edge = golden ? '#b9823e' : '#af6f66';
  c.save(); c.translate(10, 0); c.rotate(swim); c.translate(-10, 0);
  path(c, golden ? '#e6a94c' : '#d68172', p => { p.moveTo(9, 0); p.lineTo(28, -13); p.quadraticCurveTo(23, 0, 28, 13); p.closePath(); }, edge, 1); c.restore();
  ellipse(c, 0, 0, 18, 10.5, gradient(c, -10, 11, col, golden ? '#e9ae51' : '#d98b7d'));
  ellipse(c, -5, 3, 10, 5, golden ? '#ffe9a1' : '#ffd3b9');
  path(c, golden ? '#e3a448' : '#d47d70', p => { p.moveTo(-1, -8); p.lineTo(8, -16); p.lineTo(12, -5); p.closePath(); }, edge, .8);
  path(c, null, p => { p.moveTo(-2, -7); p.quadraticCurveTo(5, -2, 12, -1); }, '#fff0c477', 1.2);
  cuteEye(c, -9.5, -2.5, 4.2 + scared * 1.2, scared ? 1 : blink(t, y * .013), '#315653');
  ellipse(c, -6.5, 3.6, 3, 1.7, '#f3868a55');
  if (scared) ellipse(c, -14, 4, 1.6, 2.2 * scared, edge);
  else path(c, null, p => { p.moveTo(-15, 3); p.quadraticCurveTo(-12.5, 5.5, -10, 4); }, edge, 1);
  if (golden) { c.strokeStyle = '#fff0bd'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(-4, -19); c.lineTo(-4, -27); c.moveTo(-8, -23); c.lineTo(0, -23); c.stroke(); }
  c.restore();
}
function pelicanWing(c, lift, fold, back) {
  c.save(); c.translate(back ? -14 : -10, back ? -5 : 0);
  if (back) c.scale(.88, .9);
  const elbow = -23 + fold * 6, tip = -57 + fold * 18;
  const ey = -lift * 24, ty = -lift * 57;
  path(c, back ? '#dce7d3' : gradient(c, -55, 55, '#fffbed', '#d1dfca'), p => {
    p.moveTo(2,-4); p.quadraticCurveTo(-9,-11,elbow,ey-7);
    p.quadraticCurveTo(tip+13,ty-7,tip,ty);
    p.quadraticCurveTo(tip-4,ty+5,tip+8,ty+7);
    p.quadraticCurveTo(tip-1,ty+13,tip+14,ty+13);
    p.quadraticCurveTo(tip+8,ty+20,tip+23,ty+17);
    p.quadraticCurveTo(elbow-2,ey+15,-7,10);p.quadraticCurveTo(3,7,2,-4);
  },back?'#a4b9a3':'#87957b',1.1);
  for(let i=0;i<3;i++) path(c,null,p=>{p.moveTo(elbow+8,ey+3+i*2);p.quadraticCurveTo(tip+25,ty+7+i*3,tip+9+i*6,ty+6+i*5)},'#b7cbb2',1);
  c.restore();
}
export function pelican(c, {
  x, y, scale, time: t, tilt = 0, outfit = 'classic', wet = false, happy = false,
  gulp = 0, breach = 0, cargo = 0, breath = WORLD.breath, reducedMotion = false, expression = {},
}) {
  const confused = expression.confused || 0;
  c.save(); c.translate(x, y); c.rotate(tilt + (reducedMotion ? 0 : Math.sin(confused * 18) * .28 * Math.min(1, confused))); c.scale(scale, scale);
  // Squash on splashdown, stretch along the flight path when moving fast.
  if (!reducedMotion) { const sq = expression.squash || 0, st = expression.stretch || 0; c.scale(1 + st + sq * .17, 1 - st * .7 - sq * .17); }
  // Joy (golden fish, mission, combo, rare moment): a high hop, then a smaller second one.
  const joyLeft = reducedMotion ? 0 : clamp((expression.joy || 0) / 1.4, 0, 1), joy = Math.min(1, joyLeft * 2);
  if (joyLeft) {
    const u = 1 - joyLeft, hop = u < .55 ? Math.sin(u / .55 * Math.PI) * 46 : Math.sin((u - .55) / .45 * Math.PI) * 16;
    c.translate(0, -hop);
  }
  const fullness = cargo / WORLD.capacity;
  const state = airState({ y, wet, breath }, cargo);
  const lowAir = state.level > 0, urgency = state.urgency;
  const relief = expression.relief || 0, bump = reducedMotion ? 0 : expression.bump || 0;
  const shake = reducedMotion ? 0 : Math.sin(relief * 25) * .07 * Math.min(1, relief);
  const yawn = reducedMotion ? 0 : expression.yawn || 0;
  const tired = Math.max(yawn * .8, happy || relief > 0 ? 0 : clamp((35 - (expression.energy ?? 100)) / 35, 0, 1));
  const hurt = (expression.hurt || 0) > 0;
  // Swallowing tosses the head up once, the way pelicans gulp a fish down.
  const toss = reducedMotion || gulp <= 0 ? 0 : -Math.sin((1 - Math.min(gulp, .42) / .42) * Math.PI) * .16;
  const headAngle = (lowAir ? -.12 - urgency * .22 : expression.nest ? -.16 : shake + tired * .2) + (expression.look || 0) + toss;
  const headPose = () => { c.translate(66, -27); c.rotate(headAngle); c.translate(-66, 27); };
  if (bump) c.transform(1, 0, Math.sin(bump * 22) * .07, 1, 0, 0);
  if (!reducedMotion && expression.shiver > 0) c.rotate(Math.sin(expression.shiver * 48) * .07 * Math.min(1, expression.shiver * 3));
  const wobble = reducedMotion ? 0 : Math.sin(t * 6) * fullness * 3 + Math.sin(gulp * 22) * gulp * 8;
  const bite = Math.max(yawn * 1.3, lowAir ? 0 : gulp > 0 ? Math.sin((1 - Math.min(gulp, .42) / .42) * Math.PI) * 1.5 : relief > .8 ? .45 : expression.fish ? .35 : 0);
  // Shared, stable phase: brisk downstroke and slower, folded recovery.
  const cycle = (t * 1.3) % 1, down = cycle < .42;
  const progress = down ? cycle / .42 : (cycle - .42) / .58;
  const lift = Math.cos(progress * Math.PI) * (down ? 1 : -1) * (1 - tired * .3) - tired * .25;
  const fold = down ? 0 : Math.sin(progress * Math.PI);
  const flap = wet ? Math.sin(t * (7 + urgency * 8)) * (.15 + urgency * .35) : lift;
  // Air poses on top of the glide cycle: one big stroke to lift off the water, wings
  // laid back for a plunge, and a quick happy flutter.
  let wingLift = lift, wingFold = fold;
  if (!wet && !reducedMotion) {
    const off = clamp(breach / .6, 0, 1), plunge = expression.plunge || 0;
    if (off) { const stroke = Math.cos(Math.min(1, (1 - off) * 1.5) * Math.PI) * 1.3; wingLift = lift * (1 - off) + stroke * off; wingFold = fold * (1 - off); }
    if (joy) { wingLift = wingLift * (1 - joy) + Math.sin(t * 17) * .8 * joy; wingFold *= 1 - joy; }
    if (plunge) { wingLift = wingLift * (1 - plunge) - .45 * plunge; wingFold = wingFold * (1 - plunge) + plunge; }
  }
  // A held cheering pose (souvenir photo): both wings raised high and open.
  if (!wet && expression.cheer) { wingLift = 1.15; wingFold = 0; }
  const outline = '#786f5d';
  // A soft painted shadow and separated tail feathers keep Pip readable over sea and sky.
  ellipse(c, -5, 17, 47, 25, '#315e5a22', -.12);
  path(c, '#d8e3ce', p => { p.moveTo(-39, 7); p.lineTo(-68, -4); p.quadraticCurveTo(-62, 10, -39, 20); p.moveTo(-40, 11); p.lineTo(-65, 17); p.quadraticCurveTo(-53, 25, -31, 22); }, outline, 1.2);
  if (!wet) pelicanWing(c, wingLift, wingFold, true);
  c.save(); if (wet) { c.translate(-5, -8); c.rotate(-.3); }
  c.strokeStyle = '#d9955c'; c.lineWidth = 5; c.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    // Under water the feet only paddle when Pip pushes deeper: slow alternate strokes, otherwise they trail.
    const push = wet && !reducedMotion ? clamp(((expression.dive || 0) - .15) / .6, 0, 1) : 0;
    const paddle = push ? Math.sin(t * (3 + push * 1.5) + i * Math.PI) * push : 0;
    const kicking = expression.kick > 0 && i === 1, dx = kicking ? 42 : -24 + i * 19 - paddle * 13, dy = kicking ? 14 : 36 + flap * 2 + paddle * 8;
    c.beginPath(); c.moveTo(-17 + i * 17, 27); c.lineTo(dx, dy); c.stroke();
    path(c, '#e7a662', p => { p.moveTo(dx - 5, dy - 3); p.lineTo(dx + (kicking ? 15 : -12), dy + 4); p.lineTo(dx + (kicking ? 7 : -1), dy + 8); p.lineTo(dx + (kicking ? 17 : 7), dy + 12); p.lineTo(dx + 4, dy + 10); p.closePath(); }, '#c98550', .8);
  }
  c.restore();
  ellipse(c, -17, 7, 38, 30 + bite * 2, gradient(c, -20, 38, '#fffaf0', '#dce6d0'), -.16);
  c.save(); headPose();
  path(c, gradient(c, -57, 21, '#fffdf2', '#ecedd7'), p => { p.moveTo(1, 17); p.bezierCurveTo(-11, 3, -5, -15, -1, -39); p.bezierCurveTo(5, -69, 42, -65, 44, -40); p.bezierCurveTo(45, -25, 20, -15, 20, 4); p.quadraticCurveTo(17, 20, 1, 17); }, outline, 1.1);
  // Pip's tousled crown is his main character mark at every rendered scale.
  path(c, '#fffdf2', p => { p.moveTo(4, -56); p.quadraticCurveTo(-5, -70, 4, -73); p.quadraticCurveTo(10, -70, 12, -61); p.quadraticCurveTo(10, -77, 18, -75); p.quadraticCurveTo(25, -68, 21, -59); }, outline, 1);
  const pouch = p => { p.moveTo(37, -40); p.lineTo(91, -25); p.bezierCurveTo(72, -15 + bite * 11, 57, 7 + bite * 15 + fullness * 46 + wobble, 40, -7); p.quadraticCurveTo(31, -18, 37, -40); };
  path(c, gradient(c, -35, 8, '#f3c574', '#dc9758'), pouch, '#bd774b', 1.1);
  path(c, '#f8d79055', p => { p.moveTo(42, -31); p.quadraticCurveTo(63, -23, 82, -23); p.quadraticCurveTo(64, -14, 47, -9); p.quadraticCurveTo(39, -18, 42, -31); });
  // The catch wriggles inside the pouch; when it is nearly full a tail pokes out of the beak.
  c.save(); c.beginPath(); pouch(c); c.clip();
  if (fullness > .2) for (let i = 0; i < Math.ceil(fullness * 3); i++) {
    const fx = 50 + i * 9, fy = -11 + fullness * 12 + i * 3 + (reducedMotion ? 0 : Math.sin(t * 5 + i * 2) * 1.6), flick = reducedMotion ? 0 : Math.sin(t * 9 + i * 3) * 2;
    ellipse(c, fx, fy, 5.5, 2.6, '#b0684e77', -.25 + i * .15);
    path(c, '#b0684e77', p => { p.moveTo(fx + 4, fy); p.lineTo(fx + 9, fy - 3 + flick); p.lineTo(fx + 9, fy + 3 + flick); p.closePath(); });
  }
  c.restore();
  if (fullness > .75) {
    const flap = reducedMotion ? 0 : Math.sin(t * 8) * 3;
    path(c, '#d68172', p => { p.moveTo(76, -28); p.lineTo(82, -42 + flap); p.quadraticCurveTo(84, -35, 89, -38 + flap); p.lineTo(83, -27); p.closePath(); }, '#af6f66', .8);
  }
  c.save(); c.translate(35, -40); c.rotate(-bite * .22); c.translate(-35, 40);
  path(c, gradient(c, -44, -21, '#ffe19a', '#efb75f'), p => { p.moveTo(35, -43); p.quadraticCurveTo(67, -38, 94, -27); p.quadraticCurveTo(101, -22, 87, -22); p.lineTo(35, -30); p.closePath(); }, '#bd774b', 1);
  c.restore();
  path(c, null, p => { p.moveTo(38, -30); p.quadraticCurveTo(66, -26, 90, -25); }, '#b8764c', 1.3);
  if (lowAir) {
    ellipse(c, 25, -46, 4.8 + urgency, 5.8 + urgency, '#294b49'); ellipse(c, 25.5, -49.5, 1.5, 1.7, '#fffdf1');
    path(c, null, p => { p.moveTo(18, -54 - urgency * 2); p.lineTo(32, -51 + urgency); }, '#8f765f', 1.8);
    if (!reducedMotion) for (let i = 0; i < Math.ceil(urgency * 3); i++) { const rise = (t * (18 + urgency * 9) + i * 10) % 25; ellipse(c, 91 + i * 5, -27 - rise, 1.5 + i * .5, 1.5 + i * .5, '#e4f8e3aa'); }
  } else if (confused) {
    path(c, null, p => { p.moveTo(19, -50); p.lineTo(30, -41); p.moveTo(30, -50); p.lineTo(19, -41); }, '#31524f', 2.2);
  } else if (hurt) path(c, null, p => { p.moveTo(20, -49); p.lineTo(27, -45); p.lineTo(20, -42); }, '#31524f', 2.8);
  else if (tired > 0) {
    ellipse(c, 25, -45, 4.4, 5.4 - tired * 3.5, '#294b49');
    path(c, null, p => { p.moveTo(18, -48 + tired * 2); p.quadraticCurveTo(25, -51 + tired * 4, 32, -48 + tired * 2); }, '#8f765f', 2);
  } else if (expression.wink > 0 && !reducedMotion) {
    path(c, null, p => { p.moveTo(19, -45); p.quadraticCurveTo(26, -51, 32, -45); }, '#31524f', 2.8);
    star(c, 40, -60, 3 + expression.wink * 4, '#ffd66e', t * 4); ellipse(c, 21, -35, 7, 4, '#ff9fae77');
  } else if (happy || relief > 0) path(c, null, p => { p.moveTo(20, -43); p.quadraticCurveTo(26, -50, 32, -43); }, '#31524f', 2.8);
  else if (expression.sparkle > 0) { star(c, 25.5, -46, 7.5, '#f2b640', reducedMotion ? 0 : t * 3); star(c, 25.5, -46, 3.6, '#fff4c4', reducedMotion ? 0 : t * 3); }
  else { const gaze = expression.fish ? clamp((expression.fish.y - y) * .03, -2, 2) : 0; cuteEye(c, 25.5 + (expression.fish ? 1 : 0), -46 + gaze, 6.2, expression.fish || reducedMotion ? 1 : blink(t, .5)); }
  if (!lowAir) path(c, null, p => { p.moveTo(18, -53); p.quadraticCurveTo(25, -57, 32, -52); }, '#aa9271', 1.1);
  ellipse(c, 21, -35, 5.6, 3.3, '#e8aa94');
  // Dizzy little stars instead of a harsh red flash after a bump.
  if (hurt && !reducedMotion) for (let i = 0; i < 3; i++) { const a = t * 6 + i * TAU / 3; star(c, 20 + Math.cos(a) * 22, -72 + Math.sin(a) * 7, 4.5, i % 2 ? '#ffd66e' : '#fff0b0', a); }
  c.restore();
  if (wet) {
  // Wings stay tucked under water; a strong stroke now and then while diving, spread a little when rising.
  const dive = reducedMotion ? 0 : expression.dive || 0, rise = reducedMotion ? 0 : expression.rise || 0;
  const strokeBeat = dive * Math.pow(Math.max(0, Math.sin(t * 4.2)), 4);
  c.save(); c.translate(-12, 5); c.rotate(-strokeBeat * 1.05 - rise * .35); c.scale(.8 + strokeBeat * .5 + rise * .2, .6 + strokeBeat * .45 + rise * .25);
  path(c, gradient(c, 0, 35, '#f3f5e4', '#ccdcca'), p => { p.moveTo(-35, -3); p.bezierCurveTo(-16, -7, 0, 7, -5, 22); p.quadraticCurveTo(-14, 32, -23, 26); p.quadraticCurveTo(-37, 25, -43, 12); p.quadraticCurveTo(-48, 3, -35, -3); }, outline, 1);
  for (let i = 0; i < 4; i++) path(c, null, p => { p.moveTo(-36 + i * 8, 10); p.quadraticCurveTo(-31 + i * 8, 19, -25 + i * 7, 21); }, i === 3 ? '#b4c9b7' : '#c1d3c0', 1.1);
  c.restore();
  } else pelicanWing(c, wingLift, wingFold, false);
  if (!wet && !reducedMotion && breach > 0) {
    // The big lift-off stroke flings the sea off the wings in a spray of drops.
    const u = 1 - clamp(breach / .6, 0, 1);
    c.globalAlpha = 1 - u;
    for (let i = 0; i < 10; i++) {
      const sx = -22 - i * 5 - u * (30 + (i % 3) * 22), sy = -34 + (i % 4) * 9 - u * (40 - i * 3) + u * u * 150;
      ellipse(c, sx, sy, 2.2 + (i % 3) * .7, 3.2 + (i % 3), i % 2 ? '#e8f8f2' : '#bfe8ee', -.4);
    }
    c.globalAlpha = 1;
  }
  if (wet) {
    for (let i = 0; i < 3; i++) ellipse(c, -36 + i * 12, -4 + Math.sin(t * 5 + i) * 2, 1.4, 3, '#d8f2deaa', -.2);
  }
  c.save(); headPose();
  if (outfit === 'flower') {
    path(c, null, p => { p.moveTo(6, -59); p.quadraticCurveTo(1, -69, -5, -72); }, '#668b69', 2);
    for (let i = 0; i < 5; i++) ellipse(c, 7 + Math.cos(i / 5 * TAU) * 7, -61 + Math.sin(i / 5 * TAU) * 7, 5.5, 4.5, i % 2 ? '#e9a29e' : '#f0b3a5', i / 5 * TAU);
    ellipse(c, 7, -61, 4, 4, '#f6cf76'); ellipse(c, 5.8, -62.3, 1.2, 1.2, '#fff2b5');
  }
  if (outfit === 'sailor') {
    path(c, '#f8f5e7', p => { p.moveTo(1, -62); p.lineTo(-1, -74); p.quadraticCurveTo(21, -85, 35, -72); p.lineTo(32, -61); p.closePath(); }, outline, 1);
    path(c, '#477884', p => { p.moveTo(0, -67); p.quadraticCurveTo(17, -62, 34, -66); p.lineTo(33, -61); p.quadraticCurveTo(17, -58, 0, -63); p.closePath(); });
    ellipse(c, 20, -76, 2.3, 2.3, '#f1c56d');
  }
  c.restore(); c.restore();
}
const SHARK_LOOK = { tail: '#557f89', edge: '#426974', fin: '#638e98', body: ['#83abb0', '#527d89'], belly: '#bad0c8', flipper: '#648d96', eye: '#294e55', mouth: '#3d6670', brow: '#527783', gill: '#597e88', teeth: false };
// The great white: paler, bigger, with a cheeky toothy grin (still a cartoon, never gory).
const WHITE_LOOK = { tail: '#7f8d95', edge: '#56646c', fin: '#8c9aa2', body: ['#c3ced2', '#76868f'], belly: '#f5f6ee', flipper: '#85939b', eye: '#26343a', mouth: '#4a5860', brow: '#5e6d75', gill: '#7a8991', teeth: true };
function shark(c, item, t, look = SHARK_LOOK) {
  const hurry = item.phase === 'dash' || item.phase === 'chase' ? 11 : item.phase === 'warn' ? 16 : 4;
  const tail = Math.sin(t * hurry) * (item.phase === 'dash' ? .3 : .16);
  c.save(); c.translate(item.x, item.y); c.rotate(Math.sin(t * (item.phase === 'warn' ? 16 : 1.5)) * .04);
  if (look.teeth) c.scale(-1.45, 1.45);
  if (item.phase === 'warn') c.scale(.92, 1.15);
  if (item.reaction > 0) c.rotate(-.1 * item.reaction);
  c.save(); c.translate(43, 0); c.rotate(tail); c.translate(-43, 0);
  path(c, look.tail, p => { p.moveTo(39, 0); p.lineTo(80, -30); p.quadraticCurveTo(72, -8, 67, 0); p.quadraticCurveTo(75, 10, 82, 27); p.closePath(); }, look.edge, 1.2); c.restore();
  path(c, look.fin, p => { p.moveTo(-7, -18); p.quadraticCurveTo(6, -50, 21, -51); p.quadraticCurveTo(20, -30, 26, -14); p.closePath(); }, look.edge, 1.1);
  ellipse(c, 0, 0, 55, 26, gradient(c, -26, 25, ...look.body));
  path(c, look.belly, p => { p.moveTo(-50, 8); p.quadraticCurveTo(-12, 28, 46, 12); p.quadraticCurveTo(14, 29, -24, 22); p.closePath(); });
  path(c, look.flipper, p => { p.moveTo(3, 8); p.lineTo(24, 34); p.quadraticCurveTo(20, 17, 25, 9); p.closePath(); }, look.edge, 1);
  cuteEye(c, -33, -4, 5.4, item.reaction > 0 ? 0 : blink(t, (item.baseY ?? item.y) * .01), look.eye);
  if (look.teeth) {
    // Open grin with a neat row of little teeth.
    path(c, '#7a3f45', p => { p.moveTo(-47, 6); p.quadraticCurveTo(-30, 22, -12, 6); p.quadraticCurveTo(-30, 13, -47, 6); });
    for (let i = 0; i < 6; i++) { const x = -44 + i * 5.6; path(c, '#fffdf4', p => { p.moveTo(x, 7.5 + Math.sin(i / 5 * Math.PI) * 3); p.lineTo(x + 2.6, 12 + Math.sin(i / 5 * Math.PI) * 4); p.lineTo(x + 5, 7.5 + Math.sin((i + 1) / 5 * Math.PI) * 3); p.closePath(); }); }
    path(c, null, p => { p.moveTo(-41, -14); p.lineTo(-26, -9); }, look.brow, 2.2);
  } else {
    path(c, null, p => { p.moveTo(-43, 8); p.quadraticCurveTo(-29, 18, -13, 7); }, look.mouth, 2.1);
    ellipse(c, -38, 3, 5, 2.8, '#d89e9999');
    path(c, null, p => { p.moveTo(-40, -13); p.quadraticCurveTo(-32, -18, -23, -13); }, look.brow, 1.2);
  }
  for (let i = 0; i < 3; i++) path(c, null, p => { p.moveTo(-7 + i * 5, -5); p.quadraticCurveTo(-11 + i * 5, 1, -7 + i * 5, 7); }, look.gill, 1.4);
  c.restore();
}
function greatWhite(c, item, water, t) {
  if (item.phase !== 'stalk') return shark(c, item, t, WHITE_LOOK);
  // First only the tall fin cuts the surface at the left edge, with a little wake.
  const x = item.x + 110, bob = Math.sin(t * 3) * 1.5;
  path(c, null, p => { p.moveTo(x - 46, water + 2); p.quadraticCurveTo(x - 22, water - 4, x + 4, water + 1); }, '#ffffffaa', 2);
  path(c, WHITE_LOOK.fin, p => { p.moveTo(x - 30, water + 3 + bob); p.quadraticCurveTo(x - 16, water - 38 + bob, x + 2, water - 46 + bob); p.quadraticCurveTo(x - 2, water - 18 + bob, x + 6, water + 3 + bob); p.closePath(); }, WHITE_LOOK.edge, 1.3);
}
function turtle(c, item, t) {
  c.save(); c.translate(item.x, item.y);
  const tuck = Math.min(1, (item.reaction || 0) * 3);
  const paddle = Math.sin(t * 3 + item.baseY) * .35 * (1 - tuck);
  ellipse(c, 24, -18, 22, 8, '#76aa8d', -.5 - paddle);
  ellipse(c, -14, -21, 24, 9, '#87b895', .6 + paddle);
  ellipse(c, 29, 18, 22, 8, '#72a68a', .5 + paddle);
  ellipse(c, 1, 2, 37, 27, '#cbd5a0');
  ellipse(c, 2, -3, 34, 25, gradient(c, -28, 24, '#a7c982', '#658e72'));
  path(c, '#8eb478', p => { p.moveTo(-11, -17); p.lineTo(9, -20); p.lineTo(21, -3); p.lineTo(9, 12); p.lineTo(-10, 9); p.lineTo(-19, -4); p.closePath(); }, '#d8dfa2', 1.8);
  for (const [x, y, ex, ey] of [[-11,-17,-18,-25],[9,-20,17,-25],[21,-3,35,-3],[9,12,17,20],[-10,9,-20,16],[-19,-4,-31,-7]]) path(c, null, p => { p.moveTo(x,y); p.lineTo(ex,ey); }, '#d3dfa6', 1.5);
  c.save(); c.translate(tuck * 16, 0);
  ellipse(c, -37, -3, 19, 15, gradient(c, -17, 14, '#acd0a5', '#7fac8d'), -.1);
  cuteEye(c, -43, -7, 5.6, tuck > .5 ? 0 : blink(t, item.baseY * .02 + 1), '#2b5050');
  ellipse(c, -44, 3, 5, 3, '#eab6a0');
  path(c, null, p => { p.moveTo(-54, 1); p.quadraticCurveTo(-50, 6, -46, 3); }, '#557e6d', 1.4);
  path(c, null, p => { p.moveTo(-51, -13); p.quadraticCurveTo(-43, -17, -35, -13); }, '#69947d', 1);
  c.restore();
  ellipse(c, -13, 21, 25, 10, '#93bd96', -.6 - paddle);
  c.restore();
}
function puffer(c, item, t) {
  const r = pufferRadius(item), inflated = item.phase === 'puffed';
  const startled = ['startle', 'inflate'].includes(item.phase);
  c.save(); c.translate(item.x, item.y);
  ellipse(c, r - 2, 2, 12, 7, '#d7a665', Math.sin(t * 6) * .2);
  ellipse(c, 0, 0, r - (inflated ? 5 : 0), r - (inflated ? 5 : 0), gradient(c, -r, r, '#f3d997', '#d4a566'));
  ellipse(c, -5, r * .27, r * .66, r * .48, '#fff0c4');
  if (inflated) for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    path(c, '#c48f58', p => { p.moveTo(Math.cos(a - .09) * (r - 7), Math.sin(a - .09) * (r - 7)); p.lineTo(Math.cos(a) * r, Math.sin(a) * r); p.lineTo(Math.cos(a + .09) * (r - 7), Math.sin(a + .09) * (r - 7)); p.closePath(); });
  }
  for (const dx of [-10, 4]) {
    cuteEye(c, dx, -7, startled ? 7 : 5, item.phase === 'rest' ? 0 : startled ? 1 : blink(t, item.x * .001 + 2), '#4a6158');
  }
  ellipse(c, -18, 3, 5, 3, '#e7ab91');
  if (startled) ellipse(c, -5, 5, 3, 5, '#956e51');
  else path(c, null, p => { p.moveTo(-10, 5); p.quadraticCurveTo(-5, 10, 0, 5); }, '#956e51', 1.5);
  c.restore();
}

function boat(c, item, water, t, sleepy = false) {
  const [coat, shade, hull, hullShade] = [
    ['#efd08a','#dca956','#d48b64','#aa674e'],
    ['#a6c9bd','#6a9e94','#91b8cb','#567f99'],
    ['#e9aaa0','#c77f78','#b5c797','#7d956d'],
    ['#b9b4d5','#8d88b1','#e4b779','#b78a54'],
  ][item.look ?? 0];
  const age = item.cast, windup = clamp(age / .85, 0, 1), throwing = clamp((age - .85) / .6, 0, 1);
  const hauling = age >= 2.55, resting = age < 0 || age >= 3.25;
  const bob = Math.sin(t * 2) * 2;
  const angry = item.reaction > 0 && item.reactionKind === 'angry';
  const hand = item.reaction > 0 ? { x: (angry ? 70 : 16) + (angry ? Math.sin(t * 28) * 11 : 0), y: -78 } : resting ? { x: 17, y: -38 } : hauling ? { x: -10 + Math.sin(t * 12) * 7, y: -44 } : { x: 16 + windup * 19 - throwing * 65, y: -40 - windup * 45 + throwing * 36 };
  const net = netShape(item);
  if (age >= 0 && age < 1.45) {
    c.save(); c.setLineDash([5, 6]); c.strokeStyle = '#fff1b4'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(item.x - 70, water + 5, 51, 8, 0, 0, TAU); c.stroke(); c.restore();
  }
  if (net) {
    // The same outline defines the collision: no invisible rectangle around the mesh.
    const outline = () => { c.beginPath(); net.points.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.closePath(); };
    c.save(); outline(); c.fillStyle = '#e8b66a30'; c.fill(); c.clip();
    c.strokeStyle = '#ffe2a7bd'; c.lineWidth = 1.15;
    for (let i = -12; i < 22; i++) {
      const y = net.y + i * 16;
      path(c, null, p => { p.moveTo(net.x - net.width - 5, y); p.quadraticCurveTo(net.x, y + net.width * .55 + 10, net.x + net.width + 5, y + net.width * 1.2); }, '#ffe3adbb', 1.25);
      path(c, null, p => { p.moveTo(net.x + net.width + 5, y); p.quadraticCurveTo(net.x, y + net.width * .55 + 10, net.x - net.width - 5, y + net.width * 1.2); }, '#d7a365bb', 1.25);
    }
    c.restore(); outline(); c.strokeStyle = '#d29a56'; c.lineWidth = 2.5; c.stroke();
    net.points.forEach((p, i) => { if (i % 2 === 0) ellipse(c, p.x, p.y, 3, 4, '#a7835c'); });
    path(c, null, p => { p.moveTo(item.x + hand.x, water + hand.y + bob); p.quadraticCurveTo(item.x + 20, net.y - 16, net.x + net.width * .8, net.y); }, '#eacb92', 1.6);
    if (net.phase !== 'flight') {
      ellipse(c, net.x - net.width * .82, net.y, 5, 3.3, '#f2c883');
      ellipse(c, net.x + net.width * .82, net.y, 5, 3.3, '#f2c883');
      if (net.phase === 'haul') fish(c, net.x, net.y + net.depth * .45, .28, false, t);
    }
  }
  c.save(); c.translate(item.x, water + bob);
  c.rotate(Math.sin(t * 1.4) * .025 + (age >= 0 && age < 1.45 ? Math.sin(windup * Math.PI) * .055 - Math.sin(throwing * Math.PI) * .07 : 0));
  ellipse(c, 0, 24, 73, 7, '#28697120');
  // Bow, cabin-side planks and an open deck give the little boat depth.
  path(c, '#815445', p => { p.moveTo(-77, -17); p.quadraticCurveTo(0, -6, 77, -17); p.quadraticCurveTo(63, 24, 29, 28); p.lineTo(-30, 28); p.quadraticCurveTo(-63, 23, -77, -17); });
  path(c, gradient(c, -15, 26, hull, hullShade), p => { p.moveTo(-71, -9); p.quadraticCurveTo(0, 0, 71, -9); p.quadraticCurveTo(57, 21, 25, 23); p.lineTo(-26, 23); p.quadraticCurveTo(-55, 21, -71, -9); });
  for (const y of [3, 13]) path(c, null, p => { p.moveTo(-61 + y, y); p.quadraticCurveTo(0, y + 5, 61 - y, y); }, '#88574599', 1.2);
  for (const x of [-40, -8, 31]) { path(c, null, p => { p.moveTo(x, 1); p.lineTo(x + 3, 20); }, '#9b614ccc', 1); ellipse(c, x, 6, 1.1, 1.1, '#f7cba0'); }
  path(c, null, p => { p.moveTo(-75, -16); p.quadraticCurveTo(0, -4, 75, -16); }, '#f4c492', 5);
  // Bucket, a glimpse of the catch, and a coiled rope on deck.
  path(c, '#73948e', p => { p.moveTo(32, -35); p.lineTo(53, -35); p.lineTo(50, -12); p.lineTo(35, -12); p.closePath(); });
  ellipse(c, 42, -35, 11, 3.5, '#426e70');
  path(c, null, p => { p.moveTo(33, -31); p.quadraticCurveTo(42, -53, 52, -31); }, '#c5c9af', 1.5);
  fish(c, 43, -34, .35, false, t);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(59, -15 - i * 2, 10 - i, 3, 0, 0, TAU); c.strokeStyle = '#e3bf89'; c.lineWidth = 1.8; c.stroke(); }
  // A cream life ring with painted coral bands.
  ellipse(c, 30, 11, 13, 13, '#f8e9c6'); ellipse(c, 30, 11, 7, 7, '#a8644d');
  c.strokeStyle = '#dc8660'; c.lineWidth = 5;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.beginPath(); c.arc(30, 11, 10, a - .2, a + .2); c.stroke(); }
  c.fillStyle = '#ffebc3'; c.font = "bold 7px 'Trebuchet MS'"; c.textAlign = 'center'; c.fillText('LÜTTE LOTTE', -24, 14);
  // Pip gets an expressive opponent: raincoat, rosy nose and a very serious moustache.
  c.save(); c.translate(-7, -17); c.rotate(hauling && !item.hit ? Math.sin(t * 12) * .06 : -windup * (1 - throwing) * .08);
  // Legs in dark trousers and yellow rubber boots, standing on the deck below the coat.
  for (const lx of [-13, 8]) {
    path(c, '#4f5d66', p => { p.moveTo(lx - 6, -2); p.lineTo(lx + 6, -2); p.lineTo(lx + 5, 7); p.lineTo(lx - 5, 7); p.closePath(); }, '#3c474e', .8);
    path(c, '#f2c14e', p => { p.moveTo(lx - 6, 6); p.lineTo(lx + 5, 6); p.lineTo(lx + 6, 13); p.quadraticCurveTo(lx + 11, 13, lx + 11, 16); p.lineTo(lx - 6, 16); p.closePath(); }, '#c99a35', .9);
  }
  path(c, gradient(c, -45, 2, coat, shade), p => { p.moveTo(-22, 0); p.lineTo(-20, -32); p.quadraticCurveTo(-18, -48, -1, -47); p.quadraticCurveTo(19, -48, 23, -30); p.lineTo(25, 0); p.closePath(); }, shade, 1);
  path(c, null, p => { p.moveTo(1, -36); p.lineTo(3, -1); }, '#fff0bb', 1.5);
  for (let i = 0; i < 3; i++) ellipse(c, 5, -25 + i * 9, 1.5, 1.5, '#a87944');
  path(c, '#c66f5c', p => { p.moveTo(-11, -37); p.lineTo(1, -30); p.lineTo(12, -39); p.lineTo(3, -35); p.lineTo(5, -25); p.closePath(); }, '#99594d', .7);
  ellipse(c, -2, -55, 17, 20, '#edc3a0');
  ellipse(c, -15, -49, 6, 4, '#e7a58c'); ellipse(c, 11, -49, 4, 3, '#e7a58c');
  path(c, shade, p => { p.moveTo(-24, -64); p.lineTo(-17, -82); p.quadraticCurveTo(0, -89, 15, -79); p.lineTo(22, -63); p.closePath(); });
  path(c, '#8c7451', p => { p.moveTo(-20, -69); p.quadraticCurveTo(0, -62, 19, -68); p.lineTo(21, -63); p.quadraticCurveTo(-1, -56, -23, -63); p.closePath(); });
  path(c, null, p => { p.moveTo(-26, -63); p.quadraticCurveTo(-2, -57, 23, -63); }, coat, 6);
  const annoyed = age >= 0 || angry;
  path(c, null, p => { p.moveTo(-15, -57 - (annoyed ? 2 : 0)); p.lineTo(-8, -55); p.moveTo(0, -55); p.lineTo(7, -57 - (annoyed ? 2 : 0)); }, '#725c48', 2.3);
  const dozing = sleepy && age < 0 && !(item.reaction > 0);
  for (const ex of [-11, 3]) dozing ? happyEye(c, ex, -51, 2.6, '#3e514a') : cuteEye(c, ex, -52, 3.2, annoyed ? 1 : blink(t, item.x * .003 + ex), '#3e514a');
  ellipse(c, -5, -45, 6, 4.5, '#dfaa89');
  path(c, '#fff1d8', p => { p.moveTo(-5, -43); p.quadraticCurveTo(-16, -47, -22, -37); p.quadraticCurveTo(-13, -31, -5, -39); p.quadraticCurveTo(6, -31, 15, -39); p.quadraticCurveTo(4, -47, -5, -43); });
  ellipse(c, -4, -32, hauling ? 4 : 2, hauling ? 3 : 1, '#9b7157'); c.restore();
  path(c, null, p => { p.moveTo(8, -48); p.quadraticCurveTo(24, -40, hand.x, hand.y); }, shade, 9);
  ellipse(c, hand.x, hand.y, 5.5, 5, '#efc7a1');
  if (angry) for (let i = -1; i <= 1; i++) ellipse(c, hand.x + i * 4, hand.y - 4, 2.5, 3, '#efc7a1');
  path(c, null, p => { p.moveTo(-25, -43); p.quadraticCurveTo(-38, -26, -16, -24); }, coat, 8);
  ellipse(c, -16, -24, 5, 4, '#efc7a1');
  if (!net && !angry) {
    for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(hand.x + 2, hand.y + 8 + i * 3, 10 + i, 4, -.2, 0, TAU); c.strokeStyle = '#dfc38f'; c.lineWidth = 1.5; c.stroke(); }
  }
  if (dozing) for (let i = 0; i < 3; i++) {
    const z = (t * .45 + i / 3) % 1;
    c.globalAlpha = Math.sin(z * Math.PI); c.fillStyle = '#5f7a8c'; c.font = `bold ${7 + z * 7}px sans-serif`; c.fillText('z', 14 + z * 16 + Math.sin(z * 6) * 3, -90 - z * 30);
  }
  c.globalAlpha = 1;
  c.restore();
}
// A mangrove tree: leafy crown above, a tangle of arching stilt roots down to the dive gap.
// Everything stays inside its terrain block except a few forgiving leaves.
function mangrove(c, item, water, t, night) {
  const x = item.x, b = terrainBlocks(item)[0], bottom = b.y + b.height;
  // Roots fade into the water with depth, so the gap below reads as open.
  const root = c.createLinearGradient(0, water, 0, bottom);
  root.addColorStop(0, night ? '#4e4a44' : '#7a6450'); root.addColorStop(1, night ? '#2e4a50' : '#4f6f5f');
  // A murky tangle behind the roots shows the whole curtain is solid.
  const murk = c.createLinearGradient(0, water, 0, bottom);
  murk.addColorStop(0, night ? '#1a3a4066' : '#3d5e4a55'); murk.addColorStop(1, night ? '#1a3a4022' : '#3d5e4a22');
  path(c, murk, p => { p.moveTo(x - 30, water); p.quadraticCurveTo(x - 72, water + 40, x - 68, bottom - 30); p.quadraticCurveTo(x - 66, bottom, x - 40, bottom - 4); p.quadraticCurveTo(x, bottom + 4, x + 40, bottom - 4); p.quadraticCurveTo(x + 66, bottom, x + 68, bottom - 30); p.quadraticCurveTo(x + 72, water + 40, x + 30, water); p.closePath(); });
  for (let i = 0; i < 10; i++) {
    const a = x - 60 + i * 13, y1 = water + 30 + (i * 29) % 70;
    path(c, null, p => { p.moveTo(a, y1); p.quadraticCurveTo(a + 18, y1 + 30, a + 4 + (i % 3) * 6, y1 + 60); }, night ? '#2c4a4a88' : '#5e6a5288', 1.6);
  }
  const arches = [[-8, -62, 1], [-4, -40, .78], [0, -18, .9], [3, 14, .72], [6, 38, 1], [9, 62, .86], [-2, -52, .5], [4, 50, .55]];
  arches.forEach(([from, to, depth], i) => {
    const tipY = water + (bottom - water) * depth - 4, sway = Math.sin(t * .7 + i * 1.3) * 1.5, out = x + to + sway;
    path(c, null, p => { p.moveTo(x + from, water - 6); p.bezierCurveTo(x + from + (to - from) * .2, water + 30, out - Math.sign(to) * 6, water + 40, out, tipY); }, root, i < 6 ? 5 : 3.2);
    ellipse(c, out, tipY, i < 6 ? 4.5 : 3, 3, night ? '#3c5a5a' : '#6d7f68');
  });
  for (let i = 0; i < 4; i++) ellipse(c, x - 45 + i * 30, water + 60 + (i % 2) * 50, 3.5, 2.5, '#e6dcc055');
  // Prop roots above the surface.
  for (let i = 0; i < 5; i++) {
    const u = i / 4, footX = x - 60 + u * 120;
    path(c, null, p => { p.moveTo(x + (u - .5) * 16, 312); p.quadraticCurveTo(footX - Math.sign(u - .5) * 4, 314, footX, water + 3); }, night ? '#5a4a3e' : '#8b6b52', 4.5);
  }
  path(c, night ? '#5a4a3e' : '#8b6b52', p => { p.moveTo(x - 8, water - 10); p.quadraticCurveTo(x - 4, 320, x - 6, 296); p.lineTo(x + 6, 296); p.quadraticCurveTo(x + 4, 320, x + 8, water - 10); p.closePath(); }, '#6e5240', 1);
  // Crown: layered clusters, shadow below and warm evening light on top.
  const crown = [[-62, 294, 22], [-44, 276, 26], [-18, 262, 28], [12, 256, 29], [40, 268, 27], [63, 288, 22], [-30, 298, 24], [4, 292, 27], [36, 298, 24], [-6, 244, 20], [26, 240, 17]];
  for (const [dx, y, r] of crown) ellipse(c, x + dx, y + 6, r, r * .8, night ? '#24483c' : '#3f7a52');
  for (const [dx, y, r] of crown) ellipse(c, x + dx, y, r * .94, r * .74, night ? '#356452' : '#5c9c5e');
  for (const [dx, y, r] of crown.filter(([, y]) => y < 280)) ellipse(c, x + dx + r * .25, y - r * .32, r * .5, r * .3, night ? '#4c7a6455' : '#a8cf7aaa');
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4, lx = x + Math.cos(a) * (40 + (i % 3) * 14), ly = 274 + Math.sin(a) * 26;
    ellipse(c, lx, ly, 5, 2.4, night ? '#6a9a7a55' : '#c9e39a88', a);
  }
  // Little residents: barnacles and a snail on the prop roots, a crab clinging to a root below.
  for (let i = 0; i < 5; i++) { ellipse(c, x - 48 + i * 24, water - 4 - (i % 2) * 6, 2.6, 2.1, '#efe6d0'); ellipse(c, x - 48 + i * 24, water - 4.5 - (i % 2) * 6, 1, .8, '#8a8f86'); }
  ellipse(c, x + 30, 336, 5.5, 4.5, '#e7b07a'); path(c, null, p => p.arc(x + 30, 336, 2.6, 0, Math.PI * 1.5), '#b97a4a', 1.2);
  ellipse(c, x + 25, 340, 5, 2.2, '#cfc0a0'); path(c, null, p => { p.moveTo(x + 22, 339); p.lineTo(x + 20, 334); }, '#cfc0a0', 1); ellipse(c, x + 20, 333.5, 1.1, 1.1, '#3a2a20');
  const crabY = water + 92 + Math.sin(t * .9) * 3;
  ellipse(c, x - 33, crabY, 9, 6, '#f08a70');
  for (const dx of [-3, 3]) { path(c, null, p => { p.moveTo(x - 33 + dx, crabY - 4); p.lineTo(x - 33 + dx, crabY - 9); }, '#d9705c', 1.6); cuteEye(c, x - 33 + dx, crabY - 10, 2, blink(t, x * .03 + dx), '#2b3b3b'); }
  for (const side of [-1, 1]) path(c, '#f08a70', p => p.arc(x - 33 + side * 11, crabY - 3, 3.5, 0, TAU));
  // Fireflies blink in the crown as the evening deepens.
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const fx = x + Math.cos(i * 2.3 + t * .3) * (30 + (i % 3) * 18), fy = 266 + Math.sin(i * 1.7 + t * .4) * 26, on = Math.max(0, Math.sin(t * 1.7 + i * 2.6));
    if (on < .05) continue;
    ellipse(c, fx, fy, 8, 8, `rgba(255,232,120,${.2 * on})`); ellipse(c, fx, fy, 1.8, 1.8, `rgba(255,248,200,${on})`);
  }
  c.globalCompositeOperation = 'source-over';
  // A kingfisher keeps watch from the crown.
  c.save(); c.translate(x + 22, 232);
  ellipse(c, 0, 0, 8, 7, '#3f8fb8'); ellipse(c, 1, 3, 6, 4, '#f2a35e'); ellipse(c, -4, -6, 6, 5.5, '#4aa0c8');
  path(c, '#2f3c44', p => { p.moveTo(-9, -7); p.lineTo(-20, -5); p.lineTo(-9, -4); p.closePath(); });
  path(c, '#3f8fb8', p => { p.moveTo(6, 1); p.lineTo(15, 6); p.lineTo(6, 5); p.closePath(); });
  cuteEye(c, -5, -7, 2.3, blink(t, x * .01), '#1d2a30'); ellipse(c, -2, -3, 1.8, 1.1, '#ff8f9a66');
  c.restore();
}
// A friendly harbour buoy: striped tower with a sleepy face and a blinking lamp, a round float
// below the surface with weed and barnacles, and a chain to the seabed. Inside the collision box.
function buoy(c, item, water, t, night) {
  const x = item.x, bob = Math.sin(t * 1.5 + x * .01) * 1.5;
  // Chain to the seabed.
  for (let y = 468; y < 830; y += 13) ellipse(c, x + Math.sin(y * .02 + t * .6) * 3, y, 3.4, 5.5, night ? '#3d5560aa' : '#5e7a7a99');
  c.save(); c.translate(0, bob);
  // Float below the surface.
  path(c, gradient(c, water - 10, 462, '#e98a78', '#a9575a'), p => { p.moveTo(x - 30, water - 8); p.quadraticCurveTo(x - 33, 452, x, 460); p.quadraticCurveTo(x + 33, 452, x + 30, water - 8); p.closePath(); }, '#7f4a4f', 2);
  path(c, '#fff1d488', p => p.ellipse(x, water + 34, 30, 9, 0, 0, TAU));
  for (let i = 0; i < 6; i++) { const bx = x - 20 + (i * 37) % 40, by = water + 55 + (i * 23) % 40; ellipse(c, bx, by, 3.2, 2.6, '#efe6d0'); ellipse(c, bx, by - .5, 1.2, 1, '#8a8f86'); }
  for (const side of [-1, 1]) {
    const swing = Math.sin(t * 1.4 + side) * 5;
    path(c, null, p => { p.moveTo(x + side * 14, 452); p.quadraticCurveTo(x + side * (20 + swing), 470, x + side * (12 + swing * 1.5), 492); }, '#6fae86', 4);
  }
  // Striped tower above the surface.
  const tower = p => p.roundRect(x - 21, 268, 42, water - 262, 12);
  path(c, gradient(c, 268, water, '#f28f7a', '#d0645e'), tower, '#8c4d4f', 2);
  c.save(); c.beginPath(); tower(c); c.clip();
  for (const y of [288, 330]) path(c, '#fff3da', p => p.rect(x - 22, y, 44, 18));
  ellipse(c, x - 10, 300, 6, 40, '#ffffff33');
  c.restore();
  // Sleepy-happy face on the upper cream stripe.
  happyEye(c, x - 7, 296, 2.6, '#5a3b3b'); happyEye(c, x + 7, 296, 2.6, '#5a3b3b');
  ellipse(c, x - 13, 301, 3, 1.8, '#ff9aa277'); ellipse(c, x + 13, 301, 3, 1.8, '#ff9aa277');
  path(c, null, p => { p.moveTo(x - 2.5, 301); p.quadraticCurveTo(x, 303.5, x + 2.5, 301); }, '#5a3b3b', 1.4);
  // Lamp with a soft blink.
  path(c, '#5b6f72', p => p.roundRect(x - 12, 258, 24, 12, 4));
  const glow = .55 + Math.max(0, Math.sin(t * 2.2)) * .45;
  c.globalCompositeOperation = 'lighter'; ellipse(c, x, 250, 22, 22, `rgba(255,214,120,${.18 * glow})`); c.globalCompositeOperation = 'source-over';
  path(c, `rgba(255,236,170,${.7 + glow * .3})`, p => p.roundRect(x - 8, 244, 16, 15, 7), '#c99a52', 1.5);
  ellipse(c, x - 3, 249, 2.5, 3, '#ffffffcc');
  c.restore();
  ellipse(c, x, water + 4, 44, 7, '#e9f5df66');
  path(c, null, p => { p.moveTo(x - 40, water + 2); p.quadraticCurveTo(x, water + 10 + Math.sin(t * 2) * 2, x + 40, water + 2); }, '#ffffffaa', 2);
}
// Coral in the same soft-stone style as the rocks, but pink with a polyp cap;
// an anemone with a peeking clownfish. The collision polygon stays the coral's silhouette.
function coral(c, item, water, t, night) {
  const b = terrainBlocks(item)[0], x = item.x;
  rock(c, b, item, 0, water, t, night, true);
  const ax = x + 50, ay = b.y + 120;
  for (let k = 0; k < 9; k++) { const a = -Math.PI * .95 + k * Math.PI * .11, sway = Math.sin(t * 2 + k) * .12; path(c, null, p => { p.moveTo(ax, ay); p.quadraticCurveTo(ax + Math.cos(a + sway) * 14, ay + Math.sin(a + sway) * 14, ax + Math.cos(a + sway * 2) * 24, ay + Math.sin(a + sway * 2) * 22); }, '#ffb3d1', 4); }
  const peek = Math.max(0, Math.sin(t * .9)) * 7;
  c.save(); c.translate(ax - 4, ay - 14 - peek);
  ellipse(c, 0, 0, 9, 6, '#ff8a3d'); path(c, '#ffffff', p => p.rect(-3, -6, 3, 12)); path(c, '#ff8a3d', p => { p.moveTo(8, 0); p.lineTo(14, -5); p.lineTo(14, 5); p.closePath(); });
  cuteEye(c, -4, -1, 2.3, blink(t, x * .02), '#2b2b2b');
  c.restore();
  ellipse(c, ax, ay + 4, 12, 5, '#d98aaa');
}
// Every stage has its own spot for the nest: a grassy islet, a harbour piling,
// a mangrove crown (where real brown pelicans nest) or a moonlit rock.
function nestBase(c, x, water, stage, t) {
  if (STAGES[stage].id === 'harbor') {
    for (const [dx, h] of [[-38, 30], [-6, 40], [26, 34]]) {
      path(c, gradient(c, water - h, water + 60, '#a8805c', '#5e4a3a'), p => p.roundRect(x + dx, water - h, 18, h + 60, 4), '#5a4434', 1.2);
      ellipse(c, x + dx + 9, water - h, 9, 3, '#c49a72');
      path(c, null, p => { p.moveTo(x + dx, water - h + 10); p.lineTo(x + dx + 18, water - h + 14); }, '#e8d9b0', 2);
    }
    path(c, null, p => { p.moveTo(x - 30, water - 18); p.quadraticCurveTo(x - 10, water - 8, x + 34, water - 16); }, '#e8d9b0', 2.2);
    ellipse(c, x + 52, water - 2, 10, 4, '#e9f5df66');
  } else if (STAGES[stage].id === 'lagoon') {
    for (let i = 0; i < 5; i++) { const u = i / 4, foot = x - 58 + u * 116; path(c, null, p => { p.moveTo(x + (u - .5) * 20, water - 20); p.quadraticCurveTo(foot, water - 18, foot, water + 6); }, '#8b6b52', 4); }
    for (const [dx, dy, r] of [[-48, -22, 22], [-22, -34, 26], [10, -36, 28], [40, -26, 23], [-4, -18, 26]]) ellipse(c, x + dx, water + dy, r, r * .62, '#4f8a5a');
    for (const [dx, dy, r] of [[-46, -26, 18], [-20, -38, 22], [12, -40, 23], [42, -30, 19]]) ellipse(c, x + dx, water + dy, r, r * .55, '#69a764');
    for (const [dx, dy] of [[-28, -46], [16, -48], [44, -36]]) ellipse(c, x + dx, water + dy, 8, 3, '#f3d08a88');
  } else if (STAGES[stage].id === 'reef') {
    path(c, gradient(c, water - 40, water + 10, '#4a6a8c', '#22405e'), p => { p.moveTo(x - 64, water + 8); p.quadraticCurveTo(x - 58, water - 30, x - 26, water - 38); p.quadraticCurveTo(x + 6, water - 50, x + 36, water - 36); p.quadraticCurveTo(x + 60, water - 24, x + 66, water + 8); p.closePath(); }, '#1b3450', 1.2);
    ellipse(c, x - 20, water - 40, 18, 4, '#9fb8e044');
    for (const [dx, col] of [[-50, '#e48aa8'], [48, '#f2b06a']]) for (let k = -1; k <= 1; k++) path(c, null, p => { p.moveTo(x + dx, water - 2); p.quadraticCurveTo(x + dx + k * 8, water - 12, x + dx + k * 6, water - 20 + Math.abs(k) * 4); }, col, 3);
  } else {
    path(c, '#829c83', p => { p.moveTo(x - 62, water + 7); p.quadraticCurveTo(x - 53, water - 22, x - 33, water - 34); p.quadraticCurveTo(x, water - 48, x + 32, water - 36); p.quadraticCurveTo(x + 53, water - 20, x + 65, water + 7); p.closePath(); }, '#607a69', 1.2);
  }
}
/** @param {Readonly<import('./game.js').GameState>} game Simulation state; drawing must not mutate it. */
// Rounded boulders inside the shared collision silhouette: smooth outline, stacked stones,
// a mossy cap, swaying weed and a few small residents. Purely visual; collisions use the polygon.
const hashOf = i => { const v = Math.sin(i * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
function rock(c, b, item, index, water, t, night, pink = false) {
  const pts = b.points, mid = (a, z) => ({ x: (a.x + z.x) / 2, y: (a.y + z.y) / 2 });
  const outline = p => {
    const start = mid(pts[pts.length - 1], pts[0]); p.moveTo(start.x, start.y);
    pts.forEach((point, i) => { const next = mid(point, pts[(i + 1) % pts.length]); p.quadraticCurveTo(point.x, point.y, next.x, next.y); });
    p.closePath();
  };
  const seed = item.kind === 'island' ? 3 : item.kind === 'coral' ? 11 : 7 + index * 5;
  c.save(); c.lineJoin = 'round';
  path(c, gradient(c, b.y, b.y + b.height, pink ? (night ? '#9a7aa0' : '#e8b4aa') : night ? '#6f9a92' : '#a3c3a4', pink ? (night ? '#4e4466' : '#9b7890') : night ? '#2e5560' : '#4d7f76'), outline);
  c.beginPath(); outline(c); c.clip();
  // Stacked round stones, each with a lit top and a soft shadow.
  const rows = Math.max(1, Math.round(b.height / 60)), rowH = b.height / rows;
  for (let r = 0; r < rows; r++) {
    const cols = Math.max(1, Math.round(b.width / (50 + hashOf(seed + r) * 30))), colW = b.width / cols, shift = (hashOf(seed * 3 + r) - .5) * colW;
    for (let k = -1; k <= cols; k++) {
      const h = hashOf(seed * 31 + r * 7 + k), h2 = hashOf(h * 99), cx = b.x + shift + (k + .5) * colW + (h - .5) * 22, cy = b.y + (r + .55) * rowH + (h2 - .5) * 14;
      const rx = colW * (.42 + h * .3), ry = rowH * (.42 + h2 * .25);
      const tone = (pink ? ['#f0b8b0', '#e6a8b8', '#f3c4a8', '#d9a0b4'] : ['#9dbf9f', '#8db497', '#a9c7a2', '#86ad95'])[Math.floor(h * 4)];
      ellipse(c, cx, cy + 3, rx, ry, night ? '#24485233' : '#3f6f6a40');
      ellipse(c, cx, cy, rx * .94, ry * .9, night ? (pink ? '#8a6f99' : '#5f8d88') : tone);
      ellipse(c, cx - rx * .25, cy - ry * .38, rx * .45, ry * .26, night ? '#86aaa333' : '#e6eccb55', -.2);
    }
  }
  // Depth shading: stones darken where light no longer reaches.
  c.fillStyle = gradient(c, Math.max(b.y, water), b.y + b.height, '#1f4d5800', night ? '#0f2c4066' : '#24586060'); c.fillRect(b.x - 5, Math.max(b.y, water), b.width + 10, b.height);
  c.restore();
  path(c, null, outline, pink ? (night ? '#3e3858' : '#8c6a7f') : night ? '#2c5260' : '#3e6d68', 2.5);
  // Mossy cap with a sandy rim; underwater caps get pink weed instead of grass.
  const top = b.y, wet = top > water;
  for (let i = 0; i < Math.round(b.width / 16); i++) {
    const x = b.x + 8 + i * (b.width - 16) / Math.max(1, Math.round(b.width / 16) - 1);
    ellipse(c, x, top + 5 + Math.sin(i * 1.7) * 2, 11, 6, pink ? (i % 2 ? '#ffb7c6' : '#ffc79e') : wet ? (i % 2 ? '#8fbf8a' : '#7cae86') : i % 2 ? '#9ccc8c' : '#86bb85');
  }
  if (wet && !pink) for (let i = 0; i < 4; i++) {
    const x = b.x + b.width * (.18 + i * .22), sway = Math.sin(t * 1.6 + i + index) * 5;
    path(c, null, p => { p.moveTo(x, top + 2); p.quadraticCurveTo(x + sway, top - 14, x + sway * 1.6 - 2, top - 26 - (i % 2) * 8); }, i % 2 ? '#e79bb0' : '#83c08f', 4);
  }
  // Weed trailing from the sides below the surface.
  for (const side of [0, 1]) {
    const x = side ? b.x + b.width - 2 : b.x + 2, from = Math.max(top + 30, water + 20);
    for (let k = 0; k < 2; k++) {
      const y0 = from + k * 70 + hashOf(seed + side * 3 + k) * 30;
      if (y0 > b.y + b.height - 40) continue;
      const swing = Math.sin(t * 1.3 + k + side * 2 + index) * 6, dir = side ? 1 : -1;
      path(c, null, p => { p.moveTo(x, y0); p.quadraticCurveTo(x + dir * (10 + swing), y0 + 18, x + dir * (4 + swing * 1.4), y0 + 40); }, '#6fae86', 4);
      ellipse(c, x + dir * (8 + swing * .9), y0 + 22, 5, 2.6, '#86c19a', dir * .6);
    }
  }
  // Small residents: a starfish, a shell, barnacles and, on big rocks, a peeking crab.
  const below = y => Math.max(y, water + 30);
  const sx = b.x + b.width * (.25 + hashOf(seed) * .5), sy = below(b.y + b.height * .45);
  if (sy < b.y + b.height - 25) star(c, sx, sy, 9, night ? '#ff9fb8' : '#ffad8f', t * .2 + seed);
  if (sy < b.y + b.height - 25) { ellipse(c, sx - 2, sy - 2, 1.5, 1.5, '#5a3b3b'); ellipse(c, sx + 2.5, sy - 2, 1.5, 1.5, '#5a3b3b'); }
  for (let i = 0; i < 5; i++) { const bx = b.x + 10 + hashOf(seed + i * 3) * (b.width - 20), by = below(b.y + 20 + hashOf(seed + i * 5) * (b.height - 40)); if (by < b.y + b.height - 12) { ellipse(c, bx, by, 3.2, 2.6, '#e8e3cf'); ellipse(c, bx, by - .5, 1.2, 1, '#7d8f86'); } }
  if (b.height > 200) {
    const cx = b.x + b.width * .7, cy = below(b.y + b.height * .62), peek = Math.max(0, Math.sin(t * .8 + seed)) * 5;
    ellipse(c, cx, cy + 6, 16, 9, night ? '#1d3d47' : '#2f5b58');
    ellipse(c, cx, cy + 4 - peek, 10, 6, '#f08a70');
    for (const dx of [-4, 4]) { path(c, null, p => { p.moveTo(cx + dx, cy - peek); p.lineTo(cx + dx, cy - 6 - peek); }, '#d9705c', 2); cuteEye(c, cx + dx, cy - 8 - peek, 2.6, blink(t, seed + dx), '#2b3b3b'); }
  }
}

export function drawWorld(c, game, mode, t, outfit, effects, reducedMotion = false, fx = null) {
  const menu = mode === 'menu';
  const water = menu ? 466 : WORLD.water;
  const d = menu ? (reducedMotion ? 0 : t * 12) : game.distance;
  const motion = reducedMotion ? 0 : t;
  c.clearRect(0, 0, 480, 850);
  const stage = menu ? 0 : game.stage, theme = STAGES[stage].theme, night = STAGES[stage].night;
  c.save();
  if (fx && (fx.shakeX || fx.shakeY)) { c.translate(240 + fx.shakeX, 425 + fx.shakeY); c.scale(1.03, 1.03); c.translate(-240, -425); }
  drawSky(c, stage, water, d, motion, menu ? null : game, reducedMotion, () => {
    // Clouds drift on the wind as well as with travel; the far ones are smaller and fainter.
    const drift = (x, speed, wind, span) => ((x - d * speed - motion * wind) % span + span) % span - 90;
    for (let i = 0; i < 3; i++) cloud(c, drift(60 + i * 190, .008, 2, 660), 150 + i * 23, .32 + i * .05, .4);
    cloud(c, drift(160, .025, 5, 640), 92, .95, .55); cloud(c, drift(500, .015, 4, 640), 125, .65, .55); cloud(c, drift(330, .02, 6, 640), water - 122, .45, .55);
    island(c, 24 - d * .055 % 780, water - 6, motion);
    island(c, 805 - d * .055 % 780, water - 6, motion);
    c.save(); c.translate(415, water - 1); c.scale(.5, .5); path(c, '#e5d3aa', p => { p.moveTo(-80, 0); p.quadraticCurveTo(-15, -31, 69, 0); }); palm(c, 0, -6, .8, motion); palm(c, -23, -5, .53, motion); c.restore();
    if (STAGES[stage].id === 'harbor') {
      for (let i = 0; i < 6; i++) {
        const x = ((i * 115 - d * .12) % 760 + 760) % 760 - 140;
        // Pastel harbour houses with bright roofs, round windows and bunting between them.
        const wall = ['#f2d2b6', '#c7e3d9', '#f5e4ad', '#ecc4cf', '#cfd9ee', '#e6d7bf'][i], roof = ['#d9806a', '#5fa0a6', '#e5a257', '#b77a98', '#6f93c4', '#cf7a62'][i];
        path(c, wall, p => p.roundRect(x, water - 50, 65, 47, [3, 3, 0, 0]), '#9a8f7c', 1);
        path(c, roof, p => { p.moveTo(x - 7, water - 48); p.quadraticCurveTo(x + 30, water - 82, x + 72, water - 48); p.closePath(); }, '#8c6a5c', 1);
        c.fillStyle = '#b9a58f'; c.fillRect(x + 48, water - 76, 7, 14);
        for (const wx of [17, 47]) { ellipse(c, x + wx, water - 30, 7, 7, '#ffe6a6'); path(c, null, p => { p.moveTo(x + wx - 7, water - 30); p.lineTo(x + wx + 7, water - 30); p.moveTo(x + wx, water - 37); p.lineTo(x + wx, water - 23); }, '#a58c74', 1); }
        path(c, roof, p => p.roundRect(x + 27, water - 22, 11, 19, [5, 5, 0, 0]));
        const nx = ((((i + 1) * 115 - d * .12) % 760 + 760) % 760 - 140);
        if (nx > x && nx - x < 200) {
          path(c, null, p => { p.moveTo(x + 65, water - 46); p.quadraticCurveTo((x + nx) / 2 + 32, water - 32, nx, water - 46); }, '#a58c74', 1);
          for (let k = 1; k < 5; k++) { const u = k / 5, fx = x + 65 + (nx - x - 65) * u, fy = water - 46 + Math.sin(u * Math.PI) * 9; path(c, ['#ff9fb2', '#ffd36e', '#7fc6c0', '#c9a3ff'][k % 4], p => { p.moveTo(fx - 4, fy); p.lineTo(fx + 4, fy); p.lineTo(fx, fy + 8); p.closePath(); }); }
        }
        path(c, null, p => { p.moveTo(x, water - 3); p.lineTo(x + 92, water - 3); p.moveTo(x + 8, water - 3); p.lineTo(x + 8, water + 5); }, '#8c8970', 5);
        if (!menu && game.decor?.residents.includes('cat') && i === game.decor.catHouse) roofCat(c, x + 50, water - 54, motion);
      }
    }
    if (STAGES[stage].id === 'lagoon') {
      // Far mangrove islands: soft crowns on thin stilts.
      for (let i = 0; i < 5; i++) {
        const x = ((i * 157 - d * .07) % 780 + 780) % 780 - 150, w = 30 + (i % 3) * 10;
        path(c, null, p => { for (let k = -2; k <= 2; k++) { p.moveTo(x + k * w * .12, water - 18); p.quadraticCurveTo(x + k * w * .3, water - 10, x + k * w * .36, water); } }, '#7f9c84', 1.4);
        for (const [dx, dy, r] of [[-w * .45, -24, w * .34], [-w * .1, -33, w * .42], [w * .32, -27, w * .36]]) ellipse(c, x + dx, water + dy, r, r * .55, '#86a68a');
      }
    }
    // Distant seabirds.
    for (let i = 0; i < 3; i++) { const x = ((320 + i * 47 - d * .08) % 580 + 580) % 580; const y = water - 91 + Math.sin(i * 2) * 22; path(c, null, p => { p.moveTo(x - 7, y); p.quadraticCurveTo(x - 3, y - 5, x, y); p.quadraticCurveTo(x + 4, y - 5, x + 8, y); }, '#799d93', 1.3); }
  });
  drawWater(c, stage, water, d, motion, menu ? null : game, reducedMotion);
  if (!menu) { drawWhale(c, game, motion, reducedMotion); drawDolphins(c, game, water, motion, reducedMotion); drawRare(c, game, water, motion, reducedMotion); drawRollers(c, game, water, motion, reducedMotion); }
  if (!menu && STAGES[game.stage].id === 'reef') {
    for (let i = 0; i < 9; i++) {
      const x = ((i * 79 - d * .22) % 650 + 650) % 650 - 80;
      for (let j = -1; j <= 1; j++) path(c, null, p => { p.moveTo(x, 824); p.quadraticCurveTo(x + j * 30, 800, x + j * 24 + Math.sin(motion + i) * 2, 730 + Math.abs(j) * 17); }, i % 2 ? '#c59191' : '#b5a0b9', 8);
      ellipse(c, x + 28, 817, 19, 12, '#b5bb91');
      if (night) { c.globalCompositeOperation = 'lighter'; ellipse(c, x, 738, 16, 16, '#ff9fd012'); c.globalCompositeOperation = 'source-over'; }
    }
  }
  // Sandy seabed and gently moving sea grass frame the action.
  path(c, theme.seabed, p => { p.moveTo(-30, 833); p.bezierCurveTo(120, 807, 172, 852, 282, 832); p.quadraticCurveTo(398, 803, 510, 825); p.lineTo(510, 880); p.lineTo(-30, 880); });
  drawCaustics(c, stage, d, motion, reducedMotion);
  drawSeabedLife(c, stage, d, motion, menu ? null : game, reducedMotion);
  drawStageHighlight(c, stage, water, d, motion, menu ? null : game, reducedMotion);
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 8; i++) { const x = side ? 475 - i * 9 : i * 9 - 15; const h = 37 + (i * 31) % 112;
      path(c, theme.grass[i % 2 ? 0 : 1], p => { p.moveTo(x - 4, 850); p.bezierCurveTo(x - 18, 800, x + Math.sin(motion + i) * 12, 850 - h, x + 12, 840 - h); p.bezierCurveTo(x + 2, 820 - h, x + 20, 805, x + 5, 850); }, '#386f63', .7);
    }
    ellipse(c, side ? 456 : 23, 836, 25, 11, '#96b5a0'); ellipse(c, side ? 426 : 57, 844, 17, 9, '#81a996');
  }
  if (!menu) {
    drawResidents(c, game, stage, water, d, t, reducedMotion);
    const p = game.player, depth = clamp((p.y - water) / (830 - water), 0, 1);
    ellipse(c, p.x + 4, 838, 22 + depth * 22, 4 + depth * 3, `rgba(20,50,60,${p.wet ? .07 + depth * .16 : .05})`);
  }
  if (menu) {
    fish(c, 95 + Math.sin(motion * .6) * 18, 558, .8, false, motion); fish(c, 371 - Math.sin(motion * .5) * 12, 594, .65, true, motion);
    fish(c, 340 + Math.sin(motion * .5) * 12, 785, .65, false, motion); fish(c, 367 + Math.sin(motion * .5) * 12, 766, .45, false, motion);
    ellipse(c, 229, water + 4, 80, 10, '#306e7120');
    // Pip's little show on the start screen: look around, wink at you, snack on a
    // leaping fish, yawn, ruffle the feathers and hop. One loop every 20 seconds.
    const k = motion % 20, bob = Math.sin(motion * 1.6) * 5;
    const phase = (from, to) => k > from && k < to ? (k - from) / (to - from) : 0;
    const hop = phase(17.2, 18) ? -Math.abs(Math.sin(phase(17.2, 18) * Math.PI * 2)) * 16 : 0;
    const look = phase(1, 3) ? Math.sin(phase(1, 3) * Math.PI) * -.22 : phase(4, 5.6) ? Math.sin(phase(4, 5.6) * Math.PI) * .14 : 0;
    const wink = phase(4.3, 5.4) ? Math.sin(phase(4.3, 5.4) * Math.PI) : 0;
    const yawn = phase(11, 12.8) ? Math.sin(phase(11, 12.8) * Math.PI) : 0;
    const shiver = phase(14, 14.8) ? (1 - phase(14, 14.8)) * .5 : 0;
    const leap = phase(7, 8.1), hearts = phase(8.1, 9.8);
    // The beak opens while the fish is still in the air (gulp .42 → .21 opens it), then snaps shut after the catch.
    const gulp = leap > .45 ? .42 - .21 * (leap - .45) / .55 : phase(8.1, 8.52) ? (1 - phase(8.1, 8.52)) * .21 : 0;
    const y = 378 + bob + hop;
    if (leap) {
      const fx = 452 - leap * 100, fy = water + 12 + (y - 46 - water - 12) * leap - Math.sin(leap * Math.PI) * 80;
      if (leap < .12) ellipse(c, 452, water + 2, 14 + leap * 80, 3, '#f1fbe9aa');
      fish(c, fx, fy, .7, false, motion, 0, .5 + Math.cos(leap * Math.PI) * .6);
    }
    if (hearts) for (let i = 0; i < 3; i++) {
      const hx = 352 + i * 12 + Math.sin(motion * 6 + i) * 4, hy = y - 60 - hearts * 46 - i * 10, r = 5;
      c.globalAlpha = 1 - hearts;
      path(c, '#ff8fa3', p => { p.moveTo(hx, hy + r * .9); p.bezierCurveTo(hx - r * 1.6, hy - r * .2, hx - r * .7, hy - r * 1.4, hx, hy - r * .5); p.bezierCurveTo(hx + r * .7, hy - r * 1.4, hx + r * 1.6, hy - r * .2, hx, hy + r * .9); });
      c.globalAlpha = 1;
    }
    if (phase(14, 16.5)) for (let i = 0; i < 3; i++) {
      const u = phase(14, 16.5), fx = 190 + i * 30 + Math.sin(u * 9 + i) * 10, fy = y - 10 + u * 70 + i * 6;
      c.globalAlpha = 1 - u; ellipse(c, fx, fy, 5, 2, '#fffaf0', Math.sin(u * 7 + i)); c.globalAlpha = 1;
    }
    if (yawn > .5) { c.globalAlpha = (yawn - .5) * 2; c.fillStyle = '#7a8a9a'; c.font = "bold 14px 'Trebuchet MS'"; c.fillText('z', 300 + yawn * 6, y - 96 - yawn * 10); c.globalAlpha = 1; }
    pelican(c, {
      x: 217, y, scale: 1.55, time: motion, tilt: -.06, outfit,
      happy: hop < 0 || (hearts > 0 && hearts < .7), gulp, reducedMotion,
      expression: { look, wink, yawn, shiver },
    });
  } else {
    for (const item of game.items) {
      if (item.kind === 'buoy') buoy(c, item, water, motion, night);
      if (item.kind === 'mangrove') mangrove(c, item, water, motion, night);
      if (item.kind === 'coral') coral(c, item, water, motion, night);
      if (['island', 'reef'].includes(item.kind)) {
        for (const [index, b] of terrainBlocks(item).entries()) rock(c, b, item, index, water, motion, night);
        if (item.kind === 'island') {
          for (let i = 0; i < 5; i++) ellipse(c, item.x - 45 + i * 22, 329 + Math.sin(i * 2) * 3, 18, 8, i % 2 ? '#79aa80' : '#8db686');
          for (const [dx, colour] of [[-38, '#ffd3e0'], [-6, '#fff3b0'], [30, '#ffd3e0']]) { ellipse(c, item.x + dx, 322, 3.4, 3.4, colour); ellipse(c, item.x + dx, 322, 1.3, 1.3, '#f2b35c'); }
          ellipse(c, item.x + 22, 323, 8, 4, '#f0ccb0'); ellipse(c, item.x + 23, 321, 2, 2, '#f7e7c8');
        } else {
          for (let i = 0; i < 5; i++) path(c, null, p => { p.moveTo(item.x - 60 + i * 27, 610); p.quadraticCurveTo(item.x - 70 + i * 27 + Math.sin(motion + i) * 4, 638, item.x - 55 + i * 27, 657); }, i % 2 ? '#d49a91' : '#e0af95', 5);
        }
      }
      if (item.kind === 'nest') {
        nestBase(c, item.x, water, stage, motion);
        ellipse(c, item.x, water - 26, 54, 14, '#8b6548');
        ellipse(c, item.x, water - 29, 47, 10, '#bb8d5c');
        for (let j = 0; j < 2; j++) {
          const sated = item.served && !game.feeding && game.feedingTotal > 0 && j === 0;
          const eager = !sated && Math.abs(item.x - game.player.x) < 250;
          const hop = eager && !reducedMotion ? Math.max(0, Math.sin(motion * 9 + j * 2)) * 9 : 0;
          const x = item.x - 18 + j * 34, y = water - 43 - hop + (sated ? 9 : 0);
          ellipse(c, x, y, sated ? 19 : 15, sated ? 12 : 18, gradient(c, y - 18, y + 18, '#fff4c8', '#e8c67b'));
          path(c, '#f7dfa0', p => { p.moveTo(x - 9, y - 25); p.lineTo(x - 8, y - 34); p.lineTo(x - 2, y - 27); p.lineTo(x + 3, y - 35); p.lineTo(x + 5, y - 25); p.closePath(); });
          ellipse(c, x - 2, y - 18, 13, 13, '#fff5cf');
          ellipse(c, x - 7, y - 21, 2.2, sated ? 1 : 3, '#345b52'); ellipse(c, x - 7.5, y - 22, .7, 1, '#fff');
          path(c, '#efb358', p => { p.moveTo(x - 12, y - 20); p.lineTo(x - 30, y - (eager ? 27 : 17)); p.lineTo(x - 13, y - 15); p.closePath(); }, '#b97845', .8);
          if (eager) path(c, '#f8cf77', p => { p.moveTo(x - 12, y - 14); p.lineTo(x - 28, y - 12); p.lineTo(x - 13, y - 9); p.closePath(); }, '#b97845', .8);
          ellipse(c, x - 8, y - 12, 3.5, 2, '#edb6a0');
          path(c, '#f4dda1', p => { p.moveTo(x + 5, y - 1); p.quadraticCurveTo(x + 18, y + 2, x + 8, y + 12); p.quadraticCurveTo(x + 2, y + 8, x + 5, y - 1); }, '#d6b66f', .7);
        }
        for (let j = 0; j < 9; j++) path(c, null, p => { p.moveTo(item.x - 49 + j * 11, water - 28 + j % 2 * 5); p.lineTo(item.x - 31 + j * 9, water - 17 - j % 3 * 3); }, j % 2 ? '#dcb676' : '#c9995e', 2.5);
        if (game.feeding && game.feedingTotal > 0 && item.served && item.celebration > 0) {
          const phase = (motion * 4) % 1;
          fish(c, item.x - 25 + phase * 40, water - 71 - Math.sin(phase * Math.PI) * 20, .4, false, motion);

        }
      }
      if (item.kind === 'diver') {
        if (['aim', 'locked'].includes(item.phase)) {
          c.save(); c.setLineDash(item.phase === 'aim' ? [5, 8] : []);
          path(c, null, p => { p.moveTo(item.x - 30, item.y); p.lineTo(item.aimX, item.aimY); }, item.phase === 'locked' ? '#ffd28a' : '#c2e8d277', 2); c.restore();
        }
        // Chibi diver: round wetsuit, big mask with friendly eyes, little flippers.
        const kick = Math.sin(motion * 5) * 5;
        c.lineCap = 'round';
        for (let i = 0; i < 2; i++) path(c, i ? '#ff9f6b' : '#ffb27a', p => { p.moveTo(item.x + 22, item.y + i * 6); p.quadraticCurveTo(item.x + 38, item.y + i * 8, item.x + 50, item.y - 6 + i * 18 + kick * (i ? -1 : 1)); p.quadraticCurveTo(item.x + 44, item.y + 12 + i * 4, item.x + 30, item.y + 8 + i * 5); p.closePath(); }, '#c46f4f', 1);
        ellipse(c, item.x + 6, item.y + 2, 24, 17, gradient(c, item.y - 16, item.y + 18, '#5f97a6', '#3d6d82'));
        path(c, '#ffd36e', p => p.roundRect(item.x - 2, item.y - 20, 24, 10, 5), '#b58a3e', 1);
        ellipse(c, item.x - 20, item.y - 4, 20, 19, '#f6cfaa');
        path(c, '#3d6d82', p => p.ellipse(item.x - 20, item.y - 12, 21, 14, 0, Math.PI, TAU));
        path(c, '#bfeef0cc', p => p.roundRect(item.x - 38, item.y - 13, 30, 17, 8), '#2f5c70', 3);
        ellipse(c, item.x - 31, item.y - 9, 5, 2.4, '#ffffffaa', -.3);
        for (const dx of [-30, -18]) cuteEye(c, item.x + dx, item.y - 4, 3.4, blink(motion, item.x * .002 + 6), '#2b4a55');
        ellipse(c, item.x - 34, item.y + 7, 3.4, 2, '#ff9d9d88'); ellipse(c, item.x - 13, item.y + 7, 3.4, 2, '#ff9d9d88');
        path(c, null, p => { p.moveTo(item.x - 26, item.y + 9); p.quadraticCurveTo(item.x - 23, item.y + 12, item.x - 20, item.y + 9); }, '#9a5a48', 1.4);
        path(c, null, p => { p.moveTo(item.x - 4, item.y - 16); p.lineTo(item.x - 4, item.y - 30); p.quadraticCurveTo(item.x - 4, item.y - 35, item.x + 1, item.y - 35); }, '#ffd36e', 3.5);
        path(c, null, p => { p.moveTo(item.x - 14, item.y + 12); p.quadraticCurveTo(item.x - 28, item.y + 18, item.x - 40, item.y + 6); }, '#f6cfaa', 5);
        path(c, null, p => { p.moveTo(item.x - 50, item.y + 4); p.lineTo(item.x - 22, item.y + 4); }, '#5a6f75', 5);
        path(c, null, p => { p.moveTo(item.x - 49, item.y); p.lineTo(item.x - 56, item.y + 4); p.lineTo(item.x - 49, item.y + 8); }, '#e8e1b8', 1.5);
        if (!reducedMotion) for (let i = 0; i < 3; i++) { const rise = (motion * 22 + i * 13) % 40; ellipse(c, item.x + 1 + Math.sin(motion * 3 + i) * 2, item.y - 38 - rise, 1.6 + i * .7, 1.6 + i * .7, '#d9f5e0aa'); }
        c.lineCap = 'butt';
      }
      if (item.kind === 'harpoon') {
        c.save(); c.translate(item.x, item.y); c.rotate(Math.atan2(item.vy, item.vx));
        path(c, null, p => { p.moveTo(-24, 0); p.lineTo(13, 0); }, '#f3ddb1', 3);
        path(c, '#d6c18e', p => { p.moveTo(4, -6); p.lineTo(14, 0); p.lineTo(4, 6); p.lineTo(8, 0); p.closePath(); }, '#725f4f', 1); c.restore();
      }
      if (item.kind === 'surfer') {
        // Chibi surfer: big head, short limbs, rosy cheeks. The hit zone is unchanged.
        const bob = Math.sin(motion * 4) * 3, lean = Math.sin(motion * 2.2) * .05;
        const wave = !reducedMotion && item.reaction > 0 ? Math.sin(item.reaction * 18) * 15 : 0;
        path(c, null, p => { p.moveTo(item.x + 65, WORLD.water + 10); p.quadraticCurveTo(item.x + 18, WORLD.water - 22, item.x - 68, WORLD.water + 7); }, '#e8f6dfcc', 6);
        ellipse(c, item.x, WORLD.water + bob, 50, 8, gradient(c, WORLD.water - 6, WORLD.water + 8, '#ffc48a', '#f08f78'));
        path(c, null, p => { p.moveTo(item.x - 36, WORLD.water + bob - 1); p.quadraticCurveTo(item.x, WORLD.water + bob + 4, item.x + 38, WORLD.water + bob - 1); }, '#fff6cf', 2.5);
        star(c, item.x + 22, WORLD.water + bob, 4, '#fff6cf');
        c.save(); c.translate(item.x, WORLD.water + bob); c.scale(item.escaping ? -1 : 1, 1); c.rotate(lean);
        c.lineCap = 'round';
        path(c, null, p => { p.moveTo(-12, -6); p.lineTo(-6, -22); p.moveTo(10, -6); p.lineTo(5, -22); }, '#efc39a', 7);
        ellipse(c, -13, -4, 6, 3, '#efc39a'); ellipse(c, 11, -4, 6, 3, '#efc39a');
        path(c, '#7fc6c0', p => p.roundRect(-12, -42, 22, 22, 9), '#4f8f8a', 1.2);
        path(c, '#ffd36e', p => { p.moveTo(-12, -30); p.lineTo(10, -30); p.lineTo(10, -25); p.lineTo(-12, -25); p.closePath(); });
        path(c, null, p => { p.moveTo(-10, -37); p.quadraticCurveTo(-20, -34, -27, -27 + wave); p.moveTo(8, -37); p.quadraticCurveTo(17, -42, 24, -47); }, '#efc39a', 6);
        ellipse(c, -27, -27 + wave, 4, 4, '#efc39a'); ellipse(c, 24, -47, 4, 4, '#efc39a');
        ellipse(c, -1, -60, 19, 18, '#f4cba4');
        path(c, '#8a5a3f', p => { p.ellipse(-1, -66, 20, 14, 0, Math.PI, TAU); p.quadraticCurveTo(14, -60, 17, -56); p.quadraticCurveTo(8, -66, -1, -63); p.quadraticCurveTo(-10, -66, -20, -60); p.closePath(); });
        path(c, '#8a5a3f', p => { p.moveTo(-2, -80); p.quadraticCurveTo(4, -90, 10, -84); p.quadraticCurveTo(4, -84, -2, -80); });
        for (const dx of [-9, 5]) cuteEye(c, dx, -57, 3.6, blink(motion, item.x * .003 + 5), '#2f4f4c');
        ellipse(c, -13, -50, 3.6, 2, '#ff9d9d77'); ellipse(c, 10, -50, 3.6, 2, '#ff9d9d77');
        path(c, null, p => { p.moveTo(-5, -49); p.quadraticCurveTo(-2, -45, 1, -49); }, '#8a4f3c', 1.4);
        c.restore();
      }
      if (item.kind === 'gull') {
        const wing = Math.sin(motion * 7) * 16;
        c.save(); c.translate(item.x, item.y);
        if (!reducedMotion) c.rotate(item.kicked ? (1 - item.reaction) * 8 : item.reactionKind === 'confused' ? Math.sin(item.reaction * 16) * .7 : 0);
        else if (item.kicked) c.rotate(-.35);
        // A proper little gull: grey wings with dark tips that bend at the elbow, a round white body and a fanned tail.
        const wingSide = (dir, shade) => {
          const elbowY = -wing * .45, tipY = -wing - 4;
          path(c, shade, p => { p.moveTo(dir * 2, -2); p.quadraticCurveTo(dir * 12, elbowY - 8, dir * 22, elbowY - 4); p.quadraticCurveTo(dir * 34, tipY - 2, dir * 42, tipY); p.quadraticCurveTo(dir * 30, tipY + 9, dir * 20, elbowY + 6); p.quadraticCurveTo(dir * 10, 6, dir * 2, 6); p.closePath(); }, '#8a8f8c', 1);
          path(c, '#3f4a4c', p => { p.moveTo(dir * 34, tipY + 1); p.quadraticCurveTo(dir * 39, tipY - 1, dir * 42, tipY); p.quadraticCurveTo(dir * 37, tipY + 6, dir * 31, tipY + 6); p.closePath(); });
        };
        wingSide(1, '#c9cfcb'); wingSide(-1, '#dfe4e0');
        path(c, '#f4f1e6', p => { p.moveTo(14, -1); p.lineTo(25, -5); p.lineTo(24, 2); p.lineTo(26, 7); p.lineTo(14, 5); p.closePath(); }, '#a7a593', .9);
        ellipse(c, 2, 1, 19, 11, gradient(c, -10, 12, '#ffffff', '#e4e4da'));
        ellipse(c, -13, -7, 9.5, 9, '#fffdf5');
        path(c, '#f2c14e', p => { p.moveTo(-20, -10); p.quadraticCurveTo(-30, -8, -35, -5); p.lineTo(-20, -2); p.closePath(); }, '#c99a35', .8);
        ellipse(c, -29, -4.6, 1.5, 1.2, '#d9534f');
        if (item.reactionKind === 'confused') path(c, null, p => { p.moveTo(-20, -13); p.lineTo(-12, -6); p.moveTo(-12, -13); p.lineTo(-20, -6); }, '#315852', 1.7);
        else { cuteEye(c, -15.5, -10, 3.4, blink(motion, item.baseY * .01 + 3), '#315852'); ellipse(c, -11, -5, 2.6, 1.5, '#f3a0a066'); }
        path(c, null, p => { p.moveTo(4, 9); p.lineTo(8, 14); p.moveTo(9, 9); p.lineTo(13, 13); }, '#e0a35a', 1.6); c.restore();
      }
      if (item.kind === 'jelly') {
        const pulse = Math.sin(motion * 4) * 2, depth = 20 + item.phase * 65;
        // Thin trailing tentacles that sway, frilly oral arms in the middle, and a see-through bell.
        for (let i = -3; i <= 3; i++) path(c, null, p => { const x = item.x + i * 7.5, sway = Math.sin(motion * 2.2 + i) * 6; p.moveTo(x, item.y); p.bezierCurveTo(x - 10 + sway, item.y + depth * .4, x + 10 + sway, item.y + depth * .7, x + sway * .6, item.y + depth); }, i % 2 ? '#e6a6d4aa' : '#f3c2e2aa', 1.6);
        for (const dx of [-5, 5]) path(c, null, p => { const x = item.x + dx; p.moveTo(x, item.y); for (let k = 1; k <= 12; k++) p.lineTo(x + Math.sin(k * .9 + motion * 2.5 + dx) * 3.5, item.y + k * depth * .055); }, '#f7d3eacc', 3.2);
        c.globalAlpha = .88;
        path(c, gradient(c, item.y - 31, item.y + 11, '#f6d6ea', '#d394c8'), p => { p.moveTo(item.x - 27 - pulse, item.y); p.quadraticCurveTo(item.x - 25, item.y - 31, item.x, item.y - 31 - pulse); p.quadraticCurveTo(item.x + 25, item.y - 31, item.x + 27 + pulse, item.y); p.quadraticCurveTo(item.x + 18, item.y + 8, item.x + 10, item.y); p.quadraticCurveTo(item.x, item.y + 10, item.x - 10, item.y); p.quadraticCurveTo(item.x - 19, item.y + 8, item.x - 27 - pulse, item.y); }, '#8e6d96', 1);
        c.globalAlpha = 1;
        for (const [dx, dy] of [[-12, -20], [2, -24], [13, -17]]) ellipse(c, item.x + dx, item.y + dy, 3, 3, '#ffe6f466');
        ellipse(c, item.x - 9, item.y - 17, 7, 4, '#fff3ed77');
        for (const dx of [-8, 8]) { cuteEye(c, item.x + dx, item.y - 8, 3.6, blink(motion, item.x * .002 + 4), '#655879'); ellipse(c, item.x + dx * 1.6, item.y - 3, 3, 1.6, '#ff8fb066'); }
        path(c, null, p => { p.moveTo(item.x - 5, item.y); p.quadraticCurveTo(item.x, item.y + 4, item.x + 5, item.y); }, '#755e83', 1.2);
      }
      if (item.kind === 'driftwood') {
        ellipse(c, item.x, item.y + 9, 62, 8, '#e9f5df55');
        path(c, gradient(c, item.y - 10, item.y + 13, '#ba895e', '#865a43'), p => { p.roundRect(item.x - 48, item.y - 10, 96, 23, 10); }, '#6f4e40', 2);
        path(c, null, p => { p.moveTo(item.x - 34, item.y); p.quadraticCurveTo(item.x, item.y + 5, item.x + 32, item.y - 1); }, '#d4a77d', 2);
        ellipse(c, item.x + 41, item.y + 1, 5, 8, '#d9ac7b'); ellipse(c, item.x - 25, item.y - 2, 4, 2, '#765040');
        path(c, '#719b78', p => { p.moveTo(item.x - 16, item.y - 7); p.quadraticCurveTo(item.x - 10, item.y - 21, item.x - 2, item.y - 8); p.closePath(); });
        // Growth rings on the cut end, barnacles, and a little crab riding along and waving.
        for (const r of [3.5, 1.6]) { c.beginPath(); c.ellipse(item.x + 41, item.y + 1, r, r * 1.6, 0, 0, TAU); c.strokeStyle = '#a97a55'; c.lineWidth = .9; c.stroke(); }
        for (const [dx, dy] of [[-40, 4], [-36, 7], [22, 7]]) { ellipse(c, item.x + dx, item.y + dy, 2.6, 2.2, '#efe6d3'); ellipse(c, item.x + dx, item.y + dy - .4, 1, .8, '#9b8f7a'); }
        const wave = reducedMotion ? 0 : Math.sin(motion * 5) * .5, cx = item.x + 14, cy = item.y - 14;
        for (const s of [-1, 1]) path(c, null, p => { p.moveTo(cx + s * 5, cy + 3); p.lineTo(cx + s * 9, cy + 7); p.moveTo(cx + s * 3, cy + 4); p.lineTo(cx + s * 6, cy + 8); }, '#c4553f', 1.3);
        ellipse(c, cx, cy, 7.5, 5, '#e2725a');
        c.save(); c.translate(cx + 7, cy - 3); c.rotate(-.6 + wave); ellipse(c, 4, -2, 3.6, 2.6, '#e2725a'); c.restore();
        ellipse(c, cx - 8, cy - 1, 2.8, 2.2, '#e2725a');
        for (const dx of [-2.5, 2.5]) { path(c, null, p => { p.moveTo(cx + dx, cy - 4); p.lineTo(cx + dx, cy - 8); }, '#c4553f', 1); ellipse(c, cx + dx, cy - 8.5, 1.6, 1.6, '#2f3b3a'); }
      }
      if (item.kind === 'whirlpool') {
        // Swirling water, not a hole: a faint light shimmer with short swirl strokes turning around it.
        const spin = motion * 1.6, squash = .42;
        const shimmer = c.createRadialGradient(item.x, item.y, 4, item.x, item.y, 115);
        shimmer.addColorStop(0, '#e8fff433'); shimmer.addColorStop(.6, '#c9efe41c'); shimmer.addColorStop(1, '#c9efe400');
        c.save(); c.translate(item.x, item.y); c.scale(1, squash); c.translate(-item.x, -item.y);
        c.fillStyle = shimmer; c.beginPath(); c.arc(item.x, item.y, 115, 0, TAU); c.fill();
        c.lineCap = 'round';
        [[96, .7, 3, '#e3faf0cc'], [66, 1.1, 3, '#f0fff8dd'], [38, 1.7, 2, '#fffbe0ee']].forEach(([r, speed, count, color], ring) => {
          c.strokeStyle = color; c.lineWidth = 3.5 - ring * .5;
          for (let k = 0; k < count; k++) {
            const a = spin * speed + k * TAU / count + ring;
            c.beginPath(); c.arc(item.x, item.y, r, a, a + .9); c.stroke();
          }
        });
        c.restore();
        for (let i = 0; i < 12; i++) {
          const u = ((reducedMotion ? 0 : motion * .35) + i / 12) % 1, r = 110 * (1 - u) + 6, a = spin + i * 2.1 + u * 6;
          const x = item.x + Math.cos(a) * r, y = item.y + Math.sin(a) * r * squash;
          if (i % 3) { c.strokeStyle = '#eafff8cc'; c.lineWidth = 1.2; c.beginPath(); c.arc(x, y, 2.5 + (1 - u) * 2.5, 0, TAU); c.stroke(); }
          else star(c, x, y, 3 + (1 - u) * 2, '#fff6c8', motion * 2 + i);
        }
      }
      if (item.kind === 'bubble') {
        ellipse(c, item.x, item.y, 18, 18, gradient(c, item.y - 18, item.y + 18, '#e5fff5aa', '#83d7cf33'));
        c.strokeStyle = '#eafff6'; c.lineWidth = 2; c.beginPath(); c.arc(item.x, item.y, 18, 0, TAU); c.stroke();
        ellipse(c, item.x - 5, item.y - 6, 4, 5, '#ffffffcc');

      }
      if (item.kind === 'current') drawCurrent(c, item, motion, reducedMotion);
      if (item.kind === 'baitball') drawBaitball(c, item, game.time, night);
      if (night && (item.kind === 'fish' || item.kind === 'jelly')) { c.globalCompositeOperation = 'lighter'; ellipse(c, item.x, item.y - (item.kind === 'jelly' ? 12 : 0), item.kind === 'jelly' ? 44 : 25, item.kind === 'jelly' ? 40 : 17, item.kind === 'jelly' ? '#ff9ee01c' : item.golden ? '#ffd9701c' : '#ffc9a00e'); c.globalCompositeOperation = 'source-over'; }
      if (item.kind === 'fish') { const gap = Math.hypot(item.x - game.player.x, item.y - game.player.y); fish(c, item.x, item.y, item.golden ? .95 : .8, item.golden, motion, gap < 120 ? 1 - gap / 120 : 0, item.leap > 0 && item.leap < LEAP.duration ? Math.cos(item.leap / LEAP.duration * Math.PI) * .8 : (item.heading || 0)); }
      if (item.kind === 'puffer') puffer(c, item, motion);
      if (item.kind === 'turtle') turtle(c, item, motion);
      if (item.kind === 'shark') shark(c, item, motion);
      if (item.kind === 'whiteshark') greatWhite(c, item, water, motion);
      if (item.kind === 'boat') boat(c, item, water, motion, game.decor?.sleepy);
    }
    const p = game.player;
    c.save();
    pelican(c, {
      x: p.feedX ?? p.x, y: p.y, scale: .76, time: motion,
      tilt: game.feeding ? -.12 + Math.sin(motion * 10) * .06 : playerTilt(p),
      outfit, wet: p.wet, happy: game.feeding > 0 || p.gulp > .1 || fx?.joy > 0,
      gulp: game.feeding ? .2 : p.gulp, breach: p.breach, cargo: game.cargo, breath: p.breath, reducedMotion,
      expression: {
        energy: game.energy, hurt: p.hurt, relief: p.relief, bump: p.bump, confused: p.confused, kick: p.kick,
        squash: fx?.squash, stretch: game.feeding ? 0 : clamp(Math.abs(p.vy) / 3400, 0, .1),
        sparkle: fx?.sparkle, shiver: fx?.shiver, joy: fx?.joy,
        plunge: p.wet ? 0 : clamp((p.vy - 120) / 120, 0, 1),
        dive: p.wet ? clamp(p.vy / 500, 0, 1) : 0, rise: p.wet ? clamp(-p.vy / 500, 0, 1) : 0,
        fish: game.items.find(i => i.kind === 'fish' && i.x > p.x + 30 && i.x < p.x + 140),
        nest: game.feeding || game.settling || game.items.some(i => i.kind === 'nest' && Math.abs(i.x - p.x) < 260),
      },
    });
    c.restore();
    if (!menu && (p.wet || p.breath < WORLD.breath)) {
      // Air left, as a thin arc above Pip; warm and pulsing when it is time to surface.
      const { level, urgency } = airState(p, game.cargo), share = clamp(p.breath / WORLD.breath, 0, 1);
      const back = { x: -36 * .76, y: -44 * .76 }, tilt = playerTilt(p);
      // Sits above Pip's back (in Pip's own frame), so it follows the tilt instead of hovering over the head.
      const cx = (p.feedX ?? p.x) + back.x * Math.cos(tilt) - back.y * Math.sin(tilt), cy = p.y + back.x * Math.sin(tilt) + back.y * Math.cos(tilt), r = 13, pulse = level && !reducedMotion ? 1 + Math.sin(motion * (8 + urgency * 8)) * .15 : 1;
      c.lineCap = 'round';
      c.strokeStyle = '#ffffff55'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
      c.strokeStyle = level ? '#ffb070' : '#eafff8'; c.lineWidth = 4 * pulse; c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + share * TAU); c.stroke();
    }
  }
  const swell = menu ? 1 : swellOf(game, stage, reducedMotion);
  for (let i = 0; i < 4; i++) {
    path(c, null, p => { for (let x = -30; x <= 510; x += 8) { const y = water + i * 4 + Math.sin(x * .025 + motion * 1.6 + i * .3) * 3 * swell + Math.sin(x * .011 - motion * .9) * 2.2 * (swell - 1) - (menu ? 0 : rollerLift(game, x) * (1 - i * .2)); if (x === -30) p.moveTo(x, y); else p.lineTo(x, y); } }, ['#fff1c8cc', '#dceccf88', '#c3ead455', '#b7e4cc22'][i], i === 0 ? 2 : 1);
  }
  if (!reducedMotion) for (let i = 0; i < 7; i++) {
    const x = ((i * 77 - d * .5) % 540 + 540) % 540 - 30, glint = Math.max(0, Math.sin(motion * 2.4 + i * 1.9));
    c.globalAlpha = glint * .8; path(c, night ? '#eef3ff' : '#fffbe0', p => p.ellipse(x, water + Math.sin(x * .025 + motion * 1.6) * 3 * swell, 5 + glint * 5, 1.3, 0, 0, TAU)); c.globalAlpha = 1;
  }
  if (STAGES[stage].id === 'lagoon' && !menu) {
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const x = ((i * 61 + Math.sin(motion * .4 + i) * 30 - d * .3) % 540 + 540) % 540 - 30, y = water - 28 - (i * 37) % 110 + Math.sin(motion * .9 + i * 2) * 10;
      const glow = reducedMotion ? .6 : Math.max(0, Math.sin(motion * (1.2 + (i % 3) * .4) + i * 2.3));
      ellipse(c, x, y, 5, 5, `rgba(255,214,110,${.16 * glow})`); ellipse(c, x, y, 1.5, 1.5, `rgba(255,240,160,${.85 * glow})`);
    }
    c.globalCompositeOperation = 'source-over';
  }
  if (!menu && STAGES[stage].storm) drawStorm(c, game, water, motion, reducedMotion);
  if (!menu) drawJuice(c, fx, game, water, motion, reducedMotion);
  for (const e of effects) {
    c.save(); c.globalAlpha = Math.min(1, e.life * 2);
    if (e.label) {
      const rise = (1 - e.life) * 34, size = e.big ? 21 : 15;
      c.font = `bold ${size}px 'Trebuchet MS'`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#1f4a4fcc'; c.lineJoin = 'round';
      const lx = clamp(e.x, 80, 400), ly = e.y - 46 - rise;
      c.strokeText(e.label, lx, ly); c.fillStyle = e.colour || '#fff2b6'; c.fillText(e.label, lx, ly);
    }
    if (['catch', 'mission', 'trick', 'outsmart', 'delivery', 'kick', 'feast', 'nearMiss', 'frenzy'].includes(e.kind)) {
      if (!reducedMotion) for (let i = 0; i < 5; i++) { const r = (1 - e.life) * 45; ellipse(c, e.x + Math.cos(i * 1.25) * r, e.y + Math.sin(i * 1.25) * r, 2.5 * e.life, 2.5 * e.life, '#fff2b6'); }
      if (e.kind === 'kick') { c.fillStyle = '#fff2b6'; c.font = "bold 15px 'Trebuchet MS'"; c.textAlign = 'center'; c.fillText(translate('fxKick', { points: e.points }), e.x, e.y - 42); }
    } else if (!fx && !reducedMotion && ['splash', 'breach', 'netSplash'].includes(e.kind)) {
      for (let i = 0; i < 9; i++) { const v = i - 4; const age = 1 - e.life; ellipse(c, e.x + v * age * (e.kind === 'netSplash' ? 31 : 19), e.y - Math.sin(age * Math.PI) * ((e.kind === 'breach' ? 45 : 27) - Math.abs(v) * 3), 2 * e.life, 4 * e.life, '#e8f8de'); }
    }
    c.restore();
  }
  c.restore();
}
