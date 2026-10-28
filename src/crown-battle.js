import { HISTORICAL_TYPES, validateHistoricalArmies } from './historical-combat.js';
import { COMMANDER_TYPES, commanderType, resolveCommanderIds } from './historical-commander-types.js';
import { formationLayout, FORMATIONS } from './crown-battle-formations.js';
import { BattleNavigation } from './crown-battle-navigation.js';
import { createArrow, createBullet, loftArrow, advanceArrow } from './crown-battle-projectiles.js';
import { firstArrowContact, chargeContacts } from './crown-battle-contact.js';
import { HistoricalTactics } from './historical-tactics.js';
import { CommanderMovement } from './historical-commander-movement.js';
import { formationRoute } from './crown-battle-formation-path.js';
import { validateArmyConfigs, legacyArmyConfigs } from './crown-battle-alliances.js';
import { deployHistoricalArmies } from './historical-army-deployment.js';
import { deployClassicCrowd } from './crown-battle-crowd-deployment.js';
import { LocalBattleGrid } from './crown-battle-local-grid.js';
import { createBattleBounds } from './crown-battle-bounds.js';
import { trackPursuit, npcWaypoint } from './crown-battle-npc-routing.js';
import { steerScreening, requestRangedLane, requestClearShotLane, anticipateRangedLane } from './crown-battle-screening.js';
import { steerMountedSkirmish } from './crown-battle-mounted-skirmish.js';
import { conditionSpeed, conditionCadence, exertAttack, damageMorale, surveyCondition, updateCondition, steerRally } from './crown-battle-condition.js';
export const WORLD = { width: 600, height: 960 };
export const TYPES = {
  sword: { name: 'Kılıçlı', hp: 100, speed: 24, damage: 17, reach: 14, cooldown: .85 },
  pike: { name: 'Mızraklı', hp: 88, speed: 20, damage: 21, reach: 25, cooldown: 1.15 },
  archer: { name: 'Okçu', hp: 58, speed: 23, damage: 13, reach: 170, cooldown: 1.65 },
  cavalry: { name: 'Süvari', hp: 165, speed: 43, damage: 24, reach: 20, cooldown: 1.1 },
};
export const UNIT_TYPES = { ...TYPES, ...HISTORICAL_TYPES, ...COMMANDER_TYPES };
const profileOf = unit => unit.combatProfile || combatProfiles[unit.type];
const configOf = unit => profileOf(unit).config;
export const roleOf = unit => profileOf(unit).role;
const mounted = unit => { const role = roleOf(unit); return role === 'cavalry' || role === 'elephant'; };
const ranged = unit => profileOf(unit).ranged;
export function random(seed = 1) {
  let value = (Number(seed) || 1) >>> 0;
  return () => { value += 0x6D2B79F5; let t = value; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Battlefield coordinates are bounded; the two-dimensional norm avoids the
// general scaling/iteration in Math.hypot in millions of target comparisons.
const distance = (a, b) => { const x = a.x - b.x, y = a.y - b.y; return Math.sqrt(x * x + y * y); };
const combatProfiles = Object.fromEntries(Object.entries(UNIT_TYPES).map(([type, config]) => {
  const role = config.role || type;
  return [type, { config, role, ranged: role === 'archer' || config.ranged,
    radius: config.radius ?? (role === 'elephant' ? 14 : role === 'cavalry' ? 5.5 : 3.75) }];
}));
const radiusOf = u => profileOf(u).radius;

// Every soldier keeps the same property layout throughout combat. Adding
// movement, gunfire and hit fields in different orders makes the hot neighbor
// loops polymorphic just when the armies meet.
function combatUnit(u) {
  const unit = {
    combatProfile: combatProfiles[u.type],
    id:u.id, team:u.team, armyId:u.armyId ?? `army-${u.team}`, type:u.type, x:NaN, y:NaN, hp:NaN, maxHp:u.maxHp, face:u.face,
    cooldown:NaN, target:u.target, retarget:NaN, chargeCooldown:NaN,
    charge:u.charge, order:u.order, flash:NaN, attack:NaN, moving:u.moving,
    phase:u.phase, deadAt:u.deadAt, vx:NaN, vy:NaN,
    commanderId:u.commanderId, name:u.name, headingX:undefined, headingY:undefined,
    speed:undefined, runDistance:undefined, evadeSpent:undefined, stuck:undefined,
    lastX:undefined, lastY:undefined, stagger:undefined, pendingAttack:undefined, pursuit:null, npcRoute:null,
    fireRemaining:undefined, weaponPhase:undefined, reloadRemaining:undefined,
    evading:undefined, removed:undefined, navGoal:undefined, navPath:undefined,
    staggerX:undefined, hitDirection:0, deathDirection:undefined, nearbyThreat:null, tacticalOverride:false,
    screening:null, screenYield:null, screenCheckAt:NaN, mountedSkirmish:null, lastRangedHit:NaN,
    laneCheckAt:undefined, lastMissileDamage:undefined,
    fatigue:NaN, morale:NaN, resting:false, lastExertion:-Infinity, lastDamage:-Infinity,
    seenArmyLoss:NaN, seenCommanderLoss:false, rally:null, rallyCooldown:NaN,
  };
  // Reserve floating-point storage before spawning the next soldier. Otherwise
  // the first fractional movement/damage repeatedly changes shared layouts,
  // invalidating optimized neighbor loops across the whole army.
  unit.x=u.x; unit.y=u.y; unit.hp=u.hp;
  unit.cooldown=u.cooldown; unit.retarget=u.retarget; unit.chargeCooldown=u.chargeCooldown;
  unit.flash=u.flash; unit.attack=u.attack; unit.vx=u.vx; unit.vy=u.vy;
  unit.screenCheckAt=0; unit.lastRangedHit=0;
  unit.fatigue=0; unit.morale=100; unit.seenArmyLoss=0; unit.rallyCooldown=0;
  return unit;
}

// Bounded samples per cell also bound work for pathological, overlapping crowds.
// No frame performs a unit-by-unit scan of the opposing army.
const sampleOffsets = new Map();
const LOCAL_X = [0,-1,0,1,-1,1,-1,0,1], LOCAL_Y = [0,-1,-1,-1,0,0,1,1,1];
class SpatialGrid {
  constructor(units) {
    this.minX = this.minY = Infinity; this.maxX = this.maxY = -Infinity;
    for (const u of units) {
      this.minX = Math.min(this.minX, u.x); this.maxX = Math.max(this.maxX, u.x);
      this.minY = Math.min(this.minY, u.y); this.maxY = Math.max(this.maxY, u.y);
    }
    this.minX = Math.floor(this.minX / 40); this.maxX = Math.floor(this.maxX / 40);
    this.minY = Math.floor(this.minY / 40); this.maxY = Math.floor(this.maxY / 40);
    this.width = units.length ? this.maxX - this.minX + 1 : 0;
    this.cells = new Array(units.length ? this.width * (this.maxY - this.minY + 1) : 0);
    for (const u of units) {
      const index = (Math.floor(u.y / 40) - this.minY) * this.width + Math.floor(u.x / 40) - this.minX;
      (this.cells[index] ||= []).push(u);
    }
    for (const bucket of this.cells) {
      if (!bucket) continue;
      const length = bucket.length;
      let offsets = sampleOffsets.get(length);
      if (!offsets) {
        const count = Math.min(16, length);
        offsets = Array.from({ length: count }, (_, i) => length <= 16 ? i : Math.floor(i * length / count));
        sampleOffsets.set(length, offsets);
      }
      bucket.sampleOffsets = offsets;
    }
  }
  near(point, radius, limit = 96) {
    if (radius <= 40) return this.nearLocal(point, radius, limit);
    const px = point.x, py = point.y;
    const result = [], x = Math.floor(px / 40), y = Math.floor(py / 40);
    if (!this.cells.length) return result;
    const rings = Math.min(Math.ceil(radius / 40), Math.max(Math.abs(x - this.minX), Math.abs(x - this.maxX), Math.abs(y - this.minY), Math.abs(y - this.maxY)));
    const radiusSquared = radius * radius, offset = (point.id || 0) * 17;
    const firstRing = Math.max(0, this.minX - x, x - this.maxX, this.minY - y, y - this.maxY);
    for (let ring = firstRing; ring <= rings && result.length < limit; ring++) {
      for (let yy = Math.max(this.minY, y - ring); yy <= Math.min(this.maxY, y + ring) && result.length < limit; yy++) {
        const row = (yy - this.minY) * this.width;
        const dy = Math.max(yy * 40 - py, 0, py - (yy + 1) * 40);
        const dySquared = dy * dy;
        if (dySquared > radiusSquared) continue;
        const edge = Math.abs(yy - y) === ring;
        const first = edge ? Math.max(this.minX, x - ring) : x - ring;
        const last = edge ? Math.min(this.maxX, x + ring) : x + ring;
        for (let xx = first; xx <= last && result.length < limit; xx += edge ? 1 : Math.max(1, ring * 2)) {
          if (xx < this.minX || xx > this.maxX) continue;
          const bucket = this.cells[row + xx - this.minX];
          if (!bucket) continue;
          // Skip cells outside the query circle before sampling their soldiers.
          const dx = Math.max(xx * 40 - px, 0, px - (xx + 1) * 40);
          if (dx * dx + dySquared > radiusSquared) continue;
          const length = bucket.length, offsets = bucket.sampleOffsets, count = offsets.length, start = offset % length;
          for (let i = 0; i < count && result.length < limit; i++) {
            const index = start + offsets[i];
            const u = bucket[index >= length ? index - length : index];
            if (u !== point && u.hp > 0 && (px - u.x) ** 2 + (py - u.y) ** 2 <= radiusSquared) result.push(u);
          }
        }
      }
    }
    return result;
  }
  nearLocal(point, radius, limit) {
    const result = [], px = point.x, py = point.y;
    const x = Math.floor(px / 40), y = Math.floor(py / 40);
    const minX = Math.max(this.minX, Math.floor((px-radius)/40)), maxX = Math.min(this.maxX, Math.floor((px+radius)/40));
    const minY = Math.max(this.minY, Math.floor((py-radius)/40)), maxY = Math.min(this.maxY, Math.floor((py+radius)/40));
    const radiusSquared = radius*radius, offset = (point.id || 0)*17;
    // Every local query visits the same three columns/rows. Compute their
    // distances once instead of repeating rectangle-distance math per cell.
    const left = px-x*40, right = (x+1)*40-px;
    const top = py-y*40, bottom = (y+1)*40-py;
    const left2 = left*left, right2 = right*right, top2 = top*top, bottom2 = bottom*bottom;
    // The center, then its eight neighbors in the same order as near(). Local
    // avoidance/contact never needs a general expanding-ring search.
    for (let cell = 0; cell < 9 && result.length < limit; cell++) {
      const xx = x + LOCAL_X[cell], yy = y + LOCAL_Y[cell];
      if (xx < minX || xx > maxX || yy < minY || yy > maxY) continue;
      const cellX2 = xx < x ? left2 : xx > x ? right2 : 0;
      const cellY2 = yy < y ? top2 : yy > y ? bottom2 : 0;
      if (cellX2+cellY2 > radiusSquared) continue;
      const bucket = this.cells[(yy-this.minY)*this.width+xx-this.minX];
      if (!bucket) continue;
      const offsets = bucket.sampleOffsets, length = bucket.length, start = offset%length;
      for (let i=0; i<offsets.length; i++) {
        const index = start+offsets[i], u = bucket[index>=length ? index-length : index];
        const dx = px-u.x, dy = py-u.y;
        if (u!==point && u.hp>0 && dx*dx+dy*dy<=radiusSquared) {
          result.push(u);
          if (result.length >= limit) return result;
        }
      }
    }
    return result;
  }
}

export class Battle {
  constructor({ seed = 1066, size = 160, preset = 'field', difficulty = 'balanced', armies = null, historicalArmies = null, armyConfigs = null, commanders = null, allowEmpty = false, expandedMap = false, mapId = 'classic', tacticalAI = true, timeLimit = expandedMap ? Infinity : 180 } = {}) {
    this.seed = seed; this.rng = random(seed); this.preset = preset;
    this.bounds = createBattleBounds(expandedMap);
    this.targetRadius = Math.hypot(this.bounds.right - this.bounds.left, this.bounds.bottom - this.bounds.top);
    this.units = []; this.projectiles = []; this.effects = []; this.time = 0; this.winner = null;
    this.timeLimit = Number.isFinite(timeLimit) && timeLimit > 0 ? timeLimit : Infinity;
    this.outcomeReason = null;
    this.events = []; this.stats = { arrows: 0, shots: 0, stomps: 0, charges: 0, chargeHits: 0, pikeCounters: 0 };
    this.initial = [0, 0]; this.selected = new Set(); this.activeTeam = 0;
    this.commanders = [null, null];
    this.armyCommanders = new Map(); this.armyConfigs = [];
    const count = clamp(Math.round(Number(size) || 160), 40, 280);
    this.historical = !!(historicalArmies || armyConfigs);
    this.commanderMovement = this.historical ? new CommanderMovement() : null;
    this.tactics = this.historical && tacticalAI ? new HistoricalTactics() : null;
    if (armyConfigs) {
      this.armyConfigs = validateArmyConfigs(armyConfigs);
      if (!allowEmpty && [0, 1].some(team => !this.armyConfigs.some(a => a.team === team && Object.values(a.roster).some(Boolean))))
        throw new Error('İki ittifaka da asker ekle.');
      for (const team of [0, 1]) {
        const allies = this.armyConfigs.filter(army => army.team === team);
        // Separate allied formations, keeping the familiar initial camera framing.
        const height = 650 / Math.max(1, allies.length);
        allies.forEach((army, index) => {
          const y = 155 + index * height;
          this.spawnHistorical(team, army.roster, army.id, y, Math.max(30, height - (allies.length > 1 ? 28 : 0)));
          if (army.commanderId) this.spawnCommander(team, army.commanderId, army.id, y + height / 2);
        });
      }
    } else if (historicalArmies) {
      this.armyConfigs = legacyArmyConfigs(historicalArmies, resolveCommanderIds(commanders));
      validateHistoricalArmies(historicalArmies, { allowEmpty }).forEach((army, team) => this.spawnHistorical(team, army));
      resolveCommanderIds(commanders).forEach((id, team) => { if (id) this.spawnCommander(team, id); });
    } else if (armies) {
      if (armies.length !== 2 || armies.some(army => Object.keys(TYPES).some(type => !Number.isSafeInteger(army[type]) || army[type] < 0))) throw new Error('Birlik sayıları sıfır veya pozitif tam sayı olmalı.');
      if (armies.some(army => !Number.isSafeInteger(Object.values(army).reduce((a, n) => a + n, 0)) || (!allowEmpty && Object.values(army).reduce((a, n) => a + n, 0) === 0))) throw new Error('Her orduya en az bir asker ekle.');
      armies.forEach((army, team) => this.spawn(team, 0, army));
    } else {
      this.spawn(0, count);
      this.spawn(1, Math.round(count * (difficulty === 'hard' ? 1.25 : difficulty === 'easy' ? .8 : 1)));
    }
    if (armyConfigs) deployHistoricalArmies(this, { expandedMap, mapId });
    else if (!this.historical && expandedMap && this.units.length >= 2500) deployClassicCrowd(this);
    this.setMap(mapId);
    this.log('Ordular mevzilerinde. Komutunu bekliyor.');
  }
  setMap(id) {
    if (this.mapId === id) return;
    this.mapId = id; this.navigation = id === 'fortress' ? new BattleNavigation(this.bounds) : null;
    this.mapRevision = (this.mapRevision || 0) + 1;
    for (const u of this.units) {
      u.navPath = null; u.navGoal = null;
      if (!this.navigation || u.hp <= 0) continue;
      Object.assign(u, this.navigation.nearest(u, radiusOf(u)));
      if (u.order && u.order.kind !== 'attack') Object.assign(u.order, this.navigation.nearest(u.order, radiusOf(u)));
      u.charge = null;
    }
  }
  moveUnit(u, x, y) {
    if (x === u.x && y === u.y) return;
    if (this.navigation) { const p = this.navigation.move(u, { x, y }, radiusOf(u)); u.x = p.x; u.y = p.y; }
    else { u.x = x; u.y = y; }
  }
  clearShot(u, target, projectile = ranged(u)) { return !this.navigation || this.navigation.clear(u, target, 0, projectile); }
  spawnCommander(team, commanderId, armyId = `army-${team}`, y = 480) {
    const type = commanderType(commanderId), cfg = COMMANDER_TYPES[type];
    const unit = combatUnit({ id: this.units.length, team, armyId, type, commanderId, name: cfg.name,
      x: team ? 510 : 90, y, hp: cfg.hp, maxHp: cfg.hp, face: team ? -1 : 1,
      cooldown: this.rng() * cfg.cooldown, target: null, retarget: this.rng() * .5,
      chargeCooldown: .5 + this.rng(), charge: null, order: null, flash: 0, attack: 0,
      moving: false, phase: this.rng() * Math.PI * 2, deadAt: null, vx: 0, vy: 0 });
    this.units.push(unit); this.commanders[team] ||= unit; this.armyCommanders.set(armyId, unit); this.initial[team]++;
  }
  spawnHistorical(team, army, armyId = `army-${team}`, startY = 155, height = 650) {
    // Each species receives its own sector; species never spawn on top of each other.
    const entries = Object.entries(army);
    const total = Object.values(army).reduce((a, b) => a + b, 0);
    let offset = 0;
    for (const [type, number] of entries) {
      const cfg = UNIT_TYPES[type], sector = height * number / total;
      const columns = Math.max(1, Math.ceil(Math.sqrt(number * 90 / Math.max(25, sector))));
      const rows = Math.ceil(number / columns);
      const front = cfg.role === 'archer' || cfg.ranged ? 145 : cfg.role === 'elephant' ? 230 : cfg.role === 'pike' ? 220 : 195;
      for (let i = 0; i < number; i++) {
        const x = front - i % columns * Math.min(cfg.role === 'elephant' ? 35 : cfg.radius >= 9 ? 22 : 12, 95 / Math.max(1, columns - 1));
        const y = startY + offset + (Math.floor(i / columns) + .5) / rows * sector;
        this.units.push(combatUnit({ id: this.units.length, team, armyId, type, x: team ? WORLD.width - x : x, y,
          hp: cfg.hp, maxHp: cfg.hp, face: team ? -1 : 1, cooldown: this.rng() * cfg.cooldown,
          target: null, retarget: this.rng() * .5, chargeCooldown: .5 + this.rng(), charge: null,
          order: null, flash: 0, attack: 0, moving: false, phase: this.rng() * Math.PI * 2, deadAt: null, vx: 0, vy: 0 }));
        this.initial[team]++;
      }
      offset += sector;
    }
  }
  spawn(team, count, army = null) {
    const composition = this.preset === 'wall' && team === 1 ? [.22, .52, .2, .06] : [.4, .3, .2, .1];
    let made = 0;
    Object.keys(TYPES).forEach((type, index) => {
      const number = army ? army[type] : index === 3 ? count - made : Math.floor(count * composition[index]); made += number;
      for (let i = 0; i < number; i++) {
        const columns = army ? Math.max(type === 'cavalry' ? 3 : 4, Math.ceil(number / (type === 'cavalry' ? 18 : 42))) : type === 'cavalry' ? 3 : 4;
        const row = Math.floor(i / columns), rows = Math.ceil(number / columns);
        const front = type === 'archer' ? 105 : type === 'cavalry' ? 145 : type === 'pike' ? 210 : 168;
        let x = front - (i % columns) * 10;
        let y = type === 'cavalry' ? (i < number / 2 ? 170 + row * 17 : 765 + (row - Math.floor(rows / 2)) * 17) : 245 + row / Math.max(1, rows - 1) * 465;
        if (team === 1) x = WORLD.width - x;
        if (this.preset === 'flank' && team === 0 && type === 'cavalry') { x = 270 + i % 4 * 15; y = 130 + Math.floor(i / 4) * 18; }
        if (army) {
          // Keep custom formations inside the battlefield even for cavalry-only armies.
          const gap = Math.min(10, 80 / Math.max(1, columns - 1));
          x = front - (i % columns) * gap;
          if (team === 1) x = WORLD.width - x;
          if (type === 'cavalry') {
            const half = Math.ceil(rows / 2), bottom = row >= half;
            y = (bottom ? 755 : 150) + (bottom ? row - half : row) / Math.max(1, half - 1) * 95;
            if (this.preset === 'flank' && team === 0) { x = 260 + i % columns * gap; y = 130 + row / Math.max(1, rows - 1) * 100; }
          }
        }
        const config = TYPES[type];
        const id = this.units.length;
        this.units.push(combatUnit({ id, team, type, x, y, hp: config.hp, maxHp: config.hp, face: team ? -1 : 1,
          cooldown: this.rng() * config.cooldown, target: null, retarget: this.rng() * .5,
          chargeCooldown: .5 + this.rng(), charge: null, order: null, flash: 0, attack: 0, moving: false,
          phase: this.rng() * Math.PI * 2, deadAt: null, vx: 0, vy: 0 }));
        this.initial[team]++;
      }
    });
  }
  log(message) { this.events.unshift({ time: this.time, message }); this.events.length = Math.min(8, this.events.length); }
  counts() { return [0, 1].map(team => this.units.filter(u => u.team === team && u.hp > 0).length); }
  setActiveTeam(team) {
    if (team !== 0 && team !== 1) throw new Error('Geçersiz ordu.');
    this.activeTeam = team; this.selected.clear();
  }
  removeSelected() {
    const removed = this.units.filter(u => u.team === this.activeTeam && u.hp > 0 && this.selected.has(u.id));
    for (const u of removed) {
      u.removed = true; u.hp = 0; u.deadAt = this.time; u.order = null; this.resetMotion(u);
      this.initial[u.team]--;
      if (u.commanderId) {
        this.armyCommanders.delete(u.armyId);
        if (this.commanders[u.team] === u) this.commanders[u.team] = [...this.armyCommanders.values()].find(c => c.team === u.team && c.hp > 0) || null;
      }
    }
    this.selected.clear();
    this.projectiles = this.projectiles.filter(p => p.kind === 'arrow' || p.ballistic || !p.target.removed);
    if (removed.length) {
      this.log(`${removed.length} asker meydandan kaldırıldı.`);
      if (this.time > 0 && this.winner === null) this.checkOutcome();
    }
    return removed;
  }
  select(type = 'all') { this.selected = new Set(this.units.filter(u => u.team === this.activeTeam && u.hp > 0 && (type === 'all' || u.type === type || roleOf(u) === type)).map(u => u.id)); }
  selectArea(a, b) {
    this.selected = new Set(this.units.filter(u => u.team === this.activeTeam && u.hp > 0 && u.x >= Math.min(a.x, b.x) && u.x <= Math.max(a.x, b.x) && u.y >= Math.min(a.y, b.y) && u.y <= Math.max(a.y, b.y)).map(u => u.id));
  }
  formationPlan(x, y, options = {}) {
    const units = this.units.filter(u => u.team === this.activeTeam && this.selected.has(u.id) && u.hp > 0);
    const plan = formationLayout(units, x, y, { direction: this.activeTeam ? 180 : 0, ...options }, this.bounds, radiusOf);
    if (plan.valid && this.navigation && plan.slots.some(s => !this.navigation.free(s, s.radius))) {
      plan.valid = false; plan.message = 'Formasyon nehir, bina veya surla çakışıyor. Boş alan ya da köprü seç.';
    }
    return plan;
  }
  deploySelected(x, y, options = {}) {
    if (this.time > 0 || this.winner !== null) return { valid: false, message: 'Muharebe başladı. Yer değiştirmek için intikal emri ver.' };
    const plan = this.formationPlan(x, y, options);
    if (!plan.valid) return plan;
    const byId = new Map(this.units.map(u => [u.id, u]));
    for (const slot of plan.slots) {
      const u = byId.get(slot.id); this.resetMotion(u);
      Object.assign(u, { x: slot.x, y: slot.y, lastX: slot.x, lastY: slot.y, headingX: plan.dx, headingY: plan.dy, face: plan.dx < 0 ? -1 : plan.dx > 0 ? 1 : u.face, order: null, stuck: 0, tacticalOverride: true });
    }
    this.log(`${plan.slots.length} asker ${FORMATIONS[plan.kind].toLocaleLowerCase('tr')} şeklinde yerleştirildi.`);
    return plan;
  }
  moveSelected(x, y, options) {
    if (options) {
      if (this.winner !== null) return { valid: false, message: 'Muharebe tamamlandı.' };
      const plan = this.formationPlan(x, y, options);
      if (!plan.valid) return plan;
      const byId = new Map(this.units.map(u => [u.id, u]));
      for (const slot of plan.slots) {
        const u = byId.get(slot.id); this.resetMotion(u);
        u.order = { kind: 'move', x: slot.x, y: slot.y, directionX: plan.dx, directionY: plan.dy };
      }
      this.effects.push({ x: plan.x, y: plan.y, kind: 'order', ttl: 1.8, life: 1.8 });
      this.log(`${plan.slots.length} askere formasyon intikali emri verildi.`);
      return plan;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const units = this.units.filter(u => u.team === this.activeTeam && this.selected.has(u.id) && u.hp > 0);
    const cols = Math.ceil(Math.sqrt(units.length));
    units.forEach((u, i) => { u.order = { kind: 'move', x: clamp(x + (i % cols - (cols - 1) / 2) * 11, this.bounds.left + 45, this.bounds.right - 45), y: clamp(y + (Math.floor(i / cols) - (Math.ceil(units.length / cols) - 1) / 2) * 13, this.bounds.top + 115, this.bounds.bottom - 95) }; this.resetMotion(u); });
    if (this.navigation) for (const u of units) Object.assign(u.order, this.navigation.nearest(u.order, radiusOf(u)));
    if (units.length) { this.effects.push({ x, y, kind: 'order', ttl: 1.8, life: 1.8 }); this.log(`${units.length} askere intikal emri verildi.`); }
  }
  engageSelected() {
    for (const u of this.units) if (u.team === this.activeTeam && u.hp > 0 && this.selected.has(u.id)) { u.order = null; u.retarget = 0; u.tacticalOverride = true; }
    this.log('Seçili birlikler serbest hücumda.');
  }
  resetMotion(u) {
    u.navPath = null; u.navGoal = null;
    u.pendingAttack = null; u.attack = 0; u.moving = false;
    u.charge = null; u.runDistance = 0; u.speed = 0; u.vx = 0; u.vy = 0;
    u.evading = false; u.target = null; u.retarget = 0;
    u.mountedSkirmish = null;
  }
  stopSelected() {
    for (const u of this.units) if (u.team === this.activeTeam && this.selected.has(u.id) && u.hp > 0) {
      this.resetMotion(u); u.order = { kind: 'hold', x: u.x, y: u.y };
    }
    this.log('Seçili birlikler durdu; mevzilerini savunuyor.');
  }
  restSelected() {
    for (const u of this.units) if (u.team === this.activeTeam && this.selected.has(u.id) && u.hp > 0) {
      this.resetMotion(u); u.order = { kind: 'hold', rest: true, x: u.x, y: u.y };
    }
    this.log('Seçili birlikler dinleniyor. Yeniden savaşmaları için Serbest hücum emri ver.');
  }
  attackSelected(targetId) {
    const target = this.units.find(u => u.id === targetId && u.hp > 0 && u.team !== this.activeTeam);
    if (!target) return false;
    let attackers = 0;
    for (const u of this.units) if (this.selected.has(u.id) && u.hp > 0 && u.team === this.activeTeam) {
      if (u.commanderId) continue;
      this.resetMotion(u); u.order = { kind: 'attack', targetId }; u.target = target;
      attackers++;
    }
    if (!attackers) { this.log('Komutan saldırıya katılmaz; cepheyi geriden takip eder.'); return false; }
    this.log('Seçili birlikler işaretlenen hedefe saldırıyor.'); return true;
  }
  hit(target, amount, source, origin = source, projectileKind = null) {
    if (!target || target.hp <= 0) return;
    const previousHp = target.hp;
    target.hp = Math.max(0, target.hp - amount * (1 - (configOf(target).armor || 0))); target.flash = .13;
    damageMorale(this, target, previousHp - target.hp);
    if (target.hp < previousHp && projectileKind) target.lastMissileDamage = this.time;
    if (target.hp < previousHp) target.hitDirection = origin ? Math.sign(target.x - origin.x) || -target.face : -target.face;
    if (target.hp < previousHp) this.onCombatEvent?.({ kind: 'hit', unit: source, target, origin, projectileKind });
    if (!target.hp) {
      target.deadAt = this.time; target.deathDirection = target.hitDirection;
      this.resetMotion(target); target.order = null; this.selected.delete(target.id);
      if (target.commanderId) this.log(`${target.team ? 'Kızıl' : 'Mavi'} ordu komutanı ${target.name} düştü.`);
    }
    // Taking damage must not turn a defending pike instantly towards a flank.
  }
  startCharge(unit, target) {
    if (unit.commanderId || unit.fatigue >= 80 || unit.morale < 35 || unit.rally) return;
    if (this.navigation && !this.navigation.clear(unit, target, radiusOf(unit))) return;
    const d = Math.max(1, distance(unit, target));
    unit.fatigue = Math.min(100, unit.fatigue + 8); unit.lastExertion = this.time;
    unit.charge = { dx: (target.x - unit.x) / d, dy: (target.y - unit.y) / d,
      ttl: Math.min(1.65, Math.max(.85, (d + 20) / 90)), momentum: 1,
      age: 0, speed: Math.max(configOf(unit).speed, unit.speed || 0), hit: new Set() };
    unit.headingX = unit.charge.dx; unit.headingY = unit.charge.dy;
    unit.chargeCooldown = 7; this.stats.charges++;
    if (this.stats.charges === 1) this.log(roleOf(unit) === 'elephant' ? 'Savaş filleri hücuma kalktı!' : 'Süvariler hücuma kalktı!');
  }
  updateUnits(dt) {
    for (const _ of this.updateUnitBatches(dt)) { /* synchronous callers */ }
  }
  *updateUnitBatches(dt) {
    this.formationRouteBudget = 1;
    const alive = this.units.filter(u => u.hp > 0);
    surveyCondition(this, alive);
    const velocityDecay = Math.exp(-9 * dt);
    this.grid = new SpatialGrid(alive);
    this.localGrid = this.units.length >= 2500 ? new LocalBattleGrid(alive) : this.grid;
    yield;
    this.enemyGrids = [new SpatialGrid(alive.filter(u => !u.team)), new SpatialGrid(alive.filter(u => u.team))];
    this.rangedGrids = this.units.length >= 2500
      ? [0,1].map(team => new SpatialGrid(alive.filter(u => u.team === team && ranged(u) && !u.commanderId))) : null;
    yield;
    this.claims = new Map();
    let largestRadius = 0;
    for (const u of alive) {
      largestRadius = Math.max(largestRadius, radiusOf(u));
      if (u.target?.hp > 0) this.claims.set(u.target.id, (this.claims.get(u.target.id) || 0) + 1);
    }
    this.stats.targetChecks ??= 0; this.stats.neighborChecks ??= 0;
    this.tactics?.update(this, alive);
    if ([...this.armyCommanders.values()].some(u => u.hp > 0)) this.commanderMovement?.survey(this, alive);
    let processed = 0;
    for (const u of alive) {
      if (++processed % 32 === 0) yield;
      this.updateUnit(u, dt, velocityDecay);
    }
    yield* this.separationBatches(alive, largestRadius);
    for (const u of alive) {
      u.x = clamp(u.x, this.bounds.left + 35, this.bounds.right - 35); u.y = clamp(u.y, this.bounds.top + 110, this.bounds.bottom - 85);
      const gun = configOf(u).projectile === 'bullet';
      u.weaponPhase = gun ? (u.fireRemaining > 0 ? 'fire' : u.cooldown > 0 ? 'reload' : 'ready') : null;
      u.reloadRemaining = gun ? Math.max(0, u.cooldown) : 0;
    }
  }
  updateUnit(u, dt, velocityDecay) {
    if (u.hp <= 0) return;
    const cfg = configOf(u), elephant = roleOf(u) === 'elephant';
    u.headingX ??= u.face; u.headingY ??= 0; u.speed ??= 0; u.runDistance ??= 0;
    u.evadeSpent ??= 0; u.stuck ??= 0;
    const progress = u.lastX === undefined ? 1 : Math.hypot(u.x - u.lastX, u.y - u.lastY);
    updateCondition(this, u, dt, u.lastX === undefined ? 0 : progress);
    u.stuck = u.moving && progress < 3.6 * dt ? u.stuck + dt : Math.max(0, u.stuck - dt * 2);
    u.lastX = u.x; u.lastY = u.y;
    u.flash = Math.max(0, u.flash - dt); u.attack = Math.max(0, u.attack - dt);
    if (u.stagger > 0) u.stagger = Math.max(0, u.stagger - dt);
    if (u.pendingAttack && u.attack <= .12) {
      const strike = u.pendingAttack; u.pendingAttack = null;
      this.resolveAttack(u, strike.target, strike.projectile);
    }
    u.fireRemaining = Math.max(0, (u.fireRemaining || 0) - dt);
    u.cooldown -= dt; u.chargeCooldown -= dt; u.retarget -= dt; u.moving = false;
    this.moveUnit(u, u.x + u.vx * dt, u.y + u.vy * dt); u.vx *= velocityDecay; u.vy *= velocityDecay;
    // A struck foot soldier recovers before resuming orders or starting a swing.
    if (u.stagger > 0) { u.speed = 0; u.runDistance = 0; return; }
    if (steerRally(this, u, dt)) return;
    if (u.order?.rest) { u.speed = 0; u.runDistance = 0; return; }
    if (u.commanderId) { this.commanderMovement.steer(this, u, dt); return; }
    // Resolve orders before autonomous targeting, evasion or charging.
    if (u.order && (!u.order.kind || u.order.kind === 'move')) {
      if (distance(u, u.order) > .75) {
        this.walk(u, u.order, cfg.speed * 1.2, dt);
        // Mounted missile troops can shoot on the player's route without
        // replacing its destination with an autonomous chase or retreat.
        if (roleOf(u) === 'cavalry' && ranged(u)) {
          if (u.retarget <= 0 || !u.target || u.target.hp <= 0) {
            this.chooseTarget(u); u.retarget = .65 + this.rng() * .3;
          }
          const target = u.target, d = target ? distance(u, target) : Infinity;
          if (d > 20 && d <= cfg.reach && u.cooldown <= 0 && this.clearShot(u, target)) this.attack(u, target, d, dt);
        }
        return;
      }
      if (u.order.directionX !== undefined) { u.headingX = u.order.directionX; u.headingY = u.order.directionY; if (u.headingX) u.face = u.headingX < 0 ? -1 : 1; }
      u.order = { kind: 'hold', x: u.order.x, y: u.order.y }; u.runDistance = 0; u.speed = 0;
    }
    if (u.order?.kind === 'attack' && (!u.target || u.target.id !== u.order.targetId || u.target.hp <= 0)) {
      u.order = { kind: 'hold', x: u.x, y: u.y }; u.target = null; u.retarget = 0;
    }
    if (u.order?.kind !== 'attack' && (u.retarget <= 0 || !u.target || u.target.hp <= 0)) {
      // Congested rear ranks still reconsider targets, but obey their timer.
      // Bypassing it while stuck repeats a full search for every blocked
      // soldier on every tick and keeps changing the lane they try to reach.
      this.chooseTarget(u); u.retarget = (u.stuck > 1.2 ? .25 : .65) + this.rng() * .3;
    }
    const target = u.target;
    if (!target || target.hp <= 0) { u.speed = 0; u.runDistance = 0; return; }
    let d = distance(u, target);
    const hold = u.order?.kind === 'hold' || (this.preset === 'wall' && u.team === 1 && !mounted(u) && !u.order);
    if (hold) { u.charge = null; u.runDistance = 0; u.speed = 0; }
    if (!hold && steerScreening(this, u, dt)) return;
    // Exhausted mounted archers use local recovery/evasion until rested.
    // Keep their commander membership/intents so the plan resumes afterward;
    // direct player movement has already been handled above.
    const recoveringHorse = roleOf(u) === 'cavalry' && ranged(u) && u.resting;
    if (!hold && !recoveringHorse && this.tactics?.steer(this, u, target, dt)) return;
    if (!hold && mounted(u) && !elephant && !ranged(u) && !u.charge && u.chargeCooldown <= 0 &&
        u.runDistance >= 28 && u.speed >= cfg.speed * .8 && d > 38 && d < 135 && this.facing(u, target) > .85) this.startCharge(u, target);
    if (u.charge) {
      const c = u.charge;
      c.age += dt;
      const topSpeed = elephant ? 38 : Math.min(115, Math.max(70, cfg.speed * 2.7));
      c.momentum ??= 1;
      const chargeSpeed = c.speed = Math.min(topSpeed * conditionSpeed(u) * Math.sqrt(c.momentum), c.speed + (elephant ? 22 : 210) * dt);
      u.speed = chargeSpeed;
      anticipateRangedLane(this, u, c.dx, c.dy, topSpeed * conditionSpeed(u));
      const fromX = u.x, fromY = u.y;
      const chargeX = u.x + c.dx * chargeSpeed * dt, chargeY = u.y + c.dy * chargeSpeed * dt;
      this.moveUnit(u, chargeX, chargeY);
      if (Math.hypot(u.x - chargeX, u.y - chargeY) > .01) c.ttl = 0;
      u.face = c.dx >= 0 ? 1 : -1; u.moving = true; c.ttl -= dt;
      for (const contact of chargeContacts(u, c, fromX, fromY, this.grid, Math.min(36, cfg.reach))) {
        const enemy = contact.unit;
        if (enemy.hp <= 0 || !this.clearShot(u, enemy, false)) continue;
        c.hit.add(enemy.id); this.stats.chargeHits++;
        const counter = roleOf(enemy) === 'pike' && this.facing(enemy, u) > .55 &&
          !(enemy.stagger > 0) && (enemy.speed || 0) < configOf(enemy).speed * .45;
        const impact = Math.min(1, (chargeSpeed / topSpeed) ** 2) * c.momentum;
        this.hit(enemy, counter ? 14 * impact : (cfg.chargeDamage || 46) * impact, u);
        if (counter) { this.hit(u, 38, enemy); this.stats.pikeCounters++; c.ttl = 0; }
        else {
          const impulse = 105 * Math.sqrt(impact) * (mounted(enemy) ? .35 : 1);
          enemy.vx += c.dx * impulse; enemy.vy += c.dy * impulse;
          if (enemy.hp > 0 && !mounted(enemy)) {
            enemy.stagger = .12 + .16 * Math.sqrt(impact); enemy.staggerX = c.dx;
            enemy.pendingAttack = null; enemy.attack = 0;
          }
          // Impact transfers momentum. A second intact rank arrests a horse;
          // elephants retain more momentum but still cannot ignore bodies.
          c.momentum = Math.max(0, c.momentum - (elephant ? .18 : mounted(enemy) ? .72 : .4));
          c.speed *= Math.sqrt(c.momentum);
          u.speed = c.speed;
          if (c.momentum < .3) c.ttl = 0;
        }
        if (this.effects.length < 96) this.effects.push({ x: enemy.x, y: enemy.y,
          kind: !counter ? 'charge-impact' : 'impact',
          angle: Math.atan2(c.dy, c.dx), strength: impact, ttl: .35, life: .35 });
        if (c.ttl <= 0 || u.hp <= 0) break;
      }
      if (c.ttl <= 0) { u.charge = null; u.runDistance = 0; u.speed = 0; }
      return;
    }
    if (ranged(u)) {
      let maneuvering = false;
      // Foot archers plant their feet through release/recovery; mounted archers keep firing on the move.
      if (!mounted(u) && u.attack > 0) { u.speed = 0; u.runDistance = 0; return; }
      if (!hold && u.order?.kind !== 'attack') {
        const threat = u.nearbyThreat;
        maneuvering = this.skirmish(u, threat?.hp > 0 && !threat.removed && distance(u, threat) < (mounted(u) ? 118 : 78) ? threat : target, dt);
      }
      d = distance(u, target);
      if (d > cfg.reach || !this.clearShot(u, target)) {
        if (!hold && !u.moving && !maneuvering) this.walk(u, target, cfg.speed, dt);
      } else {
        // The rider aims independently of the horse's movement heading.
        if (!mounted(u) || (!u.moving && !maneuvering)) this.turn(u, target, dt);
        if (u.cooldown <= 0) this.attack(u, target, d, dt);
      }
    } else if (u.attack > 0) {
      // Plant the feet through the swing and recovery instead of sliding.
      u.runDistance = 0; u.speed = 0;
    } else if (d > cfg.reach || !this.clearShot(u, target, false)) {
      if (!hold) {
        // Stable approach points distribute attackers around occupied lanes.
        const dx = (u.x - target.x) / d, dy = (u.y - target.y) / d;
        let side = ((u.id % 5) - 2) * cfg.reach * .22;
        // Free cavalry approaches a braced spear from a flank. Explicit attack orders remain direct.
        if (mounted(u) && !elephant && !u.order && roleOf(target) === 'pike' && d > 45 && this.facing(target, u) > .55) {
          side = (u.id % 2 ? 1 : -1) * Math.min(65, d * .7);
        }
        this.walk(u, { x: target.x + dx * cfg.reach * .55 - dy * side,
          y: target.y + dy * cfg.reach * .55 + dx * side }, cfg.speed, dt);
      }
    } else {
      u.runDistance = 0; u.speed = 0; this.turn(u, target, dt);
      if (u.cooldown <= 0 && this.facing(u, target) > .35) this.attack(u, target, d, dt);
    }
    if (!u.moving) { u.speed = 0; u.runDistance = 0; }
  }
  *separationBatches(alive, largestRadius) {
    // Yield between groups without changing the order of contact resolution.
    this.grid = new SpatialGrid(alive.filter(u => u.hp > 0));
    this.localGrid = this.units.length >= 2500 ? new LocalBattleGrid(alive.filter(u => u.hp > 0)) : this.grid;
    const compressed = new Set();
    for (let pass = 0; pass < 2; pass++) {
      if (pass) {
        if (!compressed.size) break;
        this.grid = new SpatialGrid(alive.filter(u => u.hp > 0));
        this.localGrid = this.units.length >= 2500 ? new LocalBattleGrid(alive.filter(u => u.hp > 0)) : this.grid;
      }
      // Only deeply compressed bodies get a second local correction. Do not
      // double every soldier's neighbor queries along an otherwise stable front.
      const contacts = pass ? [...compressed] : alive;
      for (let index = 0; index < contacts.length; index++) {
        if (index % 32 === 0) yield;
        this.separateUnit(contacts[index], largestRadius, compressed, pass);
      }
    }
  }
  separateUnit(u, largestRadius, compressed, pass) {
    if (u.hp <= 0) return;
    const unitRadius = radiusOf(u);
    // Infantry-only battles do not need elephant-sized separation queries.
    for (const v of (this.localGrid || this.grid).near(u, unitRadius + largestRadius + 2, 64)) {
      if (v.id <= u.id && (!pass || compressed.has(v))) continue;
      this.stats.neighborChecks++;
      let dx = u.x - v.x, dy = u.y - v.y;
      const allied = u.team === v.team;
      // Keep approach spacing without obstructing soldiers threading into assigned formation slots.
      const charging = u.charge || v.charge;
      const gap = charging ? (unitRadius + radiusOf(v)) * .7
        : unitRadius + radiusOf(v) + (allied && u.order?.kind !== 'move' && v.order?.kind !== 'move' ? 1.5 : 0);
      // Most nearby soldiers do not overlap. Keep the original distance and
      // response at contact, including a rounding margin at the boundary.
      if (dx * dx + dy * dy > gap * gap + 1e-9) continue;
      let d = Math.hypot(dx, dy);
      if (d >= gap) continue;
      if (!pass && d < gap * .65) { compressed.add(u); compressed.add(v); }
      if (d < .001) { const angle = (u.id * 2.399 + v.id) % (Math.PI * 2); dx = Math.cos(angle); dy = Math.sin(angle); d = 1; }
      const push = (gap - d) * .45;
      // Rear ranks yield to soldiers already fighting. Overlapping stationary ranks can still separate.
      const plantedU = allied && (u.order?.kind === 'hold' || u.attack > 0);
      const plantedV = allied && (v.order?.kind === 'hold' || v.attack > 0);
      const fixedU = charging ? u.charge && !v.charge : plantedU && !plantedV && !(v.order?.yieldAlliesUntil > this.time);
      const fixedV = charging ? v.charge && !u.charge : plantedV && !plantedU && !(u.order?.yieldAlliesUntil > this.time);
      if (!fixedU) this.moveUnit(u, u.x + dx / d * push * (fixedV ? 2 : 1), u.y + dy / d * push * (fixedV ? 2 : 1));
      if (!fixedV) this.moveUnit(v, v.x - dx / d * push * (fixedU ? 2 : 1), v.y - dy / d * push * (fixedU ? 2 : 1));
    }
  }
  step(dt) {
    // Finish an in-flight step before an explicitly synchronous step. Never
    // interleave two simulation ticks or run a tick's attacks twice.
    if (this.pendingStep) {
      for (const _ of this.pendingStep) { /* drain */ }
      this.pendingStep = null;
    }
    for (const _ of this.stepBatches(dt)) { /* synchronous tests/export */ }
  }
  advanceFrame(dt, budgetMs = 6) {
    // A soft frame budget: finish the current small group, then let the browser
    // draw and handle input. Resume the same tick; never skip units or attacks.
    this.pendingStep ??= this.stepBatches(dt, true);
    this.simulationRevision = (this.simulationRevision || 0) + 1;
    const deadline = performance.now() + budgetMs;
    do {
      if (this.pendingStep.next().done) { this.pendingStep = null; return true; }
    } while (performance.now() < deadline);
    return false;
  }
  *stepBatches(dt, sliced = false) {
    if (this.winner !== null || !Number.isFinite(dt) || dt <= 0) return;
    if (this.time === 0 && this.counts().some(count => !count)) return;
    // Live accelerated crowds use up to 400 ms of simulation per update.
    // Movement/turning use dt; arrows and charges retain swept contacts.
    // Synchronous replay/export keeps its existing fixed-step contract.
    dt = Math.min(dt, sliced && this.units.length >= 2500 ? .4 : 1 / 20); this.time += dt;
    if (sliced) yield* this.updateUnitBatches(dt);
    else this.updateUnits(dt);
    let processed = 0;
    for (const p of this.projectiles) {
      if (++processed % 32 === 0) yield;
      if (p.kind === 'arrow' || p.ballistic) {
        const previousAge = p.age;
        advanceArrow(p, dt);
        const contact = firstArrowContact(p, previousAge, Math.min(p.age, p.lifetime), this.grid, dt);
        const endAge = contact?.age ?? Math.min(p.age, p.lifetime);
        const from = { x: p.fromX + p.vx * previousAge, y: p.fromY + p.vy * previousAge };
        const to = { x: p.fromX + p.vx * endAge, y: p.fromY + p.vy * endAge };
        if (this.navigation && !this.navigation.clear(from, to, 0, true)) p.done = true;
        else if (contact) {
          const previousHp = contact.unit.hp;
          this.hit(contact.unit, p.damage, undefined, { x: p.fromX, y: p.fromY }, p.style || p.kind);
          if (p.shooter && contact.unit.team !== p.team && contact.unit.hp < previousHp) p.shooter.lastRangedHit = this.time;
          this.stats.projectileHits = (this.stats.projectileHits || 0) + 1;
          if (contact.unit.team === p.team) this.stats.friendlyProjectileHits = (this.stats.friendlyProjectileHits || 0) + 1;
          p.done = true;
        }
        if (!p.done && p.age >= p.lifetime) {
          // Misses finish their fall; bounded ground remnants do not accumulate.
          if (p.kind === 'arrow' && this.effects.length < 96) this.effects.push({ kind: 'arrow-ground', x: p.x,
            y: p.groundY, groundY: p.groundY, height: 0, vx: p.vx, vy: p.vy,
            verticalSpeed: p.verticalSpeed, launchOffsetX: p.launchOffsetX, duration: p.duration,
            age: p.lifetime, lifetime: p.lifetime, style: p.style, ttl: 3, life: 3 });
          p.done = true;
        }
        continue;
      }
      const previousX = p.x, previousY = p.y;
      p.age += dt; const t = Math.min(1, p.age / p.duration);
      p.x = p.fromX + (p.target.x - p.fromX) * t; p.y = p.fromY + (p.target.y - 5 - p.fromY) * t - Math.sin(t * Math.PI) * (p.kind === 'bullet' ? 0 : 35);
      p.angle = Math.atan2(p.y - previousY, p.x - previousX);
      if (t >= 1 && (!this.navigation || this.navigation.clear({ x: p.fromX, y: p.fromY + 8 }, p.target, 0, true))) this.hit(p.target, p.damage, undefined, { x: p.fromX, y: p.fromY }, p.kind);
    }
    this.projectiles = this.projectiles.filter(p => p.kind === 'arrow' || p.ballistic ? !p.done : p.age < p.duration);
    for (const e of this.effects) e.ttl -= dt;
    this.effects = this.effects.filter(e => e.ttl > 0);
    this.checkOutcome();
    this.completedSimulationRevision = (this.completedSimulationRevision || 0) + 1;
    if (sliced) {
      const now = performance.now();
      if (this.completedStepAt !== undefined) this.completedStepInterval = now - this.completedStepAt;
      this.completedStepAt = now;
    }
  }
  checkOutcome() {
    const counts = this.counts();
    // Commanders remain visible/alive, but cannot keep a defeated army fighting.
    for (const unit of this.armyCommanders.values()) if (unit.hp > 0) counts[unit.team]--;
    const eliminated = !counts[0] || !counts[1], timedOut = this.time >= this.timeLimit;
    if (eliminated || timedOut) {
      this.outcomeReason = eliminated ? 'elimination' : 'time-limit';
      this.winner = counts[0] === counts[1] ? 'draw' : counts[0] > counts[1] ? 0 : 1;
      this.log(this.winner === 'draw' ? 'Muharebe berabere bitti.' : `${this.winner === 0 ? (this.historical ? 'Mavi' : 'Kuzey') : 'Kızıl'} ordusu kazandı.${this.outcomeReason === 'time-limit' ? ' Süre doldu; kalan asker sayısı belirleyici oldu.' : ''}`);
    }
  }
  facing(u, target) {
    const d = distance(u, target) || 1;
    return ((u.headingX ?? u.face) * (target.x - u.x) + (u.headingY || 0) * (target.y - u.y)) / d;
  }
  turn(u, target, dt) {
    const desired = Math.atan2(target.y - u.y, target.x - u.x);
    const current = Math.atan2(u.headingY || 0, u.headingX ?? u.face);
    const delta = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
    const rate = roleOf(u) === 'elephant' ? .8 : roleOf(u) === 'pike' ? 1.8 : mounted(u) ? 2.8 : 4;
    const angle = current + clamp(delta, -rate * dt, rate * dt);
    u.headingX = Math.cos(angle); u.headingY = Math.sin(angle);
    if (Math.abs(u.headingX) > .15) u.face = u.headingX > 0 ? 1 : -1;
  }
  chooseTarget(u) {
    const cfg = configOf(u), hold = u.order?.kind === 'hold';
    trackPursuit(u, this.time);
    const discouraged = u.pursuit?.discouragedUntil > this.time ? u.pursuit.discouragedId : null;
    // Leaders evade and do not fight. Autonomous troops may strike a leader
    // within reach, but must not abandon the battle to chase one across the map.
    // Explicit player attack orders bypass this autonomous selection.
    // Held troops cannot walk around cover, so only retain targets they can hit.
    const eligible = enemy => (!enemy.commanderId || distance(u, enemy) <= cfg.reach) &&
      (!hold || this.clearShot(u, enemy));
    let candidates = [];
    // Local cells are visited first. Large armies need a bounded choice of
    // nearby opponents, not 96 scored alternatives for every rear-rank soldier.
    // Physical arrow/charge contacts use their separate exhaustive queries.
    const candidateLimit = this.units.length >= 2500 && !hold ? 24 : 96;
    for (const radius of hold ? [cfg.reach] : discouraged !== null ? [140, 300, this.targetRadius] : [60, 140, 300, this.targetRadius]) {
      candidates = this.enemyGrids[1 - u.team].near(u, radius, candidateLimit).filter(eligible);
      if (candidates.length) break;
    }
    const isRanged = ranged(u);
    const horse = mounted(u) && !isRanged && roleOf(u) !== 'elephant';
    u.nearbyThreat = null;
    let threatScore = Infinity;
    const score = (enemy, d = distance(u, enemy)) => {
      const facing = () => ((u.headingX ?? u.face) * (enemy.x - u.x) + (u.headingY || 0) * (enemy.y - u.y)) / (d || 1);
      // A reachable opponent at weapon distance takes priority over a less crowded lane.
      const contact = !isRanged && d <= cfg.reach && facing() > .1 && this.clearShot(u, enemy, false);
      // Cavalry preferences influence the approach, not damage or explicit orders.
      const preference = d > cfg.reach + 8 && horse
        ? roleOf(enemy) === 'pike' && ((enemy.headingX ?? enemy.face) * (u.x - enemy.x) + (enemy.headingY || 0) * (u.y - enemy.y)) / (d || 1) > .55 ? 50 : ranged(enemy) ? -24 : 0
        : roleOf(u) === 'pike' && mounted(enemy) ? -16 : 0;
      return d + preference - (contact ? 80 : 0) + (isRanged ? 0 : Math.min(6, this.claims.get(enemy.id) || 0) * 9) +
        (u.stuck > 1.2 && enemy === u.target ? 45 : 0) +
        (enemy.id === discouraged && d > cfg.reach + 8 ? 110 : 0) + (this.tactics?.coordination?.penalty(u, enemy) || 0);
    };
    let best = null, bestScore = Infinity;
    for (const enemy of candidates) {
      this.stats.targetChecks++;
      const d = distance(u, enemy);
      // Reuse the existing bounded target sample; evasion needs no extra crowd scan.
      if (isRanged && !enemy.commanderId) {
        if ((!ranged(enemy) || d <= 20) && d < (mounted(u) ? 118 : 78) && d < threatScore) {
          u.nearbyThreat = enemy; threatScore = d;
        }
      }
      const value = score(enemy, d); if (value < bestScore) { best = enemy; bestScore = value; }
    }
    // Hysteresis retains a usable target unless an alternative is materially better.
    if (u.target?.hp > 0 && eligible(u.target) && (!hold || distance(u, u.target) <= cfg.reach) &&
        u.stuck <= 1.2 && score(u.target) <= bestScore + 22) return;
    if (u.target) this.claims.set(u.target.id, Math.max(0, (this.claims.get(u.target.id) || 0) - 1));
    u.target = best;
    if (best) this.claims.set(best.id, (this.claims.get(best.id) || 0) + 1);
    if (u.stuck > 1.2) u.stuck = .5;
  }
  skirmish(u, target, dt) {
    if (roleOf(u) === 'cavalry' && ranged(u)) return steerMountedSkirmish(this, u, target, dt);
    const cfg = configOf(u), horse = mounted(u), d = distance(u, target);
    const budget = horse ? 180 : 36, enter = horse ? 85 : 52, leave = horse ? 118 : 78;
    if (u.evadeSpent >= budget) { u.evading = false; return; }
    if (d < enter) u.evading = true;
    if (d > leave) u.evading = false;
    if (!u.evading && (!horse || d > cfg.reach * .9 || d < enter)) return;
    const dx = (u.x - target.x) / (d || 1), dy = (u.y - target.y) / (d || 1);
    const side = u.id % 2 ? 1 : -1;
    // Finite travel budget prevents permanent kiting; boundaries consume it too.
    const vx = u.evading ? dx : -dy * side, vy = u.evading ? dy : dx * side;
    const speed = cfg.speed * conditionSpeed(u) * (u.evading ? (horse ? .8 : .65) : .45);
    const point = { x: clamp(u.x + vx * 30, this.bounds.left + 36, this.bounds.right - 36), y: clamp(u.y + vy * 30, this.bounds.top + 111, this.bounds.bottom - 86) };
    const step = Math.min(speed * dt, Math.max(0, budget - u.evadeSpent));
    const moveD = distance(u, point);
    if (moveD > .05) {
      this.moveUnit(u, u.x + (point.x - u.x) / moveD * Math.min(step, moveD), u.y + (point.y - u.y) / moveD * Math.min(step, moveD)); u.moving = true;
    }
    u.evadeSpent = Math.min(budget, u.evadeSpent + step); u.runDistance = 0;
  }
  attack(u, target, d, dt = 0) {
    if (u.commanderId || u.rally || u.order?.rest || (u.resting && d > 20)) return;
    const cfg = configOf(u);
    // Carry only this tick's cooldown overrun into the next swing. Otherwise
    // coarse accelerated updates round every weapon's cadence up by a full tick.
    // A unit that was idle cannot bank missed attacks for a later burst.
    const overrun = dt > .05 && u.cooldown > -dt ? Math.min(0, u.cooldown) : 0;
    u.cooldown = cfg.cooldown * conditionCadence(u) * (cfg.projectile === 'bullet' ? 1 : .9 + this.rng() * .2) + overrun; u.attack = .24;
    const projectile = ranged(u) && d > 20;
    // A melee swing costs effort even if it misses. Ranged effort is charged
    // on release, so repeatedly withholding fire behind allies is not shooting.
    if (!projectile) exertAttack(this, u, false);
    u.pendingAttack = { target, projectile };
  }
  resolveAttack(u, target, projectile) {
    if (u.commanderId || u.hp <= 0 || !target || target.hp <= 0 || target.removed) return;
    if (!this.clearShot(u, target, projectile)) return;
    const cfg = configOf(u), d = distance(u, target);
    // A committed blow cannot follow a fleeing target beyond weapon reach.
    if (d > (projectile ? cfg.reach : ranged(u) ? 20 : cfg.reach) + 3 || (!projectile && this.facing(u, target) < .1)) return;
    if (ranged(u) && !projectile) {
      this.onCombatEvent?.({ kind: 'attack', unit: u, target, projectile });
      this.hit(target, cfg.damage * .28, u); return;
    }
    if (ranged(u)) {
      const bullet = cfg.projectile === 'bullet';
      const shot = bullet
        ? createBullet(u, target, cfg.damage)
        : createArrow(u, target, cfg.damage, mounted(u) ? 23 : 13,
          mounted(target) ? 23 : 13, radiusOf(target) + 4, cfg.projectile === 'bolt' ? 'bolt' : 'arrow');
      shot.shooter = u;
      // Check the visible line now. Bodies can still move into a released
      // shot; this is fire discipline, not immunity to friendly projectiles.
      let first = firstArrowContact(shot, 0, shot.lifetime, this.grid, Infinity);
      if (first?.unit.team === u.team && !bullet && loftArrow(shot, target)) {
        first = firstArrowContact(shot, 0, shot.lifetime, this.grid, Infinity);
      }
      if (first?.unit.team === u.team) {
        this.stats.heldShots = (this.stats.heldShots || 0) + 1;
        requestClearShotLane(this, u, first.unit, target);
        u.cooldown = Math.min(u.cooldown, .35); return;
      }
      exertAttack(this, u, true);
      this.onCombatEvent?.({ kind: 'attack', unit: u, target, projectile });
      if (bullet) u.fireRemaining = .24;
      this.projectiles.push(shot);
      this.stats[bullet ? 'shots' : 'arrows']++;
      if (bullet && this.effects.length < 96) this.effects.push({ x: u.x + u.face * 12, y: u.y - 14, angle: Math.atan2(target.y - u.y, target.x - u.x), kind: 'smoke', ttl: .9, life: .9 });
    } else if (cfg.splash) {
      this.onCombatEvent?.({ kind: 'attack', unit: u, target, projectile });
      for (const enemy of this.enemyGrids[1 - u.team].near(u, cfg.reach + cfg.splash)) {
        if (distance(enemy, target) > cfg.splash || this.facing(u, enemy) < -.1 || !this.clearShot(u, enemy, false)) continue;
        this.hit(enemy, cfg.damage, u); enemy.vx += u.headingX * 55; enemy.vy += u.headingY * 55;
      }
      this.stats.stomps++;
      if (this.effects.length < 96) this.effects.push({ x: target.x, y: target.y, kind: 'impact', ttl: .45, life: .45 });
    } else {
      this.onCombatEvent?.({ kind: 'attack', unit: u, target, projectile });
      const counter = roleOf(u) === 'pike' && mounted(target) && this.facing(u, target) > .55;
      // Facing has a modest tactical cost; armor still applies normally in hit().
      const guard = this.facing(target, u);
      const flank = guard < -.5 ? 1.25 : guard < .35 ? 1.12 : 1;
      this.hit(target, cfg.damage * (counter ? 1.7 : 1) * flank, u);
    }
  }
  walk(u, target, speed, dt) {
    speed *= conditionSpeed(u);
    if (this.navigation) target = this.navigation.waypoint(u, target, radiusOf(u));
    const manual = u.order?.kind === 'move';
    if (manual && !this.navigation) {
      const order = u.order;
      if (this.time >= (order.routeAfter || 0) && this.formationRouteBudget > 0) {
        this.formationRouteBudget--;
        order.routeAfter = this.time + 1;
        const obstacles = (this.grid?.near(u, 100, 32) || [])
          .filter(v => v.team === u.team && v.order?.kind === 'hold')
          .map(v => ({ x: v.x, y: v.y, r: radiusOf(u) + radiusOf(v) + .2 }));
        order.path = formationRoute(u, { x: order.x, y: order.y }, obstacles, p =>
          p.x >= this.bounds.left + 35 && p.x <= this.bounds.right - 35 &&
          p.y >= this.bounds.top + 110 && p.y <= this.bounds.bottom - 85);
        // A soldier enclosed by newly arrived ranks needs a little room to pass.
        // Only this failed manual route enables normal, symmetric allied yielding.
        order.yieldAlliesUntil = order.path.length ? 0 : this.time + 1.1;
      }
      while (order.path?.length > 1 && distance(u, order.path[0]) < 1) order.path.shift();
      if (order.path?.length) target = order.path[0];
    }
    const laneDistance = distance(u, target);
    if (laneDistance > .1) anticipateRangedLane(this, u,
      (target.x - u.x) / laneDistance, (target.y - u.y) / laneDistance, speed);
    target = npcWaypoint(this, u, target, speed, dt, radiusOf);
    const detouring = !!u.npcRoute?.path.length;
    let dx = target.x - u.x, dy = target.y - u.y, d = Math.hypot(dx, dy);
    if (d < .1) return;
    dx /= d; dy /= d;
    let steer = 0, clearance = 1;
    // Local allied avoidance routes rear ranks around occupied approach lanes.
    const unitRadius = radiusOf(u);
    for (const v of (this.localGrid || this.grid)?.near(u, unitRadius + 18, 32) || []) {
      if (v === u || v.hp <= 0 || v.team !== u.team) continue;
      const vx = v.x - u.x, vy = v.y - u.y, along = vx * dx + vy * dy, across = vx * -dy + vy * dx;
      const gap = unitRadius + radiusOf(v);
      if (along <= 0 || along > gap + 10 || Math.abs(across) > gap + 2) continue;
      const yielding = requestRangedLane(this, u, v, dx, dy, across);
      steer += (Math.abs(across) < .5 ? (u.id % 2 ? 1 : -1) : -Math.sign(across)) * .6;
      if (u.order?.kind !== 'move' && Math.abs(across) < gap && (v.order?.kind === 'hold' || v.attack > 0 || along < gap + 2)) {
        clearance = Math.min(clearance, Math.max(yielding ? .55 : .15, (along - gap) / 10));
      }
    }
    steer = clamp(steer, -1.2, 1.2);
    if ((manual && u.order.path?.length) || detouring) steer = 0;
    if (detouring) clearance = 1;
    const desired = { x: u.x + dx - dy * steer, y: u.y + dy + dx * steer };
    this.turn(u, desired, dt);
    const alignment = this.facing(u, desired);
    const acceleration = roleOf(u) === 'elephant' ? 22 : mounted(u) ? 65 : 110;
    u.speed = Math.min(speed * clearance, (u.speed || 0) + acceleration * dt);
    const step = Math.min(d, u.speed * dt) * Math.max(0, alignment);
    const nx = clamp(u.x + u.headingX * step, this.bounds.left + 35, this.bounds.right - 35), ny = clamp(u.y + u.headingY * step, this.bounds.top + 110, this.bounds.bottom - 85);
    const beforeX = u.x, beforeY = u.y;
    this.moveUnit(u, nx, ny);
    const travelled = Math.hypot(u.x - beforeX, u.y - beforeY);
    u.runDistance = alignment > .9 && travelled > step * .7 ? (u.runDistance || 0) + travelled : 0;
    u.moving = travelled > .001;
  }
}
