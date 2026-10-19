import { UNIT_TYPES, WORLD, roleOf } from './crown-battle.js';

// A small, stratified sample across both armies, plus the previous nearest
// listeners. No full army scan, timers, or changes to combat RNG/state.
export class MovementSoundField {
  constructor() {
    this.nextAt = 0; this.phase = 0; this.nearest = [null, null];
  }
  update(battle, audio, view) {
    if (!audio?.move || !audio.enabled || !audio.volume || audio.context?.state !== 'running') return;
    const now = audio.context.currentTime;
    if (now < this.nextAt || battle.time <= 0 || battle.winner !== null) return;
    this.nextAt = now + .12;
    if (!battle.units.length) { this.nearest = [null, null]; return; }
    const best = [null, null], scores = [Infinity, Infinity];
    const consider = u => {
      if (!u || u.hp <= 0 || u.removed || !u.moving || u.stagger > 0) return;
      const cfg = UNIT_TYPES[u.type], role = roleOf(u);
      // Giants/elephants and non-horse fantasy mounts need their own recordings.
      if (role === 'elephant' || cfg.visualScale > 2 ||
          /(?:azog_warg|uruk_warg_rider|dwarf_ram_rider|elf_stag_rider|thranduil|dain)$/.test(u.type)) return;
      const nx = view ? (u.x - view.x) * view.zoom / (WORLD.width / 2)
        : (u.x - battle.bounds.left) / (battle.bounds.right - battle.bounds.left) * 2 - 1;
      const ny = view ? (u.y - view.y) * view.zoom / (WORLD.height / 2) : 0;
      const distance2 = nx * nx + ny * ny, group = role === 'cavalry' ? 1 : 0;
      if (distance2 >= 4 || distance2 >= scores[group]) return;
      scores[group] = distance2;
      best[group] = { unit: u, pan: nx * .7, gain: 1 / (1 + distance2 * .7),
        pace: Math.sqrt(Math.max(.1, (u.speed || cfg.speed) / cfg.speed)) };
    };
    for (const u of this.nearest) consider(u);
    const units = battle.units, count = Math.min(96, units.length);
    this.phase = (this.phase + .38196601125) % 1;
    for (let i = 0; i < count; i++) consider(units[Math.floor((i + this.phase) * units.length / count)]);
    for (let i = 0; i < 2; i++) {
      this.nearest[i] = best[i]?.unit || null;
      if (best[i]) audio.move(i ? 'hoof' : 'foot', best[i].pan, best[i]);
    }
  }
}
