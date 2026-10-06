import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1366,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 const course=await page.evaluate(()=>window.marbleStudio.getState().sections);
 await page.locator('#nav-arena').click();assert.ok(await page.locator('#track-view').isHidden());assert.ok(await page.locator('#arena-view').isVisible());
 await page.locator('#open-balls').click();await page.locator('#open-catalog').click();await page.locator('[data-category="zodiac"]').click();await page.locator('#catalog-fill').click();await page.waitForFunction(()=>document.querySelector('#catalog-status').textContent.includes('Kadron'));
 await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 await page.locator('#open-settings').click();await page.locator('#seed').fill('2');await page.locator('#seed').dispatchEvent('change');await page.locator('#countdown-seconds').fill('0');await page.locator('#countdown-seconds').dispatchEvent('change');await page.locator('#settings-done').click();
 await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#nav-arena').click();
 await page.screenshot({path:'artifacts/arena-editor.png'});
 
 const download=page.waitForEvent('download',{timeout:45000});await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();
 await page.waitForFunction(()=>window.marbleStudio.getState().cuts>0);await page.locator('#pause').click();
 const frozen=await page.evaluate(()=>window.marbleStudio.getState().time);await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.marbleStudio.getState().time),frozen);
 await page.locator('#pause').click();await page.locator('#race').screenshot({path:'artifacts/arena-battle.png'});
 await page.waitForFunction(()=>window.marbleStudio.getState().state==='finished',{},{timeout:30000});
 assert.equal(await page.evaluate(()=>window.marbleStudio.getState().active),1);await page.locator('#race').screenshot({path:'artifacts/arena-winner.png'});
 await(await download).saveAs('artifacts/arena-battle.webm');
 await page.locator('#nav-track').click();
 assert.deepEqual(await page.evaluate(()=>window.marbleStudio.getState().sections),course);assert.ok(await page.locator('#track-view').isVisible());
 await page.setViewportSize({width:390,height:844});await page.locator('#nav-arena').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'artifacts/arena-mobile.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS: mode switching, zodiac roster, persistence, paused clock, last survivor, automatic video download, preserved course and mobile layout.');
}finally{await browser.close();}
