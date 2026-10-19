// Walking and body separation need a much smaller neighborhood than targeting.
// Keep these buckets separate from the 40-unit swept projectile/contact grid.
export class LocalBattleGrid {
  constructor(units) {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
    for (const u of units) {
      left = Math.min(left, u.x); right = Math.max(right, u.x);
      top = Math.min(top, u.y); bottom = Math.max(bottom, u.y);
    }
    this.left = Math.floor(left / 16); this.top = Math.floor(top / 16);
    this.right = Math.floor(right / 16); this.bottom = Math.floor(bottom / 16);
    this.width = units.length ? this.right - this.left + 1 : 0;
    this.cells = new Array(units.length ? this.width * (this.bottom - this.top + 1) : 0);
    for (const u of units) {
      const index = (Math.floor(u.y / 16) - this.top) * this.width + Math.floor(u.x / 16) - this.left;
      (this.cells[index] ||= []).push(u);
    }
  }
  near(u, radius, limit = 64) {
    const result = [], px = u.x, py = u.y, r2 = radius * radius;
    const left = Math.max(this.left, Math.floor((px - radius) / 16));
    const right = Math.min(this.right, Math.floor((px + radius) / 16));
    const top = Math.max(this.top, Math.floor((py - radius) / 16));
    const bottom = Math.min(this.bottom, Math.floor((py + radius) / 16));
    for (let y = top; y <= bottom; y++) {
      const dy = Math.max(y * 16 - py, 0, py - (y + 1) * 16), remaining = r2 - dy * dy;
      const row = (y - this.top) * this.width - this.left;
      for (let x = left; x <= right; x++) {
        const bucket = this.cells[row + x];
        if (!bucket) continue;
        const dx = Math.max(x * 16 - px, 0, px - (x + 1) * 16);
        if (dx * dx > remaining) continue;
        // Bound dense-cell work, rotating the sample by soldier so every rank
        // does not steer against the same small set of neighbours.
        const count = Math.min(16, bucket.length), start = u.id * 17 % bucket.length;
        for (let i = 0; i < count; i++) {
          const index = start + Math.floor(i * bucket.length / count);
          const v = bucket[index >= bucket.length ? index - bucket.length : index];
          const vx = px - v.x, vy = py - v.y;
          if (v !== u && v.hp > 0 && vx * vx + vy * vy <= r2) {
            result.push(v);
            if (result.length >= limit) return result;
          }
        }
      }
    }
    return result;
  }
}
