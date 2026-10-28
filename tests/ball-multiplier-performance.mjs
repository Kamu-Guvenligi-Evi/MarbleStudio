import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    localStorage.setItem('marble-studio-ball-multiplier-v1',JSON.stringify({limit:3000,speed:2,sound:false}));
    window.previewPaints=0;
    const fillRect=CanvasRenderingContext2D.prototype.fillRect;
    CanvasRenderingContext2D.prototype.fillRect=function(...args){
      if(this.canvas.id==='multiplier-canvas')window.previewPaints++;
      return fillRect.apply(this,args);
    };
  });
  await page.goto((process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174')+'/ball-multiplier.html');
  await page.waitForFunction(()=>window.multiplierStudio);
  const stats=await page.evaluate(()=>new Promise((resolve,reject)=>{
    const samples=[],started=performance.now();let last=started,lastPaints=window.previewPaints;
    function frame(now){
      const state=window.multiplierStudio.state();
      if(now-started>45000){reject(new Error('3000-ball playback did not finish within 45 seconds'));return;}
      if(window.previewPaints!==lastPaints){
        if(state.total>=1000)samples.push(now-last);
        last=now;lastPaints=window.previewPaints;
      }
      if(state.state!=='finished'){requestAnimationFrame(frame);return;}
      samples.sort((a,b)=>a-b);
      resolve({balls:state.total,frames:samples.length,medianMs:samples[Math.floor(samples.length*.5)],p95Ms:samples[Math.floor(samples.length*.95)]});
    }
    requestAnimationFrame(frame);
  }));
  assert.equal(stats.balls,3000);
  await page.waitForTimeout(100);
  const paints=await page.evaluate(()=>window.previewPaints);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.previewPaints),paints,'finished preview stops repainting');
  const dimensions=await page.locator('#multiplier-canvas').evaluate(c=>({pixels:c.width,display:c.getBoundingClientRect().width}));
  assert.ok(Math.abs(dimensions.pixels-Math.max(270,Math.round(dimensions.display)))<=1,'preview matches display pixel density');
  await page.locator('#studio-channel').selectOption('Clipverseuni');
  await page.waitForFunction(previous=>window.previewPaints>previous,paints);
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(150);
  assert.ok(await page.locator('#multiplier-canvas').evaluate(c=>c.width<=390));
  await page.locator('#replay').click();await page.locator('#pause').click();
  await page.waitForTimeout(100);const paused=await page.evaluate(()=>({state:window.multiplierStudio.state(),paints:window.previewPaints}));
  await page.waitForTimeout(250);
  assert.deepEqual(await page.evaluate(()=>({state:window.multiplierStudio.state(),paints:window.previewPaints})),paused,'paused preview does no simulation or drawing');
  assert.deepEqual(errors,[]);
  console.log('PASS 3000-ball live playback, idle drawing, resize and channel updates:',JSON.stringify(stats));
}finally{await browser.close();}
