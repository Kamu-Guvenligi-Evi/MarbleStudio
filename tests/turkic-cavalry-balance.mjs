import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {Battle} from '../src/crown-battle.js';
import {HISTORICAL_TYPES as types} from '../src/historical-combat.js';
const ids=['seljuk_hassa','ottoman_sipah','khwarazm_hassa','gokturk_bori'];
const results=[];
for(const id of ids)for(const opponent of ['templar_knight','ottoman_akinci','spartan']){
  const runs=[];
  for(const seed of [5,39,1066])for(const swap of [false,true]){
    const armies=[{[id]:12},{[opponent]:opponent==='spartan'?18:12}];
    const b=new Battle({seed,historicalArmies:swap?armies.reverse():armies});
    for(let i=0;i<7200&&b.winner===null;i++)b.step(1/30);
    const team=swap?1:0;
    runs.push({seed,swap,win:b.winner===team,timeout:b.winner===null,
      hp:b.units.filter(u=>u.team===team).reduce((s,u)=>s+Math.max(0,u.hp),0),
      enemyHp:b.units.filter(u=>u.team!==team).reduce((s,u)=>s+Math.max(0,u.hp),0),counters:b.stats.pikeCounters});
  }
  results.push({id,opponent,wins:runs.filter(r=>r.win).length,runs});
}
const baseline=process.argv.includes('--baseline');
mkdirSync('artifacts/europe-crusaders',{recursive:true});
writeFileSync(`artifacts/europe-crusaders/cavalry-${baseline?'before':'after'}.json`,JSON.stringify({stats:Object.fromEntries(ids.map(id=>[id,types[id]])),results},null,2));
assert.ok(results.every(r=>r.runs.every(v=>!v.timeout)), 'All fights finish');
if(!baseline)for(const id of ids){
  const light=results.find(r=>r.id===id&&r.opponent==='ottoman_akinci');
  const pikes=results.find(r=>r.id===id&&r.opponent==='spartan');
  assert.equal(light.wins,6,`${id}: armour advantage over light cavalry`);
  assert.equal(pikes.wins,0,`${id}: massed spears remain a counter`);
}
console.log(JSON.stringify(results.map(({id,opponent,wins})=>({id,opponent,wins})),null,2));
