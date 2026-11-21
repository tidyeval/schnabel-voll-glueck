// The journey map: the five areas as islands on a small sea chart, with the route between them.
// Finished areas show a tick and their record, Pip waits at (or flies to) the current one, locked
// areas lie in fog. Drawn on a canvas that fills the game; positions are fractions of its size.
import { pelican } from './art.js';

const TAU = Math.PI * 2;
const ell = (c, x, y, rx, ry, fill) => { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fillStyle = fill; c.fill(); };
const shape = (c, fill, build, stroke, width = 1) => { c.beginPath(); build(c); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); } };
const FONT = "ui-rounded,'Avenir Next',Avenir,'Trebuchet MS',sans-serif";

/** Where each area sits on the chart (fractions of width and height), in journey order. */
export const MAP_AREAS = { bay: [.27, .76], harbor: [.7, .63], lagoon: [.28, .49], storm: [.67, .355], reef: [.36, .215] };

/** The chart position of a stage, in canvas pixels. */
export function areaPoint(id, width, height) { const [x, y] = MAP_AREAS[id]; return { x: x * width, y: y * height }; }

/** The area nearest a point (canvas pixels), if it is within reach of a tap. */
export function areaAt(ids, x, y, width, height) {
  let best = null, gap = width * .2;
  ids.forEach((id, index) => { const p = areaPoint(id, width, height), d = Math.hypot(p.x - x, p.y - y); if (d < gap) { gap = d; best = index; } });
  return best;
}

function island(c, x, y, w, h) { ell(c, x, y + 6, w + 10, h + 8, '#9fd7c8'); ell(c, x, y, w, h, '#f3dfa6'); ell(c, x - w * .1, y - h * .2, w * .7, h * .55, '#9ccf86'); }
function palm(c, x, y, s = 1) {
  c.strokeStyle = '#8a6a43'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6 * s, y - 20 * s, x + 2 * s, y - 34 * s); c.stroke();
  for (const a of [-2.6, -2, -1.2, -.6]) { c.save(); c.translate(x + 2 * s, y - 34 * s); c.rotate(a); ell(c, 14 * s, 0, 15 * s, 4.5 * s, '#5f9e6e'); c.restore(); }
}
function areaArt(c, id, x, y, s, t) {
  c.save(); c.translate(x, y); c.scale(s, s); c.translate(-x, -y);
  if (id === 'bay') { island(c, x, y, 95, 55); palm(c, x - 30, y - 6); palm(c, x + 25, y - 2, .8); }
  if (id === 'harbor') {
    island(c, x, y, 105, 55);
    for (let i = 0; i < 4; i++) { const hx = x - 60 + i * 34; c.fillStyle = ['#a9d1dd', '#f2c79a', '#d7c6ef', '#f0a896'][i]; c.fillRect(hx, y - 34, 26, 22); shape(c, ['#5f8fa0', '#d58a5c', '#9a84c9', '#c76b5c'][i], p => { p.moveTo(hx - 3, y - 34); p.lineTo(hx + 13, y - 48); p.lineTo(hx + 29, y - 34); p.closePath(); }); }
    c.strokeStyle = '#8b6b48'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + 70, y + 10); c.lineTo(x + 120, y + 10); c.stroke();
  }
  if (id === 'lagoon') {
    island(c, x, y, 110, 60);
    for (let i = 0; i < 5; i++) { const mx = x - 70 + i * 34; c.strokeStyle = '#6b5a3c'; c.lineWidth = 2.5; for (const d of [-8, 0, 8]) { c.beginPath(); c.moveTo(mx, y - 6); c.quadraticCurveTo(mx + d, y + 6, mx + d * 1.4, y + 18); c.stroke(); } ell(c, mx, y - 18, 20, 13, '#4f8f5f'); }
  }
  if (id === 'storm') {
    // A rocky cape with a little lighthouse under a storm cloud, breakers rolling in.
    shape(c, '#8a8f8a', p => { p.moveTo(x - 90, y + 20); p.quadraticCurveTo(x - 60, y - 30, x - 10, y - 20); p.quadraticCurveTo(x + 40, y - 40, x + 80, y + 20); p.closePath(); }, '#6c716c', 2);
    c.fillStyle = '#fffaf0'; c.fillRect(x - 6, y - 62, 18, 42); c.fillStyle = '#e07a68'; c.fillRect(x - 6, y - 50, 18, 8); c.fillRect(x - 6, y - 34, 18, 8);
    shape(c, '#e07a68', p => { p.moveTo(x - 9, y - 62); p.lineTo(x + 3, y - 74); p.lineTo(x + 15, y - 62); p.closePath(); });
    for (let i = 0; i < 3; i++) shape(c, '#ffffffaa', p => { const wx = x - 100 + i * 70, wy = y + 34 + (i % 2) * 12; p.moveTo(wx, wy); p.quadraticCurveTo(wx + 25, wy - 20 - Math.sin(t * 2 + i) * 4, wx + 50, wy); p.quadraticCurveTo(wx + 25, wy - 8, wx, wy); });
    ell(c, x - 40, y - 96, 50, 24, '#7d8796'); ell(c, x + 20, y - 102, 62, 30, '#8b95a3'); ell(c, x - 6, y - 88, 70, 22, '#6f7a8a');
  }
  if (id === 'reef') {
    ell(c, x, y + 10, 120, 40, '#4c8f9a');
    for (let i = 0; i < 6; i++) { const rx = x - 90 + i * 36; c.strokeStyle = ['#f08a7a', '#f5b65c', '#c48ce0'][i % 3]; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(rx, y + 20); c.lineTo(rx, y - 6); c.moveTo(rx, y + 4); c.lineTo(rx - 10, y - 10); c.moveTo(rx, y); c.lineTo(rx + 9, y - 14); c.stroke(); }
  }
  c.restore();
}

