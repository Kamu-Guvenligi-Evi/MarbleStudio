export const FORMATIONS = {
  line: 'Hat', block: 'Sık düzen', wedge: 'Kama', loose: 'Seyrek düzen',
  column: 'Yürüyüş kolu', crescent: 'Hilal', hollowSquare: 'İçi boş kare',
  circle: 'Çember', echelonLeft: 'Sol kademeli hat', echelonRight: 'Sağ kademeli hat',
};

export const FORMATION_DESCRIPTIONS = {
  line: 'Geniş cephe, az derinlik. Birlikleri yan yana dizer.',
  block: 'Dar cephede çok sıra. Birlikleri toplu tutar.',
  wedge: 'Sivri öncü ve geriye doğru genişleyen saflar.',
  loose: 'Askerler arasında daha geniş boşluk bırakır.',
  column: 'Dar ve derin yürüyüş düzeni. Uzun kollar için boş alan gerekir.',
  crescent: 'Merkez geride, iki kanat önde. Kuşatma hareketini ayrıca emret.',
  hollowSquare: 'Askerler karenin çevresine dizilir; merkez boş kalır.',
  circle: 'Askerler bir çemberin çevresine dizilir; merkez boş kalır.',
  echelonLeft: 'Ön cepheye göre sol kanat önde, sağ kanat geride.',
  echelonRight: 'Ön cepheye göre sağ kanat önde, sol kanat geride.',
};

// Local X points forward; local Y runs across the front. Keep spacing at edges
// by shifting the whole group instead of clamping individual soldiers.
export function formationLayout(units, x, y, { kind = 'block', direction = 0, scale = 1 } = {}, bounds, radiusOf) {
  const fail = message => ({ valid: false, message, slots: [] });
  if (!units.length) return fail('Önce birlik seç.');
  if (!Object.hasOwn(FORMATIONS, kind) || ![0, 90, 180, 270].includes(direction) || !Number.isFinite(x) || !Number.isFinite(y)) return fail('Geçersiz formasyon hedefi.');
  if (!Number.isFinite(scale) || scale < .75 || scale > 2.5) return fail('Formasyon boyutu %75 ile %250 arasında olmalı.');
  if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) return fail('Meydanın içinde bir yer seç.');
  const radius = Math.max(...units.map(radiusOf));
  const baseGap = (radius * 2 + 5) * (kind === 'loose' ? 1.65 : 1);
  // Shrinking may close spare space, but never overlap soldier bodies.
  const gap = Math.max(radius * 2 + 1, baseGap * scale);
  const area = { left: bounds.left + 45, right: bounds.right - 45, top: bounds.top + 115, bottom: bounds.bottom - 95 };
  const angle = direction * Math.PI / 180, dx = Math.round(Math.cos(angle)), dy = Math.round(Math.sin(angle));
  const across = dx ? area.bottom - area.top : area.right - area.left;
  const wide = ['line', 'crescent', 'echelonLeft', 'echelonRight'].includes(kind);
  const preferredColumns = kind === 'column' ? Math.min(3, Math.ceil(units.length / 8)) : Math.ceil(Math.sqrt(units.length) * (wide ? 2.5 : 1));
  // Keep rank membership stable as size changes; reject an oversized layout below.
  const columns = Math.max(1, Math.min(Math.floor(across / baseGap) + 1, preferredColumns));
  const local = [];
  const add = (forward, side) => local.push({ unit: units[local.length], x: forward * dx - side * dy, y: forward * dy + side * dx });
  if (kind === 'circle') {
    // Chord length, rather than arc length, keeps adjacent bodies apart.
    const ringRadius = units.length === 1 ? 0 : gap / (2 * Math.sin(Math.PI / units.length));
    for (let i = 0; i < units.length; i++) {
      const a = 2 * Math.PI * i / units.length;
      add(ringRadius * Math.cos(a), ringRadius * Math.sin(a));
    }
  } else if (kind === 'hollowSquare') {
    const edge = Math.max(1, Math.ceil(units.length / 4));
    for (let i = 0; i < units.length; i++) {
      const p = Math.floor(i * edge * 4 / units.length), side = Math.floor(p / edge), t = p % edge;
      const [forward, across] = [[edge, t], [edge - t, edge], [0, edge - t], [t, 0]][side];
      add(forward * gap, across * gap);
    }
  } else for (let row = 0, made = 0; made < units.length; row++) {
    const count = Math.min(kind === 'wedge' ? row * 2 + 1 : columns, units.length - made);
    for (let col = 0; col < count; col++, made++) {
      // New curved/stepped ranks share column positions, including partial rows.
      // This preserves clearance between rows even when the front is slanted.
      const shaped = ['crescent', 'echelonLeft', 'echelonRight'].includes(kind);
      const side = (col - ((shaped ? columns : count) - 1) / 2) * gap;
      let forward = -row * (kind === 'line' ? baseGap : gap);
      if (kind === 'crescent') forward += side * side / Math.max(gap, (columns - 1) * gap / 2) * .65;
      if (kind === 'echelonLeft') forward -= side * .65;
      if (kind === 'echelonRight') forward += side * .65;
      add(forward, side);
    }
  }
  const xs = local.map(p => p.x), ys = local.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  if (maxX - minX > area.right - area.left || maxY - minY > area.bottom - area.top) return fail('Bu formasyon meydana sığmıyor. Boyutu küçült, daha az asker seç veya sık düzen kullan.');
  const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
  x = Math.max(area.left + (maxX - minX) / 2, Math.min(area.right - (maxX - minX) / 2, x));
  y = Math.max(area.top + (maxY - minY) / 2, Math.min(area.bottom - (maxY - minY) / 2, y));
  return { valid: true, message: '', x, y, dx, dy, kind, slots: local.map(p => ({ id: p.unit.id, x: Math.max(area.left, Math.min(area.right, x + p.x - centerX)), y: Math.max(area.top, Math.min(area.bottom, y + p.y - centerY)), radius: radiusOf(p.unit) })) };
}
