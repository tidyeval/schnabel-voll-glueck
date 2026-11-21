// The end-of-round press photo: a proud Pip, drawn as in the game, cheers next to a certificate
// with the score and gives a wing's thumbs up. Drawn into a 4:5 Polaroid that can be shared as an image.
import { createGame } from './game.js';
import { drawWorld, pelican } from './art.js';
import { star } from './cute.js';

export const PHOTO = { width: 1080, height: 1350 };
const TAU = Math.PI * 2;
const FONT = "ui-rounded,'Avenir Next',Avenir,'Trebuchet MS',sans-serif";
const FRAME = { x: 60, y: 60, width: 960, height: 1050 };

/**
 * @typedef {{ stage: number, outfit?: string, score: string, fish: string, stageName: string, title: string,
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

// Pip as he looks in the game, in profile with his chest out and a cheeky wink toward us,
// both wings raised in a cheer and one wing tip giving a thumbs up.
const PIP = { x: 470, y: 700, scale: 3.9 };
function proudPip(c, t, outfit = 'classic') {
  pelican(c, { x: PIP.x, y: PIP.y, scale: PIP.scale, time: t, tilt: -.12, happy: true, cargo: 6, outfit,
    expression: { cheer: true, wink: 1, look: -.08 } });
  // Thumbs up at the tip of the near wing (wing tip in Pip's frame, rotated by his tilt).
  const tip = { x: -64, y: -70 }, a = -.12;
  const x = PIP.x + (tip.x * Math.cos(a) - tip.y * Math.sin(a)) * PIP.scale, y = PIP.y + (tip.x * Math.sin(a) + tip.y * Math.cos(a)) * PIP.scale;
  c.save(); c.translate(x, y); c.rotate(-.25); c.scale(2.1, 2.1); thumbsUp(c); c.restore();
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
  // Pip in profile, cheering, with the certificate held up in front of him.
  proudPip(c, t, card.outfit);
  // He floats: the water closes over his lower body.
  c.fillStyle = '#5fb3a855'; c.fillRect(FRAME.x, 790, FRAME.width, FRAME.y + FRAME.height - 790);
  c.beginPath(); c.ellipse(540, 792, 250, 22, 0, 0, TAU); c.strokeStyle = '#ffffffaa'; c.lineWidth = 4; c.stroke();
  for (const [x, y, r, a] of [[190, 300, 16, 0], [330, 250, 10, 1], [860, 300, 14, 2], [900, 470, 9, 3]]) star(c, x, y, r + Math.sin(t * 3 + a) * 2, '#fff3b0', t + a);
  c.save(); c.translate(540, 905); c.scale(1.35, 1.35); certificate(c, card); c.restore();
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
