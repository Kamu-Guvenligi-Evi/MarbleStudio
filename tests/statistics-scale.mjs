import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {statisticsScale,animateStatisticsScale} from '../src/statistics-scale.js';

assert.equal(statisticsScale(90).max,statisticsScale(100).max,'Nearby values retain a common axis so bars can grow');
assert.ok(statisticsScale(300).max>statisticsScale(100).max);
assert.ok(statisticsScale(30).max<statisticsScale(100).max);
for(const peak of [0,0.00001,0.2,1,90,300,1e15]){
  const scale=statisticsScale(peak);
  assert.ok(Number.isFinite(scale.max)&&scale.max>peak);
  assert.ok(scale.step>0&&scale.max/scale.step<10);
}
const growing=animateStatisticsScale(125,150,110,1/60);
assert.ok(growing>125&&growing<150);
const shrinking=animateStatisticsScale(400,40,30,1/60);
assert.ok(shrinking>40&&shrinking<400);
assert.ok(animateStatisticsScale(40,400,300,1/60)>300,'Sudden jumps fit inside the chart');
assert.equal(animateStatisticsScale(400,40,30,0),40,'Seeking immediately uses the new range');

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173?edit=1');
  await page.locator('#nav-statistics').click();
  await page.locator('#statistics-csv').fill('Year,A,B\n2000,90,45\n2001,100,50\n2002,300,150\n2003,30,15');
  await page.locator('#statistics-apply').click();
  const state=()=>page.evaluate(()=>window.marbleStudio.getStatisticsState());
  const first=await state();
  await page.locator('#statistics-seek').fill('0.333');
  const grown=await state();
  assert.equal(grown.axisMax,first.axisMax);
  assert.ok(grown.ranking[0].value/grown.axisMax>first.ranking[0].value/first.axisMax,'Leader visibly grows with proportional data');
  await page.locator('#statistics-seek').fill('0.667');
  const expanded=await state();assert.ok(expanded.axisMax>grown.axisMax);
  await page.locator('#statistics-seek').fill('1');
  assert.ok((await state()).axisMax<expanded.axisMax,'Axis contracts when values fall');
  await page.locator('#statistics-reset').click();assert.equal((await state()).axisMax,first.axisMax);
  await page.locator('#statistics-play').click();
  await page.waitForFunction(()=>window.marbleStudio.getStatisticsState().progress>.01);
  assert.ok(Number.isFinite((await state()).axisMax));
  assert.deepEqual(errors,[]);
  console.log('PASS: stable intervals, visible bar growth, axis expansion/contraction, small values, smooth scaling, seeking, reset and playback.');
}finally{await browser.close();}
