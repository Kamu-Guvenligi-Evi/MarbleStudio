import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
function setup(team = 0, mapId = 'classic') {
  const b = new Battle({ historicalArmies: [{ samurai: 2 }, { roman: 2 }],
    commanders: team ? [null, 'timur'] : ['mehmed_ii', null], tacticalAI: false, mapId });
  const leader = b.commanders[team];
  for (const u of b.units) if (!u.commanderId) {
    u.x = u.team === team ? (team ? 350 : 250) : (team ? 60 : 540);
    u.y = 430 + u.id % 2 * 100; u.order = { kind: 'hold', x: u.x, y: u.y };
  }
  leader.x = team ? 470 : 130; leader.y = 480;
  return { b, leader, allies: b.units.filter(u => u.team === team && !u.commanderId),
    enemies: b.units.filter(u => u.team !== team && !u.commanderId) };
}
function run(b, seconds, check = () => {}) {
  for (let i = 0; i < seconds * 30; i++) { b.step(1 / 30); check(); }
}
for (const team of [0, 1]) {
  const { b, leader, allies } = setup(team), sign = team ? -1 : 1;
  const start = { ...leader };
  run(b, 8, () => {
    assert.equal(leader.charge, null); assert.equal(leader.target, null);
    assert.ok((allies[0].x - leader.x) * sign > 45, 'Commander stays behind troops');
  });
  assert.ok(gap(start, leader) > 25, 'Commander moves to rear observation position');
  const before = { ...leader };
  run(b, 6);
  assert.ok(gap(before, leader) > 10, 'Commander changes observation position behind a stationary army');
  const oldX = leader.x;
  allies.forEach(u => u.x += sign * 65);
  run(b, 6);
  assert.ok((leader.x - oldX) * sign > 35, 'Commander follows an advancing army');
  assert.equal(b.stats.charges, 0);
}
for (const atEdge of [false, true]) {
  const { b, leader, enemies } = setup();
  leader.x = atEdge ? 38 : 150;
  enemies[0].x = leader.x + 48; enemies[0].y = leader.y;
  enemies[1].x = 540;
  const initial = gap(leader, enemies[0]), oldY = leader.y;
  leader.order = { kind: 'hold', x: leader.x, y: leader.y };
  run(b, 4);
  assert.ok(gap(leader, enemies[0]) > initial + 30, 'Nearby threat interrupts hold and triggers retreat');
  if (atEdge) assert.ok(Math.abs(leader.y - oldY) > 20, 'At map edge commander escapes sideways');
  assert.ok(leader.hp > 0); assert.equal(leader.attack, 0);
}
{
  const { b, leader } = setup();
  b.selected.add(leader.id);
  b.moveSelected(100, 620);
  const destination = { ...leader.order };
  let closest = Infinity;
  run(b, 10, () => { closest = Math.min(closest, gap(leader, destination)); });
  assert.ok(closest < 2, 'Safe manual move is honored');
  assert.equal(leader.order, null, 'Automatic observation resumes after arrival');
  b.stopSelected(); const stopped = { ...leader };
  run(b, 3); assert.ok(gap(stopped, leader) < .1, 'Explicit safe hold remains available');
}
{
  const { b, leader, enemies, allies } = setup();
  b.selected.add(leader.id); b.selected.add(allies[0].id);
  assert.equal(b.attackSelected(enemies[0].id), true);
  assert.equal(leader.order, null);
  assert.equal(allies[0].order.kind, 'attack', 'Mixed selections still order soldiers to attack');
  leader.pendingAttack = { target: enemies[0], projectile: false };
  leader.attack = .01;
  const hp = enemies[0].hp;
  run(b, .1); assert.equal(enemies[0].hp, hp, 'Stale commander strike cannot resolve');
}
{
  const { b, leader } = setup(0, 'fortress');
  run(b, 8);
  assert.ok(Number.isFinite(leader.x) && Number.isFinite(leader.y));
  assert.ok(gap(leader, b.navigation.nearest(leader, 5.5)) < .01, 'Rear movement respects map obstacles');
}
console.log('PASS: mirrored rear-follow, patrol, advancing front, threat retreat, edge escape, manual move/hold, mixed orders, stale attacks and navigation');
