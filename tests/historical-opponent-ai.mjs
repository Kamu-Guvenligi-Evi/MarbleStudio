import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { CIVILIZATION_DOCTRINES as profiles } from '../src/historical-civilization-tactics.js';
import { assessOpponents, combatant } from '../src/historical-opponent-analysis.js';
import leaders from '../src/historical-commanders.json' with {type:'json'};

const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function setup(kind,team,enemy) {
  const p=profiles.find(p=>p.kind===kind),roster={};
  for(const [role,n] of Object.entries(p.required))roster[Object.keys(p.roles).find(k=>p.roles[k]===role)]=n*2;
  const armies=[enemy,enemy],commanders=[null,null];armies[team]=roster;
  commanders[team]=leaders.find(l=>l.doctrineIds.includes(p.id)).id;
  const b=new Battle({seed:42,historicalArmies:armies,commanders});
  b.setActiveTeam(1-team);b.select('all');b.stopSelected();
  b.time=.1;b.tactics.update(b,b.units);
  const director=b.tactics.civilizations,s=director.teams[team];assert.ok(s);
  for(const m of s.members)Object.assign(m.unit,director.point(s,m.f,m.a));
  const enemies=b.units.filter(u=>u.team!==team&&combatant(u));
  const place=(u,f,a)=>{Object.assign(u,director.point(s,f,a));if(u.order?.kind==='hold'){u.order.x=u.x;u.order.y=u.y;}};
  const tick=()=>{b.time+=.5;b.tactics.update(b,b.units);};
  return {b,s,director,enemies,place,tick};
}

for(const team of [0,1]) {
  // Same doctrine, different enemy weapons => a different physical response.
  const melee=setup('hold',team,{roman:24});
  melee.enemies.forEach((u,i)=>melee.place(u,160,(i-12)*5));
  melee.tick();for(let i=0;i<6;i++)melee.tick();
  assert.equal(melee.s.phase,'hold');assert.equal(melee.s.advance,0);
  const missiles=setup('hold',team,{achaemenid_archer:24});
  missiles.enemies.forEach((u,i)=>missiles.place(u,150,(i-12)*5));
  missiles.tick();for(let i=0;i<6;i++)missiles.tick();
  assert.equal(missiles.s.phase,'execute');assert.ok(missiles.s.advance>0);
  const before=missiles.s.members.map(m=>({x:m.unit.x,y:m.unit.y}));
  for(let i=0;i<30;i++)missiles.b.step(1/30);
  assert.ok(missiles.s.members.some((m,i)=>distance(m.unit,before[i])>10));

  const pikes=setup('pikes',team,{kipchak_lancer:24});
  pikes.enemies.forEach((u,i)=>pikes.place(u,160,(i-12)*5));pikes.tick();
  assert.equal(pikes.s.phase,'hold');assert.equal(pikes.s.advance,0);
  assert.equal(pikes.s.opponent.cavalry,24);

  for(const strongSide of [-1,1]) {
    const c=setup('reserve',team,{landsknecht:24});
    c.enemies.forEach((u,i)=>c.place(u,170,strongSide*(40+i*2)));
    c.tick();c.tick();assert.equal(c.s.phase,'flank');assert.equal(c.s.flankAll,true);
    assert.equal(Math.sign(c.s.flank),-strongSide,'avoid the better defended flank');
    const flank=c.s.flank;
    for(const m of c.s.members) {
      const intent=c.director.intents.get(m.unit.id);assert.ok(intent,'front cavalry must also avoid pikes');
      const f=(intent.goal.x-c.s.origin.x)*c.s.forward.x+(intent.goal.y-c.s.origin.y)*c.s.forward.y;
      assert.ok(f<100,'first move sideways, not diagonally through the enemy front');
    }
    const start=c.s.members.map(m=>({x:m.unit.x,y:m.unit.y}));
    for(let frame=0;frame<30;frame++)c.b.step(1/30);
    const lateral=c.s.members.reduce((sum,m,i)=>sum+(m.unit.x-start[i].x)*c.s.side.x+(m.unit.y-start[i].y)*c.s.side.y,0)/c.s.members.length;
    assert.ok(lateral*Math.sign(flank)>8,'the entire cavalry group physically opens toward the selected flank');
    c.enemies.forEach((u,i)=>c.place(u,170,-strongSide*(40+i*2)));
    c.tick();assert.equal(c.s.flank,flank,'moving enemies cannot flip the flank every decision');
    const unit=c.s.members[0].unit,target=c.enemies[0];
    for(const command of ['hold','move','attack','engage']) {
      c.b.setActiveTeam(team);c.b.selected=new Set([unit.id]);
      if(command==='hold')c.b.stopSelected();
      if(command==='move')c.b.moveSelected(unit.x+15,unit.y+15);
      if(command==='attack')c.b.attackSelected(target.id);
      if(command==='engage')c.b.engageSelected();
      assert.equal(c.director.steer(c.b,unit,target,1/30),false,`${command} overrides flank`);
    }
    c.b.commanders[team].hp=0;c.b.time+=.01;c.b.tactics.update(c.b,c.b.units);
    assert.equal(c.s.phase,'done');assert.equal(c.director.intents.size,0);
  }

  const charge=setup('opportunity',team,{achaemenid_archer:2,roman:2});
  const bows=charge.enemies.filter(u=>u.combatProfile.ranged),guards=charge.enemies.filter(u=>!u.combatProfile.ranged);
  charge.place(bows[0],150,0);charge.place(bows[1],170,-170);
  guards.forEach((u,i)=>charge.place(u,120+i*15,10));
  charge.tick();charge.tick();
  assert.equal(charge.s.phase,'charge');assert.equal(charge.s.chargeTarget,bows[1]);
  assert.ok(charge.s.members.every(m=>m.unit.target===bows[1]),'selected opening becomes the real combat target');
  charge.place(guards[0],165,-165);charge.tick();
  assert.equal(charge.s.phase,'wait','new protection cancels an unsafe approach and retains tactical control');
  assert.ok(charge.s.members.every(m=>charge.director.intents.has(m.unit.id)));
}
console.log('PASS both teams: missile response, pike brace, weaker/stable flank, staged movement, exposed target, command priority and leader loss');

