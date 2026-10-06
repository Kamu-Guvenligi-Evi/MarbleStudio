import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const tracks=read('public/music/manifest.json'),mapping=read('public/music/countries.json');
const countries=read('public/catalog/manifest.json').items.filter(item=>item.category==='countries');
const byId=new Map(tracks.map(track=>[track.id,track]));
assert.equal(byId.size,tracks.length,'Track IDs must be unique');
for(const country of countries){
  assert.ok(mapping[country.id],`${country.name} needs a default track`);
  const track=byId.get(mapping[country.id]);assert.ok(track,`${country.name} points to a missing track`);
}
for(const track of tracks){
  assert.ok(track.src.startsWith('/music/'));
  assert.ok(fs.statSync('public'+track.src).size>1024,`${track.title} has no local audio`);
  assert.ok(track.source.startsWith('https://'));
}
assert.equal(byId.get(mapping['countries-af10ef20dd']).youtube,'https://www.youtube.com/watch?v=XXMu_YgGgPM');
assert.equal(byId.get(mapping['countries-d9e83874d2']).trimStartSeconds,4.15);
assert.equal(byId.get(mapping['countries-b0bc9abd90']).trimStartSeconds,0);
assert.equal(mapping['politicians-3f2296bb1d'],mapping['countries-b0bc9abd90']);
const seed=read('scripts/country-music-seed.json');
for(const row of seed){
  const track=byId.get('country-'+row.code);assert.ok(track,`${row.country} import missing`);
  assert.equal(track.source,row.source);assert.equal(track.selectionType,row.kind);
  if(row.clipEndSeconds!==undefined){
    assert.equal(track.trimStartSeconds,row.clipStartSeconds);
    assert.equal(track.clipEndSeconds,row.clipEndSeconds);
    assert.ok(Math.abs(track.durationSeconds-(row.clipEndSeconds-row.clipStartSeconds))<.1,`${row.country} excerpt duration mismatch`);
  }
}
assert.equal(byId.get('country-us').source,'https://www.youtube.com/watch?v=7Q7UbdMHGcM');
assert.ok(byId.get('country-us').title.includes('Amerika'));
assert.ok(byId.get('country-us').durationSeconds<20);
console.log(`PASS: ${countries.length}/${countries.length} countries mapped; all ${tracks.length} local assets and source records exist; user selections preserved.`);
