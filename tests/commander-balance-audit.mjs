import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

// Diagnostic comparisons, not a requirement that different armies win equally.
const hashes = () => Object.fromEntries(readdirSync('src').filter(f => /\.(js|json)$/.test(f)).map(f =>
  [f, createHash('sha256').update(readFileSync(`src/${f}`)).digest('hex')]));
const before = hashes(), results = [];
const pairs = [['mehmed_ii', 'timur'], ['alp_arslan', 'timur'], ['mehmed_ii', 'alp_arslan']];
for (const mode of ['baseline', 'no-tactics', 'no-special-plan', 'no-elephants']) {
  for (const pair of pairs) for (const total of (mode === 'baseline' ? [96, 240] : [96])) {
    if (['no-special-plan', 'no-elephants'].includes(mode) && !pair.includes('timur')) continue;
    for (const seed of [42, 93]) for (const mirror of [false, true]) {
      const ids = mirror ? [...pair].reverse() : pair;
      const rosters = ids.map(id => createCommanderArmy(id, total));
      if (mode === 'no-elephants') for (const roster of rosters) if (roster.timur) {
        roster.timurid_armored_lancer = (roster.timurid_armored_lancer || 0) + roster.timur; delete roster.timur;
      }
      const b = new Battle({ seed, expandedMap: true, historicalArmies: rosters, commanders: ids, tacticalAI: mode !== 'no-tactics' });
      // Isolate the opponent's bespoke plan while preserving Timur's generic
      // deployment and the tested commander's normal formation fallback.
      if (mode === 'no-special-plan') {
        if (pair.includes('alp_arslan')) b.tactics.updateSeljuk = () => {};
        if (pair.includes('mehmed_ii')) b.tactics.civilizations.update = () => {};
      }
      const damage = {}, hits = {};
      const originalHit = b.hit.bind(b);
      b.hit = (target, ...args) => {
        const hp = target.hp, result = originalHit(target, ...args);
        const lost = Math.max(0, hp - Math.max(0, target.hp));
        if (lost) { const key = `${ids[target.team]}:${target.type}`; damage[key] = (damage[key] || 0) + lost; hits[key] = (hits[key] || 0) + 1; }
        return result;
      };
      for (let frame = 0; frame < 600 * 30 && b.winner === null; frame++) b.step(1 / 30);
      const states = b.tactics ? [...b.tactics.armies.values(), ...b.tactics.civilizations.armies.values()] : [];
      results.push({ mode, pair, total, seed, mirror, winner: ids[b.winner] || null, outcome: b.outcomeReason,
        seconds: +b.time.toFixed(2), rosters,
        survivors: ids.map((id, team) => ({ id, count: b.units.filter(u => u.team === team && u.hp > 0 && !u.removed && !u.commanderId).length })),
        tactics: states.map(s => ({ id: ids[s.team], history: s.history, reason: s.reason })), damageReceived: damage, hitsReceived: hits });
    }
  }
}
const after = hashes(), changedSources = Object.keys(before).filter(f => before[f] !== after[f]);
const summary = [];
for (const result of results) {
  let group = summary.find(g => g.mode === result.mode && g.pair.join() === result.pair.join() && g.total === result.total);
  if (!group) { group = { mode: result.mode, pair: result.pair, total: result.total, wins: {}, battles: 0, unresolved: 0 }; summary.push(group); }
  group.battles++;
  if (result.winner) group.wins[result.winner] = (group.wins[result.winner] || 0) + 1;
  if (result.outcome !== 'elimination') group.unresolved++;
}
mkdirSync('artifacts/commander-balance', { recursive: true });
writeFileSync(`artifacts/commander-balance/${process.env.REPORT || 'audit'}.json`, JSON.stringify({ before, changedSources, summary, results }, null, 2));
console.log(JSON.stringify({ battles: results.length, changedSources, summary }));
if (changedSources.length || results.some(r => r.outcome !== 'elimination')) process.exitCode = 1;
