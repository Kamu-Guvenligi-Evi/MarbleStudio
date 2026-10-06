import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { Race } from '../src/physics.js';

let runs=0,maxTime=0,rescues=0;
for (const type of ['shortcut','crossramps']) for(const seed of [1,17,893,2048,8899]) for(const count of [6,20]) {
  const configurations=type==='shortcut'?[{gap:64,offset:-50},{gap:80,offset:0},{gap:110,offset:50}]:[{slope:.85,side:'left'},{slope:1,side:'right'},{slope:1.15,side:'left'}];
  for(const settings of configurations) {
    const race=new Race({seed,count,sequence:[{type,settings}]});race.start();
    while(race.time<20&&race.state!=='finished') {
      race.step();assert.ok(race.balls.every(b=>b.body.position.x>26&&b.body.position.x<514),'Ball escaped a side wall');
    }
    assert.equal(race.finished.length,count,`${type}/${seed}/${count}: incomplete`);
    assert.equal(race.rescues,0,`${type}/${seed}/${count}: needed a rescue`);
    maxTime=Math.max(maxTime,race.time);rescues+=race.rescues;runs++;race.dispose();
  }
}
// Compare a single unobstructed central entry with the outer route.
function passage(x) {
  const race=new Race({sequence:['shortcut'],count:6});
  for(const ball of race.balls.slice(1)) Matter.Composite.remove(race.engine.world,ball.body);
  race.balls=race.balls.slice(0,1);
  Matter.Body.setPosition(race.balls[0].body,{x,y:450});race.start();
  while(race.time<15&&race.state!=='finished')race.step();
  assert.equal(race.finished.length,1);const time=race.time;race.dispose();return time;
}
const direct=passage(270),detour=passage(170);
assert.ok(detour>direct+.15,`Shortcut should be faster: ${direct} vs ${detour}`);
console.log(`PASS: ${runs} new-section races; maximum ${maxTime.toFixed(2)}s, ${rescues} rescues. Shortcut ${direct.toFixed(2)}s vs outer route ${detour.toFixed(2)}s.`);
