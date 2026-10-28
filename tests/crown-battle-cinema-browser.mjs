import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const [width,height] of [[1366,768],[390,844],[320,568],[844,390]]) {
    const page = await browser.newPage({viewport:{width,height},isMobile:width<900,hasTouch:width<900});
    const errors=[]; page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=demo');
    await page.locator('#follow-battle').waitFor();
    await page.locator('#cinema').click();
    assert.ok(await page.locator('.stage-commands').isHidden());
    const field=await page.locator('.theater').boundingBox();
    const audio=await page.locator('.battle-audio-controls').boundingBox();
    assert.ok(audio.height<=64,`${width}: audio strip must stay compact`);
    assert.ok(field.height>=height-64-audio.height,`${width}: field leaves too much room for menu`);
    for(const selector of ['#play','#cinema-commands','.speed-control','#exit-cinema']) {
      const box=await page.locator(selector).boundingBox();
      assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,`${width}: ${selector} outside viewport`);
    }
    await page.locator('#play').click(); await page.waitForTimeout(250);
    await page.locator('#play').click();
    await page.locator('#cinema-commands').click();
    assert.equal(await page.locator('#cinema-commands').getAttribute('aria-expanded'),'true');
    assert.ok(await page.locator('.stage-commands').isVisible());
    assert.equal((await page.locator('.theater').boundingBox()).height,field.height,'opening commands must not shrink battlefield');
    await page.locator('#select-all').click(); await page.locator('#stop').click();
    assert.match(await page.locator('#events').textContent(),/dur|bekle/i);
    await page.locator('#formation-kind').selectOption('wedge');
    await page.locator('#cinema-commands').click();
    assert.ok(await page.locator('.stage-commands').isHidden());
    if(width===1366) await page.screenshot({path:'artifacts/crown-battle/cinema-compact.jpg',quality:65});
    await page.locator('#exit-cinema').click();
    assert.ok(await page.locator('.stage-commands').isVisible());
    assert.ok(await page.locator('#cinema-commands').isHidden());
    await page.locator('#cinema').click(); await page.keyboard.press('Escape');
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('cinema')),false);
    assert.deepEqual(errors,[]);
    console.log(`PASS: cinema ${width}x${height}; compact bar, commands, playback, exit`);
    await page.close();
  }
} finally { await browser.close(); }
