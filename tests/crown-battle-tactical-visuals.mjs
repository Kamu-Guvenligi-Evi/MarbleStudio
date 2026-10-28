import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { TacticalVisuals, tacticalPhaseLabel, armyTacticalLabel, hasChargePose, soldierAction, soldierFrame } from '../src/crown-battle-tactical-visuals.js';

for (const team of [0, 1]) {
  const b = new Battle({seed:42, expandedMap:true, commanders:team ? [null,'alp_arslan'] : ['alp_arslan',null], historicalArmies:team ? [{roman:24},{seljuk_hassa:24}] : [{seljuk_hassa:24},{roman:24}]});
  b.setActiveTeam(team); b.select('all');
  const visuals = new TacticalVisuals();
  visuals.update(b); assert.equal(visuals.routes.length, 0);
  b.step(1/30);
  const state = b.tactics.teams[team]; assert.equal(state.phase, 'assemble');
  const before = structuredClone({units:b.units, intents:[...b.tactics.intents], stats:b.tactics.stats});
  visuals.update(b);
  assert.ok(visuals.routes.length > 0 && visuals.routes.length <= 3);
  assert.equal(tacticalPhaseLabel(b,team), 'Kanatlar açılıyor');
  assert.deepEqual({units:b.units, intents:[...b.tactics.intents], stats:b.tactics.stats}, before, 'Presentation must not change simulation');
  const samples = visuals.samples;
  for(let i=0;i<60;i++)visuals.update(b);
  assert.equal(visuals.samples,samples,'Repeated draws reuse group summaries');
  // Selection changes while paused must refresh even if the selection size is equal.
  b.selected = new Set([state.members[0].unit.id]); visuals.update(b,1);
  assert.ok(visuals.routes.every(r=>r.ids.length===1 && r.ids[0]===state.members[0].unit.id));
  b.selected = new Set([state.members.at(-1).unit.id]); visuals.update(b,2);
  assert.ok(visuals.routes.length===1 && visuals.routes[0].ids[0]===state.members.at(-1).unit.id);
  state.members.at(-1).unit.tacticalOverride = true; visuals.update(b,3);
  assert.equal(visuals.routes.length,0,'Player-controlled soldiers must have no automatic route');
  b.selected.clear(); visuals.update(b); assert.equal(visuals.routes.length,0);
  state.phase='done'; assert.equal(tacticalPhaseLabel(b,team),'');
  state.phase='retreat'; b.winner=team; assert.equal(tacticalPhaseLabel(b,team),'');
}

const u = {type:'hussar',hp:10,attack:0,moving:true,phase:0,charge:{age:0}};
assert.equal(hasChargePose('hussar'),true);
assert.equal(hasChargePose('kipchak'),false,'Mounted bows must not become lances');
assert.equal(soldierAction(u),'charge-ready');
u.charge.age=.3; assert.equal(soldierAction(u),'charge');
u.attack=.12; assert.equal(soldierAction(u),'attack'); assert.equal(soldierFrame(u,'attack',2),4);
u.hp=0; assert.equal(soldierAction(u),'idle');
const noTactics = {time:1,winner:null,selected:new Set([1])};
new TacticalVisuals().update(noTactics); assert.equal(tacticalPhaseLabel(noTactics,0),'');
const allied = { time: 1, winner: null, armyConfigs: [{id:'a',team:0},{id:'b',team:0}], tactics: {
  armies: new Map([['a',{phase:'charge'}]]), formations: {armies: new Map([['b',{phase:'assemble'}]])}
}};
assert.equal(armyTacticalLabel(allied,'b'),'Komutan dizilişi kuruluyor');
assert.match(tacticalPhaseLabel(allied,0),/Süvari hücumuna hazırlık · Komutan dizilişi kuruluyor/);
allied.armyConfigs.shift();
assert.equal(tacticalPhaseLabel(allied,0),'Komutan dizilişi kuruluyor','Single commanded army also reports automatic formation');
allied.tactics.formations.armies.get('b').phase='done';
assert.equal(tacticalPhaseLabel(allied,0),'');
console.log('PASS mirrored real tactics, bounded cached routes, paused selection, player overrides, read-only presentation, charge/contact actions');
