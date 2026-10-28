import { Battle, TYPES } from './crown-battle.js';
import { BattleNavigation } from './crown-battle-navigation.js';

export const DEFENDERS = 0, ATTACKERS = 1;
export const CASTLE = { left: -650, right: 100, top: -400, bottom: 1360, thickness: 58 };
export const GATE = { x: 42, y: 420, w: 58, h: 120 };
export const WALLS = [
  { x: -650, y: -400, w: 750, h: 58 }, { x: -650, y: 1302, w: 750, h: 58 },
  { x: -650, y: -400, w: 58, h: 1760 },
  { x: 42, y: -400, w: 58, h: 820 }, { x: 42, y: 540, w: 58, h: 820 },
];
export const TOWERS = [-400, 20, 300, 540, 880, 1244].flatMap(y =>
  [-650, -16].map(x => ({ x, y, w: 116, h: 116 })));
export const BUILDINGS = [
  { x: -540, y: 280, w: 190, h: 380, kind: 'keep' },
  { x: -480, y: -220, w: 300, h: 125, kind: 'barracks' },
  { x: -480, y: 1050, w: 300, h: 125, kind: 'barracks' },
  { x: -490, y: 40, w: 180, h: 145, kind: 'smithy' },
  { x: -490, y: 850, w: 180, h: 125, kind: 'storehouse' },
  { x: -235, y: 100, w: 52, h: 52, kind: 'well' },
];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const cfg = u => u.combatProfile.config;

