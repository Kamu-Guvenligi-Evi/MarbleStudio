import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {recipe} from '../src/factory-recipes.js';
import {withEpisode,EPISODE_FORMATS} from '../src/episode-plan.js';
import {videoTiming} from '../scripts/video-timing.mjs';
import {outputQuality} from '../scripts/production-automation.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  for(const format of EPISODE_FORMATS){
    let accepted=0;const durations=[];
    for(let seed=1;seed<=16;seed++){
      const r=withEpisode(recipe(seed*7919,'track'),format);
      const a=await page.evaluate(r=>window.factoryRenderer.probe(r),r);
      const timing=videoTiming(a.simulationSeconds,55,{bounded:true});
      if(a.complete&&a.finite&&timing&&outputQuality(a,1).accepted){accepted++;durations.push(timing.duration);}
    }
    assert.ok(accepted>0,`At least one unmodified course must complete and pass quality for ${format}`);
    console.log(`${format}: ${accepted}/16 accepted; durations ${durations.join(', ')}s`);
  }
  await page.goto('http://127.0.0.1:5173/?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.selectOption('#track-preset','random');const a=await page.evaluate(()=>window.marbleStudio.getState());
  await page.selectOption('#track-preset','grandtour');await page.selectOption('#track-preset','random');
  const b=await page.evaluate(()=>window.marbleStudio.getState());
  assert.notEqual(a.seed,b.seed);assert.notDeepEqual(a.sections,b.sections);
  assert.equal(await page.locator('#track-preset option').count(),18);
  for(const preset of ['stairway','gemrun','rotorfactory','weaver','hairpins','sifter','roulette','zigzag','labyrinth','metronome','avalanche','grandtour']){
    await page.selectOption('#track-preset',preset);
    const state=await page.evaluate(()=>window.marbleStudio.getState());assert.equal(state.sections.length,4);
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: four formats pass real rendering duration/quality gates; random seed/course changes; all 12 new editor presets load.');
}finally{await browser.close();}
