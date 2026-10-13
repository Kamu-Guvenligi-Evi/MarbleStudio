import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {SOFT_INSTRUMENTS,SOFT_SOUNDS,SOFT_PHRASES} from '../src/soft-audio.js';
const lastInstrument=Object.keys(SOFT_INSTRUMENTS).at(-1),soundCount=Object.keys(SOFT_SOUNDS).length;
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1380,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin+'/ring-escape.html');
  await page.waitForFunction(()=>!!window.ringStudio);
  if(await page.locator('#sound').getAttribute('aria-pressed')!=='true')await page.click('#sound');
  for(const [id,name] of Object.entries(SOFT_INSTRUMENTS)){
    await page.selectOption('#sound-soft-instrument',id);
    await page.click('#sound-soft-preview');
    await page.waitForFunction(name=>document.querySelector('#director-status').textContent.includes(name),name);
    await page.click('#sound-soft-apply');
    await page.waitForFunction(()=>ringStudio.state().soundDirector.played>0);
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-ring-sound-score-v1')));
    assert(saved.plan.cues.some(c=>c.voice==='soft-'+id));
    assert(saved.plan.cues.filter(c=>c.voice!=='soft-resolve').every(c=>c.voice==='soft-'+id));
  }
  await page.locator('#soft-phrase-library summary').click();
  for(const [voice,phrase] of Object.entries(SOFT_PHRASES)){
    await page.locator(`[data-preview-phrase="${voice}"]`).click();
    await page.waitForFunction(name=>document.querySelector('#soft-phrase-status').textContent.includes(name),phrase.name);
    assert.equal(await page.locator('#sound-soft-phrase').inputValue(),voice);
  }
  await page.click('#sound-soft-apply');
  await page.reload();await page.waitForFunction(()=>!!window.ringStudio);
  assert((await page.textContent('#sound-score-title')).includes(SOFT_INSTRUMENTS[lastInstrument]));
  assert.equal(await page.locator('#sound-soft-instrument').inputValue(),lastInstrument);
  assert.equal(await page.locator('#sound-soft-phrase').inputValue(),Object.keys(SOFT_PHRASES).at(-1));
  for(const [mode,api] of [['glass-breaker','glassBreaker'],['spiral-breaker','spiralBreaker'],['ball-duel','duelStudio']]){
    await page.goto(origin+'/'+mode+'.html');await page.waitForFunction(api=>!!window[api],api);
    for(const id of Object.keys(SOFT_INSTRUMENTS))await page.selectOption('#game-sound-style','melodic-'+id);
    await page.reload();await page.waitForFunction(api=>!!window[api],api);
    assert.equal(await page.locator('#game-sound-style').inputValue(),'melodic-'+lastInstrument);
    assert.equal(await page.locator('#all-game-sounds option[value^="soft-"]').count(),soundCount);
    assert.equal(await page.locator('#all-game-sounds option[value="soft-kalimba"]').evaluate(el=>el.parentElement.label),'Yumuşak notalar ve yükseliş');
    for(const voice of ['soft-musicbox','soft-harp-rise','soft-bubbles','soft-accelerate']){
      await page.selectOption('#all-game-sounds',voice);
      await page.getByRole('button',{name:'Seçili efekti dinle',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('.sound-menu-status').textContent==='Ön dinleme');
    }
  }
  await page.goto(origin+'/');
  await page.waitForSelector('#collision-sound',{state:'attached'});
  assert.equal(await page.locator('#collision-sound option[value^="soft-"]').count(),soundCount);
  const playback=await page.evaluate(async()=>{
    const {createCollisionNotes,collisionEvent,playEffect,stopEffects}=await import('/src/impact-audio.js');
    const context=new AudioContext();await context.resume();const notes=createCollisionNotes(),degrees=[];
    for(let i=0;i<6;i++){const event=notes(collisionEvent({type:'impact'},'soft-kalimba'),i*.2);degrees.push(event.noteDegree);playEffect(context,context.destination,event);}
    stopEffects(context.destination);await context.close();return degrees;
  });
  assert.deepEqual(playback,[0,1,2,3,4,5]);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${Object.keys(SOFT_INSTRUMENTS).length} ring presets, 10 motif previews, ring save/reload, 3 game style save/reload, ${soundCount} menu entries, manual previews and live collision note progression.`);
}finally{await browser.close();}
