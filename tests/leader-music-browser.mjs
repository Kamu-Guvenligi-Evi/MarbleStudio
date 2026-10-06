import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const Original=window.MediaRecorder;
    window.MediaRecorder=class extends Original {
      constructor(stream,options){
        super(stream,options);window.recordedAudioTracks=stream.getAudioTracks().length;
      }
    };
  });
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#open-balls').click();await page.locator('[data-library="0"]').click();
  await page.locator('[data-category="politicians"]').click();await page.locator('#catalog-search').fill('mao');
  assert.equal(await page.locator('[data-catalog-item]').count(),1);
  await page.locator('[data-catalog-item]').click();
  await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('eklendi'));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-draft-v2')).ballNames[0]),'Mao Zedong');
  const ids=await page.evaluate(async()=>{
    const catalog=await(await fetch('/catalog/manifest.json')).json();
    const tr=catalog.items.find(i=>i.name==='Türkiye'),cn=catalog.items.find(i=>i.name==='Çin'),mao=catalog.items.find(i=>i.name==='Mao Zedong');
    const {prepareCatalogImage}=await import('/src/image-catalog.js');
    const draft=JSON.parse(localStorage.getItem('marble-studio-draft-v2'));
    draft.mode='track';draft.ballNames=['Renamed country','Çin','Renamed Mao'];draft.ballImages=[await prepareCatalogImage(tr),null,await prepareCatalogImage(mao)];
    draft.sound=false;draft.presentation.countdown=0;
    localStorage.setItem('marble-studio-draft-v2',JSON.stringify(draft));
    localStorage.setItem('marble-studio-music-v1',JSON.stringify({mode:'leader',volume:35}));
    localStorage.removeItem('marble-studio-country-music-v1');
    return {tr:tr.id,cn:cn.id,mao:mao.id,us:catalog.items.find(i=>i.name==='ABD').id};
  });
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  await page.evaluate(async()=>{
    const {Race}=await import('/src/physics.js'),original=Race.prototype.ranking;
    window.testLeaderId=0;
    Race.prototype.ranking=function(){
      const ranked=original.call(this),leader=ranked.find(ball=>ball.id===window.testLeaderId);
      return leader?[leader,...ranked.filter(ball=>ball!==leader)]:ranked;
    };
  });
  await page.locator('#start').click();
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id&&window.marbleStudio.getState().music.position>.35,ids.tr);
  assert.equal((await page.evaluate(()=>window.marbleStudio.getState())).leader,'Renamed country','Catalog flag identifies a renamed country');
  const switched=await page.evaluate(async()=>{
    const start=performance.now();window.testLeaderId=1;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    return {elapsed:performance.now()-start,music:window.marbleStudio.getState().music};
  });
  assert.equal(switched.music.country,ids.cn);assert.ok(switched.elapsed<500,'No two-second hold or fade');
  const trPosition=switched.music.cursors[ids.tr];assert.ok(trPosition>.35);
  await page.waitForFunction(()=>window.marbleStudio.getState().music.position>.3);
  await page.evaluate(()=>window.testLeaderId=0);
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id,ids.tr);
  const resumed=await page.evaluate(()=>window.marbleStudio.getState().music);
  assert.ok(resumed.position+1e-6>=trPosition&&resumed.position<trPosition+.4,`Expected resume near ${trPosition}, got ${resumed.position}`);
  assert.ok(resumed.cursors[ids.cn]>.3);
  await page.evaluate(()=>window.testLeaderId=2);
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id,ids.mao);
  const maoState=await page.evaluate(()=>window.marbleStudio.getState().music);
  assert.ok(maoState.position<.3,'Mao has a separate playback position from China');
  await page.waitForFunction(()=>window.marbleStudio.getState().music.position>.35);
  await page.evaluate(()=>window.testLeaderId=1);
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id,ids.cn);
  assert.ok((await page.evaluate(()=>window.marbleStudio.getState().music.position))+1e-6>=resumed.cursors[ids.cn]);
  await page.evaluate(()=>window.testLeaderId=0);
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id,ids.tr);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().music.country===null);
  const paused=await page.evaluate(()=>window.marbleStudio.getState().music.cursors);
  await page.locator('#pause').click();
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id,ids.tr);
  const afterPause=await page.evaluate(()=>window.marbleStudio.getState().music.position);
  assert.ok(afterPause+1e-6>=paused[ids.tr],`Resume position ${afterPause} must preserve ${paused[ids.tr]}`);
  await page.locator('#reset').click();
  assert.deepEqual((await page.evaluate(()=>window.marbleStudio.getState().music)).cursors,{});
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().recording&&window.marbleStudio.getState().time>1);
  assert.equal(await page.evaluate(()=>window.recordedAudioTracks),1);
  await page.evaluate(()=>window.testLeaderId=1);
  await page.waitForFunction(id=>window.marbleStudio.getState().music.country===id&&window.marbleStudio.getState().music.position>.3,ids.cn);
  await page.locator('#race').screenshot({path:'artifacts/leader-music-recording.png'});
  await page.waitForFunction(()=>window.marbleStudio.getState().time>5);
  const download=page.waitForEvent('download');await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await download;
  assert.ok(await page.evaluate(async()=>{
    const context=new AudioContext();
    try {
      const buffer=await context.decodeAudioData(await(await fetch(document.querySelector('#download-video').href)).arrayBuffer());
      return buffer.getChannelData(0).some(sample=>Math.abs(sample)>.005);
    }finally{await context.close();}
  }),'Video contains actual audio');
  await page.locator('#reset').click();await page.locator('#back-to-editor').click();
  await page.locator('#mode-arena').click();await page.locator('#start').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().time>.2);
  assert.equal((await page.evaluate(()=>window.marbleStudio.getState().music)).country,null,'Country music is not enabled in arena');
  await page.locator('#reset').click();await page.locator('#back-to-editor').click();await page.locator('#mode-track').click();
  await page.locator('#nav-watch').click();
  await page.locator('#music-countries summary').click();
  await page.locator('#music-country').selectOption(ids.us);
  assert.equal(await page.locator('#music-country-track').inputValue(),'country-us');
  await page.locator('#country-music-preview').evaluate(audio=>audio.play());
  await page.waitForFunction(()=>document.querySelector('#country-music-preview').currentTime>.1);
  const previewDuration=await page.locator('#country-music-preview').evaluate(audio=>audio.duration);
  assert.ok(previewDuration>15&&previewDuration<16,'USA preview contains the requested chorus only');
  await page.locator('#music-country').selectOption(ids.cn);
  assert.ok(await page.locator('#country-music-preview').evaluate(audio=>audio.paused));
  assert.equal(await page.locator('#music-country-track').inputValue(),'red-sun-in-the-sky');
  await page.locator('#music-country').selectOption(ids.mao);
  assert.equal(await page.locator('#music-country-track').inputValue(),'red-sun-in-the-sky');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('.music-panel').screenshot({path:'artifacts/leader-music-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log('PASS: Mao catalog selection, default Turkey/China/Mao music, renamed portraits, immediate switch, independent resume, pause/reset, recorded audio, arena exclusion and mobile layout.');
}finally{await browser.close();}
