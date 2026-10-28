import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';
import { reinforceLine } from '../src/historical-line-support.js';

const centreAssault={french_ordonnance_gendarme:64,french_coutilier:16,french_franc_archer:8,french_dismounted_man_at_arms:8};
const make = (team, enemy='charles_vii', seed=42, size=96, assault=false) => new Battle({ seed, expandedMap:true, armyConfigs:[
  { id:'own', team, roster:createCommanderArmy('mehmed_ii',size), commanderId:'mehmed_ii' },
  { id:'enemy', team:1-team, roster:assault?centreAssault:createCommanderArmy(enemy,size), commanderId:assault?undefined:enemy },
] });
const report=[];
// A lone intruder receives a small reserve response. Repeated decisions must
// not consume another pair of wing soldiers every half second; a mass attack
// must still expand the response.
for (const team of [0,1]) {
  const b=make(team);b.step(1/30);
  const s=b.tactics.civilizations.armies.get('own');
  const centre=s.members.find(m=>m.role==='bow').unit;
  const enemies=b.units.filter(u=>u.team!==team&&!u.commanderId);
  const members=s.members.filter(m=>!m.unit.order&&!m.unit.tacticalOverride);
  for(const m of members){m.unit.target=null;m.unit.charge=null;}
  const place=u=>{u.x=centre.x+s.forward.x*85;u.y=centre.y+s.forward.y*85;};
  place(enemies[0]);
  for(let i=0;i<4;i++){b.time+=.5;reinforceLine(b,s,members,[enemies[0]]);}
  const initial=members.filter(m=>m.supportCommitted);
  assert.equal(initial.length,2,'isolated threat does not drain the wings over repeated decisions');
  assert.ok(initial.every(m=>m.role==='reserve'),'available household reserve responds first');
  initial[0].unit.retarget=.1;
  enemies.slice(0,16).forEach(place);
  b.time+=.5;reinforceLine(b,s,members,enemies.slice(0,16));
  assert.equal(initial[0].unit.retarget,.1,'committed supports retain their local retarget cadence');
  assert.ok(members.filter(m=>m.supportCommitted).length>initial.length,'mass approach receives more reinforcements');
}
for(const team of [0,1])for(const seed of [42,1066,2026]) {
  // A fixed direct assault exercises centre defence even when the French
  // commander's adaptive opening chooses to fight on both outer wings.
  const b=make(team,'charles_vii',seed,96,true), attacks=new Map();
  b.onCombatEvent=e=>{if(e.kind==='attack'){const times=attacks.get(e.unit.id)||[];times.push(b.time);attacks.set(e.unit.id,times);}};
  b.step(1/30);
  const s=b.tactics.civilizations.armies.get('own');
  const bows=s.members.filter(m=>m.role==='bow');
  const screen=s.members.filter(m=>m.duty?.endsWith('-center'));
  assert.ok(screen.length>0);
  assert.ok(Math.min(...screen.map(m=>m.f-m.radius))>Math.max(...bows.map(m=>m.f+m.radius)), 'foot screen starts ahead of the bow centre');
  let centerAt20;
  while(b.time<100&&b.winner===null) {
    b.step(1/30);
    if(centerAt20===undefined&&b.time>=20)centerAt20=bows.filter(m=>m.unit.hp>0).length;
  }
  const support=s.members.filter(m=>m.supportCommitted);
  const responded=support.filter(m=>attacks.get(m.unit.id)?.some(t=>t>=m.supportAt&&t<=m.supportAt+15));
  const row={team,seed,centerAt20,totalCenter:bows.length,supportAt:s.supportAt,lossAtSupport:s.supportLoss,support:support.length,responded:responded.length,winner:b.winner};
  report.push(row);
  assert.ok(centerAt20>=bows.length*.75,JSON.stringify(row));
  assert.ok(s.supportAt!==undefined&&s.supportLoss<.1,'reinforcement starts before the centre suffers serious losses');
  assert.ok(responded.length>=Math.max(1,support.length*.5),JSON.stringify(row));
}

