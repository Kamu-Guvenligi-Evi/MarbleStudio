import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { CIVILIZATION_DOCTRINES as profiles } from '../src/historical-civilization-tactics.js';
import leaders from '../src/historical-commanders.json' with {type:'json'};

function make(id,team,enemy={landsknecht:24}) {
  const p=profiles.find(p=>p.id===id),roster=Object.fromEntries(Object.entries(p.required).map(([r,n])=>[Object.keys(p.roles).find(t=>p.roles[t]===r),n*2]));
  const armies=[enemy,enemy],commanders=[null,null];armies[team]=roster;
  commanders[team]=leaders.find(l=>l.doctrineIds.includes(id)).id;
  return new Battle({seed:42,historicalArmies:armies,commanders,expandedMap:true});
}
const tick=b=>{b.time+=.5;b.tactics.update(b,b.units.filter(u=>u.hp>0&&!u.removed));};
const state=(b,team)=>b.tactics.civilizations.teams[team];

for(const id of ['EN_SHIELDWALL','GR_HOPLITE'])for(const team of [0,1]) {
  const b=make(id,team);tick(b);const s=state(b,team);
  const m=s.members[0],u=m.unit,target=b.units.find(u=>u.team!==team);
  const goal=b.tactics.civilizations.point(s,m.f,m.a);u.x=goal.x;u.y=goal.y;
  target.x=u.x+s.forward.x*36;target.y=u.y+s.forward.y*36;
  assert.ok(u.combatProfile.config.reach+6<36&&target.combatProfile.config.reach>=36);
  assert.equal(b.tactics.steer(b,u,target,1/30),false,'enemy weapon reach releases formation steering');
  assert.ok(m.engaged);
  tick(b);assert.ok(!b.tactics.civilizations.intents.has(u.id),'next decision must not drag a fighting soldier back');
  const start={x:u.x,y:u.y},hp=target.hp;
  for(let i=0;i<90&&b.winner===null;i++)b.step(1/30);
  assert.ok(Math.hypot(u.x-start.x,u.y-start.y)>5||target.hp<hp,'physical closing or attack follows release');
}
console.log('PASS English/Greek melee closes against longer pikes and does not return to stale slots, both teams');

for(const id of ['CN_QIN','JP_INFANTRY'])for(const team of [0,1]) {
  const b=make(id,team,{achaemenid_archer:24});tick(b);const s=state(b,team);
  const enemies=b.units.filter(u=>u.team!==team&&!u.commanderId);
  enemies.forEach((u,i)=>{u.x=s.origin.x+s.forward.x*120+s.side.x*(i-12)*5;u.y=s.origin.y+s.forward.y*120+s.side.y*(i-12)*5;});
  b.time=4;
  if(id==='JP_INFANTRY')s.phase='execute';
  b.tactics.update(b,b.units);
  assert.ok(!s.history.some(h=>h.phase==='fallback'),'archers alone do not trigger melee withdrawal');
  assert.ok(s.members.filter(m=>m.role==='bow').every(m=>!b.tactics.civilizations.intents.get(m.unit.id)?.retreat));
  assert.equal(s.opponent.meleeNearest,Infinity);
}
console.log('PASS Qin/Japanese support does not withdraw merely because archers are nearby, both teams');

for(const id of ['TR_OTTOMAN','IT_CONDOTTA','FR_OPPORTUNITY'])for(const team of [0,1]) {
  const b=make(id,team,id==='FR_OPPORTUNITY'?{achaemenid_archer:24}:{roman:24});let charges=0,hits=0;
  const charge=b.startCharge.bind(b),hit=b.hit.bind(b);
  b.startCharge=(u,...args)=>{
    if(u.team===team){assert.ok(u.runDistance>=28&&u.speed>=u.combatProfile.config.speed*.8);charges++;}
    return charge(u,...args);
  };
  b.hit=(target,damage,source,...args)=>{const hp=target.hp;const r=hit(target,damage,source,...args);if(source?.team===team&&source.charge&&target.hp<hp)hits++;return r;};
  for(let i=0;i<60*30&&b.winner===null;i++)b.step(1/30);
  assert.ok(charges>0&&hits>0,`${id}/${team}: actual run-up and damaging charge`);
}
console.log('PASS Ottoman, Italian and French riders physically accelerate and deliver charge damage, both teams');

for(const scale of [3,8])for(const team of [0,1]) {
  const p=profiles.find(p=>p.id==='CN_MING'),n=20*scale;
  const own=Object.fromEntries(Object.entries(p.required).map(([r,count])=>[Object.keys(p.roles).find(t=>p.roles[t]===r),count*scale]));
  const armies=[null,null],commanders=[null,null];
  armies[team]=own;armies[1-team]={roman:n/2,achaemenid_archer:n/4,kipchak:n/4};
  commanders[team]=leaders.find(l=>l.doctrineIds.includes(p.id)).id;
  const b=new Battle({seed:scale===3?1066:2026,historicalArmies:armies,commanders,expandedMap:true});
  for(let i=0;i<14*30&&b.winner===null;i++)b.step(1/30);
  const s=state(b,team);
  assert.ok(s.history.some(h=>h.phase==='execute'),`${n} Ming / team ${team}: actual contact releases deployment without waiting for occupied slots`);
  const engaged=s.members.filter(m=>m.engaged);
  assert.ok(engaged.length>0,'scenario actually reaches melee');
  assert.ok(engaged.every(m=>!b.tactics.civilizations.intents.has(m.unit.id)),'fighting soldiers remain in local combat');
}
console.log('PASS 60/160 Ming soldiers, both teams: ongoing melee no longer strands supporting troops in assembly');
