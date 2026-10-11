import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.locator('#collision-sound option').count(),8);
  await page.locator('#collision-sound').selectOption('meow');
  assert.ok(await page.locator('#sound').isChecked());
  await page.locator('#preview-collision-sound').click();
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  assert.equal(await page.locator('#collision-sound').inputValue(),'meow');
  await page.locator('#nav-arena').click();await page.locator('#collision-sound').selectOption('woof');
  await page.locator('#nav-track').click();assert.equal(await page.locator('#collision-sound').inputValue(),'meow');
  await page.locator('#nav-arena').click();assert.equal(await page.locator('#collision-sound').inputValue(),'woof');
  const energies=await page.evaluate(async()=>{
    const {COLLISION_SOUNDS,collisionEvent,playEffect}=await import('/src/impact-audio.js');
    const energies=[];
    for(const sound of Object.keys(COLLISION_SOUNDS)){
      const context=new OfflineAudioContext(2,48000,48000);
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
  console.log('PASS: sound selector, preview, per-mode persistence, mute persistence and eight stereo Web Audio effects.');
}finally{await browser.close();}
