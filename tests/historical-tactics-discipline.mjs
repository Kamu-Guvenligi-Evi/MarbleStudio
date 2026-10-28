import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { CIVILIZATION_DOCTRINES as profiles } from '../src/historical-civilization-tactics.js';
import leaders from '../src/historical-commanders.json' with { type:'json' };

function setup(kind,team,enemy={roman:24},expandedMap=true) {
  const profile=profiles.find(p=>p.kind===kind);
  const roster=Object.fromEntries(Object.entries(profile.required).map(([r,n])=>[Object.keys(profile.roles).find(t=>profile.roles[t]===r),n*2]));
  const armies=[enemy,enemy],commanders=[null,null];
  armies[team]=roster;commanders[team]=leaders.find(l=>l.doctrineIds.includes(profile.id)).id;
  const b=new Battle({seed:42,historicalArmies:armies,commanders,expandedMap});
  b.setActiveTeam(1-team);b.select('all');b.stopSelected();
  b.time=.1;b.tactics.update(b,b.units);
  const d=b.tactics.civilizations,s=d.teams[team];assert.ok(s);
  const place=(u,f,a)=>{Object.assign(u,d.point(s,f,a));if(u.order?.kind==='hold')Object.assign(u.order,{x:u.x,y:u.y});};
  s.members.forEach(m=>place(m.unit,m.f,m.a));
  const enemies=b.units.filter(u=>u.team!==team&&!u.commanderId);
  const tick=()=>{b.time+=.5;b.tactics.update(b,b.units.filter(u=>u.hp>0&&!u.removed));};
  return {b,d,s,place,enemies,tick};
}
const forward=(p,s)=>(p.x-s.origin.x)*s.forward.x+(p.y-s.origin.y)*s.forward.y;

for(const team of [0,1]) {
  for(const [kind,enemy] of [['hold',{roman:24}],['pikes',{kipchak_lancer:24}]]) {
    const c=setup(kind,team,enemy);
    c.enemies.forEach((u,i)=>c.place(u,160,(i-12)*5));c.tick();
    assert.equal(c.s.phase,'hold');
    c.b.time=45;c.tick();
    assert.equal(c.s.phase,'hold',`${kind}: elapsed time alone must not break a defensive line`);
    assert.equal(c.s.advance,0);
    assert.ok(c.s.members.every(m=>c.d.intents.has(m.unit.id)));
  }
  const c=setup('hold',team);
  c.enemies.forEach((u,i)=>c.place(u,300,(i-12)*5));c.tick();
  const m=c.s.members[0],u=m.unit,target=c.enemies[0],anchor=c.d.point(c.s,m.f,m.a);
  c.place(target,m.f+u.combatProfile.config.reach-1,m.a);
  u.cooldown=0;u.attack=0;u.target=target;u.headingX=c.s.forward.x;u.headingY=c.s.forward.y;
  assert.equal(c.d.steer(c.b,u,target,1/30),true,'defensive contact remains under line control');
  assert.equal(u.pendingAttack?.target,target,'a held line still attacks within actual reach');
  u.pendingAttack=null;u.attack=0;
  c.place(target,m.f+220,m.a);
  c.place(u,m.f+42,m.a);
  const before=Math.hypot(u.x-anchor.x,u.y-anchor.y);
  for(let i=0;i<60;i++)c.d.steer(c.b,u,target,1/30);
  assert.ok(Math.hypot(u.x-anchor.x,u.y-anchor.y)<before-10,'defender returns to line instead of chasing a retreat');
}
console.log('PASS mirrored defensive lines persist after 45s, fight locally and reject pursuit');

for(const team of [0,1]) {
  const c=setup('opportunity',team,{achaemenid_archer:12,landsknecht:24});
  c.enemies.forEach((u,i)=>c.place(u,u.combatProfile.ranged?250:600,(i%12-6)*5));
  c.tick();c.tick();assert.equal(c.s.phase,'charge');
  c.enemies.filter(u=>!u.combatProfile.ranged).forEach((u,i)=>c.place(u,220,(i-12)*5));
  c.tick();assert.equal(c.s.phase,'wait','closing the opportunity cancels the approach without ordering a frontal attack');
  assert.ok(c.s.members.every(m=>c.d.intents.has(m.unit.id)));
  c.b.time=45;c.tick();
  assert.notEqual(c.s.phase,'done','protected enemy is reassessed instead of timer-forced free attack');
}
console.log('PASS French cavalry reassesses a newly protected target on both sides');

for(const team of [0,1]) {
  const c=setup('wings',team,{landsknecht:24});
  c.enemies.forEach((u,i)=>c.place(u,180,(i-12)*8));c.tick();
  assert.equal(c.s.phase,'execute');
  for(const m of c.s.members.filter(m=>m.role!=='bow')) {
    const intent=c.d.intents.get(m.unit.id);assert.ok(intent);
    assert.ok(forward(intent.goal,c.s)<=m.f+c.s.advance+1,'Ottoman wings clear the front sideways first');
  }
  const line=setup('hoplites',team);
  line.enemies.forEach((u,i)=>line.place(u,500,(i-12)*6));line.tick();
  const initial=line.s.advance;
  line.s.members.forEach((m,i)=>line.place(m.unit,m.f+initial-(i<line.s.members.length*.7?150:0),m.a));
  line.tick();assert.equal(line.s.advance,initial,'the front waits for lagging ranks');
  line.s.members.forEach(m=>line.place(m.unit,m.f+initial,m.a));line.tick();
  assert.ok(line.s.advance>initial,'a reunited line resumes advancing');
}
console.log('PASS Ottoman lateral clearance and Greek cohesion-controlled advance, both teams');

for(const team of [0,1]) {
  // Default compact deployment spans almost the whole battlefield: there is
  // deliberately no safe route around these stationary infantry ranks.
  const c=setup('wings',team,{roman:24},false);c.tick();
  const blocked=c.s.members.filter(m=>m.flankBlocked);
  assert.ok(blocked.length>0,'compact battlefield exercises blocked wings');
  assert.equal(c.s.phase,'execute');
  for(const m of blocked) {
    const intent=c.d.intents.get(m.unit.id);assert.ok(intent);
    assert.ok(c.d.inside(c.b,intent.goal));
    assert.ok(forward(intent.goal,c.s)<=m.f+c.s.advance+1,'blocked wing stays with the centre');
    assert.ok(!m.rounded,'a blocked route cannot count as a completed envelopment');
  }
  const french=setup('opportunity',team,{roman:24},false);french.tick();
  french.b.time=45;french.tick();
  assert.equal(french.s.phase,'wait','no open target and no flank route: retain the cavalry reserve');
  assert.ok(french.s.members.every(m=>french.d.intents.has(m.unit.id)));

  const stalled=setup('hoplites',team);
  stalled.s.members.forEach(m=>stalled.place(m.unit,m.f-110,m.a));
  stalled.b.time=13;stalled.tick();
  assert.equal(stalled.s.phase,'done','failed assembly still has a bounded exit');
  assert.equal(stalled.d.intents.size,0);
}
console.log('PASS compact-map cavalry restraint and bounded failed assembly, both teams');
