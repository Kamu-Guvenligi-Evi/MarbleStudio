import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

// Cavalry maneuvers must not leave infantry and crossbows at their opening
// slots. Measure actual attacks in natural battles, not intent or movement.
const report=[];
for(const team of [0,1]) {
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId:'francesco_sforza',roster:createCommanderArmy('francesco_sforza',48)},
    {id:'enemy',team:1-team,commanderId:'darius_i',roster:createCommanderArmy('darius_i',48)},
  ]});
  b.step(1/30);
  const director=b.tactics.civilizations,s=director.armies.get('own');
  const [free,held]=s.members.filter(m=>m.auxiliary&&!m.unit.combatProfile.ranged);
  held.unit.order={kind:'hold',x:held.unit.x,y:held.unit.y};
  const order=held.unit.order;
  for(const m of [free,held])m.unit.lastMissileDamage=b.time;
  while(b.time<.7)b.step(1/30);
  assert.ok(free.rankReleasedAt<.7,'exposed infantry stops waiting for its formation slot');
  assert.ok(!director.intents.has(free.unit.id),'local combat receives control of the exposed infantry');
  assert.equal(held.unit.order,order,'player hold remains in force');
  assert.equal(held.rankReleasedAt,undefined,'tactical response does not commandeer player orders');
}
for(const enemy of ['darius_i','hannibal_barca','alexander_nevsky'])
for(const team of [0,1])for(const seed of [42,1066,2026]) {
  const b=new Battle({seed,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId:'francesco_sforza',roster:createCommanderArmy('francesco_sforza',48)},
    {id:'enemy',team:1-team,commanderId:enemy,roster:createCommanderArmy(enemy,48)},
  ]});
  const attacks=new Map();
  b.onCombatEvent=e=>{
    if(e.unit&&(e.kind==='attack'||e.kind==='hit')&&!attacks.has(e.unit.id))attacks.set(e.unit.id,b.time);
  };
  while(b.time<40&&b.winner===null)b.step(1/30);
  const s=b.tactics.civilizations.armies.get('own');
  const groups=['infantry','missile'].map(role=>{
    const members=s.members.filter(m=>m.auxiliary&&!!m.unit.combatProfile.ranged===(role==='missile'));
    return {role,count:members.length,attacked:members.filter(m=>attacks.has(m.unit.id)).length};
  });
  const row={enemy,team,seed,advance:s.advance,groups};report.push(row);
  assert.ok(s.advance>100,`support line advances during cavalry maneuvers: ${JSON.stringify(row)}`);
  // Against the Persian missile-heavy line, the small infantry contingent
  // can be killed before melee range. Crossbows must still provide fire;
  // against the other mixed armies, also require physical infantry attacks.
  for(const group of groups.filter(g=>enemy!=='darius_i'||g.role==='missile'))assert.ok(group.count>0&&group.attacked>=group.count*.5,
    `at least half of each support corps actually attacks by 40 seconds: ${JSON.stringify(row)}`);
}
mkdirSync('artifacts/tactical-responsiveness',{recursive:true});
writeFileSync('artifacts/tactical-responsiveness/cavalry-support.json',JSON.stringify(report));
console.log(`PASS ${report.length} natural Milan combined-arms battles: crossbow fire in all matchups, infantry attacks against mixed lines; mirrored pressure/manual-order controls.`);
