import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';

const make = (team, scale = 1, type = 'seljuk_turkmen_archer') => {
  const armies = [{ roman: 24 * scale }, { roman: 24 * scale }], commanders = [null, null];
  armies[team] = { seljuk_hassa: 16 * scale, [type]: 8 * scale };
  commanders[team] = 'alp_arslan';
  return new Battle({ seed: 42, expandedMap: true, historicalArmies: armies, commanders });
};
const forward = (p, s) => (p.x - s.origin.x) * s.forward.x + (p.y - s.origin.y) * s.forward.y;
for (const team of [0, 1]) for (const scale of [1, 2, 4]) for (const type of ['seljuk_turkmen_archer', 'kipchak']) {
  const b = make(team, scale, type);
  let movingShots = 0, retreatStart, retreatEnd, chargeHits = 0, tacticalSteps = 0;
  const localShooters = new Set();
  const resolve = b.resolveAttack.bind(b), steer = b.tactics.steer.bind(b.tactics), skirmish = b.skirmish.bind(b), hit = b.hit.bind(b);
  b.resolveAttack = (u, t, projectile) => {
    if (u.type === type && u.team === team && projectile && u.moving && b.tactics.teams[team]?.phase === 'retreat') movingShots++;
    if (u.type === type && u.team === team && projectile && b.tactics.teams[team]?.phase === 'done') localShooters.add(u.id);
    return resolve(u, t, projectile);
  };
  b.tactics.steer = (battle, u, t, dt) => {
    const active = u.team === team && u.type === type && b.tactics.teams[team]?.phase !== 'done' && b.tactics.intents.has(u.id);
    const result = steer(battle, u, t, dt);
    if (active && !u.order && !u.tacticalOverride) { assert.equal(result, true); tacticalSteps++; }
    return result;
  };
  b.skirmish = (u, t, dt) => {
    assert.ok(!(!u.resting && u.team === team && u.type === type && b.tactics.teams[team]?.phase !== 'done' && b.tactics.intents.has(u.id)),
      'Fresh riders retain coordinated retreat; exhausted riders may recover locally');
    return skirmish(u, t, dt);
  };
  b.hit = (t, damage, u, ...rest) => { const hp = t.hp; const result = hit(t, damage, u, ...rest);
    if (u?.team === team && u.charge && t.hp < hp) chargeHits++; return result; };
  b.step(1 / 30);
  const s = b.tactics.teams[team];
  assert.equal(s.members.length, 24 * scale, 'Every mounted archer joins its own commander’s plan');
  assert.ok(s.members.filter(m => m.unit.type === type).every(m => m.role === 'bait'));
  assert.ok(s.members.filter(m => m.role !== 'bait').every(m => !m.unit.combatProfile.ranged));
  for (let frame = 1; frame < 45 * 30 && b.winner === null; frame++) {
    b.step(1 / 30);
    assert.ok(b.units.every(u => Number.isFinite(u.x) && Number.isFinite(u.y)));
    if (s.phase === 'retreat') {
      const bait = s.members.filter(m => m.role === 'bait' && m.unit.hp > 0);
      const position = bait.reduce((n, m) => n + forward(m.unit, s), 0) / bait.length;
      retreatStart ??= position; retreatEnd = position;
    }
    if (s.phase === 'charge') for (const m of s.members.filter(m => m.unit.type === type)) {
      const intent = b.tactics.intents.get(m.unit.id);
      if (intent) assert.ok(forward(intent.goal, s) <= forward(s.trap, s) - 119, 'Archers stay behind the pursuit, clear of wing charge lanes');
    }
  }
  assert.ok(tacticalSteps > 0);
  assert.equal(s.phase, 'done', 'No indefinitely reserved army');
  const archerIds = new Set(s.members.filter(m => m.unit.type === type).map(m => m.unit.id));
  assert.ok((s.chargeRelease?.distances || []).every(d => !archerIds.has(d.id)), 'No melee charge assigned to a horse archer');
  if (scale === 1) assert.ok(s.history.some(h=>h.phase==='retreat'),'small pursuit scenario exercises the complete retreat');
  if (s.history.some(h=>h.phase==='retreat')) {
    assert.ok(movingShots > 0, `Real projectile releases while retreating: ${JSON.stringify({team,scale,type,history:s.history,movingShots,retreatStart,retreatEnd})}`);
    assert.ok(retreatStart - retreatEnd > 25, 'The archer screen physically withdraws');
  } else {
    const fallback=s.history.find(h=>h.phase==='done');
    assert.ok(fallback?.reason && fallback.time<20,'unsafe preparation is abandoned promptly');
    assert.ok(localShooters.size>=archerIds.size*.5,'archers actually resume shooting after the coordinated trap is cancelled');
  }
  if (scale === 1 && type === 'seljuk_turkmen_archer') {
    assert.ok(s.history.some(h => h.phase === 'charge'));
    assert.ok(chargeHits > 0, 'Mixed preset still produces actual cavalry impact damage');
  }
}
console.log('PASS 12 mirrored mixed cavalry battles: membership, moving shots, real retreat, charge separation and bounded fallback');

for (const override of ['hold', 'leader']) {
  const b = make(0); b.step(1 / 30);
  const s = b.tactics.teams[0], u = s.members.find(m => m.unit.type === 'seljuk_turkmen_archer').unit;
  if (override === 'hold') { b.selected = new Set([u.id]); b.stopSelected(); }
  else s.commander.hp = 0;
  b.step(1 / 30);
  assert.equal(b.tactics.steer(b, u, b.units.find(v => v.team === 1), 1 / 30), false);
  if (override === 'leader') assert.equal(s.phase, 'done');
}
console.log('PASS horse archers respect manual orders and commander loss');

// Milan engages the auxiliary foot while the mounted lure waits out of range.
// A healthy trap group must not hide casualties in the rest of its own army.
for (const team of [0, 1]) {
  const b = new Battle({ seed: 42, expandedMap: true, armyConfigs: [
    { id: 'seljuk', team, commanderId: 'alp_arslan', roster: createCommanderArmy('alp_arslan', 48) },
    { id: 'milan', team: 1-team, commanderId: 'francesco_sforza', roster: createCommanderArmy('francesco_sforza', 48) },
  ] });
  let checked = false;
  for (let frame = 0; frame < 45*30 && b.winner === null; frame++) {
    b.step(1/30);
    const s = b.tactics.armies.get('seljuk');
    if (!s) continue;
    const ratio = s.armyMembers.reduce((sum,u)=>sum+Math.max(0,u.hp),0)/s.initialArmyHealth;
    if (ratio <= .85) {
      assert.ok(!['assemble','regroup'].includes(s.phase), 'Whole-army losses release the mounted waiting plan');
      checked = true;
    }
  }
  assert.ok(checked, 'Milan matchup exercises casualties outside the trap group');
}
console.log('PASS mirrored Milan/Seljuk battles: auxiliary losses cancel an unsupported lure');
