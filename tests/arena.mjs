import assert from 'node:assert/strict';
import {Arena,ARENA} from '../src/arena.js';
import {serializeProject,parseProject} from '../src/projects.js';
const wall=new Arena({count:6});wall.start();
const ball=wall.balls[0],startingSpeed=ball.speed;ball.body.position={x:489.5,y:510};ball.body.velocity={x:180,y:0};
wall.step();assert.equal(wall.linkCount(ball),4);assert.ok(ball.body.velocity.x<0);
assert.ok(Math.abs(ball.speed-startingSpeed*1.0025)<1e-9,'Each wall impact adds 0.25% of starting speed');
assert.ok(Math.abs(Math.hypot(ball.body.velocity.x,ball.body.velocity.y)-ball.speed)<1e-9,'The velocity uses the increased speed');
const anchor=wall.links.at(-1);assert.ok(Math.abs(Math.hypot(anchor.x-270,anchor.y-510)-238)<1e-6);
wall.step();assert.equal(wall.linkCount(ball),4,'Remaining near a wall must not generate duplicate links');
assert.ok(Math.abs(ball.speed-startingSpeed*1.0025)<1e-9,'Moving away from the wall must not increase speed again');
for(let hits=2;hits<=5;hits++){
 ball.body.position={x:489.5,y:510};ball.body.velocity={x:ball.speed,y:0};wall.step();
 assert.ok(Math.abs(ball.speed-startingSpeed*(1+hits*.0025))<1e-9,'Speed grows linearly even when impacts occur within the link cooldown');
}
const battle=new Arena({count:6});battle.start();battle.time=2;
battle.balls.forEach((b,i)=>{b.body.position={x:130+i*45,y:650};b.body.velocity={x:0,y:0};});
battle.balls[0].body.position={x:270,y:510};battle.balls[1].body.position={x:390,y:510};
battle.links=[{owner:0,x:508,y:510,born:0},{owner:1,x:400,y:295,born:0}];
battle.step();assert.equal(battle.linkCount(battle.balls[0]),0);assert.equal(battle.balls[1].cuts,1);
assert.equal(battle.balls[0].eliminatedAt,battle.time);assert.equal(battle.state,'finished');assert.equal(battle.winners[0].id,1);
const frozen=structuredClone(battle.balls.map(b=>b.body.position));battle.step(1000);assert.deepEqual(battle.balls.map(b=>b.body.position),frozen);
for(const seed of [1,2,3,5,12,2048]){
 const a=new Arena({seed}),b=new Arena({seed});a.start();b.start();
 while(a.state==='running'&&a.time<180){a.step();b.step();for(const ball of a.balls)assert.ok(Math.hypot(ball.body.position.x-ARENA.x,ball.body.position.y-ARENA.y)<=ARENA.radius-ball.body.circleRadius+.001);}
 assert.equal(a.state,'finished');assert.ok(a.balls.filter(b=>b.eliminatedAt===null).length<=1);
 assert.deepEqual(a.balls.map(b=>b.body.position),b.balls.map(b=>b.body.position));assert.ok(a.totalCuts>0);
}
const project=parseProject(serializeProject({mode:'arena',sequence:['funnel'],seed:100,count:12}));assert.equal(project.mode,'arena');assert.equal(project.sequence.length,1);
console.log('PASS: wall anchors, reflection, rival cuts, elimination, last survivor, frozen results, deterministic bounded physics and mode backup roundtrip.');
