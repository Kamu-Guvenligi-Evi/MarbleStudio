import { HISTORICAL_ART_PROFILES } from './historical-art-profiles.js';
import { strideClock } from './crown-battle-reference-motion.js';

const chargeWeapons = new Set(['lance', 'kontos', 'xyston', 'sogdLance', 'mcHookLance']);
const phases = { assemble: 'Kanatlar açılıyor', retreat: 'Sahte ricat', envelop: 'Kanat kuşatması', charge: 'Süvari hücumuna hazırlık', regroup: 'Ordu yeniden birleşiyor' };
export function hasChargePose(type) {
  const profile = HISTORICAL_ART_PROFILES[type];
  return !!profile?.horse && chargeWeapons.has(profile.weapon);
}
export function tacticalPhaseLabel(battle, team) {
  if (!(battle.time > 0) || battle.winner != null) return '';
  if (battle.armyConfigs?.some(a => a.team === team)) {
    const labels = battle.armyConfigs.filter(a => a.team === team).map(a => armyTacticalLabel(battle, a.id)).filter(Boolean);
    return [...new Set(labels)].join(' · ');
  }
  return phases[battle.tactics?.teams?.[team]?.phase] || battle.tactics?.civilizations?.teams?.[team]?.phaseLabel || '';
}
export function armyTacticalLabel(battle, armyId) {
  if (!(battle?.time > 0) || battle.winner != null) return '';
  const tactics = battle.tactics;
  const formation = tactics?.formations?.armies?.get(armyId);
  if (formation && formation.phase !== 'done' && formation.strategy) {
    const phase = formation.phase === 'assemble' ? 'Diziliş kuruluyor'
      : formation.holding ? 'Hat korunuyor' : 'Birlikler ilerliyor';
    return `${formation.strategy.label} · ${formation.compact ? 'Dar cephe · ' : ''}${phase}`;
  }
  return phases[tactics?.armies?.get(armyId)?.phase]
    || tactics?.civilizations?.armies?.get(armyId)?.phaseLabel
    || (formation?.compact
      ? ({ assemble: 'Dar cephe düzeni kuruluyor', advance: 'Dar cephede saflar ilerliyor' }[formation.phase] || '')
      : ({ assemble: 'Komutan dizilişi kuruluyor', advance: 'Saflar birlikte ilerliyor' }[formation?.phase] || ''));
}
// Both Canvas and GPU paths use the same action and contact frame. No pose objects
// are allocated per soldier. Only art that already implements lowering is enabled.
export function soldierAction(unit, chargePose = hasChargePose(unit.type)) {
  if (unit.hp <= 0) return 'idle';
  if (unit.attack > 0) return 'attack';
  if (chargePose && unit.charge) return unit.charge.age < .22 ? 'charge-ready' : 'charge';
  return unit.moving ? 'walk' : 'idle';
}
export function soldierFrame(unit, action, time) {
  if (action === 'idle') return 0;
  if (action === 'attack') return Math.max(0, Math.min(7, Math.floor((1 - unit.attack / .24) * 8)));
  if (action === 'charge-ready') return Math.max(0, Math.min(7, Math.floor(unit.charge.age / .22 * 8)));
  return Math.floor(strideClock(unit, time)) % 8;
}

export class TacticalVisuals {
  constructor() { this.routes = []; this.nextSample = 0; this.samples = 0; }
  update(battle, revision = 0) {
    if (this.battle !== battle) { this.battle = battle; this.nextSample = 0; this.routes = []; }
    if (!battle.selected.size || !(battle.time > 0) || battle.winner != null || !battle.tactics) {
      this.routes = []; this.nextSample = 0; return;
    }
    if (revision === this.revision && battle.selected.size === this.selectionSize && battle.time < this.nextSample && battle.time >= this.sampleTime) return;
    this.revision = revision; this.selectionSize = battle.selected.size;
    this.sampleTime = battle.time; this.nextSample = battle.time + .25; this.samples++;
    this.routes = [];
    // At most three group arrows per team, sampled four times per simulation second.
    // Read actual goals, never invent successful manoeuvres or write AI state.
    for (const state of [...(battle.tactics.armies?.values() || battle.tactics.teams || []), ...(battle.tactics.civilizations?.armies?.values() || battle.tactics.civilizations?.teams || [])]) {
      if (!state || state.phase === 'done') continue;
      const groups = new Map();
      for (const member of state.members || []) {
        const { unit } = member, role = member.visualRole || member.role;
        if (!battle.selected.has(unit.id) || unit.hp <= 0 || unit.removed || unit.order || unit.tacticalOverride) continue;
        if (!['bait', 'left', 'right'].includes(role)) continue;
        const intent = battle.tactics.intents.get(unit.id) || battle.tactics.civilizations?.intents.get(unit.id);
        if (!intent?.goal || !Number.isFinite(intent.goal.x + intent.goal.y + unit.x + unit.y)) continue;
        let group = groups.get(role);
        if (!group) { group = { team: state.team, role, x: 0, y: 0, gx: 0, gy: 0, count: 0, ids: [] }; groups.set(role, group); }
        group.x += unit.x; group.y += unit.y; group.gx += intent.goal.x; group.gy += intent.goal.y;
        group.count++; group.ids.push(unit.id);
      }
      for (const group of groups.values()) {
        for (const key of ['x', 'y', 'gx', 'gy']) group[key] /= group.count;
        if (Math.hypot(group.gx - group.x, group.gy - group.y) >= 12) this.routes.push(group);
      }
    }
  }
  draw(ctx, battle, zoom = 1, revision = 0) {
    this.update(battle, revision);
    if (!this.routes.length) return;
    ctx.save(); ctx.lineWidth = 1.4 / zoom; ctx.setLineDash([5 / zoom, 5 / zoom]);
    for (const route of this.routes) {
      // A cleared selection disappears immediately, including while paused.
      if (!route.ids.some(id => battle.selected.has(id))) continue;
      const dx = route.gx - route.x, dy = route.gy - route.y, length = Math.hypot(dx, dy);
      const size = Math.min(9 / zoom, length / 3), ux = dx / length, uy = dy / length;
      ctx.strokeStyle = route.team ? '#e5aa9188' : '#a5d8e788';
      ctx.beginPath(); ctx.moveTo(route.x, route.y); ctx.lineTo(route.gx, route.gy); ctx.stroke();
      ctx.setLineDash([]); ctx.beginPath();
      ctx.moveTo(route.gx - ux * size - uy * size * .5, route.gy - uy * size + ux * size * .5);
      ctx.lineTo(route.gx, route.gy);
      ctx.lineTo(route.gx - ux * size + uy * size * .5, route.gy - uy * size - ux * size * .5);
      ctx.stroke(); ctx.setLineDash([5 / zoom, 5 / zoom]);
    }
    ctx.restore();
  }
}
