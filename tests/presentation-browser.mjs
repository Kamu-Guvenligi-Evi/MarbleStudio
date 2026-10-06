import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#1755a0';ctx.fillRect(0,0,128,128);ctx.fillStyle='#fff';ctx.font='bold 72px sans-serif';ctx.textAlign='center';ctx.fillText('★',64,90);
   const draft={name:'Şehirler Kupası',seed:2048,count:6,sequence:['shortcut'],ballNames:['İstanbul','Ankara','İzmir','Bursa','Antalya','Trabzon'],ballImages:Array(6).fill(c.toDataURL('image/png'))};
   localStorage.setItem('marble-studio-track-v1',JSON.stringify(draft));
 });
 await page.reload();await page.waitForFunction(()=>window.marbleStudio);
 const state=()=>page.evaluate(()=>window.marbleStudio.getState());
 assert.equal((await state()).presentation.camera,'smart');
 await page.locator('#open-balls').click();await page.locator('[data-name="0"]').fill('İstanbul Takımı');await page.locator('[data-name="1"]').fill('<b>Takım</b>');await page.keyboard.press('Tab');await page.keyboard.press('Escape');
 await page.locator('#nav-track').click();assert.equal(await page.locator('#ranking .rank-name b').count(),0);assert.ok((await state()).names.includes('<b>Takım</b>'));
 await page.locator('#nav-track').click();await page.locator('#open-balls').click();await page.locator('[data-name="1"]').fill('Ankara');await page.keyboard.press('Tab');
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/names-mobile.png'});assert.ok(await page.evaluate(()=>document.querySelector('#balls-dialog').scrollWidth<=innerWidth));await page.keyboard.press('Escape');await page.setViewportSize({width:1440,height:1000});
 await page.locator('#open-settings').click();await page.locator('#countdown-seconds').fill('0');await page.locator('#outro-seconds').fill('2');await page.locator('#settings-done').click();
 await page.reload();await page.waitForFunction(()=>window.marbleStudio);assert.equal((await state()).names[0],'İstanbul Takımı');assert.deepEqual((await state()).presentation,{countdown:0,outro:2,camera:'smart'});
 await page.locator('#nav-track').click();await page.locator('.playback-settings summary').click();await page.locator('#camera').selectOption('pack');assert.equal((await state()).presentation.camera,'pack');await page.locator('#camera').selectOption('smart');
 const download=page.waitForEvent('download',{timeout:30000});await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await page.waitForFunction(()=>window.marbleStudio.getState().recording);assert.equal((await state()).countdown,0);assert.equal(await page.locator('#camera').isDisabled(),true);
 await page.waitForFunction(()=>window.marbleStudio.getState().finished>0);await page.locator('#race').screenshot({path:'artifacts/winner-moment.png'});
 await page.waitForFunction(()=>window.marbleStudio.getState().state==='finished');
 const podium=(await state()).podium;assert.equal(podium.length,3);assert.ok(podium[0].time<=podium[1].time&&podium[1].time<=podium[2].time);
 await page.locator('#race').screenshot({path:'artifacts/finale-canvas.png'});
 await(await download).saveAs('artifacts/finale.webm');assert.ok((await state()).resultElapsed>=2);assert.ok(fs.statSync('artifacts/finale.webm').size>10000);
 await page.locator('#open-settings').click();await page.locator('#countdown-seconds').fill('2');await page.locator('#settings-done').click();await page.locator('#new-race').click();
 assert.ok((await state()).countdown>1);await page.locator('#pause').click();const frozen=(await state()).countdown;await page.waitForTimeout(250);assert.equal((await state()).countdown,frozen);await page.locator('#pause').click();await page.waitForFunction(()=>window.marbleStudio.getState().time>0);
 assert.deepEqual(errors,[]);console.log('PASS: custom names and literal HTML, mobile name fields, timing persistence, zero/countdown start and pause, smart/manual camera, portrait podium, ordered times, and automatic video stop after configured outro.');
}finally{await browser.close();}
