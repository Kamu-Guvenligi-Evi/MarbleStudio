import assert from 'node:assert/strict';
import { Battle, roleOf } from '../src/crown-battle.js';
import { BattleNavigation } from '../src/crown-battle-navigation.js';
import { createBattleBounds } from '../src/crown-battle-bounds.js';
const bounds = createBattleBounds(true);
const point = (x, y) => ({ x: bounds.left + x * (bounds.right - bounds.left) / 1000, y: bounds.top + y * (bounds.bottom - bounds.top) / 1000 });
const nav = new BattleNavigation(bounds);
const radius = u => roleOf(u) === 'elephant' ? 14 : roleOf(u) === 'cavalry' ? 5.5 : 3.75;

for (const r of [3.75, 5.5, 14]) {
  for (const [from, to] of [[point(300,500),point(800,500)], [point(600,500),point(650,400)], [point(330,470),point(420,470)], [point(300,700),point(750,300)]]) {
    const path = nav.route(from, to, r);
    assert.ok(path.length > 0, 'A route exists, including castle courtyard');
    let previous = from;
    for (const next of path) { assert.ok(nav.free(next,r)); assert.ok(nav.clear(previous,next,r), 'Every path segment avoids obstacles'); previous = next; }
    assert.ok(Math.hypot(previous.x-to.x,previous.y-to.y) < 1);
  }
}
assert.equal(nav.clear(point(450,500),point(550,500),0),false, 'River blocks walking');
assert.equal(nav.clear(point(450,417),point(540,417),14),true, 'Bridge fits elephant');
assert.equal(nav.clear(point(450,500),point(550,500),0,true),true, 'Projectiles may cross water');
assert.equal(nav.clear(point(600,430),point(650,430),0,true),false, 'Wall blocks fire');

// Actual movement, both bridges, house detour and castle gate; no teleporting or illegal frame.
for (const type of ['samurai','hussar','timur']) for (const [start, goal] of [
  [point(460,417),point(540,417)], [point(460,592),point(540,592)],
  [point(300,500),point(650,500)], [point(330,470),point(420,470)],
]) {
  const b = new Battle({ expandedMap:true, historicalArmies:[{[type]:1},{samurai:1}], mapId:'fortress' });
  const u=b.units[0], enemy=b.units[1]; Object.assign(u,start); Object.assign(enemy,point(850,750));
  enemy.order={kind:'hold',x:enemy.x,y:enemy.y}; u.order={kind:'move',...goal};
  let crossed=false;
  for(let i=0;i<3600 && u.order.kind==='move';i++) {
    const before={x:u.x,y:u.y}; b.step(1/30);
    assert.ok(nav.free(u,radius(u)),`${type} stays outside obstacles: start=${JSON.stringify(start)} frame=${i} position=${u.x},${u.y} r=${radius(u)} before=${JSON.stringify(before)}`);
    assert.ok(nav.clear(before,u,radius(u)),type+' cannot tunnel through obstacles');
    if(before.x < point(500,0).x && u.x >= point(500,0).x) crossed=true;
  }
  assert.equal(u.order.kind,'hold',`${type} arrives: ${JSON.stringify(start)} -> ${JSON.stringify(goal)} at ${u.x},${u.y}`);
  assert.ok(Math.hypot(u.x-goal.x,u.y-goal.y)<5);
  if(start.x<point(480,0).x && goal.x>point(520,0).x) assert.ok(crossed);
}

const b = new Battle({ expandedMap:true, historicalArmies:[{samurai:1},{samurai:1}], mapId:'fortress' });
b.select();
assert.equal(b.deploySelected(...Object.values(point(500,500))).valid,false,'Cannot deploy in water');
assert.equal(b.deploySelected(...Object.values(point(370,460))).valid,false,'Cannot deploy inside house');
assert.equal(b.deploySelected(...Object.values(point(500,417))).valid,true,'Can deploy on bridge');
const [u,e]=b.units; Object.assign(u,point(604,430)); Object.assign(e,point(628,430));
u.headingX=1;u.headingY=0;
const hp=e.hp; b.resolveAttack(u,e,false); assert.equal(e.hp,hp,'No attack through wall');
b.startCharge(u,e); assert.equal(u.charge,null,'Cannot initiate charge through wall');
u.vx=10000; b.updateUnits(.05); assert.ok(nav.free(u,3.75)); assert.ok(u.x<point(610,430).x,'Knockback cannot tunnel');
b.setMap('classic'); assert.equal(b.navigation,null); Object.assign(u,point(500,500)); b.setMap('fortress'); assert.ok(b.navigation.free(u,3.75),'Switching maps relocates obstructed units');
console.log('PASS fortress: paths, both bridges, infantry/cavalry/elephant movement, house detours, castle gate, placement, fire, charge, knockback, map switch');

// Autonomous mixed armies must actually reach combat across the river.
const crowd = new Battle({expandedMap:true, mapId:'fortress', historicalArmies:[{samurai:24,hussar:8,timur:2},{samurai:24,hussar:8,timur:2}]});
for(const team of [0,1]) {
  crowd.activeTeam=team; crowd.select();
  const p=point(team ? 840 : 200,500);
  const plan=crowd.deploySelected(p.x,p.y,{kind:'block',direction:team?180:0});
  assert.ok(plan.valid, plan.message); crowd.engageSelected();
}
let damaged=false;
const started=performance.now();
for(let i=0;i<3600 && crowd.winner===null;i++) {
  crowd.step(1/30);
  for(const u of crowd.units) if(u.hp>0) assert.ok(crowd.navigation.free(u,radius(u)), 'Crowded combat respects solids');
  damaged ||= crowd.units.some(u=>u.hp<u.maxHp);
}
assert.ok(damaged,'Opposing armies cross river and engage');
console.log(`PASS fortress crowd: ${crowd.time.toFixed(1)}s simulated, ${Math.round(performance.now()-started)}ms, winner=${crowd.winner}, alive=${crowd.units.filter(u=>u.hp>0).length}`);
