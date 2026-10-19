import { reserveArmyManeuverSpace } from './crown-battle-bounds.js';

// The compact classic setup squeezes every type into an 80-unit strip.
// Expanded maps have room for actual bodies: grow ranks rather than overlap
// thousands of soldiers and spend the opening ticks separating them.
export function deployClassicCrowd(battle) {
  battle.initialArmyAreas = new Map();
  for (const team of [0, 1]) {
    const sign = team ? -1 : 1, front = 300 - sign * 90;
    const groups = new Map(['pike', 'sword', 'archer', 'cavalry'].map(type =>
      [type, battle.units.filter(u => u.team === team && u.type === type)]));
    let depth = 0, infantryHeight = 0, low = 480, high = 480;
    function place(units, x, cy) {
      if (!units.length) return { width: 0, height: 0 };
      const gap = units[0].combatProfile.radius * 2 + 3;
      const rows = Math.min(units.length, Math.ceil(Math.sqrt(units.length) * 1.8));
      const height = rows * gap, width = Math.ceil(units.length / rows) * gap;
      for (let i = 0; i < units.length; i++) {
        units[i].x = x - sign * (Math.floor(i / rows) + .5) * gap;
        units[i].y = cy + ((i % rows) + .5) * gap - height / 2;
      }
      low = Math.min(low, cy - height / 2); high = Math.max(high, cy + height / 2);
      return { width, height };
    }
    for (const type of ['pike', 'sword', 'archer']) {
      const block = place(groups.get(type), front - sign * depth, 480);
      if (block.width) depth += block.width + 20;
      infantryHeight = Math.max(infantryHeight, block.height);
    }
    const horses = groups.get('cavalry'), half = Math.ceil(horses.length / 2);
    const flanking = battle.preset === 'flank' && team === 0;
    const wings = flanking ? [[-1, horses]] : [[-1, horses.slice(0, half)], [1, horses.slice(half)]];
    for (const [wing, units] of wings) {
      if (!units.length) continue;
      const rows = Math.min(units.length, Math.ceil(Math.sqrt(units.length) * 1.8));
      const height = rows * (units[0].combatProfile.radius * 2 + 3);
      place(units, front - sign * (flanking ? -50 : 65), 480 + wing * (infantryHeight / 2 + 30 + height / 2));
    }
    battle.initialArmyAreas.set(`army-${team}`, { top: low - 40, bottom: high + 40 });
  }
  reserveArmyManeuverSpace(battle.bounds, battle.units);
  battle.targetRadius = Math.hypot(battle.bounds.right - battle.bounds.left, battle.bounds.bottom - battle.bounds.top);
}
