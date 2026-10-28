import { WORLD, UNIT_TYPES, roleOf } from './crown-battle.js';

// Read-only spectator: no random draws, orders, timers or combat callbacks.
// Inspect the field at most twice a second; never search pairs of soldiers.
export class BattleDirector {
  constructor(renderer, getBattle) {
    this.renderer = renderer; this.getBattle = getBattle; this.enabled = false;
    this.reset();
  }
  reset() {
    this.battle = null; this.elapsed = 0; this.focus = null; this.aim = null;
    this.lastTime = -1; this.lastAction = -Infinity; this.cutAt = -Infinity; this.phase = 'Meydan';
  }
  setEnabled(enabled) { this.enabled = enabled; this.reset(); }
  tick(dt, running) {
    if (!this.enabled || !running || !Number.isFinite(dt) || dt <= 0) return;
    const b = this.getBattle();
    if (!b || b.winner !== null) return;
    if (b !== this.battle || b.time < this.lastTime) { this.reset(); this.battle = b; }
    this.elapsed += Math.min(dt, .1);
    if (this.lastTime < 0 || this.elapsed >= .6) {
      this.elapsed = 0; this.lastTime = b.time; this.inspect(b);
    }
    if (!this.aim) return;
    const v = this.renderer.view, a = this.aim;
    // Finish a move, then leave the cached ground completely still. Small
    // changes inside the frame do not cause endless camera drift/redraws.
    const blend = 1 - Math.exp(-Math.min(dt, .1) * 1.7);
    for (const key of ['x', 'y', 'zoom']) {
      const epsilon = key === 'zoom' ? .004 : .6;
      v[key] = Math.abs(a[key] - v[key]) < epsilon ? a[key] : v[key] + (a[key] - v[key]) * blend;
    }
    this.renderer.clampView();
  }
  inspect(b) {
    const cells = new Map();
    let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
    for (const u of b.units) {
      if (u.hp <= 0 || u.removed) continue;
      left = Math.min(left, u.x); right = Math.max(right, u.x);
      top = Math.min(top, u.y); bottom = Math.max(bottom, u.y);
      const target = u.target;
      if (!target || target.hp <= 0 || target.removed) continue;
      const cfg = UNIT_TYPES[u.type], ranged = cfg.ranged || roleOf(u) === 'archer';
      const d2 = (target.x - u.x) ** 2 + (target.y - u.y) ** 2;
      const charging = !!u.charge, shooting = ranged && u.attack > 0;
      const contact = !ranged && d2 <= (cfg.reach + 24) ** 2;
      if (!charging && !shooting && !contact) continue;
      const weight = charging ? 5 : contact ? 3 : 1;
      const x = (u.x + target.x) / 2, y = (u.y + target.y) / 2;
      const cx = Math.floor(x / 120), cy = Math.floor(y / 160), key = `${cx}:${cy}`;
      let cell = cells.get(key);
      if (!cell) { cell = { cx, cy, weight: 0, x: 0, y: 0, charge: 0, melee: 0, shots: 0 }; cells.set(key, cell); }
      cell.weight += weight; cell.x += x * weight; cell.y += y * weight;
      cell.charge += charging ? weight : 0; cell.melee += contact ? weight : 0; cell.shots += shooting ? weight : 0;
    }
    if (!Number.isFinite(left)) { this.aim = null; return; }
    let best = null, incumbent = null;
    // Merge neighboring cells so a fight crossing a grid edge stays one shot.
    for (const cell of cells.values()) {
      const cluster = { x: 0, y: 0, weight: 0, charge: 0, melee: 0, shots: 0 };
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const near = cells.get(`${cell.cx + dx}:${cell.cy + dy}`);
        if (near) for (const key of ['x', 'y', 'weight', 'charge', 'melee', 'shots']) cluster[key] += near[key];
      }
      cluster.x /= cluster.weight; cluster.y /= cluster.weight;
      if (!best || cluster.weight > best.weight) best = cluster;
      if (this.focus && Math.hypot(cluster.x - this.focus.x, cluster.y - this.focus.y) < 200 &&
          (!incumbent || cluster.weight > incumbent.weight)) incumbent = cluster;
    }
    if (incumbent && (b.time - this.cutAt < 6 || incumbent.weight >= best.weight * .65)) best = incumbent;
    let x, y, zoom;
    if (best) {
      if (!this.focus || Math.hypot(best.x - this.focus.x, best.y - this.focus.y) >= 200) this.cutAt = b.time;
      this.focus = best;
      x = best.x; y = best.y;
      // Keep room for incoming riders and projectiles; never dive into one sprite.
      zoom = best.charge > best.melee ? 1.35 : best.melee ? 1.65 : 1.25;
      this.phase = best.charge > best.melee ? 'Süvari hücumu' : best.melee ? 'Yakın dövüş' : 'Menzilli ateş';
    } else {
      // Brief gaps between attack animations must not cause a zoom-out pulse.
      if (this.focus && b.time - this.lastAction < 3) return;
      this.focus = null;
      x = (left + right) / 2; y = (top + bottom) / 2;
      zoom = Math.min(1.25, (this.renderer.viewWidth ?? WORLD.width) / (right - left + 150), (this.renderer.viewHeight ?? WORLD.height) / (bottom - top + 230));
      this.phase = 'Orduların yaklaşması';
    }
    if (best) this.lastAction = b.time;
    const r = this.renderer, previous = r.view;
    // Use the renderer's real map constraints, including the expanded map.
    r.view = { x, y, zoom }; r.clampView();
    const next = r.view; r.view = previous;
    if (!this.aim || Math.abs(next.x - this.aim.x) > 35 / next.zoom ||
        Math.abs(next.y - this.aim.y) > 55 / next.zoom || Math.abs(next.zoom - this.aim.zoom) > .18) this.aim = next;
  }
}
