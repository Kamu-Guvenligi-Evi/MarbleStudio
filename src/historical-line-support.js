import { combatant } from './historical-opponent-analysis.js';

const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Assess the actual defended line, including its dead, rather than the moving
// formation anchor. Three target sectors keep this linear in army size.
export function reinforceLine(b, s, members, enemies) {
  const wings = s.profile.kind === 'wings';
  const line = s.members.filter(m => !m.auxiliary && (wings ? m.role === 'bow' : m.role === 'front'));
  const living = line.filter(m => combatant(m.unit));
  if (!living.length) return;
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  let health = 0, capacity = 0;
  for (const m of line) {
    health += Math.max(0, m.unit.hp); capacity += m.unit.maxHp;
    if (!combatant(m.unit)) continue;
    left = Math.min(left, m.unit.x); right = Math.max(right, m.unit.x);
    top = Math.min(top, m.unit.y); bottom = Math.max(bottom, m.unit.y);
  }
  const damaged = health < (s.lineHealth ?? health) - capacity * .015;
  s.lineHealth = health;
  const center = { x: (left + right) / 2, y: (top + bottom) / 2 };
  const candidates = Array(3).fill(null), scores = Array(3).fill(Infinity);
  let threatCount = 0;
  for (const enemy of enemies) {
    if (!combatant(enemy)) continue;
    const p = enemy.combatProfile;
    const d = Math.hypot(Math.max(left - enemy.x, 0, enemy.x - right), Math.max(top - enemy.y, 0, enemy.y - bottom));
    // Dispatch before impact: allow three seconds of an attacker's approach.
    // Distant archers alone do not trigger a blind cavalry charge.
    if (d > (p.ranged ? damaged ? p.config.reach : 45 : 45 + p.config.speed * 3)) continue;
    threatCount++;
    const lateral = (enemy.x - center.x) * s.side.x + (enemy.y - center.y) * s.side.y;
    const sector = lateral < -35 ? 0 : lateral > 35 ? 2 : 1;
    if (d < scores[sector]) { candidates[sector] = enemy; scores[sector] = d; }
  }
  const threats = candidates.filter(Boolean);
  if (!threats.length) return;
  const support = members.filter(m => (wings ? m.role !== 'bow' : m.role === 'reserve' || m.auxiliary)
    && (!m.unit.combatProfile.ranged || m.unit.combatProfile.role === 'cavalry'));
  // An isolated scout must not pull both wings out of position. Commit a
  // bounded response, expanding it as more attackers approach. Reserves and
  // the foot screen respond before maneuvering cavalry and light scouts.
  const budget = Math.min(support.length, Math.max(2, Math.ceil(threatCount * 1.5)));
  let committed = support.filter(m => m.supportCommitted).length;
  const priorities = [[], [], [], []];
  for (const m of support) priorities[m.role === 'reserve' ? 0 : m.duty?.endsWith('-center') ? 1 : m.auxiliary ? 3 : 2].push(m);
  const loads = new Map();
  for (const m of priorities.flat()) {
    const u = m.unit, p = u.combatProfile;
    // Dispatch once, then let local targeting find reachable enemies. Resetting
    // the target timer at every command decision prevents pursuit recovery and
    // can make infantry chase a distant rider past nearer opponents forever.
    if (m.supportCommitted) continue;
    if (!m.supportCommitted && committed >= budget) continue;
    // Do not pull soldiers out of an existing fight or cancel a running charge.
    if (u.charge || (combatant(u.target) && distance(u, u.target) <= p.config.reach + 18)) continue;
    const target = threats.reduce((best, t) => {
      const score = distance(u, t) + (loads.get(t.id) || 0) * 12;
      return !best || score < best.score ? { unit: t, score } : best;
    }, null).unit;
    loads.set(target.id, (loads.get(target.id) || 0) + 1);
    if (!m.supportCommitted) committed++;
    m.supportCommitted = true;
    m.supportAt ??= b.time;
    u.target = target; u.retarget = 1;
    if (s.supportAt === undefined) {
      s.supportAt = b.time;
      s.supportLoss = 1 - health / Math.max(1, capacity);
      s.history.push({ phase: 'support', time: b.time, reason: 'Merkez tehdit altında; serbest kanatlar ve ihtiyat desteğe geliyor.' });
    }
  }
}
