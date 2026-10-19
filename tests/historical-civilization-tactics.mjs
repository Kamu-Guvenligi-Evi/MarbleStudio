import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import leaders from '../src/historical-commanders.json' with {type:'json'};
import { CIVILIZATION_DOCTRINES as profiles } from '../src/historical-civilization-tactics.js';
import { tacticalPhaseLabel } from '../src/crown-battle-tactical-visuals.js';

const advance=(b,seconds,until=()=>false)=>{for(let i=0;i<seconds*30&&b.winner===null&&!until();i++)b.step(1/30);};
function make(profile,team=0,enemy={roman:24},leader) {
  const roster={};
  for(const [role,n] of Object.entries(profile.required))roster[Object.keys(profile.roles).find(k=>profile.roles[k]===role)]=n*2;
  const armies=[enemy,enemy],commanders=[null,null];armies[team]=roster;
  commanders[team]=leader===undefined?leaders.find(l=>l.doctrineIds.includes(profile.id)).id:leader;
  const b=new Battle({seed:42,historicalArmies:armies,commanders,expandedMap:true});
  if(b.commanders[team]){b.setActiveTeam(team);b.selected=new Set([b.commanders[team].id]);b.stopSelected();}
  b.setActiveTeam(1-team);b.select('all');b.stopSelected();
  return b;
}
const state=(b,team=0)=>b.tactics.civilizations.teams[team];
const forward=(u,s)=>(u.x-s.origin.x)*s.forward.x+(u.y-s.origin.y)*s.forward.y;
const mean=(list,fn)=>list.reduce((n,v)=>n+fn(v),0)/list.length;

for(const p of profiles)for(const team of [0,1]) {
  const b=make(p,team);
  advance(b,13,()=>state(b,team)&&state(b,team).phase!=='assemble');
  const s=state(b,team);
  assert.ok(s,`${p.id}/${team} initializes`);
  assert.notEqual(s.phase,'assemble',`${p.id}/${team} assembles`);
  assert.notEqual(s.phase,'done',`${p.id}/${team} reaches its behavior`);
  assert.ok(tacticalPhaseLabel(b,team));assert.ok(s.label.includes(p.name));
  const initial=s.members.map(m=>({x:m.unit.x,y:m.unit.y}));
  advance(b,5);
  if(['pikes','hoplites','screen','yari','crossbows','cells','wings','reserve'].includes(p.kind))
    assert.ok(s.members.some((m,i)=>Math.hypot(m.unit.x-initial[i].x,m.unit.y-initial[i].y)>20),`${p.id}/${team} physically moves`);
  if(p.kind==='hold')assert.equal(s.advance,0);
  if(p.kind==='reserve')assert.ok(s.history.some(h=>h.phase==='flank'));
  const unit=s.members.find(m=>m.unit.hp>0).unit,opponent=b.units.find(u=>u.team!==team&&u.hp>0);
  b.setActiveTeam(team);b.selected=new Set([unit.id]);b.stopSelected();
  assert.equal(b.tactics.steer(b,unit,opponent,1/30),false,'manual hold overrides immediately');
  b.commanders[team].hp=0;b.step(1/30);
  assert.equal(s.phase,'done','commander loss cancels immediately');
  assert.equal(b.tactics.civilizations.intents.size,0);
}
console.log('PASS 10 doctrines on both teams: assembly, physical movement, labels, manual override, commander loss');

for(const p of profiles)for(const leader of [null,'alp_arslan']) {
  const b=make(p,0,{roman:24},leader);advance(b,1);assert.equal(state(b),null,`${p.id} rejects missing/wrong leader`);
}
{
  const p=profiles.find(p=>p.kind==='opportunity');
  const open=make(p,0,{achaemenid_archer:6});advance(open,15,()=>state(open)?.phase==='charge');
  assert.equal(state(open)?.phase,'charge','French cavalry recognizes exposed ranged troops');
  const blocked=make(p);advance(blocked,20);
  assert.ok(!state(blocked).history.some(h=>h.phase==='charge'),'French cavalry does not choose frontal charge into protected melee');
}
for(const team of [0,1]) {
  const b=make(profiles.find(p=>p.kind==='crossbows'),team);
  advance(b,23,()=>state(b,team)?.phase==='fallback');const s=state(b,team);
  assert.equal(s?.phase,'fallback');const bows=s.members.filter(m=>m.role==='bow');
  const before=mean(bows,m=>forward(m.unit,s));advance(b,3);
  assert.ok(mean(bows,m=>forward(m.unit,s))<before-10,'Qin crossbowmen physically fall back');
}
for(const p of profiles) {
  const b=make(p);advance(b,45);
  for(const intent of b.tactics.civilizations.intents.values()) {
    assert.ok(Number.isFinite(intent.goal.x)&&Number.isFinite(intent.goal.y));
    assert.ok(b.tactics.civilizations.inside(b,intent.goal),`${p.id}: long-running orders remain on the battlefield`);
  }
  if(p.kind==='hold')assert.ok(state(b).history.some(h=>h.phase==='execute'),'a distant opponent cannot keep the autonomous defensive line waiting forever');
  const wall=make(p);wall.navigation={};wall.time=.1;wall.tactics.update(wall,wall.units);assert.equal(state(wall),null,'fortress bypass');
}
console.log('PASS commander compatibility, exposed/protected French targets, actual Qin fallback, persistent bounded orders and fortress bypass');

for(const p of profiles)for(const team of [0,1]) {
  const b=make(p,team);b.setActiveTeam(1-team);b.select('all');b.engageSelected();
  advance(b,20);
  const history=state(b,team)?.history.map(h=>h.phase)||[];
  assert.ok(history.some(phase=>!['assemble','done'].includes(phase)),`${p.id}/${team} reacts to an advancing army from default deployment`);
  if(p.kind==='crossbows')assert.ok(history.includes('fallback'));
  if(p.kind==='cells')assert.ok(history.includes('execute'));
}
console.log('PASS all 10 doctrines against advancing opponents from default deployment, both teams');
