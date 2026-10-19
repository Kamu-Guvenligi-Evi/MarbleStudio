// Geometric contacts in battlefield units. These are gameplay-scale bodies,
// not measured human dimensions or a wound/penetration model.
export const bodyRadius = u => u.combatProfile?.radius ?? 3.75;
export const bodyHeight = u => u.combatProfile?.role === 'elephant' ? 44
  : u.combatProfile?.role === 'cavalry' ? 30 : 18;

// Exact buckets, not the bounded samples used by AI neighbor searches. A
// projectile must not skip the first body merely because a formation is dense.
export function contactCandidates(grid, ax, ay, bx, by, padding = 24) {
  if (!grid?.cells?.length) return [];
  const result = [];
  const left = Math.max(grid.minX, Math.floor((Math.min(ax, bx) - padding) / 40));
  const right = Math.min(grid.maxX, Math.floor((Math.max(ax, bx) + padding) / 40));
  const top = Math.max(grid.minY, Math.floor((Math.min(ay, by) - padding) / 40));
  const bottom = Math.min(grid.maxY, Math.floor((Math.max(ay, by) + padding) / 40));
  const dx = bx - ax, dy = by - ay;
  for (let y = top; y <= bottom; y++) {
    // Only visit columns crossed while the segment is inside this padded row.
    // A diagonal fire line no longer scans the entire enclosing rectangle.
    // Padding remains conservative for body radii and within-tick movement;
    // every body in a relevant bucket is still tested, without AI sampling.
    let rowLeft = left, rowRight = right;
    if (Math.abs(dy) > 1e-12) {
      const a = (y * 40 - padding - ay) / dy;
      const b = ((y + 1) * 40 + padding - ay) / dy;
      const start = Math.max(0, Math.min(a, b)), end = Math.min(1, Math.max(a, b));
      if (start > end) continue;
      const x1 = ax + dx * start, x2 = ax + dx * end;
      rowLeft = Math.max(left, Math.floor((Math.min(x1, x2) - padding) / 40));
      rowRight = Math.min(right, Math.floor((Math.max(x1, x2) + padding) / 40));
    }
    const row = (y - grid.minY) * grid.width - grid.minX;
    for (let x = rowLeft; x <= rowRight; x++) {
      const bucket = grid.cells[row + x];
      if (bucket) for (const u of bucket) if (u.hp > 0 && !u.removed) result.push(u);
    }
  }
  return result;
}

// Relative swept point/cylinder intersection; includes a body crossing the
// shaft between frames, not just bodies at the two frame endpoints.
export function arrowBodyContact(p, u, fromAge, toAge, frameDt) {
  if (u.id != null && u.id === p.sourceId) return null;
  const span = toAge - fromAge;
  if (span <= 0) return null;
  const motionX = u.x - (u.lastX ?? u.x), motionY = u.y - (u.lastY ?? u.y);
  const fraction = Math.min(1, span / frameDt);
  // A shortened terminal segment uses the FIRST part of this frame's motion.
  // Infinity is the stationary fire-line query, using current body positions.
  const startX = frameDt === Infinity ? u.x : (u.lastX ?? u.x);
  const startY = frameDt === Infinity ? u.y : (u.lastY ?? u.y);
  const x = p.fromX + p.vx * fromAge - startX;
  const y = p.fromY + p.vy * fromAge - startY;
  const dx = p.vx * span - motionX * fraction, dy = p.vy * span - motionY * fraction;
  const radius = bodyRadius(u) + 1;
  const a = dx * dx + dy * dy, b = x * dx + y * dy, c = x * x + y * y - radius * radius;
  let enter = 0, leave = 1;
  if (a < 1e-12) { if (c > 0) return null; }
  else {
    const disc = b * b - a * c;
    if (disc < 0) return null;
    const root = Math.sqrt(disc);
    enter = Math.max(0, (-b - root) / a); leave = Math.min(1, (-b + root) / a);
    if (enter > leave) return null;
  }
  const first = fromAge + enter * span, last = fromAge + leave * span;
  const gravity = p.gravity ?? 180;
  const height = t => p.releaseHeight + p.vz * t - gravity * t * t / 2;
  if (height(first) <= bodyHeight(u) + 1e-8) return first;
  if (gravity === 0) return null;
  // The descending root is the first possible entry from above the body.
  const disc = p.vz * p.vz + 2 * gravity * (p.releaseHeight - bodyHeight(u));
  if (disc < 0) return null;
  const descent = (p.vz + Math.sqrt(disc)) / gravity;
  return descent >= first && descent <= last ? descent : null;
}

export function firstArrowContact(p, fromAge, toAge, grid, frameDt) {
  const ax = p.fromX + p.vx * fromAge, ay = p.fromY + p.vy * fromAge;
  const bx = p.fromX + p.vx * toAge, by = p.fromY + p.vy * toAge;
  let contact = null;
  for (const u of contactCandidates(grid, ax, ay, bx, by)) {
    const age = arrowBodyContact(p, u, fromAge, toAge, frameDt);
    if (age !== null && (!contact || age < contact.age || (age === contact.age && u.id < contact.unit.id))) contact = { unit: u, age };
  }
  return contact;
}

export function chargeContacts(unit, charge, fromX, fromY, grid, reach) {
  const travelled = Math.hypot(unit.x - fromX, unit.y - fromY);
  const contacts = [];
  for (const enemy of contactCandidates(grid, fromX, fromY, unit.x, unit.y, reach + 18)) {
    if (enemy.team === unit.team || charge.hit.has(enemy.id)) continue;
    const dx = enemy.x - fromX, dy = enemy.y - fromY;
    const along = dx * charge.dx + dy * charge.dy;
    const across = Math.abs(dx * -charge.dy + dy * charge.dx);
    const weaponReach = Math.max(reach, enemy.combatProfile?.role === 'pike' ? enemy.combatProfile.config.reach : 0);
    if (along < 0 || along > travelled + weaponReach || across > bodyRadius(unit) + bodyRadius(enemy)) continue;
    contacts.push({ unit: enemy, distance: Math.max(0, along - weaponReach) });
  }
  return contacts.sort((a, b) => a.distance - b.distance || a.unit.id - b.unit.id);
}
