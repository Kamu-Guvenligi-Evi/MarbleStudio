import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]) {
    const page=await browser.newPage({viewport});const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.addInitScript(()=>localStorage.setItem('marble-historical-armies-v1',JSON.stringify([{mongol:4},{roman:4}])));
    await page.goto('http://127.0.0.1:5173/crown-battle.html',{waitUntil:'networkidle'});
    assert.match(await page.locator('#condition-status').textContent(),/Mavi.*Yorgunluk %0.*Moral %100.*Kızıl/);
    assert.equal(await page.locator('#rest-selected').isDisabled(),true);
    await page.locator('[data-select-team="0"]').click();
    assert.match(await page.locator('#condition-status').textContent(),/Seçili/);
    await page.locator('#rest-selected').click();
    assert.match(await page.locator('#events').textContent(),/dinleniyor/);
    assert.match(await page.locator('#condition-status').textContent(),/4 dinleniyor/);
    await page.locator('#charge').click();
    assert.match(await page.locator('#events').textContent(),/serbest hücumda/);
    const dimensions=await page.locator('.condition-row').evaluate(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height,overflow:el.scrollWidth>el.clientWidth+1}));
    assert.equal(dimensions.overflow,false);assert.ok(dimensions.height<90);
    assert.deepEqual(errors,[]);console.log('PASS live condition UI and rest/engage controls',JSON.stringify({viewport,dimensions}));
    await page.close();
  }
} finally {await browser.close();}
