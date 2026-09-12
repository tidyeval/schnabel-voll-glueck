import { airState, hitsTerrain, WORLD } from '../src/game.js';
// Test player follows visible fish, surfaces on Pip's warning and gives terrain room.
export function routeController() {
  let refill = false;
  return game => {
    const p = game.player;
    refill = (p.wet && p.breath < 4.5) || airState(p, game.cargo).level > 0 || refill && p.breath < WORLD.breath - .1;
    const next = game.items.filter(i => i.kind === 'fish' && !i.golden && i.lane !== 'alternate' && i.x > p.x - 12).sort((a,b) => a.x - b.x)[0];
    let target = next && next.x < p.x + 150 && !refill ? next.y : 265;
    const reef = game.items.find(i => i.kind === 'reef' && i.x > p.x - 120 && i.x < (i.warned ? 900 : p.x + 350));
    if (reef) target = p.wet && (!refill || reef.x < p.x + 170) ? 530 : 265;
    if (game.items.some(i => i.kind === 'buoy' && i.x > p.x - 60 && i.x < (i.warned ? 900 : p.x + 300))) target = 530;
    if (game.items.some(i => i.kind === 'coral' && i.x > p.x - 110 && i.x < (i.warned ? 900 : p.x + 250))) target = Math.min(target, 555);
    if (game.items.some(i => i.kind === 'island' && i.x > p.x - 100 && i.x < (i.warned ? 900 : p.x + 420))) target = 265;
    if (game.items.some(i => i.kind === 'boat' && i.x > p.x - 100 && i.x < 480)) target = 620;
    if (game.items.some(i => i.kind === 'diver' && i.x > p.x - 80 && i.x < 470)) target = 430;
    const sharks = game.items.filter(i => i.kind === 'shark' && !i.caught && i.x > p.x - 90 && i.x < 500);
    if (sharks.length) {
      const terrain = game.items.filter(item => ['island','reef','buoy','coral'].includes(item.kind) && item.x > p.x - 120 && item.x < 500);
      const candidates = [265, 420, 480, 500, 535, 570, 590, 650].filter(y => !terrain.some(item => [-20,0,20].some(margin => hitsTerrain({x:p.x,y:y+margin}, {...item,x:p.x}))));
      const clearance = y => Math.min(...sharks.map(shark=>Math.abs(y-shark.y)));
      const sameSide = candidates.filter(y => sharks.every(shark => shark.y < Math.min(p.y,y)-38 || shark.y > Math.max(p.y,y)+38));
      target = p.y < 380 && candidates.includes(265) ? 265 : (sameSide.length ? sameSide : candidates).sort((a,b) => clearance(b)-clearance(a) || Math.abs(a-p.y)-Math.abs(b-p.y))[0] ?? target;
    }
    return target > p.y + p.vy * .11;
  };
}
