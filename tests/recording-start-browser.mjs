import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    localStorage.setItem('marble-studio-music-v1',JSON.stringify({mode:'fixed'}));
    const Original=window.MediaRecorder;
    window.recordingSessions=[];
    window.MediaRecorder=class extends Original {
      constructor(stream,options){super(stream,options);window.recordingSessions.push(this);}
    };
  });
  await page.goto('http://127.0.0.1:5173?edit=1');
  await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-track').click();
  await page.evaluate(async()=>{
    const button=document.querySelector('#record');
    await Promise.all([button.onclick(),button.onclick()]);
  });
  assert.equal(await page.evaluate(()=>window.recordingSessions.length),1,'Concurrent start requests create only one recorder');
  await page.waitForFunction(()=>window.marbleStudio.getState().time>.3);
  const download=page.waitForEvent('download');
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await download;
  assert.ok(await page.evaluate(()=>window.recordingSessions.every(session=>session.stream.getTracks().every(track=>track.readyState==='ended'))),'Stopped recording releases every stream track');

  // A preparation failure must unlock controls and allow another attempt.
  await page.evaluate(async()=>{
    const canvas=document.querySelector('#race'),capture=canvas.captureStream;
    canvas.captureStream=()=>{throw new Error('Simulated capture failure');};
    try{await document.querySelector('#record').onclick();}finally{canvas.captureStream=capture;}
  });
  assert.equal(await page.locator('#record').isDisabled(),false);
  assert.equal(await page.locator('#nav-arena').isDisabled(),false);
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().recording),false);
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().recording&&window.marbleStudio.getState().time>.3);
  assert.equal(await page.evaluate(()=>window.recordingSessions.length),2);
  const retryDownload=page.waitForEvent('download');
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await retryDownload;
  assert.deepEqual(errors,[]);
  console.log('PASS: concurrent recording starts, stream cleanup, failed preparation and successful retry.');
}finally{await browser.close();}
