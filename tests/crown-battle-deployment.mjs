import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleDeployment } from '../src/crown-battle-deployment.js';

const values = new Map();
const storage = () => ({ getItem: key => values.get(key), setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) });
const load = () => new BattleDeployment('test', { storage });
const make = (blue = 6) => new Battle({ expandedMap: true, allowEmpty: true, historicalArmies: [{ samurai: blue }, { janissary: 4 }] });
const positions = b => b.units.filter(u => !u.removed).map(u => [u.team, u.type, u.x, u.y, u.face, u.headingX, u.headingY].map(v => v === 0 ? 0 : v));
let battle = make(), save = load();
battle.select('all'); battle.deploySelected(180, 540, { kind: 'wedge', direction: 90 });
battle.selected = new Set([battle.units[1].id]); battle.deploySelected(140, 650, { kind: 'line', direction: 180 });
battle.setActiveTeam(1); battle.select('all'); battle.deploySelected(440, 440, { kind: 'line', direction: 270 });
save.capture(battle); save.setControls({ kind: 'line', direction: '270' });
const initial = positions(battle);
let restored = make(); load().restore(restored);
assert.deepEqual(positions(restored), initial);
assert.deepEqual(load().controls, { kind: 'line', direction: '270' });

// An individual removal must retain the positions of the remaining members.
battle.setActiveTeam(0); battle.selected = new Set([battle.units[2].id]);
save.remove(battle, battle.removeSelected());
const remaining = positions(battle);
restored = make(5); load().restore(restored);
assert.deepEqual(positions(restored), remaining);

// Combat casualties/movement do not overwrite the starting deployment.
battle.time = 3; battle.units[0].x += 90; battle.units[1].hp = 0;
save.capture(battle);
restored = make(5); load().restore(restored);
assert.deepEqual(positions(restored), remaining);
// Explicit removal during combat still removes that member from the saved setup.
battle.selected = new Set([battle.units[0].id]); save.remove(battle, battle.removeSelected());
restored = make(4); load().restore(restored);
assert.deepEqual(positions(restored), remaining.slice(1));

// Applying an empty army drops its layout, so recruits start in default positions.
restored = make(0); save.restore(restored); save.capture(restored);
restored = make(6); load().restore(restored);
assert.deepEqual(positions(restored).slice(0, 6), positions(make(6)).slice(0, 6));
assert.deepEqual(positions(restored).slice(6), initial.slice(6));

values.set(save.key, '{broken');
assert.deepEqual(load().units, []);
const unavailable = new BattleDeployment('test', { storage: () => { throw new Error('disabled'); } });
assert.doesNotThrow(() => unavailable.capture(make()));
save = load(); save.capture(make());
assert.deepEqual(new BattleDeployment('test', { storage, reset: true }).units, []);
assert.equal(values.has(save.key), false);
console.log('PASS deployment: reload, heading, partial removal, combat isolation, empty army, corrupt/unavailable storage, reset');
