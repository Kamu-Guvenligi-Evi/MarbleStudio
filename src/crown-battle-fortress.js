// Shared normalized geometry: the renderer and simulation use the same footprints.
export const FORTRESS_BRIDGES = [{ x: 470, y: 390, w: 60, h: 55 }, { x: 470, y: 565, w: 60, h: 55 }];
export const FORTRESS_SOLIDS = [
  { x: 350, y: 435, w: 40, h: 60, kind: 'house' },
  { x: 400, y: 540, w: 36, h: 56, kind: 'house' },
  { x: 560, y: 405, w: 30, h: 45, kind: 'house' },
  { x: 560, y: 555, w: 30, h: 45, kind: 'house' },
  { x: 610, y: 370, w: 137, h: 12, kind: 'wall' },
  { x: 610, y: 618, w: 137, h: 12, kind: 'wall' },
  { x: 735, y: 382, w: 12, h: 236, kind: 'wall' },
  { x: 610, y: 382, w: 12, h: 88, kind: 'wall' },
  { x: 610, y: 530, w: 12, h: 88, kind: 'wall' },
  { x: 680, y: 460, w: 28, h: 50, kind: 'keep' },
];
export const FORTRESS_WATER = [
  { x: 480, y: 0, w: 40, h: 390, kind: 'water' },
  { x: 480, y: 445, w: 40, h: 120, kind: 'water' },
  { x: 480, y: 620, w: 40, h: 380, kind: 'water' },
];
export function fortressGeometry(bounds) {
  const sx = (bounds.right - bounds.left) / 1000, sy = (bounds.bottom - bounds.top) / 1000;
  return [...FORTRESS_WATER, ...FORTRESS_SOLIDS].map(r => ({ ...r,
    x: bounds.left + r.x * sx, y: bounds.top + r.y * sy, w: r.w * sx, h: r.h * sy }));
}

export function drawFortress(g) {
  g.fillStyle = '#948e6d'; g.fillRect(622, 382, 113, 236);
  // Approaches lead into the west gate and onto both usable bridge decks.
  g.strokeStyle = '#b6a17a'; g.lineWidth = 13; g.lineCap = 'round';
  for (const b of FORTRESS_BRIDGES) {
    const y = b.y + b.h / 2;
    g.beginPath(); g.moveTo(270, y); g.lineTo(455, y); g.lineTo(545, y); g.lineTo(600, 500); g.lineTo(667, 500); g.stroke();
  }
  g.fillStyle = '#758372'; g.fillRect(474, 0, 52, 1000);
  g.fillStyle = '#346b7c'; g.fillRect(480, 0, 40, 1000);
  g.fillStyle = '#498694'; g.fillRect(490, 0, 18, 1000);
  g.strokeStyle = '#a2ced050'; g.lineWidth = 1.4;
  for (let y = 5; y < 1000; y += 19) { g.beginPath(); g.moveTo(487, y); g.lineTo(502, y + 6); g.stroke(); }
  for (const b of FORTRESS_BRIDGES) {
    g.fillStyle = '#222d2b66'; g.fillRect(b.x + 3, b.y + 5, b.w, b.h);
    g.fillStyle = '#b3a48b'; g.fillRect(b.x, b.y, b.w, b.h);
    g.strokeStyle = '#776d5c'; g.lineWidth = 1;
    for (let x = b.x + 5; x < b.x + b.w; x += 8) { g.beginPath(); g.moveTo(x, b.y); g.lineTo(x, b.y + b.h); g.stroke(); }
    g.fillStyle = '#d4c9ad'; g.fillRect(b.x, b.y, b.w, 3); g.fillRect(b.x, b.y + b.h - 3, b.w, 3);
  }
  for (const r of FORTRESS_SOLIDS) {
    g.fillStyle = '#202b2b55'; g.fillRect(r.x + 5, r.y + 7, r.w, r.h);
    g.fillStyle = r.kind === 'house' ? '#76503a' : '#6b7068'; g.fillRect(r.x, r.y, r.w, r.h);
    if (r.kind === 'house') {
      g.fillStyle = '#b98455'; g.fillRect(r.x + 2, r.y + 2, r.w / 2 - 2, r.h - 4);
      g.fillStyle = '#925d40'; g.fillRect(r.x + r.w / 2, r.y + 2, r.w / 2 - 2, r.h - 4);
      g.fillStyle = '#dbc89a'; g.fillRect(r.x + r.w / 2 - 1, r.y, 2, r.h);
      g.fillStyle = '#3a3430'; g.fillRect(r.x + 5, r.y + 6, 5, 6);
    } else {
      g.fillStyle = '#b2b09a'; g.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
      g.fillStyle = '#d0cdb3';
      if (r.w > r.h) for (let x = r.x; x < r.x + r.w - 4; x += 10) g.fillRect(x, r.y, 5, 5);
      else for (let y = r.y; y < r.y + r.h - 4; y += 10) g.fillRect(r.x, y, 5, 5);
    }
  }
  // Towers stay within wall footprints, so every solid pixel has a matching obstacle.
  for (const y of [370, 618]) for (const x of [610, 735]) {
    g.fillStyle = '#d6cfb2'; g.fillRect(x, y, 12, 12);
    g.fillStyle = '#5a6057'; g.fillRect(x + 3, y + 3, 6, 6);
  }
  g.fillStyle = '#6c2b30'; g.fillRect(742, 388, 3, 23); g.fillRect(731, 388, 12, 9);
  g.font = 'bold 11px sans-serif'; g.textAlign = 'center'; g.fillStyle = '#f4e7bf';
  g.fillText('KALE', 680, 360); g.fillText('KAPI', 610, 510);
}
