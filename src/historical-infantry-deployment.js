// Historically grounded roles, with distances scaled to the simulation's bodies.
// Sources and the limits of these reconstructions are recorded in
// docs/tactical-responsiveness-2026-10-16.txt.
const radius = units => Math.max(3.75, ...units.map(u => u.combatProfile.radius));
const put = (s, unit, role, f, a, extra = {}) => s.members.push({
  unit, role, f, a, visualRole: a < 0 ? 'left' : a > 0 ? 'right' : 'bait', ...extra,
});

export function pikeBlock(s, groups) {
  const pikes = groups.get('front') || [], support = groups.get('support') || [];
  const melee = [...pikes, ...support], pitch = radius(melee) * 2 + 2.5;
  // Scale both dimensions. Eight fixed files made large armies a marching
  // column, with every short weapon stranded behind the last pike rank.
  const columns = Math.ceil(Math.sqrt(melee.length));
  const rows = Math.ceil(melee.length / columns), slots = [];
  for (let row = 0; row < rows; row++) {
    const count = Math.min(columns, melee.length - row * columns);
    for (let col = 0; col < count; col++) slots.push({ row, col,
      f: 25 - row * pitch, a: (col - (count - 1) / 2) * pitch,
      edge: row === 0 || row === rows - 1 || col === 0 || col === count - 1,
    });
  }
  // Pikes enclose the short-weapon core; spare pikes deepen the forward ranks.
  // This is a scaled mixed block, not a claim of one fixed historical headcount.
  slots.sort((a, b) => Number(b.edge) - Number(a.edge) || a.row - b.row || a.col - b.col);
  slots.forEach((p, i) => put(s, melee[i], i < pikes.length ? 'front' : 'support', p.f, p.a));
  const bow = groups.get('bow') || [], half = Math.ceil(bow.length / 2);
  const edge = (columns - 1) * pitch / 2 + radius(melee) + 18;
  for (const [sign, soldiers] of [[-1, bow.slice(0, half)], [1, bow.slice(half)]]) {
    const files = Math.ceil(Math.sqrt(soldiers.length * 2));
    soldiers.forEach((u, i) => put(s, u, 'bow', 30 - Math.floor(i / files) * 12,
      sign * (edge + (i % files) * 12)));
  }
  s.formationGeometry = { kind: 'mixed-pike-block', columns, rows, pitch };
}

export function mingTeams(s, groups, units) {
  const ratios = { longShield: 1, shield: 1, wolf: 2, spear: 4, short: 2 };
  const count = Math.min(...Object.entries(ratios).map(([r, n]) => Math.floor(groups.get(r).length / n)));
  const melee = [...groups.values()].flat(), pitch = radius(melee) * 2 + 2.5;
  const teamPitch = 3 * pitch + 22, rankPitch = 3 * pitch + 20;
  const slots = { longShield: [[-.5, 0]], shield: [[.5, 0]],
    wolf: [[-.5, 1], [.5, 1]], spear: [[-1.5, 2], [-.5, 2], [.5, 2], [1.5, 2]],
    short: [[-.5, 3], [.5, 3]] };
  const columns = Math.min(count, Math.ceil(Math.sqrt(count * 1.5)));
  const rows = Math.ceil(count / columns);
  let cell = 0;
  for (let row = 0; row < rows; row++) {
    // Centre each echelon; seven teams must not become six abreast and one
    // isolated behind the far left wing.
    const across = Math.ceil((count - cell) / (rows - row));
    for (let col = 0; col < across; col++, cell++) {
      for (const [role, points] of Object.entries(slots)) points.forEach(([a, depth], i) =>
        put(s, groups.get(role)[cell * points.length + i], role,
          25 - row * rankPitch - depth * pitch,
          (col - (across - 1) / 2) * teamPitch + a * pitch, { cell }));
    }
  }
  const edge = Math.max(...s.members.map(m => Math.abs(m.a))) + radius(melee);
  const rear = Math.min(...s.members.map(m => m.f));
  // Rounding a preset leaves incomplete teams. Keep them together as a nearby
  // reserve instead of turning spare shields and spears into remote flank corps.
  const reserve = Object.entries(ratios).flatMap(([role, n]) => groups.get(role).slice(count * n));
  const files = Math.max(1, Math.min(Math.floor(edge * 2 / pitch), reserve.length));
  reserve.forEach((u, i) => {
    const inRank = Math.min(files, reserve.length - Math.floor(i / files) * files);
    put(s, u, 'auxiliary', rear - 20 - Math.floor(i / files) * pitch,
      (i % files - (inRank - 1) / 2) * pitch, { auxiliary: true, duty: 'ming-reserve' });
  });
  // Qi's firearm detachment opens ahead of the melee teams. Its two shoulders
  // leave the shield advance and withdrawal lanes clear, unlike distant rear wings.
  const screen = units.filter(u => ['ming_matchlock', 'ming_rattan_javelineer'].includes(u.type));
  const half = Math.ceil(screen.length / 2);
  for (const [sign, soldiers] of [[-1, screen.slice(0, half)], [1, screen.slice(half)]]) {
    const files = Math.ceil(Math.sqrt(soldiers.length * 2));
    soldiers.forEach((u, i) => put(s, u, 'auxiliary', 45 - Math.floor(i / files) * 12,
      sign * (edge + 18 + i % files * 12), { auxiliary: true, duty: 'ming-fire-screen' }));
  }
  s.formationGeometry = { kind: 'mandarin-duck-teams', count, columns, rows, pitch, teamPitch };
}
