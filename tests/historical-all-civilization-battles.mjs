import assert from 'node:assert/strict';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, relative } from 'node:path';
import { Battle } from '../src/crown-battle.js';
import { CIVILIZATIONS } from '../src/historical-combat.js';
import commanders from '../src/historical-commanders.json' with { type: 'json' };
import { createCommanderArmy, ARMY_PRESETS, presetMinimum } from '../src/historical-army-presets.js';
import { unitCapacity } from '../src/historical-army-capacity.js';

const capacity = Number(process.env.BATTLE_CAPACITY || 48);
const rosters = CIVILIZATIONS.map(civ => {
  const commander = commanders.find(c => c.civilizations.includes(civ.name) && ARMY_PRESETS[c.id]);
  if (commander) return { name: civ.name, commanderId: commander.id,
    roster: createCommanderArmy(commander.id, Math.max(capacity, presetMinimum(ARMY_PRESETS[commander.id]))) };
  const roster = {}; let remaining = capacity, i = 0;
  const ids = civ.ids.filter(id => unitCapacity(id) <= capacity);
  while (remaining > 0 && ids.some(id => unitCapacity(id) <= remaining)) {
    const id = ids[i++ % ids.length], cost = unitCapacity(id);
    if (cost <= remaining) { roster[id] = (roster[id] || 0) + 1; remaining -= cost; }
  }
  return { name: civ.name, roster };
});

function run(i, j) {
  const seed = 42;
  const b = new Battle({ seed, expandedMap: true, armyConfigs: [
    { ...rosters[i], id: 'a', team: 0 }, { ...rosters[j], id: 'b', team: 1 },
  ] });
  const attacked = [new Set(), new Set()], hit = [new Set(), new Set()];
  const directors = [b.tactics, b.tactics.civilizations, b.tactics.formations];
  const ordered = u => directors.some(d => d.intents.has(u.id));
  const firstHit = [null, null]; let lastHit = 0, maxQuiet = 0, firstContact = null;
  b.onCombatEvent = e => {
    if (e.kind === 'attack' || (e.kind === 'hit' && e.unit)) attacked[e.unit.team].add(e.unit.id);
    if (e.kind === 'hit') {
      firstContact ??= b.time;
      firstHit[e.target.team] ??= b.time;
      hit[e.target.team].add(e.target.id); lastHit = b.time;
    }
  };
  let idleLoss = [null, null], idleEvidence = [null, null], nextSample = 1;
  const stalledSince = [null, null], maxFormationStall = [0, 0];
  const initial = [0, 1].map(t => b.units.filter(u => u.team === t && !u.commanderId));
  while (b.time < 600 && b.winner === null) {
    b.step(1 / 30);
    if (b.time < nextSample) continue;
    nextSample++;
    if (firstContact !== null) maxQuiet = Math.max(maxQuiet, b.time - lastHit);
    for (const team of [0, 1]) {
      const units = initial[team], living = units.filter(u => u.hp > 0);
      const idle = living.filter(u => !attacked[team].has(u.id));
      const orderedIdle = idle.filter(ordered);
      const stalled = units.length - living.length >= units.length * .25 &&
        orderedIdle.length > units.length * .5 && orderedIdle.filter(u => u.speed > 2).length < orderedIdle.length * .5;
      if (stalled) {
        stalledSince[team] ??= b.time;
        maxFormationStall[team] = Math.max(maxFormationStall[team], b.time - stalledSince[team]);
      } else stalledSince[team] = null;
      // Flag an intact but idle majority while a quarter of its army is dead.
      // Taking hits alone does not count as contributing to the battle.
      if (units.length - living.length >= units.length * .25 &&
        living.filter(u => !attacked[team].has(u.id)).length > units.length * .5 && idleLoss[team] === null) {
        idleLoss[team] = +b.time.toFixed(2);
        idleEvidence[team]={ count:idle.length,
          formationOrders:idle.filter(ordered).length,
          moving:idle.filter(u=>u.speed>2).length,
          averageTargetDistance:Math.round(idle.reduce((sum,u)=>sum+(u.target?Math.hypot(u.x-u.target.x,u.y-u.target.y):0),0)/idle.length) };
      }
    }
  }
  return { i, j, seconds: +b.time.toFixed(2), outcome: b.outcomeReason, winner: b.winner,
    finite: b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)),
    firstContact, firstHit, maxQuiet: +maxQuiet.toFixed(2), idleLoss, idleEvidence,
    maxFormationStall: maxFormationStall.map(n => +n.toFixed(2)),
    attacks: attacked.map(s => s.size), hit: hit.map(s => s.size), counts: initial.map(a => a.length),
    support: [...b.tactics.civilizations.armies.values()].filter(s => s.supportAt !== undefined)
      .map(s => ({ team: s.team, time: s.supportAt, loss: s.supportLoss })),
    phases: directors.flatMap(d => [...d.armies.values()].map(s => ({team:s.team,phase:s.phase,history:s.history}))),
  };
}

