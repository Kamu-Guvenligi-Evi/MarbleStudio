import assert from 'node:assert/strict';
import './ball-duel-laser.mjs';
import {BallDuel,WEAPONS,normalizeDuel,probeDuel} from '../src/ball-duel.js';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {validateBatch,sourceRecipe,structure} from '../src/factory-recipes.js';
import {contentKeys} from '../scripts/repetition-guard.mjs';

const durations=[],contacts=[],wins=[0,0];
for(let seed=0;seed<300;seed++){
  const game=new BallDuel({seed,hp:[10,15,20][seed%3]});let events=0;
  let healed=[0,0];game.onEvent=e=>{if(e.type==='hit')events++;if(e.type==='heal')healed[e.owner]++;};
  while(game.state==='running'){
    const previous=game.balls.map(b=>b.hp);healed=[0,0];game.step(1/120);
    for(const b of game.balls){assert.ok(Number.isFinite(b.x+b.y+b.vx+b.vy));assert.ok(b.hp>=0&&b.hp<=Math.min(game.settings.hp,previous[b.id]+healed[b.id]));assert.ok(Math.hypot(b.x-300,b.y-514)<=game.arena.r-b.r+.25);}
    assert.ok(game.heartsSpawned<=2);
    assert.ok(game.balls.every(b=>Math.hypot(b.vx,b.vy)>=125-1e-8&&Math.hypot(b.vx,b.vy)<=320+1e-8),'travel stays within the minimum and maximum speed');
    assert.ok(game.bullets.length<70&&game.particles.length<=110&&game.pickups.length<=3);
  }
  assert.ok(game.time<=90.01);assert.equal(events,game.hits);
  if(game.winner!==null){assert.equal(game.balls[1-game.winner].hp,0);assert.ok(game.balls[game.winner].hp>0);wins[game.winner]++;}
  const end=game.balls.map(b=>[b.x,b.y,b.hp]);game.step(.1);assert.deepEqual(game.balls.map(b=>[b.x,b.y,b.hp]),end);
  durations.push(game.time);contacts.push(game.collisions);
}
assert.ok(wins[0]>80&&wins[1]>80,'both sides can win');
const play=seed=>{const g=new BallDuel({seed});while(g.state==='running')g.step(1/120);return {time:g.time,winner:g.winner,hits:g.hits,hp:g.balls.map(b=>b.hp)};};
assert.deepEqual(play(42),play(42));assert.notDeepEqual(play(42),play(43));
const quiet=()=>{const game=new BallDuel();game.nextPickup=Infinity;game.nextHeart=Infinity;game.pickups=[];for(const b of game.balls){b.cooldown=Infinity;b.vx*=230/b.speed;b.vy*=230/b.speed;b.speed=230;}return game;};
// A floor heart heals once without changing motion, equipment or damage immunity.
const healing=quiet(),patient=healing.balls[0],healEvents=[];
Object.assign(patient,{hp:14,weapon:'rocket',weaponUntil:10,invulnerable:.1});
healing.heart={x:patient.x,y:patient.y,until:7};healing.onEvent=e=>healEvents.push(e);
const unchanged=[patient.vx,patient.vy,patient.weapon,patient.invulnerable];
healing.updateHeart();healing.updateHeart();
assert.equal(patient.hp,15);assert.equal(healing.heart,null);assert.equal(healEvents.length,1);assert.equal(healEvents[0].type,'heal');
assert.deepEqual([patient.vx,patient.vy,patient.weapon,patient.invulnerable],unchanged);
// Full-health contestants leave hearts for an injured opponent; expired hearts cannot heal.
healing.heart={x:patient.x,y:patient.y,until:7};healing.updateHeart();assert.ok(healing.heart);assert.equal(patient.hp,15);
Object.assign(healing.balls[1],{x:patient.x,y:patient.y,hp:13});healing.updateHeart();assert.equal(healing.balls[1].hp,14);assert.equal(healing.heart,null);
healing.heart={x:patient.x,y:patient.y,until:healing.time};patient.hp=14;healing.updateHeart();assert.equal(patient.hp,14);assert.equal(healing.heart,null);
// Sparse deterministic schedule: first at 12–18 s, at least 18 s apart, at most two.
const schedule=()=>{const game=quiet(),spawns=[];game.nextHeart=12+game.heartRandom()*6;let count=0;
  while(game.state==='running'){game.step(1/120);if(game.heartsSpawned!==count){count=game.heartsSpawned;spawns.push({time:game.time,x:game.heart.x,y:game.heart.y});}}
  assert.equal(game.heartsSpawned,2);return spawns;};
