import assert from 'node:assert/strict';
import { Battle, WORLD } from '../src/crown-battle.js';
import { BattleDirector } from '../src/crown-battle-director.js';

function camera() {
  return { view: { x: 300, y: 480, zoom: 1 }, clampView() {
    const v = this.view; v.zoom = Math.max(.5, Math.min(3, v.zoom));
    const hx = WORLD.width / v.zoom / 2, hy = WORLD.height / v.zoom / 2;
    v.x = Math.max(-300 + hx, Math.min(900 - hx, v.x));
    v.y = Math.max(-480 + hy, Math.min(1440 - hy, v.y));
  } };
}
const army = { sword: 8, pike: 0, cavalry: 0, archer: 0 };
const makeBattle = () => new Battle({ armies: [army, army], seed: 321, expandedMap: true });
const r = camera(); let battle = makeBattle(); const d = new BattleDirector(r, () => battle);
const original = { ...r.view };
d.tick(.05, true); assert.deepEqual(r.view, original, 'Disabled by default');
d.setEnabled(true); d.tick(.05, false); assert.deepEqual(r.view, original, 'Paused camera is still');
const before = JSON.stringify(battle);
d.tick(.05, true); assert.equal(JSON.stringify(battle), before, 'Framing cannot change battle state');
assert(d.aim && d.phase === 'Orduların yaklaşması');
for (let i = 0; i < 300; i++) d.tick(1 / 30, true);
const stable = { ...r.view }; d.tick(1 / 30, true);
assert.deepEqual(r.view, stable, 'Settled camera stops invalidating terrain cache');

// Two separated engagements: a minor score fluctuation cannot cut the shot.
function fighter(id, x, n = 1) {
  return Array.from({ length: n }, (_, i) => ({ id: id + i, type: 'sword', x, y: 480,
    hp: 100, target: { x: x + 10, y: 480, hp: 100 }, attack: .2 }));
}
battle = { units: [...fighter(0, -80, 5), ...fighter(10, 700, 4)], time: 1, winner: null };
d.tick(.05, true); assert(d.focus.x < 0);
battle.units.push(...fighter(30, 700, 2)); battle.time = 2; d.inspect(battle);
assert(d.focus.x < 0, 'Hold shot for six simulation seconds despite competing action');
battle.units.push(...fighter(40, 700, 10)); battle.time = 8; d.inspect(battle);
assert(d.focus.x > 600, 'Switch to a materially stronger engagement after dwell');
const previousFocus = d.focus; battle.units.forEach(u => { u.target = null; });
battle.time += .6; d.inspect(battle); assert.equal(d.focus, previousFocus, 'Attack gaps do not pulse the zoom');
battle.time += 4; d.inspect(battle); assert.equal(d.focus, null);
const paused = { ...r.view }; d.tick(.1, false); assert.deepEqual(r.view, paused);
d.setEnabled(false); d.tick(.1, true); assert.deepEqual(r.view, paused, 'Manual override stays in control');
d.setEnabled(true); battle = { units: [], time: 0, winner: null }; d.tick(.05, true);
assert.equal(d.aim, null, 'Empty armies do not produce invalid framing');
battle = makeBattle(); d.tick(.05, true); assert.equal(d.battle, battle, 'Rebuilt battle replaces old focus');
battle.winner = 0; const won = { ...r.view }; d.tick(.1, true); assert.deepEqual(r.view, won);

// A real seeded fight must produce exactly the same combat with the director on.
const control = makeBattle(); battle = makeBattle(); d.setEnabled(true);
for (let i = 0; i < 450; i++) { control.step(1 / 30); battle.step(1 / 30); d.tick(1 / 30, true); }
assert.deepEqual(battle.units, control.units); assert.deepEqual(battle.stats, control.stats);
assert.equal(battle.winner, control.winner);
console.log('PASS director: opt-in, pause/end/reset, stable framing, shot dwell, stronger action, animation gaps, empty armies, identical seeded combat');