for(const team of [0,1]) {
  const armies=[{roman:24},{roman:24}],commanders=[null,null];armies[team]={seljuk_hassa:24};commanders[team]='alp_arslan';
  const b=new Battle({seed:42,historicalArmies:armies,commanders,expandedMap:true});
  b.time=.1;b.tactics.update(b,b.units);const s=b.tactics.teams[team];assert.ok(s);
  const enemies=b.units.filter(u=>u.team!==team&&combatant(u));
  s.phase='retreat';s.since=b.time;s.pursuers=new Map();
  s.retreatStart=b.tactics.point(s,70,0);s.retreatGoal=b.tactics.point(s,-30,0);
  for(const m of s.members)Object.assign(m.unit,b.tactics.point(s,m.role==='bait'?35:15,m.role==='left'?-s.spread:m.role==='right'?s.spread:0));
  enemies.forEach((u,i)=>{Object.assign(u,b.tactics.point(s,120,i-12));s.pursuers.set(u.id,i===0?160:120);});
  b.time+=.5;b.tactics.update(b,b.units);
  assert.equal(s.followers,1);assert.equal(s.phase,'retreat','one scout must not close the trap');
  for(let i=0;i<5;i++)s.pursuers.set(enemies[i].id,160);
  b.time+=.5;b.tactics.update(b,b.units);assert.equal(s.phase,'retreat');assert.equal(s.followers,5);
  // A following group still ahead of the wings is not yet inside the trap.
  s.retreatStart=b.tactics.point(s,90,0);
  for(const m of s.members.filter(m=>m.role==='bait'))Object.assign(m.unit,b.tactics.point(s,-20,0));
  for(let i=0;i<5;i++)Object.assign(enemies[i],b.tactics.point(s,50,i-2));
  b.time+=.5;b.tactics.update(b,b.units);assert.equal(s.phase,'envelop');assert.equal(s.followers,5);
  const rangedArmies=[{achaemenid_archer:24},{achaemenid_archer:24}];rangedArmies[team]={seljuk_hassa:24};
  const ranged=new Battle({seed:42,historicalArmies:rangedArmies,commanders,expandedMap:true});
  ranged.time=.1;ranged.tactics.update(ranged,ranged.units);
  assert.equal(ranged.tactics.teams[team].phase,'done','do not bait a missile-dominated army');
  assert.equal(ranged.tactics.intents.size,0);
}
console.log('PASS both teams: one pursuer rejected, committed group encircled, missile opponent uses ordinary mobile combat');

{
  const c=setup('opportunity',0,{achaemenid_archer:24});
  const sample=c.enemies[0];
  const counts=[];
  for(const n of [4000,8000]) {
    const units=Array.from({length:n},(_,i)=>({...sample,id:i+100,x:400+i%7,y:150+i%700}));
    const a=assessOpponents(c.s,units);counts.push(a.scanned);
    assert.equal(a.count,n);assert.equal(a.ranged,n);assert.ok(a.candidates.length<=4);
    const without=assessOpponents(c.s,[...units,{...sample,commanderId:'alp_arslan',x:1,y:1}]);
    assert.equal(without.count,a.count);assert.equal(without.width,a.width);
  }
  assert.equal(counts[1],counts[0]*2,'doubling army size doubles analysis work');
  const decisions=c.director.stats.decisions;
  for(let i=0;i<10;i++){c.b.time+=.03;c.director.update(c.b,c.b.units);}
  assert.equal(c.director.stats.decisions,decisions,'no per-frame army analysis');
}
console.log('PASS 4,000/8,000-unit linear analysis, at most four candidates, commander exclusion, 2 Hz throttle');
