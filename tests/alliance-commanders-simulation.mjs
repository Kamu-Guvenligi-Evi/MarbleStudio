import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

// Full battles, rather than treating the engine's 180-second decision as elimination.
const sourceHash = () => Object.fromEntries(readdirSync('src').filter(f => /^(historical-|crown-battle).*\.(js|json)$/.test(f)).map(f =>
  [f, createHash('sha256').update(readFileSync(`src/${f}`)).digest('hex')]));
// Keep replays identical when another ready army is added to the catalogue.
const before = sourceHash(), results = [], ids = ['mehmed_ii', 'georg_frundsberg', 'harold_godwinson',
  'charles_vii', 'francesco_sforza', 'leonidas', 'darius_i', 'takeda_shingen', 'qin_shi_huang', 'qi_jiguang', 'alp_arslan'];
const scenarios = [
  { name: 'mixed-2v2', sides: [2, 2], size: 96 },
  { name: 'same-leader-2v2', sides: [2, 2], size: 96, same: true },
  { name: 'asymmetric-1v2', sides: [1, 2], size: 192 },
  { name: 'asymmetric-3v1', sides: [3, 1], size: 192 },
  { name: 'maximum-4v4', sides: [4, 4], size: 96 },
  { name: 'leader-loss-2v2', sides: [2, 2], size: 96, event: 'leader' },
  { name: 'ally-loss-2v2', sides: [2, 2], size: 96, event: 'army' },
  { name: 'generic-and-special', sides: [2, 2], size: 96, generic: true },
  { name: 'large-4v4', sides: [4, 4], size: 240 },
];
const alive = u => u.hp > 0 && !u.removed;
const combatants = b => b.units.filter(u => alive(u) && !u.commanderId);
const counts = b => [0, 1].map(t => combatants(b).filter(u => u.team === t).length);
const quantile = (a, q) => a[Math.min(a.length - 1, Math.floor(a.length * q))] || 0;
function overlaps(units) {
  const grid = new Map(); let pairs = 0; const affected = new Set();
  for (const u of units) {
    const x = Math.floor(u.x / 40), y = Math.floor(u.y / 40);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      for (const v of grid.get(`${x + dx},${y + dy}`) || []) {
        const gap = (u.combatProfile.radius + v.combatProfile.radius) * .65;
        if ((u.x - v.x) ** 2 + (u.y - v.y) ** 2 < gap ** 2) { pairs++; affected.add(u.id); affected.add(v.id); }
      }
    }
    const key = `${x},${y}`; if (!grid.has(key)) grid.set(key, []); grid.get(key).push(u);
  }
  return { pairs, affected: affected.size, fraction: affected.size / Math.max(1, units.length) };
}
for (const [index, scenario] of scenarios.entries()) for (const mirror of [false, true]) {
  if (process.env.SCENARIO && scenario.name !== process.env.SCENARIO) continue;
  const armyConfigs = [];
  for (let side = 0; side < 2; side++) for (let a = 0; a < scenario.sides[side]; a++) {
    const commanderId = scenario.same ? 'alp_arslan' : ids[(index * 2 + side * 3 + a) % ids.length];
    const n = scenario.name.startsWith('asymmetric') ? scenario.size / scenario.sides[side] : scenario.size;
    const generic = scenario.generic && a === 0;
    armyConfigs.push({ id: `side-${side}-army-${a}`, name: `Side ${side} Army ${a}`, team: mirror ? 1 - side : side,
      commanderId: generic ? 'julius_caesar' : commanderId,
      roster: generic ? { roman: n / 2, hussar: n / 4, achaemenid_archer: n / 4 } : createCommanderArmy(commanderId, n) });
  }
  const b = new Battle({ seed: 1427, armyConfigs, expandedMap: true });
  const result = { scenario: scenario.name, mirror, seed: 1427, armyConfigs, initial: counts(b), issues: [], timeline: [], initialOverlap: overlaps(b.units) };
  const seen = new Set(), timings = []; let frame = 0, injected = false, previousHp = null, quiet = 0, longestQuiet = 0, worstOverlap = { fraction: 0 }, maxEffects = 0, maxProjectiles = 0;
  const issue = (kind, detail) => { if (!seen.has(kind)) { seen.add(kind); result.issues.push({ kind, time: +b.time.toFixed(2), detail }); } };
  if (result.initialOverlap.pairs) issue('initial-body-overlap', result.initialOverlap);
  while (b.winner === null && frame < 18000) {
    if (scenario.event && !injected && b.time >= 8) {
      const id = armyConfigs[0].id;
      for (const u of b.units) if (u.armyId === id && (scenario.event === 'leader' ? u.commanderId : !u.commanderId)) u.hp = 0;
      injected = true; result.injectedAt = b.time;
      b.checkOutcome();
      if (counts(b).every(n => n > 0) && b.winner !== null) issue('premature-alliance-defeat', counts(b));
    }
    const start = performance.now(); b.step(1 / 30); timings.push(performance.now() - start); frame++;
    maxEffects = Math.max(maxEffects, b.effects.length); maxProjectiles = Math.max(maxProjectiles, b.projectiles.length);
    for (const u of b.units) {
      if (![u.x, u.y, u.hp].every(Number.isFinite)) issue('non-finite-unit', u.id);
      if (alive(u) && u.target?.team === u.team) issue('friendly-target', u.id);
      if (alive(u) && u.commanderId && (u.target || u.attack !== 0)) issue('commander-attacking', u.id);
    }
    if (frame % 30 === 0) {
      for (const subsystem of [b.tactics, b.tactics?.civilizations, b.tactics?.formations]) {
        for (const [id, state] of subsystem?.armies || []) {
          if (state.commander !== b.armyCommanders.get(id)) issue('wrong-commander', id);
          if (state.members?.some(m => m.unit.armyId !== id)) issue('borrowed-allied-troops', id);
          if (scenario.event === 'leader' && injected && b.time > result.injectedAt + 1 && id === armyConfigs[0].id && state.phase !== 'done') issue('dead-commander-active-plan', { id, phase: state.phase });
        }
      }
      const units = combatants(b), hp = units.reduce((sum, u) => sum + u.hp, 0);
      quiet = previousHp !== null && Math.abs(hp - previousHp) < .001 ? quiet + 1 : 0;
      longestQuiet = Math.max(longestQuiet, quiet); previousHp = hp;
      if (quiet === 30) result.quietSnapshot = units.map(u => ({ id: u.id, type: u.type, team: u.team, armyId: u.armyId,
        x: u.x, y: u.y, hp: u.hp, speed: u.speed, order: u.order, target: u.target?.id,
        targetType: u.target?.type, targetCommander: u.target?.commanderId,
        targetDistance: u.target ? Math.hypot(u.x - u.target.x, u.y - u.target.y) : null }));
      const overlap = overlaps(units);
      if (overlap.fraction > worstOverlap.fraction) worstOverlap = { ...overlap, time: +b.time.toFixed(2), living: units.length };
      if (frame % 150 === 0) result.timeline.push({ seconds: +b.time.toFixed(2), counts: counts(b), hp: Math.round(hp), overlap: overlap.affected });
    }
  }
  const survivors = counts(b), expected = survivors[0] === survivors[1] ? 'draw' : survivors[0] > survivors[1] ? 0 : 1;
  if (b.winner === null) issue('unfinished', survivors);
  else if (b.winner !== expected) issue('wrong-outcome', { winner: b.winner, expected });
  if (survivors.every(n => n > 0) && b.outcomeReason !== 'time-limit') issue('early-outcome', survivors);
  if (longestQuiet >= 30) issue('long-no-damage-period', longestQuiet);
  timings.sort((a, b) => a - b);
  Object.assign(result, { seconds: +b.time.toFixed(2), winner: b.winner, survivors,
    endReason: b.outcomeReason || 'unfinished',
    longestQuietSeconds: longestQuiet, worstOverlap, maxEffects, maxProjectiles,
    stepMs: { p50: quantile(timings, .5), p95: quantile(timings, .95), p99: quantile(timings, .99), max: timings.at(-1) } });
  results.push(result);
  console.log(JSON.stringify({ scenario: result.scenario, mirror, seconds: result.seconds, end: result.endReason, survivors, issues: result.issues, overlap: worstOverlap, p95: +result.stepMs.p95.toFixed(2) }));
}
const after = sourceHash(), changedSources = Object.keys(before).filter(k => before[k] !== after[k]);
const report = { engineOnly: true, timestep: 1 / 30, before, after, changedSources, results };
mkdirSync('artifacts/alliance-simulation', { recursive: true });
writeFileSync(`artifacts/alliance-simulation/${process.env.REPORT || process.env.SCENARIO || 'battles'}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ battles: results.length, elimination: results.filter(r => r.endReason === 'elimination').length, timeLimit: results.filter(r => r.endReason === 'time-limit').length, issues: results.reduce((n, r) => n + r.issues.length, 0), changedSources }));
if (changedSources.length || results.some(r => r.issues.some(i => i.kind !== 'long-no-damage-period'))) process.exitCode = 1;
