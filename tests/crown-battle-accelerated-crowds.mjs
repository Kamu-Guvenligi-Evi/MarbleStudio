import assert from 'node:assert/strict';
import {Battle} from '../src/crown-battle.js';
import {npcWaypoint} from '../src/crown-battle-npc-routing.js';
function fixture(type, enemy, count = 2500) {
 const army=t=>({sword:0,pike:0,archer:0,cavalry:0,[t]:count/2});
 const b=new Battle({seed:71,armies:[army(type),army(enemy)],tacticalAI:false});
 const a=b.units.find(u=>u.team===0),z=b.units.find(u=>u.team===1);
 for(const u of b.units)if(u!==a&&u!==z)u.hp=0;
 Object.assign(a,{x:200,y:450,cooldown:100,chargeCooldown:100,headingX:1,headingY:0,order:{kind:'hold'}});
 Object.assign(z,{x:300,y:450,cooldown:100,chargeCooldown:100,headingX:-1,headingY:0,order:{kind:'hold'}});
 return {b,a,z};
}
for (const dt of [.2, .4]) {
function tick(b) {while(!b.advanceFrame(dt,2)){};}
{
 const {b,a,z}=fixture('archer','sword',6000);tick(b);b.resolveAttack(a,z,true);
 assert.equal(b.projectiles.length,1);
 for(let i=0;i<20&&b.projectiles.length;i++)tick(b);
 assert(z.hp<z.maxHp,'accelerated arrow must hit the stationary body across coarse steps');
 assert.equal(b.projectiles.length,0);
 assert.equal(b.units.length,6000);
}
{
 const {b,a,z}=fixture('sword','sword');z.x=212;tick(b);
 a.cooldown=0;b.attack(a,z,12);a.cooldown=100;
 for(let i=0;i<3;i++)tick(b);
 assert(z.hp<z.maxHp,'accelerated melee must resolve its wind-up');
 assert.equal(a.pendingAttack,null);
 for(const u of [a,z])for(const k of ['x','y','hp','headingX','headingY'])assert(Number.isFinite(u[k]),k);
}
{
 const {b,a,z}=fixture('cavalry','sword');z.x=225;a.order=null;
 tick(b);b.startCharge(a,z);
 for(let i=0;i<10&&z.hp===z.maxHp;i++)tick(b);
 assert(z.hp<z.maxHp,'accelerated cavalry must retain swept contact');
}
{
 const {b}=fixture('sword','sword');b.step(.2);
 assert.equal(b.time,.05,'synchronous replay retains its fixed-step limit');
}
{
 const {b,a,z}=fixture('sword','sword');
 a.target=z;a.stuck=3;a.retarget=.5;
 let searches=0;const choose=b.chooseTarget.bind(b);
 b.chooseTarget=u=>{if(u===a)searches++;return choose(u);};
 tick(b);
 if(dt===.2)tick(b);
 assert.equal(searches,0,'blocked ranks must obey their target search timer');
 tick(b);
 assert.equal(searches,1,'blocked ranks must retry after the timer expires');
}
{
 const {b,a}=fixture('sword','sword');a.order=null;
 b.formationRouteBudget=0;
 const goal={x:400,y:450},radius=u=>u.combatProfile.radius;
 npcWaypoint(b,a,goal,24,.2,radius);const route=a.npcRoute;
 for(let i=0;i<20;i++){b.time+=.2;npcWaypoint(b,a,goal,24,.2,radius);}
 assert.equal(a.npcRoute,route,'continuous 4x walking must retain its route history');
 assert(route.stalled>=2.2,'stalled crowds must still become eligible for a detour');
 b.time+=1;npcWaypoint(b,a,goal,24,.2,radius);
 assert.notEqual(a.npcRoute,route,'genuinely interrupted movement resets the route');
}
}
// Sustained close combat must retain weapon cadence at the largest live step.
const swings = dt => {
 const {b,a,z}=fixture('sword','sword',6000);z.x=212;a.cooldown=0;
 let count=0;b.resolveAttack=u=>{if(u===a)count++;};
 for(let elapsed=0;elapsed<24-1e-8;elapsed+=dt)while(!b.advanceFrame(dt,1000)){}
 return count;
};
const normal=swings(.05),accelerated=swings(.4);
assert(Math.abs(normal-accelerated)<=2,`weapon cadence changed: ${normal} vs ${accelerated}`);
console.log('PASS accelerated crowd steps: arrows, melee wind-up, cavalry contact, finite state, route history and synchronous replay limit');
