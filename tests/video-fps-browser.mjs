const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/factory?*',route=>route.fulfill({json:{apiVersion:4,capabilities:['studio-workbench'],jobs:[],total:0,summary:{}}}));
  await page.goto((origin+'?edit=1'));await page.waitForFunction(()=>window.marbleStudio);
  const automatic=await page.evaluate(async()=>{const {automaticOptions}=await import('/src/automatic-home.js');return Promise.all(['auto','track','arena','territory','spiral','statistics'].map(automaticOptions));});
  assert.ok(automatic.every(options=>options.fps===144));
  await page.evaluate(()=>localStorage.setItem('marble-studio-export-track-v1',JSON.stringify({fps:'30',resolution:'720',orientation:'landscape'})));
  await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('[name=fps]').inputValue(),'144');assert.match(await page.locator('#video-format-note').textContent(),/144 FPS/);
  assert.equal(await page.locator('[name=resolution]').inputValue(),'720');assert.equal(await page.locator('[name=orientation][value=landscape]').isChecked(),true);
  await page.locator('#video-dialog [data-wb-close]').click();
  await page.evaluate(()=>localStorage.setItem('marble-studio-export-track-v1',JSON.stringify({fps:'240',fpsDefaultVersion:3,resolution:'720',orientation:'landscape'})));
  await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('[name=fps]').inputValue(),'144','Saved 240 FPS default must migrate');
  assert.equal(await page.locator('[name=resolution]').inputValue(),'720');
  await page.locator('#video-dialog [data-wb-close]').click();
  await page.evaluate(()=>localStorage.setItem('marble-studio-export-track-v1',JSON.stringify({fps:'60',fpsDefaultVersion:3})));
  await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('[name=fps]').inputValue(),'60','Previous custom choices remain available');
  await page.locator('#video-advanced summary').click();await page.locator('[name=fps]').fill('360');await page.locator('[name=fps]').dispatchEvent('change');await page.locator('#video-dialog [data-wb-close]').click();
  await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');assert.equal(await page.locator('[name=fps]').inputValue(),'360','Explicit high frame rates remain available');
  await page.goto((origin+'/factory.html'));assert.equal(await page.locator('[name=fps]').inputValue(),'144');
  assert.deepEqual(errors,[]);console.log('PASS: 144 FPS defaults, saved 240 FPS migration, previous custom preferences, other settings preserved, explicit 360 FPS choice.');
}finally{await browser.close();}
