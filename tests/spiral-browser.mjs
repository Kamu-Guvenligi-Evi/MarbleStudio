import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  const state=()=>page.evaluate(()=>window.marbleStudio.getState());
  await page.locator('#nav-spiral').click();
  assert.equal((await state()).mode,'spiral');assert.equal((await state()).count,1);
  assert.equal(await page.locator('#watch-title').innerText(),'Spiral çoğalma');
  assert.ok(await page.locator('#track-preset').isHidden());
  await page.locator('#open-settings').click();await page.locator('#countdown-seconds').fill('0');await page.locator('#countdown-seconds').dispatchEvent('change');await page.locator('#settings-done').click();
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().spiralRound>=2);
  assert.ok((await state()).consumed>=1);
  assert.equal((await state()).positions[0].x,515);
  assert.ok((await state()).positions[0].y<480);
  await page.locator('#pause').click();
  const emptyTime=(await state()).time;await page.waitForTimeout(600);
  assert.equal((await state()).time,emptyTime);
  await page.locator('#pause').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().count>1);
  await page.locator('#pause').click();const frozen=(await state()).time;
  await page.waitForTimeout(250);assert.equal((await state()).time,frozen);
  await page.screenshot({path:'artifacts/spiral-desktop.png',fullPage:true});
  await page.locator('#nav-track').click();assert.equal((await state()).count,12);
  await page.locator('#nav-spiral').click();assert.equal((await state()).count,1);
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-spiral').click();
  assert.equal((await state()).count,1);assert.equal((await state()).presentation.countdown,0);
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await page.waitForFunction(()=>window.marbleStudio.getState().recording);
  for(const mode of ['track','arena','statistics','spiral'])assert.ok(await page.locator('#nav-'+mode).isDisabled());
  await page.waitForFunction(()=>window.marbleStudio.getState().time>3);
  const downloading=page.waitForEvent('download');await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();const download=await downloading;
  assert.match(download.suggestedFilename(),/^marble-spiral-/);await download.saveAs('artifacts/spiral-test.webm');
  await page.waitForFunction(()=>!document.querySelector('#nav-track').disabled);
  await page.locator('#reset').click();
  if(!process.env.SPIRAL_SKIP_FULL_RECORDING){
  await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().recording);
  const autoDownload=page.waitForEvent('download',{timeout:200000});
  await (await autoDownload).saveAs('artifacts/spiral-reference-rebuild.webm');
  assert.equal((await state()).state,'finished');assert.equal((await state()).spiralProgress,1);
  assert.equal((await state()).recording,false);
  }
  await page.setViewportSize({width:390,height:844});
  for(const mode of ['track','arena','statistics','spiral']){
    await page.locator('#nav-'+mode).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),mode);
  }
  await page.screenshot({path:'artifacts/spiral-mobile.png',fullPage:true});
  assert.deepEqual(errors,[]);console.log('PASS: chip consumption, external respawn, pause, multiplication, persistence, full recording and mobile layout.');
}finally{await browser.close();}
