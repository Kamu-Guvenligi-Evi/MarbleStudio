import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('pageerror', error => errors.push(error.message));
  const checkPortraits = async selector => page.locator(selector).evaluateAll(canvases => canvases.map(canvas => {
    const { width, height } = canvas, data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
    let count = 0, edge = false;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      if (!data[(y * width + x) * 4 + 3]) continue;
      count++; if (x < 2 || y < 2 || x >= width - 2 || y >= height - 2) edge = true;
    }
    const rect = canvas.getBoundingClientRect(), art = canvas.parentElement.getBoundingClientRect();
    return { id: canvas.dataset.portrait || canvas.closest('[data-id]')?.dataset.id, count, edge,
      contained: rect.left >= art.left - 1 && rect.right <= art.right + 1 && rect.top >= art.top - 1 && rect.bottom <= art.bottom + 1 };
  }));
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  const units = await page.locator('.unit-card').count();
  assert.ok(units >= 56);
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const results = await checkPortraits('.game-art canvas');
    assert.equal(results.length, units);
    for (const result of results) {
      assert.ok(result.count > 100, `empty: ${result.id}`);
      assert.ok(!result.edge, `clipped: ${result.id}`);
      assert.ok(result.contained, `outside card at ${width}: ${result.id}`);
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
  }
  await page.locator('[data-art-view="reference"]').click();
  assert.equal(await page.locator('.game-art:visible').count(), 0);
  assert.equal(await page.locator('.reference-art:visible').count(), units);
  const images = await page.locator('.reference-art img').evaluateAll(images => Promise.all(images.map(async image => {
    image.loading = 'eager'; try { await image.decode(); return image.naturalWidth > 0; } catch { return false; }
  })));
  assert.ok(images.every(Boolean), 'reference image failed');
  await page.locator('[data-art-view="game"]').click();
  await page.locator('input[data-id="norse_hird_swordsman"][data-team="0"]').fill('7');
  assert.equal(await page.locator('input[data-id="norse_hird_swordsman"][data-team="0"]').inputValue(), '7');
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=demo');
  assert.equal(await page.locator('.unit-grid canvas[data-portrait]').count(), units);
  assert.equal(await page.locator('.unit-grid img.reference-portrait').count(), 0);
  for (const result of await checkPortraits('canvas[data-portrait]')) {
    assert.ok(result.count > 50, `empty battle portrait: ${result.id}`);
    assert.ok(!result.edge, `clipped battle portrait: ${result.id}`);
  }
  await page.setViewportSize({ width: 1100, height: 900 });
  await page.evaluate(() => {
    const sheet = document.createElement('div'); sheet.id = 'card-review';
    sheet.style = 'display:grid;grid-template-columns:repeat(7,145px);gap:8px;background:#18241f;padding:10px';
    for (const card of document.querySelectorAll('.unit-grid [data-unit]')) {
      card.hidden = false; card.disabled = false;
      card.style = 'display:block;width:145px;height:105px;font-size:11px;color:#eee;background:#29352b;border:1px solid #637255';
      card.querySelector('canvas').style = 'width:70px;height:70px;object-fit:contain;display:block;margin:auto'; sheet.append(card);
    }
    document.body.replaceChildren(sheet);
  });
  await fs.mkdir('artifacts/elite-research', { recursive: true });
  await page.locator('#card-review').screenshot({ path: 'artifacts/elite-research/battle-cards-after.jpg', type: 'jpeg', quality: 75 });
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ pass: true, units, viewports: [1100, 390], referenceImages: images.length,
    previewBytes: (await fs.stat('artifacts/elite-research/battle-cards-after.jpg')).size }));
} finally { await browser.close(); }
