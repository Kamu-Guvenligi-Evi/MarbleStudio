import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('artifacts',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173?edit=1');await page.waitForFunction(()=>window.marbleStudio);
  await page.locator('#clear-course').click();
  for(const [index,type] of ['shortcut','crossramps'].entries()) {
    await page.locator('#open-library').click();
    assert.ok(await page.locator(`[data-piece=${type}] .piece-tag`).isVisible());
    if(index===0)await page.screenshot({path:'artifacts/new-sections-library.png'});
    await page.locator(`[data-piece=${type}]`).click();
    await page.locator(`.inspect-piece[data-inspect="${index}"]`).click();
    const key=index===0?'gap':'slope',value=index===0?100:1.1;
    await page.locator(`#section-${key}`).evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},value);
    await page.locator('#test-section').click();
    await page.waitForFunction(()=>window.marbleStudio.getSectionState()?.state==='finished',{}, {timeout:15000});
    assert.equal(await page.evaluate(()=>window.marbleStudio.getState().time),0);
    await page.screenshot({path:`artifacts/${type}-preview.png`});
    await page.locator('#apply-section').click();
  }
  await page.reload();await page.waitForFunction(()=>window.marbleStudio);
  const sections=await page.evaluate(()=>window.marbleStudio.getState().sections);
  assert.deepEqual(sections.map(s=>s.type),['shortcut','crossramps']);
  assert.equal(sections[0].settings.gap,100);assert.equal(sections[1].settings.slope,1.1);
  await page.setViewportSize({width:390,height:844});await page.locator('#open-library').click();
  await page.screenshot({path:'artifacts/new-sections-mobile.png'});
  assert.ok(await page.evaluate(()=>document.querySelector('#library-dialog').scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS: both new pieces added from library, configured, previewed to finish, persisted after reload, and visible on mobile.');
} finally {await browser.close();}
