import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {COLLISION_SOUNDS} from '../src/impact-audio.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.TEST_FACTORY_ORIGIN??'http://127.0.0.1:5174')+'?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.locator('#collision-sound option').count(),Object.keys(COLLISION_SOUNDS).length);
  assert.equal(await page.locator('#collision-sound option[value="bruh"]').evaluate(el=>el.parentElement.label),'Konuşma ve tepki sesleri');
  await page.locator('#collision-sound').selectOption('meme-meow');
  assert.ok(await page.locator('#sound').isChecked());
  await page.locator('#preview-collision-sound').click();
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.locator('#collision-sound').inputValue(),'meme-meow');
  await page.locator('#nav-arena').click();await page.locator('#collision-sound').selectOption('bonk');
  await page.locator('#nav-track').click();assert.equal(await page.locator('#collision-sound').inputValue(),'meme-meow');
  await page.locator('#nav-arena').click();assert.equal(await page.locator('#collision-sound').inputValue(),'bonk');
  for(const [mode,sound] of [['territory','bell'],['spiral','pop']]){
    await page.locator('#nav-'+mode).click();
    assert.ok(await page.locator('#watch-view').getByRole('heading',{name:'Ses menüsü',exact:true}).isVisible());
    await page.locator('#collision-sound').selectOption(sound);await page.locator('#preview-collision-sound').click();
    await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-'+mode).click();
    assert.equal(await page.locator('#collision-sound').inputValue(),sound);
  }
  await page.locator('#nav-pi').click();await page.locator('#pi-collision-sound').selectOption('bonk');
  assert.equal(await page.locator('#pi-collision-sound option[value="bell"]').evaluate(el=>el.parentElement.label),'Ses efektleri ve müzikal sesler');
  await page.locator('#pi-preview-sound').click();assert.equal(await page.locator('#pi-sound-status').textContent(),'Ön dinleme');
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-pi').click();
  assert.equal(await page.locator('#pi-collision-sound').inputValue(),'bonk');
  assert.equal(await page.evaluate(()=>window.marbleStudio.getPiState().collisionSound),'bonk');
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Pi sound menu fits mobile');
  await page.locator('#nav-arena').click();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Core sound menu fits mobile');
  const energies=await page.evaluate(async()=>{
    const {COLLISION_SOUNDS,collisionEvent,playEffect}=await import('/src/impact-audio.js');
    const energies=[];
    for(const sound of Object.keys(COLLISION_SOUNDS)){
      const context=new OfflineAudioContext(2,5*48000,48000);
      playEffect(context,context.destination,collisionEvent({type:'impact',x:515},sound));
      const rendered=await context.startRendering();
      energies.push([0,1].map(c=>rendered.getChannelData(c).reduce((sum,x)=>sum+x*x,0)));
    }
    return energies;
  });
  for(const [left,right] of energies){assert.ok(left>0);assert.ok(right>left);}
  await page.locator('#sound').uncheck();await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#nav-arena').click();assert.equal(await page.locator('#sound').isChecked(),false);
  assert.deepEqual(errors,[]);
  console.log(`PASS: sound selector, preview, per-mode persistence, mute persistence and ${Object.keys(COLLISION_SOUNDS).length} stereo Web Audio effects.`);
}finally{await browser.close();}
