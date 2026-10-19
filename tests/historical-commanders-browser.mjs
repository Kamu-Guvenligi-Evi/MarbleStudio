import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';

const commanders = JSON.parse(await fs.readFile(new URL('../src/historical-commanders.json', import.meta.url), 'utf8'));
const base = 'http://127.0.0.1:5173';
const storage = 'marble-historical-commanders-v1';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 950 }, acceptDownloads: true });
  const page = await context.newPage();
  await context.routeWebSocket('**/*', socket => socket.close());
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const errors = [], external = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (!request.url().startsWith(base) && !request.url().startsWith('blob:')) external.push(request.url()); });
  await page.goto(`${base}/historical-armies.html`);
  assert.equal(await page.locator('#commander-0 option').count(), commanders.length + 1);
  assert.equal(await page.locator('#commander-1 option').count(), commanders.length + 1);
  for (const commander of commanders) {
    await page.locator('#commander-0').selectOption(commander.id);
    const card = page.locator('[data-commander-team="0"]');
    if (commander.portrait === 'game') {
      const portrait = card.locator('canvas[role="img"]');
      assert.ok((await portrait.getAttribute('aria-label')).includes(commander.name));
      assert.ok(await portrait.evaluate(c => c.getContext('2d').getImageData(120,120,1,1).data[3] > 0));
      assert.equal(await card.locator('.commander-monogram').isVisible(), false);
    } else await card.locator('img').evaluate(img => img.decode());
    assert.equal(await page.locator(`#commander-0 option[value="${commander.id}"]`).evaluate(o => o.parentElement.label), commander.cultureName);
    assert.equal(await card.locator('.commander-name').textContent(), commander.name);
    assert.ok((await card.locator('.commander-details').textContent()).includes(commander.license));
    if (commander.imageType === 'historical_scene') {
      assert.match(await card.locator('img').getAttribute('alt'), /tarihî sahne/);
      assert.match(await card.locator('.commander-copy').textContent(), /Görsel: tarihî sahne/);
    }
  }
  await page.locator('input[data-id="samurai"][data-team="0"]').fill('7');
  await page.locator('input[data-id="spartan"][data-team="1"]').fill('9');
  await page.locator('#commander-0').selectOption('mehmed_ii');
  await page.locator('#commander-1').selectOption('timur');
  await page.reload();
  assert.equal(await page.locator('#commander-0').inputValue(), 'mehmed_ii');
  assert.equal(await page.locator('#commander-1').inputValue(), 'timur');
  assert.equal(await page.locator('#total-0').textContent(), '7');
  assert.equal(await page.locator('#total-1').textContent(), '9');
  const download = page.waitForEvent('download');
  await page.locator('#download').click();
  const plan = JSON.parse(await fs.readFile(await (await download).path(), 'utf8'));
  assert.equal(plan.armies[0].commander.id, 'mehmed_ii');
  assert.equal(plan.armies[1].commander.id, 'timur');
  assert.equal(plan.armies[0].units[0].count, 7);
  await fs.mkdir('artifacts/historical-commanders', { recursive: true });
  await page.locator('.commander-panel').screenshot({ path: 'artifacts/historical-commanders/selection.jpg', type: 'jpeg', quality: 65 });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px overflow`);
  }
  await page.setViewportSize({ width: 1200, height: 950 });
  await page.locator('#launch-battle').click();
  await page.waitForURL('**/crown-battle.html?historical=1');
  assert.match(await page.locator('[data-select-army="army-0"]').textContent(), /Fatih Sultan Mehmed/);
  assert.match(await page.locator('[data-select-army="army-1"]').textContent(), /Timur/);
  // Current battle UI uses the alliance planner. Catalogue tabs still share
  // commander storage; exercise that public contract without obsolete selects.
  await page.goto(`${base}/historical-armies.html`);
  await page.locator('#commander-0').selectOption('attila');
  const workshop = await context.newPage();
  await workshop.goto(`${base}/historical-armies.html`);
  assert.equal(await workshop.locator('#commander-0').inputValue(), 'attila');
  await workshop.locator('#commander-0').selectOption('julius_caesar');
  await page.waitForFunction(() => document.querySelector('#commander-0').value === 'julius_caesar');
  await workshop.close();
  await page.goto(`${base}/crown-battle.html?mode=classic`);
  assert.equal(await page.locator('.commander-panel').count(), 0);
  await page.evaluate(key => localStorage.setItem(key, '["unknown","timur"]'), storage);
  await page.goto(`${base}/historical-armies.html`);
  assert.equal(await page.locator('#commander-0').inputValue(), '');
  assert.equal(await page.locator('#commander-1').inputValue(), 'timur');
  await page.evaluate(key => localStorage.setItem(key, '{broken'), storage);
  await page.reload();
  assert.equal(await page.locator('#commander-1').inputValue(), '');
  await page.locator('#commander-0').selectOption('mehmed_ii');
  await page.locator('[data-commander-team="0"] img').evaluate(img => img.decode());
  await page.locator('#commander-0').selectOption('timur');
  await page.locator('[data-commander-team="0"] img').evaluate(img => img.decode());
  await page.locator('#commander-0').selectOption('ramesses_ii');
  await page.locator('#commander-1').selectOption('alexander_nevsky');
  await page.reload();
  assert.equal(await page.locator('#commander-0').inputValue(), 'ramesses_ii');
  assert.equal(await page.locator('#commander-1').inputValue(), 'alexander_nevsky');
  assert.equal(await page.locator('.commander-art canvas').count(), 2);
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  console.log(`PASS: ${commanders.length} portraits; independent leaders; new leaders persist; counts; JSON export; game navigation; catalogue cross-tab sync; 320/390px layout; invalid storage; local canvas; classic mode; no page errors or external requests.`);
} finally { await browser.close(); }
