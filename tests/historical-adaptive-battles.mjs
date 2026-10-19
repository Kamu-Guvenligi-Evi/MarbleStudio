import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';

const scenarios = [
  ['brace', { egypt_new_spearman: 24, roman: 16, achaemenid_archer: 8 }, { seljuk_hassa: 32 }],
  ['close', { roman: 32, seljuk_hassa: 16 }, { achaemenid_archer: 32 }],
  ['flank', { roman: 24, seljuk_hassa: 24 }, { landsknecht: 32 }],
  ['skirmish', { seljuk_turkmen_archer: 32, seljuk_hassa: 8 }, { roman: 32 }],
  ['balanced', { roman: 32, achaemenid_archer: 8 }, { roman: 32 }],
];
const results = [];
for (const [kind, roster, enemy] of scenarios) for (const team of [0, 1]) {
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
    { id: 'own', team, roster, commanderId: 'julius_caesar' },
    { id: 'enemy', team: 1 - team, roster: enemy },
  ] });
  b.step(1 / 30);
  assert.equal(b.tactics.strategy.plans.get('own')?.kind, kind);
  const s = b.tactics.formations.armies.get('own');
  assert.ok(s);
  const positions = new Map(s.members.map(m => [m.unit.id, { x: m.unit.x, y: m.unit.y }]));
  let moved = 0;
  while (b.time < 600 && b.winner === null) {
    b.step(1 / 30);
    if (b.time < 15) moved = Math.max(moved, s.members.filter(m => {
      const p = positions.get(m.unit.id);
      return Math.hypot(m.unit.x - p.x, m.unit.y - p.y) > 10;
    }).length);
  }
  results.push({ kind, team, applied: s.strategy.kind, seconds: +b.time.toFixed(2),
    moved, count: s.members.length, outcome: b.outcomeReason,
    finite: b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)) });
}
mkdirSync('artifacts/new-unit-formations', { recursive: true });
writeFileSync('artifacts/new-unit-formations/adaptive-battles.json', JSON.stringify(results, null, 2));
assert.deepEqual(results.filter(r => r.outcome !== 'elimination' || !r.finite || r.moved < r.count * .5), []);
console.log(`PASS ${results.length} adaptive battles: physical movement and natural elimination, both alliances.`);
