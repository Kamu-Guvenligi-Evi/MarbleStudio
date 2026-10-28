// Only deployment is saved. Combat movement and casualties must never replace it.
export class BattleDeployment {
  constructor(mode, { reset = false, storage = () => localStorage } = {}) {
    this.key = `marble-crown-deployment-${mode}-v1`;
    this.storage = storage;
    this.units = [];
    this.controls = {};
    this.entries = new WeakMap();
    try {
      if (reset) { storage().removeItem(this.key); return; }
      const saved = JSON.parse(storage().getItem(this.key));
      if (saved?.version !== 1 || !Array.isArray(saved.units)) return;
      this.units = saved.units.filter(u => u && (u.team === 0 || u.team === 1) &&
        typeof u.type === 'string' && Number.isFinite(u.x) && Number.isFinite(u.y) &&
        (u.face === 1 || u.face === -1) &&
        (u.headingX === undefined || Number.isFinite(u.headingX) && Math.abs(u.headingX) <= 1) &&
        (u.headingY === undefined || Number.isFinite(u.headingY) && Math.abs(u.headingY) <= 1));
      this.controls = saved.controls || {};
    } catch { /* A damaged or unavailable save must not prevent playing. */ }
  }
  write() {
    try { this.storage().setItem(this.key, JSON.stringify({ version: 1, units: this.units, controls: this.controls })); } catch {}
  }
  armyCounts() {
    const armies = [{}, {}];
    for (const u of this.units) armies[u.team][u.type] = (armies[u.team][u.type] || 0) + 1;
    return armies;
  }
  restore(battle) {
    const groups = new Map();
    for (const saved of this.units) {
      const key = `${saved.armyId ?? `army-${saved.team}`}:${saved.team}:${saved.type}`;
      if (!groups.has(key)) groups.set(key, { units: [], index: 0 });
      groups.get(key).units.push(saved);
    }
    for (const u of battle.units) {
      const group = groups.get(`${u.armyId ?? `army-${u.team}`}:${u.team}:${u.type}`), saved = group?.units[group.index++];
      if (!saved) continue;
      // Automatic positions are regenerated for the current army sizes. Legacy
      // manual formations already stored their heading; retain those as well.
      const manual = saved.tacticalOverride === true || saved.tacticalOverride === undefined && Number.isFinite(saved.headingX);
      if (battle.initialArmyAreas && !manual) continue;
      const { left, right, top, bottom } = battle.bounds;
      if (saved.x < left || saved.x > right || saved.y < top || saved.y > bottom) continue;
      battle.moveUnit(u, saved.x, saved.y);
      Object.assign(u, { lastX: u.x, lastY: u.y, face: saved.face,
        headingX: saved.headingX, headingY: saved.headingY, tacticalOverride: manual });
    }
  }
  capture(battle) {
    if (battle.time !== 0) return;
    this.entries = new WeakMap();
    this.units = battle.units.filter(u => !u.removed && u.hp > 0).map(u => {
      const saved = { team: u.team, armyId: u.armyId, type: u.type, x: u.x, y: u.y,
        face: u.face, headingX: u.headingX, headingY: u.headingY, tacticalOverride: u.tacticalOverride === true };
      this.entries.set(u, saved);
      return saved;
    });
    this.write();
  }
  remove(battle, removed) {
    if (battle.time === 0) { this.capture(battle); return; }
    const entries = new Set(removed.map(u => this.entries.get(u)));
    this.units = this.units.filter(u => !entries.has(u));
    this.write();
  }
  setControls(controls) { this.controls = controls; this.write(); }
}
