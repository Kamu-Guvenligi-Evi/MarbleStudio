const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const safetyRadius = unit => {
  const profile = unit.combatProfile;
  return profile.ranged ? clamp(profile.config.reach + 25, 150, 220) : 110;
};

// All commanders share a linear army survey, four times per simulated second.
// Threat queries use bounded spatial samples; soldiers gain no extra AI state.
export class CommanderMovement {
  constructor() {
    this.surveyAfter = 0;
    this.teams = [0, 1].map(team => ({ x: team ? 510 : 90, y: 480, dx: team ? -1 : 1,
      dy: 0, rear: 0, count: 0, threatAfter: 0, evading: false, escape: null }));
    this.armies = new Map();
  }
  state(unit) {
    const id = unit.armyId ?? `army-${unit.team}`;
    if (!this.armies.has(id)) this.armies.set(id, { team: unit.team, x: unit.x, y: unit.y,
      dx: unit.team ? -1 : 1, dy: 0, rear: 0, count: 0, threatAfter: 0, evading: false, escape: null });
    return this.armies.get(id);
  }
  survey(battle, alive) {
    if (battle.time < this.surveyAfter) return;
    this.surveyAfter = battle.time + .25;
    for (const state of this.teams) { state.x = 0; state.y = 0; state.count = 0; }
    for (const unit of alive) this.state(unit);
    for (const state of this.armies.values()) { state.x = 0; state.y = 0; state.count = 0; }
    for (const unit of alive) if (!unit.commanderId) {
      const state = this.teams[unit.team];
      state.x += unit.x; state.y += unit.y; state.count++;
      const army = this.state(unit); army.x += unit.x; army.y += unit.y; army.count++;
    }
    for (const state of this.teams) if (state.count) { state.x /= state.count; state.y /= state.count; }
    for (const state of this.armies.values()) {
      if (state.count) { state.x /= state.count; state.y /= state.count; }
      const enemy = this.teams[1 - state.team];
      const length = distance(state, enemy);
      // Intermingled front ranks must not make the rear switch sides every frame.
      if (state.count && enemy.count && length > 140) {
        const x = state.dx * .75 + (enemy.x - state.x) / length * .25;
        const y = state.dy * .75 + (enemy.y - state.y) / length * .25;
        const norm = Math.hypot(x, y);
        state.dx = x / norm; state.dy = y / norm;
      }
      state.rear = Infinity;
    }
    for (const unit of alive) if (!unit.commanderId) {
      const state = this.state(unit);
      state.rear = Math.min(state.rear, (unit.x - state.x) * state.dx + (unit.y - state.y) * state.dy);
    }
  }
  point(battle, x, y) {
    return { x: clamp(x, battle.bounds.left + 38, battle.bounds.right - 38),
      y: clamp(y, battle.bounds.top + 113, battle.bounds.bottom - 88) };
  }
  steer(battle, unit, dt) {
    const state = this.state(unit), speed = unit.combatProfile.config.speed;
    unit.target = null; unit.charge = null; unit.pendingAttack = null; unit.attack = 0; unit.runDistance = 0;
    if (unit.order?.kind === 'attack') unit.order = null;
    const patrol = Math.sin(battle.time * .22 + unit.team * Math.PI) * 26;
    const rear = Number.isFinite(state.rear) ? state.rear - 72 : 0;
    const anchor = state.count ? this.point(battle, state.x + state.dx * rear - state.dy * patrol,
      state.y + state.dy * rear + state.dx * patrol) : { x: unit.x, y: unit.y };
    if (battle.time >= state.threatAfter) {
      state.threatAfter = battle.time + .2;
      const threats = battle.enemyGrids[1 - unit.team].near(unit, 245, 48)
        .filter(enemy => enemy.hp > 0 && !enemy.commanderId && !enemy.removed);
      state.evading = threats.some(enemy => distance(unit, enemy) < safetyRadius(enemy) + (state.evading ? 24 : 0));
      state.escape = null;
      if (state.evading) {
        let best = -Infinity;
        for (let i = 0; i < 16; i++) {
          const angle = i * Math.PI / 8;
          const goal = this.point(battle, unit.x + Math.cos(angle) * 64, unit.y + Math.sin(angle) * 64);
          if (distance(unit, goal) < 8 || (battle.navigation && !battle.navigation.clear(unit, goal, 6))) continue;
          let clearance = Infinity;
          for (const enemy of threats) clearance = Math.min(clearance, distance(goal, enemy) - safetyRadius(enemy));
          const score = clearance - distance(goal, anchor) * .04;
          if (score > best) { best = score; state.escape = goal; }
        }
      }
    }
    unit.evading = state.evading;
    if (state.evading && state.escape) {
      // Safety temporarily interrupts a move; preserve it so it can resume afterwards.
      const order = unit.order; unit.order = null;
      battle.walk(unit, state.escape, speed * 1.2, dt);
      unit.order = order;
    } else if (unit.order?.kind === 'move' || (unit.order && !unit.order.kind)) {
      if (distance(unit, unit.order) > .75) battle.walk(unit, unit.order, speed * 1.2, dt);
      else { unit.order = null; unit.speed = 0; }
    } else if (unit.order?.kind !== 'hold' && state.count && distance(unit, anchor) > 2) {
      battle.walk(unit, anchor, Math.min(speed * .9, Math.max(6, distance(unit, anchor) * .8)), dt);
    } else {
      unit.speed = 0;
      battle.turn(unit, { x: unit.x + state.dx * 100, y: unit.y + state.dy * 100 }, dt);
    }
    unit.runDistance = 0;
  }
}
