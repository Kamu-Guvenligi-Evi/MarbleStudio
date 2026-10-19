import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { CIVILIZATION_DOCTRINES } from '../src/historical-civilization-tactics.js';
import leaders from '../src/historical-commanders.json' with {type:'json'};

const roster=p=>Object.fromEntries(Object.entries(p.required).map(([role,n])=>[Object.keys(p.roles).find(k=>p.roles[k]===role),n*2]));
const leader=p=>leaders.find(l=>l.doctrineIds.includes(p.id)).id;
const army=(id,team,roster,commanderId)=>({id,team,roster,commanderId,name:id});
const state=(b,id)=>b.tactics.armies.get(id)||b.tactics.civilizations.armies.get(id);
const tick=b=>{b.time+=1/30;b.tactics.update(b,b.units.filter(u=>u.hp>0&&!u.removed));};

for(const p of CIVILIZATION_DOCTRINES)for(const team of [0,1]) {
  const b=new Battle({seed:42,expandedMap:true,armyConfigs:[
    army('first',team,roster(p),leader(p)),army('second',team,roster(p),leader(p)),army('enemy',1-team,{roman:48},null),
  ]});
  tick(b);
  const first=state(b,'first'),second=state(b,'second');
  assert.ok(first&&second,`${p.id}/${team}: independent allied doctrines initialize`);
  assert.notEqual(first,second);
  assert.ok(first.members.every(m=>m.unit.armyId==='first'));
  assert.ok(second.members.every(m=>m.unit.armyId==='second'));
  assert.equal(first.commander,b.armyCommanders.get('first'));
  assert.equal(second.commander,b.armyCommanders.get('second'));
  const target=b.units.find(u=>u.armyId==='enemy');
  const controlled=first.members[0].unit;
  b.armyCommanders.get('first').hp=0;
  assert.equal(b.tactics.steer(b,controlled,target,1/30),false,'dead commander releases before next decision');
  tick(b);
  assert.equal(first.phase,'done');assert.notEqual(second.phase,'done');
  assert.ok(first.members.every(m=>!b.tactics.civilizations.intents.has(m.unit.id)));
  assert.ok(second.members.some(m=>b.tactics.civilizations.intents.has(m.unit.id)));
  const other=second.members[0].unit;
  b.setActiveTeam(team);b.selected=new Set([other.id]);b.stopSelected();
  assert.equal(b.tactics.steer(b,other,target,1/30),false,'player command retains priority');
}
console.log('PASS 10 doctrines, both alliances: independent allied membership, own leader, isolated death, manual command');

for(const team of [0,1]) {
  const b=new Battle({expandedMap:true,armyConfigs:[
    army('seljuk',team,{seljuk_hassa:24},'alp_arslan'),
    army('german',team,{landsknecht:24},'georg_frundsberg'),
    army('enemy',1-team,{roman:48},null),
  ]});
  tick(b);
  assert.ok(state(b,'seljuk'),'Seljuk plan initializes alongside an allied doctrine');
  assert.equal(state(b,'german')?.profile.id,'DE_PIKE','Seljuk reservation does not disable an ally');
  b.armyCommanders.get('seljuk').hp=0;tick(b);
  assert.equal(state(b,'seljuk').phase,'done');assert.notEqual(state(b,'german').phase,'done');
}
for(const team of [0,1])for(const small of [true,false]) {
  const b=new Battle({expandedMap:true,armyConfigs:[
    army('first',team,{england_housecarl:small?6:24},small?'harold_godwinson':null),
    army('second',team,{england_housecarl:24},'harold_godwinson'),
    army('enemy',1-team,{roman:48},null),
  ]});
  tick(b);
  assert.ok(!state(b,'first'),'cannot borrow allied soldiers or an allied commander');
  assert.ok(state(b,'second'),'eligible ally still receives its own doctrine');
}
console.log('PASS mixed Seljuk/German doctrines and no borrowing allied troops or leaders');
