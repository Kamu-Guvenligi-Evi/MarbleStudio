import { conditionSpeed } from './crown-battle-condition.js';

// Local rank exchange. No army-wide search or new pathfinding pass.
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const footRanged = u => u.combatProfile.ranged && u.combatProfile.role !== 'cavalry' && u.combatProfile.role !== 'elephant';
const melee = u => !u.commanderId && !u.combatProfile.ranged;
const living = u => u.hp > 0 && !u.removed;
const laneRanged = u => u.combatProfile.ranged && u.combatProfile.role !== 'elephant';

// Flat-firing crossbows and firearms need a clear lane past allies. Reuse the bounded local
// rank-exchange movement to open a lane instead of retrying from one spot.
// Explicit player orders remain authoritative; no extra neighbour search.
export function requestClearShotLane(battle, u, blocker, target) {
  const projectile = u.combatProfile.config.projectile;
  if (!footRanged(u) || (projectile !== 'bolt' && projectile !== 'bullet') || u.order || u.commanderId || u.screening) return false;
  if (u.screenYield?.until > battle.time) return false;
  const d = gap(u, target);
  if (d < 1) return false;
  const dx = (target.x - u.x) / d, dy = (target.y - u.y) / d;
  const across = (blocker.x - u.x) * -dy + (blocker.y - u.y) * dx;
  const side = Math.abs(across) > 1 ? -Math.sign(across) : (u.id % 2 ? 1 : -1);
  const width = blocker.combatProfile.radius + u.combatProfile.radius + 9;
  const bounds = battle.bounds;
  for (const direction of [side, -side]) {
    const x = u.x - dy * width * direction, y = u.y + dx * width * direction;
    if (x < bounds.left + 35 || x > bounds.right - 35 || y < bounds.top + 110 || y > bounds.bottom - 85) continue;
    u.screenYield = { x, y, until: battle.time + 2 };
    return true;
  }
  return false;
}

export function steerScreening(battle, u, dt) {
  if (!laneRanged(u) || u.order || u.commanderId) {
    u.screening = null; u.screenYield = null; return false;
  }
  if (footRanged(u) && battle.time >= u.screenCheckAt) {
    u.screenCheckAt = battle.time + .35 + (u.id % 7) * .017;
    let threat = null, closest = 100;
    for (const enemy of battle.enemyGrids[1 - u.team].near(u, 100, 24)) {
      battle.stats.screenChecks = (battle.stats.screenChecks || 0) + 1;
      const d = gap(u, enemy);
      if (living(enemy) && melee(enemy) && d < closest) { threat = enemy; closest = d; }
    }
    if (!threat) u.screening = null;
    else {
      const dx = (threat.x - u.x) / (closest || 1), dy = (threat.y - u.y) / (closest || 1);
      let support = null, best = Infinity;
      for (const ally of battle.enemyGrids[u.team].near(u, 125, 40)) {
        battle.stats.screenChecks = (battle.stats.screenChecks || 0) + 1;
        if (ally === u || !living(ally) || !melee(ally) || ally.charge) continue;
        const ax = ally.x - u.x, ay = ally.y - u.y;
        const depth = ax * dx + ay * dy, across = Math.abs(-ax * dy + ay * dx);
        // A reachable ally behind us, or a screen we have just crossed.
        if (depth < -110 || depth > closest - 12 || across > 48) continue;
        const score = gap(u, ally) + across - (u.screening?.supportId === ally.id ? 30 : 0);
        if (score < best) { support = ally; best = score; }
      }
      if (!support) u.screening = null;
      else {
        const depth = (support.x - u.x) * dx + (support.y - u.y) * dy;
        if (depth >= 20) u.screening = null;
        else {
          const side = u.screening?.side || (u.id % 2 ? 1 : -1);
          const rear = support.combatProfile.radius + 20;
          const lane = support.combatProfile.radius + u.combatProfile.radius + 6;
          const state = u.screening;
          u.screening = { supportId: support.id, side,
            x: support.x - dx * rear - dy * lane * side,
            y: support.y - dy * rear + dx * lane * side,
            started: state?.started ?? battle.time };
        }
      }
    }
  }
  const screen = u.screening;
  if (screen && battle.time - screen.started < 7) {
    // Urgent protection takes precedence over a new volley. Already released
    // projectiles remain live; an unreleased shot is cancelled, never duplicated.
    u.pendingAttack = null; u.attack = 0; u.runDistance = 0; u.screenYield = null;
    battle.walk(u, screen, u.combatProfile.config.speed, dt);
    return true;
  }
  if (screen) { u.screening = null; u.screenCheckAt = battle.time + 2; }
  const yieldTo = u.screenYield;
  if (yieldTo && yieldTo.until > battle.time) {
    const requester = yieldTo.requester;
    if (requester && (!living(requester) ||
        (u.x - requester.x) * yieldTo.dx + (u.y - requester.y) * yieldTo.dy < -12)) {
      u.screenYield = null; return false;
    }
    if (u.attack > 0 && !yieldTo.urgent) return false;
    if (footRanged(u) && yieldTo.urgent) { u.pendingAttack = null; u.attack = 0; }
    if (gap(u, yieldTo) > 2) battle.walk(u, yieldTo, u.combatProfile.config.speed, dt);
    else if (!requester) { u.screenYield = null; return false; }
    else { u.speed = 0; u.runDistance = 0; }
    // Riders can still shoot while clearing a friendly charge lane.
    const target = u.target;
    if (!footRanged(u) && target && living(target) && !u.resting && u.cooldown <= 0) {
      const d = gap(u, target);
      if (d > 20 && d <= u.combatProfile.config.reach && battle.clearShot(u, target)) battle.attack(u, target, d);
    }
    return true;
  }
  u.screenYield = null;
  return false;
}

