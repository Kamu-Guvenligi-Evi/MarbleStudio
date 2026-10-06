import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.evaluate(async()=>{
    const countries=(await(await fetch('/catalog/manifest.json')).json()).items.filter(i=>i.category==='countries');
    const draft=JSON.parse(localStorage.getItem('marble-studio-draft-v2'));
    draft.count=20;draft.mode='track';draft.ballNames=countries.slice(0,20).map(c=>c.name);draft.ballImages=[];draft.presentation.countdown=0;
    localStorage.setItem('marble-studio-draft-v2',JSON.stringify(draft));
    localStorage.setItem('marble-studio-music-v1',JSON.stringify({mode:'leader',volume:35}));
  });
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#start').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().time>.2,null,{timeout:120000});
  let state=await page.evaluate(()=>window.marbleStudio.getState());
  assert.equal(state.count,20);assert.ok(state.music.country);
  await page.locator('#back-to-editor').click();
  await page.locator('#count').selectOption('6');await page.locator('#start').click();
  await page.waitForFunction(()=>window.marbleStudio.getState().time>.2);
  state=await page.evaluate(()=>window.marbleStudio.getState());
  assert.equal(state.count,6);assert.ok(state.music.country);assert.deepEqual(errors,[]);
  console.log('PASS: maximum 20-country roster preloads and plays; smaller roster restarts correctly.');
}finally{await browser.close();}
