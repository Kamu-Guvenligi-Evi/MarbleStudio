import assert from 'node:assert/strict';
import {mkdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {RPS_MAPS} from '../src/rock-paper-scissors.js';
const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5173';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1360,height:1000}}),errors=[];
  await page.addInitScript(()=>{window.renderedText=new Set();const draw=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(value,...args){window.renderedText.add(value);return draw.call(this,value,...args);};});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/rock-paper-scissors.html');await page.waitForFunction(()=>window.rpsStudio?.state().time>0);
  assert.equal(await page.evaluate(()=>rpsStudio.state().total),60);
  assert.equal(await page.evaluate(()=>[...renderedText].some(t=>/SON PARÇADAN|Bir taraf seç|TAŞ  →|DÖNÜŞÜM/.test(t))),false,'removed cycle and footer text');
  await page.click('#pause');const time=await page.evaluate(()=>rpsStudio.state().time);
  await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>rpsStudio.state().time),time);
  await page.fill('#title','KİM KAZANACAK?');await page.selectOption('#background','minimal');
  assert.equal(await page.evaluate(()=>rpsStudio.state().time),time);
  assert.equal(await page.evaluate(()=>rpsStudio.snapshot().title),'KİM KAZANACAK?');
  await page.selectOption('#count','30');assert.equal(await page.evaluate(()=>rpsStudio.state().total),90);
  await page.selectOption('#count','20');await page.selectOption('#background','nebula');
  assert.equal(await page.locator('#map option').count(),Object.keys(RPS_MAPS).length);
  for(const [map,definition] of Object.entries(RPS_MAPS)){
    await page.selectOption('#map',map);assert.equal(await page.evaluate(()=>rpsStudio.snapshot().map),map);
    assert.equal(await page.evaluate(()=>rpsStudio.state().total),60);
    if(definition.moving){
      const before=await page.evaluate(()=>rpsStudio.state().obstacles);await page.waitForTimeout(200);
      assert.notDeepEqual(await page.evaluate(()=>rpsStudio.state().obstacles),before);
      await page.click('#pause');const paused=await page.evaluate(()=>rpsStudio.state().obstacles);await page.waitForTimeout(150);
      assert.deepEqual(await page.evaluate(()=>rpsStudio.state().obstacles),paused);
    }
  }
  await page.locator('.map-gallery summary').click();await page.locator('[data-map="binary"]').click();
  assert.equal(await page.inputValue('#map'),'binary');assert.equal(await page.locator('[data-map="binary"]').getAttribute('aria-pressed'),'true');
  await page.selectOption('#game-sound-style','melodic-piano');
  const settings=await page.evaluate(()=>rpsStudio.snapshot());await page.reload();await page.waitForFunction(()=>window.rpsStudio);
  assert.deepEqual(await page.evaluate(()=>rpsStudio.snapshot()),settings);
  await page.click('#replay');await page.waitForFunction(()=>rpsStudio.state().conversions>4);
  await page.waitForFunction(()=>rpsStudio.state().audio.played>0);
  await page.click('#pause');await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:'artifacts/rps-desktop.jpg',type:'jpeg',quality:72});
  await page.locator('#rps-canvas').screenshot({path:'artifacts/rps-arena.png'});
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no mobile overflow');
    assert.equal(await page.locator('#export').isVisible(),true);
  }
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/rps-mobile.jpg',type:'jpeg',quality:65});
  await page.setViewportSize({width:1360,height:1000});
  const downloading=page.waitForEvent('download',{timeout:30000});await page.click('#export');
  await page.waitForFunction(()=>rpsStudio.state().recording);assert.equal(await page.locator('#seed').isDisabled(),true);
  await page.waitForFunction(()=>rpsStudio.state().conversions>8);await page.waitForTimeout(500);await page.click('#export');
  const download=await downloading;await download.saveAs('artifacts/rps-export.webm');
  await page.waitForFunction(()=>!rpsStudio.state().recording);assert.equal(await page.locator('#seed').isDisabled(),false);
  assert.ok((await stat('artifacts/rps-export.webm')).size>20000);
  const ffmpeg='node_modules/ffmpeg-static/ffmpeg.exe';
  const pcm=execFileSync(ffmpeg,['-v','error','-i','artifacts/rps-export.webm','-map','0:a:0','-f','f32le','-ac','1','-ar','16000','pipe:1'],{maxBuffer:4*1024*1024,windowsHide:true});
  let peak=0;for(let i=0;i<pcm.length;i+=4)peak=Math.max(peak,Math.abs(pcm.readFloatLE(i)));
  assert.ok(peak>.005&&peak<1,`export audio bounded and audible: ${peak}`);
  const dimensions=execFileSync(ffmpeg,['-v','error','-i','artifacts/rps-export.webm','-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],{maxBuffer:3*1024*1024,windowsHide:true});
  assert.equal(dimensions.readUInt32BE(16),1080);assert.equal(dimensions.readUInt32BE(20),1920);
  // Completion must finalize the recorder itself and preserve the victory frame.
  await page.selectOption('#map','gates');await page.selectOption('#count','10');await page.selectOption('#speed','2');
  await page.click('#sound');
  const complete=page.waitForEvent('download',{timeout:100000});await page.click('#export');
  const fullDownload=await complete;await fullDownload.saveAs('artifacts/rps-complete-silent.webm');
  await page.waitForFunction(()=>!rpsStudio.state().recording);assert.equal(await page.evaluate(()=>rpsStudio.state().state),'won');
  assert.equal(await page.locator('#map').isDisabled(),false);
  assert.deepEqual(errors,[]);
  console.log('PASS: counters, maps, removed text, preserved title, pause, settings persistence, conversions, audio, responsive layouts, 1080×1920 WebM with sound, automatic completion and controls restored.');
  console.log('Local preview bytes:',(await stat('artifacts/rps-desktop.jpg')).size,(await stat('artifacts/rps-mobile.jpg')).size,(await stat('artifacts/rps-arena.png')).size);
}finally{await browser.close();}