/**
 * Draws the chart. `areas`: [{ id, name, done, current, locked, best }] in journey order;
 * `pip`: chart position of Pip; `reached`: how many route legs are drawn as travelled.
 */
export function drawMap(c, { width, height, areas, pip, reached, t, look }) {
  const s = Math.min(width / 600, height / 1100);
  const sea = c.createLinearGradient(0, 0, 0, height); sea.addColorStop(0, '#8fd3c6'); sea.addColorStop(1, '#3a8b8f');
  c.fillStyle = sea; c.fillRect(0, 0, width, height);
  c.strokeStyle = '#ffffff33'; c.lineWidth = 2 * s;
  for (let i = 0; i < 30; i++) { const x = (i * 137) % width, y = (i * 311) % height; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 10 * s, y - 5 * s, x + 20 * s, y); c.stroke(); }
  const points = areas.map(area => areaPoint(area.id, width, height));
  c.lineWidth = 6 * s; c.lineCap = 'round'; c.setLineDash([2 * s, 16 * s]);
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1]; c.strokeStyle = i < reached ? '#fff6d8' : '#ffffff66';
    c.beginPath(); c.moveTo(a.x, a.y); c.quadraticCurveTo((a.x + b.x) / 2 + (i % 2 ? -90 : 90) * s, (a.y + b.y) / 2, b.x, b.y); c.stroke();
  }
  c.setLineDash([]);
  areas.forEach((area, i) => areaArt(c, area.id, points[i].x, points[i].y, s, t));
  areas.forEach((area, i) => {
    if (!area.locked) return;
    const p = points[i], g = c.createRadialGradient(p.x, p.y, 20 * s, p.x, p.y, 190 * s);
    g.addColorStop(0, '#eef6f3dd'); g.addColorStop(1, '#eef6f300'); c.fillStyle = g; c.fillRect(p.x - 200 * s, p.y - 200 * s, 400 * s, 400 * s);
  });
  areas.forEach((area, i) => {
    const bx = points[i].x, by = points[i].y + 78 * s;
    c.font = `800 ${24 * s}px ${FONT}`; c.textAlign = 'center';
    const w = c.measureText(area.name).width + 36 * s;
    shape(c, area.locked ? '#ffffffaa' : '#fffaf0', p => p.roundRect(bx - w / 2, by - 24 * s, w, 44 * s, 22 * s), area.current ? '#e78c57' : null, 3 * s);
    c.fillStyle = area.locked ? '#7d9a8f' : '#214d4d'; c.fillText(area.name, bx, by + 7 * s);
    if (area.done) {
      const cx = bx + w / 2 - 6 * s, cy = by - 22 * s; ell(c, cx, cy, 17 * s, 17 * s, '#6e9e7c');
      c.strokeStyle = '#fffaf0'; c.lineWidth = 4 * s; c.beginPath(); c.moveTo(cx - 8 * s, cy); c.lineTo(cx - 2 * s, cy + 7 * s); c.lineTo(cx + 9 * s, cy - 8 * s); c.stroke();
    }
    if (area.best) { c.font = `800 ${20 * s}px ${FONT}`; c.fillStyle = '#fff6d8'; c.fillText(area.best, bx, by + 46 * s); }
    if (area.locked) { c.font = `${28 * s}px sans-serif`; c.fillText('🔒', bx, by - 40 * s); }
  });
  pelican(c, { x: pip.x + 95 * s, y: pip.y - 10 * s + Math.sin(t * 3) * 6 * s, scale: .75 * s, time: t, happy: true, ...look });
}
