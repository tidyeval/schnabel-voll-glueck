import { airState } from '../src/game.js';
// Test player follows visible fish, surfaces on Pip's warning and gives terrain room.
export function routeController() {
  let refill = false;
  return game => {
    const p = game.player;
    refill = airState(p, game.cargo).level > 0 || refill && p.breath < game.rules.breath - .1;
    const next = game.items.filter(i => i.kind === 'fish' && !i.golden && i.x > p.x - 12).sort((a,b) => a.x - b.x)[0];
    let target = next && next.x < p.x + 150 && !refill ? next.y : 265;
    const reef = game.items.find(i => i.kind === 'reef' && i.x > p.x - 120 && i.x < p.x + 350);
    if (reef) target = refill || !p.wet ? 265 : 530;
    if (game.items.some(i => i.kind === 'buoy' && i.x > p.x - 60 && i.x < p.x + 300)) target = 530;
    if (game.items.some(i => i.kind === 'coral' && i.x > p.x - 110 && i.x < p.x + 250)) target = Math.min(target, 555);
    if (game.items.some(i => i.kind === 'island' && i.x > p.x - 100 && i.x < p.x + 420)) target = 265;
    return target > p.y + p.vy * .11;
  };
}
