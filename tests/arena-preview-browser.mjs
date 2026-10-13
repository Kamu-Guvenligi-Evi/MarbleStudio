import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {selectTestChannel} from './browser-channel.mjs';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await selectTestChannel(page);
  await page.addInitScript(()=>{
    localStorage.setItem('marble-studio-music-v1',JSON.stringify({mode:'fixed'}));
    const Original=window.MediaRecorder;
    window.recordingSessions=[];
    window.MediaRecorder=class extends Original {
      constructor(stream,options){super(stream,options);window.recordingSessions.push(this);}
    };
  });
  await page.goto('http://127.0.0.1:5173/?edit=1');
  await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-arena').click();
  const preview=()=>page.waitForFunction(()=>{
    const canvas=document.querySelector('#race'),rect=canvas.getBoundingClientRect();
    const expected=Math.min(1080,Math.max(540,Math.ceil(Math.min(rect.width,rect.height*9/16)*devicePixelRatio*1.25/18)*18));
    return canvas.width===expected&&canvas.height===expected/9*16;
  });
  await preview();
  assert.ok(await page.locator('#race').evaluate(canvas=>canvas.width<1080),'Small previews reduce the rendering workload');
  await page.locator('#nav-territory').click();
  await preview();
  await page.locator('#nav-track').click();
  await preview();
  await page.locator('#nav-arena').click();await preview();
  await page.evaluate(()=>document.querySelector('#record').onclick());
  await page.waitForFunction(()=>window.marbleStudio.getState().recording&&window.marbleStudio.getState().time>.3);
  const capture=await page.evaluate(()=>{
    const canvas=document.querySelector('#race');
    const {width,height}=window.recordingSessions[0].stream.getVideoTracks()[0].getSettings();
    return {width,height,canvasWidth:canvas.width,canvasHeight:canvas.height};
  });
  assert.deepEqual(capture,{width:1080,height:1920,canvasWidth:1080,canvasHeight:1920});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#race').evaluate(canvas=>canvas.width),1080,'Recording keeps full resolution when the window shrinks');
  const downloaded=page.waitForEvent('download');
  await page.evaluate(()=>document.querySelector('#record').onclick());await downloaded;
  await preview();
  assert.ok(await page.evaluate(()=>window.recordingSessions[0].stream.getTracks().every(track=>track.readyState==='ended')));
  assert.deepEqual(errors,[]);

  const retina=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
  await selectTestChannel(retina);
  await retina.goto('http://127.0.0.1:5173/?edit=1');await retina.waitForFunction(()=>window.marbleStudio);
  await retina.locator('.studio-menu-toggle').click();
  await retina.locator('#nav-arena').click();
  await retina.waitForFunction(()=>document.querySelector('#race').width>540);
  assert.ok(await retina.locator('#race').evaluate(canvas=>canvas.width<=1080&&canvas.height===canvas.width/9*16));
  console.log('PASS: adaptive arena preview, mode switching, high-density display, full-resolution recording, resize during recording and stream cleanup.');
} finally {await browser.close();}
