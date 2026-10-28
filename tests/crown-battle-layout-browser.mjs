import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import { populateClassic } from './crown-battle-fixture.mjs';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
await mkdir('artifacts/crown-battle', { recursive: true });
try {
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const [width, height] of [[1366,768], [1920,1080], [900,700], [390,844], [320,568], [844,390]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=demo');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}: horizontal overflow`);
    assert.equal(await page.locator('[role=tabpanel]:visible').count(), 1);
    if (width >= 900) {
      for (const id of ['battle', 'play', 'stop', 'menu-command']) {
        const box = await page.locator(`#${id}`).boundingBox();
        assert.ok(box.y >= 0 && box.y + box.height <= height + 1, `${width}: ${id} outside viewport`);
      }
      const field = await page.locator('#battle').boundingBox(), theater = await page.locator('.theater').boundingBox();
      assert.ok(Math.abs(field.width - theater.width) <= 1 && Math.abs(field.height - theater.height) <= 1, `${width}: field must fill theater`);
      assert.ok(field.width > width * .63 && field.width / field.height > 1.25, `${width}: PC field must be wide, not a narrow portrait`);
      assert.match(await page.locator('.stage-bar').textContent(), /PC · GENİŞ MEYDAN/);
    } else {
      assert.equal(await page.locator('#battle').evaluate(c => c.width / c.height), 9 / 16, 'Phone must retain portrait rendering');
    }
    await page.locator('#menu-command').focus(); await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#menu-setup').getAttribute('aria-selected'), 'true');
    assert.ok(await page.locator('#apply').isVisible());
    await page.locator('#menu-recording').click(); assert.ok(await page.locator('#record').isVisible());
    await page.locator('#menu-command').click(); await page.locator('[data-unit=timur]').click();
    await page.locator('#stop').click(); assert.match(await page.locator('#events').textContent(), /dur|bekle/i);
    await page.locator('#target-attack').click(); assert.equal(await page.locator('#target-attack').getAttribute('aria-pressed'), 'true');
    await page.keyboard.press('Escape'); assert.match(await page.locator('#selection-note').textContent(), /3 asker/);
    await page.locator('#battle').focus(); await page.keyboard.press('s');
    await page.keyboard.press('h'); assert.match(await page.locator('#events').textContent(), /serbest hücum/);
    if (width === 1366 || width === 390) {
      await page.evaluate(() => scrollTo(0,0));
      await page.screenshot({ path: `artifacts/crown-battle/layout-${width}.jpg`, quality: 65 });
    }
    console.log(`PASS: ${width}x${height} menus, viewport, stop/attack keys`);
  }
  // A real touch context must deliver battlefield orders after a menu selection.
  const touch = await browser.newPage({ viewport: { width:390, height:844 }, isMobile:true, hasTouch:true });
  await touch.goto('http://127.0.0.1:5173/crown-battle.html?mode=classic');
  await populateClassic(touch);
  await touch.locator('[data-unit=cavalry]').tap();
  await touch.locator('#return-to-field').tap();
  const box = await touch.locator('#battle').boundingBox();
  await touch.touchscreen.tap(box.x + box.width * .5, box.y + box.height * .45);
  assert.match(await touch.locator('#events').textContent(), /yerleştirildi/);
  await touch.locator('#stop').tap(); assert.match(await touch.locator('#events').textContent(), /dur|bekle/i);
  const enemy = await touch.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const u = new Battle().units.find(u => u.team === 1);
    return { x:u.x, y:u.y };
  });
  await touch.locator('#target-attack').tap();
  await touch.locator('#battle').scrollIntoViewIfNeeded();
  const targetBox = await touch.locator('#battle').boundingBox();
  await touch.touchscreen.tap(targetBox.x + targetBox.width * enemy.x / 600, targetBox.y + targetBox.height * enemy.y / 960);
  assert.match(await touch.locator('#events').textContent(), /işaretlenen hedefe/);
  assert.equal(await touch.locator('#target-attack').getAttribute('aria-pressed'), 'false');
  assert.deepEqual(errors, []); console.log('PASS: touch move/stop, no browser exceptions');
} finally { await browser.close(); }
