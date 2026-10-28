import { activeCommander, commanderSupportsDoctrine, armyIdentity, tacticArmies } from './historical-commander-tactics.js';
import { CivilizationTactics } from './historical-civilization-tactics.js';
import { combatant, preparationUnderFire } from './historical-opponent-analysis.js';
import { CommanderFormations } from './historical-commander-formations.js';
import { CommanderStrategy } from './historical-commander-strategy.js';
import { activateCommanderOpenings } from './historical-opening-deployment.js';
import { AllianceCoordination, armySector, armyEnemies, armyInside, fitArmyFront, fallbackArmy } from './historical-alliance-coordination.js';

// Army decisions run twice a second; individual movement uses the existing
// steering/spatial grid. No ethnic stat modifiers or opposing-unit pair scans.
export const FEIGNED_RETREAT_UNITS = new Set(['seljuk_hassa']);
const cfg = u => u.combatProfile.config;
const horseArcher = u => cfg(u).role === 'cavalry' && !!cfg(u).ranged;
const free = u => u.hp > 0 && !u.removed && !u.order && !u.tacticalOverride;
const mean = units => {
  let x = 0, y = 0;
  for (const u of units) { x += u.x; y += u.y; }
  return units.length ? { x: x / units.length, y: y / units.length } : null;
};
const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const dot = (p, o, d) => (p.x - o.x) * d.x + (p.y - o.y) * d.y;

