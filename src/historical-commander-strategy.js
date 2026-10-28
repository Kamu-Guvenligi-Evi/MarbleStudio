import { activeCommander, tacticArmies } from './historical-commander-tactics.js';
import { combatant, assessOpponents } from './historical-opponent-analysis.js';
import { armySector, armyEnemies } from './historical-alliance-coordination.js';
import { deploymentCorps } from './historical-deployment-corps.js';

const labels = {
  balanced: 'Dengeli merkez ve kanatlar', brace: 'Süvariye karşı mızraklı ön hat',
  close: 'Atış hattına mesafe kapatma', flank: 'Mızrak hattının açık kanadına manevra',
  skirmish: 'Atlı okçularla yıpratma',
};
const center = units => units.reduce((p, u) => ({ x: p.x + u.x / units.length, y: p.y + u.y / units.length }), { x: 0, y: 0 });

// These thresholds are game decisions, not claims that every commander used
// the same historical formation. Existing period-specific doctrines still own
// their troops; this layer selects a response using actual available weapons.
export function selectBattlePlan(own, enemies, frame) {
  const enemy = assessOpponents(frame, enemies), n = Math.max(1, enemy.count);
  const count = pred => own.filter(pred).length, total = Math.max(1, own.length);
  const spears = count(u => u.combatProfile.role === 'pike');
  const shock = count(u => deploymentCorps(u) === 'horse');
  const mounted = count(u => deploymentCorps(u) === 'mounted');
  const enemyShock = enemies.filter(u => combatant(u) && !u.combatProfile.ranged
    && ['cavalry', 'elephant'].includes(u.combatProfile.role)).length;
  const enemyPikes = enemies.filter(u => combatant(u) && deploymentCorps(u) === 'pike').length;
  let kind = 'balanced';
  if (enemyShock / n >= .3 && spears / total >= .15) kind = 'brace';
  else if (enemy.ranged / n >= .4) kind = 'close';
  else if (enemyPikes / n >= .3 && shock / total >= .2) kind = 'flank';
  else if (mounted / total >= .5 && enemy.cavalry / n < .35) kind = 'skirmish';
  const flank = enemy.leftThreat < enemy.rightThreat ? -1 : 1;
  return { kind, label: labels[kind], flank, enemy, spears, shock, mounted,
    key: `${kind}${kind === 'flank' ? flank : ''}` };
}

export class CommanderStrategy {
  constructor() { this.plans = new Map(); this.nextUpdate = 0; this.stats = { decisions: 0, scanned: 0 }; }
  update(b, alive) {
    // Command loss and player control take effect immediately between scans.
    for (const [id, plan] of this.plans) if (b.navigation || activeCommander(b, plan.team, id) !== plan.commander) this.plans.delete(id);
    if (b.navigation || b.time <= 0 || b.time + 1e-8 < this.nextUpdate) return;
    this.nextUpdate = b.time + 1; this.stats.decisions++;
    const teams = [[], []];
    for (const u of alive) if (combatant(u)) teams[u.team].push(u);
    this.stats.scanned += alive.length;
    const present = new Set();
    for (const { id, team, units } of tacticArmies(teams)) {
      const commander = activeCommander(b, team, id);
      const own = units.filter(u => !u.order && !u.tacticalOverride), enemies = armyEnemies(b, id, teams[1 - team]);
      if (!commander || !own.length || !enemies.length) continue;
      present.add(id);
      const origin = center(own), target = center(enemies), heading = armySector(b, id)?.forward;
      const dx = heading?.x ?? target.x - origin.x, dy = heading?.y ?? target.y - origin.y;
      const forward = Math.abs(dx) >= Math.abs(dy) ? { x: dx >= 0 ? 1 : -1, y: 0 } : { x: 0, y: dy >= 0 ? 1 : -1 };
      // Same lateral convention as commanderDeployment, including reverse fronts.
      const side = { x: forward.y ? 1 : 0, y: forward.x ? 1 : 0 };
      const choice = selectBattlePlan(own, enemies, { origin, forward, side });
      this.stats.scanned += own.length + enemies.length;
      const previous = this.plans.get(id);
      if (!previous) this.plans.set(id, { ...choice, team, commander, since: b.time, revision: 0 });
      else {
        previous.enemy = choice.enemy;
        if (previous.key === choice.key) { previous.pending = null; continue; }
        if (previous.pending?.key !== choice.key) previous.pending = { key: choice.key, since: b.time };
        // Require a sustained change; a rider crossing the centre must not flip
        // the army from left to right each second.
        if (b.time - previous.pending.since >= 2 - 1e-8 && b.time - previous.since >= 4 - 1e-8)
          this.plans.set(id, { ...choice, team, commander, since: b.time, revision: previous.revision + 1 });
      }
    }
    for (const id of this.plans.keys()) if (!present.has(id)) this.plans.delete(id);
  }
}
