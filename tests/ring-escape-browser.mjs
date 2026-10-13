import assert from 'node:assert/strict';
import {mkdir,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';

const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174';
await mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1360,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    window.audioProbe={sources:0,tones:0};
    const source=AudioBufferSourceNode.prototype.start,tone=OscillatorNode.prototype.start;
    AudioBufferSourceNode.prototype.start=function(...a){window.audioProbe.sources++;return source.apply(this,a);};
    OscillatorNode.prototype.start=function(...a){window.audioProbe.tones++;return tone.apply(this,a);};
  });
  await page.goto(origin+'/ring-escape.html');await page.waitForFunction(()=>window.ringStudio?.state().time>0);
  assert.equal(await page.evaluate(()=>ringStudio.snapshot().count),1200);
  for(const [layout,count] of [['pulse',1800],['rush',2400],['vortex',1200]]){
    await page.click('[data-flow='+layout+']');
    assert.equal(await page.evaluate(()=>ringStudio.snapshot().count),count);
    assert.equal(await page.locator('[data-flow='+layout+']').getAttribute('aria-pressed'),'true');
  }
  await page.click('#pause');const paused=await page.evaluate(()=>ringStudio.state().time);
  await page.waitForTimeout(180);assert.equal(await page.evaluate(()=>ringStudio.state().time),paused);
  await page.click('[data-theme=aurora]');await page.fill('#title','SON HALKADAN KAÇ');
  assert.equal(await page.evaluate(()=>ringStudio.state().time),paused,'appearance preserves simulation');
  await page.selectOption('#shape','diamond');
  const settings=await page.evaluate(()=>ringStudio.snapshot());
  await page.reload();await page.waitForFunction(()=>window.ringStudio);
  assert.deepEqual(await page.evaluate(()=>ringStudio.snapshot()),settings);
  await page.click('#sound');await page.waitForFunction(()=>ringStudio.state().audio==='running'&&ringStudio.state().musicPlaying);
  await page.waitForFunction(()=>audioProbe.tones>0);
  assert.ok(await page.evaluate(()=>audioProbe.sources>0));
  await page.selectOption('#music','ambient');
  await page.waitForFunction(()=>!ringStudio.state().musicPlaying);
  const tones=await page.evaluate(()=>audioProbe.tones);await page.waitForFunction(n=>audioProbe.tones>n,tones);
  await page.locator('#effects-volume').fill('17');await page.locator('#music-volume').fill('41');
  assert.equal(await page.evaluate(()=>ringStudio.snapshot().effectsVolume),.17);
  assert.equal(await page.evaluate(()=>ringStudio.snapshot().musicVolume),.41);
  const png=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=16;const x=c.getContext('2d');x.fillStyle='red';x.fillRect(0,0,16,16);return c.toDataURL().split(',')[1];});
  await page.locator('#image-upload').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await page.waitForFunction(()=>ringStudio.snapshot().image?.startsWith('data:image/webp'));
  await page.click('#remove-image');assert.equal(await page.evaluate(()=>ringStudio.snapshot().image),null);
  await page.selectOption('#layout','twist');assert.equal(await page.evaluate(()=>ringStudio.snapshot().layout),'twist');
  await page.selectOption('#layout','aligned');await page.selectOption('#shape','comet');await page.click('[data-theme=studio]');
  await page.click('[data-flow=vortex]');await page.selectOption('#speed','2');await page.selectOption('#music','reference');
  const downloading=page.waitForEvent('download',{timeout:25000});downloading.catch(()=>{});await page.click('#export');
  await page.waitForFunction(()=>ringStudio.state().recording);assert.equal(await page.locator('#seed').isDisabled(),true);
  const download=await downloading;await download.saveAs('artifacts/ring-escape-export.webm');
  await page.waitForFunction(()=>!ringStudio.state().recording);
  assert.equal(await page.evaluate(()=>ringStudio.state().state),'won');
  assert.equal(await page.locator('#seed').isDisabled(),false);
  assert.ok((await stat('artifacts/ring-escape-export.webm')).size>10000);
  const pcm=execFileSync('node_modules/ffmpeg-static/ffmpeg.exe',['-v','error','-i','artifacts/ring-escape-export.webm','-map','0:a:0','-f','f32le','-ac','1','-ar','16000','pipe:1'],{maxBuffer:4*1024*1024,windowsHide:true});
  let peak=0;for(let i=0;i<pcm.length;i+=4)peak=Math.max(peak,Math.abs(pcm.readFloatLE(i)));
  assert.ok(peak>.005&&peak<1,'new flow export contains audible, bounded audio');
  assert.ok(pcm.length/4/16000>7,'new flow export includes the complete escape');
  await page.selectOption('#speed','1');await page.click('[data-flow=vortex]');
  await page.waitForFunction(()=>ringStudio.state().broken>=4);await page.click('#pause');
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'artifacts/ring-escape-desktop.jpg',type:'jpeg',quality:72});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'mobile has no horizontal overflow');
  await page.screenshot({path:'artifacts/ring-escape-mobile.jpg',type:'jpeg',quality:65});
  assert.deepEqual(errors,[]);
  console.log('PASS: pause, themes, persistence, original music, ambient, independent volumes, image upload, layout, complete video export and mobile.');
  console.log('Local screenshot bytes:',(await stat('artifacts/ring-escape-desktop.jpg')).size,(await stat('artifacts/ring-escape-mobile.jpg')).size);
}finally{await browser.close();}