export class HistoricalTactics {
  constructor() {
    this.coordination = new AllianceCoordination();
    this.strategy = new CommanderStrategy();
    this.civilizations = new CivilizationTactics();
    this.formations = new CommanderFormations();
    this.nextUpdate = 0;
    this.initialized = false;
    this.teams = [null, null];
    this.armies = new Map();
    this.intents = new Map();
    this.stats = { decisions: 0, scanned: 0, retreats: 0, envelopments: 0 };
  }
  point(state, forward, across) {
    return { x: state.origin.x + state.forward.x * forward + state.side.x * across,
      y: state.origin.y + state.forward.y * forward + state.side.y * across };
  }
  inside(battle, p, armyId, radius = 0) {
    const b = battle.bounds;
    return p.x >= b.left + 42 && p.x <= b.right - 42 && p.y >= b.top + 118 && p.y <= b.bottom - 93
      && armyInside(battle, armyId, p, radius);
  }
  initialize(battle, armies) {
    this.initialized = true;
    if (battle.navigation) return; // No open-field envelopment through fortress walls.
    for (const { id: armyId, team, units } of tacticArmies(armies)) {
      if (this.armies.has(armyId)) continue;
      if (!commanderSupportsDoctrine(battle, team, 'TR_SELJUK', armyId)) continue;
      // A stationary missile army offers no useful pursuit for a feigned retreat.
      if (battle.tactics?.strategy?.plans.get(armyId)?.kind === 'close') continue;
      const candidates = units.filter(u => free(u) && cfg(u).role === 'cavalry'
        && (FEIGNED_RETREAT_UNITS.has(u.type) || horseArcher(u)));
      if (candidates.length < 12 || candidates.length < units.length * .6 || !armies[1 - team].length) continue;
      const melee = candidates.filter(u => !horseArcher(u));
      if (melee.length < 4) continue; // Both wings need actual shock cavalry.
      const enemies = armyEnemies(battle, armyId, armies[1 - team]);
      const origin = mean(candidates), enemy = mean(enemies);
      const distance = gap(origin, enemy);
      if (distance < 150) continue;
      const forward = armySector(battle, armyId)?.forward || { x: (enemy.x - origin.x) / distance, y: (enemy.y - origin.y) / distance };
      const side = { x: -forward.y, y: forward.x };
      const enemyHalfWidth = enemies.reduce((width, u) => Math.max(width, Math.abs(dot(u, origin, side))), 0);
      // Extra deployment space is marching time, not a failed lure. Keep the
      // wait bounded even against stationary opponents; compact setups retain
      // their existing deadline.
      const enemySpeed = enemies.reduce((sum, u) => sum + cfg(u).speed, 0) / enemies.length;
      const approachTime = Math.min(35, Math.max(0, (battle.deploymentSpacing?.frontGap || 160) - 160) / Math.max(12, enemySpeed));
      const state = { team, armyId, commander: activeCommander(battle, team, armyId), origin, forward, side, phase: 'assemble', since: battle.time,
        started: battle.time, assembleLimit: 18 + approachTime, spread: Math.max(120, enemyHalfWidth + 85),
        initialHealth: candidates.reduce((sum, u) => sum + u.hp, 0),
        armyMembers: [...units], initialArmyHealth: units.reduce((sum, u) => sum + u.hp, 0),
        members: [], history: [] };
      // Deployment can be user-defined, rotated and mirrored. Freeze assignment
      // once so a unit never alternates between the two wings as targets move.
      candidates.sort((a, b) => dot(a, origin, side) - dot(b, origin, side) || a.id - b.id);
      const archers = candidates.filter(horseArcher);
      const orderedMelee = candidates.filter(u => !horseArcher(u));
      const wingSize = Math.min(Math.floor(candidates.length / 3), Math.floor(melee.length / 2));
      const groups = { left: orderedMelee.slice(0, wingSize),
        right: orderedMelee.slice(-wingSize),
        bait: [...orderedMelee.slice(wingSize, -wingSize), ...archers]
          .sort((a, b) => dot(a, origin, side) - dot(b, origin, side) || a.id - b.id) };
      for (const [role, soldiers] of Object.entries(groups)) soldiers.forEach((u, index) => {
        const count = soldiers.length;
        const columns = Math.min(9, count);
        state.members.push({ unit: u, role, offset: (index % columns - (columns - 1) / 2) * 14,
          depth: -Math.floor(index / columns) * 14 });
      });
      // Require room behind the bait and on BOTH wings; do not clamp a trap
      // against an edge into a single overlapping point.
      const rear = Math.min(...state.members.map(m => m.depth)) - 110;
      const envelope = [rear, 110].flatMap(f => [-state.spread - 60, state.spread + 60].map(a => this.point(state, f, a)));
      if (!fitArmyFront(battle, state, envelope)) continue;
      if ([rear, 110].some(f => [-state.spread - 60, state.spread + 60].some(s => !this.inside(battle, this.point(state, f, s), armyId)))) continue;
      state.history.push({ phase: state.phase, time: battle.time });
      this.armies.set(armyId, state);
      this.teams[team] ||= state; // Legacy two-army UI compatibility.
      battle.log(`${team ? 'Kızıl' : 'Mavi'} ordu sahte ricat için merkez ve kanatlarını düzenliyor.`);
    }
  }
  finish(battle, state, reason) {
    state.phase = 'done'; state.reason = reason;
    for (const m of state.members) this.intents.delete(m.unit.id);
    state.history.push({ phase: 'done', time: battle.time, reason });
    battle.log(`${state.team ? 'Kızıl' : 'Mavi'} ordu: ${reason}`);
  }
  regroup(battle, state, reason) {
    if (state.healthRatio <= .9) {
      this.finish(battle, state, `${reason} Hasar altındaki birlikler doğrudan yerel muharebeye dönüyor.`); return;
    }
    state.reason = reason;
    this.transition(battle, state, 'regroup');
    battle.log(`${state.team ? 'Kızıl' : 'Mavi'} ordu: ${reason} Merkez ve kanatlar yeniden birleşiyor.`);
  }
  transition(battle, state, phase) {
    state.phase = phase; state.since = battle.time;
    state.history.push({ phase, time: battle.time });
    if (phase === 'retreat') {
      this.stats.retreats++;
      battle.log(`${state.team ? 'Kızıl' : 'Mavi'} merkez sahte ricada başladı.`);
    } else if (phase === 'envelop') {
      this.stats.envelopments++;
      battle.log(`${state.team ? 'Kızıl' : 'Mavi'} kanatlar takip eden düşmanı çevirmeye çalışıyor.`);
    }
  }
  update(battle, alive) {
    activateCommanderOpenings(battle);
    this.coordination.update(battle, alive);
    this.strategy.update(battle, alive);
    this.updateSeljuk(battle, alive);
    const reserved = ids => new Set([...ids].filter(id => !this.coordination.fallback.has(id)));
    this.civilizations.update(battle, alive, reserved(this.armies.keys()));
    this.formations.update(battle, alive, reserved([...this.armies.keys(), ...this.civilizations.armies.keys()]));
  }
  updateSeljuk(battle, alive) {
    // Two constant-time checks also run between the slower army decisions.
    // Losing a commander must release orders immediately, not half a second later.
    for (const state of this.armies.values()) {
      if (!state || state.phase === 'done') continue;
      if (activeCommander(battle, state.team, state.armyId) === state.commander
        && commanderSupportsDoctrine(battle, state.team, 'TR_SELJUK', state.armyId)) continue;
      this.finish(battle, state, 'Uygun komutan meydanda değil; ordu normal muharebeye dönüyor.');
      for (const member of state.members) this.intents.delete(member.unit.id);
    }
    if (battle.time <= 0 || battle.time + 1e-8 < this.nextUpdate) return;
    if (this.initialized && [...this.armies.values()].every(s => s.phase === 'done')) return;
    this.nextUpdate = battle.time + .5;
    this.stats.decisions++;
    this.stats.scanned += alive.length;
    const armies = [[], []];
    for (const u of alive) if(combatant(u)) armies[u.team].push(u);
    if (!this.initialized) this.initialize(battle, armies);
    this.intents.clear();
    for (const state of this.armies.values()) {
      if (!state || state.phase === 'done') continue;
      const members = state.members.filter(m => free(m.unit));
      const enemies = armyEnemies(battle, state.armyId, armies[1 - state.team]);
      this.stats.scanned += state.members.length + enemies.length;
      const bait = members.filter(m => m.role === 'bait');
      const left = members.filter(m => m.role === 'left'), right = members.filter(m => m.role === 'right');
      if (battle.navigation || members.length < state.members.length * .65 || Math.min(bait.length, left.length, right.length) < 2) {
        this.finish(battle, state, 'Manevra için yeterli serbest kuvvet veya açık alan kalmadı.'); continue;
      }
      // React to actual exposure, including mixed missile armies below the
      // ranged-majority cutoff. Do not sacrifice a formation while waiting for
      // a trap, or march injured soldiers back to an obsolete assembly point.
      // Measure against health at deployment so pre-existing injuries alone
      // cannot cancel a plan. A pursuit already underway can still be worth
      // its risk; keep its physical closure checks and bounded deadline.
      const health = state.members.reduce((sum, m) => sum + (m.unit.removed ? 0 : Math.max(0, m.unit.hp)), 0);
      // Infantry and other troops outside the mounted trap still belong to
      // this army. Their losses must also stop an unsupported waiting plan.
      const armyHealth = state.armyMembers.reduce((sum, u) => sum + (u.removed ? 0 : Math.max(0, u.hp)), 0);
      state.healthRatio = Math.min(health / state.initialHealth, armyHealth / state.initialArmyHealth);
      if (['assemble', 'regroup'].includes(state.phase) && state.healthRatio <= .9) {
        this.finish(battle, state, 'Manevra ağır hasar altında; birlikler doğrudan yerel muharebeye dönüyor.'); continue;
      }
      const center = mean(bait.map(m => m.unit));
      let nearest = null, nearestDistance = Infinity, rangedCount = 0, followers = 0;
      let approaching = 0, meleeDistance = Infinity;
      const observations = new Map();
      let followerX = 0, followerY = 0;
      const followed = [];
      // One linear enemy pass per army decision, not one search per soldier.
      for (const enemy of enemies) {
        const previous = state.observations?.get(enemy.id);
        observations.set(enemy.id, { x: enemy.x, y: enemy.y });
        if(enemy.combatProfile.ranged)rangedCount++;
        if (Math.abs(dot(enemy, state.origin, state.side)) > state.spread) continue;
        const d = gap(center, enemy);
        if (d < nearestDistance) { nearest = enemy; nearestDistance = d; }
        if (!enemy.combatProfile.ranged) {
          meleeDistance = Math.min(meleeDistance, d);
          // Compare both positions against today's bait center: movement of
          // our own screen must not masquerade as enemy pursuit.
          if (d < 190 && previous && gap(previous, center) - d > .5) approaching++;
        }
        if((state.phase==='retreat'||state.phase==='envelop')&&!enemy.combatProfile.ranged&&d<190&&state.pursuers.has(enemy.id)
          &&state.pursuers.get(enemy.id)-dot(enemy,state.origin,state.forward)>=35) {
          followers++;followerX+=enemy.x;followerY+=enemy.y;followed.push(enemy);
        }
      }
      state.followers=followers;
      state.observations = observations;
      state.approaching = approaching;
      const age = battle.time - state.since;
      if (state.phase === 'assemble') {
        if(rangedCount>=armies[1-state.team].length*.6) {
          this.finish(battle,state,'Atış ağırlıklı rakip ricada uygun değil; hareketli muharebeye dönülüyor.');continue;
        }
        const wings = [left, right].map((wing, i) => {
          const readyCount = wing.filter(m => gap(m.unit, this.point(state, 15 + m.depth,
            (i ? 1 : -1) * state.spread + m.offset)) < 38).length;
          return { id: i, units: wing.map(m => m.unit), readyCount, ready: readyCount >= Math.ceil(wing.length * .5) };
        });
        if (preparationUnderFire(state, wings, enemies, battle.time)) {
          this.finish(battle, state, 'Hazırlıksız kanat ateş altında; birlikler yerel muharebeye dönüyor.'); continue;
        }
        const required = Math.max(3, Math.ceil(Math.min(enemies.length, members.length) * .2));
        if (meleeDistance < 110 && approaching >= required
          && wings.reduce((sum,w)=>sum+w.readyCount,0) >= (left.length+right.length)*.5) {
          state.retreatStart = center;
          state.pursuers = new Map(enemies.map(u => [u.id, dot(u, state.origin, state.forward)]));
          state.retreatGoal = this.point(state, Math.min(-45, dot(center, state.origin, state.forward) - 100), 0);
          if (!this.inside(battle, state.retreatGoal, state.armyId)) { fallbackArmy(battle, state.armyId); this.finish(battle, state, 'Geri çekilmek için alan yok.'); continue; }
          this.transition(battle, state, 'retreat');
        } else if (nearestDistance < 35) {
          this.finish(battle, state, 'Düşman düzen kurulmadan merkeze ulaştı; birlikler yerel muharebeye dönüyor.'); continue;
        } else if (age >= state.assembleLimit) {
          this.regroup(battle, state, 'Düşman uygun takibe gelmedi; ricat başlatılmadı.');
        }
      } else if (state.phase === 'retreat') {
        const withdrawn = dot(state.retreatStart, center, state.forward);
        // A hold-position opponent never triggers a successful trap. Actual
        // advance into the retreat lane is required, not just elapsed time.
        const required=Math.max(3,Math.ceil(Math.min(armies[1-state.team].length,members.length)*.2));
        if(followers>members.length*1.25) {
          this.finish(battle,state,'Takip kuvveti kanatları aşıyor; kuşatma iptal edildi.');continue;
        }
        const pursuitCenter = followers ? { x: followerX/followers, y: followerY/followers } : null;
        // The enemy must ENTER the space between the wings, not merely move
        // 35 pixels somewhere ahead of them. Both wings then have a short route.
        if (followers>=required && withdrawn >= 55 && nearestDistance < 125
          && dot(pursuitCenter, state.origin, state.forward) <= 65) {
          state.trap = { x: followerX/followers, y: followerY/followers };
          state.lured = followed;
          this.transition(battle, state, 'envelop');
        } else if (age >= 12) {
          this.regroup(battle, state, 'Düşman kapanın içine takibe gelmedi.');
        }
      } else if (state.phase === 'envelop') {
        const trapped = state.lured.filter(combatant);
        if (!trapped.length) { this.finish(battle, state, 'Takip kuvveti etkisiz hale geldi.'); continue; }
        state.trap = mean(trapped);
        // Measure actual rear/side positions. A timeout cannot report success.
        const readyWing = (wing, sign) => wing.filter(m => {
          const f = dot(m.unit, state.trap, state.forward), a = sign * dot(m.unit, state.trap, state.side);
          return f >= 28 && a >= 75;
        }).length >= Math.ceil(wing.length * .6);
        // The wings close by CHARGING, not by walking into weapon range first.
        if (readyWing(left, -1) && readyWing(right, 1)) {
          state.closure = { time: battle.time, trap: { ...state.trap },
            left: mean(left.map(m => m.unit)), right: mean(right.map(m => m.unit)), bait: center };
          for (let i = 0; i < members.length; i++) {
            members[i].chargeTarget = members[i].unit.target || trapped[i % trapped.length];
          }
          state.launched = new Set();
          state.chargeRelease = { distances: [] };
          this.transition(battle, state, 'charge');
        }
        if (state.phase === 'envelop' && (age >= 14 || gap(state.trap, center) > 220)) {
          this.regroup(battle, state, 'Kanatlar kapanamadı; kuşatma iptal edildi.');
        }
      } else if (state.phase === 'charge') {
        const targets = state.lured.filter(combatant);
        if (!targets.length) { this.finish(battle, state, 'Takip kuvveti etkisiz hale geldi.'); continue; }
        for (let i = 0; i < members.length; i++) {
          const m = members[i];
          if (horseArcher(m.unit)) continue;
          // Bounded spatial query: a distant assigned enemy must not disguise a
          // soldier already in contact with the front of the pursuit group.
          const nearby = battle.enemyGrids?.[1 - state.team]?.near(m.unit, 180, 32) || [];
          m.chargeTarget = nearby.filter(combatant).reduce((best, u) => !best || gap(m.unit, u) < gap(m.unit, best) ? u : best, null)
            || (combatant(m.chargeTarget) ? m.chargeTarget : targets[i % targets.length]);
        }
        // A cavalryman needs room to turn, accelerate and cover the engine's
        // 28-pixel run-up BEFORE reaching melee range. Never grant free momentum.
        // Release riders as their lanes open. A trapped rider must not force
        // a whole wing to stand still and lose its own run-up distance.
        for (const m of members) {
          if (horseArcher(m.unit)) continue;
          if (state.launched.has(m.unit.id)) continue;
          const distance = gap(m.unit, m.chargeTarget);
          if (distance < 95 && age + 1e-8 < 3) continue;
          state.launched.add(m.unit.id);
          state.chargeRelease.distances.push({ id: m.unit.id, role: m.role, distance, time: battle.time, runUp: distance >= 95 });
          m.unit.target = m.chargeTarget; m.unit.retarget = 3;
        }
        if (members.every(m => horseArcher(m.unit) || state.launched.has(m.unit.id))) {
          state.chargeRelease.time = battle.time;
          this.finish(battle, state, 'Hücum koridorları açıldı; mesafesi olan atlılar hızlanıyor, temastakiler savaşıyor.'); continue;
        }
      } else if (state.phase === 'regroup') {
        const ready = members.filter(m => gap(m.unit, this.point(state, m.depth,
          (m.role === 'bait' ? 0 : m.role === 'left' ? -65 : 65) + m.offset)) < 45).length;
        if (age >= 6 || ready >= members.length * .7) {
          this.finish(battle, state, state.reason); continue;
        }
      }
      for (const member of members) {
        if (state.phase === 'charge' && state.launched.has(member.unit.id)) continue;
        const sign = member.role === 'left' ? -1 : 1;
        let goal;
        if (state.phase === 'assemble') goal = this.point(state, (member.role === 'bait' ? 85 : 15) + member.depth,
          member.role === 'bait' ? member.offset : sign * state.spread + member.offset);
        else if (state.phase === 'retreat') goal = member.role === 'bait'
          ? { x: state.retreatGoal.x + state.side.x * member.offset + state.forward.x * member.depth,
            y: state.retreatGoal.y + state.side.y * member.offset + state.forward.y * member.depth }
          : this.point(state, 15 + member.depth, sign * state.spread + member.offset);
        else if (state.phase === 'envelop') {
          if (member.role === 'bait') {
            // Open turning/run-up room while the wings reach the enemy's rear.
            const rear = horseArcher(member.unit) ? dot(state.trap, state.origin, state.forward) - 120
              : Math.min(dot(state.retreatGoal, state.origin, state.forward),
                (nearest ? dot(nearest, state.origin, state.forward) : dot(state.trap, state.origin, state.forward)) - 120);
            goal = this.point(state, rear + member.depth, member.offset);
          } else {
            // Route outside first, then behind the MOVING pursuit group.
            const rear = 65 - member.depth;
            const across = sign * (state.spread + 25) + member.offset * .5;
            const forward = dot(member.unit, state.trap, state.forward) >= 28 ? rear
              : Math.abs(dot(member.unit, state.trap, state.side)) < state.spread - 25
                ? dot(member.unit, state.trap, state.forward) : rear;
            goal = { x: state.trap.x + state.forward.x * forward + state.side.x * across,
              y: state.trap.y + state.forward.y * forward + state.side.y * across };
          }
        }
        else if (state.phase === 'regroup') goal = this.point(state, member.depth,
          (member.role === 'bait' ? 0 : sign * 65) + member.offset);
        else if (state.phase === 'charge') {
          if (horseArcher(member.unit)) {
            // Keep the firing screen behind the pursuit, outside both charge lanes.
            goal = this.point(state, dot(state.trap, state.origin, state.forward) - 120 + member.depth, member.offset);
          } else {
            const target = member.chargeTarget, d = gap(member.unit, target);
            if (d >= 115) goal = { x: member.unit.x, y: member.unit.y };
            else {
              const dx = d > 1 ? (member.unit.x - target.x) / d : -state.forward.x;
              const dy = d > 1 ? (member.unit.y - target.y) / d : -state.forward.y;
              goal = { x: target.x + dx * 120, y: target.y + dy * 120 };
            }
          }
        }
        const retreat = (state.phase === 'retreat' || state.phase === 'envelop') && member.role === 'bait';
        // Maintain a catchable distance: outrunning infantry defeats the lure.
        const pace = nearest ? Math.min(cfg(member.unit).speed,
          cfg(nearest).speed * (nearestDistance < 60 ? 1.25 : nearestDistance > 90 ? .45 : .85)) : cfg(member.unit).speed;
        if (goal && !this.inside(battle, goal, state.armyId, member.unit.combatProfile.radius)) {
          fallbackArmy(battle, state.armyId);
          this.finish(battle, state, 'Manevra sınır dışına taşıyor; birlikler yerel muharebeye dönüyor.');
          for (const m of members) this.intents.delete(m.unit.id);
          break;
        }
        if (goal) this.intents.set(member.unit.id, {
          goal, retreat, pace: retreat && state.phase === 'retreat' ? pace : cfg(member.unit).speed,
          flanking: (state.phase === 'envelop' && member.role !== 'bait') || state.phase === 'charge' });
      }
    }
  }
  steer(battle, unit, target, dt) {
    if (!free(unit)) return false;
    if (!this.intents.has(unit.id)) return this.civilizations.steer(battle, unit, target, dt)
      || this.formations.steer(battle, unit, target, dt);
    const state = this.armies.get(armyIdentity(unit));
    if (!state || state.phase === 'done' || activeCommander(battle, unit.team, state.armyId) !== state.commander
      || !commanderSupportsDoctrine(battle, unit.team, 'TR_SELJUK', state.armyId)) return false;
    const intent = this.intents.get(unit.id);
    if (!intent) return false;
    const config = cfg(unit), d = gap(unit, target);
    // An intercepted wing must defend itself during envelopment. Keep bait
    // withdrawal and the charge phase's deliberate run-up separation intact.
    if (!config.ranged && !intent.retreat && (!intent.flanking || state.phase === 'envelop')
      && d <= config.reach + 6) return false;
    unit.charge = null;
    if (unit.attack > 0 && !config.ranged) return true;
    if (gap(unit, intent.goal) > 7) {
      const x = unit.x, y = unit.y;
      const threat = unit.nearbyThreat;
      const pressed = config.ranged && intent.retreat && threat?.hp > 0 && !threat.removed && gap(unit, threat) < 55;
      battle.walk(unit, intent.goal, pressed ? config.speed : intent.pace, dt);
      if (intent.retreat) unit.evadeSpent = Math.min(180, (unit.evadeSpent || 0) + Math.hypot(unit.x - x, unit.y - y));
    } else { unit.speed = 0; unit.runDistance = 0; battle.turn(unit, target, dt); }
    if (config.ranged && d <= config.reach && d > 20 && unit.cooldown <= 0 && battle.clearShot(unit, target)) battle.attack(unit, target, d);
    return true;
  }
}
