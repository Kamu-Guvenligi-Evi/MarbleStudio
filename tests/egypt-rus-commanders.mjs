import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

const results = [];
for (const id of ['ramesses_ii', 'alexander_nevsky']) for (const team of [0, 1]) {
  const armies = [{ roman: 48 }, { roman: 48 }], commanders = [null, null];
  armies[team] = createCommanderArmy(id, 48); commanders[team] = id;
  const battle = new Battle({ seed: 42, expandedMap: true, historicalArmies: armies, commanders });
  assert.equal(battle.commanders[team].commanderId, id);
  for (let frame = 0; frame < 600 * 30 && battle.winner === null; frame++) battle.step(1 / 30);
  results.push({ id, team, seconds: +battle.time.toFixed(2), winner: battle.winner,
    outcome: battle.outcomeReason, valid: battle.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)) });
}
mkdirSync('artifacts/historical-commanders', { recursive: true });
writeFileSync('artifacts/historical-commanders/egypt-rus-battles.json', JSON.stringify(results, null, 2));
assert.ok(results.every(r => r.valid && r.outcome === 'elimination'), JSON.stringify(results));
console.log('PASS: Egypt/Rus commanders, four seeded battles on both teams finish by natural elimination; finite state.');