const spawns=schedule();assert.deepEqual(spawns,schedule());assert.ok(spawns[0].time>=12&&spawns[0].time<=18.01);assert.ok(spawns[1].time-spawns[0].time>=18);
const initialHeart=new BallDuel();assert.ok(initialHeart.nextHeart>=12&&initialHeart.nextHeart<18);
const dead=quiet();dead.balls[0].hp=0;dead.heart={x:dead.balls[0].x,y:dead.balls[0].y,until:7};dead.updateHeart();assert.equal(dead.balls[0].hp,0);
dead.state='finished';dead.balls[0].hp=1;dead.step(1/120);assert.equal(dead.balls[0].hp,1);
// No free weapon: the opening pickup, later pickups and expiration govern attacks.
const unarmed=quiet();for(const b of unarmed.balls)b.cooldown=0;unarmed.step(.25);assert.equal(unarmed.shots,0);assert.ok(unarmed.balls.every(b=>b.weapon===null));
const armed=quiet();Object.assign(armed.balls[0],{weapon:'blaster',weaponUntil:1,cooldown:0});armed.step(1/120);assert.equal(armed.shots,1);
armed.bullets=[];armed.time=1;armed.balls[0].cooldown=0;armed.step(1/120);assert.equal(armed.balls[0].weapon,null);assert.equal(armed.shots,1);
const opening=new BallDuel();assert.deepEqual(opening.balls.map(b=>b.y),[514,514]);assert.equal(opening.pickups[0].weapon,'blaster');
while(opening.time<1.5)opening.step(1/120);assert.ok(opening.collisions>0&&opening.shots>0);
// Contact separates the balls, preserves a bounded speed increase and never deals damage.
const contact=quiet();Object.assign(contact.balls[0],{x:275,y:514,vx:230,vy:0});Object.assign(contact.balls[1],{x:325,y:514,vx:-230,vy:0});
contact.step(1/120);assert.equal(contact.collisions,1);assert.ok(contact.balls[0].vx<-230&&contact.balls[1].vx>230);
contact.step(.1);assert.equal(contact.collisions,1);assert.ok(contact.balls.every(b=>b.hp===15&&Math.hypot(b.vx,b.vy)>250));
assert.ok(contact.balls[1].x-contact.balls[0].x>=contact.balls[0].r+contact.balls[1].r);
// Contact transfers unequal velocities instead of forcing both contestants to the same speed.
const transfer=quiet();Object.assign(transfer.balls[0],{x:275,y:514,vx:230,vy:0,speed:230});Object.assign(transfer.balls[1],{x:325,y:514,vx:-40,vy:0,speed:40});transfer.step(1/120);
assert.ok(Math.abs(transfer.balls[0].vx+125)<1e-8);assert.ok(Math.abs(transfer.balls[1].vx-262.2)<1e-8);
transfer.step(.1);assert.equal(transfer.balls[0].speed,125);assert.ok(transfer.balls[1].speed>230);
// Head-on damage reverses motion promptly, even at the highest travel speed.
for(const speed of [0,100,205,320]){const rebound=quiet();Object.assign(rebound.balls[1],{vx:-speed,vy:0,speed});rebound.damage(rebound.balls[1],1,0,{x:1,y:0});assert.ok(rebound.balls[1].vx>=125&&rebound.balls[1].vx<=200);assert.equal(rebound.balls[1].vy,0);}
assert.ok(new BallDuel().balls.every(b=>Math.abs(Math.hypot(b.vx,b.vy)-205)<1e-8));
// Repeated late-game impacts cannot accumulate lasting speed; heading still persists.
for(const time of [0,30,60]){
  const recovery=quiet();recovery.time=time;recovery.arena.r=100000;
  Object.assign(recovery.balls[0],{x:-10000,y:0});
  const target=recovery.balls[1];Object.assign(target,{x:300,y:514,vx:0,vy:205,speed:205});
  for(let hit=0;hit<4;hit++){target.invulnerable=0;recovery.damage(target,1,0,{x:1,y:0});}
  const heading=Math.atan2(target.vy,target.vx);assert.ok(target.speed<=320);
  for(let step=0;step<360;step++)recovery.step(1/120);
  assert.ok(target.speed>=205&&target.speed<215);assert.ok(Math.abs(Math.atan2(target.vy,target.vx)-heading)<1e-10);
}
// Glancing and rim contacts must also separate without leaving the arena.
const glancing=quiet();Object.assign(glancing.balls[0],{x:275,y:499,vx:230,vy:0});Object.assign(glancing.balls[1],{x:325,y:529,vx:-230,vy:0});
glancing.step(.06);assert.equal(glancing.collisions,1);assert.ok(Math.hypot(glancing.balls[0].x-glancing.balls[1].x,glancing.balls[0].y-glancing.balls[1].y)>=glancing.balls[0].r+glancing.balls[1].r-.01);
const rim=quiet();for(let i=0;i<2;i++)Object.assign(rim.balls[i],{x:530,y:514+(i?20:-20),vx:0,vy:i?-230:230});rim.step(1/120);
assert.ok(rim.balls.every(b=>Math.hypot(b.x-300,b.y-514)<=rim.arena.r-b.r+.001));assert.ok(Math.hypot(rim.balls[0].x-rim.balls[1].x,rim.balls[0].y-rim.balls[1].y)>rim.balls[0].r+rim.balls[1].r-.1);
// Tangential starts must leave the rim, at every speed and in both directions.
for(const speed of [125,205,320])for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2])for(const sign of [-1,1]){
  const orbit=quiet(),ball=orbit.balls[0],limit=orbit.arena.r-ball.r,nx=Math.cos(angle),ny=Math.sin(angle);
  Object.assign(ball,{x:300+nx*(limit-.1),y:514+ny*(limit-.1),vx:-ny*sign*speed,vy:nx*sign*speed,speed});
  Object.assign(orbit.balls[1],{x:300,y:514,vx:0,vy:0,speed:0});
  let walls=0,closest=Infinity;orbit.onEvent=e=>{if(e.type==='wall'&&e.owner===0)walls++;};
  for(let frame=0;frame<720;frame++){
    orbit.step(1/120);const radius=Math.hypot(ball.x-300,ball.y-514);closest=Math.min(closest,radius);
    assert.ok(radius<=limit+1e-8);assert.ok(Math.abs(Math.hypot(ball.vx,ball.vy)-speed)<1e-8,'wall correction preserves speed');
  }
  assert.ok(closest<limit*.8,'grazing balls reach the interior');
  assert.ok(walls>0&&walls<=8,'no repeated wall chatter');
  assert.equal(orbit.collisions,0,'the wall alone releases the orbit');
}
// Steep wall rebounds retain the physical reflection, without added steering.
const steep=quiet(),wallBall=steep.balls[0];
Object.assign(wallBall,{x:530,y:514,vx:200,vy:50});steep.contain(wallBall);
assert.equal(wallBall.vx,-200);assert.equal(wallBall.vy,50);
// Neither guns nor swords steer toward the opponent, even long after the last contact.
for(const weapon of ['blaster','blade']){const free=quiet();free.time=8;Object.assign(free.balls[0],{x:220,y:490,vx:230,vy:0,weapon,weaponUntil:100});Object.assign(free.balls[1],{x:420,y:550,vx:0,vy:230});free.step(1/120);assert.equal(free.balls[0].vx,230);assert.equal(free.balls[0].vy,0);}
// Damage changes heading persistently; a stronger hit deflects and slides farther.
const struck=amount=>{const game=quiet(),target=game.balls[1];Object.assign(game.balls[0],{x:180,y:450,vx:0,vy:0});Object.assign(target,{x:400,y:514,vx:0,vy:230});game.damage(target,amount,0,{x:1,y:0});return {game,target};};
const light=struck(WEAPONS.blaster.damage),medium=struck(WEAPONS.blade.damage),heavy=struck(WEAPONS.rocket.damage);
for(const [weaker,stronger] of [[light,medium],[medium,heavy]]){
  assert.ok(stronger.target.vx/stronger.target.vy>weaker.target.vx/weaker.target.vy);
  assert.ok(stronger.target.speed>weaker.target.speed&&stronger.target.kx>weaker.target.kx);
}
assert.ok(heavy.target.kx<light.target.kx*2&&heavy.target.vx<light.target.vx*2,'rocket recoil stays below twice a light hit');
assert.deepEqual([light.target.hp,medium.target.hp,heavy.target.hp],[14,13,12]);
for(const weapon of ['burst','scatter']){const hit=struck(WEAPONS[weapon].damage);assert.equal(hit.target.speed,light.target.speed);assert.equal(hit.target.kx,light.target.kx);}
assert.ok(Math.atan2(light.target.vx,light.target.vy)>Math.PI/9,'a side hit still changes heading by over 20 degrees');
assert.ok(light.target.kx<=40&&heavy.target.kx<=60,'damage adds a short, restrained slide');
const repeated=struck(WEAPONS.rocket.damage);
for(let hit=0;hit<3;hit++){repeated.target.invulnerable=0;repeated.game.damage(repeated.target,WEAPONS.rocket.damage,0,{x:1,y:0});}
assert.ok(repeated.target.speed<=320&&Math.hypot(repeated.target.kx,repeated.target.ky)<=100+1e-8,'repeated strong hits keep speed and slide bounded');
const heading=Math.atan2(light.target.vy,light.target.vx),kick=light.target.kx;
light.game.step(.25);assert.ok(Math.abs(Math.atan2(light.target.vy,light.target.vx)-heading)<1e-10);assert.ok(light.target.kx<kick*.2&&light.target.x>420);
const blocked=struck(1),before=[blocked.target.vx,blocked.target.vy,blocked.target.kx,blocked.target.ky,blocked.target.hp];assert.equal(blocked.game.damage(blocked.target,3,0,{x:-1,y:0}),false);assert.deepEqual([blocked.target.vx,blocked.target.vy,blocked.target.kx,blocked.target.ky,blocked.target.hp],before);
// A projectile must hit the other ball, never its owner, and cannot tunnel past a target.
const g=new BallDuel();g.balls[0].x=200;g.balls[0].y=514;g.balls[1].x=400;g.balls[1].y=514;
for(const b of g.balls){b.vx=0;b.vy=0;b.cooldown=100;}
g.bullets=[{x:200,y:514,vx:100000,vy:0,owner:0,weapon:'blaster',r:3,damage:1,life:2}];g.step(1/120);
assert.equal(g.balls[0].hp,15);assert.equal(g.balls[1].hp,14);assert.equal(g.hits,1);
// Edge hits from the same trajectory deflect in opposite directions; effects start at the surface.
for(const angle of [0,Math.PI/2,Math.PI,3*Math.PI/2])for(const offset of [-20,0,20]){
  const edge=quiet(),target=edge.balls[1],nx=Math.cos(angle),ny=Math.sin(angle),px=-ny,py=nx;
  Object.assign(edge.balls[0],{x:130,y:400,vx:0,vy:0,speed:0});
  Object.assign(target,{x:300,y:514,vx:0,vy:0,speed:0});
  const events=[];edge.onEvent=e=>events.push(e);
  edge.bullets=[{x:300-nx*70+px*offset,y:514-ny*70+py*offset,vx:nx*12000,vy:ny*12000,owner:0,weapon:'blaster',r:3.5,damage:1,life:2}];
  edge.step(1/120);assert.equal(target.hp,14);assert.equal(edge.bullets.length,0);
  const lateral=target.vx*px+target.vy*py;
  assert.ok(target.vx*nx+target.vy*ny>0);
  if(offset===0)assert.ok(Math.abs(lateral)<1e-8);else assert.ok(lateral*offset<0,'upper/lower edge contacts must deflect oppositely');
  const hit=events.find(e=>e.type==='hit');assert.ok(hit);
  assert.ok(Math.abs(Math.hypot(hit.x-300,hit.y-514)-target.r)<1e-8);
  assert.ok(offset===0||((hit.x-300)*px+(hit.y-514)*py)*offset>0);
}
// Relative sweeps also catch a moving target crossing a stationary projectile between frames.
const crossing=quiet();Object.assign(crossing.balls[0],{x:130,y:400,vx:0,vy:0,speed:0});
Object.assign(crossing.balls[1],{x:300,y:514,vx:12000,vy:0,speed:12000});
crossing.bullets=[{x:350,y:514,vx:0,vy:0,owner:0,weapon:'blaster',r:3.5,damage:1,life:2}];
crossing.step(1/120);assert.equal(crossing.balls[1].hp,14);assert.ok(crossing.balls[1].vx<0);
// A near miss remains a miss, including fast projectiles.
const miss=quiet();for(const b of miss.balls)Object.assign(b,{vx:0,vy:0,speed:0});
Object.assign(miss.balls[1],{x:300,y:514});
miss.bullets=[{x:230,y:550,vx:12000,vy:0,owner:0,weapon:'blaster',r:3.5,damage:1,life:2}];
miss.step(1/120);assert.equal(miss.balls[1].hp,15);
g.balls[1].invulnerable=0;g.balls[1].hp=1;g.damage(g.balls[1],3,0);assert.equal(g.state,'finished');assert.equal(g.winner,0);
const pickup=new BallDuel();pickup.pickups=[{x:pickup.balls[0].x,y:pickup.balls[0].y,weapon:'rocket',until:10}];pickup.step(1/120);assert.equal(pickup.balls[0].weapon,'rocket');assert.equal(pickup.pickups.length,0);
const source=normalizeSnapshot({mode:'ball-duel',project:{seed:42,theme:'aurora',names:['Brazil','Argentina']}});
const options=validateBatch({source,strategy:'exact'}),recipe=sourceRecipe(options.source,42);
assert.equal(recipe.mode,'ball-duel');assert.equal(recipe.count,2);
assert.throws(()=>validateBatch({source,strategy:'variations'}));assert.throws(()=>validateBatch({modes:['ball-duel']}));
for(const p of [{hp:999},{seed:-1},{playbackSpeed:99},{ballImages:['https://invalid.example/image']}])assert.throws(()=>normalizeDuel(p));
const normal=probeDuel(recipe),fast=probeDuel({...recipe,playbackSpeed:2});assert.equal(normal.winner,fast.winner);assert.equal(normal.simulationSeconds/2,fast.simulationSeconds);
assert.notEqual(structure(recipe),structure({...recipe,hp:20}));assert.notEqual(contentKeys(recipe).exact,contentKeys({...recipe,seed:99}).exact);assert.notEqual(contentKeys(recipe).similar,contentKeys({...recipe,colors:['#000000','#ffffff']}).similar);
durations.sort((a,b)=>a-b);contacts.sort((a,b)=>a-b);console.log('PASS: 300 complete duels, contact acceleration, persistent damage deflection, proportional slide, no homing, bounded physics, deterministic replay and video validation.',JSON.stringify({median:Math.round(durations[150]),max:Math.round(durations.at(-1)),medianContacts:contacts[150],wins}));
