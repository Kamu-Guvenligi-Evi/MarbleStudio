import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {englishOutput,englishRosterName} from '../src/output-language.js';
import {validateBatch,copyFor,recipe,sourceRecipe} from '../src/factory-recipes.js';
import {withEpisode,EPISODE_FORMATS} from '../src/episode-plan.js';
import {planAutomatic} from '../scripts/production-automation.mjs';
import {normalizeSnapshot} from '../src/studio-transfer.js';
import {SECTION_LABELS,raceName} from '../src/race-copy.js';
import {SECTION_SETTINGS} from '../src/section-settings.js';

assert.equal(validateBatch({language:'tr'}).language,'en');
assert.equal(validateBatch({automatic:true,language:'tr'}).language,'en');
assert.throws(()=>validateBatch({language:'invalid'}));
for(const type of Object.keys(SECTION_SETTINGS))assert.ok(SECTION_LABELS[type],type);
for(const [tr,en] of [['Türkiye','Turkey'],['Almanya','Germany'],['Koç','Aries'],['Osmanlı İmparatorluğu','Ottoman Empire'],['Jül Sezar','Julius Caesar'],['Mercan','Coral']])assert.equal(englishOutput(tr),en);
assert.equal(englishOutput('Recep Tayyip Erdoğan'),'Recep Tayyip Erdoğan','Proper names retain their spelling');
assert.equal(englishOutput('My custom title'),'My custom title');
assert.equal(englishRosterName('Kanuni Sultan Süleyman'),'Suleiman the Magnificent');
assert.equal(raceName({ballNames:['Almanya']},{id:0,name:'Almanya'}),'Germany');
for(const mode of ['track','arena','spiral'])assert.equal(copyFor(recipe(123,mode),'tr').language,'en');
for(const format of EPISODE_FORMATS){const copy=copyFor(withEpisode(recipe(123,'track'),format),'tr');assert.equal(copy.language,'en');assert.match(copy.description,/finish|racers|teams|stages/i);}
const source=normalizeSnapshot({mode:'track',project:{sequence:[],ballNames:['Türkiye','Koç']}});
assert.deepEqual(sourceRecipe(source,123).ballNames.slice(0,2),['Turkey','Aries']);
assert.equal(source.project.ballNames[0],'Türkiye','Stored source is preserved');
const {items}=JSON.parse(await readFile('public/statistics/manifest.json','utf8'));
for(const item of items){
  const copy=copyFor({mode:'statistics',statistics:{heading:item.title,source:item.source}},'tr');
  assert.notEqual(copy.title,item.title,item.id);
  assert.doesNotMatch(copy.description,/Dünya Bankası|yarış sonuçları|sezon şampiyonları|şampiyonluk/);
  assert.notEqual(englishOutput(item.unit),item.unit,item.id+' unit');
}
for(const kind of ['track','arena','territory']){
 const options=await planAutomatic(validateBatch({automatic:true,automaticMode:kind,language:'tr'}),[],path.resolve('.'));
 assert.equal(options.language,'en');
 for(const name of options.automation.ballNames)assert.equal(englishOutput(name),name);
}
console.log('PASS: English output policy, legacy labels, all obstacle types, metadata, statistics topics and automatic rosters.');
