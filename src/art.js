import { WORLD, clamp, netShape, playerTilt } from './game.js';
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
  path(c, '#fffdf0', p => { p.moveTo(-58, 8); p.bezierCurveTo(-68, -6, -45, -18, -31, -12); p.bezierCurveTo(-26, -42, 15, -38, 21, -17); p.bezierCurveTo(48, -27, 62, -5, 48, 10); p.quadraticCurveTo(0, 21, -58, 8); }); c.restore();
}
function palm(c, x, y, scale, t) {
  c.save(); c.translate(x, y); c.scale(scale, scale); c.rotate(Math.sin(t * .5) * .015);
  path(c, '#ad9670', p => { p.moveTo(-6, 2); p.quadraticCurveTo(10, -46, 0, -100); p.lineTo(5, -100); p.quadraticCurveTo(21, -47, 6, 2); p.closePath(); });
  for (let i = 0; i < 6; i++) {
    c.save(); c.translate(3, -98); c.rotate((i - 2.5) * .58);
    path(c, i % 2 ? '#6c9c78' : '#427d67', p => { p.moveTo(0, 0); p.quadraticCurveTo(38, -32, 65, 8); p.quadraticCurveTo(30, -7, 0, 0); }); c.restore();
  }
  ellipse(c, 0, -92, 5, 6, '#a17c53'); ellipse(c, 9, -93, 5, 6, '#8e7952'); c.restore();
}
function island(c, x, water, t) {
  c.save(); c.translate(x, water);
  path(c, '#c0d3b3', p => { p.moveTo(-170, -8); p.quadraticCurveTo(-65, -120, 26, -62); p.quadraticCurveTo(62, -32, 120, -6); p.closePath(); });
  path(c, '#f4e8c2', p => { p.moveTo(-170, 0); p.quadraticCurveTo(-88, -23, -4, -10); p.quadraticCurveTo(82, -12, 129, 2); p.closePath(); });
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
  c.save(); c.translate(x, y); c.scale(scale, scale);
  const col = golden ? '#ffda73' : '#f3bd9c';
  path(c, golden ? '#e9ae57' : '#da997f', p => { p.moveTo(9, 0); p.lineTo(26, -12 + Math.sin(t * 7) * 2); p.quadraticCurveTo(22, 0, 26, 12); p.closePath(); });
  ellipse(c, 0, 0, 17, 10, col); ellipse(c, -4, 3, 10, 5, golden ? '#ffe9a3' : '#ffdac1');
  path(c, golden ? '#eaae51' : '#db947b', p => { p.moveTo(-1, -8); p.lineTo(8, -16); p.lineTo(12, -5); p.closePath(); });
  ellipse(c, -9, -2, 2.4, 3, '#3a6665'); ellipse(c, -9.6, -3.1, .7, .9, '#fff6db');
  if (golden) { c.strokeStyle = '#fff0bd'; c.lineWidth = 1.7; c.beginPath(); c.moveTo(-4, -19); c.lineTo(-4, -27); c.moveTo(-8, -23); c.lineTo(0, -23); c.stroke(); }
  c.restore();
}
export function pelican(c, x, y, scale, t, tilt = 0, outfit = 'classic', wet = false, happy = false, gulp = 0, breach = 0) {
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(scale, scale);
  // Soft layers give Pip volume without image downloads or sprite sheets.
  path(c, '#d9e8d9', p => { p.moveTo(-43, 9); p.lineTo(-63, -6); p.quadraticCurveTo(-62, 15, -39, 22); });
  const bite = gulp > 0 ? Math.sin((1 - gulp / .42) * Math.PI) : 0;
  const flap = Math.sin(t * (wet ? 7 : 11)) * (wet ? .15 : 1) + breach;
  if (!wet) path(c, '#e6efdf', p => { p.moveTo(-24, -6); p.bezierCurveTo(-56, -17, -67, -32 - flap * 45, -44, -25 - flap * 43); p.quadraticCurveTo(-15, -24, 4, 0); });
  c.save(); if (wet) { c.translate(-5, -8); c.rotate(-.3); }
  c.strokeStyle = '#dc9c64'; c.lineWidth = 5; c.lineCap = 'round';
  for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(-17 + i * 17, 27); c.lineTo(-24 + i * 19, 36 + flap * 2); c.stroke();
    path(c, '#e6aa6a', p => { p.moveTo(-29 + i * 19, 33 + flap * 2); p.lineTo(-39 + i * 19, 40 + flap * 2); p.quadraticCurveTo(-25 + i * 19, 46 + flap * 2, -15 + i * 19, 39 + flap * 2); p.closePath(); }); }
  c.restore();
  ellipse(c, -17, 7, 38, 30 + bite * 2, gradient(c, -20, 38, '#fffdee', '#e4ead4'), -.16);
  path(c, gradient(c, -57, 21, '#fffdf0', '#f3f2dc'), p => { p.moveTo(1, 17); p.bezierCurveTo(-11, 3, -5, -15, -1, -39); p.bezierCurveTo(5, -69, 42, -65, 44, -40); p.bezierCurveTo(45, -25, 20, -15, 20, 4); p.quadraticCurveTo(17, 20, 1, 17); });
  path(c, '#fffdee', p => { p.moveTo(4, -56); p.quadraticCurveTo(-3, -69, 4, -72); p.quadraticCurveTo(8, -70, 12, -61); p.quadraticCurveTo(10, -75, 17, -74); p.quadraticCurveTo(22, -68, 21, -61); });
  path(c, gradient(c, -35, 2, '#f2c16f', '#e2a363'), p => { p.moveTo(37, -40); p.lineTo(91, -25); p.bezierCurveTo(71, -16 + bite * 12, 55, 8 + bite * 14, 39, -9); p.quadraticCurveTo(31, -19, 37, -40); });
  c.save(); c.translate(35, -40); c.rotate(-bite * .22); c.translate(-35, 40);
  path(c, '#ffda85', p => { p.moveTo(35, -43); p.quadraticCurveTo(67, -38, 94, -27); p.quadraticCurveTo(101, -22, 87, -22); p.lineTo(35, -30); p.closePath(); }, '#dea05e', .7);
  c.restore();
  path(c, null, p => { p.moveTo(38, -30); p.quadraticCurveTo(66, -26, 90, -25); }, '#c98a58', 1.2);
  if (happy) { path(c, null, p => { p.moveTo(20, -43); p.quadraticCurveTo(26, -49, 31, -43); }, '#2b5050', 2.7); }
  else { ellipse(c, 25, -46, 4.1, 5.1, '#284b4c'); ellipse(c, 26.3, -48, 1.3, 1.5, '#fff'); }
  ellipse(c, 21, -35, 5.4, 3.2, '#edb6a0');
  c.save(); if (wet) { c.translate(-12, 5); c.scale(.8, .6); }
  else { c.translate(-30, 0); c.rotate(-.35 - flap * 1.05); c.scale(1, 1.65); c.translate(30, 0); }
  path(c, gradient(c, 0, 35, '#f2f5e5', '#d9e5d1'), p => { p.moveTo(-35, -3); p.bezierCurveTo(-16, -7, 0, 7, -5, 22); p.quadraticCurveTo(-14, 32, -23, 26); p.quadraticCurveTo(-37, 25, -43, 12); p.quadraticCurveTo(-48, 3, -35, -3); }, '#d2dfc8', .7);
  for (let i = 0; i < 3; i++) path(c, null, p => { p.moveTo(-33 + i * 8, 12); p.quadraticCurveTo(-29 + i * 8, 19, -25 + i * 8, 20); }, '#c6d8c3', .9);
  c.restore();
  if (outfit === 'flower') { for (let i = 0; i < 5; i++) ellipse(c, 7 + Math.cos(i / 5 * TAU) * 7, -60 + Math.sin(i / 5 * TAU) * 7, 5, 5, '#eaa5a2'); ellipse(c, 7, -60, 4, 4, '#ffe0a0'); }
  if (outfit === 'sailor') { path(c, '#f9fbef', p => { p.moveTo(1, -62); p.lineTo(-1, -74); p.quadraticCurveTo(21, -84, 35, -72); p.lineTo(32, -61); p.closePath(); }); c.fillStyle = '#43727d'; c.fillRect(0, -65, 34, 5); }
  c.restore();
}
function shark(c, item, t) {
  c.save(); c.translate(item.x, item.y); c.rotate(Math.sin(t * 1.5) * .04);
  path(c, '#668d9b', p => { p.moveTo(40, 0); p.lineTo(79, -29); p.lineTo(68, 0); p.lineTo(82, 26); p.closePath(); });
  path(c, '#6d94a0', p => { p.moveTo(-7, -18); p.quadraticCurveTo(6, -50, 21, -51); p.lineTo(26, -14); p.closePath(); });
  ellipse(c, 0, 0, 55, 26, gradient(c, -26, 25, '#84aab0', '#648d9a')); ellipse(c, -11, 13, 39, 11, '#bccfc7');
  path(c, '#6e949b', p => { p.moveTo(3, 8); p.lineTo(24, 34); p.lineTo(25, 9); });
  ellipse(c, -33, -4, 4, 4.5, '#2e535e'); ellipse(c, -34, -5, 1, 1.3, '#fff');
  path(c, null, p => { p.moveTo(-41, 9); p.quadraticCurveTo(-28, 17, -14, 7); }, '#446876', 2);
  for (let i = 0; i < 3; i++) path(c, null, p => { p.moveTo(-7 + i * 5, -5); p.quadraticCurveTo(-11 + i * 5, 1, -7 + i * 5, 7); }, '#597e88', 1.4);
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
  ellipse(c, -2, -55, 17, 20, '#edc3a0');
  ellipse(c, -15, -49, 6, 4, '#e7a58c'); ellipse(c, 11, -49, 4, 3, '#e7a58c');
  path(c, '#e2b267', p => { p.moveTo(-24, -64); p.lineTo(-17, -82); p.quadraticCurveTo(0, -89, 15, -79); p.lineTo(22, -63); p.closePath(); });
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
  c.clearRect(0, 0, 480, 850);
  c.fillStyle = gradient(c, 0, water, '#d2eee8', '#f4f1d8'); c.fillRect(0, 0, 480, water);
  ellipse(c, 397, water - 140, 47, 47, '#fff7d399'); ellipse(c, 397, water - 140, 32, 32, '#fff7cd');
  cloud(c, 68 - d * .025 % 160, 92, .95, .55); cloud(c, 406 - d * .015 % 120, 125, .65, .55); cloud(c, 240 - d * .02 % 100, water - 122, .45, .55);
  island(c, 24 - d * .055 % 780, water - 6, t);
  island(c, 805 - d * .055 % 780, water - 6, t);
  c.save(); c.translate(415, water - 1); c.scale(.5, .5); path(c, '#dfdcb8', p => { p.moveTo(-80, 0); p.quadraticCurveTo(-15, -31, 69, 0); }); palm(c, 0, -6, .8, t); palm(c, -23, -5, .53, t); c.restore();
  // Distant seabirds.
  for (let i = 0; i < 3; i++) { const x = ((320 + i * 47 - d * .08) % 580 + 580) % 580; const y = water - 91 + Math.sin(i * 2) * 22; path(c, null, p => { p.moveTo(x - 7, y); p.quadraticCurveTo(x - 3, y - 5, x, y); p.quadraticCurveTo(x + 4, y - 5, x + 8, y); }, '#799d93', 1.3); }
  c.fillStyle = gradient(c, water, 850, '#73c6b7', '#225e6b'); c.fillRect(0, water, 480, 850 - water);
  for (let i = 0; i < 5; i++) { const x = i * 130 - 150 + Math.sin(t * .15) * 18;
    path(c, gradient(c, water, 840, '#f7f5be15', '#c1e3b200'), p => { p.moveTo(x, water); p.lineTo(x + 45, water); p.lineTo(x + 180, 850); p.lineTo(x + 80, 850); p.closePath(); }); }
  for (let i = 0; i < 28; i++) {
    const x = ((i * 83.73 - d * .27) % 520 + 520) % 520 - 20;
    const y = water + 25 + (i * 41.4) % (820 - water);
    ellipse(c, x, y + Math.sin(t + i) * 4, i % 3 === 0 ? 2 : 1, i % 3 === 0 ? 2 : 1, '#e8f3cc35');
  }
  // Sandy seabed and gently moving sea grass frame the action.
  path(c, '#578c81', p => { p.moveTo(0, 833); p.bezierCurveTo(120, 807, 172, 852, 282, 832); p.quadraticCurveTo(398, 803, 480, 825); p.lineTo(480, 850); p.lineTo(0, 850); });
  for (let side = 0; side < 2; side++) {
    for (let i = 0; i < 8; i++) { const x = side ? 475 - i * 9 : i * 9 - 15; const h = 37 + (i * 31) % 112;
      path(c, i % 2 ? '#629c82' : '#438975', p => { p.moveTo(x - 4, 850); p.bezierCurveTo(x - 18, 800, x + Math.sin(t + i) * 12, 850 - h, x + 12, 840 - h); p.bezierCurveTo(x + 2, 820 - h, x + 20, 805, x + 5, 850); });
    }
    ellipse(c, side ? 456 : 23, 836, 25, 11, '#96b5a0'); ellipse(c, side ? 426 : 57, 844, 17, 9, '#81a996');
  }
  if (menu) {
    fish(c, 95 + Math.sin(t * .6) * 18, 558, .8, false, t); fish(c, 371 - Math.sin(t * .5) * 12, 594, .65, true, t);
    fish(c, 340 + Math.sin(t * .5) * 12, 785, .65, false, t); fish(c, 367 + Math.sin(t * .5) * 12, 766, .45, false, t);
    ellipse(c, 229, water + 4, 80, 10, '#306e7120');
    pelican(c, 217, 418 + Math.sin(t * 1.6) * (reducedMotion ? 0 : 5), 1.72, t, -.06, outfit);
  } else {
    for (const item of game.items) {
      if (item.kind === 'fish') fish(c, item.x, item.y, item.golden ? .95 : .8, item.golden, t);
      if (item.kind === 'shark') shark(c, item, t);
      if (item.kind === 'boat') boat(c, item, water, t);
    }
    const p = game.player;
    if (p.wet) {
      for (let i = 0; i < 5; i++) { c.strokeStyle = '#cff1df66'; c.lineWidth = 1; c.beginPath(); c.arc(p.x - 38 - i * 11, p.y - 5 + Math.sin(t * 4 + i) * 10, 2 + i % 3, 0, TAU); c.stroke(); }
    }
    c.save();
    pelican(c, p.x, p.y, .76, t, playerTilt(p), outfit, p.wet, p.gulp > .1, p.gulp, p.breach); c.restore();
  }
  for (let i = 0; i < 4; i++) {
    path(c, null, p => { for (let x = -10; x <= 490; x += 8) { const y = water + i * 4 + Math.sin(x * .025 + t * 1.6 + i * .3) * 3; if (x === -10) p.moveTo(x, y); else p.lineTo(x, y); } }, ['#eef5d7aa', '#d5f1d366', '#c3ead444', '#b7e4cc22'][i], i === 0 ? 2 : 1);
  }
  for (const e of effects) {
    c.save(); c.globalAlpha = Math.min(1, e.life * 2);
    if (e.kind === 'catch' || e.kind === 'mission') {
      c.fillStyle = '#fff1aa'; c.font = `800 ${e.kind === 'mission' ? 20 : 18}px 'Trebuchet MS', sans-serif`; c.textAlign = 'center'; c.fillText(e.kind === 'mission' ? '+100 ✦' : '+' + e.points, e.x, e.y - (1 - e.life) * 48 - 18);
      for (let i = 0; i < 5; i++) { const r = (1 - e.life) * 45; ellipse(c, e.x + Math.cos(i * 1.25) * r, e.y + Math.sin(i * 1.25) * r, 2.5 * e.life, 2.5 * e.life, '#fff2b6'); }
    } else if (['splash', 'breach', 'netSplash'].includes(e.kind)) {
      for (let i = 0; i < 9; i++) { const v = i - 4; const age = 1 - e.life; ellipse(c, e.x + v * age * (e.kind === 'netSplash' ? 31 : 19), e.y - Math.sin(age * Math.PI) * ((e.kind === 'breach' ? 45 : 27) - Math.abs(v) * 3), 2 * e.life, 4 * e.life, '#e8f8de'); }
    } else if (e.kind === 'hurt') { c.fillStyle = '#fff0cc'; c.font = "bold 17px 'Trebuchet MS'"; c.textAlign = 'center'; c.fillText('Autsch!', e.x, e.y - 45 - (1 - e.life) * 30); }
    c.restore();
  }
}
