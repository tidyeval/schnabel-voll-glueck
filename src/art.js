import { WORLD, clamp, netShape, playerTilt, terrainBlocks } from './game.js';
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
export function fish(c, x, y, scale = 1, golden = false, t = 0) {
  const swim = Math.sin(t * 7) * .16;
  c.save(); c.translate(x, y); c.scale(scale, scale); c.rotate(Math.sin(t * 3) * .035);
  const col = golden ? '#f6cd5f' : '#efa98e', edge = golden ? '#b9823e' : '#af6f66';
  c.save(); c.translate(10, 0); c.rotate(swim); c.translate(-10, 0);
  path(c, golden ? '#e6a94c' : '#d68172', p => { p.moveTo(9, 0); p.lineTo(28, -13); p.quadraticCurveTo(23, 0, 28, 13); p.closePath(); }, edge, 1); c.restore();
  ellipse(c, 0, 0, 18, 10.5, gradient(c, -10, 11, col, golden ? '#e9ae51' : '#d98b7d'));
  ellipse(c, -5, 3, 10, 5, golden ? '#ffe9a1' : '#ffd3b9');
  path(c, golden ? '#e3a448' : '#d47d70', p => { p.moveTo(-1, -8); p.lineTo(8, -16); p.lineTo(12, -5); p.closePath(); }, edge, .8);
  path(c, null, p => { p.moveTo(-2, -7); p.quadraticCurveTo(5, -2, 12, -1); }, '#fff0c477', 1.2);
  ellipse(c, -10, -2, 2.6, 3.2, '#315653'); ellipse(c, -10.7, -3.2, .8, 1, '#fff9e7');
  path(c, null, p => { p.moveTo(-15, 3); p.quadraticCurveTo(-11, 6, -7, 4); }, edge, 1);
  if (golden) { c.strokeStyle = '#fff0bd'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(-4, -19); c.lineTo(-4, -27); c.moveTo(-8, -23); c.lineTo(0, -23); c.stroke(); }
  c.restore();
}
export function pelican(c, x, y, scale, t, tilt = 0, outfit = 'classic', wet = false, happy = false, gulp = 0, breach = 0, cargo = 0, breath = WORLD.breath, reducedMotion = false) {
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(scale, scale);
  const fullness = cargo / WORLD.capacity;
  const lowAir = wet && breath < 3, urgency = lowAir ? (3 - breath) / 3 : 0;
  const wobble = Math.sin(t * 6) * fullness * 3;
  const bite = gulp > 0 ? Math.sin((1 - gulp / .42) * Math.PI) : 0;
  const flap = Math.sin(t * (wet ? 7 : 11 + fullness * 4)) * (wet ? .15 : 1) + breach;
  const outline = '#786f5d';
  // A soft painted shadow and separated tail feathers keep Pip readable over sea and sky.
  ellipse(c, -5, 17, 47, 25, '#315e5a22', -.12);
  path(c, '#d8e3ce', p => { p.moveTo(-39, 7); p.lineTo(-68, -4); p.quadraticCurveTo(-62, 10, -39, 20); p.moveTo(-40, 11); p.lineTo(-65, 17); p.quadraticCurveTo(-53, 25, -31, 22); }, outline, 1.2);
  if (!wet) {
    path(c, '#e8edda', p => { p.moveTo(-22, -4); p.bezierCurveTo(-49, -17, -70, -35 - flap * 43, -46, -26 - flap * 42); p.quadraticCurveTo(-25, -23, 2, 2); p.closePath(); }, outline, 1.2);
    for (let i = 0; i < 3; i++) path(c, null, p => { p.moveTo(-48 + i * 8, -20 - flap * (29 - i * 5)); p.quadraticCurveTo(-35 + i * 5, -13, -20 + i * 7, -5); }, '#c8d7c2', 1.2);
  }
  c.save(); if (wet) { c.translate(-5, -8); c.rotate(-.3); }
  c.strokeStyle = '#d9955c'; c.lineWidth = 5; c.lineCap = 'round';
  for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-17 + i * 17, 27); c.lineTo(-24 + i * 19, 36 + flap * 2); c.stroke();
    path(c, '#e7a662', p => { p.moveTo(-29 + i * 19, 33 + flap * 2); p.lineTo(-41 + i * 19, 40 + flap * 2); p.lineTo(-30 + i * 19, 41 + flap * 2); p.lineTo(-22 + i * 19, 46 + flap * 2); p.lineTo(-15 + i * 19, 39 + flap * 2); p.closePath(); }, '#c98550', .8); }
  c.restore();
  ellipse(c, -17, 7, 38, 30 + bite * 2, gradient(c, -20, 38, '#fffaf0', '#dce6d0'), -.16);
  path(c, gradient(c, -57, 21, '#fffdf2', '#ecedd7'), p => { p.moveTo(1, 17); p.bezierCurveTo(-11, 3, -5, -15, -1, -39); p.bezierCurveTo(5, -69, 42, -65, 44, -40); p.bezierCurveTo(45, -25, 20, -15, 20, 4); p.quadraticCurveTo(17, 20, 1, 17); }, outline, 1.1);
  // Pip's tousled crown is his main character mark at every rendered scale.
  path(c, '#fffdf2', p => { p.moveTo(4, -56); p.quadraticCurveTo(-5, -70, 4, -73); p.quadraticCurveTo(10, -70, 12, -61); p.quadraticCurveTo(10, -77, 18, -75); p.quadraticCurveTo(25, -68, 21, -59); }, outline, 1);
  path(c, gradient(c, -35, 8, '#f3c574', '#dc9758'), p => { p.moveTo(37, -40); p.lineTo(91, -25); p.bezierCurveTo(72, -15 + bite * 11, 57, 7 + bite * 15 + fullness * 36 + wobble, 40, -7); p.quadraticCurveTo(31, -18, 37, -40); }, '#bd774b', 1.1);
  path(c, '#f8d79055', p => { p.moveTo(42, -31); p.quadraticCurveTo(63, -23, 82, -23); p.quadraticCurveTo(64, -14, 47, -9); p.quadraticCurveTo(39, -18, 42, -31); });
  if (fullness > .3) for (let i = 0; i < Math.ceil(fullness * 3); i++) {
    ellipse(c, 49 + i * 7, -13 + fullness * 8 + Math.sin(t * 5 + i) * 2, 5, 2.5, '#b9784d55', -.4);
  }
  if (fullness > .75) path(c, '#efb595', p => { p.moveTo(73, -26); p.lineTo(83, -41 + Math.sin(t * 8) * 3); p.lineTo(88, -29); p.closePath(); });
  c.save(); c.translate(35, -40); c.rotate(-bite * .22); c.translate(-35, 40);
  path(c, gradient(c, -44, -21, '#ffe19a', '#efb75f'), p => { p.moveTo(35, -43); p.quadraticCurveTo(67, -38, 94, -27); p.quadraticCurveTo(101, -22, 87, -22); p.lineTo(35, -30); p.closePath(); }, '#bd774b', 1);
  c.restore();
  path(c, null, p => { p.moveTo(38, -30); p.quadraticCurveTo(66, -26, 90, -25); }, '#b8764c', 1.3);
  if (lowAir) {
    ellipse(c, 25, -46, 4.8 + urgency, 5.8 + urgency, '#294b49'); ellipse(c, 26.3, -48.2, 1.5, 1.7, '#fffdf1');
    path(c, null, p => { p.moveTo(18, -54 - urgency * 2); p.lineTo(32, -51 + urgency); }, '#8f765f', 1.8);
    if (!reducedMotion) for (let i = 0; i < Math.ceil(urgency * 3); i++) { const rise = (t * (18 + urgency * 9) + i * 10) % 25; ellipse(c, 91 + i * 5, -27 - rise, 1.5 + i * .5, 1.5 + i * .5, '#e4f8e3aa'); }
  } else if (happy) path(c, null, p => { p.moveTo(20, -43); p.quadraticCurveTo(26, -50, 32, -43); }, '#31524f', 2.8);
  else { ellipse(c, 25, -46, 4.4, 5.4, '#294b49'); ellipse(c, 26.4, -48.2, 1.3, 1.5, '#fffdf1'); }
  if (!lowAir) path(c, null, p => { p.moveTo(18, -53); p.quadraticCurveTo(25, -57, 32, -52); }, '#aa9271', 1.1);
  ellipse(c, 21, -35, 5.6, 3.3, '#e8aa94');
  c.save(); if (wet) { c.translate(-12, 5); c.scale(.8, .6); }
  else { c.translate(-30, 0); c.rotate(-.35 - flap * 1.05); c.scale(1, 1.65); c.translate(30, 0); }
  path(c, gradient(c, 0, 35, '#f3f5e4', '#ccdcca'), p => { p.moveTo(-35, -3); p.bezierCurveTo(-16, -7, 0, 7, -5, 22); p.quadraticCurveTo(-14, 32, -23, 26); p.quadraticCurveTo(-37, 25, -43, 12); p.quadraticCurveTo(-48, 3, -35, -3); }, outline, 1);
  for (let i = 0; i < 4; i++) path(c, null, p => { p.moveTo(-36 + i * 8, 10); p.quadraticCurveTo(-31 + i * 8, 19, -25 + i * 7, 21); }, i === 3 ? '#b4c9b7' : '#c1d3c0', 1.1);
  c.restore();
  if (wet) {
    for (let i = 0; i < 3; i++) ellipse(c, -36 + i * 12, -4 + Math.sin(t * 5 + i) * 2, 1.4, 3, '#d8f2deaa', -.2);
  }
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
  c.restore();
}
function shark(c, item, t) {
  const hurry = item.phase === 'dash' ? 11 : item.phase === 'warn' ? 16 : 4;
  const tail = Math.sin(t * hurry) * (item.phase === 'dash' ? .3 : .16);
  c.save(); c.translate(item.x, item.y); c.rotate(Math.sin(t * (item.phase === 'warn' ? 16 : 1.5)) * .04);
  if (item.phase === 'warn') { c.fillStyle = '#ffe6a1'; c.font = 'bold 28px sans-serif'; c.fillText('!', -12, -62); }
  c.save(); c.translate(43, 0); c.rotate(tail); c.translate(-43, 0);
  path(c, '#557f89', p => { p.moveTo(39, 0); p.lineTo(80, -30); p.quadraticCurveTo(72, -8, 67, 0); p.quadraticCurveTo(75, 10, 82, 27); p.closePath(); }, '#426974', 1.2); c.restore();
  path(c, '#638e98', p => { p.moveTo(-7, -18); p.quadraticCurveTo(6, -50, 21, -51); p.quadraticCurveTo(20, -30, 26, -14); p.closePath(); }, '#426974', 1.1);
  ellipse(c, 0, 0, 55, 26, gradient(c, -26, 25, '#83abb0', '#527d89'));
  path(c, '#bad0c8', p => { p.moveTo(-50, 8); p.quadraticCurveTo(-12, 28, 46, 12); p.quadraticCurveTo(14, 29, -24, 22); p.closePath(); });
  path(c, '#648d96', p => { p.moveTo(3, 8); p.lineTo(24, 34); p.quadraticCurveTo(20, 17, 25, 9); p.closePath(); }, '#426974', 1);
  ellipse(c, -33, -4, 4.3, 4.8, '#294e55'); ellipse(c, -34.2, -5.4, 1.2, 1.4, '#fff8e8');
  path(c, null, p => { p.moveTo(-43, 8); p.quadraticCurveTo(-29, 18, -13, 7); }, '#3d6670', 2.1);
  ellipse(c, -38, 3, 5, 2.8, '#d89e9999');
  path(c, null, p => { p.moveTo(-40, -13); p.quadraticCurveTo(-32, -18, -23, -13); }, '#527783', 1.2);
  for (let i = 0; i < 3; i++) path(c, null, p => { p.moveTo(-7 + i * 5, -5); p.quadraticCurveTo(-11 + i * 5, 1, -7 + i * 5, 7); }, '#597e88', 1.4);
  c.restore();
}
function turtle(c, item, t) {
  c.save(); c.translate(item.x, item.y);
  const paddle = Math.sin(t * 3 + item.baseY) * .35;
  ellipse(c, 24, -18, 22, 8, '#76aa8d', -.5 - paddle);
  ellipse(c, -14, -21, 24, 9, '#87b895', .6 + paddle);
  ellipse(c, 29, 18, 22, 8, '#72a68a', .5 + paddle);
  ellipse(c, 1, 2, 37, 27, '#cbd5a0');
  ellipse(c, 2, -3, 34, 25, gradient(c, -28, 24, '#a7c982', '#658e72'));
  path(c, '#8eb478', p => { p.moveTo(-11, -17); p.lineTo(9, -20); p.lineTo(21, -3); p.lineTo(9, 12); p.lineTo(-10, 9); p.lineTo(-19, -4); p.closePath(); }, '#d8dfa2', 1.8);
  for (const [x, y, ex, ey] of [[-11,-17,-18,-25],[9,-20,17,-25],[21,-3,35,-3],[9,12,17,20],[-10,9,-20,16],[-19,-4,-31,-7]]) path(c, null, p => { p.moveTo(x,y); p.lineTo(ex,ey); }, '#d3dfa6', 1.5);
  ellipse(c, -37, -3, 19, 15, gradient(c, -17, 14, '#acd0a5', '#7fac8d'), -.1);
  ellipse(c, -43, -7, 4, 5, '#2b5050'); ellipse(c, -44, -9, 1.4, 1.6, '#fff8dc');
  ellipse(c, -44, 3, 5, 3, '#eab6a0');
  path(c, null, p => { p.moveTo(-54, 1); p.quadraticCurveTo(-50, 6, -46, 3); }, '#557e6d', 1.4);
  path(c, null, p => { p.moveTo(-51, -13); p.quadraticCurveTo(-43, -17, -35, -13); }, '#69947d', 1);
  ellipse(c, -13, 21, 25, 10, '#93bd96', -.6 - paddle);
  c.restore();
}
function boat(c, item, water, t) {
  const age = item.cast, windup = clamp(age / .85, 0, 1), throwing = clamp((age - .85) / .6, 0, 1);
  const hauling = age >= 2.55, resting = age < 0 || age >= 3.25;
  const bob = Math.sin(t * 2) * 2;
  const hand = resting ? { x: 17, y: -38 } : hauling ? { x: -10 + Math.sin(t * 12) * 7, y: -44 } : { x: 16 + windup * 19 - throwing * 65, y: -40 - windup * 45 + throwing * 36 };
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
  path(c, gradient(c, -15, 26, '#d48b64', '#aa674e'), p => { p.moveTo(-71, -9); p.quadraticCurveTo(0, 0, 71, -9); p.quadraticCurveTo(57, 21, 25, 23); p.lineTo(-26, 23); p.quadraticCurveTo(-55, 21, -71, -9); });
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
  path(c, gradient(c, -45, 2, '#efd08a', '#dca956'), p => { p.moveTo(-22, 0); p.lineTo(-20, -32); p.quadraticCurveTo(-18, -48, -1, -47); p.quadraticCurveTo(19, -48, 23, -30); p.lineTo(25, 0); p.closePath(); }, '#c89a54', 1);
  path(c, null, p => { p.moveTo(1, -36); p.lineTo(3, -1); }, '#fff0bb', 1.5);
  for (let i = 0; i < 3; i++) ellipse(c, 5, -25 + i * 9, 1.5, 1.5, '#a87944');
  path(c, '#c66f5c', p => { p.moveTo(-11, -37); p.lineTo(1, -30); p.lineTo(12, -39); p.lineTo(3, -35); p.lineTo(5, -25); p.closePath(); }, '#99594d', .7);
  ellipse(c, -2, -55, 17, 20, '#edc3a0');
  ellipse(c, -15, -49, 6, 4, '#e7a58c'); ellipse(c, 11, -49, 4, 3, '#e7a58c');
  path(c, '#e2b267', p => { p.moveTo(-24, -64); p.lineTo(-17, -82); p.quadraticCurveTo(0, -89, 15, -79); p.lineTo(22, -63); p.closePath(); });
  path(c, '#8c7451', p => { p.moveTo(-20, -69); p.quadraticCurveTo(0, -62, 19, -68); p.lineTo(21, -63); p.quadraticCurveTo(-1, -56, -23, -63); p.closePath(); });
  path(c, null, p => { p.moveTo(-26, -63); p.quadraticCurveTo(-2, -57, 23, -63); }, '#f8d994', 6);
  const annoyed = age >= 0;
  path(c, null, p => { p.moveTo(-15, -57 - (annoyed ? 2 : 0)); p.lineTo(-8, -55); p.moveTo(0, -55); p.lineTo(7, -57 - (annoyed ? 2 : 0)); }, '#725c48', 2.3);
  ellipse(c, -11, -52, 1.6, 2, '#3e514a'); ellipse(c, 3, -52, 1.6, 2, '#3e514a');
  ellipse(c, -5, -45, 6, 4.5, '#dfaa89');
  path(c, '#fff1d8', p => { p.moveTo(-5, -43); p.quadraticCurveTo(-16, -47, -22, -37); p.quadraticCurveTo(-13, -31, -5, -39); p.quadraticCurveTo(6, -31, 15, -39); p.quadraticCurveTo(4, -47, -5, -43); });
  ellipse(c, -4, -32, hauling ? 4 : 2, hauling ? 3 : 1, '#9b7157'); c.restore();
  path(c, null, p => { p.moveTo(8, -48); p.quadraticCurveTo(24, -40, hand.x, hand.y); }, '#e5b96b', 9);
  ellipse(c, hand.x, hand.y, 5.5, 5, '#efc7a1');
  path(c, null, p => { p.moveTo(-25, -43); p.quadraticCurveTo(-38, -26, -16, -24); }, '#e9be70', 8);
  ellipse(c, -16, -24, 5, 4, '#efc7a1');
  if (!net) {
    for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(hand.x + 2, hand.y + 8 + i * 3, 10 + i, 4, -.2, 0, TAU); c.strokeStyle = '#dfc38f'; c.lineWidth = 1.5; c.stroke(); }
  }
  if (age >= 0 && age < .85) {
    ellipse(c, -10, -130, 12, 15, '#fff1bf'); c.fillStyle = '#b77846'; c.font = "bold 19px 'Trebuchet MS'"; c.textAlign = 'center'; c.fillText('!', -10, -123);
  }
  if (hauling && !item.hit && item.x > 10) {
    c.fillStyle = '#fff2cc'; c.font = "bold 10px 'Trebuchet MS'"; c.textAlign = 'center'; c.fillText('Na warte, Pip!', 0, -125);
  }
  c.restore();
}
export function drawWorld(c, game, mode, t, outfit, effects, reducedMotion = false) {
  const menu = mode === 'menu';
  const water = menu ? 466 : WORLD.water;
  const d = menu ? (reducedMotion ? 0 : t * 12) : game.distance;
  const motion = reducedMotion ? 0 : t;
  c.clearRect(0, 0, 480, 850);
  c.fillStyle = gradient(c, 0, water, '#b9dedb', '#f5e8c8'); c.fillRect(0, 0, 480, water);
  c.fillStyle = gradient(c, water - 150, water, '#f7cfb000', '#efb68a3d'); c.fillRect(0, water - 150, 480, 150);
  ellipse(c, 397, water - 140, 61, 61, '#fff0bd35'); ellipse(c, 397, water - 140, 43, 43, '#fff4c777'); ellipse(c, 397, water - 140, 29, 29, '#ffe7a6');
  cloud(c, 68 - d * .025 % 160, 92, .95, .55); cloud(c, 406 - d * .015 % 120, 125, .65, .55); cloud(c, 240 - d * .02 % 100, water - 122, .45, .55);
  island(c, 24 - d * .055 % 780, water - 6, motion);
  island(c, 805 - d * .055 % 780, water - 6, motion);
  c.save(); c.translate(415, water - 1); c.scale(.5, .5); path(c, '#e5d3aa', p => { p.moveTo(-80, 0); p.quadraticCurveTo(-15, -31, 69, 0); }); palm(c, 0, -6, .8, motion); palm(c, -23, -5, .53, motion); c.restore();
  // Distant seabirds.
  for (let i = 0; i < 3; i++) { const x = ((320 + i * 47 - d * .08) % 580 + 580) % 580; const y = water - 91 + Math.sin(i * 2) * 22; path(c, null, p => { p.moveTo(x - 7, y); p.quadraticCurveTo(x - 3, y - 5, x, y); p.quadraticCurveTo(x + 4, y - 5, x + 8, y); }, '#799d93', 1.3); }
  c.fillStyle = gradient(c, water, 850, '#69bcae', '#285f68'); c.fillRect(0, water, 480, 850 - water);
  c.fillStyle = gradient(c, water, water + 100, '#f8dfad38', '#f8dfad00'); c.fillRect(0, water, 480, 100);
  for (let i = 0; i < 5; i++) { const x = i * 130 - 150 + Math.sin(motion * .15) * 18;
    path(c, gradient(c, water, 840, '#f7f5be15', '#c1e3b200'), p => { p.moveTo(x, water); p.lineTo(x + 45, water); p.lineTo(x + 180, 850); p.lineTo(x + 80, 850); p.closePath(); }); }
  for (let i = 0; i < 28; i++) {
    const x = ((i * 83.73 - d * .27) % 520 + 520) % 520 - 20;
    const y = water + 25 + (i * 41.4) % (820 - water);
    ellipse(c, x, y + Math.sin(motion + i) * 4, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, '#e8f3cc35');
  }
  // Sandy seabed and gently moving sea grass frame the action.
  path(c, '#578c81', p => { p.moveTo(0, 833); p.bezierCurveTo(120, 807, 172, 852, 282, 832); p.quadraticCurveTo(398, 803, 480, 825); p.lineTo(480, 850); p.lineTo(0, 850); });
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 8; i++) { const x = side ? 475 - i * 9 : i * 9 - 15; const h = 37 + (i * 31) % 112;
      path(c, i % 2 ? '#6b9d7b' : '#3f7e6c', p => { p.moveTo(x - 4, 850); p.bezierCurveTo(x - 18, 800, x + Math.sin(motion + i) * 12, 850 - h, x + 12, 840 - h); p.bezierCurveTo(x + 2, 820 - h, x + 20, 805, x + 5, 850); }, '#386f63', .7);
    }
    ellipse(c, side ? 456 : 23, 836, 25, 11, '#96b5a0'); ellipse(c, side ? 426 : 57, 844, 17, 9, '#81a996');
  }
  if (menu) {
    fish(c, 95 + Math.sin(motion * .6) * 18, 558, .8, false, motion); fish(c, 371 - Math.sin(motion * .5) * 12, 594, .65, true, motion);
    fish(c, 340 + Math.sin(motion * .5) * 12, 785, .65, false, motion); fish(c, 367 + Math.sin(motion * .5) * 12, 766, .45, false, motion);
    ellipse(c, 229, water + 4, 80, 10, '#306e7120');
    pelican(c, 217, 418 + Math.sin(motion * 1.6) * 5, 1.72, motion, -.06, outfit);
  } else {
    for (const item of game.items) {
      if (['island', 'reef'].includes(item.kind)) {
        for (const b of terrainBlocks(item)) {
          const outline = p => { b.points.forEach((point, i) => i ? p.lineTo(point.x, point.y) : p.moveTo(point.x, point.y)); p.closePath(); };
          c.save(); c.lineJoin = 'round';
          path(c, gradient(c, b.y, b.y + b.height, '#8eaf96', '#477772'), outline, '#3e6d68', 2);
          c.beginPath(); outline(c); c.clip();
          path(c, '#e4cf9f', p => { p.moveTo(b.x, b.y + 8); p.quadraticCurveTo(b.x + b.width * .25, b.y - 1, b.x + b.width * .52, b.y + 7); p.quadraticCurveTo(b.x + b.width * .78, b.y - 1, b.x + b.width, b.y + 8); p.lineTo(b.x + b.width, b.y + 19); p.quadraticCurveTo(b.x + b.width * .5, b.y + 11, b.x, b.y + 20); p.closePath(); }, '#bfa877', 1);
          const layers = Math.max(1, Math.min(5, Math.ceil(b.height / 95)));
          for (let i = 0; i < layers; i++) {
            const y = b.y + 32 + i * Math.max(1, (b.height - 64) / Math.max(1, layers - 1));
            path(c, i % 2 ? '#70988655' : '#acc09a44', p => p.ellipse(b.x + b.width * (.43 + (i % 2) * .13), y, b.width * .43, Math.min(34, b.height * .34), i % 2 ? -.12 : .15, 0, TAU), '#3d6d6755', 1.3);
            path(c, null, p => { p.moveTo(b.x + b.width * .25, y - 3); p.quadraticCurveTo(b.x + b.width * .43, y + 8, b.x + b.width * .57, y + 2); }, '#d0d0a344', 1.2);
          }
          c.restore();
        }
        if (item.kind === 'island') {
          for (let i = 0; i < 5; i++) ellipse(c, item.x - 45 + i * 22, 329 + Math.sin(i * 2) * 3, 18, 8, i % 2 ? '#79aa80' : '#8db686');
          ellipse(c, item.x + 22, 323, 8, 4, '#f0ccb0'); ellipse(c, item.x + 23, 321, 2, 2, '#f7e7c8');
        } else {
          for (let i = 0; i < 5; i++) path(c, null, p => { p.moveTo(item.x - 60 + i * 27, 610); p.quadraticCurveTo(item.x - 70 + i * 27 + Math.sin(motion + i) * 4, 638, item.x - 55 + i * 27, 657); }, i % 2 ? '#d49a91' : '#e0af95', 5);
        }
      }
      if (item.kind === 'nest') {
        path(c, '#829c83', p => { p.moveTo(item.x - 62, water + 7); p.quadraticCurveTo(item.x - 53, water - 22, item.x - 33, water - 34); p.quadraticCurveTo(item.x, water - 48, item.x + 32, water - 36); p.quadraticCurveTo(item.x + 53, water - 20, item.x + 65, water + 7); p.closePath(); }, '#607a69', 1.2);
        ellipse(c, item.x, water - 26, 54, 14, '#8b6548');
        ellipse(c, item.x, water - 29, 47, 10, '#bb8d5c');
        for (let j = 0; j < 2; j++) {
          const eager = Math.abs(item.x - game.player.x) < 250;
          const hop = eager ? Math.max(0, Math.sin(motion * 9 + j * 2)) * 9 : 0;
          const x = item.x - 18 + j * 34, y = water - 43 - hop;
          ellipse(c, x, y, 15, 18, gradient(c, y - 18, y + 18, '#fff4c8', '#e8c67b'));
          path(c, '#f7dfa0', p => { p.moveTo(x - 9, y - 25); p.lineTo(x - 8, y - 34); p.lineTo(x - 2, y - 27); p.lineTo(x + 3, y - 35); p.lineTo(x + 5, y - 25); p.closePath(); });
          ellipse(c, x - 2, y - 18, 13, 13, '#fff5cf');
          ellipse(c, x - 7, y - 21, 2.2, 3, '#345b52'); ellipse(c, x - 7.5, y - 22, .7, 1, '#fff');
          path(c, '#efb358', p => { p.moveTo(x - 12, y - 20); p.lineTo(x - 30, y - (eager ? 27 : 17)); p.lineTo(x - 13, y - 15); p.closePath(); }, '#b97845', .8);
          if (eager) path(c, '#f8cf77', p => { p.moveTo(x - 12, y - 14); p.lineTo(x - 28, y - 12); p.lineTo(x - 13, y - 9); p.closePath(); }, '#b97845', .8);
          ellipse(c, x - 8, y - 12, 3.5, 2, '#edb6a0');
          path(c, '#f4dda1', p => { p.moveTo(x + 5, y - 1); p.quadraticCurveTo(x + 18, y + 2, x + 8, y + 12); p.quadraticCurveTo(x + 2, y + 8, x + 5, y - 1); }, '#d6b66f', .7);
        }
        for (let j = 0; j < 9; j++) path(c, null, p => { p.moveTo(item.x - 49 + j * 11, water - 28 + j % 2 * 5); p.lineTo(item.x - 31 + j * 9, water - 17 - j % 3 * 3); }, j % 2 ? '#dcb676' : '#c9995e', 2.5);
        if (game.feeding && item.served && item.celebration > 0) {
          const phase = (motion * 4) % 1;
          fish(c, item.x - 25 + phase * 40, water - 71 - Math.sin(phase * Math.PI) * 20, .4, false, motion);
          c.fillStyle = '#e99d8d'; c.font = '18px sans-serif'; c.fillText('♥', item.x + 12, water - 99 - Math.sin(motion * 3) * 4);
        }
      }
      if (item.kind === 'diver') {
        if (['aim', 'locked'].includes(item.phase)) {
          c.save(); c.setLineDash(item.phase === 'aim' ? [5, 8] : []);
          path(c, null, p => { p.moveTo(item.x - 30, item.y); p.lineTo(item.aimX, item.aimY); }, item.phase === 'locked' ? '#ffd28a' : '#c2e8d277', 2); c.restore();
        }
        const kick = Math.sin(motion * 5) * 5;
        ellipse(c, item.x + 8, item.y, 31, 16, gradient(c, item.y - 16, item.y + 16, '#557e89', '#355f70'));
        path(c, '#e9bc62', p => { p.roundRect(item.x - 1, item.y - 21, 29, 11, 5); }, '#8a7448', 1);
        for (let i = 0; i < 2; i++) path(c, i ? '#e3a255' : '#efb565', p => { p.moveTo(item.x + 29, item.y + i * 7); p.quadraticCurveTo(item.x + 48, item.y + i * 10, item.x + 64, item.y - 5 + i * 19 + kick * (i ? -1 : 1)); p.lineTo(item.x + 48, item.y + 13 + i * 8); p.closePath(); }, '#9d704d', 1);
        ellipse(c, item.x - 23, item.y - 4, 15, 15, gradient(c, item.y - 19, item.y + 11, '#efc39f', '#d99d82'));
        path(c, '#8bc8ca', p => p.roundRect(item.x - 39, item.y - 14, 25, 14, 5), '#294f60', 3);
        path(c, null, p => { p.moveTo(item.x - 27, item.y - 14); p.lineTo(item.x - 27, item.y); }, '#d9f1e7aa', 1);
        ellipse(c, item.x - 30, item.y - 8, 2, 3, '#31596a');
        path(c, null, p => { p.moveTo(item.x - 18, item.y + 10); p.quadraticCurveTo(item.x - 35, item.y + 18, item.x - 49, item.y + 4); }, '#e3b78d', 5);
        path(c, null, p => { p.moveTo(item.x - 53, item.y + 3); p.lineTo(item.x - 20, item.y + 3); }, '#405b61', 5);
        path(c, null, p => { p.moveTo(item.x - 51, item.y - 1); p.lineTo(item.x - 58, item.y + 3); p.lineTo(item.x - 51, item.y + 7); }, '#d7d1a8', 1.5);
        if (!reducedMotion) for (let i = 0; i < 2; i++) { const rise = (motion * 20 + i * 17) % 35; ellipse(c, item.x - 22 + i * 7, item.y - 20 - rise, 2 + i, 2 + i, '#d9f5e088'); }
        if (item.phase === 'locked') { c.fillStyle = '#ffe6a1'; c.font = 'bold 22px sans-serif'; c.fillText('!', item.x - 5, item.y - 36); }
      }
      if (item.kind === 'harpoon') {
        c.save(); c.translate(item.x, item.y); c.rotate(Math.atan2(item.vy, item.vx));
        path(c, null, p => { p.moveTo(-24, 0); p.lineTo(13, 0); }, '#f3ddb1', 3);
        path(c, '#d6c18e', p => { p.moveTo(4, -6); p.lineTo(14, 0); p.lineTo(4, 6); p.lineTo(8, 0); p.closePath(); }, '#725f4f', 1); c.restore();
      }
      if (item.kind === 'surfer') {
        const bob = Math.sin(motion * 4) * 3, lean = Math.sin(motion * 2.2) * .05;
        path(c, null, p => { p.moveTo(item.x + 65, WORLD.water + 10); p.quadraticCurveTo(item.x + 18, WORLD.water - 22, item.x - 68, WORLD.water + 7); }, '#e8f6dfcc', 6);
        ellipse(c, item.x, WORLD.water + bob, 50, 7, gradient(c, WORLD.water - 6, WORLD.water + 8, '#f5bc80', '#dc7f68'));
        path(c, null, p => { p.moveTo(item.x - 36, WORLD.water + bob); p.quadraticCurveTo(item.x, WORLD.water + bob + 5, item.x + 38, WORLD.water + bob); }, '#fff0b999', 1.5);
        c.save(); c.translate(item.x, WORLD.water + bob); c.scale(item.escaping ? -1 : 1, 1);
        c.rotate(lean);
        path(c, null, p => { p.moveTo(-20, -4); p.lineTo(-5, -28); p.lineTo(14, -4); }, '#dba77f', 9);
        ellipse(c, -20, -3, 7, 3, '#f1c194'); ellipse(c, 14, -3, 7, 3, '#f1c194');
        path(c, gradient(c, -59, -27, '#7eb0a7', '#527f7c'), p => { p.moveTo(-12, -27); p.lineTo(-14, -56); p.lineTo(8, -59); p.lineTo(14, -27); p.closePath(); }, '#456f6e', 1);
        path(c, null, p => { p.moveTo(-10, -49); p.quadraticCurveTo(-23, -47, -36, -39); p.moveTo(7, -50); p.quadraticCurveTo(20, -56, 31, -61); }, '#edc39a', 7);
        ellipse(c, -36, -39, 4, 4, '#edc39a'); ellipse(c, 31, -61, 4, 4, '#edc39a');
        ellipse(c, -4, -71, 12, 13, '#edc39a');
        path(c, '#8f5f49', p => { p.arc(-4, -75, 13, Math.PI, Math.PI * 2); p.quadraticCurveTo(5, -77, 9, -71); p.closePath(); });
        ellipse(c, -9, -72, 2, 2.5, '#315852'); ellipse(c, -10, -73, .7, .8, '#fff8e3');
        path(c, null, p => { p.moveTo(-12, -65); p.quadraticCurveTo(-6, -61, 0, -66); }, '#8f5f49', 1.3); c.restore();
      }
      if (item.kind === 'gull') {
        const wing = Math.sin(motion * 10) * 18;
        path(c, '#f8f2dc', p => { p.moveTo(item.x, item.y); p.quadraticCurveTo(item.x - 18, item.y - 18, item.x - 38, item.y - wing); p.quadraticCurveTo(item.x - 22, item.y + 2, item.x - 3, item.y + 7); p.closePath(); }, '#918b73', 1);
        path(c, '#fff8e8', p => { p.moveTo(item.x, item.y); p.quadraticCurveTo(item.x + 16, item.y - 18, item.x + 38, item.y - wing); p.quadraticCurveTo(item.x + 24, item.y + 2, item.x + 3, item.y + 7); p.closePath(); }, '#918b73', 1);
        ellipse(c, item.x, item.y, 18, 10, '#eee8d4'); ellipse(c, item.x - 13, item.y - 7, 9, 9, '#fff9e8');
        path(c, '#e6a953', p => { p.moveTo(item.x - 19, item.y - 9); p.lineTo(item.x - 34, item.y - 4); p.lineTo(item.x - 19, item.y - 1); p.closePath(); }, '#ad7043', .8);
        ellipse(c, item.x - 16, item.y - 10, 2.3, 2.5, '#315852'); ellipse(c, item.x - 16.8, item.y - 10.8, .7, .8, '#fff');
        path(c, null, p => { p.moveTo(item.x + 9, item.y + 5); p.lineTo(item.x + 21, item.y + 9); }, '#b8ad91', 2);
      }
      if (item.kind === 'jelly') {
        const pulse = Math.sin(motion * 4) * 2, depth = 20 + item.phase * 65;
        for (let i = -2; i <= 2; i++) path(c, null, p => { p.moveTo(item.x + i * 9, item.y); p.bezierCurveTo(item.x + i * 9 - 12, item.y + depth / 2, item.x + i * 9 + 12, item.y + depth / 2, item.x + i * 9, item.y + depth); }, i % 2 ? '#df9dcecc' : '#efb7dbcc', 3);
        path(c, gradient(c, item.y - 31, item.y + 11, '#f0c8e1', '#cf8fc4'), p => { p.moveTo(item.x - 27 - pulse, item.y); p.quadraticCurveTo(item.x - 25, item.y - 31, item.x, item.y - 31 - pulse); p.quadraticCurveTo(item.x + 25, item.y - 31, item.x + 27 + pulse, item.y); p.quadraticCurveTo(item.x + 18, item.y + 8, item.x + 10, item.y); p.quadraticCurveTo(item.x, item.y + 10, item.x - 10, item.y); p.quadraticCurveTo(item.x - 19, item.y + 8, item.x - 27 - pulse, item.y); }, '#8e6d96', 1);
        ellipse(c, item.x - 9, item.y - 17, 7, 4, '#fff3ed77');
        for (const dx of [-8, 8]) ellipse(c, item.x + dx, item.y - 7, 2.2, 3, '#655879');
        path(c, null, p => { p.moveTo(item.x - 5, item.y); p.quadraticCurveTo(item.x, item.y + 4, item.x + 5, item.y); }, '#755e83', 1.2);
      }
      if (item.kind === 'driftwood') {
        ellipse(c, item.x, item.y + 9, 62, 8, '#e9f5df55');
        path(c, gradient(c, item.y - 10, item.y + 13, '#ba895e', '#865a43'), p => { p.roundRect(item.x - 48, item.y - 10, 96, 23, 10); }, '#6f4e40', 2);
        path(c, null, p => { p.moveTo(item.x - 34, item.y); p.quadraticCurveTo(item.x, item.y + 5, item.x + 32, item.y - 1); }, '#d4a77d', 2);
        ellipse(c, item.x + 41, item.y + 1, 5, 8, '#d9ac7b'); ellipse(c, item.x - 25, item.y - 2, 4, 2, '#765040');
        path(c, '#719b78', p => { p.moveTo(item.x - 16, item.y - 7); p.quadraticCurveTo(item.x - 10, item.y - 21, item.x - 2, item.y - 8); p.closePath(); });
      }
      if (item.kind === 'whirlpool') {
        ellipse(c, item.x, item.y + 3, 100, 42, '#255d6a33');
        for (let i = 0; i < 4; i++) { c.beginPath(); c.ellipse(item.x, item.y, 30 + i * 25, 8 + i * 11, motion * .7 + i * .4, 0, Math.PI * 1.6); c.strokeStyle = i % 2 ? '#bde7d799' : '#e7edc6aa'; c.lineWidth = 3; c.stroke(); }
        ellipse(c, item.x, item.y + 4, 17, 6, '#28596888');
        c.fillStyle = '#d7f7e6'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText('↓', item.x, item.y + 8);
      }
      if (item.kind === 'bubble') {
        ellipse(c, item.x, item.y, 18, 18, gradient(c, item.y - 18, item.y + 18, '#e5fff5aa', '#83d7cf33'));
        c.strokeStyle = '#eafff6'; c.lineWidth = 2; c.beginPath(); c.arc(item.x, item.y, 18, 0, TAU); c.stroke();
        ellipse(c, item.x - 5, item.y - 6, 4, 5, '#ffffffcc');
        c.fillStyle = '#eafff6'; c.font = 'bold 11px sans-serif'; c.textAlign = 'center'; c.fillText('+2s', item.x, item.y + 32);
      }
      if (item.flying) { const leap = Math.sin(motion * 8) * 5; path(c, '#eef4db', p => { p.moveTo(item.x + 2, item.y); p.quadraticCurveTo(item.x + 10, item.y - 25 - leap, item.x + 20, item.y - 2); p.quadraticCurveTo(item.x + 10, item.y - 10, item.x + 2, item.y); }, '#a9b994', .8); }
      if (item.kind === 'fish') fish(c, item.x, item.y, item.golden ? .95 : .8, item.golden, motion);
      if (item.kind === 'turtle') turtle(c, item, motion);
      if (item.kind === 'shark') shark(c, item, motion);
      if (item.kind === 'boat') boat(c, item, water, motion);
    }
    const p = game.player;
    if (p.wet && !reducedMotion) {
      for (let i = 0; i < 5; i++) { c.strokeStyle = '#cff1df66'; c.lineWidth = 1; c.beginPath(); c.arc(p.x - 38 - i * 11, p.y - 5 + Math.sin(motion * 4 + i) * 10, 2 + i % 3, 0, TAU); c.stroke(); }
    }
    c.save();
    pelican(c, p.feedX ?? p.x, p.y, .76, motion, game.feeding ? -.12 + Math.sin(motion * 10) * .06 : playerTilt(p), outfit, p.wet, game.feeding > 0 || p.gulp > .1, game.feeding ? .2 : p.gulp, p.breach, game.cargo, p.breath, reducedMotion); c.restore();
  }
  for (let i = 0; i < 4; i++) {
    path(c, null, p => { for (let x = -10; x <= 490; x += 8) { const y = water + i * 4 + Math.sin(x * .025 + motion * 1.6 + i * .3) * 3; if (x === -10) p.moveTo(x, y); else p.lineTo(x, y); } }, ['#fff1c8cc', '#dceccf88', '#c3ead455', '#b7e4cc22'][i], i === 0 ? 2 : 1);
  }
  for (const e of effects) {
    c.save(); c.globalAlpha = Math.min(1, e.life * 2);
    if (e.kind === 'catch' || e.kind === 'mission' || e.kind === 'trick' || e.kind === 'outsmart' || e.kind === 'delivery') {
      c.fillStyle = '#fff1aa'; c.font = `800 ${e.kind === 'mission' ? 20 : 18}px 'Trebuchet MS', sans-serif`; c.textAlign = 'center'; c.fillText(e.kind === 'mission' ? '+100 ✦' : '+' + e.points, e.x, e.y - (1 - e.life) * 48 - 18);
      if (!reducedMotion) for (let i = 0; i < 5; i++) { const r = (1 - e.life) * 45; ellipse(c, e.x + Math.cos(i * 1.25) * r, e.y + Math.sin(i * 1.25) * r, 2.5 * e.life, 2.5 * e.life, '#fff2b6'); }
    } else if (!reducedMotion && ['splash', 'breach', 'netSplash'].includes(e.kind)) {
      for (let i = 0; i < 9; i++) { const v = i - 4; const age = 1 - e.life; ellipse(c, e.x + v * age * (e.kind === 'netSplash' ? 31 : 19), e.y - Math.sin(age * Math.PI) * ((e.kind === 'breach' ? 45 : 27) - Math.abs(v) * 3), 2 * e.life, 4 * e.life, '#e8f8de'); }
    } else if (e.kind === 'hurt') { c.fillStyle = '#fff0cc'; c.font = "bold 17px 'Trebuchet MS'"; c.textAlign = 'center'; c.fillText('Autsch!', e.x, e.y - 45 - (1 - e.life) * 30); }
    c.restore();
  }
}
