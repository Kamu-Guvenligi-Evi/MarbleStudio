// Run after baking; preserve gameplay identity and the approved world heights.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {MIDDLE_EARTH_UNITS as units} from '../src/middle-earth-units.js';
const backup='artifacts/middle-earth/before-balanced-style';
const gameplay=entries=>entries.map(({id,name,faction,role,universe,art,hero,kind,heightScale,combat})=>({id,name,faction,role,universe,art,hero,kind,heightScale,combat:Object.fromEntries(Object.entries(combat).filter(([k])=>k!=='visualScale'))}));
const identity=gameplay(units);
try{await fs.writeFile(`${backup}/identity-and-combat.json`,JSON.stringify(identity,null,2),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}
const targets=JSON.parse(await fs.readFile(`${backup}/size-checks.json`,'utf8'));
const baked=JSON.parse(await fs.readFile('artifacts/middle-earth/balanced-bake.json','utf8'));
if(Object.keys(baked).length!==36)throw Error('Bake all 36 units first.');
assert.deepEqual(Object.keys(baked).sort(),units.map(u=>u.id).sort());
for(const {file,baseHeight,factor}of Object.values(baked)){
 assert.ok(Number.isFinite(baseHeight)&&baseHeight>0&&Number.isFinite(factor)&&factor>0);
 await fs.access(`public/warrior-sprites/middle-earth/${file}.webp`);
 await fs.access(`public/warrior-sprites/middle-earth/${file}-portrait.webp`);
}
const visual={},fallback={};
for(const[id,v]of Object.entries(baked)){visual[id]=+(targets[id].height/v.baseHeight).toFixed(5);fallback[id]=+(v.factor*58/512*3).toFixed(5);}
await fs.writeFile('src/middle-earth-visual-profiles.js',`// Preserve reviewed historical infantry/cavalry comparisons after art normalization.
// These constants are used when baking poses, never scanned per soldier per frame.
export const VISUAL_SCALES = ${JSON.stringify(visual,null,2)};
export const FALLBACK_SCALES = ${JSON.stringify(fallback,null,2)};
`);
// Runtime art is maintained in source; do not regenerate the renderer here.
let source=await fs.readFile('src/middle-earth-units.js','utf8');
source=source.replace('const reference = MIDDLE_EARTH_IMAGES[art];',"const reference = {...generated(id.replaceAll('_','-')), drawn:true};");
await fs.writeFile('src/middle-earth-units.js',source);
const revised=(await import('../src/middle-earth-units.js?balanced-verify='+Date.now())).MIDDLE_EARTH_UNITS;
assert.deepEqual(gameplay(revised),identity,'Art integration must preserve all gameplay identities, roles and combat values.');
for(const u of revised){
 assert.equal(u.image,`/warrior-sprites/middle-earth/${baked[u.id].file}-portrait.webp`);
 await fs.access('public'+u.image);
}
console.log('Applied 36 local sheets and portraits; gameplay identities/roles/combat unchanged; all portrait paths verified.');