// Siege rules are isolated from the field battle's AI, settings and outcome.
export class SiegeBattle extends Battle {
  constructor({ seed = 1066, activeTeam = ATTACKERS } = {}) {
    super({ seed, expandedMap: true, armies: [
      { sword: 20, pike: 8, archer: 16, cavalry: 0 },
      { sword: 48, pike: 12, archer: 24, cavalry: 0 },
    ] });
    this.mode = 'siege'; this.activeTeam = activeTeam;
    this.gate = { hp: 3600, maxHp: 3600, x: 100, y: 480 };
    this.ram = { x: 600, y: 480, hp: 900, maxHp: 900, crew: 0, cooldown: 4.5, hits: 0, impact: 0 };
    this.ladders = [240, 780].map((y, id) => ({ id, x: 142, y, build: 0, required: 10, hp: 340, maxHp: 340, climber: null, crossed: 0, down: 0 }));
    this.plan = 'balanced'; this.shields = true;
    this.defense = { supplies: 100, oilCooldown: 0, repairCooldown: 0, volleyCooldown: 0, repair: 0, volley: 0, target: 'gate' };
    this.hazards = []; this.siegeStats = { climbs: 0, oil: 0, repaired: 0, laddersLost: 0 };
    this.capture = { x: -200, y: 480, radius: 85, progress: 0, required: 30, contested: false, attackers: 0, defenders: 0 };
    this.timeLimit = 300; this.phase = 'approach'; this.resultReason = '';
    this.navigation = new BattleNavigation(this.bounds); this.rebuildWalls();
    const indices = [0, 0, 0, 0];
    for (const u of this.units) {
      const archer = u.type === 'archer', i = indices[u.team * 2 + Number(archer)]++;
      u.wall = u.team === DEFENDERS && archer;
      if (u.team === ATTACKERS) { u.x = 490 + Math.floor(i / 12) * 32; u.y = (archer ? 150 : 260) + (i % 12) * (archer ? 60 : 40); }
      else if (archer) { u.x = 68; u.y = i < 8 ? 75 + i * 45 : 555 + (i - 8) * 45; }
      else { u.x = -65 - Math.floor(i / 7) * 30; u.y = 345 + (i % 7) * 45; }
      u.home = { x: u.x, y: u.y }; u.headingX = u.team === DEFENDERS ? 1 : -1; u.headingY = 0; u.face = u.headingX;
      if (archer) u.combatProfile = { ...u.combatProfile, config: { ...TYPES.archer, reach: u.wall ? 250 : 245 } };
    }
    this.assignDuties();
    for (const u of this.units.filter(u => u.team === ATTACKERS && u.duty === 'ladder')) {
      const i = Math.floor(u.dutySlot / 2);
      u.x = 430 + Math.floor(i / 3) * 26; u.y = this.ladders[u.ladderId].y + (i % 3 - 1) * 24;
      u.home = { x: u.x, y: u.y };
    }
    this.events = []; this.log('Soldaki mavi ordu kaleyi savunuyor. Kızıl ordu doğudan saldırıyor.');
  }
  assignDuties() {
    const troops = this.units.filter(u => u.team === ATTACKERS && u.type !== 'archer' && u.hp > 0 && !u.wall);
    const crew = this.plan === 'walls' ? 6 : 12, climbers = this.plan === 'gate' ? 4 : this.plan === 'walls' ? 14 : 8;
    troops.forEach((u, i) => { u.duty = i < crew ? 'ram' : i < crew + climbers * 2 ? 'ladder' : 'gate'; u.dutySlot = i < crew ? i : i - crew; u.ladderId = u.dutySlot % 2; });
  }
  setPlan(plan) {
    if (!['balanced', 'gate', 'walls'].includes(plan) || this.activeTeam !== ATTACKERS || this.winner !== null) return false;
    this.plan = plan; this.assignDuties();
    this.log({ balanced: 'Koçbaşı ve iki sur kolu birlikte ilerliyor.', gate: 'Ağırlık doğu kapısına verildi.', walls: 'Merdiven birlikleri iki kanada yönlendirildi.' }[plan]); return true;
  }
  tacticAvailable(kind) {
    const d = this.defense, costs = { oil: 35, repair: 40, volley: 25 };
    return this.winner === null && Object.hasOwn(costs, kind) && d.supplies >= costs[kind] && d[kind + 'Cooldown'] <= 0 &&
      (kind !== 'repair' || (this.gate.hp > 0 && this.gate.hp < this.gate.maxHp && !d.repair)) &&
      (kind !== 'volley' || this.units.some(u => u.team === DEFENDERS && u.wall && u.hp > 0));
  }
  useTactic(kind, target = this.defense.target, automatic = false) {
    if ((!automatic && this.activeTeam !== DEFENDERS) || !this.tacticAvailable(kind)) return false;
    if (!['gate', 'north', 'south'].includes(target)) return false;
    const d = this.defense;
    d.supplies -= { oil: 35, repair: 40, volley: 25 }[kind];
    d[kind + 'Cooldown'] = { oil: 24, repair: 30, volley: 26 }[kind];
    if (kind === 'oil') {
      const y = target === 'gate' ? 480 : target === 'north' ? 240 : 780;
      this.hazards.push({ x: 146, y, warning: 2, ttl: 7, radius: 66 }); this.siegeStats.oil++;
      this.log(`${target === 'gate' ? 'Kapı üstünden' : target === 'north' ? 'Kuzey surundan' : 'Güney surundan'} kızgın yağ dökülüyor!`);
    } else if (kind === 'repair') { d.repair = 12; this.log('Marangozlar kapıyı onarıyor. Koçbaşı darbesi onarımı keser.'); }
    else { d.volley = 8; this.log('Sur okçuları sekiz saniyelik yoğun atışa geçti.'); }
    return true;
  }
  updateEquipment(dt) {
    const d = this.defense, r = this.ram;
    d.supplies = Math.min(100, d.supplies + dt * .3);
    for (const key of ['oilCooldown', 'repairCooldown', 'volleyCooldown', 'volley']) d[key] = Math.max(0, d[key] - dt);
    if (d.repair > 0) {
      d.repair = Math.max(0, d.repair - dt);
      if (this.gate.hp > 0) { const amount = Math.min(45 * dt, this.gate.maxHp - this.gate.hp); this.gate.hp += amount; this.siegeStats.repaired += amount; }
      else d.repair = 0;
    }
    const troops = this.units.filter(u => u.hp > 0 && u.team === ATTACKERS && !u.wall && !u.order && u.x > 100);
    r.impact = Math.max(0, r.impact - dt);
    r.crew = troops.filter(u => u.duty === 'ram' && distance(u, r) < 82).length;
    if (r.hp > 0 && this.gate.hp > 0 && r.crew >= 4) {
      if (r.x > 158) r.x = Math.max(158, r.x - 10 * dt * Math.min(1, r.crew / 8));
      else {
        r.cooldown -= dt;
        if (r.cooldown <= 0) {
          this.damageGate(320); r.hits++; r.impact = .8; r.cooldown = 4.5; d.repair = 0;
          this.effects.push({ kind: 'impact', x: 100, y: 480, ttl: .6, life: .6 });
          if (r.hits === 1) this.log('Koçbaşı kapıya ulaştı. Her darbe 320 dayanıklılık götürür.');
        }
      }
    }
    for (const l of this.ladders) {
      if (l.hp <= 0) {
        l.down -= dt;
        if (l.down <= 0) { l.hp = l.maxHp; l.build = 0; this.log(`${l.id ? 'Güney' : 'Kuzey'} merdiven takımı yeni merdiveni hazırlıyor.`); }
        continue;
      }
      const workers = troops.filter(u => u.duty === 'ladder' && u.ladderId === l.id && distance(u, l) < 48);
      if (l.build < l.required && workers.length >= 2) {
        l.build = Math.min(l.required, l.build + dt * Math.min(1.4, workers.length / 3));
        if (l.build === l.required) this.log(`${l.id ? 'Güney' : 'Kuzey'} merdiveni sura dayandı!`);
      }
      if (l.climber && (l.climber.hp <= 0 || !l.climber.climb)) l.climber = null;
      if (l.build >= l.required && !l.climber) {
        const u = workers.find(u => distance(u, l) < 20);
        if (u) { this.resetMotion(u); u.wall = true; u.climb = { ladder: l.id, progress: 0 }; u.x = l.x; u.y = l.y; l.climber = u; this.selected.delete(u.id); }
      }
    }
    for (const h of this.hazards) {
      h.ttl -= dt; h.warning = Math.max(0, h.warning - dt);
      if (h.warning > 0 || h.ttl <= 0) continue;
      for (const u of this.units) if (u.hp > 0 && !u.wall && distance(u, h) < h.radius) this.hit(u, 13 * dt, undefined, h, 'oil');
      if (r.hp > 0 && distance(r, h) < h.radius + 30) {
        r.hp = Math.max(0, r.hp - 42 * dt);
        if (!r.hp) this.log('Koçbaşı yandı. Piyadeler kapı ve merdiven hücumuna devam ediyor.');
      }
      for (const l of this.ladders) if (l.hp > 0 && distance(l, h) < h.radius) {
        l.hp = Math.max(0, l.hp - 80 * dt);
        if (!l.hp) {
          l.down = 24; l.build = 0; this.siegeStats.laddersLost++;
          if (l.climber?.hp > 0) { const u = l.climber; u.wall = false; u.climb = null; u.x = 148; u.y = l.y; this.hit(u, 45, undefined, l, 'fall'); }
          l.climber = null; this.log(`${l.id ? 'Güney' : 'Kuzey'} merdiveni düştü! Yeni kurulum 24 saniye sonra başlayacak.`);
        }
      }
    }
    this.hazards = this.hazards.filter(h => h.ttl > 0);
    // Unselected defense has the same costs and cooldowns as the player.
    if (this.activeTeam !== DEFENDERS && this.time > 5 && this.units.some(u => u.hp > 0 && u.team === DEFENDERS)) {
      const pressure = ['gate', 'north', 'south'].map((target, i) => ({ target, count: troops.filter(u => distance(u, { x: 146, y: [480, 240, 780][i] }) < 85).length }));
      pressure.sort((a, b) => b.count - a.count);
      if (pressure[0].count >= 4) this.useTactic('oil', pressure[0].target, true);
      if (this.gate.hp < this.gate.maxHp * .7) this.useTactic('repair', 'gate', true);
      if (troops.some(u => u.x < 200) && d.supplies >= 50) this.useTactic('volley', 'gate', true);
    }
  }
  siegeDuty(u, dt) {
    if (u.climb) {
      const l = this.ladders[u.climb.ladder]; u.climb.progress = Math.min(1, u.climb.progress + dt / 5);
      u.x = 142 - 74 * u.climb.progress; u.y = l.y; u.headingX = -1; u.headingY = 0; u.face = -1; u.moving = true;
      if (u.climb.progress === 1) { u.climb = null; u.onWall = l.id; l.climber = null; l.crossed++; this.siegeStats.climbs++; }
      return true;
    }
    if (u.wall && u.team === ATTACKERS) {
      const enemy = this.units.filter(v => v.hp > 0 && v.wall && !v.climb && v.team === DEFENDERS && Math.abs(v.y - u.y) < 90).sort((a, b) => distance(a, u) - distance(b, u))[0];
      if (enemy) {
        this.turn(u, enemy, dt);
        if (distance(u, enemy) <= cfg(u).reach) { if (u.cooldown <= 0 && u.attack <= 0) this.attack(u, enemy, distance(u, enemy)); }
        else { u.y += Math.sign(enemy.y - u.y) * Math.min(Math.abs(enemy.y - u.y), cfg(u).speed * dt); u.moving = true; }
      } else {
        // A five-second ascent is the sole wall crossing; descent lands inside the same clear section.
        u.wall = false; u.x = 22; u.y = this.ladders[u.onWall].y; u.onWall = null; this.resetMotion(u);
        if (this.phase !== 'courtyard') { this.phase = 'courtyard'; this.log('Merdiven birlikleri avluya indi. Kapı sağlam olsa da sancak tehlikede!'); }
      }
      return true;
    }
    if (u.order || u.team !== ATTACKERS || u.type === 'archer' || u.x < 100 || this.gate.hp <= 0) return false;
    if (u.duty === 'ram' && this.ram.hp > 0) {
      const slot = { x: this.ram.x + (u.dutySlot % 4 - 1.5) * 18, y: this.ram.y + (u.dutySlot < 6 ? -39 : 39) + (u.dutySlot % 2) * 9 };
      this.moveTowards(u, slot, dt); return true;
    }
    if (u.duty === 'ladder') {
      const l = this.ladders[u.ladderId];
      if (l.hp <= 0) return false;
      const waiting = this.units.filter(v => v.hp > 0 && !v.wall && !v.order && v.x > 100 && v.duty === 'ladder' && v.ladderId === l.id);
      const i = waiting.indexOf(u);
      this.moveTowards(u, { x: l.x + Math.floor(i / 3) * 16, y: l.y + (i % 3 - 1) * 12 }, dt); return true;
    }
    return false;
  }
  rebuildWalls() {
    this.navigation.obstacles = [...WALLS, ...TOWERS, ...BUILDINGS, ...(this.gate.hp > 0 ? [GATE] : [])];
    // Arcing arrows cross walls; infantry still collides with them.
    this.navigation.sightObstacles = [];
    this.navigation.graphs.clear(); this.navigation.expanded.clear();
    for (const u of this.units) { u.navPath = null; u.navGoal = null; }
  }
  damageGate(amount) {
    if (this.gate.hp <= 0 || !Number.isFinite(amount) || amount <= 0) return;
    this.gate.hp = Math.max(0, this.gate.hp - amount);
    if (!this.gate.hp) {
      this.phase = 'courtyard'; this.rebuildWalls();
      this.effects.push({ kind: 'impact', x: this.gate.x, y: this.gate.y, ttl: .7, life: .7 });
      this.log('Kapı yıkıldı! Avludaki sancağı 30 saniye tut.');
    } else if (this.phase !== 'courtyard') this.phase = 'gate';
  }
  clearShot(u, target, projectile = u.type === 'archer') {
    if (!projectile && !!u.wall !== !!target.wall) return false;
    return projectile || (u.wall && target.wall && !u.climb && !target.climb) || this.navigation.clear(u, target, 0);
  }
  hit(target, amount, source, origin = source, projectileKind = null) {
    if (source && !projectileKind && !!source.wall !== !!target.wall) return;
    const arrow = projectileKind === 'arrow' || projectileKind === 'bolt';
    const cover = arrow && target.wall && !target.climb ? .5 : arrow && target.team === ATTACKERS && target.type !== 'archer' &&
      (this.shields || (this.ram.hp > 0 && distance(target, this.ram) < 65)) ? .65 : 1;
    super.hit(target, amount * cover, source, origin, projectileKind);
  }
  moveUnit(u, x, y) { if (!u.wall) super.moveUnit(u, x, y); }
  resetMotion(u) { super.resetMotion(u); u.pendingGateHit = false; }
  moveTowards(u, target, dt) {
    if (u.wall || distance(u, target) < 2) return;
    const next = this.navigation.waypoint(u, target, 3.75), d = distance(u, next);
    if (d < .01) return;
    this.turn(u, next, dt);
    const step = Math.min(d, cfg(u).speed * dt * (this.shields && u.team === ATTACKERS && u.type !== 'archer' ? .72 : 1)), old = { x: u.x, y: u.y };
    this.moveUnit(u, u.x + (next.x - u.x) / d * step, u.y + (next.y - u.y) / d * step);
    u.moving = distance(u, old) > .001; u.speed = u.moving ? cfg(u).speed : 0;
  }
  commandMove(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || this.winner !== null) return 0;
    const chosen = this.units.filter(u => this.selected.has(u.id) && u.team === this.activeTeam && u.hp > 0 && !u.wall);
    const cols = Math.max(1, Math.ceil(Math.sqrt(chosen.length)));
    chosen.forEach((u, i) => {
      this.resetMotion(u); u.pendingGateHit = false;
      u.order = { kind: 'move', ...this.navigation.nearest({ x: x + (i % cols - (cols - 1) / 2) * 11, y: y + Math.floor(i / cols) * 12 }, 3.75) };
    });
    if (chosen.length) this.log(`${chosen.length} askere intikal emri verildi.`);
    return chosen.length;
  }
  updateUnits(dt) {
    this.updateEquipment(dt);
    const alive = this.units.filter(u => u.hp > 0);
    const assault = alive.filter(u => u.team === ATTACKERS && u.type !== 'archer' && !u.order && !u.wall && u.x > 100 &&
      (u.duty === 'gate' || (u.duty === 'ram' && this.ram.hp <= 0) || (u.duty === 'ladder' && this.ladders[u.ladderId].hp <= 0))).sort((a, b) => a.id - b.id);
    const queue = new Map(assault.map((u, i) => [u.id, i]));
    for (const u of alive) {
      if (u.hp <= 0) continue;
      u.moving = false; u.speed = 0; u.flash = Math.max(0, u.flash - dt);
      u.attack = Math.max(0, u.attack - dt); u.cooldown -= dt * (u.team === DEFENDERS && u.wall && this.defense.volley > 0 ? 1.8 : 1);
      if (u.pendingGateHit && u.attack <= .12) {
        if (u.hp > 0 && this.gate.hp > 0 && u.x > 100 && u.x < 140 && u.y > 420 && u.y < 540) this.damageGate(cfg(u).damage * .35);
        u.pendingGateHit = false;
      }
      if (u.pendingAttack && u.attack <= .12) {
        const strike = u.pendingAttack; u.pendingAttack = null;
        this.resolveAttack(u, strike.target, strike.projectile);
      }
      if (u.attack > 0) continue;
      if (u.climb || (u.wall && u.team === ATTACKERS)) { this.siegeDuty(u, dt); continue; }
      if (u.order?.kind === 'move') {
        if (distance(u, u.order) > 4) { this.moveTowards(u, u.order, dt); continue; }
        u.order = null;
      }
      const ranged = u.type === 'archer', hold = u.order?.kind === 'hold';
      let target = null, nearest = Infinity;
      for (const enemy of alive) {
        if (enemy.team === u.team || enemy.hp <= 0 || (!ranged && !!enemy.wall !== !!u.wall)) continue;
        const d = distance(u, enemy);
        if (d < nearest && (ranged || this.clearShot(u, enemy, false))) { target = enemy; nearest = d; }
      }
      u.target = target;
      if (target && nearest <= cfg(u).reach && this.clearShot(u, target, ranged)) {
        this.turn(u, target, dt);
        if (u.cooldown <= 0 && this.facing(u, target) > .1) {
          this.attack(u, target, nearest);
          if (ranged && u.wall !== target.wall) u.pendingAttack.projectile = true;
        }
        continue;
      }
      if (hold || u.wall) continue;
      if (this.siegeDuty(u, dt)) continue;
      if (u.team === ATTACKERS && !ranged && this.gate.hp > 0 && u.x > 100) {
        const i = queue.get(u.id) ?? assault.length;
        const slot = { x: 120 + Math.floor(i / 6) * 17, y: 435 + (i % 6) * 18 };
        if (i < 6 && distance(u, slot) < 4) {
          this.turn(u, { x: 70, y: u.y }, dt);
          if (u.cooldown <= 0) { u.cooldown = cfg(u).cooldown; u.attack = .3; u.pendingGateHit = true; }
        } else this.moveTowards(u, slot, dt);
      } else if (u.team === ATTACKERS && ranged && this.gate.hp > 0) {
        this.moveTowards(u, { x: 280 + Math.floor((u.id % 24) / 12) * 20, y: 190 + (u.id % 12) * 52 }, dt);
      } else if (target && nearest < (u.team === DEFENDERS ? 250 : 160)) {
        this.moveTowards(u, target, dt);
      } else if (u.team === ATTACKERS) {
        this.moveTowards(u, { x: this.capture.x + ((u.id % 5) - 2) * 20, y: this.capture.y + (Math.floor(u.id / 5) % 3 - 1) * 20 }, dt);
      } else if (this.gate.hp <= 0 || this.phase === 'courtyard') {
        this.moveTowards(u, { x: this.capture.x + 45 + (u.id % 4) * 13, y: this.capture.y + (u.id % 3 - 1) * 20 }, dt);
      }
    }
    // Separation never pushes ground soldiers through a wall or onto a walkway.
    for (let i = 0; i < alive.length; i++) {
      const u = alive[i]; if (u.hp <= 0 || u.wall) continue;
      for (let j = i + 1; j < alive.length; j++) {
        const v = alive[j]; if (v.hp <= 0 || v.wall) continue;
        const d = distance(u, v); if (d >= 8.5) continue;
        const dx = d > .01 ? (u.x - v.x) / d : (u.id % 2 ? 1 : -1), dy = d > .01 ? (u.y - v.y) / d : 0;
        const push = (8.5 - d) * .4;
        const plantedU = u.attack > 0 || u.order?.kind === 'hold', plantedV = v.attack > 0 || v.order?.kind === 'hold';
        if (!plantedU || plantedV) this.moveUnit(u, u.x + dx * push, u.y + dy * push);
        if (!plantedV || plantedU) this.moveUnit(v, v.x - dx * push, v.y - dy * push);
      }
    }
    const c = this.capture;
    const inside = alive.filter(u => u.hp > 0 && !u.wall && distance(u, c) <= c.radius);
    c.attackers = inside.filter(u => u.team === ATTACKERS).length; c.defenders = inside.filter(u => u.team === DEFENDERS).length;
    c.contested = c.attackers > 0 && c.defenders > 0;
    if (c.attackers && !c.defenders) c.progress = Math.min(c.required, c.progress + dt);
  }
  checkOutcome() {
    if (this.winner !== null) return;
    if (!this.counts()[ATTACKERS]) { this.winner = DEFENDERS; this.resultReason = 'Saldıran ordu dağıldı.'; }
    else if (this.capture.progress >= this.capture.required) { this.winner = ATTACKERS; this.resultReason = 'Avlu sancağı ele geçirildi.'; }
    else if (this.time >= this.timeLimit) { this.winner = DEFENDERS; this.resultReason = 'Savunma süre sonuna kadar dayandı.'; }
    if (this.winner !== null) this.log(`${this.winner === DEFENDERS ? 'Savunmacılar' : 'Saldıranlar'} kazandı. ${this.resultReason}`);
  }
}
