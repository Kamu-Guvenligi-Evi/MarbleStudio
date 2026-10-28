import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
import commanders from '../src/historical-commanders.json' with {type:'json'};

const base = 'http://127.0.0.1:5173';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  // Other authorized work shares Vite; hot reload must not interrupt UI actions.
  await page.routeWebSocket('ws://127.0.0.1:5173/**', () => {});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Instrument the exact Vite module URL used by the app (including HMR timestamps).
  await page.route('**/src/crown-battle.js*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    assert.ok(source.includes('this.updateUnits(dt);'));
    await route.fulfill({ response, body: source.replace('this.updateUnits(dt);', `this.updateUnits(dt);
      globalThis.commanderSamples ||= [];
      if (globalThis.commanderSamples.length < 1200) globalThis.commanderSamples.push({ time: this.time,
        leaders: this.commanders.map(u => u && ({ x: u.x, y: u.y, attack: u.attack, charge: !!u.charge, target: !!u.target })) });`) });
  });
  await page.goto(`${base}/historical-armies.html`);
  await page.evaluate(() => {
    localStorage.setItem('marble-historical-commanders-v1', JSON.stringify(['mehmed_ii', 'timur']));
    localStorage.setItem('marble-historical-armies-v1', JSON.stringify([{ samurai: 2 }, { roman: 3 }]));
  });
  await page.goto(`${base}/crown-battle.html?historical=1`);
  const planner = page.locator('#alliance-planner');
  const openPlanner = async () => { await page.locator('.alliance-live .alliance-open').click(); };
  const choose = async id => {
    await openPlanner();
    await planner.locator('[data-army-id="army-0"] .alliance-choose-leader').click();
    await page.locator(`.leader-picker [data-leader="${id}"]`).click();
  };
  const apply = async () => { await planner.locator('[data-apply]').click(); };
  const status = page.locator('[data-select-army="army-0"]');
  const select = page.locator('[data-select-leader="army-0"]');
  assert.equal(await page.locator('#north-count').textContent(), '3');
  assert.equal(await page.locator('#red-count').textContent(), '4');
  assert.match(await status.textContent(), /Fatih Sultan Mehmed.*220\/220/);
  await select.click();
  assert.match(await page.locator('#selection-note').textContent(), /1 asker seçili/);
  const field = await page.locator('#battle').boundingBox();
  await page.mouse.click(field.x + field.width * .4, field.y + field.height * .4, { button: 'right' });
  assert.match(await page.locator('#events').textContent(), /1 askere (?:formasyon )?intikal/);
  await page.locator('#stop').click();
  assert.match(await page.locator('#events').textContent(), /durdu/);
  await choose('attila');
  assert.match(await status.textContent(), /Fatih Sultan Mehmed/, 'Changing setup does not replace a live commander');
  await apply();
  assert.match(await status.textContent(), /Attila/);
  assert.equal(await page.locator('#north-count').textContent(), '3');
  await openPlanner(); await apply();
  assert.equal(await page.locator('#north-count').textContent(), '3', 'Rebuild must not duplicate leaders');
  for (const {id, name} of commanders) {
    await choose(id);
    await apply();
    assert.ok((await status.textContent()).includes(name), `${id} must appear on the field`);
    assert.equal(await page.locator('#north-count').textContent(), '3', `${id} must add one commander`);
    await select.click();
    assert.match(await page.locator('#selection-note').textContent(), /1 asker seçili/);
  }
  await mkdir('artifacts/historical-commanders', { recursive: true });
  await page.locator('#battle').screenshot({ path: 'artifacts/historical-commanders/battlefield.jpg', type: 'jpeg', quality: 65 });
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`);
  }
  await page.setViewportSize({ width: 1366, height: 768 });
  await choose('');
  await apply();
  assert.equal(await page.locator('#north-count').textContent(), '2');
  assert.equal(await select.isDisabled(), true);
  assert.match(await status.textContent(), /Komutansız/);
  await choose('mehmed_ii');
  await apply();
  await page.locator('[data-speed="4"]').click();
  await page.locator('#play').click();
  await page.waitForFunction(() => window.commanderSamples?.at(-1)?.time >= 10, {}, { timeout: 20000 });
  const samples = await page.evaluate(() => window.commanderSamples);
  for (const team of [0, 1]) {
    const start = samples[0].leaders[team];
    assert.ok(samples.some(s => Math.hypot(s.leaders[team].x - start.x, s.leaders[team].y - start.y) > 15), 'Rendered commanders move during battle');
    assert.ok(samples.every(s => !s.leaders[team].attack && !s.leaders[team].charge && !s.leaders[team].target), 'Rendered commanders never attack or charge');
  }
  assert.match(await status.textContent(), /can|Düştü/);
  assert.deepEqual(errors, []);
  console.log('PASS: battlefield leader counts, selection, movement, stop, deferred changes, rebuild, removal, mobile layout, live health, moving non-attacking commanders and rendering');
} finally { await browser.close(); }
