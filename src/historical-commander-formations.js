import { commanderDeployment } from './historical-commander-deployment.js';
import { activeCommander, armyIdentity, tacticArmies } from './historical-commander-tactics.js';
import { combatant } from './historical-opponent-analysis.js';
import { armyBounds, armySector, armyEnemies, armyInside } from './historical-alliance-coordination.js';
import { compactDeployment } from './historical-compact-deployment.js';
import { deploymentCorps } from './historical-deployment-corps.js';

const free = u => combatant(u) && !u.order && !u.tacticalOverride;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const center = units => units.reduce((p, u) => ({ x: p.x + u.x / units.length, y: p.y + u.y / units.length }), { x: 0, y: 0 });

// Commanders with a specific historical plan retain ownership of their army.
// Other commanders assemble a combined-arms line, then advance it to contact.
export class CommanderFormations {
  constructor() {
    this.armies = new Map(); this.intents = new Map(); this.nextUpdate = 0; this.initialized = false; this.attempted = new Set();
    this.stats = { decisions: 0, scanned: 0 };
  }
  finish(s) {
    s.phase = 'done';
    for (const m of s.members) this.intents.delete(m.unit.id);
  }
  deployment(b, armyId, own, enemies, strategy) {
    const origin = center(own), enemy = center(enemies), heading = armySector(b, armyId)?.forward;
    const dx = heading?.x ?? enemy.x - origin.x, dy = heading?.y ?? enemy.y - origin.y;
    const direction = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 0 : 180) : (dy >= 0 ? 90 : 270);
    const underFire = enemies.filter(u => u.combatProfile.ranged).length >= enemies.length * .4;
    const bounds = armyBounds(b, armyId);
    let plan = commanderDeployment(own, origin, direction, bounds, underFire, strategy);
    if (!plan && strategy?.kind === 'flank') {
      strategy = { ...strategy, kind: 'balanced', label: 'Kanat alanı kapalı; destekli cephe ilerleyişi' };
      plan = commanderDeployment(own, origin, direction, bounds, underFire, strategy);
    }
    plan ||= compactDeployment(own, origin, direction, bounds);
    return plan && { ...plan, strategy };
  }
  update(b, alive, reserved) {
    for (const s of this.armies.values()) if (s.phase !== 'done'
      && (b.navigation || reserved.has(s.armyId)
        || (s.phase === 'assemble' && b.time - s.started >= s.assembleLimit - 1e-8)
        || (s.phase === 'advance' && (b.time - s.lastAdvance >= 8 || b.time - s.advanceStarted >= 60))
        || activeCommander(b, s.team, s.armyId) !== s.commander)) this.finish(s);
    if (b.time <= 0 || b.time + 1e-8 < this.nextUpdate) return;
    const pendingFallback = [...(b.tactics?.coordination?.fallback || [])].some(id => !this.attempted.has(id));
    if (this.initialized && !pendingFallback && [...this.armies.values()].every(s => s.phase === 'done')) return;
    this.nextUpdate = b.time + 1; this.stats.decisions++; this.stats.scanned += alive.length;
    const teams = [[], []];
    for (const u of alive) if (combatant(u)) teams[u.team].push(u);
    if ((!this.initialized || pendingFallback) && !b.navigation) for (const { id: armyId, team, units } of tacticArmies(teams)) {
      if (reserved.has(armyId) || this.attempted.has(armyId)) continue;
      this.attempted.add(armyId);
      const commander = activeCommander(b, team, armyId), own = units.filter(free), enemies = armyEnemies(b, armyId, teams[1 - team]);
      if (!commander || own.length < 4 || !enemies.length) continue;
      const strategy = b.tactics?.strategy?.plans.get(armyId);
      const plan = this.deployment(b, armyId, own, enemies, strategy);
      if (!plan) continue;
      const s = { armyId, team, commander, phase: 'assemble', started: b.time, ...plan,
        advance: 0, requestedKey: strategy?.key, created: b.time, replans: 0,
        marchSpeed: Math.min(...own.map(u => u.combatProfile.config.speed)) * .8 };
      // Large armies need time to physically reach their slots. An approaching
      // enemy still releases the formation immediately in steer(). Use a
      // percentile so one obstructed soldier cannot hold everyone indefinitely.
      const travel = s.members.map(m => distance(m.unit, m.goal) / Math.max(1, m.unit.combatProfile.config.speed))
        .sort((a, b) => a - b);
      s.assembleLimit = b.deploymentSpacing?.frontGap > 160
        ? Math.min(25, Math.max(5, 1 + (travel[Math.floor(travel.length * .9)] || 0) * 2.4)) : 5;
      this.armies.set(armyId, s);
    }
    this.initialized = true;
    this.intents.clear();
    for (const s of this.armies.values()) {
      if (s.phase === 'done') continue;
      const strategy = b.tactics?.strategy?.plans.get(s.armyId);
      // Re-form only away from contact, at most once. Never recall soldiers who
      // are fighting, under fire, or carrying player orders to new assembly slots.
      if (strategy && strategy.key !== s.requestedKey && s.replans < 1 && b.time - s.created < 20
        && strategy.enemy.nearest > 280 && !strategy.enemy.missilePressure
        && s.members.every(m => !m.engaged && free(m.unit))) {
        const plan = this.deployment(b, s.armyId, s.members.map(m => m.unit), armyEnemies(b, s.armyId, teams[1 - s.team]), strategy);
        if (plan) {
          Object.assign(s, plan, { phase: 'assemble', started: b.time, advance: 0, holdUntil: null,
            requestedKey: strategy.key, assembleLimit: Math.min(s.assembleLimit, 10) });
          s.replans++;
        }
      }
      const members = s.members.filter(m => free(m.unit) && !m.engaged);
      if (!members.length || !teams[1 - s.team].length) { this.finish(s); continue; }
      // Stepwise ranks must not keep waiting for their slowest soldiers while
      // missiles wear down the army. Include fallen soldiers in both the loss
      // and recent-fire assessment; a fatal volley still requires a response.
      const exposed = s.members.filter(m => !m.unit.order && !m.unit.tacticalOverride);
      const capacity = exposed.reduce((sum, m) => sum + m.unit.maxHp, 0);
      const health = exposed.reduce((sum, m) => sum + Math.max(0, m.unit.hp), 0);
      const underFire = exposed.filter(m => b.time - m.unit.lastMissileDamage < 2).length
        >= Math.max(1, members.length * .05);
      if (underFire) s.missilePressureAt ??= b.time;
      else s.missilePressureAt = undefined;
      // Sustained incoming fire demands a response before casualties mount.
      // A brief isolated hit still permits the ranks to finish deploying.
      if (underFire && (health <= capacity * .9 || b.time - s.missilePressureAt >= 2 - 1e-8)) {
        s.releaseReason = 'missile-pressure'; s.releasedAt = b.time;
        this.finish(s); continue;
      }
      // Batteries may shoot while the melee line closes the distance.
      const marching = s.phase === 'advance' ? members.filter(m => !m.unit.combatProfile.ranged) : members;
      const line = marching.length ? marching : members;
      if (line.filter(m => distance(m.unit, m.goal) < 20).length >= line.length * .75) {
        if (s.phase === 'assemble') {
          s.phase = 'advance'; s.advanceStarted = b.time; s.lastAdvance = b.time;
          if (s.strategy?.kind === 'brace') s.holdUntil = b.time + 6;
        }
        s.holding = s.holdUntil > b.time && (!strategy || strategy.kind === 'brace') && !strategy?.enemy.missilePressure;
        if (s.holding) {
          s.lastAdvance = b.time;
          for (const m of members) this.intents.set(m.unit.id, { ...m, member: m, state: s });
          continue;
        }
        const step = s.marchSpeed * .8;
        const goals = members.map(m => ({ ...m.goal, x: m.goal.x + s.forward.x * step, y: m.goal.y + s.forward.y * step }));
        if (goals.some(p => p.x - p.radius < b.bounds.left + 45 || p.x + p.radius > b.bounds.right - 45
          || p.y - p.radius < b.bounds.top + 115 || p.y + p.radius > b.bounds.bottom - 95
          || !armyInside(b, s.armyId, p, p.radius))) {
          this.finish(s); continue;
        }
        members.forEach((m, i) => { m.goal = goals[i]; });
        s.advance += step; s.lastAdvance = b.time;
      }
      for (const m of members) this.intents.set(m.unit.id, { ...m, member: m, state: s });
    }
  }
  steer(b, u, target, dt) {
    const intent = this.intents.get(u.id);
    if (!intent || !free(u) || b.navigation) return false;
    const s = intent.state;
    if (s.phase === 'done' || activeCommander(b, u.team, armyIdentity(u)) !== s.commander) return false;
    const profile = u.combatProfile, cfg = profile.config;
    if (intent.flanking && !intent.member.cleared) {
      const lateral = { x: s.forward.y ? 1 : 0, y: s.forward.x ? 1 : 0 };
      intent.member.cleared = Math.abs((u.x - intent.goal.x) * lateral.x + (u.y - intent.goal.y) * lateral.y) < 20;
      if (!intent.member.cleared) u.charge = null;
    }
    const release = profile.role === 'cavalry' && (!intent.flanking || intent.member.cleared) ? 175
      : Math.max(cfg.reach, target.combatProfile.ranged ? 0 : target.combatProfile.config.reach) + 35;
    // Shooting is local, not an order for the entire army to break ranks.
    if (profile.ranged && distance(u, target) <= cfg.reach) return false;
    if (u.charge || (!profile.ranged && distance(u, target) <= release)) {
      if (s.strategy?.kind === 'flank' || ['light-horse', 'escort'].includes(deploymentCorps(u))) {
        intent.member.engaged = true; this.intents.delete(u.id);
      } else this.finish(s);
      return false;
    }
    if (u.attack > 0) return false;
    if (distance(u, intent.goal) > 7) b.walk(u, intent.goal, s.phase === 'advance' ? s.marchSpeed : cfg.speed, dt);
    else { u.speed = 0; u.runDistance = 0; b.turn(u, target, dt); }
    return true;
  }
}
