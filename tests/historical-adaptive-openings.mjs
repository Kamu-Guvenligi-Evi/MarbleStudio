import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { Battle } from '../src/crown-battle.js';
import { CIVILIZATIONS } from '../src/historical-combat.js';
import leaders from '../src/historical-commanders.json' with { type: 'json' };
import { ARMY_PRESETS, createCommanderArmy, presetMinimum } from '../src/historical-army-presets.js';
import { unitCapacity } from '../src/historical-army-capacity.js';
import { commanderDeployment } from '../src/historical-commander-deployment.js';

const results=[];
function clearance(units,label) {
  // Spatial buckets keep the large-army check cheap without skipping pairs.
  const size=2*Math.max(...units.map(u=>u.combatProfile.radius))+2, cells=new Map();
  let minimum=Infinity;
  for(const u of units) {
    const x=Math.floor(u.x/size), y=Math.floor(u.y/size);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(const v of cells.get(`${x+dx},${y+dy}`)||[]) {
      const gap=Math.hypot(u.x-v.x,u.y-v.y)-u.combatProfile.radius-v.combatProfile.radius;
      minimum=Math.min(minimum,gap);
      assert.ok(gap>=-1e-6,`${label}: ${u.type}/${v.type} overlap ${gap}`);
    }
    const key=`${x},${y}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(u);
  }
  return minimum;
}
for(const civ of CIVILIZATIONS)for(const capacity of [48,240,960])for(const team of [0,1]) {
  const leader=leaders.find(l=>l.civilizations.includes(civ.name)&&ARMY_PRESETS[l.id]);
  let roster;
  if(leader)roster=createCommanderArmy(leader.id,Math.max(capacity,presetMinimum(ARMY_PRESETS[leader.id])));
  else {
    roster={};let remaining=capacity, i=0;
    const ids=civ.ids.filter(id=>unitCapacity(id)<=capacity);
    while(ids.some(id=>unitCapacity(id)<=remaining)) {
      const id=ids[i++%ids.length],cost=unitCapacity(id);
      if(cost<=remaining){roster[id]=(roster[id]||0)+1;remaining-=cost;}
    }
  }
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId:leader?.id,roster},{id:'enemy',team:1-team,roster:{roman:48}},
  ]});
  const units=b.units.filter(u=>u.armyId==='own'&&!u.commanderId),label=`${civ.name}/${capacity}/${team}`;
  assert.ok(units.every(u=>Number.isFinite(u.x+u.y)),label);
  const minimumGap=clearance(units,label), opening=b.openingDeployments.get('own');
  if(leader) {
    assert.ok(opening,`${label}: commander opening is active`);
    assert.equal(opening.positions.length,units.length,label);
    assert.equal(new Set(opening.positions.map(p=>p.unit.id)).size,units.length,label);
    const sections=opening.state.sections||opening.state.formationGeometry?.sections||[];
    for(const section of sections)if(section.count>=12) {
      const aspect=(section.front-section.rear)/(section.right-section.left);
      assert.ok(aspect<=2.5,`${label}/${section.duty}: combat corps became a marching column (${aspect})`);
    }
  }
  results.push({civilization:civ.name,capacity,team,units:units.length,minimumGap,kind:opening?.kind});
}

// French and Milanese corps must scale beyond the small army sizes that hid
// the fixed-file bug. Includes protected, mounted and missile-heavy opponents.
let large=0;
for(const commanderId of ['charles_vii','francesco_sforza'])for(const capacity of [96,960,2400])for(const team of [0,1])for(const roster of [{roman:96},{landsknecht:96},{hussar:48},{achaemenid_archer:96}]) {
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team,commanderId,roster:createCommanderArmy(commanderId,capacity)},
    {id:'enemy',team:1-team,roster},
  ]});
  const s=b.openingDeployments.get('own')?.state,label=`${commanderId}/${capacity}/${team}/${Object.keys(roster)[0]}`;
  assert.ok(s?.formationGeometry?.sections?.length,label);
  clearance(s.members.map(m=>m.unit),label);
  for(const section of s.formationGeometry.sections) {
    assert.ok((section.front-section.rear)/(section.right-section.left)<=2.5,`${label}/${section.duty}: elongated corps`);
  }
  if(commanderId==='francesco_sforza') {
    const front=s.members.filter(m=>m.role==='front'), reserve=s.members.filter(m=>m.role==='reserve');
    assert.ok(Math.max(...reserve.map(m=>m.f+m.radius))<Math.min(...front.map(m=>m.f-m.radius)),label);
  } else {
    const foot=s.members.filter(m=>m.duty==='foot-centre');
    assert.ok(foot.length,label);
    for(const side of [-1,1]) {
      const wing=s.members.filter(m=>m.wingSide===side);
      assert.ok(wing.length&&wing.every(m=>Math.sign(m.a)===side),label);
      assert.ok(wing.every(m=>!m.unit.combatProfile.ranged),label);
    }
  }
  large++;
}

// The same mixed army can use different available forms under every leader;
// the generic selector has no culture-specific whitelist.
let adaptive=0;
for(const leader of leaders) {
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    {id:'own',team:0,commanderId:leader.id,roster:{roman:48,hussar:24,achaemenid_archer:24}},
    {id:'enemy',team:1,roster:{roman:48}},
  ]});
  const units=b.units.filter(u=>u.armyId==='own'&&!u.commanderId);
  for(const direction of [0,90,180,270]) {
    const plans=['balanced','close','brace','flank'].map(kind=>commanderDeployment(units,{x:0,y:0},direction,
      {left:-3000,right:3000,top:-3000,bottom:3000},false,
      {kind,flank:-1,enemy:{count:48,width:90,cavalry:kind==='brace'?48:0,pikes:kind==='flank'?48:0}}));
    assert.ok(plans.every(Boolean),leader.id);
    assert.ok(new Set(plans.map(p=>p.sections.find(s=>s.duty==='line').kind)).size>=3,leader.id);
    assert.ok(plans[3].sections.some(s=>s.kind==='echelonLeft'),leader.id);
    for(const plan of plans)clearance(plan.members.map(m=>({...m.unit,...m.goal})),leader.id);
    adaptive+=plans.length;
  }
}
mkdirSync('artifacts/tactical-responsiveness',{recursive:true});
writeFileSync('artifacts/tactical-responsiveness/adaptive-openings.json',JSON.stringify({results,large,adaptive}));
console.log(`PASS ${results.length} openings across ${CIVILIZATIONS.length} civilizations; ${large} French/Milan large openings; ${adaptive} opponent-aware layouts.`);
