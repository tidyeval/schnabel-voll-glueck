// How each fish species looks (gameplay values: species.js). Every stage has its own fish.
import { cuteEye, blink } from './cute.js';

const TAU = Math.PI * 2;
const ell = (c, x, y, rx, ry, fill, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fillStyle = fill; c.fill(); };
const shape = (c, fill, build, stroke, width = 1) => { c.beginPath(); build(c); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } };
const grad = (c, y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

/** Species look: body size (rx, ry), tail beat, colours and optional pattern or extras. */
export const SPECIES = {
  sardine: { rx: 15, ry: 6.5, beat: 12, body: ['#dfe9ec', '#9fb5bd'], belly: '#f4f8f8', tail: '#aebfc6', fin: '#b8c8cd', edge: '#6f8790', spots: '#5f7f8a88' },
  mackerel: { rx: 20, ry: 8.5, beat: 11, body: ['#79b3b0', '#4c8a95'], belly: '#eef4ee', tail: '#5f9aa2', fin: '#6aa4a6', edge: '#3d6e76', bars: 5, barColour: '#2f5d64aa', topFin: 6 },
  angelfish: { rx: 15, ry: 14, beat: 6, body: ['#ffe48a', '#f2bd4f'], belly: '#fff3c7', tail: '#f4c65a', fin: '#f6cf6a', edge: '#b88a37', stripes: [[-2, 2.6], [7, 2.6]], stripeColour: '#5b7fa8', topFin: 12 },
  flyingfish: { rx: 18, ry: 7.5, beat: 10, body: ['#a9d2ee', '#5e95c4'], belly: '#eef6fb', tail: '#6fa3cf', fin: '#cfe6f6', edge: '#46729c', wings: true },
  clownfish: { rx: 16, ry: 9.5, beat: 9, body: ['#ffa765', '#ef7c3c'], belly: '#ffd2b0', tail: '#f28a4a', fin: '#f59457', edge: '#b9562a', stripes: [[-6, 3], [6, 2.8]], stripeColour: '#fffaf0', stripeEdge: '#3a2f2a' },
  tang: { rx: 17, ry: 11, beat: 8, body: ['#6fa5f0', '#3f6fcf'], belly: '#b9d4fa', tail: '#ffd34f', fin: '#5585dd', edge: '#2d4f99', topFin: 5 },
  lanternfish: { rx: 16, ry: 9, beat: 8, body: ['#7a6fb6', '#4a3f86'], belly: '#b9b0e6', tail: '#6a5fa8', fin: '#8a7fc4', edge: '#3a3070', lantern: true, glow: '#fff6b018' },
};


/** Draws a species fish facing left at (x, y); `tilt` turns it like the game's fish. */
export function drawSpecies(c, id, x, y, scale, t, tilt = 0) {
  const s = SPECIES[id];
  const swim = Math.sin(t * (tilt ? s.beat * 1.6 : s.beat)) * .3;
  c.save(); c.translate(x, y + Math.sin(t * 2.3) * 2); c.scale(scale, scale); c.rotate(Math.sin(t * 3) * .05 - swim * .12 + tilt);
  const { rx, ry } = s;
  if (s.glow) { c.globalCompositeOperation = 'lighter'; ell(c, -rx * .2, 0, rx * 1.5, ry * 2, s.glow); c.globalCompositeOperation = 'source-over'; }
  if (s.wings) for (const k of [0, 1]) { // flying fish: long pectoral wings, beating faster in the air
    c.save(); c.translate(-4, 0); c.rotate(-.15 + k * .3 + Math.sin(t * (tilt ? 14 : 6)) * .12);
    shape(c, k ? s.fin + 'cc' : s.fin, p => { p.moveTo(0, 0); p.quadraticCurveTo(12, -16, 30, -14); p.quadraticCurveTo(20, -4, 6, 3); p.closePath(); }, s.edge, 1); c.restore();
  }
  c.save(); c.translate(rx * .55, 0); c.rotate(swim); c.translate(-rx * .55, 0);
  shape(c, s.tail, p => { p.moveTo(rx * .5, 0); p.lineTo(rx + 12, -ry - 2); p.quadraticCurveTo(rx + 6, 0, rx + 12, ry + 2); p.closePath(); }, s.edge, 1); c.restore();
  if (s.topFin) shape(c, s.fin, p => { p.moveTo(-rx * .2, -ry + 2); p.quadraticCurveTo(rx * .1, -ry - s.topFin, rx * .55, -ry * .6); p.closePath(); }, s.edge, .9);
  ell(c, 0, 0, rx, ry, grad(c, -ry, ry, ...s.body));
  c.save(); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.clip();
  if (s.stripes) s.stripes.forEach(([sx, w]) => shape(c, s.stripeColour, p => { p.ellipse(sx, 0, w, ry + 2, 0, 0, TAU); }, s.stripeEdge, 1.4));
  if (s.bars) for (let i = 0; i < s.bars; i++) { c.strokeStyle = s.barColour; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-rx * .1 + i * 7, -ry); c.quadraticCurveTo(i * 7 + 4, -ry * .2, -rx * .1 + i * 7 - 2, -2); c.stroke(); }
  if (s.spots) for (let i = 0; i < 5; i++) ell(c, -4 + i * 5 - (i % 2) * 2, -ry * .35 + (i % 2) * 5, 1.8, 1.8, s.spots);
  c.restore();
  ell(c, -rx * .25, ry * .3, rx * .55, ry * .42, s.belly);
  c.strokeStyle = s.edge; c.lineWidth = 1; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, TAU); c.stroke();
  if (s.lantern) {
    c.strokeStyle = s.edge; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-rx * .6, -ry * .8); c.quadraticCurveTo(-rx * .9, -ry - 14, -rx - 6, -ry - 10); c.stroke();
    const r = 4 + Math.sin(t * 4) * .8; ell(c, -rx - 6, -ry - 10, r, r, '#fff6b0'); ell(c, -rx - 6, -ry - 10, 9, 9, '#fff6b033');
  }
  cuteEye(c, -rx * .55, -ry * .2, Math.max(3.4, ry * .38), blink(t, y * .013), '#2b4f4c');
  ell(c, -rx * .38, ry * .3, 3, 1.7, '#f3868a55');
  shape(c, null, p => { p.moveTo(-rx * .86, ry * .28); p.quadraticCurveTo(-rx * .72, ry * .5, -rx * .6, ry * .36); }, s.edge, 1);
  c.restore();
}
