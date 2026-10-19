import { fortressGeometry } from './crown-battle-fortress.js';
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const expand = (r, p) => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });
const inside = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
function intersects(a, b, r) {
  // Most local moves are far from an obstacle. Reject their bounding boxes
  // before division; keep this hot path free of per-obstacle arrays/closures.
  const right = r.x + r.w, bottom = r.y + r.h;
  if ((a.x < r.x && b.x < r.x) || (a.x > right && b.x > right) ||
      (a.y < r.y && b.y < r.y) || (a.y > bottom && b.y > bottom)) return false;
  let lo = 0, hi = 1;
  const dx = b.x - a.x, dy = b.y - a.y;
  if (Math.abs(dx) >= 1e-9) {
    const t1 = (r.x - a.x) / dx, t2 = (right - a.x) / dx;
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
    if (lo > hi) return false;
  }
  if (Math.abs(dy) >= 1e-9) {
    const t1 = (r.y - a.y) / dy, t2 = (bottom - a.y) / dy;
    lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2));
  }
  return lo <= hi;
}

// A small visibility graph is shared by each body size. No per-frame grid search.
export class BattleNavigation {
  constructor(bounds) {
    this.obstacles = fortressGeometry(bounds); this.graphs = new Map(); this.expanded = new Map();
    this.sightObstacles = this.obstacles.filter(r => r.kind !== 'water');
    this.area = { x: bounds.left + 35, y: bounds.top + 110, w: bounds.right - bounds.left - 70, h: bounds.bottom - bounds.top - 195 };
  }
  rects(radius) {
    if (!this.expanded.has(radius)) this.expanded.set(radius, this.obstacles.map(r => expand(r, radius + .5)));
    return this.expanded.get(radius);
  }
  free(p, radius = 0) {
    if (!inside(p, this.area)) return false;
    for (const r of this.rects(radius)) if (inside(p, r)) return false;
    return true;
  }
  clear(a, b, radius = 0, sight = false) {
    for (const r of sight ? this.sightObstacles : this.rects(radius)) if (intersects(a, b, r)) return false;
    return true;
  }
  nearest(p, radius) {
    const a = this.area;
    const bounded = { x: Math.max(a.x, Math.min(a.x + a.w, p.x)), y: Math.max(a.y, Math.min(a.y + a.h, p.y)) };
    if (this.free(bounded, radius)) return bounded;
    const choices = [];
    for (const r of this.rects(radius + 1)) {
      const x = Math.max(r.x, Math.min(r.x + r.w, bounded.x)), y = Math.max(r.y, Math.min(r.y + r.h, bounded.y));
      choices.push({ x: r.x, y }, { x: r.x + r.w, y }, { x, y: r.y }, { x, y: r.y + r.h });
      for (const xx of [r.x, r.x + r.w]) for (const yy of [r.y, r.y + r.h]) choices.push({ x: xx, y: yy });
    }
    return choices.filter(q => this.free(q, radius)).sort((c, d) => dist(c, bounded) - dist(d, bounded))[0] || bounded;
  }
  graph(radius) {
    if (this.graphs.has(radius)) return this.graphs.get(radius);
    const nodes = [];
    for (const r of this.rects(radius + 2)) for (const x of [r.x, r.x + r.w]) for (const y of [r.y, r.y + r.h]) {
      if (this.free({ x, y }, radius)) nodes.push({ x, y });
    }
    const edges = nodes.map(() => []);
    for (let i = 0; i < nodes.length; i++) for (let j = 0; j < i; j++) if (this.clear(nodes[i], nodes[j], radius)) {
      const d = dist(nodes[i], nodes[j]); edges[i].push([j, d]); edges[j].push([i, d]);
    }
    const graph = { nodes, edges }; this.graphs.set(radius, graph); return graph;
  }
  route(start, destination, radius) {
    const goal = this.nearest(destination, radius);
    if (this.clear(start, goal, radius)) return [goal];
    const { nodes, edges } = this.graph(radius), n = nodes.length;
    const costs = nodes.map(p => this.clear(start, p, radius) ? dist(start, p) : Infinity);
    const prev = new Int32Array(n).fill(-1), visited = new Uint8Array(n);
    let best = Infinity, last = -1;
    for (let k = 0; k < n; k++) {
      let u = -1;
      for (let i = 0; i < n; i++) if (!visited[i] && (u < 0 || costs[i] < costs[u])) u = i;
      if (u < 0 || !Number.isFinite(costs[u]) || costs[u] >= best) break;
      visited[u] = 1;
      if (this.clear(nodes[u], goal, radius) && costs[u] + dist(nodes[u], goal) < best) { best = costs[u] + dist(nodes[u], goal); last = u; }
      for (const [v, d] of edges[u]) if (costs[u] + d < costs[v]) { costs[v] = costs[u] + d; prev[v] = u; }
    }
    if (last < 0) return [];
    const path = [goal];
    for (let i = last; i >= 0; i = prev[i]) path.unshift(nodes[i]);
    return path;
  }
  waypoint(u, target, radius) {
    if (this.clear(u, target, radius) && this.free(target, radius)) { u.navPath = null; return target; }
    if (!u.navPath?.length || !u.navGoal || dist(u.navGoal, target) > 24 || !this.clear(u, u.navPath[0], radius)) {
      u.navPath = this.route(u, target, radius); u.navGoal = { x: target.x, y: target.y };
    }
    while (u.navPath.length > 1 && (dist(u, u.navPath[0]) < 1.5 || this.clear(u, u.navPath[1], radius))) u.navPath.shift();
    return u.navPath[0] || u;
  }
  move(from, to, radius) {
    if (this.free(to, radius) && this.clear(from, to, radius)) return to;
    const x = { x: to.x, y: from.y }, y = { x: from.x, y: to.y };
    for (const p of dist(from, x) > dist(from, y) ? [x, y] : [y, x]) if (this.free(p, radius) && this.clear(from, p, radius)) return p;
    return { x: from.x, y: from.y };
  }
}
