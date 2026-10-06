import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:600,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173?edit=1');
  const metrics=await page.evaluate(async()=>{
    const {Race}=await import('/src/physics.js');const {renderRace}=await import('/src/renderer.js');
    document.body.innerHTML='<canvas id="visual" width="1080" height="1920" style="width:540px;height:960px"></canvas>';
    const canvas=document.querySelector('#visual'),ctx=canvas.getContext('2d');
    const race=new Race({sequence:['wheels','shortcut','crossramps'],count:20});race.start();
    for(let i=0;i<210;i++)race.step();
    const options={cameraY:300,countdown:0,paused:false,trails:false,preview:null};
    renderRace(ctx,race,options);
    const start=performance.now();for(let i=0;i<120;i++)renderRace(ctx,race,options);
    const ms=(performance.now()-start)/120;
    const pixels=ctx.getImageData(0,0,1080,1920).data;
    window.renderFinish=()=>{options.cameraY=race.finishY-650;renderRace(ctx,race,options);};
    return {ms,alpha:pixels[3],width:canvas.width,height:canvas.height};
  });
  assert.equal(metrics.alpha,255);assert.equal(metrics.width,1080);assert.equal(metrics.height,1920);
  await page.locator('#visual').screenshot({path:'artifacts/visual-race.png'});
  await page.evaluate(()=>window.renderFinish());
  await page.locator('#visual').screenshot({path:'artifacts/visual-finish.png'});
  assert.deepEqual(errors,[]);console.log(`PASS: race and finish rendered at 1080×1920; mean canvas command submission ${metrics.ms.toFixed(2)} ms/frame (excludes GPU completion).`);
}finally{await browser.close();}