// Reuse walk()'s bounded neighbour query. Every melee role can request a lane,
// including allied armies; explicit hold/move orders are never overwritten.
export function requestRangedLane(battle, u, ally, dx, dy, across) {
  if (!melee(u) || ally.team !== u.team || !laneRanged(ally) || ally.order || ally.commanderId || !living(ally) || ally.screening) return false;
  // A lateral deployment or a retreat is not an attempt to reach the front.
  // In particular, flanking cavalry must not scatter a commander's bow centre.
  const target = u.target;
  if (!target || !living(target)) return false;
  const tx = target.x - u.x, ty = target.y - u.y;
  if (tx * dx + ty * dy < Math.hypot(tx, ty) * .65) return false;
  if (!ally.screenYield || ally.screenYield.until <= battle.time) {
    const side = Math.abs(across) > 1 ? Math.sign(across) : (u.id % 2 ? 1 : -1);
    const width = u.combatProfile.radius + ally.combatProfile.radius + 9;
    const bounds = battle.bounds;
    for (const direction of [side, -side]) {
      const shift = direction * width - across;
      const goal = { x: ally.x - dy * shift, y: ally.y + dx * shift };
      if (goal.x < bounds.left + 35 || goal.x > bounds.right - 35 ||
          goal.y < bounds.top + 110 || goal.y > bounds.bottom - 85) continue;
      if (battle.navigation && !battle.navigation.clear(ally, goal, ally.combatProfile.radius)) continue;
      ally.screenYield = { ...goal, until: battle.time + 3, urgent: true, requester: u, dx, dy };
      return true;
    }
    return false;
  }
  return true;
}

// Warn the firing line before contact, including during a charge (which bypasses
// walk). Sample a bounded friendly neighbourhood at most five times a second.
export function anticipateRangedLane(battle, u, dx, dy, speed) {
  const allies = (battle.rangedGrids || battle.enemyGrids)?.[u.team];
  if (!allies || !melee(u) || speed <= 0 || battle.time < (u.laneCheckAt || 0)) return;
  u.laneCheckAt = battle.time + .2 + (u.id % 5) * .013;
  const radius = Math.min(180, Math.max(45, speed * 2.2));
  for (const ally of allies.near(u, radius, 40)) {
    battle.stats.laneChecks = (battle.stats.laneChecks || 0) + 1;
    if (ally === u || !laneRanged(ally) || !living(ally)) continue;
    const ax = ally.x - u.x, ay = ally.y - u.y;
    const along = ax * dx + ay * dy, across = ax * -dy + ay * dx;
    const width = u.combatProfile.radius + ally.combatProfile.radius + 9;
    if (along <= 0 || Math.abs(across) >= width) continue;
    const clearTime = (width - Math.abs(across)) /
      Math.max(3, ally.combatProfile.config.speed * conditionSpeed(ally)) + .9;
    if (along > speed * clearTime + width) continue;
    requestRangedLane(battle, u, ally, dx, dy, across);
  }
}
