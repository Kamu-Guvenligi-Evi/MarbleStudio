import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { preparationUnderFire } from '../src/historical-opponent-analysis.js';
import { CIVILIZATION_DOCTRINES as profiles } from '../src/historical-civilization-tactics.js';
import leaders from '../src/historical-commanders.json' with { type: 'json' };

// Controlled decision fixtures: geometry and damage are explicit. Full battle
// regressions separately check real arrows, pursuit and damaging charge impacts.
const unit = (id,x,y,ranged=false) => ({id,x,y,hp:100,combatProfile:{ranged,config:{reach:100}}});
for(const sign of [-1,1]) {
  const own=[unit(1,0,sign*300),unit(2,10,sign*300)], enemy=[unit(3,80,sign*300,true)];
  const state={}, group={id:'wing',units:own,ready:false};
  assert.equal(preparationUnderFire(state,[group],enemy,0),false);
  assert.equal(preparationUnderFire(state,[group],enemy,1),false,'Range alone is not damage');
  own[0].hp-=1;
  assert.equal(preparationUnderFire(state,[group],enemy,1.5),false,'A scratch does not dissolve a sector');
  own[0].hp-=15;
  assert.equal(preparationUnderFire(state,[group],enemy,2),true,'An exposed wing far from the center is detected');
  group.ready=true;
  assert.equal(preparationUnderFire(state,[group],enemy,2.5),false,'A deployed sector retains its orders');
}
{
  const own=[unit(1,0,0),unit(2,0,0)], enemy=[unit(3,80,0,true)];
  const state={}, group={id:'wing',units:own,ready:false};
  preparationUnderFire(state,[group],enemy,0);
  group.units=own.slice(1);
  assert.equal(preparationUnderFire(state,[group],enemy,1),false,'Manual removal is not incoming damage');
  group.units[0].hp-=20;
  enemy[0].x=1000;
  assert.equal(preparationUnderFire(state,[group],enemy,1.5),false,'Distant ranged composition alone is not pressure');
}
{
  const own=[unit(1,0,0),unit(2,0,0)], enemy=[unit(3,80,0,true)];
  const state={}, group={id:'wing',units:own,ready:false};
  preparationUnderFire(state,[group],enemy,0);
  own[0].hp=0;group.units=own.slice(1);
  assert.equal(preparationUnderFire(state,[group],enemy,1),true,'Fatal damage still counts after a casualty leaves the live roster');
}
const tick=b=>{b.time+=.5;b.tactics.update(b,b.units.filter(u=>u.hp>0&&!u.removed));};
for(const team of [0,1])for(const stationaryDistance of [80,160]) {
  const armies=[{roman:18,achaemenid_archer:6},{roman:18,achaemenid_archer:6}],commanders=[null,null];
  armies[team]={seljuk_hassa:16,seljuk_turkmen_archer:8};commanders[team]='alp_arslan';
  const b=new Battle({seed:42,expandedMap:true,historicalArmies:armies,commanders});b.step(1/30);
  const s=b.tactics.teams[team],point=(f,a=0)=>b.tactics.point(s,f,a);
  for(const m of s.members)Object.assign(m.unit,point((m.role==='bait'?85:15)+m.depth,
    m.role==='bait'?m.offset:(m.role==='left'?-s.spread:s.spread)+m.offset));
  const bait=s.members.filter(m=>m.role==='bait');
  const center=bait.reduce((p,m)=>({x:p.x+m.unit.x/bait.length,y:p.y+m.unit.y/bait.length}),{x:0,y:0});
  const enemies=b.units.filter(u=>u.team!==team&&!u.commanderId);
  const place=(u,d)=>Object.assign(u,{x:center.x+s.forward.x*d,y:center.y+s.forward.y*d});
  for(const u of enemies)place(u,u.combatProfile.ranged?80:stationaryDistance);
  s.observations=new Map(enemies.map(u=>[u.id,{x:u.x,y:u.y}]));
  tick(b);tick(b);
  assert.equal(s.phase,'assemble','A nearby archer and stationary melee do not start a feigned retreat');
  for(const u of enemies)if(!u.combatProfile.ranged)place(u,60);
  tick(b);
  assert.equal(s.phase,'retreat','A real approaching melee force can trigger a prepared retreat');
  assert.ok(s.approaching>=3);
}

for(const team of [0,1]) {
  const armies=[{roman:18,achaemenid_archer:6},{roman:18,achaemenid_archer:6}],commanders=[null,null];
  armies[team]={seljuk_hassa:16,seljuk_turkmen_archer:8};commanders[team]='alp_arslan';
  const b=new Battle({seed:42,expandedMap:true,historicalArmies:armies,commanders});b.step(1/30);
  const s=b.tactics.teams[team],wing=s.members.filter(m=>m.role==='left');
  const position=b.tactics.point(s,-80,-s.spread);
  for(const m of wing)Object.assign(m.unit,position);
  for(const u of b.units.filter(u=>u.team!==team&&!u.commanderId))Object.assign(u,
    b.tactics.point(s,u.combatProfile.ranged?-30:600,u.combatProfile.ranged?-s.spread:0));
  tick(b);
  for(let i=0;i<2;i++) {
    for(const m of wing)m.unit.hp-=m.unit.combatProfile.config.hp*.04;
    tick(b);
  }
  assert.ok(s.healthRatio>.9,'Localized wing exposure precedes the global loss fallback');
  assert.equal(s.phase,'done','An exposed unprepared wing cancels a coordinated trap');
  assert.ok(s.members.every(m=>!b.tactics.intents.has(m.unit.id)));
}

for(const profile of profiles)for(const team of [0,1])for(const isolated of (profile.id==='TR_OTTOMAN'?[false,true]:[false])) {
  const roster=Object.fromEntries(Object.entries(profile.required).map(([role,n])=>[
    Object.keys(profile.roles).find(k=>profile.roles[k]===role),n*3]));
  const commanderId=leaders.find(l=>l.doctrineIds.includes(profile.id)).id;
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId,roster},{id:'enemy',team:1-team,roster:{achaemenid_archer:24,roman:24}}
  ]});b.step(1/30);
  const director=b.tactics.civilizations,s=director.armies.get('own');
  s.phase='assemble';s.since=b.time;
  const exposed=s.members.filter(m=>!isolated||m.visualRole==='left');
  const position=director.point(s,-200,isolated?-300:0);
  for(const m of s.members)Object.assign(m.unit,exposed.includes(m)?position:director.point(s,-200,300));
  for(const u of b.units.filter(u=>u.team!==team&&!u.commanderId))Object.assign(u,
    director.point(s,u.combatProfile.ranged?-120:600,isolated?-300:0));
  tick(b);
  for(let i=0;i<2;i++) {
    for(const m of exposed)m.unit.hp-=m.unit.combatProfile.config.hp*.04;
    tick(b);
  }
  assert.ok(exposed.every(m=>m.preparationReleased),`${profile.id}/${team}: damaged unprepared sectors released`);
  assert.ok(exposed.every(m=>!director.intents.has(m.unit.id)),`${profile.id}/${team}: no stale deployment orders`);
  if(isolated)assert.ok(s.members.filter(m=>!exposed.includes(m)).every(m=>director.intents.has(m.unit.id)),
    'Unexposed ranks continue forming instead of dissolving the entire army');
  tick(b);
  assert.ok(exposed.every(m=>!director.intents.has(m.unit.id)),'A later hold must not reclaim released soldiers');
}
console.log('PASS pressure geometry, scratch/range/manual safeguards, mirrored pursuit opportunity and all 10 doctrines under fire');
