import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {selectTestChannel} from './browser-channel.mjs';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1000}}), errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await selectTestChannel(page);
  await page.addInitScript(()=>{
    window.audioStarts=[];
    for (const [prototype,method] of [[AudioBufferSourceNode.prototype,'start'],[HTMLMediaElement.prototype,'play']]) {
      const original=prototype[method];
      prototype[method]=function(...args) {
        const state=window.marbleStudio?.getState();
        window.audioStarts.push({method,state:state?.state,countdown:state?.countdown});
        return original.apply(this,args);
      };
    }
  });
  await page.goto('http://127.0.0.1:5173?edit=1');
  await page.waitForFunction(()=>window.marbleStudio);
  await page.evaluate(()=>{
    const draft=JSON.parse(localStorage.getItem('marble-studio-track-v1'));
    draft.count=2;draft.ballNames=['Galatasaray','Barcelona'];draft.ballImages=[];
    draft.sound=false;draft.presentation.countdown=3;draft.sequence=draft.sequence.slice(0,4);
    localStorage.setItem('marble-studio-track-v1',JSON.stringify(draft));
    localStorage.setItem('marble-studio-music-track-v1',JSON.stringify({mode:'leader',volume:35}));
  });
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().sections.length),18);
  await page.evaluate(async()=>{
    const {Race}=await import('/src/physics.js'),ranking=Race.prototype.ranking;
    window.testLeaderId=0;
    Race.prototype.ranking=function(){const ranked=ranking.call(this),leader=ranked.find(b=>b.id===window.testLeaderId);return [leader,...ranked.filter(b=>b!==leader)];};
  });
  assert.deepEqual(await page.evaluate(()=>window.audioStarts),[]);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().countdown>1);
  assert.deepEqual(await page.evaluate(()=>window.audioStarts),[],'Preparation/countdown must be silent');
  assert.equal(await page.evaluate(()=>window.marbleStudio.getState().music.country),null);
  await page.waitForFunction(()=>window.marbleStudio.getState().music.country==='teams-92b733230f');
  await page.evaluate(()=>window.testLeaderId=1);
  await page.waitForFunction(()=>window.marbleStudio.getState().music.country==='teams-75ef55e357');
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().music.country===null);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().music.country==='teams-75ef55e357');
  assert.ok(await page.evaluate(()=>window.audioStarts.every(e=>e.state==='running'&&e.countdown===0)));

  // Fixed background music shares the same race-start gate.
  await page.evaluate(()=>localStorage.setItem('marble-studio-music-track-v1',JSON.stringify({mode:'fixed',track:'team-barcelona',volume:35})));
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().countdown>1);
  assert.deepEqual(await page.evaluate(()=>window.audioStarts),[]);
  await page.waitForFunction(()=>window.audioStarts.some(e=>e.method==='play'));
  assert.ok(await page.evaluate(()=>window.audioStarts.every(e=>e.state==='running'&&e.countdown===0)));
  await page.locator('#pause').click();
  await page.waitForFunction(()=>document.querySelector('#music-audio').paused);

  // Every selectable preset and randomized reroll stays long.
  const lengths=await page.evaluate(async()=>{
    const {COURSE_META}=await import('/src/courses.js'),select=document.querySelector('#track-preset'),rows=[];
    for (const preset of [...Object.keys(COURSE_META),'random']) {
      select.value=preset;select.onchange();
      rows.push({preset,length:window.marbleStudio.getState().sections.length});
    }
    return rows;
  });
  assert.ok(lengths.every(row=>row.length>=18));
  // No countdown: play starts immediately with the race, never while ready.
  await page.evaluate(()=>{
    const draft=JSON.parse(localStorage.getItem('marble-studio-track-v1'));
    draft.presentation.countdown=0;
    localStorage.setItem('marble-studio-track-v1',JSON.stringify(draft));
  });
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.audioStarts.length>0);
  assert.ok(await page.evaluate(()=>window.audioStarts.every(e=>e.state==='running'&&e.countdown===0)));
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({passed:true,checks:['silent ready/preparation/countdown','leader switch','pause/resume','fixed music timing','zero countdown','saved short course extended','all presets extended'],presets:lengths.length}));
} finally {await browser.close();}
