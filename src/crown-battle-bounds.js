// World space is independent of the camera's 600x960 reference viewport.
export function createBattleBounds(expanded = false) {
  return expanded
    ? { left: -2100, right: 2700, top: -3360, bottom: 4320 }
    : { left: 0, right: 600, top: 0, bottom: 960 };
}

// Called once after deployment: large alliances keep room beyond their ranks.
// No per-frame scan or terrain buffer proportional to the world area.
export function reserveArmyManeuverSpace(bounds, units) {
  if (!units.length) return;
  let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
  for (const u of units) {
    const r = u.combatProfile.radius;
    left = Math.min(left, u.x - r); right = Math.max(right, u.x + r);
    top = Math.min(top, u.y - r); bottom = Math.max(bottom, u.y + r);
  }
  const flank = Math.max(900, (bottom - top) * .2);
  const rear = Math.max(900, (right - left) * .25);
  bounds.left = Math.min(bounds.left, left - rear);
  bounds.right = Math.max(bounds.right, right + rear);
  bounds.top = Math.min(bounds.top, top - flank);
  bounds.bottom = Math.max(bounds.bottom, bottom + flank);
}
