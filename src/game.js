export const WORLD = { capacity: 20, width: 480, height: 850, water: 360, duration: 75, breath: 8 };
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
export const playerTilt = player => clamp(player.vy / 340, -.5, .78) - (player.spin || 0);
export function beakPosition(player) {
  const angle = playerTilt(player);
  return { x: player.x + .76 * (66 * Math.cos(angle) + 27 * Math.sin(angle)), y: player.y + .76 * (66 * Math.sin(angle) - 27 * Math.cos(angle)) };
}

// These points are used by both the illustration and collision detection.
export function netShape(boat) {
  const age = boat.cast;
  if (age < .85 || age >= 3.25) return null;
  let x, y, width, depth, phase;
  if (age < 1.45) {
    const progress = (age - .85) / .6;
    phase = 'flight'; x = boat.x + 28 - 98 * progress;
    y = WORLD.water - 75 + 83 * progress - 95 * Math.sin(Math.PI * progress);
    width = 12 + 40 * progress; depth = 8 + 12 * Math.sin(Math.PI * progress);
    return { phase, x, y, width, depth, points: Array.from({ length: 12 }, (_, i) => ({ x: x + Math.cos(i / 12 * Math.PI * 2) * width, y: y + Math.sin(i / 12 * Math.PI * 2) * depth })) };
  }
  const sink = clamp((age - 1.45) / .65, 0, 1);
  const haul = clamp((age - 2.55) / .7, 0, 1);
  phase = age < 2.1 ? 'sink' : age < 2.55 ? 'soak' : 'haul';
  x = boat.x - 70 + haul * 82; y = WORLD.water + 8 - haul * 48;
  width = 52 * (1 - haul * .8); depth = (8 + 164 * sink) * (1 - haul);
  return { phase, x, y, width, depth, points: [[-.82,0],[.82,0],[1,.28],[.85,.8],[.4,1],[-.4,1],[-.85,.8],[-1,.28]].map(([dx, dy]) => ({ x: x + dx * width, y: y + dy * depth })) };
}

