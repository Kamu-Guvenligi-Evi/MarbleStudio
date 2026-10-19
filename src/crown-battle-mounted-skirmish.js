// Local steering for mounted missile troops during independent skirmishing or
// fatigue recovery. Direct player orders are handled before this steering.
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const alive = u => u.hp > 0 && !u.removed;

export function steerMountedSkirmish(battle, u, threat, dt) {
  const cfg = u.combatProfile.config, d = gap(u, threat);
  const enter = Math.min(100, cfg.reach * .65), leave = Math.min(135, cfg.reach * .88);
  if (u.resting && d > leave) { u.speed = 0; u.evading = false; return true; }
  if (d < enter) u.evading = true;
  if (d > leave) u.evading = false;
  if (!u.evading && d > cfg.reach) {
    if (u.mountedSkirmish) u.mountedSkirmish.goal = null;
    return;
  }
  const state = u.mountedSkirmish ||= { ineffective: 0, lastHit: u.lastRangedHit, rethink: 0,
    side: u.team ? -1 : 1, goal: null, exhausted: false };
  // Failed shots/blocked movement are not combat progress. A fruitless pursuit
  // eventually commits to engagement. Successful archery still accumulates
  // physical fatigue in the condition system; hits never restore stamina.
  if (u.lastRangedHit > state.lastHit) { state.ineffective = 0; state.lastHit = u.lastRangedHit; }
  else state.ineffective += dt;
  if (state.ineffective > 30) state.exhausted = true;
  if (state.exhausted) { u.evading = false; return; }

  if (!state.goal || battle.time >= state.rethink || gap(u, state.goal) < 8) {
    state.rethink = battle.time + .28 + (u.id % 5) * .015;
    const dx = (u.x - threat.x) / (d || 1), dy = (u.y - threat.y) / (d || 1);
    // Retreat obliquely instead of compressing every rider onto the same line.
    const outward = u.evading ? 1 : clamp((enter + leave) * .5 - d, -30, 30) / 45;
    const lateral = u.evading ? .35 : 1;
    const ideal = Math.atan2(dy * outward + dx * state.side * lateral,
      dx * outward - dy * state.side * lateral);
    const neighbours = battle.grid.near(u, 85, 40).filter(v => v !== u && alive(v));
    battle.stats.skirmishChecks = (battle.stats.skirmishChecks || 0) + neighbours.length;
    let best = null, bestScore = Infinity;
    for (let i = 0; i < 16; i++) {
      const angle = ideal + i * Math.PI / 8, vx = Math.cos(angle), vy = Math.sin(angle);
      const point = { x: u.x + vx * 48, y: u.y + vy * 48 };
      if (point.x < battle.bounds.left + 38 || point.x > battle.bounds.right - 38 ||
          point.y < battle.bounds.top + 113 || point.y > battle.bounds.bottom - 88) continue;
      if (battle.navigation && !battle.navigation.clear(u, point, u.combatProfile.radius)) continue;
      let score = (1 - Math.cos(angle - ideal)) * 15;
      // Keep the selected lane between decisions, unless it is actually blocked.
      if (state.goal) {
        const oldD = gap(u, state.goal);
        if (oldD > 1) score += (1 - (vx * (state.goal.x - u.x) + vy * (state.goal.y - u.y)) / oldD) * 8;
      }
      const newGap = gap(point, threat);
      score += Math.max(0, enter - newGap) * 2.5;
      score += Math.max(0, newGap - cfg.reach * .92) * .9;
      for (const v of neighbours) {
        const rx = v.x - u.x, ry = v.y - u.y;
        const along = rx * vx + ry * vy, across = Math.abs(rx * -vy + ry * vx);
        const width = u.combatProfile.radius + v.combatProfile.radius + 2;
        if (along > 0 && along < 58 && across < width) score += (width - across) * (v.team === u.team ? 7 : 14);
        if (v.team !== u.team && !v.combatProfile.ranged) score += Math.max(0, 55 - gap(point, v)) * 2;
      }
      if (score < bestScore) { bestScore = score; best = point; }
    }
    state.goal = best;
  }
  // If completely enclosed, use the existing bounded local path planner rather
  // than walking through allies or teleporting across terrain.
  const goal = state.goal || {
    x: clamp(u.x + (u.x - threat.x) / (d || 1) * 70, battle.bounds.left + 38, battle.bounds.right - 38),
    y: clamp(u.y + (u.y - threat.y) / (d || 1) * 70, battle.bounds.top + 113, battle.bounds.bottom - 88),
  };
  const x = u.x, y = u.y;
  battle.walk(u, goal, cfg.speed * (u.evading ? 1 : .8), dt);
  u.evadeSpent += Math.hypot(u.x - x, u.y - y);
  u.runDistance = 0;
  return true;
}
