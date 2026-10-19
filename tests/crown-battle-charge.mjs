import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

function pair(enemy='roman') {
  const b=new Battle({seed:1066,historicalArmies:[{hussar:1},{[enemy]:1}]});
  const [a,z]=b.units;
  Object.assign(a,{x:155,y:450,cooldown:1000,chargeCooldown:0});
  Object.assign(z,{x:355,y:450,cooldown:1000,chargeCooldown:1000,order:{kind:'hold'},hp:10000});
  return {b,a,z};
}

for(const hz of [30,60,120]) {
  const {b,a,z}=pair(),dt=1/hz;
  let previousSpeed=0,accelerating=false,impact=false;
  for(let i=0;i<hz*5;i++) {
    b.step(dt);
    if(a.charge) {
      if(!previousSpeed)assert(a.speed<115,'charge starts below maximum speed');
      if(previousSpeed&&a.speed>previousSpeed)accelerating=true;
      previousSpeed=a.speed;
    }
    if(z.stagger>0) {impact=true;break;}
  }
  assert(accelerating&&impact,`${hz} Hz: accelerates and reaches the infantry`);
  assert.equal(b.stats.chargeHits,1);
  assert(b.effects.some(e=>e.kind==='charge-impact'));
  assert(z.vx>0,'impact pushes infantry along the charge');
  const damage=10000-z.hp;
  for(let i=0;i<hz;i++)b.step(dt);
  assert.equal(10000-z.hp,damage,'one hit per target in the same charge');
  assert.equal(z.stagger,0,'stagger expires');
}

{
  const {b,a,z}=pair('spartan');a.x=330;z.headingX=-1;z.headingY=0;
  b.startCharge(a,z);b.step(1/60);
  assert.equal(b.stats.pikeCounters,1);
  assert.equal(a.charge,null,'frontal pike stops the charge');
  assert(!z.stagger,'braced pike does not stagger');
  assert(a.hp<a.maxHp);
}
{
  const {b,a,z}=pair();a.x=330;
  z.pendingAttack={target:a,projectile:false};z.attack=.24;
  b.startCharge(a,z);b.step(1/60);
  assert.equal(z.pendingAttack,null,'impact interrupts the infantry swing');
  assert.equal(a.hp,a.maxHp,'cancelled swing cannot deal damage');
  assert(z.stagger>0);
}
{
  const {b,a,z}=pair();a.x=336;
  for(let i=0;i<720;i++)b.step(1/60);
  assert.equal(b.stats.charges,0,'stationary contact cannot trigger repeated charges');
}
{
  const {b,a,z}=pair('hussar');a.x=330;
  b.startCharge(a,z);b.step(1/60);
  assert(!z.stagger,'mounted opponents do not receive infantry stagger');
}
console.log('PASS Hussar charge: acceleration and impact at 30/60/120 Hz, one hit, recovery, pike counter, interrupted swing, no contact recharge, mounted exemption');
