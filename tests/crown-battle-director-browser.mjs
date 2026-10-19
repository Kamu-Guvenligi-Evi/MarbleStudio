import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('artifacts/battle-watch', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.routeWebSocket('**/*', s => s.close());
    await page.route(/\/src\/crown-battle-app\.js(?:\?.*)?$/, async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: await response.text() + '\nwindow.watchProbe={get battle(){return battle},get renderer(){return renderer},get running(){return running}};' });
    });
    await page.addInitScript(() => localStorage.setItem('marble-historical-armies-v1', JSON.stringify([
      { samurai: 36, hussar: 12, spartan: 24, janissary: 18 },
      { kipchak: 12, roman: 30, viking: 24, persian: 24 }
    ])));
    await page.goto('http://127.0.0.1:5173/crown-battle.html');
    await page.waitForFunction(() => window.watchProbe);
    await page.evaluate(() => {
      for (const u of watchProbe.battle.units) {
        const n = u.id % 90;
        u.x = 170 + (n % 15) * 12; u.y = 420 + u.team * 100 + Math.floor(n / 15) * 9;
      }
      watchProbe.renderer.invalidate();
    });
    const view = () => page.evaluate(() => ({ ...watchProbe.renderer.view }));
    await page.locator('#cinema').click();
    const follow = page.locator('#follow-battle');
    assert.equal(await follow.getAttribute('aria-pressed'), 'false');
    await follow.click(); const paused = await view(); await page.waitForTimeout(250);
    assert.deepEqual(await view(), paused, 'Enabling follow before play does not move the setup');
    await page.locator('#play').click();
    await page.waitForFunction(() => watchProbe.running && watchProbe.battle.time > 2, null, { timeout: 60000 });
    assert((await view()).zoom > 1.1, 'Real app tick drives the director');
    assert.equal(await follow.getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: `artifacts/battle-watch/follow-${width}.jpg`, type: 'jpeg', quality: 72 });
    await page.locator('#play').click();
    const frozen = await view(); await page.waitForTimeout(350);
    assert.deepEqual(await view(), frozen, 'Pause freezes camera and battle together');
    await page.locator('#zoom-in').click();
    assert.equal(await follow.getAttribute('aria-pressed'), 'false', 'Zoom returns manual control');
    await follow.click(); await page.keyboard.press('ArrowRight');
    assert.equal(await follow.getAttribute('aria-pressed'), 'false', 'Arrow key returns manual control');
    await follow.click(); await page.locator('#battle').click({ position: { x: 100, y: 100 } });
    assert.equal(await follow.getAttribute('aria-pressed'), 'false', 'Selection stops the moving camera');
    await follow.click(); await page.locator('#fit-map').click();
    assert.equal(await follow.getAttribute('aria-pressed'), 'false', 'Map overview leaves follow');
    await follow.click(); await page.keyboard.press('Escape');
    assert.equal(await follow.getAttribute('aria-pressed'), 'false', 'Escape leaves follow');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'Toolbar fits viewport');
    assert.deepEqual(errors, []);
    console.log(`PASS director ${width}px: real battle, cinematic framing, pause, zoom/keys/selection/map/Escape override, toolbar fit, no browser errors`);
    await page.close();
  }
} finally { await browser.close(); }
