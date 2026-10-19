// The 2 Hz director uses constant-size sectors: O(n), never soldier pairs.
export const combatant = u => !!u && u.hp > 0 && !u.removed && !u.commanderId;

// Constant-size formation sectors, evaluated only by the 2 Hz director.
// A central point misses fire hitting a wide wing. Use each sector's actual
// footprint and require both sustained exposure and recent damage, rather
// than abandoning a plan because a distant army contains many archers.
export function preparationUnderFire(state, groups, enemies, time) {
  state.preparationPressure ||= new Map();
  let unsafe = false;
  for (const group of groups) {
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity, health = 0, damage = 0;
    const previous = state.preparationPressure.get(group.id), samples = new Map();
    for (const u of group.units) {
      health += Math.max(0, u.hp);
      samples.set(u.id, {unit:u, hp:Math.max(0, u.hp)});
      // A player taking soldiers out of the formation is not incoming damage.
      damage += Math.max(0, (previous?.samples.get(u.id)?.hp ?? u.hp) - Math.max(0, u.hp));
      if (!combatant(u)) continue;
      left = Math.min(left, u.x); right = Math.max(right, u.x);
      top = Math.min(top, u.y); bottom = Math.max(bottom, u.y);
    }
    for (const [id, sample] of previous?.samples || []) {
      if (!samples.has(id) && sample.unit.hp <= 0) damage += sample.hp;
    }
    const damagedAt = damage > .01 ? time : previous?.damagedAt;
    const exposed = !group.ready && left !== Infinity && enemies.some(u => {
      if (!combatant(u) || !u.combatProfile.ranged) return false;
      const dx = Math.max(left - u.x, 0, u.x - right), dy = Math.max(top - u.y, 0, u.y - bottom);
      return Math.hypot(dx, dy) <= u.combatProfile.config.reach;
    });
    const since = exposed ? previous?.since ?? time : undefined;
    const initialHealth = exposed ? previous?.initialHealth ?? health + damage : undefined;
    const loss = exposed ? (previous?.loss || 0) + damage : 0;
    state.preparationPressure.set(group.id, { samples, damagedAt, since, initialHealth, loss });
    group.pressured = exposed && loss >= initialHealth * .05 && time - since >= 1 - 1e-8
      && time - damagedAt <= 1 + 1e-8;
    if (group.pressured) unsafe = true;
  }
  return unsafe;
}

export function assessOpponents(state, enemies) {
  const result = { count:0, ranged:0, cavalry:0, pikes:0, elephants:0,
    nearest:Infinity, meleeNearest:Infinity, width:0, missilePressure:0,
    leftThreat:0, rightThreat:0, candidates:[], scanned:0 };
  const slots = Array(4).fill(null), scores = Array(4).fill(Infinity);
  const advance = state.advance || 0;
  for (const u of enemies) {
    result.scanned++;
    if (!combatant(u)) continue;
    const p = u.combatProfile, c = p.config;
    const f = (u.x-state.origin.x)*state.forward.x+(u.y-state.origin.y)*state.forward.y-advance;
    const a = (u.x-state.origin.x)*state.side.x+(u.y-state.origin.y)*state.side.y;
    const d = Math.hypot(f,a);
    result.count++;
    result.nearest = Math.min(result.nearest,f);
    result.width = Math.max(result.width,Math.abs(a));
    result.ranged += Number(!!p.ranged);
    result.cavalry += Number(p.role === 'cavalry');
    result.pikes += Number(p.role === 'pike');
    result.elephants += Number(p.role === 'elephant');
    if (!p.ranged) result.meleeNearest = Math.min(result.meleeNearest,d);
    if (p.ranged && d <= c.reach+45) result.missilePressure++;
    // Counter-weapons, remaining health and distance determine flank pressure.
    const threat = Math.max(.2,u.hp/c.hp)*(p.role==='pike'?3:p.role==='elephant'?4:p.ranged?.5:1)
      / (1+Math.max(0,f)/300);
    if (a<=25) result.leftThreat+=threat;
    if (a>=-25) result.rightThreat+=threat;
    if (p.ranged) {
      const slot = a < -60 ? 0 : a < 0 ? 1 : a < 60 ? 2 : 3;
      if (d < scores[slot] || (d === scores[slot] && u.id < slots[slot]?.id)) {
        scores[slot]=d; slots[slot]=u;
      }
    }
  }
  result.candidates=slots.filter(Boolean);
  return result;
}
