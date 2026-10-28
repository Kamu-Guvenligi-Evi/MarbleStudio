import assert from 'node:assert/strict';
import { SiegeBattle, ATTACKERS, DEFENDERS } from '../src/crown-siege.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<.001,`${a} ~= ${b}`);
const quiet=()=>{const b=new SiegeBattle({activeTeam:DEFENDERS});for(const u of b.units){u.order={kind:'hold'};u.cooldown=1000;}return b;};
const tick=(b,seconds)=>{for(let i=0;i<Math.round(seconds*30);i++)b.updateEquipment(1/30);};
{
  const b=quiet(),r=b.ram,crew=b.units.filter(u=>u.duty==='ram').slice(0,4);
  tick(b,1);assert.equal(r.x,600,'No crew, no motion');
  for(const u of crew){u.order=null;u.x=600;u.y=480;}
  tick(b,1);near(r.x,595);assert.equal(r.crew,4);
  crew[0].order={kind:'hold'};tick(b,1);near(r.x,595);
  crew[0].order=null;r.x=158;for(const u of crew){u.x=160;u.y=480;}
  b.damageGate(800);assert.ok(b.useTactic('repair'));const old=b.gate.hp;
  tick(b,4.4);assert.equal(r.hits,0);assert.ok(b.gate.hp>old);
  tick(b,.2);assert.equal(r.hits,1);assert.equal(b.defense.repair,0,'Ram interrupts repairs');
  r.hp=0;const stopped=r.hits;tick(b,10);assert.equal(r.hits,stopped);
  assert.equal(b.siegeDuty(crew[0],.05),false,'Destroyed ram releases crew to gate assault');
}
{
  const b=quiet(),l=b.ladders[0],workers=b.units.filter(u=>u.duty==='ladder'&&u.ladderId===0).slice(0,3);
  for(const u of workers){u.x=l.x;u.y=l.y;}
  workers[0].order=null;tick(b,2);assert.equal(l.build,0,'A lone soldier cannot raise a ladder');
  for(const u of workers)u.order=null;
  tick(b,10.1);assert.equal(l.build,l.required);assert.ok(l.climber);
  const climbing=l.climber;assert.equal(climbing.x,142);
  for(let i=0;i<120;i++)b.siegeDuty(climbing,1/30);
  assert.ok(climbing.climb);assert.ok(climbing.x>68&&climbing.x<142,'No instant crossing');
  tick(b,.1);assert.equal(l.climber,climbing,'One climber per ladder');
  for(let i=0;i<31;i++)b.siegeDuty(climbing,1/30);
  assert.equal(climbing.climb,null);assert.equal(l.crossed,1);near(climbing.x,68);
  const wallArcher=b.units.find(u=>u.wall&&u.team===DEFENDERS);
  wallArcher.x=climbing.x;wallArcher.y=climbing.y;
  assert.ok(b.clearShot(climbing,wallArcher,false),'Melee works on parapet');
  const hp=wallArcher.hp;b.hit(wallArcher,10,climbing);assert.equal(wallArcher.hp,hp-10);
  for(const u of b.units)if(u.team===DEFENDERS)u.hp=0;
  b.siegeDuty(climbing,.05);assert.equal(climbing.wall,false);assert.equal(climbing.x,22);
  assert.ok(b.navigation.free(climbing,3));assert.equal(b.gate.hp,b.gate.maxHp);
  climbing.x=b.capture.x;climbing.y=b.capture.y;climbing.order={kind:'hold'};
  b.updateUnits(.05);near(b.capture.progress,.05);assert.equal(b.phase,'courtyard','Ladders open the courtyard without breaking gate');
}
{
  const b=quiet(),l=b.ladders[0],u=b.units.find(u=>u.duty==='ladder'&&u.ladderId===0);
  l.build=l.required;l.climber=u;u.wall=true;u.climb={ladder:0,progress:.3};u.x=120;u.y=l.y;
  assert.ok(b.useTactic('oil','north'));assert.equal(b.defense.supplies,65);
  assert.equal(b.useTactic('oil','north'),false,'Cooldown prevents duplicate oil');
  tick(b,1.9);assert.equal(l.hp,l.maxHp,'Oil telegraph must give time to react');
  tick(b,4.5);assert.equal(l.hp,0);assert.equal(u.wall,false);assert.equal(u.climb,null);
  assert.ok(u.hp<100,'Climber takes a fall');assert.equal(b.siegeStats.laddersLost,1);
  tick(b,25);assert.equal(l.hp,l.maxHp);assert.equal(l.build,0);
  assert.ok(b.defense.supplies>65,'Supplies regenerate');
}
{
  const b=quiet();assert.equal(b.useTactic('repair'),false,'No repair on full gate');
  b.damageGate(700);assert.ok(b.useTactic('repair'));tick(b,12);near(b.gate.hp,3440);
  b.damageGate(4000);tick(b,30);assert.equal(b.useTactic('repair'),false,'Cannot resurrect breached gate');
  b.defense.supplies=24;assert.equal(b.useTactic('volley'),false);
  b.defense.supplies=100;assert.ok(b.useTactic('volley'));assert.equal(b.defense.volley,8);
  const archer=b.units.find(u=>u.wall);const before=archer.cooldown;b.updateUnits(.05);near(before-archer.cooldown,.09);
  b.activeTeam=ATTACKERS;assert.equal(b.useTactic('oil'),false,'Attackers cannot spend defense supplies');
  assert.ok(b.setPlan('walls'));assert.equal(b.units.filter(u=>u.duty==='ladder').length,28);
  assert.ok(b.setPlan('gate'));assert.equal(b.units.filter(u=>u.duty==='ladder').length,8);
  assert.equal(b.setPlan('invalid'),false);
  const fallen=b.units.find(u=>u.duty==='ram');fallen.hp=0;b.setPlan('balanced');
  assert.equal(b.units.filter(u=>u.hp>0&&u.duty==='ram').length,12,'Replans allocate living crew');
  b.activeTeam=DEFENDERS;assert.equal(b.setPlan('walls'),false);
}
{
  const b=quiet(),u=b.units.find(u=>u.duty==='gate');u.x=500;u.y=480;
  b.shields=true;b.hit(u,20,undefined,{x:68,y:480},'arrow');near(u.hp,87);
  b.shields=false;b.hit(u,20,undefined,{x:68,y:480},'arrow');near(u.hp,67);
  u.x=b.ram.x;u.y=b.ram.y;b.hit(u,20,undefined,{x:68,y:480},'arrow');near(u.hp,54);
  b.useTactic('oil');b.ram.x=158;tick(b,3);assert.ok(b.ram.hp<b.ram.maxHp,'Oil damages equipment');
}
console.log('PASS siege operations: crew, ram, plans, shields, ladders, wall combat, descent, oil, repair, volley, supplies, role authorization');
