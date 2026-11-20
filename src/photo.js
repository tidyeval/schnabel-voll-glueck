// The end-of-round press photo: a proud Pip holds a certificate with the score to the camera and
// gives a wing's thumbs up. Drawn into a 4:5 Polaroid that can be shared as an image.
import { createGame } from './game.js';
import { drawWorld } from './art.js';
import { blink, star } from './cute.js';

export const PHOTO = { width: 1080, height: 1350 };
const TAU = Math.PI * 2;
const FONT = "ui-rounded,'Avenir Next',Avenir,'Trebuchet MS',sans-serif";
const FRAME = { x: 60, y: 60, width: 960, height: 1050 };

/**
 * @typedef {{ stage: number, score: string, fish: string, stageName: string, title: string,
 *   points: string, fishLabel: string, record: string | null, date: string, game: string }} PhotoCard
 */

// The stage's own scenery, without Pip and without encounters, as the photo backdrop.
function backdrop(stage) {
  const scene = document.createElement('canvas'); scene.width = 480; scene.height = 850;
  const game = createGame(() => .5, stage);
  game.items = []; game.nextEncounter = Infinity; game.time = 20;
  Object.assign(game.player, { x: -900, y: 200, wet: false });
  drawWorld(scene.getContext('2d'), game, 'play', 3, undefined, [], true);
  return scene;
}

