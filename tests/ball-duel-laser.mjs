import assert from 'node:assert/strict';
import {BallDuel,WEAPONS} from '../src/ball-duel.js';
import {createDuelSoundEvents} from '../src/ball-duel-audio.js';

const setup=()=>{
  const game=new BallDuel();game.pickups=[];game.nextPickup=Infinity;game.nextHeart=Infinity;
  for(const ball of game.balls)Object.assign(ball,{vx:0,vy:0,speed:0,cooldown:Infinity});
  Object.assign(game.balls[0],{x:200,y:514,weapon:'laser',weaponUntil:100,vx:205});
  Object.assign(game.balls[1],{x:400,y:514});
  return game;
};
assert.equal(WEAPONS.laser.damage,3);
// One laser drop per match, including after an uncollected drop disappears.
for(let seed=0;seed<30;seed++){
  const game=new BallDuel({seed});let lasers=0;
  for(let drop=0;drop<35;drop++){
    game.spawnPickup();lasers+=Number(game.pickups.at(-1).weapon==='laser');
    game.pickups=[];game.time+=3;
  }
  assert.equal(lasers,1);
}
const schedule=new BallDuel();
for(let step=0;step<337;step++)schedule.step(1/120);
assert.equal(schedule.laserSpawned,true);
assert.equal(new BallDuel().laserSpawned,false,'replay allows one new laser');

const direct=setup(),sounds=[],soundEvent=createDuelSoundEvents();
direct.onEvent=e=>{const sound=soundEvent(e,direct);if(sound)sounds.push(sound.duelSound);};
direct.fire(direct.balls[0],direct.balls[1]);
assert.deepEqual(direct.balls.map(b=>b.hp),[15,12]);
assert.equal(direct.beams[0].points.length,2);assert.equal(direct.bullets.length,0);
assert.equal(direct.beams[0].points.at(-1).x,363,'wide beam stops when its edge touches the target');
assert.equal(direct.balls[0].weapon,null,'laser is consumed immediately');
assert.ok(sounds.includes('laser'),'consuming the weapon preserves the firing sound');
direct.fire(direct.balls[0],direct.balls[1]);direct.fireLaser(direct.balls[0]);
assert.equal(direct.shots,1,'a collected laser cannot fire twice');
const hp=direct.balls[1].hp;direct.step(.2);
assert.equal(direct.balls[1].hp,hp,'the visible pulse does not apply damage every frame');
assert.equal(direct.beams.length,0);
for(let i=0;i<12;i++)direct.step(.25);
assert.equal(direct.shots,1,'the simulation cannot fire another shot after the old cooldown');

// The wider visible beam also widens damage coverage, without hitting outside it.
for(const offset of [34,40]){
  const wide=setup();wide.balls[0].laserAim=0;wide.balls[1].y+=offset;wide.fire(wide.balls[0],wide.balls[1]);
  assert.equal(wide.balls[1].hp,offset===34?12:15);
}

// Radial shot returns from the wall and hits its owner, not the off-axis rival.
for(const health of [15,3]){
  const self=setup(),shooter=self.balls[0];
  Object.assign(shooter,{x:300,y:514,hp:health,laserAim:0});
  Object.assign(self.balls[1],{x:300,y:350});
  self.fire(shooter,self.balls[1]);
  assert.equal(shooter.hp,health-3);assert.equal(self.balls[1].hp,15);
  const points=self.beams[0].points;
  assert.equal(points.length,3);assert.equal(points[1].x,557);assert.equal(points[2].x,337);
  if(health===3){assert.equal(self.state,'finished');assert.equal(self.winner,1,'self-kill awards the surviving opponent');}
}

// Off-axis incidence reflects about the circular wall normal and reaches a rival.
const reflected=setup(),shooter=reflected.balls[0],target=reflected.balls[1];
Object.assign(shooter,{x:400,y:514,vx:0,vy:205,laserAim:Math.PI/2});
const wall={x:400,y:514+Math.sqrt(257**2-100**2)};
const normal={x:100/257,y:(wall.y-514)/257};
const reflectedDirection={x:-2*normal.y*normal.x,y:1-2*normal.y**2};
Object.assign(target,{x:wall.x+reflectedDirection.x*130,y:wall.y+reflectedDirection.y*130});
reflected.fire(shooter,target);
assert.deepEqual(reflected.balls.map(b=>b.hp),[15,12]);
const points=reflected.beams[0].points;
assert.equal(points.length,3);
assert.ok(Math.hypot(points[1].x-wall.x,points[1].y-wall.y)<1e-8);
assert.ok(Math.abs(Math.hypot(points[2].x-target.x,points[2].y-target.y)-target.r-WEAPONS.laser.width/2)<1e-8);

// Unobstructed paths have a finite bounce budget and remain inside the arena.
for(let angle=0;angle<Math.PI*2;angle+=.13){
  const game=setup(),ball=game.balls[0];game.balls[1].hp=0;
  Object.assign(ball,{x:380,y:480,vx:205*Math.cos(angle),vy:205*Math.sin(angle),laserAim:angle});
  game.fire(ball,game.balls[1]);
  const beam=game.beams[0];assert.ok(beam.points.length<=3,'at most one wall reflection');
  for(const p of beam.points)assert.ok(Number.isFinite(p.x+p.y)&&Math.hypot(p.x-300,p.y-514)<=257+1e-8);
}
// Aim at the rival even when travelling in the opposite direction.
const aimed=setup();Object.assign(aimed.balls[0],{vx:-205,vy:0});
aimed.balls[1].y+=80;aimed.fire(aimed.balls[0],aimed.balls[1]);
assert.equal(aimed.balls[1].hp,12);
assert.equal(aimed.balls[0].vx,-205,'aiming does not steer the shooter');

// Track while charging; freeze before firing so a late change of position can evade.
const charging=setup(),chargingBall=charging.balls[0],rival=charging.balls[1];
chargingBall.cooldown=.3;charging.step(1/120);
assert.equal(chargingBall.angle,0);
rival.y+=20;charging.step(1/120);
assert.ok(chargingBall.angle>0,'charging aim follows the rival');
charging.step(.2);const locked=chargingBall.angle;
rival.y+=80;charging.step(1/120);
assert.equal(chargingBall.angle,locked,'aim stays fixed during the final charge');
charging.step(.1);
assert.equal(charging.shots,1);assert.equal(rival.hp,15,'late movement can dodge the locked beam');
console.log('PASS: laser aim tracking and lock, unique single-use laser, wide hit coverage, 3 HP damage, self-hit and self-kill, firing audio, finite beam lifetime and one wall reflection.');
