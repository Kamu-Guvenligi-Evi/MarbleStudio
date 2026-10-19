import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { populateClassic } from './crown-battle-fixture.mjs';
await mkdir('artifacts/crown-battle', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, acceptDownloads: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/crown-battle.html?mode=classic');
  assert.equal(await page.locator('#north-count').textContent(), '0');
  await populateClassic(page);
  await page.getByRole('button', { name: '▶ Muharebeyi başlat', exact: true }).waitFor();
  assert.equal(await page.locator('#north-count').textContent(), '160');
  assert.ok(await page.locator('#battle').evaluate(c => c.width > c.height), 'PC display must be landscape');
  await page.locator('[data-unit="cavalry"]').click(); assert.match(await page.locator('#selection-note').textContent(), /16 asker seçili/);
  const box = await page.locator('#battle').boundingBox();
  await page.mouse.click(box.x + box.width * .5, box.y + box.height * .3, { button: 'right' });
  assert.match(await page.locator('#events').textContent(), /intikal/);
  const enemy = await page.evaluate(async () => { const { Battle } = await import('/src/crown-battle.js'); const u = new Battle().units.find(u => u.team === 1); return { x: u.x, y: u.y }; });
  await page.locator('#target-attack').click();
  await page.mouse.click(box.x + box.width * enemy.x / 600, box.y + box.height * enemy.y / 960);
  assert.match(await page.locator('#events').textContent(), /işaretlenen hedefe/);
  assert.equal(await page.locator('#target-attack').getAttribute('aria-pressed'), 'false');
  await page.locator('#charge').click();
  await page.locator('[data-speed="4"]').click(); await page.locator('#play').click();
  await page.waitForFunction(() => Number(document.getElementById('clock').textContent.replace(':', '')) >= 8);
  await page.locator('#play').click(); const paused = await page.locator('#clock').textContent(); await page.waitForTimeout(400); assert.equal(await page.locator('#clock').textContent(), paused);
  await page.screenshot({ path: 'artifacts/crown-battle/desktop.png', fullPage: true });
  await page.locator('#cinema').click(); assert.ok(await page.locator('body').evaluate(e => e.classList.contains('cinema'))); await page.keyboard.press('Escape'); assert.ok(!await page.locator('body').evaluate(e => e.classList.contains('cinema')));
  await page.locator('#menu-setup').click(); await page.locator('#preset').selectOption('wall'); await page.locator('#difficulty').selectOption('hard'); await page.locator('#apply').click();
  assert.equal(await page.locator('#north-count').textContent(), '160'); assert.equal(await page.locator('#red-count').textContent(), '200'); assert.equal(await page.locator('#clock').textContent(), '00:00');
  await page.locator('#menu-recording').click(); await page.locator('[data-speed="1"]').click(); await page.locator('#record').click();
  assert.match(await page.locator('#record').textContent(), /Kaydı bitir/, 'Recording must start successfully');
  assert.ok(await page.locator('#apply').isDisabled()); assert.ok(await page.locator('#north-cavalry').isDisabled());
  // Window resizing changes the live field, never the recording's dimensions.
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.locator('#cinema').click(); await page.waitForTimeout(400); await page.keyboard.press('Escape');
  assert.match(await page.locator('#record').textContent(), /Kaydı bitir/, 'Resizing must not stop recording');
  await page.waitForTimeout(4100);
  assert.match(await page.locator('#record').textContent(), /Kaydı bitir/, 'Recording must remain active until stop');
  // Use a physical pointer event. During canvas capture Chrome's CDP box-model
  // query can stall after resize; verify visibility/hit-testing in the DOM first.
  const stopPoint = await page.locator('#record').evaluate(button => {
    const box = button.getBoundingClientRect(), x = box.x + box.width / 2, y = box.y + box.height / 2;
    if (button.disabled || document.elementFromPoint(x, y) !== button) throw new Error('Recording stop button is not clickable');
    return { x, y };
  });
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    page.mouse.click(stopPoint.x, stopPoint.y)
  ]).catch(async error => {
    const status = page.isClosed() ? 'Page closed' : await page.locator('#record-note').textContent();
    throw new Error(`${error.message}\nRecording status: ${status}`);
  });
  await download.saveAs('artifacts/crown-battle/sample.webm');
  assert.match(download.suggestedFilename(), /\.webm$/); assert.ok(await page.locator('#apply').isEnabled());
  const decoded = spawnSync('node_modules/ffmpeg-static/ffmpeg.exe', ['-hide_banner', '-i', 'artifacts/crown-battle/sample.webm', '-f', 'null', '-'], { encoding: 'utf8', windowsHide: true });
  assert.equal(decoded.status, 0, 'Exported recording must decode'); assert.match(decoded.stderr, /1080x1920/);
  // Custom counts must survive scenario changes, select correctly and reject invalid armies.
  await page.locator('#menu-setup').click();
  for (const side of ['north','red']) for (const type of ['sword','pike','archer','cavalry']) await page.locator(`#${side}-${type}`).fill('0');
  await page.locator('#north-cavalry').fill('123'); await page.locator('#north-archer').fill('37');
  await page.locator('#red-pike').fill('205'); await page.locator('#red-sword').fill('81');
  await page.locator('#preset').selectOption('flank');
  assert.equal(await page.locator('#north-cavalry').inputValue(), '123');
  await page.locator('#apply').click();
  assert.equal(await page.locator('#north-count').textContent(), '160'); assert.equal(await page.locator('#red-count').textContent(), '286');
  await page.locator('#menu-command').click(); await page.locator('[data-unit="cavalry"]').click(); assert.match(await page.locator('#selection-note').textContent(), /123 asker/);
  assert.ok(await page.locator('[data-unit="sword"]').isDisabled());
  await page.locator('#clear-selection').click(); assert.ok(await page.locator('#charge').isDisabled());
  await page.locator('#menu-setup').click(); await page.locator('#north-cavalry').fill('0'); await page.locator('#north-archer').fill('0'); await page.locator('#apply').click();
  assert.match(await page.locator('#settings-note').textContent(), /iki tarafa/); assert.equal(await page.locator('#north-count').textContent(), '0');
  assert.ok(await page.locator('#play').isDisabled());
  await page.locator('#size').selectOption('240'); await page.locator('#apply').click();
  assert.equal(await page.locator('#north-count').textContent(), '240');
  await page.locator('#restart').click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile must not overflow');
  await page.locator('#menu-command').click(); await page.locator('[data-unit="pike"]').click(); await page.locator('#battle').scrollIntoViewIfNeeded();
  await page.locator('#battle').click({ position: { x: 150, y: 200 } }); assert.match(await page.locator('#events').textContent(), /intikal/);
  await page.screenshot({ path: 'artifacts/crown-battle/mobile.png', fullPage: true });
  assert.deepEqual(errors, []); console.log('PASS: desktop/mobile UI, unit commands, pause, speed, presets, cinema, WebM download, no browser exceptions.');
} finally { await browser.close(); }
