import { UNIT_TYPES, WORLD, roleOf } from './crown-battle.js';
import { MovementSoundField } from './crown-battle-movement-sound.js';
import { fallDuration } from './crown-battle-combat-motion.js';
import { visualScaleOf } from './crown-battle-visual-scale.js';
import { strideClock } from './crown-battle-reference-motion.js';

// Event-driven contacts and a bounded movement sample; no all-pairs search.
export class BattleFeedback {
  constructor(battle, audio = null, listener = null) {
    this.battle = battle; this.audio = audio; this.listener = listener; this.effects = []; this.cells = new Map(); this.sequence = 0;
    this.movementSound = new MovementSoundField();
    this.hoofSteps = new WeakMap();
    battle.feedback = this; battle.onCombatEvent = event => this.onEvent(event);
  }
  onEvent({ kind, unit, target, projectile, origin = unit, projectileKind }) {
    const b = this.battle, cfg = UNIT_TYPES[unit?.type], role = unit && roleOf(unit);
    const armored = (UNIT_TYPES[target?.type]?.armor || 0) >= .14;
    const metal = armored && !projectileKind && cfg && role !== 'elephant';
    const piercing = projectileKind === 'arrow' || projectileKind === 'bolt' || role === 'pike';
    const contact = projectileKind && armored ? 'armor' : piercing || projectileKind === 'bullet' ? 'soft' : undefined;
    // Contact makes one sound; a melee swing must not mask its same-frame hit.
    const sound = kind === 'hit'
      ? role === 'elephant' ? 'stomp' : metal ? 'clash' : 'hit'
      : projectile ? (cfg.projectile === 'bullet' ? 'gun' : 'bow') : null;
    const at = kind === 'hit' ? target : unit;
    const view = this.listener?.();
    const nx = view ? (at.x - view.x) * view.zoom / (WORLD.width / 2) : (at.x - b.bounds.left) / (b.bounds.right - b.bounds.left) * 2 - 1;
    const ny = view ? (at.y - view.y) * view.zoom / (WORLD.height / 2) : 0;
    const distance = Math.hypot(nx, ny);
    if (sound && distance < 3) this.audio?.play(sound, nx * .7, {
      gain: 1 / (1 + distance * distance * .7),
      contact,
      projectileKind,
      weight: projectileKind === 'arrow' || projectileKind === 'bolt' ? .65 : projectileKind === 'bullet' ? .85
        : role === 'elephant' ? 1.5 : role === 'cavalry' ? 1.15 : (cfg?.damage >= 34 && cfg?.cooldown >= 1.3) ? 1.3 : 1,
    });
    // Most contacts throw no sparks. Small steel glints are occasional;
    // cloth, arrows and bullets get a short, directional impact puff.
    const variant = this.sequence++ % 7;
    const targetRole = target?.type && roleOf(target);
    const height = targetRole === 'elephant' ? 29 : targetRole === 'cavalry' ? 23 : 14;
    const effect = kind === 'hit'
      ? role === 'elephant' ? 'dust' : metal && variant % 3 === 0 ? 'sparks' : armored ? 'armor-hit' : 'body-hit'
      : projectile ? (cfg.projectile === 'bullet' ? 'muzzle' : 'release') : role === 'elephant' ? 'dust' : role === 'pike' ? 'thrust' : 'slash';
    const key = `${effect}:${Math.floor(at.x / 32)}:${Math.floor(at.y / 32)}`;
    if (b.time - (this.cells.get(key) ?? -1) < .07 || this.effects.length >= 96) return;
    this.cells.set(key, b.time);
    this.effects.push({ kind: effect, x: at.x, y: at.y, variant, projectileKind: kind === 'hit' ? projectileKind : null, height: kind === 'hit' ? height : role === 'cavalry' ? 23 : 14, scale: visualScaleOf(at), angle: target && origin ? Math.atan2(target.y - origin.y, target.x - origin.x) : 0, born: b.time,
      life: effect === 'dust' ? .4 : effect === 'muzzle' ? .075 : effect === 'sparks' ? .16 : effect === 'slash' || effect === 'thrust' ? .14 : .22 });
    if (kind === 'hit' && target.hp <= 0 && this.effects.length < 96) {
      // Ground contact follows the fall; it must not puff at the killing blow.
      this.effects.push({ kind: 'fall-dust', x: target.x, y: target.y, scale: visualScaleOf(target), variant,
        direction: target.hitDirection || -target.face, mounted: targetRole === 'cavalry' || targetRole === 'elephant',
        born: b.time + fallDuration(target) * .79, life: .34 });
    }
  }
  update() {
    const time = this.battle.time;
    this.movementSound.update(this.battle, this.audio, this.listener?.());
    this.effects = this.effects.filter(e => time - e.born < e.life);
    for (const [key, at] of this.cells) if (time - at > .5) this.cells.delete(key);
    this.movementDust(time);
  }
  movementDust(time) {
    // Simulation time freezes this pass when paused. Reserve room for hits,
    // and sample a bounded rotating slice even in armies of thousands.
    if (time <= 0 || this.battle.winner !== null || time < (this.nextDustAt || 0)) return;
    this.nextDustAt = time + .08;
    const units = this.battle.units, view = this.listener?.();
    let emitted = 0;
    for (let i = 0, count = Math.min(48, units.length); i < count; i++) {
      this.dustCursor = ((this.dustCursor || 0) + 1) % units.length;
      const u = units[this.dustCursor];
      if (!u.moving || u.hp <= 0 || u.removed) continue;
      const role = roleOf(u), hoof = role === 'cavalry';
      const step = Math.floor(strideClock(u, time) / 4);
      if (hoof && this.hoofSteps.get(u) === step) continue;
      if (view && (Math.abs(u.x - view.x) > WORLD.width / view.zoom / 2 + 30 || Math.abs(u.y - view.y) > WORLD.height / view.zoom / 2 + 30)) continue;
      const key = `step:${Math.floor(u.x / 24)}:${Math.floor(u.y / 24)}`;
      if (time - (this.cells.get(key) ?? -1) < (hoof ? .16 : .24)) continue;
      if (this.effects.length >= 72 || emitted >= 6) break;
      const mounted = hoof || role === 'elephant';
      this.cells.set(key, time);
      if (hoof) this.hoofSteps.set(u, step);
      this.effects.push({ kind: 'step-dust', x: u.x, y: u.y, born: time, life: hoof ? .56 : mounted ? .48 : .34,
        angle: Math.atan2(u.headingY || 0, u.headingX ?? u.face ?? 1), mounted, hoof, face: u.face || 1,
        step, charging: !!u.charge, variant: u.id % 7, scale: visualScaleOf(u) });
      emitted++;
    }
  }
}

