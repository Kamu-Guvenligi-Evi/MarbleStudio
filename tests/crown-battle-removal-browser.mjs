import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = 'http://127.0.0.1:5173';
const browser = await chromium.launch({channel:'chrome', headless:true});
try {
  for (const width of [1366,390]) {
    const page = await browser.newPage({viewport:{width,height:844},isMobile:width<900,hasTouch:width<900});
    const errors=[]; page.on('pageerror', e=>errors.push(e.message));
    await page.goto(`${base}/crown-battle.html?mode=classic`);
    for (const id of ['north-count','red-count']) assert.equal(await page.locator(`#${id}`).textContent(),'0');
    assert.ok(await page.locator('#play').isDisabled()); assert.ok(await page.locator('#record').isDisabled());
    assert.equal(await page.locator('#north-bar').evaluate(e=>e.style.width),'0%');
    await page.keyboard.press('Space'); assert.equal(await page.locator('#clock').textContent(),'00:00');
    await page.locator('#menu-setup').click();
    await page.locator('#north-sword').fill('3'); await page.locator('#north-archer').fill('2');
    await page.locator('#apply').click(); assert.ok(await page.locator('#play').isDisabled());
    await page.locator('#army-setup-shortcut').click();
    await page.locator('#red-pike').fill('4'); await page.locator('#apply').click();
    await page.reload();
    assert.equal(await page.locator('#north-count').textContent(),'5', 'Classic army survives reload');
    assert.equal(await page.locator('#red-count').textContent(),'4');
    assert.ok(await page.locator('#play').isEnabled());
    await page.locator('#menu-command').click(); await page.locator('[data-unit=sword]').click();
    // Delete in a search field edits text, never removes soldiers.
    await page.locator('#unit-search').focus(); await page.keyboard.press('Delete');
    assert.equal(await page.locator('#north-count').textContent(),'5');
    await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#north-count').textContent(),'2');
    assert.ok(await page.locator('#remove-selected').isDisabled());
    assert.equal(await page.locator('#north-sword').inputValue(),'0');
    assert.equal(await page.locator('#red-count').textContent(),'4');
    await page.locator('#restart').click(); assert.equal(await page.locator('#north-count').textContent(),'2');
    await page.locator('[data-unit=archer]').click();
    await page.locator('#battle').focus(); await page.keyboard.press('Delete');
    assert.equal(await page.locator('#north-count').textContent(),'0'); assert.ok(await page.locator('#play').isDisabled());
    assert.equal(await page.locator('#stage-state').textContent(),'ORDULARI KUR');

    await page.goto(`${base}/crown-battle.html?historical=1`);
    assert.equal(await page.locator('#north-count').textContent(),'0');
    await page.evaluate(()=>{
      localStorage.setItem('marble-historical-armies-v1',JSON.stringify([{samurai:2,sparta_hippeis:3},{roman:3}]));
      localStorage.setItem('marble-historical-commanders-v1',JSON.stringify(['mehmed_ii',null]));
    });
    await page.reload(); assert.equal(await page.locator('#north-count').textContent(),'3');
    assert.match(await page.locator('#settings-note').textContent(),/3 asker eski kayıttan/);
    await page.locator('#commander-details > summary').click();
    await page.locator('[data-commander-team="0"] .commander-select-unit').click(); await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#commander-0').inputValue(),'');
    assert.equal(await page.locator('#north-count').textContent(),'2');
    await page.locator('[data-unit=samurai]').click(); await page.locator('#remove-selected').click();
    assert.ok(await page.locator('[data-unit=samurai]').isHidden());
    await page.reload(); assert.equal(await page.locator('#north-count').textContent(),'0');
    assert.equal(await page.locator('#red-count').textContent(),'3');
    await page.goto(`${base}/crown-battle.html?historical=demo`);
    assert.ok(await page.locator('#play').isEnabled());
    await page.locator('#play').click();
    await page.waitForFunction(() => document.querySelector('#clock').textContent !== '00:00');
    await page.locator('#play').click(); await page.locator('#select-all').click(); await page.locator('#remove-selected').click();
    assert.equal(await page.locator('#stage-state').textContent(),'MUHAREBE TAMAMLANDI');
    assert.match(await page.locator('#events').textContent(),/Kızıl ordusu kazandı/);
    await page.goto(`${base}/crown-battle.html?historical=new`);
    for (const id of ['north-count','red-count']) assert.equal(await page.locator(`#${id}`).textContent(),'0');
    assert.equal(new URL(page.url()).searchParams.has('historical'), false, 'New army is a one-time action');
    await page.locator('#menu-setup').click();
    await page.locator('#north-samurai').fill('3'); await page.locator('#apply').click();
    await page.reload();
    assert.equal(await page.locator('#north-count').textContent(),'3', 'Refresh after entering new army does not reset it again');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors,[]); await page.close();
    console.log(`PASS: ${width}px zero armies, start guard, removal button/Delete, persistence, leaders, migration and victory`);
  }
} finally { await browser.close(); }
