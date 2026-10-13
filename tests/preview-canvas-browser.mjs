import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {selectTestChannel} from './browser-channel.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await selectTestChannel(page);
  await page.addInitScript(()=>{
    const Recorder=window.MediaRecorder;window.recordingSessions=[];
    window.MediaRecorder=class extends Recorder{constructor(stream,options){super(stream,options);this.bytes=0;this.addEventListener('dataavailable',e=>this.bytes+=e.data.size);window.recordingSessions.push(this);}};
  });
  for(const mode of ['track','arena','territory','spiral','pi','statistics']){
    await page.setViewportSize({width:1366,height:1000});
    await page.goto(`http://127.0.0.1:5173/?mode=${mode}`);
    const id=mode==='pi'?'pi-canvas':mode==='statistics'?'statistics-canvas':'race';
    await page.locator('#'+id).waitFor({state:'visible'});
    const fullWidth=mode==='statistics'?1920:1080;
    await page.waitForFunction(({id,fullWidth})=>document.getElementById(id).width<fullWidth,{id,fullWidth});
    for(const viewport of [{width:390,height:844},{width:1600,height:1100}]){
      await page.setViewportSize(viewport);
      await page.waitForTimeout(150);
      const result=await page.locator('#'+id).evaluate(c=>{
        const pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let min=255,max=0;for(let i=0;i<pixels.length;i+=16){min=Math.min(min,pixels[i]);max=Math.max(max,pixels[i]);}
        return {width:c.width,height:c.height,variation:max-min};
      });
      assert.ok(result.variation>50,`${mode}: drawing survives resize, including paused views`);
      assert.ok(Math.abs(result.width/result.height-(mode==='statistics'?16/9:9/16))<.001);
    }
    console.log(`PASS ${mode}: adaptive preview and redraw after resize`);
  }
  await page.evaluate(()=>document.querySelector('#statistics-record').click());
  await page.waitForFunction(()=>window.recordingSessions[0]?.state==='recording');
  await page.setViewportSize({width:390,height:844});
  await page.waitForTimeout(200);
  const capture=await page.evaluate(()=>{
    const c=document.querySelector('#statistics-canvas');
    const {width,height}=window.recordingSessions[0].stream.getVideoTracks()[0].getSettings();
    return [c.width,c.height,width,height];
  });
  assert.deepEqual(capture,[1920,1080,1920,1080]);
  await page.waitForFunction(()=>window.recordingSessions[0].bytes>1000);
  const downloaded=page.waitForEvent('download');
  await page.evaluate(()=>document.querySelector('#statistics-record').click());await downloaded;
  await page.waitForFunction(()=>document.querySelector('#statistics-canvas').width<1920);
  assert.ok(await page.evaluate(()=>window.recordingSessions[0].stream.getTracks().every(t=>t.readyState==='ended')));
  assert.deepEqual(errors,[]);
  console.log('PASS statistics: full-resolution capture, resize during capture and preview restoration');
}finally{await browser.close();}