function roundRect(c, x, y, w, h, r, fill, stroke, width = 1) {
  c.beginPath(); c.roundRect(x, y, w, h, r);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function text(c, value, x, y, size, colour, weight = 800, align = 'center', maxWidth) {
  c.font = `${weight} ${size}px ${FONT}`; c.fillStyle = colour; c.textAlign = align; c.textBaseline = 'alphabetic';
  c.fillText(value, x, y, maxWidth);
}

// Certificate held up in front of Pip's chest, slightly tilted toward the camera.
function certificate(c, card) {
  c.save(); c.rotate(-.07);
  c.shadowColor = '#2a503333'; c.shadowBlur = 24; c.shadowOffsetY = 10;
  roundRect(c, -170, -120, 340, 250, 14, '#fffaf0');
  c.shadowColor = 'transparent';
  roundRect(c, -156, -106, 312, 222, 10, null, '#e2b866', 4);
  roundRect(c, -148, -98, 296, 206, 8, null, '#f0d9a2', 1.5);
  text(c, card.title, 0, -58, 30, '#3d5344', 800, 'center', 280);
  text(c, card.score, 0, 22, 78, '#d9824f', 900, 'center', 290);
  text(c, card.points, 0, 52, 20, '#9c7a4f', 800);
  text(c, `${card.fish} ${card.fishLabel} · ${card.stageName}`, -14, 88, 20, '#5e7a6f', 700, 'center', 236);
  // Ribbon seal in the corner.
  for (const dx of [-12, 12]) { c.beginPath(); c.moveTo(146 + dx * .4, 112); c.lineTo(146 + dx, 158); c.lineTo(146 + dx * .2, 146); c.closePath(); c.fillStyle = '#d96a5a'; c.fill(); }
  c.beginPath(); c.arc(146, 108, 26, 0, TAU); c.fillStyle = '#f2b84b'; c.fill();
  c.beginPath(); c.arc(146, 108, 19, 0, TAU); c.strokeStyle = '#fff3c4'; c.lineWidth = 2.5; c.stroke();
  star(c, 146, 108, 11, '#fff3c4', 0);
  c.restore();
}

// A wing tip curled into a fist with the thumb feather pointing up.
function thumbsUp(c) {
  c.fillStyle = '#fffbed'; c.strokeStyle = '#87957b'; c.lineWidth = 2.2;
  c.beginPath(); c.ellipse(0, 0, 24, 20, -.2, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-6, -14); c.quadraticCurveTo(-12, -46, 2, -50); c.quadraticCurveTo(14, -50, 10, -14); c.closePath(); c.fill(); c.stroke();
  c.strokeStyle = '#b7cbb2'; c.lineWidth = 1.6;
  for (const y of [-2, 7]) { c.beginPath(); c.moveTo(-18, y); c.quadraticCurveTo(0, y + 4, 18, y - 2); c.stroke(); }
}

// Pip seen from the front, looking straight into the camera: round body, big eyes, his tousled
// crown and the long beak pointing down over the chest with the pouch below it.
function frontPip(c, t) {
  const outline = '#786f5d', ink = '#264240';
  const shade = (y1, y2, a, b) => { const g = c.createLinearGradient(0, y1, 0, y2); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const shape = (fill, draw, stroke = outline, width = 3) => { c.beginPath(); draw(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } };
  // Raised wing (viewer's left) ending in the thumbs up.
  shape(shade(420, 720, '#fffbed', '#d8e4cf'), () => { c.moveTo(380, 690); c.quadraticCurveTo(270, 640, 262, 470); c.quadraticCurveTo(300, 450, 318, 480); c.quadraticCurveTo(350, 600, 420, 610); c.closePath(); });
  c.save(); c.translate(282, 430); c.rotate(-.1); c.scale(2.3, 2.3); thumbsUp(c); c.restore();
  // Body.
  shape(shade(500, 960, '#fffcf2', '#d6e2cc'), () => c.ellipse(540, 740, 215, 235, 0, 0, TAU));
  c.beginPath(); c.ellipse(560, 700, 120, 150, 0, 0, TAU); c.fillStyle = '#ffffff55'; c.fill();
  // Other wing hangs down to hold the certificate (its tip is drawn over the certificate).
  shape(shade(600, 900, '#f5f7e8', '#ccdcca'), () => { c.moveTo(690, 585); c.quadraticCurveTo(812, 650, 796, 840); c.quadraticCurveTo(770, 866, 744, 836); c.quadraticCurveTo(756, 700, 668, 640); c.quadraticCurveTo(664, 600, 690, 585); c.closePath(); });
  // Head turned a little to the side and tilted, so the long beak reads in three-quarter view
  // while both eyes still look into the camera.
  c.save(); c.translate(540, 540); c.rotate(.14); c.translate(-540, -540);
  shape(shade(270, 560, '#fffdf4', '#eeefdc'), () => c.ellipse(530, 420, 148, 138, 0, 0, TAU));
  shape('#fffdf2', () => { c.moveTo(478, 300); c.quadraticCurveTo(448, 240, 484, 232); c.quadraticCurveTo(508, 236, 512, 268); c.quadraticCurveTo(512, 210, 546, 214); c.quadraticCurveTo(574, 228, 552, 300); }, outline, 2.6);
  const open = blink(t, .5);
  for (const [x, r] of [[468, 1], [574, .82]]) {
    c.beginPath(); c.ellipse(x, 404, 24 * r, (30 * open + 2) * r, 0, 0, TAU); c.fillStyle = ink; c.fill();
    if (open > .5) { c.beginPath(); c.arc(x + 7 * r, 392, 9 * r, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.beginPath(); c.arc(x - 7 * r, 418, 4.5 * r, 0, TAU); c.fill(); }
    c.beginPath(); c.moveTo(x - 26 * r, 364); c.quadraticCurveTo(x, 352, x + 24 * r, 362); c.strokeStyle = '#aa9271'; c.lineWidth = 3; c.stroke();
  }
  for (const [x, r] of [[430, 1], [606, .75]]) { c.beginPath(); c.ellipse(x, 456, 26 * r, 15 * r, 0, 0, TAU); c.fillStyle = '#f2a9a0aa'; c.fill(); }
  // Pouch sagging under the bill, then the bill reaching forward and down to the side.
  shape(shade(450, 660, '#f6c27e', '#e39a5e'), () => { c.moveTo(520, 468); c.quadraticCurveTo(560, 640, 660, 650); c.quadraticCurveTo(718, 640, 724, 590); c.lineTo(586, 452); c.closePath(); }, '#c07a4a', 2.6);
  shape(shade(430, 600, '#ffd27a', '#f0a64e'), () => { c.moveTo(512, 450); c.quadraticCurveTo(540, 424, 590, 438); c.quadraticCurveTo(680, 520, 734, 584); c.quadraticCurveTo(740, 606, 718, 600); c.quadraticCurveTo(620, 540, 524, 480); c.quadraticCurveTo(506, 468, 512, 450); c.closePath(); }, '#c98550', 2.6);
  c.beginPath(); c.moveTo(540, 452); c.quadraticCurveTo(640, 512, 716, 590); c.strokeStyle = '#d99a52'; c.lineWidth = 2; c.stroke();
  shape('#e5874c', () => { c.moveTo(722, 584); c.quadraticCurveTo(744, 598, 730, 612); c.quadraticCurveTo(724, 600, 712, 596); c.closePath(); }, null);
  c.restore();
}

/** Draws the photo; `t` twinkles the stars around Pip. */
export function drawPhoto(c, card, t = 0, scene = backdrop(card.stage)) {
  const { width, height } = PHOTO;
  c.save();
  // Polaroid paper.
  c.fillStyle = '#fbf6ea'; c.fillRect(0, 0, width, height);
  c.save(); c.beginPath(); c.rect(FRAME.x, FRAME.y, FRAME.width, FRAME.height); c.clip();
  // Scenery: the top of the stage, waterline a little below the middle.
  c.drawImage(scene, 0, 0, 480, 525, FRAME.x, FRAME.y, FRAME.width, FRAME.height);
  // Soft studio light behind Pip.
  const glow = c.createRadialGradient(540, 620, 40, 540, 620, 520);
  glow.addColorStop(0, '#fff6d855'); glow.addColorStop(1, '#fff6d800');
  c.fillStyle = glow; c.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);
  // Pip faces the camera, gives a thumbs up and holds up the certificate.
  frontPip(c, t);
  // He floats: the water closes over his lower body.
  c.fillStyle = '#5fb3a855'; c.fillRect(FRAME.x, 790, FRAME.width, FRAME.y + FRAME.height - 790);
  c.beginPath(); c.ellipse(540, 792, 250, 22, 0, 0, TAU); c.strokeStyle = '#ffffffaa'; c.lineWidth = 4; c.stroke();
  for (const [x, y, r, a] of [[190, 300, 16, 0], [330, 250, 10, 1], [860, 300, 14, 2], [900, 470, 9, 3]]) star(c, x, y, r + Math.sin(t * 3 + a) * 2, '#fff3b0', t + a);
  c.save(); c.translate(540, 905); c.scale(1.35, 1.35); certificate(c, card); c.restore();
  // The holding wing tip over the certificate's right edge.
  c.beginPath(); c.ellipse(772, 850, 30, 40, -.3, 0, TAU); c.fillStyle = '#f5f7e8'; c.fill(); c.strokeStyle = '#87957b'; c.lineWidth = 3; c.stroke();
  c.strokeStyle = '#b7cbb2'; c.lineWidth = 2;
  for (const y of [834, 850, 866]) { c.beginPath(); c.moveTo(752, y); c.quadraticCurveTo(772, y + 4, 792, y); c.stroke(); }
  if (card.record) {
    c.save(); c.translate(860, 190); c.rotate(.12);
    roundRect(c, -130, -36, 260, 72, 36, '#ff8f6b'); text(c, card.record, 0, 12, 30, '#fffaf0', 900, 'center', 230);
    c.restore();
  }
  // Vignette, like a real print.
  const vignette = c.createRadialGradient(540, 585, 380, 540, 585, 820);
  vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#1d3a3a33');
  c.fillStyle = vignette; c.fillRect(FRAME.x, FRAME.y, FRAME.width, FRAME.height);
  c.restore();
  // Caption on the Polaroid border.
  text(c, card.game, 540, 1205, 64, '#264f48', 900);
  text(c, card.date, 540, 1262, 30, '#7d9a8f', 700);
  c.restore();
}

/** Prepares a reusable scene so the animation does not redraw the backdrop every frame. */
export function photoScene(stage) { return backdrop(stage); }

/** The photo as a PNG file for the share sheet. */
export async function photoFile(card) {
  const canvas = document.createElement('canvas'); canvas.width = PHOTO.width; canvas.height = PHOTO.height;
  drawPhoto(canvas.getContext('2d'), card, 0);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Photo could not be encoded')), 'image/png'));
  return new File([blob], 'schnabelglueck.png', { type: 'image/png' });
}
