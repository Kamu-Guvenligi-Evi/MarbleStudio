import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  page.setDefaultTimeout(10000);
  await page.routeWebSocket('ws://127.0.0.1:5173/**', () => {});
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new');
  const planner = page.locator('#alliance-planner'), picker = page.locator('.leader-picker');
  const open = async () => { await page.locator('#menu-command').click(); await page.locator('.alliance-live .alliance-open').click(); };
  await open();
  for (const team of [0, 1]) await planner.locator(`[data-add-army="${team}"]`).click();
  assert.equal(await planner.locator('.alliance-army-card').count(), 4);
  const ids = await planner.locator('.alliance-army-card').evaluateAll(cards => cards.map(c => c.dataset.armyId));
  for (const [i, id] of ids.entries()) {
    const card = planner.locator(`[data-army-id="${id}"]`);
    await card.locator('.alliance-choose-leader').click();
    await picker.locator('input').fill(i % 2 ? 'timur' : 'fatih');
    assert.equal(await picker.locator('.leader-option').count(), 2);
    await picker.locator(`[data-leader="${i % 2 ? 'timur' : 'mehmed_ii'}"]`).click();
    assert.match(await card.locator('.alliance-choose-leader').textContent(), i % 2 ? /Timur/ : /Fatih/);
    await card.getByText('Asker ekle / düzenle', { exact: true }).click();
    const team = i < 2 ? 0 : 1;
    // Exact inputs are the same controls used by recruitment cards, with the active army selected.
    await page.locator(`[data-roster="${team}"][data-type="samurai"]`).evaluate((input, value) => {
      input.value = value; input.dispatchEvent(new Event('input', { bubbles: true }));
    }, String(10 + i));
    await page.locator('#recruitment .recruit-map-button').filter({ hasText: 'İttifaklar / Komutanlar' }).click();
  }
  await planner.locator('[data-apply]').click();
  assert.equal(await page.locator('#north-count').textContent(), '23');
  assert.equal(await page.locator('#red-count').textContent(), '27');
  assert.equal(await page.locator('[data-select-army]').count(), 4);
  await page.locator(`[data-select-army="${ids[1]}"]`).click();
  assert.match(await page.locator('#selection-note').textContent(), /12 asker seçili/);
  await page.locator(`[data-select-leader="${ids[1]}"]`).click();
  assert.match(await page.locator('#selection-note').textContent(), /1 asker seçili/);
  await page.reload();
  assert.equal(await page.locator('#north-count').textContent(), '23');
  assert.equal(await page.locator('[data-select-army]').count(), 4);
  await open();
  await planner.locator('.alliance-choose-leader').first().click();
  await picker.locator('select').selectOption({ label: 'Osmanlı Devleti' });
  assert.ok(await picker.locator('[data-leader="mehmed_ii"]').isVisible());
  assert.equal(await picker.locator('[data-leader="timur"]').count(), 0);
  await picker.locator('select').selectOption('');
  await picker.locator('input').fill('sonucsuz_arama');
  assert.match(await picker.locator('.leader-results').textContent(), /Eşleşen komutan yok/);
  await picker.locator('input').fill('');
  await mkdir('artifacts/alliances', { recursive: true });
  await page.screenshot({ path: 'artifacts/alliances/commander-picker.jpg', type: 'jpeg', quality: 65 });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await picker.evaluate(d => d.scrollWidth <= d.clientWidth + 1), 'Commander picker must fit narrow screens');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await picker.locator('[data-close]').click();
  assert.ok(await planner.evaluate(d => d.scrollWidth <= d.clientWidth + 1));
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.screenshot({ path: 'artifacts/alliances/army-planner.jpg', type: 'jpeg', quality: 65 });
  // Editing/creating the other army used to remount every size input at its minimum.
  const blue = planner.locator(`[data-army-id="${ids[0]}"]`), red = planner.locator(`[data-army-id="${ids[2]}"]`);
  for (const [card, size] of [[blue, '200'], [red, '350']]) {
    await card.locator('summary').click();
    await card.locator('.commander-army-size input').fill(size);
  }
  await blue.locator('.commander-auto-create').click();
  assert.equal(await red.locator('.commander-army-size input').inputValue(), '350', 'Other army draft survives creation');
  await red.locator('.commander-auto-create').click();
  assert.equal(await blue.locator('.commander-army-size input').inputValue(), '200');
  assert.equal(await red.locator('.commander-army-size input').inputValue(), '350');
  await planner.locator('[data-apply]').click();
  assert.equal(await page.locator('#north-count').textContent(), '213');
  assert.equal(await page.locator('#red-count').textContent(), '365');
  await page.locator('#restart').click();
  assert.equal(await page.locator('#north-count').textContent(), '213', 'New battle preserves all army sizes');
  assert.equal(await page.locator('#red-count').textContent(), '365');
  await page.reload();
  await open();
  for (const [card, size] of [[blue, '200'], [red, '350']]) {
    await card.locator('summary').click();
    assert.equal(await card.locator('.commander-army-size input').inputValue(), size, 'Size survives reload');
  }
  await planner.locator('[data-apply]').click();
  assert.equal(await page.locator('#north-count').textContent(), '213');
  assert.equal(await page.locator('#red-count').textContent(), '365');
  assert.deepEqual(errors, []);
  console.log('PASS browser: 2v2 armies, independent sizes across creation/reload/reapply, card search/filter, individual selection, desktop/mobile layout');
} finally { await browser.close(); }
