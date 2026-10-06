import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const catalog=read('public/catalog/manifest.json').items;
const people=read('public/music/people.json');
const defaults=read('public/music/countries.json');
const tracks=new Map(read('public/music/manifest.json').map(t=>[t.id,t]));
const categories=['athletes','celebrities','politicians','history'];
const expected=catalog.filter(item=>categories.includes(item.category));
assert.equal(people.length,expected.length);
assert.equal(new Set(people.map(p=>p.entityId)).size,expected.length);
for(const item of expected){
  const person=people.find(p=>p.entityId===item.id);assert.ok(person,item.name);
  const track=tracks.get(person.trackId??defaults[person.fallbackCountryId]);
  assert.ok(track,`${item.name} needs a personal track or a valid country fallback`);
  assert.ok(fs.statSync('public'+track.src).size>1024);
}
for(const row of read('scripts/person-music-seed.json')){
  const track=tracks.get('person-'+row.code);assert.ok(track,row.code);
  assert.equal(track.source,row.source,row.code);
  assert.equal(track.trimStartSeconds,row.clipStartSeconds??0,row.code);
  if(row.clipEndSeconds!==undefined)assert.ok(Math.abs(track.durationSeconds-(row.clipEndSeconds-row.clipStartSeconds))<.1,row.code);
}
console.log(`PASS: all ${people.length} people covered, personal excerpts and country fallbacks valid.`);
