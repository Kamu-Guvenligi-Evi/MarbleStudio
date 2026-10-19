import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

const results = [];
for (const size of [48, 96, 240]) for (const team of [0, 1]) {
  const roster = createCommanderArmy('mehmed_ii', size);
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
    { id: 'own', team, commanderId: 'mehmed_ii', roster },
    { id: 'enemy', team: 1 - team, roster: { roman: size } },
  ] });
  const s = b.openingDeployments.get('own')?.state;
  assert.equal(s?.formationGeometry?.kind, 'ottoman-centre-wings');
  const ms = s.members, bows = ms.filter(m => m.role === 'bow');
  const screen = ms.filter(m => m.duty === 'akinci-screen');
  const reserve = ms.filter(m => m.duty === 'centre-reserve');
  const wings = ms.filter(m => m.duty === 'wing');
  const foot = ms.filter(m => m.duty?.endsWith('-center'));
  assert.equal(new Set(ms.map(m => m.unit.id)).size, ms.length);
  assert.equal(ms.length, Object.values(roster).reduce((sum, n) => sum + n, 0));
  assert.ok(screen.length && reserve.length && wings.length && foot.length);
  assert.ok(screen.every(m => m.unit.type.startsWith('ottoman_akinci') && m.auxiliary));
  assert.ok(ms.filter(m => m.unit.type.startsWith('ottoman_akinci')).every(m => m.duty === 'akinci-screen'));
  assert.ok(reserve.every(m => m.unit.type === 'ottoman_sipah'));
  assert.ok(wings.every(m => ['ottoman_timariot', 'ottoman_cebelu', 'mehmed_serbian_auxiliary_cavalry'].includes(m.unit.type)));
  assert.ok(Math.min(...foot.map(m => m.f - m.radius)) > Math.max(...bows.map(m => m.f + m.radius)));
  assert.ok(Math.max(...reserve.map(m => m.f)) < Math.min(...bows.map(m => m.f)));
  assert.ok(Math.min(...screen.map(m => m.f)) > Math.max(...foot.map(m => m.f)));
  const width = Math.max(...bows.map(m => m.a)) - Math.min(...bows.map(m => m.a));
  const depth = Math.max(...bows.map(m => m.f)) - Math.min(...bows.map(m => m.f));
  assert.ok(width > depth * 2, 'missile centre scales as a broad line');
  let minimumGap = Infinity;
  for (let i = 0; i < ms.length; i++) for (let j = i + 1; j < ms.length; j++) {
    const a = ms[i].unit, c = ms[j].unit;
    minimumGap = Math.min(minimumGap, Math.hypot(a.x - c.x, a.y - c.y) - a.combatProfile.radius - c.combatProfile.radius);
  }
  assert.ok(minimumGap >= 1, `${size}/${team}: body clearance ${minimumGap}`);
  b.step(1 / 30);
  assert.equal(b.tactics.civilizations.armies.get('own'), s);
  while (b.time < 50 && b.winner === null) b.step(1 / 30);
  assert.ok(screen.every(m => !m.maneuver), 'light cavalry never inherits heavy cavalry encirclement orders');
  results.push({ size, team, minimumGap, width, depth, screen: screen.length, reserve: reserve.length, wings: wings.length });
}
mkdirSync('artifacts/tactical-responsiveness', { recursive: true });
writeFileSync('artifacts/tactical-responsiveness/ottoman-openings.json', JSON.stringify(results));
console.log(`PASS ${results.length} Ottoman openings and live role checks, both sides at 48/96/240 capacity.`);
