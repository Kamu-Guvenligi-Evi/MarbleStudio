import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

// Real skirmishing, projectiles and tactical decisions, without frozen targets
// or forced damage. Pure horse-archer opposition need not fall for a retreat.
const results = [];
for (const team of [0, 1]) for (const scale of [1, 4]) for (const mixed of [false, true]) for (const seed of [42, 93]) {
  const armies = [null, null], commanders = [null, null];
  armies[team] = { seljuk_hassa: 16 * scale, seljuk_turkmen_archer: 8 * scale };
  armies[1 - team] = mixed ? { roman: 16 * scale, kipchak: 8 * scale } : { kipchak: 24 * scale };
  commanders[team] = 'alp_arslan';
  const b = new Battle({ seed, expandedMap: true, historicalArmies: armies, commanders });
  let lastHit = null, maxQuiet = 0;
  const hit = b.hit.bind(b);
  b.hit = (target, ...args) => {
    const hp = target.hp, result = hit(target, ...args);
    if (target.hp < hp) {
      if (lastHit !== null) maxQuiet = Math.max(maxQuiet, b.time - lastHit);
      lastHit = b.time;
    }
    return result;
  };
  for (let frame = 0; frame < 600 * 30 && b.winner === null; frame++) {
    b.step(1 / 30);
    if (frame % 30 === 0) assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)));
  }
  const label = `${team}/${scale}/${mixed}/${seed}`;
  assert.equal(b.outcomeReason, 'elimination', `${label}: no perpetual pursuit or artificial timeout`);
  assert.equal(b.tactics.teams[team].phase, 'done', `${label}: no indefinitely reserved tactical units`);
  results.push({ team, scale, mixed, seed, seconds: +b.time.toFixed(2), winner: b.winner,
    maxQuiet: +maxQuiet.toFixed(2), routes: b.stats.npcRoutes || 0 });
}
console.log('PASS 16 mirrored Turan battles against pure/mixed horse archers, natural elimination', JSON.stringify(results));
