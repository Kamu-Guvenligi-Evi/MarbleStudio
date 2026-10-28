import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleFeedback, combatOffset } from '../src/crown-battle-feedback.js';
const army = (type, n = 1) => ({ sword: 0, pike: 0, cavalry: 0, archer: 0, [type]: n });
const tick = (b, n) => { for (let i = 0; i < n; i++) b.step(1 / 30); };

// Stationary soldiers must be able to resolve accidental identical placements.
{
  const b = new Battle({ armies: [army('sword', 12), army('sword')] });
  const allies = b.units.filter(u => !u.team);
  for (const u of allies) Object.assign(u, { x: 250, y: 400, order: { kind: 'hold' }, cooldown: 100 });
  Object.assign(b.units.at(-1), { x: 500, y: 700, order: { kind: 'hold' } });
  tick(b, 60);
  const closest = Math.min(...allies.flatMap((u, i) => allies.slice(i + 1).map(v => Math.hypot(u.x-v.x, u.y-v.y))));
  assert(closest > 6, `Overlapping held ranks separate: closest ${closest}`);
  assert(allies.every(u => u.order.kind === 'hold'));
  console.log(`PASS held ranks separate; minimum spacing ${closest.toFixed(2)}`);
}
// Approaching cavalry distinguishes a braced spear from a nearby soft target.
{
  const b = new Battle({ armies: [army('cavalry'), { ...army('pike'), archer: 1 }] });
  const horse = b.units[0], spear = b.units.find(u => u.team && u.type === 'pike'), archer = b.units.find(u => u.team && u.type === 'archer');
  Object.assign(horse, { x: 200, y: 400, cooldown: 100 });
  Object.assign(spear, { x: 290, y: 400, headingX: -1, headingY: 0, order: { kind: 'hold' } });
  Object.assign(archer, { x: 295, y: 425, order: { kind: 'hold' }, cooldown: 100 });
  b.step(1/30); assert.equal(horse.target.id, archer.id);
  b.selected.add(horse.id); b.attackSelected(spear.id); tick(b, 10);
  assert.equal(horse.target.id, spear.id, 'Explicit target overrides preference');
  console.log('PASS cavalry prefers exposed archers; explicit orders override autonomous targeting');
}
// Foot archers do not slide during release; flying arrows still hit after shooter death.
{
  const b = new Battle({ armies: [army('archer', 2), army('sword', 2)] });
  new BattleFeedback(b);
  const [archer, backup] = b.units.filter(u => !u.team);
  const [target, reserve] = b.units.filter(u => u.team);
  Object.assign(backup, { x: 100, y: 700, order: { kind: 'hold' }, cooldown: 100 });
  Object.assign(archer, { x: 200, y: 400, order: { kind: 'hold' }, cooldown: 0 });
  Object.assign(target, { x: 300, y: 400, order: { kind: 'hold' }, cooldown: 100 });
  Object.assign(reserve, { x: 500, y: 700, order: { kind: 'hold' } });
  b.step(1/30); archer.order = null;
  const position = { x: archer.x, y: archer.y };
  tick(b, 4); assert.equal(archer.x, position.x); assert.equal(archer.y, position.y);
  assert(b.projectiles.length > 0);
  b.hit(archer, 1000, target); tick(b, 25);
  assert(target.hp < target.maxHp, 'Released arrow survives shooter death');
  assert.equal(archer.pendingAttack, null); assert.equal(archer.deathDirection, -1);
  const hp = target.hp; tick(b, 30); assert.equal(target.hp, hp, 'Dead shooter launches no new shots');
  target.flash = .065; target.hitDirection = 1; assert(combatOffset(target) > 0);
  console.log('PASS planted release, projectile feedback, directional recoil/death, no post-death attacks');
}
