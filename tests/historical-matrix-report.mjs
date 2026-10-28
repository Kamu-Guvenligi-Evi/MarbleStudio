import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const folder='artifacts/tactical-responsiveness';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const baseline=read(process.env.BATTLE_REPORT_BASELINE || `${folder}/matrix-snapshot/artifacts/tactical-responsiveness/all-civilizations-48.json`);
const delta=read(process.env.BATTLE_REPORT_DELTA || `${folder}/matrix-final-snapshot/artifacts/tactical-responsiveness/delta-48.json`);
const equivalence=read(process.env.BATTLE_REPORT_EQUIVALENCE || `${folder}/engine-equivalence.json`);
for(const report of [baseline,delta]) {
  if (report.summary.before) assert.equal(report.summary.before,report.summary.after,'source consistency');
  else assert.ok(report.baselineSources && report.retestSources,'merged baseline must retain source provenance');
  assert.equal(report.summary.failed,0,'all battles end normally with finite coordinates');
  assert.equal(report.results.length,report.summary.matches);
}
const normalize=sources=>Object.fromEntries(Object.entries(sources).map(([p,hash])=>[p.replaceAll('\\','/'),hash]).sort(([a],[b])=>a.localeCompare(b)));
assert.deepEqual(normalize(equivalence.sources),normalize(delta.sources),'engine comparison covers the retested snapshot');
const changed=new Set(delta.summary.changed),pairs=new Map(),key=(a,b)=>JSON.stringify([a,b]);
for(const row of baseline.results) {
  const a=baseline.rosters[row.i],b=baseline.rosters[row.j];
  if(changed.has(a.name)||changed.has(b.name))continue;
  assert.deepEqual(delta.rosters.find(r=>r.name===a.name),a);
  assert.deepEqual(delta.rosters.find(r=>r.name===b.name),b);
  pairs.set(key(a.name,b.name),{...row,source:'baseline'});
}
for(const row of delta.results) {
  const a=delta.rosters[row.i].name,b=delta.rosters[row.j].name,k=key(a,b);
  assert.ok(!pairs.has(k),'no duplicate matchup in merged coverage');
  pairs.set(k,{...row,source:'retest'});
}
const results=[];
for(let i=0;i<delta.rosters.length;i++)for(let j=0;j<delta.rosters.length;j++) {
  const row=pairs.get(key(delta.rosters[i].name,delta.rosters[j].name));
  assert.ok(row,`missing matchup ${i}/${j}`);
  results.push({...row,i,j});
}
assert.equal(pairs.size,delta.rosters.length**2);
const suspicious=results.filter(r=>r.idleLoss.some(t=>t!==null)||r.maxQuiet>45);
const maxFormationStall=Math.max(...results.flatMap(r=>r.maxFormationStall));
assert.ok(maxFormationStall<=6.1,'no prolonged idle formation under substantial losses');
const summary={civilizations:delta.rosters.length,matches:results.length,
  baselineMatches:results.filter(r=>r.source==='baseline').length,retestedMatches:delta.results.length,
  capacity:48,seed:42,hz:30,failed:0,suspicious:suspicious.length,maxFormationStall,
  engineEquivalentBattles:equivalence.matches,engineEquivalentCheckpoints:equivalence.checkpoints,
  coverage:'Baseline plus all changed roster/formation matchups; engine equivalence sampled separately. This is not a fresh full-matrix run on the final engine.'};
writeFileSync(process.env.BATTLE_REPORT_OUTPUT || `${folder}/verified-matrix-48.json`,JSON.stringify({summary,rosters:delta.rosters,
  baselineSources:baseline.sources || {baseline:baseline.baselineSources,retest:baseline.retestSources},retestSources:delta.sources,results}));
console.log(JSON.stringify(summary));
