// Game feel: hit-stop, camera shake, slow motion and short-lived particles.
// Purely presentational; with reduced motion only the time scale stays neutral.
import { WORLD } from './game.js';

export function createJuice(reducedMotion) {
  let particles = [], rings = [], squash = 0, sparkle = 0, joy = 0, shiver = 0, shake = 0, shakePower = 0, freeze = 0, slow = 0, flash = 0, flashColour = '#fff', pulse = 0, trail = 0, rush = 0;
  const rand = (min, max) => min + Math.random() * (max - min);
  const spawn = (kind, x, y, vx, vy, life, size, colour) => {
    if (!reducedMotion && particles.length < 170) particles.push({ kind, x, y, vx, vy, life, max: life, size, colour });
  };
  const burst = (x, y, count, speed, colour) => {
    for (let i = 0; i < count; i++) { const a = rand(0, Math.PI * 2), v = rand(.4, 1) * speed; spawn('spark', x, y, Math.cos(a) * v, Math.sin(a) * v, rand(.35, .7), rand(1.6, 3), colour); }
  };
  return {
    reset() { particles = []; rings = []; squash = sparkle = joy = shiver = 0; shake = freeze = slow = flash = pulse = rush = 0; },
    // Fraction of real time the simulation advances this frame.
    timeScale(dt) {
      if (reducedMotion) return 1;
      if (freeze > 0) { freeze -= dt; return 0; }
      if (slow > 0) { slow -= dt; return slow > .14 ? .3 : 1 - .7 * Math.max(0, slow) / .14; }
      return 1;
    },
    onEvent(event, game) {
      const water = WORLD.water;
      if (event.kind === 'splash' || event.kind === 'breach') {
        const power = event.power ?? .6, up = event.kind === 'breach';
        rings.push({ x: event.x, life: 1, power: .6 + power * .8 });
        for (let i = 0; i < 7 + power * 12; i++) spawn('drop', event.x + rand(-14, 14), water - 2, rand(-110, 110) * (.5 + power) - (up ? 0 : 40), -rand(140, 300) * (.55 + power * (up ? .9 : .6)), rand(.5, .95), rand(1.6, 3.2));
        if (!up) for (let i = 0; i < 6 + power * 8; i++) spawn('bubble', event.x + rand(-18, 18), water + rand(14, 60), rand(-60, 10), -rand(20, 70), rand(.5, 1.1), rand(1.5, 4.5));
        if (up && power > .75) { shake = .16; shakePower = 3; }
        // Pip shakes the sea off like a wet puppy, a beat after surfacing.
        if (up) shiver = .55;
        if (!up && Math.abs(event.x - game.player.x) < 60) squash = .45;
      }
      if (event.kind === 'fishLeap') {
        rings.push({ x: event.x, life: .8, power: .35 });
        for (let i = 0; i < 5; i++) spawn('drop', event.x + rand(-6, 6), water - 2, rand(-70, 50), -rand(110, 200), rand(.4, .7), rand(1.3, 2.2));
      }
      if (event.kind === 'netSplash') rings.push({ x: event.x, life: 1, power: 1.1 });
      if (event.kind === 'hurt') {
        // A bump is comic, not violent: a short wobble and a puff of stars.
        if (!reducedMotion) { freeze = .06; shake = .25; shakePower = 4; squash = .45; }
        for (let i = 0; i < 7; i++) { const a = rand(0, Math.PI * 2); spawn('star', event.x, event.y - 20, Math.cos(a) * 130, Math.sin(a) * 130 - 40, rand(.5, .8), rand(4, 6.5), i % 2 ? '#ffd66e' : '#fff3c2'); }
      }
      if (event.kind === 'nearMiss') { if (!reducedMotion) { slow = .5; pulse = 1; } burst(event.x, event.y, 8, 140, '#ffffff'); }
      if (event.kind === 'catch') {
        // Little hearts float up from the beak; golden fish get stars and starry eyes.
        const count = event.golden ? 5 : event.combo % 5 === 0 ? 3 : 1;
        for (let i = 0; i < count; i++) spawn(event.golden ? 'star' : 'heart', event.x + rand(-10, 14), event.y - 10, rand(-50, 30), -rand(60, 120), rand(.8, 1.2), event.golden ? rand(5, 7.5) : rand(5, 7), event.golden ? '#ffd66e' : ['#ff8fa3', '#ffa8b8', '#ff7a96'][i % 3]);
        if (event.golden) sparkle = .9;
        if (event.combo % 10 === 0) { joy = .8; squash = .45; burst(event.x, event.y - 20, 10, 150, '#ffd3e0'); }
      }
      if (event.kind === 'airCatch') { sparkle = .7; burst(event.x, event.y, 12, 190, '#fff2b6'); }
      if (event.kind === 'rare') joy = 1.2;
      if (event.kind === 'sardine') burst(event.x, event.y, 2, 80, '#e3f6ff');
      if (event.kind === 'feast' || event.kind === 'trick' || event.kind === 'kick' || event.kind === 'mission') burst(event.x, event.y, 16, 220, '#fff2b6');
      if (event.kind === 'frenzy') { if (!reducedMotion) { flash = .35; flashColour = '#ffd66e'; shake = .2; shakePower = 4; } burst(event.x, event.y, 22, 260, '#ffd66e'); }
      if (event.kind === 'current') burst(event.x, event.y, 8, 160, '#dffff6');
    },
    update(dt, game, playing) {
      shake = Math.max(0, shake - dt); squash = Math.max(0, squash - dt); sparkle = Math.max(0, sparkle - dt); joy = Math.max(0, joy - dt);
      const shook = shiver; shiver = Math.max(0, shiver - dt);
      if (playing && shook > .1 && shook < .4 && Math.floor(shook * 30) !== Math.floor(shiver * 30)) {
        const p = game.player, side = Math.random() < .5 ? -1 : 1;
        spawn('drop', p.x - 10 + rand(-22, 22), p.y + rand(-14, 10), side * rand(90, 170) - game.speed * .2, -rand(40, 130), rand(.35, .6), rand(1.2, 2));
      } flash = Math.max(0, flash - dt * 1.4); pulse = Math.max(0, pulse - dt * 2.2);
      for (const ring of rings) { ring.life -= dt * 1.5; ring.x -= game.speed * dt; }
      rings = rings.filter(ring => ring.life > 0);
      for (const q of particles) {
        q.life -= dt;
        if (q.kind === 'drop') { q.vy += 880 * dt; if (q.vy > 0 && q.y > WORLD.water) q.life = 0; }
        else if (q.kind === 'bubble') { q.vx -= q.vx * 2 * dt; if (q.y < WORLD.water + 6) q.life = 0; }
        else if (q.kind === 'spark' || q.kind === 'star') { q.vx -= q.vx * 3 * dt; q.vy -= q.vy * 3 * dt; }
        else if (q.kind === 'heart') { q.vx = Math.sin(q.life * 9) * 30; }
        q.x += (q.vx - (q.kind === 'spark' ? 0 : game.speed * .35)) * dt; q.y += q.vy * dt;
      }
      particles = particles.filter(q => q.life > 0);
      if (!playing || reducedMotion) { rush = 0; return; }
      const p = game.player, fast = Math.abs(p.vy) > 150;
      rush += ((game.frenzy > 0 ? 1 : 0) - rush) * Math.min(1, dt * 4);
      trail -= dt;
      if (trail <= 0 && !game.feeding) {
        trail = .028;
        if (p.wet && (fast || game.boost > .2)) spawn('bubble', p.x - 26 + rand(-8, 8), p.y + rand(-12, 12), -rand(40, 110), -rand(15, 60), rand(.45, .9), rand(1.4, 3.8));
        if (!p.wet && (p.jump || p.breach > .15)) spawn('mist', p.x - 18 + rand(-8, 8), p.y + 16 + rand(-6, 10), -rand(60, 140), rand(40, 160), rand(.25, .5), rand(1.4, 2.6));
        if (game.frenzy > 0) spawn('spark', p.x + rand(-34, 30), p.y + rand(-28, 22), -rand(40, 120), rand(-40, 40), rand(.3, .6), rand(1.4, 2.6), '#ffd66e');
      }
    },
    view() {
      const amount = shake > 0 ? shakePower * Math.min(1, shake / .2) : 0;
      // Squash rings out like jelly: it overshoots into a stretch and settles.
      return { particles, rings, shiver: shiver < .42 ? shiver : 0, squash: squash > 0 ? Math.cos((.45 - squash) * 26) * squash / .45 : 0, sparkle, joy, flash, flashColour, pulse, rush, shakeX: amount ? rand(-amount, amount) : 0, shakeY: amount ? rand(-amount, amount) * .7 : 0 };
    },
  };
}
