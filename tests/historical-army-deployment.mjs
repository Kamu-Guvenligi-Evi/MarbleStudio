import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleDeployment } from '../src/crown-battle-deployment.js';

const configs = (count, armies = 4) => Array.from({ length: armies }, (_, i) => ({
  id: `army-${i}`, team: i % 2, commanderId: 'julius_caesar',
  roster: { roman: count / 2, achaemenid_archer: count / 4, seljuk_hassa: count / 4 },
}));
function nonoverlap(units) {
  const cells = new Map();
  for (const u of units) {
    const x = Math.floor(u.x / 50), y = Math.floor(u.y / 50);
    for (let a = x - 1; a <= x + 1; a++) for (let b = y - 1; b <= y + 1; b++) {
      for (const v of cells.get(`${a}:${b}`) || []) assert.ok(
        Math.hypot(u.x - v.x, u.y - v.y) >= u.combatProfile.radius + v.combatProfile.radius + 2,
        `overlap ${u.armyId}/${u.id} with ${v.armyId}/${v.id}`);
    }
    const key = `${x}:${y}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(u);
  }
}
for (const count of [24, 240, 1000]) for (const armies of [2, 4, 8]) {
  const setup = configs(count, armies);
  // Include large bodies and leaderless armies in the largest scenario.
  if (count === 1000 && armies === 8) { setup[0].roster = { timur: 100 }; setup[1].commanderId = null; }
  const b = new Battle({ armyConfigs: setup, expandedMap: true });
  nonoverlap(b.units);
  for (const u of b.units) {
    assert.ok(Number.isFinite(u.x + u.y));
    assert.ok(u.x >= b.bounds.left + 900 && u.x <= b.bounds.right - 900);
    assert.ok(u.y >= b.bounds.top + 900 && u.y <= b.bounds.bottom - 900);
  }
  const mirrored = new Battle({ armyConfigs: [...setup].reverse(), expandedMap: true });
  nonoverlap(mirrored.units);
}
console.log('PASS 2/4/8 armies, 24/240/1000 troops, mixed cavalry/missiles/elephants, leaderless army, bounds and no overlapping bodies');

const setup = configs(24), b = new Battle({ armyConfigs: setup, expandedMap: true });
assert.deepEqual(new Battle().bounds, { left: 0, right: 600, top: 0, bottom: 960 }, 'Classic dimensions stay unchanged');
const compact = new Battle({ armyConfigs: setup });
assert.equal(compact.deploymentSpacing.frontGap, 160, 'Compact deployment stays unchanged');
for (let i = 0; i < b.units.length; i++) {
  const u = b.units[i], old = compact.units[i];
  assert.equal(u.y, old.y, 'Keep allied lanes and internal formation spacing');
  assert.ok(Math.abs(u.x - 300) > Math.abs(old.x - 300), 'Expanded armies start farther from the centre');
}
assert.equal(b.targetRadius, Math.hypot(b.bounds.right - b.bounds.left, b.bounds.bottom - b.bounds.top));
const own = b.units.filter(u => u.armyId === 'army-0' && !u.commanderId);
b.selected = new Set(own.map(u => u.id));
assert.ok(b.deploySelected(-350, 300, { kind: 'line' }).valid);
assert.ok(own.every(u => u.tacticalOverride));
const positions = own.map(u => [u.x, u.y]);
const data = new Map(), storage = () => ({ getItem: k => data.get(k), setItem: (k, v) => data.set(k, v) });
const save = new BattleDeployment('army-spacing-test', { storage }); save.capture(b);
const restored = new Battle({ armyConfigs: setup, expandedMap: true }); save.restore(restored);
const restoredOwn = restored.units.filter(u => u.armyId === 'army-0' && !u.commanderId);
assert.deepEqual(restoredOwn.map(u => [u.x, u.y]), positions);
assert.ok(restoredOwn.every(u => u.tacticalOverride));
restored.time = .1; restored.tactics.update(restored, restored.units);
assert.ok(!restored.tactics.formations.armies.has('army-0'), 'manual deployment is excluded from commander opening');
assert.ok(restored.tactics.formations.armies.has('army-2'), 'other commander still controls its own army');

// Legacy automatic stacks are rebuilt; legacy manual headings survive migration.
for (const u of save.units) {
  if (u.armyId !== 'army-0') { u.x = 180; u.y = 480; }
  delete u.tacticalOverride;
}
const migrated = new Battle({ armyConfigs: setup, expandedMap: true }); save.restore(migrated);
assert.deepEqual(migrated.units.filter(u => u.armyId === 'army-0' && !u.commanderId).map(u => [u.x, u.y]), positions);
nonoverlap(migrated.units);

const largerSetup = configs(240), larger = new Battle({ armyConfigs: largerSetup, expandedMap: true });
save.restore(larger);
nonoverlap(larger.units);
console.log('PASS manual formation priority, ally independence, persistence, legacy automatic-stack repair and army size changes');
