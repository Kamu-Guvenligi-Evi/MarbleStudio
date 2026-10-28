import assert from 'node:assert/strict';
import { Battle } from '../src/crown-battle.js';
import { BattleFeedback } from '../src/crown-battle-feedback.js';
import { MovementSoundField } from '../src/crown-battle-movement-sound.js';

const b = new Battle({ historicalArmies: [{ roman: 1, mongol: 1, timur: 1 }, { samurai: 1 }] });
const view = {x:300,y:400,zoom:1}, heard = [];
const audio = {enabled:true,volume:1,context:{state:'running',currentTime:0},
  move: (kind,pan,p) => heard.push({kind,pan,gain:p.gain,pace:p.pace}), play() {}};
const field = new MovementSoundField();
for (const u of b.units) Object.assign(u, {x:300,y:400,moving:true,speed:30});
field.update(b,audio,view); assert.equal(heard.length,0,'Setup is silent');
b.time=1; field.update(b,audio,view);
assert.deepEqual(heard.map(e=>e.kind),['foot','hoof'],'Mounted archer has hooves; elephant does not');
const tick = () => {audio.context.currentTime+=.13;field.update(b,audio,view);};
const count=heard.length;field.update(b,audio,view);assert.equal(heard.length,count,'Same audio clock does not rescan');
view.x=150;tick();assert(heard.at(-1).pan>0&&heard.at(-1).gain<1);
view.x=450;tick();assert(heard.at(-1).pan<0);
view.x=300;b.units.find(u=>u.type==='mongol').speed=115;tick();assert(heard.at(-1).pace>1,'Charge pace rises');
for(const u of b.units)u.moving=false;
let before=heard.length;tick();assert.equal(heard.length,before,'Halt stops new steps');
for(const u of b.units)Object.assign(u,{moving:true,hp:0});tick();assert.equal(heard.length,before,'Dead units silent');
for(const u of b.units)Object.assign(u,{hp:100,x:10000});tick();assert.equal(heard.length,before,'Off-screen units silent');
for(const u of b.units)Object.assign(u,{x:300,removed:true});tick();assert.equal(heard.length,before,'Removed units silent');
for(const u of b.units)u.removed=false;
b.winner=0;tick();assert.equal(heard.length,before,'Victory stops steps');
b.winner=null;audio.enabled=false;tick();assert.equal(heard.length,before,'Mute stops scans');
audio.enabled=true;

// Indexed reads stay constant as army size grows. Include both ends of the
// array so a team stored after a huge army still gets represented.
let reads=0;const huge={...b,units:new Proxy({length:100000},{get(target,key){
  if(key==='length')return target.length;
  reads++;return {...b.units[0],combatProfile:undefined,id:Number(key),type:Number(key)>50000?'mongol':'roman'};
}})};
new MovementSoundField().update(huge,audio,view);
assert.equal(reads,96);assert.deepEqual(heard.slice(-2).map(e=>e.kind),['foot','hoof']);
const options={seed:45,historicalArmies:[{roman:8,mongol:4},{samurai:8,hussar:4}]};
const plain=new Battle(options),withSound=new Battle(options),f=new BattleFeedback(withSound,audio,()=>view);
for(let i=0;i<600;i++){plain.step(1/30);withSound.step(1/30);audio.context.currentTime+=1/30;f.update();}
assert.deepEqual(withSound.units.map(u=>[u.x,u.y,u.hp]),plain.units.map(u=>[u.x,u.y,u.hp]),'Audio leaves seeded combat unchanged');
console.log('PASS movement field: role/charge, camera, idle/dead/removed/mute/victory silence, 96 indexed reads for 100k units, seeded combat parity');