if (!isMainThread) {
  parentPort.on('message', pairs => {
    if (pairs === null) { parentPort.close(); return; }
    parentPort.postMessage(pairs.map(([i, j]) => run(i, j)));
  });
} else {
  // Another task may edit renderers in the shared workspace. Track every
  // transitive simulation/roster import, without invalidating on unrelated UI.
  const sourceManifest=()=>{
    const files=new Map();
    const visit=file=>{
      file=resolve(file);if(files.has(file))return;
      const source=readFileSync(file,'utf8');files.set(file,createHash('sha256').update(source).digest('hex'));
      if(file.endsWith('.js'))for(const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))
        visit(resolve(dirname(file),match[1]));
    };
    for(const entry of ['crown-battle.js','historical-army-presets.js','historical-combat.js','historical-commanders.json','historical-army-capacity.js'])visit('src/'+entry);
    return Object.fromEntries([...files].map(([f,h])=>[relative(process.cwd(),f),h]).sort(([a],[b])=>a.localeCompare(b)));
  };
  const sources=sourceManifest();
  const sourceHash=manifest=>createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
  const before = sourceHash(sources), started = Date.now();
  mkdirSync('artifacts/tactical-responsiveness', { recursive: true });
  const pairs = [];
  const filter = process.env.BATTLE_FILTER;
  const filters = filter?.split('|').map(s=>s.trim()).filter(Boolean);
  const baselinePath = process.env.BATTLE_BASELINE;
  const baseline = baselinePath ? JSON.parse(readFileSync(baselinePath, 'utf8')) : null;
  const unchanged = process.env.BATTLE_UNCHANGED === '1';
  const changedCommanders = (process.env.BATTLE_CHANGED_COMMANDERS || '').split(',');
  const changed = new Set(rosters.filter(r => {
    const old = baseline?.rosters.find(p => p.name === r.name);
    return baseline && (JSON.stringify(old) !== JSON.stringify(r) || changedCommanders.includes(r.commanderId));
  }).map(r => r.name));
  const reportName = baseline ? (unchanged ? 'unchanged' : 'delta') : filter ? 'filtered' : 'all-civilizations';
  for (let i = 0; i < rosters.length; i++) for (let j = 0; j < rosters.length; j++)
    if ((!filters?.length || filters.some(f=>rosters[i].name.includes(f) || rosters[j].name.includes(f)))
      && (!baseline || (changed.has(rosters[i].name) || changed.has(rosters[j].name)) !== unchanged)) pairs.push([i, j]);
  const results = [], total = pairs.length; let offset = 0, reported = 0;
  assert.ok(total>0,'No civilizations matched the requested battle filter.');
  const next = () => offset < pairs.length ? pairs.slice(offset, offset += 10) : null;
  console.log(`START ${rosters.length} civilizations, ${total} ordered matches, capacity ${capacity}, 30 Hz, seed 42.`);
  if (baseline) console.log(`CHANGED ${JSON.stringify([...changed])}`);
  await Promise.all(Array.from({ length: Number(process.env.BATTLE_WORKERS || 4) }, () => new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), { workerData: {} });
    worker.on('error', reject);
    worker.on('exit', code => code ? reject(new Error(`worker exit ${code}`)) : resolve());
    worker.on('message', batch => {
      results.push(...batch);
      if (results.length - reported >= 250) {
        reported = results.length;
        console.log(`PROGRESS ${results.length}/${total}; unresolved ${results.filter(r => r.outcome !== 'elimination').length}; idle-loss ${results.filter(r => r.idleLoss.some(t => t !== null)).length}`);
        writeFileSync(`artifacts/tactical-responsiveness/${baseline?reportName:filter?'filtered':'all'}-progress.json`,JSON.stringify({before,sources,total,rosters,results}));
        assert.equal(before, sourceHash(sourceManifest()), 'Simulation sources changed; stop before spending the full matrix on an obsolete version.');
      }
      worker.postMessage(next());
    });
    worker.postMessage(next());
  })));
  results.sort((a,b) => a.i-b.i || a.j-b.j);
  // Losing a quarter of an army while an intact, ordered majority has never
  // attacked and remains stationary must not persist beyond the maneuver
  // timeout. Natural elimination alone does not make that behaviour correct.
  const after = sourceHash(sourceManifest()), failed = results.filter(r =>
    !r.finite || r.outcome !== 'elimination' || r.maxFormationStall.some(seconds => seconds > 6.1));
  const suspicious = results.filter(r => r.idleLoss.some(t => t !== null) || r.maxQuiet > 45);
  const summary = { civilizations: rosters.length, matches: total, capacity, seed: 42, hz: 30,
    elapsedSeconds: (Date.now()-started)/1000, before, after, failed: failed.length, suspicious: suspicious.length,
    ...(baseline ? { baselinePath, changed: [...changed] } : {}) };
  mkdirSync('artifacts/tactical-responsiveness', { recursive: true });
  const path = `artifacts/tactical-responsiveness/${reportName}-${capacity}.json`;
  writeFileSync(path, JSON.stringify({ summary, sources, rosters, failed, suspicious, results }));
  console.log(JSON.stringify(summary)); console.log(path);
  assert.equal(before, after, 'Source changed during matrix; repeat on consistent sources.');
  assert.equal(results.length, total);
  assert.equal(failed.length, 0, `Unresolved/invalid battles or prolonged idle formation under losses: inspect ${path}`);
}
