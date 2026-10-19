// One-time deployment. Space grows with bodies, never by shrinking soldier gaps.
// Preliminary role bands assess the opposing front; commanders then spawn in
// their actual opening plan. Armies without a leader keep simple type blocks.
import { reserveArmyManeuverSpace } from './crown-battle-bounds.js';
import { prepareCommanderOpenings } from './historical-opening-deployment.js';

export function deployHistoricalArmies(battle, { expandedMap = false, mapId = 'classic' } = {}) {
  const armies = new Map(battle.armyConfigs.map(a => [a.id, { config: a, units: [], leader: null }]));
  for (const u of battle.units) {
    const a = armies.get(u.armyId);
    if (u.commanderId) a.leader = u; else a.units.push(u);
  }
  const block = units => {
    const gap = units.reduce((gap, u) => Math.max(gap, u.combatProfile.radius * 2 + 10), 16);
    const rows = Math.max(1, Math.ceil(Math.sqrt(units.length) * 1.8));
    const columns = Math.ceil(units.length / rows);
    return { units, gap, rows, width: columns * gap, height: Math.min(rows, units.length) * gap };
  };
  const plans = [[], []];
  for (const a of armies.values()) {
    const groups = new Map();
    for (const u of a.units) {
      const p = u.combatProfile;
      const role = !a.leader ? u.type : p.role === 'cavalry' ? 'horse' : p.ranged ? 'bow' : 'front';
      if (!groups.has(role)) groups.set(role, []);
      groups.get(role).push(u);
    }
    const bands = [...groups].map(([role, units]) => ({ role, ...block(units) }));
    // Infantry in front, missiles behind, mounted troops on a separate wing.
    bands.sort((a, b) => ({ front: 0, bow: 1, horse: 2 }[a.role] ?? 0) - ({ front: 0, bow: 1, horse: 2 }[b.role] ?? 0));
    let depth = 0, low = 0, high = 0, width = 0;
    for (const band of bands) {
      if (a.leader && band.role !== 'horse') {
        band.x = -depth; band.y = 0; depth += band.width + 32;
      } else {
        band.x = 0; band.y = high ? high + 40 + band.height / 2 : 0;
      }
      low = Math.min(low, band.y - band.height / 2);
      high = Math.max(high, band.y + band.height / 2);
      width = Math.max(width, -band.x + band.width);
    }
    for (const band of bands) band.y -= (low + high) / 2;
    plans[a.config.team].push({ ...a, bands, height: Math.max(60, high - low), width });
  }
  // The larger map must also provide a neutral approach corridor. Its width
  // grows with formation depth, so adding ranks does not consume preparation
  // time. Keep compact/classic deployment unchanged and cap the extra march.
  const depth = Math.max(0, ...plans.flat().map(a => a.width));
  const frontGap = expandedMap ? Math.min(960, 560 + depth * .6) : 160;
  battle.deploymentSpacing = { frontGap, depth };
  battle.initialArmyAreas = new Map();
  for (const team of [0, 1]) {
    const total = plans[team].reduce((n, a) => n + a.height + 100, 0) - 100;
    let top = 480 - Math.max(0, total) / 2;
    for (const a of plans[team]) {
      const cy = top + a.height / 2, sign = team ? -1 : 1;
      const front = 300 - sign * frontGap / 2;
      for (const band of a.bands) band.units.forEach((u, i) => {
        u.x = front + sign * (band.x - (Math.floor(i / band.rows) + .5) * band.gap);
        u.y = cy + band.y + ((i % band.rows) + .5) * band.gap - band.height / 2;
      });
      if (a.leader) { a.leader.x = front - sign * (a.width + 45); a.leader.y = cy; }
      battle.initialArmyAreas.set(a.config.id, { top: top - 40, bottom: top + a.height + 40 });
      top += a.height + 100;
    }
  }
  if (mapId !== 'fortress') prepareCommanderOpenings(battle, expandedMap);
  for (const u of battle.units) {
    const r = u.combatProfile.radius;
    battle.bounds.left = Math.min(battle.bounds.left, u.x - r - 120);
    battle.bounds.right = Math.max(battle.bounds.right, u.x + r + 120);
    battle.bounds.top = Math.min(battle.bounds.top, u.y - r - 160);
    battle.bounds.bottom = Math.max(battle.bounds.bottom, u.y + r + 160);
  }
  if (expandedMap) reserveArmyManeuverSpace(battle.bounds, battle.units);
  battle.targetRadius = Math.hypot(battle.bounds.right - battle.bounds.left, battle.bounds.bottom - battle.bounds.top);
}
