import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseStatistics,statisticsAt} from '../src/statistics-data.js';
const manifest=JSON.parse(fs.readFileSync('public/statistics/manifest.json','utf8'));
assert.equal(manifest.items.length,11);
assert.equal(new Set(manifest.items.map(item=>item.id)).size,manifest.items.length);
for(const item of manifest.items){
  const data=parseStatistics(fs.readFileSync('public'+item.csv,'utf8'));
  assert.equal(data.names.length,item.entities,item.id);assert.equal(data.frames.length,item.rows,item.id);
  assert.equal(data.frames[0].year,item.start);assert.equal(data.frames.at(-1).year,item.end);
  assert.ok(item.sources.length&&item.sources.every(source=>source.url.startsWith('https://')));
  if(item.indicator){
    const raw=JSON.parse(fs.readFileSync(`scripts/statistics-cache/${item.indicator}.json`,'utf8'));
    const values=new Map(raw.data[1].map(row=>[`${row.countryiso3code}:${row.date}`,row.value]));
    for(const frame of data.frames)frame.values.forEach((value,index)=>{
      const source=values.get(`${item.countryCodes[index]}:${frame.year}`);
      assert.equal(typeof source,'number','Missing values must never be fabricated');
      assert.ok(Math.abs(value-source/item.scale)<1e-7,`${item.id}/${frame.year}/${index}`);
    });
    assert.match(item.note,/eksiksiz sıralaması değildir/);
  }
  if(item.id==='european-cup'){
    for(const frame of data.frames){
      assert.equal(frame.values.reduce((a,b)=>a+b,0),frame.year-item.start+1,'Exactly one champion per season');
      assert.ok(frame.values.every(Number.isInteger));
    }
    const final=statisticsAt(data,2026,'step');
    assert.equal(final.find(entry=>entry.name==='Real Madrid').value,item.id==='european-cup'?15:9);
    assert.equal(final.find(entry=>entry.name==='Paris Saint-Germain').value,2);
    assert.equal(statisticsAt(data,2025.99,'step').find(entry=>entry.name==='Paris Saint-Germain').value,1);
  }

}
console.log("PASS: 11 curated datasets, source values, cup seasons and provenance.");
