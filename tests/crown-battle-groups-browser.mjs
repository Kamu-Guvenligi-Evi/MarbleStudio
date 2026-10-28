import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, hasTouch: width < 900, isMobile: width < 900 });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.routeWebSocket('**/*', s => s.close());
    await page.route(/\/src\/crown-battle-app\.js(?:\?.*)?$/, async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nwindow.groupProbe={get battle(){return battle},renderer,update};' });
    });
    await page.addInitScript(() => localStorage.setItem('marble-historical-armies-v1', JSON.stringify([{ samurai: 3 }, { roman: 3 }])));
    await page.goto('http://127.0.0.1:5173/crown-battle.html');
    await page.waitForFunction(() => window.groupProbe?.battle.units.length === 6);
    await page.evaluate(() => {
      groupProbe.battle.units.forEach((u, i) => Object.assign(u, { x: 170 + i % 3 * 120, y: u.team ? 580 : 400 }));
      groupProbe.renderer.resetView(); groupProbe.update();
    });
    const selected = () => page.evaluate(() => [...groupProbe.battle.selected]);
    async function clickUnit(index, double = false) {
      await page.locator('#battle').scrollIntoViewIfNeeded();
      const p = await page.evaluate(i => {
        const { battle, renderer:r } = groupProbe, u = battle.units[i], canvas = r.canvas, box = canvas.getBoundingClientRect();
        const scale = Math.min(box.width/canvas.width,box.height/canvas.height), w=canvas.width*scale,h=canvas.height*scale;
        return { x:box.left+(box.width-w)/2+((u.x-r.view.x)*r.view.zoom/600+.5)*w,
          y:box.top+(box.height-h)/2+((u.y-r.view.y)*r.view.zoom/960+.5)*h };
      }, index);
      if (double) await page.mouse.dblclick(p.x,p.y);
      else if (width < 900) await page.touchscreen.tap(p.x,p.y);
      else await page.mouse.click(p.x,p.y);
    }
    await clickUnit(0); assert.equal((await selected()).length,1,'Single click selects one soldier');
    await page.keyboard.down('Shift'); await clickUnit(1); await page.keyboard.up('Shift');
    assert.equal((await selected()).length,2,'Shift adds a soldier');
    await page.keyboard.press('Control+Digit1');
    assert.match(await page.locator('[data-battle-group="1"]').textContent(),/2/);
    await clickUnit(2); await page.keyboard.press('Digit1'); assert.equal((await selected()).length,2);
    await clickUnit(0,true); assert.equal((await selected()).length,3,'Double click selects same type');
    await page.locator('#save-battle-group').click(); await page.locator('[data-battle-group="2"]').click();
    await clickUnit(2); await page.locator('[data-battle-group="2"]').click(); assert.equal((await selected()).length,3);
    await clickUnit(3); assert.match(await page.locator('[data-battle-group="1"]').textContent(),/—/,'Groups are separate for each army');
    await page.keyboard.press('Control+Digit1');
    await clickUnit(0); await page.keyboard.press('Digit1'); assert.equal((await selected()).length,2);
    await page.evaluate(() => { groupProbe.battle.hit(groupProbe.battle.units[0],10000); groupProbe.update(); });
    await page.locator('[data-battle-group="1"]').click(); assert.equal((await selected()).length,1,'Dead soldiers are pruned');
    await page.locator('#menu-command').click(); await page.locator('#unit-search').fill('');
    await page.locator('#unit-search').press('2'); assert.equal((await selected()).length,1,'Typing numbers does not recall a group');
    await page.locator('#unit-search').fill('');
    await page.locator('#restart').click();
    assert.match(await page.locator('[data-battle-group="1"]').textContent(),/—/,'Rebuild clears old groups');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth+1));
    assert.deepEqual(errors,[]);
    await page.close(); console.log(`PASS ${width}px individual/additive/type selection, keyboard/touch groups, army isolation, death, input guard, reset`);
  }
} finally { await browser.close(); }
