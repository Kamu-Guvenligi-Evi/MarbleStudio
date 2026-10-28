// A bounded visibility graph is used only for manual orders near planted allies.
// Routes are cached on the order; ordinary combat keeps its existing steering.
export function clearFormationSegment(a, b, obstacles) {
  const dx = b.x - a.x, dy = b.y - a.y, length2 = dx * dx + dy * dy;
  for (const o of obstacles) {
    const t = length2 ? Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.y - a.y) * dy) / length2)) : 0;
    if (t === 0 && (a.x - o.x) ** 2 + (a.y - o.y) ** 2 < o.r * o.r) continue; // Escape an existing overlap.
    if ((a.x + dx * t - o.x) ** 2 + (a.y + dy * t - o.y) ** 2 < o.r * o.r) return false;
  }
  return true;
}

export function formationRoute(start, goal, obstacles, free) {
  if (clearFormationSegment(start, goal, obstacles)) return [goal];
  const nodes = [start, goal];
  for (const o of obstacles) for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4, r = o.r / Math.cos(Math.PI / 8) + .5;
    const p = { x: o.x + Math.cos(angle) * r, y: o.y + Math.sin(angle) * r };
    if (free(p) && obstacles.every(v => (p.x - v.x) ** 2 + (p.y - v.y) ** 2 >= v.r * v.r)) nodes.push(p);
  }
  const costs = new Float64Array(nodes.length).fill(Infinity), previous = new Int16Array(nodes.length).fill(-1);
  const visited = new Uint8Array(nodes.length); costs[0] = 0;
  for (let pass = 0; pass < nodes.length; pass++) {
    let best = -1, score = Infinity;
    for (let i = 0; i < nodes.length; i++) if (!visited[i]) {
      const f = costs[i] + Math.hypot(nodes[i].x - goal.x, nodes[i].y - goal.y);
      if (f < score) { best = i; score = f; }
    }
    if (best < 0) break;
    if (best === 1) {
      const path = [];
      for (let i = 1; i > 0; i = previous[i]) path.unshift(nodes[i]);
      return path;
    }
    visited[best] = 1;
    for (let j = 1; j < nodes.length; j++) if (!visited[j]) {
      const cost = costs[best] + Math.hypot(nodes[best].x - nodes[j].x, nodes[best].y - nodes[j].y);
      if (cost < costs[j] && clearFormationSegment(nodes[best], nodes[j], obstacles)) { costs[j] = cost; previous[j] = best; }
    }
  }
  return [];
}
