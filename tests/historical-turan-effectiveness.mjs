import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

// Diagnostic, not a requirement to win. Record actual damage and charges by
// tactical stage so changing deployment cannot masquerade as a successful trap.
const hashes = () => Object.fromEntries(readdirSync('src').filter(f => /\.(js|json)$/.test(f))
  .map(f => [f, createHash('sha256').update(readFileSync(`src/${f}`)).digest('hex')]));
const before = hashes(), results = [];
for (const specialPlan of [true, false]) for (const seed of [42, 93]) for (const team of [0, 1]) {
  const ids = team ? ['timur', 'alp_arslan'] : ['alp_arslan', 'timur'];
  const rosters = ids.map(id => createCommanderArmy(id, 96));
  const b = new Battle({ seed, expandedMap: true, commanders: ids, historicalArmies: rosters });
  if (!specialPlan) b.tactics.updateSeljuk = () => {};
  const phases = {}, charges = {}, damageDealt = {}, damageReceived = {};
  const phase = () => b.tactics.teams[team]?.phase || 'ordinary';
  const start = b.startCharge.bind(b), hit = b.hit.bind(b);
  b.startCharge = (u, target) => {
    const result = start(u, target);
    if (u.team === team && u.charge) charges[phase()] = (charges[phase()] || 0) + 1;
    return result;
  };
  b.hit = (target, damage, source, ...args) => {
    const hp = target.hp, result = hit(target, damage, source, ...args);
    const lost = Math.max(0, hp - Math.max(0, target.hp));
    if (target.team === team) damageReceived[phase()] = (damageReceived[phase()] || 0) + lost;
    if (source?.team === team && target.team !== team) damageDealt[phase()] = (damageDealt[phase()] || 0) + lost;
    return result;
  };
  for (let frame = 0; frame < 180 * 30 && b.winner === null; frame++) {
    b.step(1 / 30);
    phases[phase()] ??= { time: +b.time.toFixed(2), survivors: b.units.filter(u => u.team === team && u.hp > 0 && !u.commanderId).length };
    if (frame % 30 === 0) assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)));
  }
  assert.equal(b.outcomeReason, 'elimination', `${specialPlan}/${seed}/${team}: no stalled combat`);
  const s = b.tactics.teams[team];
  results.push({ specialPlan, seed, team, rosters, winner: ids[b.winner], seconds: +b.time.toFixed(2),
    history: s?.history, closure: !!s?.closure, released: s?.chargeRelease?.distances.length || 0,
    phases, charges, damageDealt, damageReceived });
}
const after = hashes(), changedSources = Object.keys(before).filter(f => before[f] !== after[f]);
mkdirSync('artifacts/commander-balance', { recursive: true });
writeFileSync('artifacts/commander-balance/turan-effectiveness.json', JSON.stringify({ before, changedSources, results }, null, 2));
assert.deepEqual(changedSources, [], 'Source changed during diagnostic; rerun against a stable version');
console.log(JSON.stringify({ battles: results.length, changedSources, results: results.map(r => ({
  specialPlan: r.specialPlan, seed: r.seed, team: r.team, winner: r.winner,
  closure: r.closure, released: r.released, phases: Object.keys(r.phases), charges: r.charges,
})) }));