const groundEffects = new Set(['step-dust', 'fall-dust', 'dust', 'charge-impact', 'impact']);
export function isGroundEffect(e) { return groundEffects.has(e.kind); }

export function drawCombatEffect(ctx, e, time) {
  if (e.born !== undefined && time < e.born) return;
  const p = Math.max(0, Math.min(1, e.born === undefined ? 1 - e.ttl / e.life : (time - e.born) / e.life));
  if (p >= 1) return;
  ctx.globalAlpha = (1 - p) * (1 - p);
  ctx.lineCap = 'round'; ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffe3a1';
  if (e.kind === 'step-dust' && e.hoof) {
    // Rear hoof contact: low, translucent earth drifting opposite travel.
    // Keep vertical lift in screen space even when a horse turns north/south.
    const dx = Math.cos(e.angle || 0), dy = Math.sin(e.angle || 0);
    const strength = e.charging ? 1.2 : 1;
    const originX = -8 * (e.face || 1), side = (e.step % 2 ? 1 : -1);
    ctx.globalAlpha *= .44 * Math.min(1, p * 12);
    for (let i = 0; i < 3; i++) {
      const drift = p * (7 + i * 3) * strength;
      ctx.fillStyle = i === 1 ? '#b59b70' : '#c9b58b';
      ctx.beginPath();
      ctx.ellipse(originX - dx * drift + (i - 1) * 1.3,
        side - dy * drift * .35 - p * (2 + i),
        (1.1 + p * (3 + i)) * strength, .65 + p * 1.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // A few tiny grains briefly lift off the ground, then fall back.
    ctx.globalAlpha *= 1.25;
    ctx.fillStyle = '#927b54';
    for (let i = 0; i < 3; i++) {
      const drift = p * (6 + i * 4) * strength;
      const lift = Math.sin(Math.PI * p) * (2 + (i + (e.variant || 0)) % 3);
      ctx.fillRect(originX - dx * drift + (i - 1), side - dy * drift * .35 - lift, .7, .7);
    }
  } else if (e.kind === 'step-dust') {
    ctx.rotate(e.angle || 0);
    ctx.globalAlpha *= .38 * Math.min(1, p * 14);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i % 2 ? '#b5a17a' : '#d0bd93';
      const spread = e.mounted ? 1.6 : 1;
      ctx.beginPath();
      ctx.ellipse(-3 - p * (8 + i * 3), (i - 1) * (2 + p * 3), (1.4 + p * 4) * spread, (.6 + p * 1.5) * spread, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (e.kind === 'fall-dust') {
    const dir = e.direction || 1;
    ctx.globalAlpha *= .24 * Math.min(1,p * 12);
    ctx.fillStyle = '#a49573';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.ellipse(dir * (e.mounted ? 5 : 13) + (i - 1) * (3 + p * 9), 2 - p * (2 + i), 2 + p * 5, .7 + p * 1.5, 0, 0, Math.PI * 2); ctx.fill();
    }
  } else if (e.kind === 'charge-impact' || e.kind === 'impact') {
    const charge = e.kind === 'charge-impact', angle = e.angle || 0;
    const strength = Math.max(.35, Math.min(1, e.strength ?? 1));
    const spread = (5 + 24 * Math.sqrt(p)) * strength;
    // Ground-hugging dust, with gaps between lobes so silhouettes stay clear.
    ctx.globalAlpha *= .5;
    for (let i = 0; i < 5; i++) {
      const a = charge ? angle + (i - 2) * .43 : i * Math.PI * 2 / 5 + .3;
      const reach = spread * (charge ? 1 : .7);
      ctx.fillStyle = i % 2 ? '#b29c74' : '#d1bd95';
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * reach, Math.sin(a) * reach * .45,
        2 + p * 8 * strength, 1 + p * 3 * strength, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (!charge) {
      ctx.strokeStyle = '#c4af83'; ctx.lineWidth = 1.2 * (1 - p);
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(0, 0, spread, spread * .43, 0, i * 2.1, i * 2.1 + 1.2); ctx.stroke();
      }
    }
    // A handful of dirt flecks follow short ballistic hops, without particles
    // stored in simulation state or randomness consumed by the battle engine.
    ctx.globalAlpha = (1 - p) ** 2 * .8;
    for (let i = 0; i < 5; i++) {
      const a = charge ? angle + (i - 2) * .5 : i * 2.4;
      const reach = p * (18 + i * 4) * strength, lift = Math.sin(p * Math.PI) * (4 + i * 1.3);
      ctx.fillStyle = i % 2 ? '#7b694c' : '#d4c29c';
      ctx.fillRect(Math.cos(a) * reach, Math.sin(a) * reach * .45 - lift, 1.2, .8);
    }
  } else if (e.kind === 'smoke' || e.kind === 'dust') {
    const smoke = e.kind === 'smoke';
    ctx.globalAlpha *= smoke ? .28 * Math.min(1, p * 14) : .22;
    const dx = smoke ? Math.cos(e.angle || 0) * (6 + p * 14) : p * 5;
    const dy = smoke ? Math.sin(e.angle || 0) * (6 + p * 14) - p * 18 : -p * 7;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = smoke ? (i % 2 ? '#aaa99f' : '#dad6c9') : (i % 2 ? '#a68d65' : '#c1ad87');
      ctx.beginPath(); ctx.ellipse((i - 1.5) * (2 + p * 7) + dx, dy - i % 3 * 2, 1.5 + p * (8 + i), 1 + p * (5 + i), -.2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (e.kind === 'body-hit' || e.kind === 'armor-hit') {
    ctx.translate(0, -(e.height || 14));
    const armored = e.kind === 'armor-hit', angle = e.angle || 0;
    if (e.projectileKind) {
      // Keep projectile contacts inside their existing effect slot. Local,
      // short-lived marks distinguish materials without covering the unit.
      const bullet = e.projectileKind === 'bullet';
      ctx.save(); ctx.rotate(angle);
      if (bullet && armored) {
        // Tiny metal flecks rebound toward the incoming shot, not a second bullet.
        ctx.globalAlpha *= .9; ctx.lineWidth = .85;
        for (let i = 0; i < 3; i++) {
          const a = Math.PI + (i - 1) * .7 + (e.variant || 0) * .04;
          const r = 1 + p * (11 + i * 3), tail = 2.5 * (1 - p);
          ctx.strokeStyle = i === 1 ? '#fff5cf' : '#e8bd77';
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
          ctx.lineTo(Math.cos(a) * (r + tail), Math.sin(a) * (r + tail)); ctx.stroke();
        }
      } else {
        // Fabric/dust puffs for soft contacts; a few pale chips on arrow armor hits.
        ctx.globalAlpha *= armored ? .7 : .32;
        ctx.fillStyle = armored ? '#c8b58d' : '#b7ac90';
        for (let i = 0; i < 3; i++) {
          const x = -p * (5 + i * 3), y = (i - 1) * (1 + p * 5);
          if (armored) ctx.fillRect(x, y + p * p * 5, 1.6 * (1 - p), .7);
          else {
            ctx.beginPath(); ctx.ellipse(x, y, .8 + p * (bullet ? 4 : 2.5), .5 + p * 1.8, 0, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
      ctx.restore();
    }
    if (armored && p < .45) {
      ctx.strokeStyle = '#fff0ce'; ctx.lineWidth = 1.1 * (1 - p);
      const r = 2 + p * 4;
      ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r * .65); ctx.lineTo(0, r * .65); ctx.stroke();
    }
    ctx.globalAlpha *= armored ? .65 : .62;
    ctx.fillStyle = armored ? '#aaa797' : '#6c3027';
    const variant = e.variant || 0;
    for (let i = 0; i < 3; i++) {
      const a = angle + (i - 1) * .55 + Math.sin(variant + i) * .2;
      const drift = p * (6 + i * 3);
      ctx.beginPath(); ctx.ellipse(Math.cos(a) * drift, Math.sin(a) * drift * .45 + p * p * 7, (armored ? .6 : 1) * (1 - p * .5), .6 * (1 - p * .5), a, 0, Math.PI * 2); ctx.fill();
    }
  } else if (e.kind === 'sparks' || e.kind === 'muzzle') {
    ctx.translate(0, -(e.height || 14)); ctx.rotate(e.angle || 0);
    if (e.kind === 'muzzle') {
      ctx.translate(20, 0); ctx.fillStyle = '#d99844';
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(5, -3 * (1 - p)); ctx.lineTo(12 * (1 - p), 0); ctx.lineTo(4, 3 * (1 - p)); ctx.lineTo(0, 2); ctx.fill();
      ctx.fillStyle = '#fff0c5'; ctx.fillRect(0, -1, 4 * (1 - p), 2); return;
    }
    for (let i = 0; i < 5; i++) {
      const a = (i - 2) * .65 + (e.variant || 0) * .17, r = 1 + p * (10 + i * 2), tail = 3 * (1 - p);
      ctx.strokeStyle = i % 2 ? '#e6af60' : '#fff0bd'; ctx.lineWidth = .95;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r + p * p * 9);
      ctx.lineTo(Math.cos(a) * (r + tail), Math.sin(a) * (r + tail) + p * p * 9); ctx.stroke();
    }
  } else if (['slash', 'thrust', 'release'].includes(e.kind)) {
    // The projectile already shows the released arrow. A second advancing
    // streak looked like another arrow leaving the same bow.
    if (e.kind === 'release') return;
    ctx.translate(0, -(e.height || 14)); ctx.rotate(e.angle || 0); ctx.strokeStyle = '#b8bcb6';
    ctx.beginPath();
    if (e.kind === 'slash') {
      // A short tapered blade trail, fading before the next swing.
      const radius = 17 + p * 3, start = -.7 + p * .9, end = .3 + p * .9;
      ctx.globalAlpha *= .46; ctx.fillStyle = '#e1e7dc';
      ctx.arc(0, 0, radius, start, end); ctx.arc(0, 0, radius - 2.2 * (1 - p), end, start, true);
      ctx.closePath(); ctx.fill(); return;
    }
    else { ctx.globalAlpha *= .3; ctx.lineWidth = .8; ctx.moveTo(12 + p * 6, -1); ctx.lineTo(23 + p * 6, 0); }
    ctx.stroke();
  } else {
    ctx.strokeStyle = e.kind === 'order' ? '#efe0a1' : '#e7d4a4'; ctx.lineWidth = e.kind === 'order' ? 2 : 1;
    ctx.beginPath(); ctx.ellipse(0, 0, p * 22 + 4, p * 11 + 3, 0, 0, Math.PI * 2); ctx.stroke();
  }
}

export function combatOffset(unit) {
  if (unit.hp > 0 && unit.stagger > 0) return Math.sin(Math.min(1, unit.stagger / .28) * Math.PI) * 4 * (unit.staggerX || 0);
  if (unit.hp > 0 && unit.flash > 0) return Math.sin(Math.min(1, unit.flash / .13) * Math.PI) * 2 * (unit.hitDirection || 0);
  if (unit.attack <= 0) return 0;
  const cfg = UNIT_TYPES[unit.type], progress = Math.max(0, Math.min(1, 1 - unit.attack / .24));
  const ranged = cfg.ranged || roleOf(unit) === 'archer';
  // The engine commits at halfway: prepare, strike, then recover. Cosmetic only.
  if (ranged) return progress < .5 ? 0 : -Math.sin((progress - .5) * Math.PI * 2) * 3 * unit.face;
  const shift = progress < .25 ? -Math.sin(progress * Math.PI * 4) * 1.4
    : progress < .5 ? Math.sin((progress - .25) * Math.PI * 2) * 5.5
    : (1 - (progress - .5) * 2) ** 2 * 5.5;
  return shift * unit.face;
}
