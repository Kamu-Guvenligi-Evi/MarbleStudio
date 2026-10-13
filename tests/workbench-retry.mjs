import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {productionBrowserOptions} from '../scripts/browser-runtime.mjs';
const origin=process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5173';
const browser=await chromium.launch(productionBrowserOptions());
try{
  const page=await browser.newPage();
  await page.goto(origin+'/factory-render.html');
  await page.evaluate(async()=>{
    const {createWorkbench}=await import('/src/workbench.js');
    let captures=0;
    window.testWorkbench=createWorkbench({
      capture:async()=>{if(++captures===1)throw new TypeError('Failed to fetch');return {mode:'track',project:{seed:2048,count:2,sequence:['shortcut']}};},
      thumbnail:()=>document.querySelector('canvas').toDataURL(),
      title:()=>'',notify:()=>{},isLocked:()=>false,openSnapshot:()=>{},
    });
    await window.testWorkbench.openExport();
  });
  assert.equal(await page.locator('#video-submit').textContent(),'Tekrar dene');
  assert.equal(await page.locator('#video-submit').isEnabled(),true);
  await page.locator('#video-submit').click();
  await page.waitForFunction(()=>document.querySelector('#video-submit').textContent==='Videoyu hazırla');
  console.log('PASS: a failed snapshot can be recaptured with Retry.');
}finally{await browser.close();}
