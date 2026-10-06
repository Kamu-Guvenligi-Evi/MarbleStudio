import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeBallImages} from '../src/ball-images.js';
assert.throws(()=>normalizeBallImages(['https://example.com/picture.png']));
assert.throws(()=>normalizeBallImages(['data:image/svg+xml;base64,AAAA']));
assert.throws(()=>normalizeBallImages(Array(21).fill(null)));
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
 const data=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=320;c.height=200;const ctx=c.getContext('2d');ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,320,200);ctx.fillStyle='#ffffff';ctx.fillRect(145,60,30,80);return c.toDataURL('image/png').split(',')[1];});
 await page.locator('#open-balls').click();
 await page.locator('[data-upload="0"]').click();
 await page.locator('#ball-image-file').setInputFiles({name:'portrait.png',mimeType:'image/png',buffer:Buffer.from(data,'base64')});
 await page.waitForFunction(()=>document.querySelector('#ball-image-status').textContent.includes('eklendi'));
 assert.equal(await page.locator('.ball-portrait img').count(),1);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages[0]);assert.ok(saved.startsWith('data:image/webp;'));
 await page.screenshot({path:'artifacts/ball-images-desktop.png'});
 await page.locator('#ball-image-file').setInputFiles({name:'bad.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
 await page.waitForFunction(()=>document.querySelector('#ball-image-status').textContent.includes('okunamadı'));
 assert.equal(await page.locator('.ball-portrait img').count(),1);
 await page.reload();await page.waitForFunction(()=>window.marbleStudio);await page.locator('#open-balls').click();assert.equal(await page.locator('.ball-portrait img').getAttribute('src'),saved);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/ball-images-mobile.png'});
 assert.ok(await page.evaluate(()=>document.querySelector('#balls-dialog').scrollWidth<=innerWidth));
 await page.keyboard.press('Escape');await page.setViewportSize({width:1280,height:950});
 // Verify the portrait is drawn into the actual video canvas, not a DOM overlay.
 const pixel=await page.evaluate(async()=>{
   const {Race}=await import('/src/physics.js'),{renderRace}=await import('/src/renderer.js');
   const {loadBallImage}=await import('/src/ball-images.js');const images=JSON.parse(localStorage.getItem('marble-studio-track-v1')).ballImages;await loadBallImage(images[0]);
   const r=new Race({ballImages:images,count:6,sequence:['shortcut']});const b=r.balls[0];
   const c=document.createElement('canvas');c.width=1080;c.height=1920;const ctx=c.getContext('2d');renderRace(ctx,r,{cameraY:0,countdown:0,paused:false,trails:false,preview:0});
   const p=[...ctx.getImageData(Math.round((b.body.position.x-8)*2),Math.round(b.body.position.y*2),1,1).data];r.dispose();return p;
 });assert.ok(pixel[0]>200&&pixel[1]<80&&pixel[2]>200,`Portrait missing from canvas: ${pixel}`);
 const backupEvent=page.waitForEvent('download');await page.locator('#studio-backup').click();await(await backupEvent).saveAs('artifacts/portraits.studio.json');
 const backup=JSON.parse(fs.readFileSync('artifacts/portraits.studio.json','utf8'));
 assert.equal(JSON.parse(backup.entries['marble-studio-track-v1']).ballImages[0],saved);
 await page.locator('#open-balls').click();await page.locator('[data-remove="0"]').click();assert.equal(await page.locator('.ball-portrait img').count(),0);await page.keyboard.press('Escape');
 await page.locator('#studio-backup-file').setInputFiles('artifacts/portraits.studio.json');await page.waitForEvent('load');await page.waitForFunction(()=>window.marbleStudio);
 await page.locator('#open-balls').click();assert.equal(await page.locator('.ball-portrait img').getAttribute('src'),saved);await page.keyboard.press('Escape');
 await page.locator('#nav-track').click();const download=page.waitForEvent('download');await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await page.waitForFunction(()=>window.marbleStudio.getState().time>1);await page.locator('#webm-options').evaluate(el=>el.open=true);await page.locator('#record').click();await(await download).saveAs('artifacts/portraits.webm');assert.ok(fs.statSync('artifacts/portraits.webm').size>10000);
 assert.deepEqual(errors,[]);console.log('PASS: upload, invalid image rejection, canvas portrait pixels, reload, removal, named save, backup/import, mobile layout and video capture with portraits.');
}finally{await browser.close();}
