import { formationRoute, clearFormationSegment } from './crown-battle-formation-path.js';

const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Called at the existing retarget cadence, never an extra army-wide scan.
export function trackPursuit(unit, time) {
  const target = unit.target, cfg = unit.combatProfile.config;
  if (unit.order || !target || target.hp <= 0 || unit.combatProfile.ranged) {
    unit.pursuit = null; return;
  }
  const d = gap(unit, target), previous = unit.pursuit;
  if (!previous || previous.id !== target.id) {
    unit.pursuit = { id: target.id, distance: d, time, stalled: 0,
      discouragedId: previous?.discouragedId, discouragedUntil: previous?.discouragedUntil || 0 };
    return;
  }
  const elapsed = Math.max(0, time - previous.time);
  if (d <= cfg.reach + 8 || unit.speed < 1 || unit.attack > 0) previous.stalled = 0;
  else if (previous.distance - d < cfg.speed * .12 * elapsed) previous.stalled += elapsed;
  else previous.stalled = Math.max(0, previous.stalled - elapsed * 2);
  if (previous.stalled >= 3) { previous.discouragedUntil = time + 5; previous.discouragedId = target.id; }
  previous.distance = d; previous.time = time;
}

// A short-lived route around a local allied screen. The same one-route/frame
// budget as player formation movement bounds graph work even in large armies.
export function npcWaypoint(battle, unit, goal, speed, dt, radiusOf) {
  if (unit.order?.kind === 'move' || unit.commanderId || battle.navigation) {
    unit.npcRoute = null; return goal;
  }
  let route = unit.npcRoute;
  // Accelerated crowd steps can themselves be 200 ms. Floating-point time
  // must not make consecutive walks look interrupted and erase stall history.
  if (!route || gap(route.goal, goal) > 55 || battle.time - route.lastWalk > Math.max(.2, dt * 1.5)) {
    route = unit.npcRoute = { goal: { x: goal.x, y: goal.y }, lastWalk: battle.time,
      sampleAt: battle.time, distance: gap(unit, goal), stalled: 0, retryAt: 0, path: [], expires: 0 };
  }
  route.lastWalk = battle.time;
  const elapsed = battle.time - route.sampleAt;
  if (elapsed >= .75) {
    const distance = gap(unit, goal);
    route.stalled = route.distance - distance < Math.max(2, speed * .12) * elapsed
      ? route.stalled + elapsed : Math.max(0, route.stalled - elapsed * 2);
    route.distance = distance; route.sampleAt = battle.time;
  }
  if (battle.time >= route.expires) route.path = [];
  while (route.path.length && gap(unit, route.path[0]) < 3) route.path.shift();
  if (!route.path.length && route.stalled >= 2.2 &&
      battle.time >= route.retryAt && battle.formationRouteBudget > 0) {
    route.retryAt = battle.time + 1.5;
    const obstacles = battle.grid.near(unit, 110, 32)
      .filter(v => v.team === unit.team && !v.commanderId &&
        (v.order?.kind === 'hold' || (v.speed || 0) < 4))
      .map(v => ({ x: v.x, y: v.y, r: radiusOf(unit) + radiusOf(v) + 1.5 }));
    if (obstacles.length) {
      const b = battle.bounds;
      // Only route a short segment. Distant ranks may have moved by arrival.
      const d = gap(unit, goal), scale = Math.min(1, 145 / (d || 1));
      const end = { x: unit.x + (goal.x - unit.x) * scale, y: unit.y + (goal.y - unit.y) * scale };
      if (clearFormationSegment(unit, end, obstacles)) return goal;
      battle.formationRouteBudget--;
      route.path = formationRoute(unit, end, obstacles, p => p.x >= b.left + 35 &&
        p.x <= b.right - 35 && p.y >= b.top + 110 && p.y <= b.bottom - 85);
      route.expires = battle.time + 4;
      battle.stats.npcRoutes = (battle.stats.npcRoutes || 0) + 1;
    }
  }
  return route.path[0] || goal;
}