function hitsPolygon(x, y, points) {
  const radius = 18;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[j], b = points[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    const u = clamp(((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
    if (Math.hypot(x - a.x - u * dx, y - a.y - u * dy) <= radius) return true;
    if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function hitsNet(player, net) {
  return net ? hitsPolygon(player.x, player.y - 8, net.points) : false;
}

// One trick attempt per breach; a third quick press upgrades the running spin.
export function press(game) {
  const p = game.player;
  if (game.ended || game.feeding || p.wet || game.time > p.trickUntil) return;
  if (p.trickUsed) {
    if (p.turns === 1 && game.time - p.tapAt <= .32) p.turns = 2;
    return;
  }
  p.taps = game.time - p.tapAt <= .32 ? p.taps + 1 : 1;
  p.tapAt = game.time;
  if (p.taps === 2) { p.turns = 1; p.spin = 0; p.trickUsed = true; }
}

export function hitsBoat(player, boat) {
  const x = player.x, y = player.y - 8, radius = 18;
  // Hull and fisherman, matching the visible drawing rather than its center only.
  return [[-77, 77, -17, 28], [-30, 25, -100, -17]].some(([left, right, top, bottom]) =>
    Math.hypot(x - clamp(x, boat.x + left, boat.x + right), y - clamp(y, WORLD.water + top, WORLD.water + bottom)) < radius);
}

export function terrainBlocks(item) {
  return (item.kind === 'island' ? [[-70, 330, 140, 520]] : [[-60, 382, 120, 68], [-85, 610, 170, 240]])
    .map(([x, y, width, height]) => {
      x += item.x;
      const points = [[14,0],[width * .3,0],[width * .55,0],[width * .76,3],[width - 14,2],[width - 5,7],[width,14],
        [width - 4,height * .27],[width,height * .5],[width - 7,height * .73],[width,height - 14],[width - 5,height - 5],[width - 14,height],
        [width * .68,height - 3],[width * .42,height],[14,height],[5,height - 5],[0,height - 14],[6,height * .76],[1,height * .52],
        [8,height * .3],[0,14],[2,8],[6,2]].map(([dx, dy]) => ({ x: x + dx, y: y + dy }));
      return { x, y, width, height, points };
    });
}
export function hitsTerrain(player, item) {
  return terrainBlocks(item).some(b => hitsPolygon(player.x, player.y, b.points));
}

export const STAGES = [
  { name: 'Geschützte Bucht', encounters: ['calm', 'turtle', 'calm', 'shark', 'calm', 'island', 'calm', 'gull', 'calm'] },
  { name: 'Fischerhafen', encounters: ['boat', 'calm', 'driftwood', 'calm', 'surfer', 'calm', 'diver', 'calm', 'boat'] },
  { name: 'Korallenriff', encounters: ['jelly', 'calm', 'puffer', 'calm', 'reef', 'calm', 'whirlpool', 'calm', 'reef-puffer'] },
];

// Includes continued descent during reaction time and the turn from diving to rising.
export function airState(player, cargo = 0) {
  if (!player.wet) return { level: 0, urgency: 0, warningAt: 0 };
  const ascent = 210 - cargo / WORLD.capacity * 45;
  const reactionDepth = Math.min(710, player.y + .75 * (240 + cargo / WORLD.capacity * 20));
  const warningAt = Math.max(2, (reactionDepth - WORLD.water - 12) / ascent + 1.35);
  const margin = player.breath - Math.max(0, player.y - WORLD.water - 12) / ascent;
  const level = player.breath <= warningAt ? (margin <= 1 ? 2 : 1) : 0;
  return { level, urgency: level ? clamp(1 - margin / 2.1, .2, 1) : 0, warningAt };
}
export function pufferRadius(item) {
  return 22 + 23 * (item.phase === 'puffed' ? 1 : item.phase === 'inflate' ? clamp(1 - item.timer / .45, 0, 1) : item.phase === 'deflate' ? clamp(item.timer / .7, 0, 1) : 0);
}
export function hitsPuffer(player, item) {
  return item.phase === 'puffed' && Math.hypot(player.x - item.x, player.y - item.y) < pufferRadius(item) + 18;
}
function encounter(game) {
  const entry = STAGES[game.stage].encounters[game.wave];
  if (!entry) {
    game.items.push({ kind: 'nest', final: true, x: 1050, y: WORLD.water, served: false, celebration: 0 });
    [440, 415, 370, 320, 285].forEach((y, i) => game.items.push({ kind: 'fish', x: 550 + i * 80, y, route: game.wave }));
    game.nextEncounter = Infinity;
    return;
  }
  const kind = entry === 'reef-puffer' ? 'reef' : entry;
  const swimmers = kind === 'shark' ? 1 : 0;
  const depths = kind === 'island' ? [420,360,290,250,250,250,250,265,320,410,430]
    : kind === 'reef' ? [440,470,490,510,520,530,530,510,470,435,395]
    : kind === 'boat'
    ? [432,475,530,595,620,620,615,560,490,435,395]
    : swimmers
      ? [440,425,414,410,410,415,420,440,465,440,395]
      : [430,460,500,535,550,540,510,475,440,415,395];
  const offset = kind === 'calm' ? game.random() * 35 : 0;
  depths.forEach((y, i) => game.items.push({ kind: 'fish', x: 540 + i * 64, y: y + offset, golden: false, route: game.wave }));
  if (kind === 'boat') game.items.push({ kind, x: 890, y: WORLD.water, cast: -1, hit: false, look: game.boats++ % 4 });
  if (swimmers) game.items.push({ kind: 'shark', x: 880, y: 660, baseY: 660, lane: 'deep' });
  if (kind === 'turtle') game.items.push({ kind, x: 890, y: 480, baseY: 480 });
  if (kind === 'puffer' || entry === 'reef-puffer') game.items.push({ kind: 'puffer', x: entry === 'reef-puffer' ? 1130 : 890, y: 665, phase: 'idle', timer: 0 });
  if (['island', 'reef'].includes(kind)) game.items.push({ kind, x: 890 });
  game.items.push({ kind: 'fish', x: kind === 'shark' ? 1050 : 860, y: kind === 'island' ? 245 : kind === 'reef' ? 530 : kind === 'boat' ? 715 : kind === 'shark' ? 555 : 650, golden: true });
  if (['gull', 'jelly', 'driftwood', 'whirlpool'].includes(kind)) game.items.push({ kind, x: 890, y: kind === 'gull' ? 285 : kind === 'driftwood' ? WORLD.water : 640, phase: 0 });
  if (kind === 'diver') game.items.push({ kind, x: 890, y: 620, phase: 'idle', timer: 0 });
  if (kind === 'surfer') game.items.push({ kind, x: 890, y: WORLD.water, escaping: false });
  game.items.push({ kind: 'bubble', x: 1120, y: 540 });
  if (kind !== 'calm') {
    // A short reward tail follows the danger before the next quiet encounter.
    for (let i = 0; i < 3; i++) game.items.push({ kind: 'fish', x: 1240 + i * 38, y: 420 + i * 10, golden: false });
  }
  if (kind === 'calm') for (let i = 0; i < 3; i++) game.items.push({ kind: 'fish', flying: true, x: 650 + i * 85, y: 280, baseY: 280, golden: false });
  game.wave++;
  game.nextEncounter += kind === 'island' ? 1160 : 980;
}

export function createGame(random = Math.random, stage = 0) {
  return {
    stage: Number.isInteger(stage) ? clamp(stage, 0, STAGES.length - 1) : 0, random, time: 0, distance: 0, speed: 150, energy: 100, score: 0, fish: 0,
    cargo: 0, delivered: 0, feeding: 0, feedingTotal: 0, combo: 0, comboTime: 0, bestCombo: 0, diveFish: 0, mission: false,
    player: { x: 118, y: 265, vy: 0, wet: false, gulp: 0, breach: 0, breath: WORLD.breath, spin: 0, turns: 0, trickUntil: -1, taps: 0, tapAt: -10, trickUsed: false },
    items: Array.from({ length: 5 }, (_, i) => ({ kind: 'fish', x: 340 + i * 48, y: 452 + Math.sin(i * .6) * 18, golden: false })),
    nextEncounter: 520, wave: 0, boats: 0, ended: false,
  };
}

export function step(game, dt, holding) {
  if (game.ended) return [];
  dt = clamp(dt, 0, .05);
  const events = [];
  const p = game.player;
  if (game.feeding > 0) {
    game.feeding = Math.max(0, game.feeding - dt);
    const remaining = Math.ceil(game.feedingTotal * game.feeding / 1.8);
    game.cargo = Math.min(game.cargo, remaining);
    if (!game.feeding) {
      const points = game.feedingTotal * 15;
      game.score += points; game.delivered += game.feedingTotal; game.cargo = 0;
      p.breach = .6; p.vy = -235; p.breath = WORLD.breath; p.feedX = undefined;
      if (game.items.some(item => item.kind === 'nest' && item.final && item.served)) game.settling = 1.2;
      return [{ kind: 'delivery', points, count: game.feedingTotal, x: p.x, y: p.y }];
    }
    return [];
  }
  if (game.settling > 0) {
    game.settling = Math.max(0, game.settling - dt);
    if (!game.settling) { game.ended = true; game.endReason = 'complete'; return [{ kind: 'end' }]; }
    return [];
  }
  game.time += dt;
  const waitingNest = game.items.find(item => item.kind === 'nest' && item.final && item.x <= p.x + 55);
  game.speed = waitingNest ? 0 : 150 + game.stage * 5 + Math.min(8, Math.max(0, game.time - 20) * .15);
  game.distance += game.speed * dt;
  const previousAir = airState(p, game.cargo);
  p.breath = clamp(p.breath + dt * (p.wet ? -1 : 4), 0, WORLD.breath);
  if (!previousAir.level && airState(p, game.cargo).level) events.push({ kind: 'airWarning' });
  if (p.breath === 0) {
    game.ended = true; game.endReason = 'air';
    return [...events, { kind: 'end' }];
  }
  const weight = game.cargo / WORLD.capacity;
  const target = holding ? (p.wet ? 240 + weight * 20 : 255) : (p.wet ? -210 + weight * 45 : -100 + weight * 25);
  p.vy += (target - p.vy) * (1 - Math.exp(-dt * (p.wet ? 9 : 6)));
  p.y = clamp(p.y + p.vy * dt, 265, 710);
  if (p.y === 265 || p.y === 710) p.vy = 0;
  p.relief = Math.max(0, (p.relief || 0) - dt); p.bump = Math.max(0, (p.bump || 0) - dt);
  p.gulp = Math.max(0, p.gulp - dt); p.breach = Math.max(0, p.breach - dt);
  const wet = p.y > WORLD.water + 12;
  if (wet !== p.wet) {
    events.push({ kind: wet ? 'splash' : 'breach', x: p.x, y: WORLD.water });
    if (wet) { game.diveFish = 0; p.turns = 0; p.spin = 0; p.trickUntil = -1; }
    else { p.relief = previousAir.level ? 1.5 : .65; p.breach = .6; p.vy = -235; p.trickUntil = game.time + 1.2; p.taps = 0; p.tapAt = -10; p.trickUsed = false; }
    p.wet = wet;
  }
  if (p.turns && !p.wet) p.spin = Math.min(p.turns * Math.PI * 2, p.spin + dt * Math.PI * 2 / .65);
  if (game.time > 8) game.energy = Math.max(0, game.energy - dt * .85);
  game.comboTime = Math.max(0, game.comboTime - dt);
  if (!game.comboTime) game.combo = 0;
  if (game.distance >= game.nextEncounter) encounter(game);
  const beak = beakPosition(p);
  for (const item of game.items) {
    item.x -= game.speed * dt;
    if (['island', 'reef'].includes(item.kind) && !item.warned && item.x < 760) {
      item.warned = true; events.push({ kind: item.kind === 'island' ? 'islandWarning' : 'reefWarning' });
    }
    if (item.kind === 'nest') {
      item.celebration = Math.max(0, item.celebration - dt);
      if (!item.warned && item.x < 650) { item.warned = true; events.push({ kind: 'nestWarning' }); }
      if (!item.served && !p.wet && (item.final || game.cargo > 0) && Math.abs(item.x - p.x) < 65) {
        item.served = true; item.celebration = 3; game.feeding = 1.8; game.feedingTotal = game.cargo;
        p.y = 285; p.vy = 0; p.spin = 0; p.turns = 0; p.feedX = item.x - 55;
        return events;
      }
      continue;
    }
    if (item.kind === 'turtle') {
      item.x -= (18 + Math.min(15, game.time * .1)) * dt;
      item.y = item.baseY + Math.sin(game.time * 1.8) * 10;
      item.reaction = Math.max(0, (item.reaction || 0) - dt);
      if (!item.touched && Math.hypot((item.x - p.x) / 1.6, item.y - p.y) < 36) {
        item.touched = true; item.reaction = .8; p.bump = .6;
      }
      continue;
    }
    if (item.kind === 'puffer') {
      if (item.phase === 'idle' && item.x < 470) { item.phase = 'startle'; item.timer = .55; }
      else if (item.phase !== 'idle' && item.phase !== 'rest') {
        item.timer -= dt;
        if (item.timer <= 0) {
          const next = { startle: ['inflate', .45], inflate: ['puffed', 1.25], puffed: ['deflate', .7], deflate: ['rest', 0] }[item.phase];
          [item.phase, item.timer] = next;
        }
      }
    }
    if (item.kind === 'shark') {
      item.x -= (12 + Math.min(28, Math.floor(game.time / 20) * 4)) * dt;
      const pursuit = 16 + Math.min(54, Math.max(0, game.time - 20) * .3);
      item.reaction = Math.max(0, (item.reaction || 0) - dt);
      if (!p.wet || item.x < p.x - 65) { item.phase = 'cruise'; item.attackTime = 0; }
      else if (item.x < 480) {
        if (!item.phase || item.phase === 'cruise') item.phase = 'track';
        if (item.phase === 'track') {
          item.y += clamp(p.y - item.y, -pursuit * dt, pursuit * dt);
          if (item.x < p.x + 240) { item.phase = 'warn'; item.attackTime = .85; events.push({ kind: 'warning', x: item.x, y: item.y - 65 }); }
        } else if (item.phase === 'warn') {
          item.attackTime -= dt;
          if (item.attackTime <= 0) { item.phase = 'dash'; item.attackTime = .55; item.dashY = clamp((p.y - item.y) * 1.4, -110, 110); }
        } else if (item.phase === 'dash') {
          item.x -= (35 + pursuit) * dt; item.y += item.dashY * dt; item.attackTime -= dt;
          if (item.attackTime <= 0) { item.phase = 'spent'; item.reaction = .9; }
        }
      }
      item.y = clamp(item.y, item.lane === 'deep' ? 620 : WORLD.water + 70, item.lane === 'shallow' ? 450 : 720);
    }
    if (item.kind === 'diver') {
      if (item.phase === 'idle' && item.x < 475 && p.wet) { item.phase = 'aim'; item.timer = 1.1; }
      if (item.phase === 'aim') {
        item.aimX = p.x; item.aimY = p.y; item.timer -= dt;
        if (item.timer <= 0) { item.phase = 'locked'; item.timer = .6; events.push({ kind: 'warning', x: item.x, y: item.y - 50 }); }
      } else if (item.phase === 'locked') {
        item.timer -= dt;
        if (item.timer <= 0) {
          const dx = item.aimX - item.x, dy = item.aimY - item.y, length = Math.hypot(dx, dy) || 1;
          const speed = 180 + Math.min(65, game.time * .35);
          game.items.push({ kind: 'harpoon', x: item.x - 30, y: item.y, vx: dx / length * speed, vy: dy / length * speed, life: 2.8, firedAt: game.time });
          item.phase = 'reload'; item.timer = 3;
        }
      } else if (item.phase === 'reload') {
        item.timer -= dt; if (item.timer <= 0 && item.x > p.x + 120) item.phase = 'idle';
      }
    }
    if (item.kind === 'harpoon') {
      item.x += item.vx * dt; item.y += item.vy * dt; item.life -= dt;
      if (item.life <= 0 || item.y < WORLD.water + 18 || item.y > 760) { item.caught = true; continue; }
      const wood = game.items.find(other => other.kind === 'driftwood' && Math.abs(other.x - item.x) < 55 && Math.abs(other.y - item.y) < 25);
      if (wood) { item.caught = true; events.push({ kind: 'netSplash', x: item.x, y: item.y }); continue; }
      if (item.x < p.x - 35 && !item.rewarded) { item.rewarded = true; game.score += 25; events.push({ kind: 'outsmart', points: 25, x: p.x, y: p.y }); }
    }
    if (item.kind === 'surfer') {
      item.reaction = Math.max(0, (item.reaction || 0) - dt);
      if (!item.passed && item.x < p.x - 70) { item.passed = true; item.reaction = 1; }
      if (!item.warned && item.x < 480) { item.warned = true; events.push({ kind: 'warning', x: item.x, y: WORLD.water - 100 }); }
      // With low air the surfer turns away before entering Pip's ascent corridor.
      if (p.wet && p.breath < 3 && item.x > p.x - 85) item.escaping = true;
      if (item.escaping) { item.x += (game.speed + 220) * dt; if (item.x > 600) item.caught = true; }
      else item.x -= 15 * dt;
    }
    if (item.kind === 'gull') {
      if (!item.warned && item.x < 480) { item.warned = true; events.push({ kind: 'warning', x: item.x, y: item.y - 40 }); }
      item.x -= 20 * dt; item.y = 285 + Math.sin(game.time * 2) * 18;
    }
    if (item.kind === 'jelly') item.phase = (Math.sin(game.time * 2) + 1) / 2;
    if (item.kind === 'whirlpool') {
      if (p.wet && Math.hypot(item.x - p.x, item.y - p.y) < 115) p.y = Math.min(710, p.y + 65 * dt);
      continue;
    }
    if (item.flying) item.y = item.baseY + Math.sin(game.time * 3 + item.x * .01) * 30;
    if (item.kind === 'bubble') {
      if (Math.hypot(item.x - p.x, item.y - p.y) < 35) {
        item.caught = true; p.breath = Math.min(WORLD.breath, p.breath + 2);
        events.push({ kind: 'airBonus', x: item.x, y: item.y });
      }
      continue;
    }
    if (item.kind === 'boat') {
      item.reaction = Math.max(0, (item.reaction || 0) - dt);
      if (item.cast < 0 && item.x <= 480) {
        item.cast = 0;
        events.push({ kind: 'warning', x: item.x, y: WORLD.water - 125 });
      } else if (item.cast >= 0) {
        const before = item.cast;
        item.cast += dt;
        if (before < 1.45 && item.cast >= 1.45) events.push({ kind: 'netSplash', x: item.x - 70, y: WORLD.water });
        // Once the fully sunken net has passed Pip, the fisherman reels it in.
        if (item.cast >= 2.1 && item.cast < 2.55 && item.x - 18 < p.x - 20) item.cast = 2.55;
        if (before < 2.55 && item.cast >= 2.55) item.reaction = 1.2;
      }
    }
    if (item.kind === 'fish') {
      if (Math.hypot((item.x - beak.x) / 1.15, item.y - beak.y) < 32) {
        item.caught = true;
        game.fish++; game.cargo = Math.min(WORLD.capacity, game.cargo + 1); game.combo++; if (p.wet) game.diveFish++;
        game.comboTime = 8.5; p.gulp = .42;
        game.bestCombo = Math.max(game.bestCombo, game.combo);
        const points = (item.golden ? 50 : 10) * Math.min(4, 1 + Math.floor(game.combo / 5));
        game.score += points;
        game.energy = Math.min(100, game.energy + (item.golden ? 12 : 4));
        events.push({ kind: 'catch', x: item.x, y: item.y, points, golden: item.golden });
        if (game.diveFish >= 5 && !game.mission) {
          game.mission = true; game.score += 100;
          events.push({ kind: 'mission', x: p.x, y: p.y });
        }
      }
    } else {
      const netHit = item.kind === 'boat' && hitsNet(p, netShape(item));
      const hit = item.kind === 'shark'
        ? Math.abs(item.x - p.x) < 58 && Math.abs(item.y - p.y) < 34
        : ['island', 'reef'].includes(item.kind) ? hitsTerrain(p, item)
        : item.kind === 'puffer' ? hitsPuffer(p, item)
        : item.kind === 'diver' ? Math.abs(item.x - p.x) < 45 && Math.abs(item.y - p.y) < 30
        : item.kind === 'harpoon' ? Math.hypot(item.x - p.x, item.y - p.y) < 25
        : item.kind === 'surfer' ? Math.abs(item.x - p.x) < 65 && p.y > WORLD.water - 90 && p.y < WORLD.water + 30
        : item.kind === 'gull' ? Math.abs(item.x - p.x) < 36 && Math.abs(item.y - p.y) < 30
        : item.kind === 'jelly' ? Math.abs(item.x - p.x) < 35 && p.y > item.y - 35 && p.y < item.y + 20 + item.phase * 65
        : item.kind === 'driftwood' ? Math.abs(item.x - p.x) < 65 && Math.abs(p.y - WORLD.water) < 30
        : hitsBoat(p, item) || netHit;
      if (hit) {
        game.ended = true;
        game.endReason = item.kind === 'boat' ? (netHit ? 'net' : 'fisher') : item.kind;
        events.push({ kind: 'hurt', x: p.x, y: p.y }, { kind: 'end' });
        return events;
      }
    }
  }
  if (p.turns && p.spin >= p.turns * Math.PI * 2 && game.energy > 0) {
    const points = p.turns === 2 ? 120 : 50;
    game.score += points; events.push({ kind: 'trick', x: p.x, y: p.y, points, turns: p.turns });
    p.turns = 0; p.spin = 0;
  }
  game.items = game.items.filter(item => !item.caught && item.x > -180);
  if (game.energy <= 0) {
    game.ended = true; game.endReason = 'energy'; events.push({ kind: 'end' });
  }
  return events;
}
