import assert from 'node:assert/strict';
import {Arena,ARENA} from '../src/arena.js';
import {serializeProject,parseProject} from '../src/projects.js';
import {normalizeSnapshot,createBackup,parseBackup} from '../src/studio-transfer.js';
import {sourceRecipe,structure} from '../src/factory-recipes.js';
import {contentKeys} from '../scripts/repetition-guard.mjs';
const wall=new Arena({count:6});wall.start();
const ball=wall.balls[0],startingSpeed=ball.speed;ball.body.position={x:489.5,y:510};ball.body.velocity={x:180,y:0};
wall.step();assert.equal(wall.linkCount(ball),4);assert.ok(ball.body.velocity.x<0);
assert.ok(Math.abs(ball.speed-startingSpeed*1.01)<1e-9,'Each wall impact adds 1% of starting speed');
assert.ok(Math.abs(Math.hypot(ball.body.velocity.x,ball.body.velocity.y)-ball.speed)<1e-9,'The velocity uses the increased speed');
const anchor=wall.links.at(-1);assert.ok(Math.abs(Math.hypot(anchor.x-270,anchor.y-510)-238)<1e-6);
wall.step();assert.equal(wall.linkCount(ball),4,'Remaining near a wall must not generate duplicate links');
assert.ok(Math.abs(ball.speed-startingSpeed*1.01)<1e-9,'Moving away from the wall must not increase speed again');
for(let hits=2;hits<=5;hits++){
 ball.body.position={x:489.5,y:510};ball.body.velocity={x:ball.speed,y:0};wall.step();
 assert.ok(Math.abs(ball.speed-startingSpeed*(1+hits*.01))<1e-9,'Speed grows linearly even when impacts occur within the link cooldown');
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
assert.equal(project.arenaLinkMode,'wall');assert.equal(project.arenaInitialLinks,15);
for(const initialLinks of [1,15,50]){
 const ready=new Arena({count:6,arenaLinkMode:'prelinked',arenaInitialLinks:initialLinks});
 assert.ok(ready.balls.every(b=>ready.linkCount(b)===initialLinks));
 const anchors=ready.links.filter(l=>l.owner===0);
 assert.equal(new Set(anchors.map(l=>`${l.x},${l.y}`)).size,initialLinks);
 for(const l of anchors)assert.ok(Math.abs(Math.hypot(l.x-ARENA.x,l.y-ARENA.y)-ARENA.radius)<1e-6);
 ready.start();const b=ready.balls[0],speed=b.speed;
 b.body.position={x:489.5,y:510};b.body.velocity={x:speed,y:0};ready.step();
 assert.equal(ready.linkCount(b),initialLinks+1,'Prelinked mode keeps adding wall links');
 assert.ok(Math.abs(b.speed-speed*1.01)<1e-9);
 const source=normalizeSnapshot({mode:'arena',project:{sequence:[],count:6,arenaLinkMode:'prelinked',arenaInitialLinks:initialLinks}});
 const restored=parseProject(serializeProject(source.project)),r=sourceRecipe(source,2048);
 assert.equal(restored.arenaInitialLinks,initialLinks);assert.equal(restored.arenaLinkMode,'prelinked');
 const exported=new Arena(r);assert.ok(exported.balls.every(b=>exported.linkCount(b)===initialLinks));
 assert.notEqual(structure(r),structure({...r,arenaLinkMode:'wall'}));
 assert.notEqual(contentKeys(r).exact,contentKeys({...r,arenaLinkMode:'wall'}).exact);
 const key='marble-studio-arena-v1',value=JSON.stringify(restored);
 const storage={length:1,key:()=>key,getItem:()=>value};
 assert.equal(JSON.parse(parseBackup(JSON.stringify(createBackup(storage))).entries[key]).arenaInitialLinks,initialLinks);
 const sim=new Arena(r),replay=new Arena(r);sim.start();replay.start();
 while(sim.state==='running'&&sim.time<180){sim.step();replay.step();}
 assert.equal(sim.state,'finished');assert.ok(sim.totalCuts>0);
 assert.deepEqual(sim.balls.map(b=>b.body.position),replay.balls.map(b=>b.body.position));
}
for(const arenaInitialLinks of [0,51,1.5,'15',null])assert.throws(()=>normalizeSnapshot({mode:'arena',project:{sequence:[],arenaInitialLinks}}),/Başlangıç bağ sayısı/);
assert.throws(()=>normalizeSnapshot({mode:'arena',project:{sequence:[],arenaLinkMode:'bad'}}),/Arena bağ modu/);
console.log('PASS: wall anchors, reflection, rival cuts, elimination, last survivor, frozen results, deterministic bounded physics and mode backup roundtrip.');
