import assert from 'node:assert/strict';
import {mkdir,stat} from 'node:fs/promises';
import {chromium} from 'playwright';
const origin=process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:870,height:535}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/ring-escape.html');
  await page.evaluate(()=>localStorage.setItem('marble-studio-ring-escape-v1',JSON.stringify({experienceVersion:2,layout:'vortex',count:56,seed:92,theme:'ember',music:'off',effectsVolume:.17,soundOverrides:{hit:'off',break:'original'},title:'BENİM HALKALARIM'})));
  await page.reload();await page.waitForFunction(()=>window.ringStudio);
  let s=await page.evaluate(()=>ringStudio.snapshot());
  assert.equal(s.layout,'vortex');assert.equal(s.count,1200);assert.equal(s.experienceVersion,8);
  for(const flow of ['pulse','rush','vortex']){
    await page.click('[data-flow='+flow+']');s=await page.evaluate(()=>ringStudio.snapshot());
    assert.equal(s.theme,'ember');assert.equal(s.music,'off');assert.equal(s.effectsVolume,.17);
    assert.equal(s.title,'BENİM HALKALARIM');assert.deepEqual(s.soundOverrides,{hit:'off',break:'original'});
  }
  await page.selectOption('#layout','twist');await page.selectOption('#count','18');
  await page.reload();await page.waitForFunction(()=>window.ringStudio);
  assert.equal(await page.evaluate(()=>ringStudio.snapshot().layout),'twist','migration only runs once');
  await page.click('[data-flow=vortex]');await page.click('#new-flow');await page.waitForFunction(()=>!document.getElementById('new-flow').disabled);
  assert.ok(await page.evaluate(()=>ringStudio.snapshot().seed>0));
  await page.goto(origin+'/ring-escape.html');await page.waitForFunction(()=>window.ringStudio);
  await page.click('#pause');
  await page.evaluate(async()=>{
    const {RingEscape,FLOW_PRESETS}=await import('/src/ring-escape.js');
    const {renderRingEscape}=await import('/src/ring-escape-renderer.js');
    const strip=document.createElement('div');strip.id='flow-contact';strip.style.cssText='position:fixed;inset:0;z-index:9999;background:#101816;display:flex;gap:15px;padding:15px;align-items:flex-start';
    for(const [layout,preset] of Object.entries(FLOW_PRESETS)){
      const canvas=document.createElement('canvas');canvas.width=540;canvas.height=960;canvas.style.cssText='width:270px;height:480px;border-radius:12px';
      const game=new RingEscape({...preset,layout});while(game.time<.9)game.step(1/120);
      renderRingEscape(canvas.getContext('2d'),game);strip.append(canvas);
    }document.body.append(strip);
  });
  await mkdir('artifacts',{recursive:true});
  await page.screenshot({path:'artifacts/ring-flow-presets.jpg',type:'jpeg',quality:80});
  assert.deepEqual(errors,[]);
  console.log('PASS: one-time migration, preset changes preserve manual audio/appearance, saved legacy layouts, new flow generation.');
  console.log('Local preview bytes:',(await stat('artifacts/ring-flow-presets.jpg')).size);
}finally{await browser.close();}
