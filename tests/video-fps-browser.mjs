import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/factory?*',route=>route.fulfill({json:{apiVersion:4,capabilities:['studio-workbench'],jobs:[],total:0,summary:{}}}));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  const automatic=await page.evaluate(async()=>{const {automaticOptions}=await import('/src/automatic-home.js');return Promise.all(['auto','track','arena','territory','spiral','statistics'].map(automaticOptions));});
  assert.ok(automatic.every(options=>options.fps===60));
  await page.evaluate(()=>localStorage.setItem('marble-studio-export-track-v1',JSON.stringify({fps:'30',resolution:'720',orientation:'landscape'})));
  await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  assert.equal(await page.locator('[name=fps]').inputValue(),'60');assert.match(await page.locator('#video-format-note').textContent(),/60 FPS/);
  assert.equal(await page.locator('[name=resolution]').inputValue(),'720');assert.equal(await page.locator('[name=orientation][value=landscape]').isChecked(),true);
  await page.locator('#video-advanced summary').click();await page.locator('[name=fps]').selectOption('30');await page.locator('#video-dialog [data-wb-close]').click();
  await page.locator('#studio-export').click();await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');assert.equal(await page.locator('[name=fps]').inputValue(),'30','New explicit choices remain available');
  await page.goto('http://127.0.0.1:5173/factory.html');assert.equal(await page.locator('[name=fps]').inputValue(),'60');
  assert.deepEqual(errors,[]);console.log('PASS: automatic and manual 60 FPS defaults, old preference migration, other settings preserved, explicit 30 FPS choice.');
}finally{await browser.close();}
