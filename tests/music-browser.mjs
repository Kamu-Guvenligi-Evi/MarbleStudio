import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const Original=window.MediaRecorder;
    window.MediaRecorder=class extends Original {
      constructor(stream,options){super(stream,options);window.recordedAudioTracks=stream.getAudioTracks().length;}
    };
  });
  await page.goto('http://127.0.0.1:5173?edit=1');
  await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-watch').click();
  await page.locator('#music-mode').selectOption('fixed');
  const trackCount=await page.evaluate(async()=>(await(await fetch('/music/manifest.json')).json()).length);
  assert.equal(await page.locator('#music-track option').count(),trackCount+1);
  // Decode every bundled file; an HTML error page must never pass as a track.
  const decoded=await page.evaluate(async()=>{
    const context=new AudioContext(),tracks=await(await fetch('/music/manifest.json')).json();
    try{
      const results=[];
      for(const track of tracks){
        const buffer=await context.decodeAudioData(await(await fetch(track.src)).arrayBuffer());
        results.push({duration:buffer.duration,license:track.license});
      }
      return results;
    }finally{await context.close();}
  });
  assert.ok(decoded.every(track=>track.duration>1),'Songs and short meme sounds must decode');
  await page.locator('#music-track').selectOption('monkeys');
  await page.locator('#music-preview').click();
  await page.waitForFunction(()=>document.querySelector('#music-audio').currentTime>.2);
  await page.locator('#music-preview').click();
  assert.ok(await page.locator('#music-audio').evaluate(audio=>audio.paused));
  await page.locator('#music-volume').fill('27');
  await page.locator('#new-race').click();
  await page.waitForFunction(()=>document.querySelector('#music-audio').currentTime>.2);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>document.querySelector('#music-audio').paused);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>!document.querySelector('#music-audio').paused);
  await page.locator('#reset').click();
  assert.equal(await page.locator('#music-audio').evaluate(audio=>audio.currentTime),0);
  await page.reload();
  await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.locator('#music-track').inputValue(),'monkeys');
  assert.equal(await page.locator('#music-volume').inputValue(),'27');
  assert.match(await page.locator('#music-attribution').inputValue(),/Kevin MacLeod/);
  await page.locator('#sound').uncheck();
  await page.locator('#nav-watch').click();
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().recording&&window.marbleStudio.getState().time>2);
  assert.equal(await page.evaluate(()=>window.recordedAudioTracks),1,'Music is recorded even with collision sounds off');
  assert.ok(await page.locator('#music-track').isDisabled());
  const download=page.waitForEvent('download');
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await download;
  const signal=await page.evaluate(async()=>{
    const buffer=await(await fetch(document.querySelector('#download-video').href)).arrayBuffer();
    const context=new AudioContext();
    try {
      const audio=await context.decodeAudioData(buffer),samples=audio.getChannelData(0);
      return samples.some(sample=>Math.abs(sample)>.005);
    }finally{await context.close();}
  });
  assert.ok(signal,'Recorded video contains audible music');
  await page.locator('#reset').click();
  await page.locator('#music-track').selectOption('');
  assert.ok(await page.locator('#music-audio').evaluate(audio=>audio.paused));
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().recording);
  assert.equal(await page.evaluate(()=>window.recordedAudioTracks),0,'No music and no effects produces silent video');
  await page.locator('#race').screenshot({path:'artifacts/music-silent-recording.png'});
  await page.waitForFunction(()=>window.marbleStudio.getState().time>2);
  const silent=page.waitForEvent('download');await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await silent;
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'artifacts/music-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: all music decodes, preview/pause/reset/persistence, audible video without effects, silent video, and mobile layout.');
} finally {await browser.close();}
