import { armyIdentity, tacticArmies } from './historical-commander-tactics.js';
import { combatant } from './historical-opponent-analysis.js';

const mean = list => list.reduce((p, u) => ({ x: p.x + u.x / list.length, y: p.y + u.y / list.length }), { x: 0, y: 0 });

// Keep the deployment order so living allied armies never swap sides while
// reacting to moving enemies. Only an eliminated army releases its frontage.
export class AllianceCoordination {
  constructor() { this.sectors = new Map(); this.fallback = new Set(); this.initialized = false; this.nextUpdate = 0; }
  initialize(b, alive) {
    if (this.initialized || b.time <= 0) return;
    this.initialized = true;
    if (b.navigation) return;
    const teams = [0, 1].map(team => alive.filter(u => combatant(u) && u.team === team));
    const armies = [...tacticArmies(teams)];
    for (const team of [0, 1]) {
      const allies = armies.filter(a => a.team === team);
      if (allies.length < 2 || !teams[1 - team].length) continue;
      const own = mean(teams[team]), enemy = mean(teams[1 - team]);
      const horizontal = Math.abs(enemy.x - own.x) >= Math.abs(enemy.y - own.y);
      const axis = horizontal ? 'y' : 'x';
      const forward = horizontal ? { x: enemy.x >= own.x ? 1 : -1, y: 0 } : { x: 0, y: enemy.y >= own.y ? 1 : -1 };
      const low = horizontal ? b.bounds.top + 118 : b.bounds.left + 45;
      const high = horizontal ? b.bounds.bottom - 95 : b.bounds.right - 45;
      for (const a of allies) {
        a.center = mean(a.units)[axis];
        a.low = Math.min(...a.units.map(u => u[axis] - u.combatProfile.radius));
        a.high = Math.max(...a.units.map(u => u[axis] + u.combatProfile.radius));
      }
      allies.sort((a, c) => a.center - c.center || a.id.localeCompare(c.id));
      const borders = [low, ...allies.slice(1).map((a, i) =>
        Math.max(low, Math.min(high, (allies[i].high + a.low) / 2))), high];
      // In unusual custom deployments bodies can already overlap. Monotonic
      // borders still give each plan its own territory instead of overlapping it.
      for (let i = 1; i < borders.length; i++) borders[i] = Math.max(borders[i - 1], borders[i]);
      allies.forEach((a, i) => this.sectors.set(a.id, {
        team, axis, forward, min: borders[i] + (i ? 18 : 0), max: borders[i + 1] - (i < allies.length - 1 ? 18 : 0),
      }));
    }
  }
  update(b, alive) {
    this.initialize(b, alive);
    if (b.time <= 0 || b.navigation || !this.sectors.size || b.time + 1e-8 < this.nextUpdate) return;
    this.nextUpdate = b.time + 1;
    // Commander loss or manual control is not army elimination. Even one
    // remaining soldier keeps the front, including soldiers outside the plan.
    const present = new Set(alive.filter(combatant).map(armyIdentity));
    for (const team of [0, 1]) {
      const previous = [...this.sectors].filter(([, s]) => s.team === team).sort((a, c) => a[1].min - c[1].min);
      const remaining = previous.filter(([id]) => present.has(id));
      if (remaining.length === previous.length) continue;
      // Split only vacant territory between its surviving neighbors. Existing
      // borders stay fixed; surviving sectors only grow, so current movement
      // orders remain valid and fighting ranks need not form up again.
      const borders = [previous[0][1].min, ...remaining.slice(1).map(([, s], i) =>
        (remaining[i][1].max + s.min) / 2), previous.at(-1)[1].max];
      remaining.forEach(([, s], i) => {
        s.min = borders[i] + (i ? 18 : 0);
        s.max = borders[i + 1] - (i < remaining.length - 1 ? 18 : 0);
      });
      for (const [id] of previous) if (!present.has(id)) this.sectors.delete(id);
    }
  }
  contains(id, p, radius = 0) {
    const s = this.sectors.get(id);
    return !s || (p[s.axis] - radius >= s.min && p[s.axis] + radius <= s.max);
  }
  enemies(id, enemies) {
    const s = this.sectors.get(id);
    if (!s) return enemies;
    const local = enemies.filter(u => u[s.axis] >= s.min - 35 && u[s.axis] <= s.max + 35);
    if (local.length) return local;
    // An empty front can support the closest enemy sector, but must still obey
    // its maneuver boundary; never measure a flank around the entire alliance.
    const distance = u => Math.max(s.min - u[s.axis], 0, u[s.axis] - s.max);
    const nearest = Math.min(...enemies.map(distance));
    return enemies.filter(u => distance(u) <= nearest + 70);
  }
  penalty(u, target) {
    if (u.order || u.tacticalOverride || Math.hypot(u.x - target.x, u.y - target.y) <= Math.max(85, u.combatProfile.config.reach)) return 0;
    const s = this.sectors.get(armyIdentity(u));
    if (!s) return 0;
    return Math.min(220, Math.max(s.min - target[s.axis], 0, target[s.axis] - s.max));
  }
}

export const armySector = (b, id) => b.tactics?.coordination?.sectors.get(id);
export const armyEnemies = (b, id, enemies) => b.tactics?.coordination?.enemies(id, enemies) || enemies;
export const armyInside = (b, id, p, radius = 0) => b.tactics?.coordination?.contains(id, p, radius) ?? true;
export const fallbackArmy = (b, id) => { if (armySector(b, id)) b.tactics.coordination.fallback.add(id); };

// Translate a whole formation into its sector; never clamp individual soldiers
// into the same boundary slot. Internal doctrine geometry remains unchanged.
export function fitArmyFront(b, s, points) {
  const sector = armySector(b, s.armyId);
  if (!sector) return true;
  const low = Math.min(...points.map(p => p[sector.axis] - (p.radius || 0)));
  const high = Math.max(...points.map(p => p[sector.axis] + (p.radius || 0)));
  if (high - low > sector.max - sector.min) return false;
  s.origin[sector.axis] += Math.max(sector.min - low, Math.min(0, sector.max - high));
  return true;
}

export function armyBounds(b, id) {
  const sector = armySector(b, id), bounds = { ...b.bounds };
  // commanderDeployment applies these map margins itself.
  if (sector?.axis === 'y') { bounds.top = sector.min - 115; bounds.bottom = sector.max + 95; }
  if (sector?.axis === 'x') { bounds.left = sector.min - 45; bounds.right = sector.max + 45; }
  return bounds;
}
