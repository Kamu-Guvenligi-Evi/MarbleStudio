import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';

// Frozen equipment mixes: concurrent preset/catalog work must not change this
// comparison. This is an exposure/decision test, not a requirement to win.
const own = { seljuk_hassa: 48, seljuk_turkmen_archer: 32, seljuk_ghulam_archer: 16 };
const enemy = { kipchak: 32, mongol: 24, kipchak_lancer: 20, kipchak_masked_swordsman: 16, timur: 4 };
const results = [];
for (const expandedDeployment of [false, true]) for (const seed of [42, 93])
  for (const team of [0, 1]) for (const specialPlan of [true, false]) {
    const armies = [null, null], commanders = [null, null];
    armies[team] = own; armies[1 - team] = enemy;
    commanders[team] = 'alp_arslan'; commanders[1 - team] = 'timur';
    const b = new Battle({ seed, expandedMap: true, ...(expandedDeployment
      ? { armyConfigs: armies.map((roster, t) => ({ id: `army${t}`, team: t, roster, commanderId: commanders[t] })) }
      : { historicalArmies: armies, commanders }) });
    if (!specialPlan) b.tactics.updateSeljuk = () => {};
    let health, riskSince, maxRiskTime = 0, releasedHealth;
    for (let frame = 0; frame < 240 * 30 && b.winner === null; frame++) {
      b.step(1 / 30);
      const s = b.tactics.teams[team];
      if (!s) continue;
      const remaining = s.members.reduce((sum, m) => sum + Math.max(0, m.unit.hp), 0);
      health ??= remaining;
      if (s.phase === 'done') releasedHealth ??= remaining / health;
      if (['assemble', 'regroup'].includes(s.phase) && remaining <= health * .9) {
        riskSince ??= b.time;
        maxRiskTime = Math.max(maxRiskTime, b.time - riskSince);
      }
    }
    const s = b.tactics.teams[team];
    const r = { expandedDeployment, seed, team, specialPlan, winner: commanders[b.winner],
      seconds: b.time, outcome: b.outcomeReason, maxRiskTime, releasedHealth, history: s?.history };
    results.push(r);
    console.log(JSON.stringify(r));
  }
mkdirSync('artifacts/commander-balance', { recursive: true });
writeFileSync(`artifacts/commander-balance/turan-opportunity-${process.env.REPORT || 'current'}.json`, JSON.stringify(results, null, 2));
if (!process.env.BASELINE) for (const r of results) {
  assert.equal(r.outcome, 'elimination', 'Combat ends naturally after the plan releases control');
  assert.ok(r.maxRiskTime <= .51, 'A costly assembly/regroup releases control on the next army decision');
}
console.log('PASS 16 fixed-roster comparisons: two seeds, both teams, compact/wide deployment, plan on/off');
