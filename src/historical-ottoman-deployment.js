// Fifteenth-century centre/wing roles, scaled to the game's individual bodies.
// These are not a universal Ottoman crescent or a scripted feigned retreat.
export function ottomanDeployment(s, groups) {
  const bows = groups.get('bow') || [], horses = groups.get('horse') || [];
  const put = (list, role, duty, front, side, columns, pitch, extra = {}) => {
    columns = Math.max(1, Math.min(columns, list.length));
    list.forEach((unit, i) => {
      const row = Math.floor(i / columns), count = Math.min(columns, list.length - row * columns);
      const a = side + (i % columns - (count - 1) / 2) * pitch;
      s.members.push({ unit, role, duty, f: front - row * pitch, a,
        visualRole: side < 0 ? 'left' : side > 0 ? 'right' : 'bait', ...extra });
    });
  };
  const files = Math.ceil(Math.sqrt(bows.length * 4));
  put(bows, 'bow', 'centre', 15, 0, files, 12.5);
  const centreEdge = (Math.min(files, bows.length) - 1) * 12.5 / 2;
  const light = horses.filter(u => u.type.startsWith('ottoman_akinci'));
  const reserve = horses.filter(u => u.type === 'ottoman_sipah');
  const line = horses.filter(u => !light.includes(u) && !reserve.includes(u));
  const horsePitch = Math.max(14, ...horses.map(u => u.combatProfile.radius * 2 + 3));
  const half = Math.ceil(line.length / 2), wingFiles = Math.ceil(Math.sqrt(half * 2));
  const wingCenter = centreEdge + 35 + (wingFiles - 1) * horsePitch / 2;
  for (const [sign, soldiers] of [[-1, line.slice(0, half)], [1, line.slice(half)]]) {
    put(soldiers, sign < 0 ? 'left' : 'right', 'wing', -5, sign * wingCenter,
      wingFiles, horsePitch, { wingCenter });
  }
  // The household cavalry begins close enough to support either wing/centre.
  const rear = Math.min(15, ...s.members.filter(m => m.role === 'bow').map(m => m.f));
  put(reserve, 'reserve', 'centre-reserve', rear - 32, 0,
    Math.ceil(Math.sqrt(reserve.length * 3)), horsePitch);
  // Akincis screen the approaches; their local mounted combat policy controls
  // range and evasion, rather than the sipahis' enclosing manoeuvre.
  const split = Math.ceil(light.length / 2), lightFiles = Math.ceil(Math.sqrt(split * 2));
  const lightRows = Math.ceil(split / Math.max(1, lightFiles));
  for (const [sign, soldiers] of [[-1, light.slice(0, split)], [1, light.slice(split)]]) {
    put(soldiers, 'screen', 'akinci-screen', 55 + (lightRows - 1) * horsePitch,
      sign * wingCenter, lightFiles, horsePitch, { auxiliary: true });
  }
  s.formationGeometry = { kind: 'ottoman-centre-wings', files, wingFiles, wingCenter };
}
