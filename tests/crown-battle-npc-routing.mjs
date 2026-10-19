import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';

const gap = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const metrics = [];
// A planted allied horse-archer screen used to trap the rider at x=204
// indefinitely. Both sides and update rates must find a physical way around it.
for (const team of [0, 1]) for (const hz of [30, 60]) {
  const armies = [{ roman: 1 }, { roman: 1 }];
  armies[team] = { seljuk_hassa: 1, kipchak: 17 };
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies: armies });
  const rider = b.units.find(u => u.type === 'seljuk_hassa');
  const enemy = b.units.find(u => u.team !== team);
  const x = value => team ? 600 - value : value;
  Object.assign(rider, { x: x(190), y: 450, cooldown: 1000, chargeCooldown: 1000 });
  Object.assign(enemy, { x: x(400), y: 450, hp: 1e5, order: { kind: 'hold' }, cooldown: 1000 });
  const screen = b.units.filter(u => u.type === 'kipchak');
  screen.forEach((u, i) => Object.assign(u, { x: x(215), y: 346 + i * 13, order: { kind: 'hold' }, cooldown: 1000 }));
  const initial = screen.map(u => [u.x, u.y]);
  let crossed = false, reachedAt;
  for (let frame = 0; frame < hz * 18; frame++) {
    b.step(1 / hz);
    if ((rider.x - x(215)) * (team ? -1 : 1) > 0 && !crossed) {
      crossed = true;
      assert.ok(rider.y < 346 || rider.y > 554, 'Go around the line, not through planted allies');
    }
    if (gap(rider, enemy) <= rider.combatProfile.config.reach) { reachedAt = b.time; break; }
  }
  assert.ok(crossed && reachedAt < 18, `Allied screen must not trap team ${team} at ${hz}Hz`);
  screen.forEach((u, i) => assert.ok(gap(u, { x: initial[i][0], y: initial[i][1] }) < .1, 'Hold orders stay planted'));
  assert.ok(b.stats.npcRoutes < 8, 'Cache detours instead of replanning every frame');
  metrics.push({ team, hz, reachedAt: +reachedAt.toFixed(2), routes: b.stats.npcRoutes });
}

// Reproducible moving quarry: a horse archer keeps the same gap while a
// stationary, reachable opponent is just outside the old first search ring.
for (const explicit of [false, true]) {
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies: [{ roman: 1 }, { kipchak: 1, roman: 1 }] });
  const pursuer = b.units.find(u => u.team === 0);
  const quarry = b.units.find(u => u.type === 'kipchak');
  const alternative = b.units.find(u => u.team === 1 && u.type === 'roman');
  Object.assign(pursuer, { x: 100, y: 450, target: quarry, cooldown: 1000, chargeCooldown: 1000 });
  Object.assign(alternative, { x: 240, y: 500, order: { kind: 'hold' }, cooldown: 1000 });
  Object.assign(quarry, { x: 150, y: 450, order: { kind: 'hold' }, cooldown: 1000 });
  if (explicit) pursuer.order = { kind: 'attack', targetId: quarry.id };
  let switchedAt = null, switches = 0, last = quarry;
  for (let i = 0; i < 8 * 30; i++) {
    quarry.x = pursuer.x + 50; quarry.y = pursuer.y;
    b.step(1 / 30);
    if (pursuer.target !== last) { switches++; last = pursuer.target; }
    if (pursuer.target === alternative) switchedAt ??= b.time;
  }
  if (explicit) { assert.equal(pursuer.target, quarry); assert.equal(switches, 0); }
  else {
    assert.ok(switchedAt > 2 && switchedAt < 6, 'Give pursuit a chance, then select a reachable opponent');
    assert.equal(pursuer.target, alternative);
    assert.equal(switches, 1, 'Do not oscillate back to the fleeing target');
  }
  metrics.push({ explicit, switchedAt, switches });
}

// A lone elusive target stays eligible; discouragement must never create idle
// armies. Stopping or moving still supersedes autonomous routing and pursuit.
{
  const b = new Battle({ seed: 42, expandedMap: true, historicalArmies: [{ roman: 1 }, { kipchak: 1 }] });
  const [u, enemy] = b.units;
  Object.assign(u, { x: 100, y: 450, cooldown: 1000 });
  Object.assign(enemy, { x: 150, y: 450, order: { kind: 'hold' }, cooldown: 1000 });
  for (let i = 0; i < 180; i++) { enemy.x = u.x + 50; enemy.y = u.y; b.step(1 / 30); }
  assert.equal(u.target, enemy);
  b.select(); b.stopSelected();
  const start = { x: u.x, y: u.y };
  for (let i = 0; i < 60; i++) b.step(1 / 30);
  assert.ok(gap(u, start) < .1);
  b.moveSelected(u.x - 70, u.y + 90);
  const goal = { x: u.order.x, y: u.order.y };
  for (let i = 0; i < 300; i++) b.step(1 / 30);
  assert.ok(gap(u, goal) < 1);
  assert.equal(u.order.kind, 'hold');
}
console.log('PASS NPC routing, bounded chase, stable retargeting and explicit orders', JSON.stringify(metrics));
