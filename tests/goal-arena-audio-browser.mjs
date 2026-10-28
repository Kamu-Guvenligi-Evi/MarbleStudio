import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {GOAL_SOUND_DURATION} from '../src/goal-arena-audio.js';

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  for(const origin of (process.env.TEST_GOAL_ORIGINS??'http://127.0.0.1:5174,http://127.0.0.1:5180').split(',')){
    const page=await browser.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>{
      window.playedAudio=[];
      const start=AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start=function(...args){
        if(this.buffer){
          let peak=0;for(const sample of this.buffer.getChannelData(0))peak=Math.max(peak,Math.abs(sample));
          window.playedAudio.push({duration:this.buffer.duration,peak});
        }
        return start.apply(this,args);
      };
    });
    await page.goto(origin+'/goal-arena.html');
    await page.waitForFunction(()=>window.goalArenaStudio?.state().time>.1);
    await page.locator('#pause').click();
    assert.equal(await page.locator('#manual-sound-goal option[value="goal-horn"]').textContent(),'Mackolik goal alert');
    await page.locator('#manual-sound-goal').evaluate(el=>{
      for(let p=el.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS')p.open=true;
    });
    await page.locator('#manual-sound-goal').locator('..').locator('button').click();
    await page.waitForFunction(duration=>window.playedAudio.some(s=>Math.abs(s.duration-duration)<.001),GOAL_SOUND_DURATION);
    const played=await page.evaluate(duration=>window.playedAudio.filter(s=>Math.abs(s.duration-duration)<.001),GOAL_SOUND_DURATION);
    assert.ok(played.every(s=>s.peak>.2&&s.peak<1));
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({origin,pass:true,recordedGoal:played}));
    await page.close();
  }
}finally{await browser.close();}