// Natural combined-arms battles: formed melee ranks must participate while
// the front is fighting or missiles pin the formation anchor in place.
for(const leader of ['qi_jiguang','harold_godwinson'])for(const team of [0,1]) {
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId:leader,roster:createCommanderArmy(leader,48)},
    {id:'enemy',team:1-team,commanderId:'mehmed_ii',roster:createCommanderArmy('mehmed_ii',48)},
  ]});
  const attacks=new Map();
  b.onCombatEvent=e=>{if(e.kind==='attack'||(e.kind==='hit'&&e.unit)){
    const times=attacks.get(e.unit.id)||[];times.push(b.time);attacks.set(e.unit.id,times);
  }};
  while(b.time<60&&b.winner===null)b.step(1/30);
  const s=b.tactics.civilizations.armies.get('own');
  const ranks=s.members.filter(m=>m.rankReleasedAt!==undefined);
  const responded=ranks.filter(m=>attacks.get(m.unit.id)?.some(t=>t>=m.rankReleasedAt&&t<=m.rankReleasedAt+15));
  // A soldier who already fought locally needs no subsequent release flag.
  // Check participation, including direct contact, rather than requiring a
  // particular internal path to combat for half of the whole army.
  const melee=s.members.filter(m=>!m.unit.combatProfile.ranged);
  const joined=melee.filter(m=>attacks.get(m.unit.id)?.some(t=>t<=(s.contactAt??60)+15));
  const rear=melee.filter(m=>m.role==='short'||m.duty==='ming-reserve'||m.role==='support');
  assert.ok(joined.length>=melee.length*.6,`${leader}/${team}: melee ranks actually attack soon after contact`);
  if(rear.length)assert.ok(rear.filter(m=>joined.includes(m)).length>=rear.length*.6,`${leader}/${team}: rear supports actually attack soon after contact`);
  assert.ok(responded.length>=ranks.length*.6,`${leader}/${team}: released ranks actually attack within 15 seconds`);
}

// Generic commanders must also close under actual missile losses, instead of
// marching in stop/start steps until most of the army has already been hit.
for(const team of [0,1]) {
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId:'harald_hardrada',roster:createCommanderArmy('harald_hardrada',48)},
    {id:'enemy',team:1-team,roster:{aithiopian_palm_archer:48}},
  ]});
  const attacked=new Set();
  b.onCombatEvent=e=>{if(e.kind==='attack'&&e.unit.team===team)attacked.add(e.unit.id);};
  while(b.time<30&&b.winner===null)b.step(1/30);
  const s=b.tactics.formations.armies.get('own');
  assert.equal(s.releaseReason,'missile-pressure');
  assert.ok(s.releasedAt<20,'generic formation reacts before mass casualties');
  assert.ok(s.releasedAt-s.missilePressureAt<=2.1,'sustained missile fire triggers a response within two seconds');
  assert.ok(attacked.size>=24,`generic formation/${team}: at least half the army attacks by 30 seconds`);
}

for(const team of [0,1]) {
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId:'harold_godwinson',roster:createCommanderArmy('harold_godwinson',48)},
    {id:'enemy',team:1-team,roster:{roman:48}},
  ]});
  b.step(1/30);
  const s=b.tactics.civilizations.armies.get('own');
  assert.equal(s.phase,'hold');
  b.time=3;
  // Incoming projectiles can hit ranks beyond the anchor's estimated range.
  // Fatal hits must count even though victims leave the live member list.
  for(const m of s.members.slice(0,3))b.hit(m.unit,10000,undefined,{x:0,y:0},'arrow');
  b.tactics.update(b,b.units.filter(u=>u.hp>0));
  assert.equal(s.opponent.missilePressure,0);
  assert.equal(s.phase,'execute','actual missile casualties break passive hold before mass losses');
}

for(const team of [0,1]) {
  const b=make(team);b.step(1/30);
  const s=b.tactics.civilizations.armies.get('own');
  const wing=s.members.filter(m=>m.role==='left');
  const held=wing[0].unit, fighting=wing[1].unit;
  held.order={kind:'hold',x:held.x,y:held.y};
  const enemy=b.units.find(u=>u.team!==team&&!u.commanderId);
  const position=b.tactics.civilizations.point(s,110,0);enemy.x=position.x;enemy.y=position.y;
  fighting.x=enemy.x-10;fighting.y=enemy.y;fighting.target=enemy;
  b.time+=.6;b.tactics.update(b,b.units.filter(u=>u.hp>0));
  assert.equal(wing[0].supportCommitted,undefined,'manual hold is not commandeered');
  assert.equal(wing[1].supportCommitted,undefined,'an engaged rider keeps its fight');
  assert.equal(fighting.target,enemy);
  assert.ok(s.members.some(m=>m.supportCommitted),'free riders respond to an imminent centre attack without waiting for casualties');
}
mkdirSync('artifacts/tactical-responsiveness',{recursive:true});
writeFileSync('artifacts/tactical-responsiveness/ottoman-support.json',JSON.stringify(report,null,2));
console.log(`PASS ${report.length} Ottoman centre-assault battles: protected centre, early dispatch, actual attacks within 15 seconds; mirrored manual/contact controls.`);
console.log('PASS 4 natural Ming/Anglo-Saxon battles: rear ranks physically join combat within 15 seconds.');
console.log('PASS 2 natural Norse/archer battles: generic formations react to missile losses and join combat.');
