import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {recipe,copyFor} from '../src/factory-recipes.js';
import {withEpisode,EPISODE_FORMATS} from '../src/episode-plan.js';
import {outputQuality} from '../scripts/production-automation.mjs';

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[],reports=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/factory-render.html');await page.waitForFunction(()=>window.factoryRenderer);
  await mkdir('artifacts/episode-review',{recursive:true});
  for(const format of EPISODE_FORMATS){
    let r,analysis,speed;
    for(let attempt=0;attempt<16;attempt++){
      r=withEpisode({...recipe(7654+attempt*7919,'track'),language:'tr'},format);
      analysis=await page.evaluate(r=>window.factoryRenderer.probe(r),r);speed=analysis.simulationSeconds/28;
      if(analysis.complete&&analysis.finite&&analysis.simulationSeconds>=8&&speed>=.3&&speed<=4&&outputQuality(analysis,speed).accepted)break;
    }
    assert.ok(analysis.complete&&analysis.finite&&analysis.simulationSeconds>=8&&speed>=.3&&speed<=4&&outputQuality(analysis,speed).accepted,JSON.stringify({format,analysis}));
    await page.evaluate(config=>window.factoryRenderer.begin(config),{recipe:r,analysis,speed,fps:30,width:720,height:1280,intro:0,copy:copyFor(r,'tr')});
    for(const [label,frame] of [['start',90],['middle',450],['end',890]]){
      const jpeg=await page.evaluate(i=>window.factoryRenderer.frame(i),frame);
      await writeFile(`artifacts/episode-review/${format}-${label}.jpg`,Buffer.from(jpeg,'base64'));
    }
    const result=await page.evaluate(()=>window.factoryRenderer.result());
    assert.deepEqual(result.episode,analysis.episode,'Every qualifier, score and finish time must match');
    assert.equal(result.winner,analysis.winner);assert.equal(result.complete,true);reports.push({format,...analysis});
  }
  assert.deepEqual(errors,[]);await writeFile('artifacts/episode-review/probes.json',JSON.stringify(reports,null,2));
  console.log('PASS: all four formats rendered, quality gates passed, probe/export winners match; 12 review frames saved.');
}finally{await browser.close();}
