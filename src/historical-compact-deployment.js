import { deploymentCorps } from './historical-deployment-corps.js';

// A narrow frontage trades width for depth. Keep melee in front of missile
// troops and reject impossible spaces instead of stacking soldiers at an edge.
export function compactDeployment(units, origin, direction, bounds) {
  if (!units.length) return null;
  const angle = direction * Math.PI / 180;
  const forward = { x: Math.round(Math.cos(angle)), y: Math.round(Math.sin(angle)) };
  const side = { x: -forward.y, y: forward.x };
  const radius = Math.max(...units.map(u => u.combatProfile.radius)), gap = radius * 2 + 5;
  const area = { left: bounds.left + 45 + radius, right: bounds.right - 45 - radius,
    top: bounds.top + 115 + radius, bottom: bounds.bottom - 95 - radius };
  const width = forward.x ? area.bottom - area.top : area.right - area.left;
  const depth = forward.x ? area.right - area.left : area.bottom - area.top;
  if (width < 0 || depth < 0) return null;
  // Separate ranks keep pikes together and prevent chariots being interleaved
  // with foot archers when an allied sector is too narrow for deployed wings.
  const corps = ['pike', 'infantry', 'elephant', 'horse', 'escort', 'light-horse', 'skirmisher', 'missile', 'mounted', 'chariot']
    .map(kind => ({ kind, units: units.filter(u => deploymentCorps(u) === kind)
      .sort((a, b) => (b.x - a.x) * forward.x + (b.y - a.y) * forward.y || a.id - b.id) }))
    .filter(group => group.units.length);
  const maxColumns = Math.floor(width / gap) + 1;
  let columns = Math.min(Math.ceil(Math.sqrt(units.length)), maxColumns);
  const rankCount = () => corps.reduce((n, group) => n + Math.ceil(group.units.length / columns), 0);
  while ((rankCount() - 1) * gap > depth && columns < Math.min(maxColumns, units.length)) columns++;
  const rows = rankCount();
  if ((rows - 1) * gap > depth) return null;
  const ranks = corps.flatMap(group => Array.from({ length: Math.ceil(group.units.length / columns) }, (_, i) =>
    ({ kind: group.kind, units: group.units.slice(i * columns, (i + 1) * columns) })));
  const members = [];
  for (let row = 0; row < rows; row++) {
    const rank = ranks[row].units
      .sort((a, b) => (a.x - b.x) * side.x + (a.y - b.y) * side.y || a.id - b.id);
    rank.forEach((unit, col) => {
      const f = ((rows - 1) / 2 - row) * gap, a = (col - (rank.length - 1) / 2) * gap;
      members.push({ unit, role: unit.combatProfile.ranged ? 'bow' : 'front', duty: 'compact', corps: ranks[row].kind,
        goal: { id: unit.id, radius: unit.combatProfile.radius,
          x: origin.x + forward.x * f + side.x * a, y: origin.y + forward.y * f + side.y * a } });
    });
  }
  const shift = (axis, low, high) => Math.max(low - Math.min(...members.map(m => m.goal[axis])),
    Math.min(0, high - Math.max(...members.map(m => m.goal[axis]))));
  const dx = shift('x', area.left, area.right), dy = shift('y', area.top, area.bottom);
  for (const m of members) { m.goal.x += dx; m.goal.y += dy; }
  return { members, forward, compact: true, sections: [], groups: [] };
}
