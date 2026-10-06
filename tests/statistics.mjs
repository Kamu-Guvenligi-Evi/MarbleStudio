import assert from 'node:assert/strict';
import {DEMO_CSV,parseStatistics,statisticsAt} from '../src/statistics-data.js';

const demo=parseStatistics(DEMO_CSV);
assert.equal(demo.names.length,10);
assert.equal(statisticsAt(demo,2000)[0].name,'Atlas');
assert.equal(statisticsAt(demo,2025)[0].name,'Luna');
const data=parseStatistics('\uFEFFYıl;"A; bir";B\r\n2020;30,5;10\r\n2000;10,5;40\r\n2005;20,5;30\r\n');
assert.deepEqual(data.frames.map(frame=>frame.year),[2000,2005,2020]);
assert.equal(statisticsAt(data,2010).find(entry=>entry.id===0).value,20.5+10/3);
assert.equal(statisticsAt(data,0)[0].value,40);
assert.equal(statisticsAt(data,9999)[0].value,30.5);
assert.deepEqual(parseStatistics('Year,"A; B","C, ""D"""\n2000,1,2\n2001,3,4').names,['A; B','C, "D"']);
assert.deepEqual(statisticsAt(parseStatistics('Yıl,A,B\n2000,0,0\n2001,0,0'),2000).map(entry=>entry.id),[0,1]);
assert.equal(statisticsAt(parseStatistics('Yıl,A,B\n2026,12,24'),1900)[0].value,24,'Single observation is a static comparison');
const trophies=parseStatistics('Yıl,A,B\n2000,1,0\n2001,1,1');
assert.equal(statisticsAt(trophies,2000.99,'step').find(entry=>entry.name==='B').value,0);
assert.equal(statisticsAt(trophies,2001,'step').find(entry=>entry.name==='B').value,1);
for(const csv of [
  'Yıl,A,B',
  'Yıl,A,A\n2000,1,2\n2001,3,4',
  'Yıl,A,B\n2000,1,2\n2000,3,4',
  'Yıl,A,B\n2000,,2\n2001,3,4',
  'Yıl,A,B\n2000,-1,2\n2001,3,4',
  'Yıl,A,B\n2000,Infinity,2\n2001,3,4',
  'Yıl,A,B\n2000,1,2,3\n2001,3,4',
  'Yıl,A,B\n2000,0x10,2\n2001,3,4',
  'Yıl,A,B\n2000,"1,2\n2001,3,4',
  'Yıl,A,B\n2000.5,1,2\n2001,3,4',
])assert.throws(()=>parseStatistics(csv),csv);
console.log('PASS: CSV quoting, Turkish decimal values, validation, year sorting, irregular-year interpolation, stable ties and changing leaders.');
