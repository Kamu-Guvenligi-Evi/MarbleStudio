import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { populateClassic } from './crown-battle-fixture.mjs';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const artifactDir = 'artifacts/crown-battle';
const base = process.env.CROWN_BATTLE_BASE || 'http://127.0.0.1:5173';
await mkdir(artifactDir, { recursive: true });
try {
  for (const width of [1366, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 844 }, isMobile: width < 900, hasTouch: width < 900 });
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    // Chrome's CDP box-model query can stall while a canvas stream is captured.
    // Resolve the visible target in the DOM, then send a real pointer event.
    const physicalClick = async selector => {
      const point = await page.locator(selector).evaluate(button => {
        button.scrollIntoView({ block: 'center' });
        const rect = button.getBoundingClientRect(), x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
        if (button.disabled || !button.contains(document.elementFromPoint(x, y))) throw new Error(`Unclickable ${button.id || button.dataset.battleMap}`);
        return { x, y };
      });
      if (width < 900) await page.touchscreen.tap(point.x, point.y); else await page.mouse.click(point.x, point.y);
    };
    await page.goto(`${base}/crown-battle.html?mode=classic`);
    await populateClassic(page);
    await page.evaluate(async () => {
      const source = await (await fetch('/src/crown-battle-app.js')).text();
      const { BattleRenderer } = await import(source.match(/from ['"]([^'"]*crown-battle-renderer\.js[^'"]*)['"]/)[1]);
      const render = BattleRenderer.prototype.render;
      BattleRenderer.prototype.render = function(...args) {
        if (this.canvas.id === 'battle') window.mapRenderer = this;
        else window.exportMapRenderer = this;
        return render.apply(this, args);
      };
      const renderIfNeeded = BattleRenderer.prototype.renderIfNeeded;
      BattleRenderer.prototype.renderIfNeeded = function(...args) { window.mapRenderer = this; return renderIfNeeded.apply(this, args); };
      window.mapState = () => {
        const r = window.mapRenderer, b = r.battle;
        return JSON.stringify({ seed: b.seed, time: b.time, units: b.units, selected: [...b.selected], team: b.activeTeam, view: r.view, bounds: b.bounds });
      };
    });
    await page.waitForFunction(() => window.mapRenderer);
    await page.locator('#select-red-army').click();
    await page.locator('#stop').click();
    await page.evaluate(() => { window.mapRenderer.pan(.08, .06); window.originalMapState = window.mapState(); });
    await page.locator('#menu-setup').click();
    const hashes = [];
    for (const id of ['steppe', 'desert', 'snow', 'autumn', 'stone', 'classic']) {
      await page.locator(`[data-battle-map="${id}"]`).click();
      await page.waitForFunction(id => window.mapRenderer.mapId === id, id);
      const state = await page.evaluate(() => {
        const r = window.mapRenderer; r.renderIfNeeded();
        const terrain = r.terrain, scene = r.pcScene;
        for (let i = 0; i < 20; i++) { r.invalidate(); r.renderIfNeeded(); }
        const pixels = terrain.getContext('2d').getImageData(0, 0, terrain.width, terrain.height).data;
        let hash = 2166136261; for (let i = 0; i < pixels.length; i += 113) hash = Math.imul(hash ^ pixels[i], 16777619);
        return { unchanged: window.mapState() === window.originalMapState, cached: terrain === r.terrain && scene === r.pcScene,
          bounded: !scene || (scene.width <= 2560 && scene.height <= 1600), hash,
          pressed: document.querySelectorAll('[data-battle-map][aria-pressed="true"]').length };
      });
      assert.equal(state.unchanged, true, 'Map selection preserves soldiers, orders, selection, battle time and camera');
      assert.equal(state.cached, true, 'Terrain objects are reused across frames');
      assert.equal(state.bounded, true); assert.equal(state.pressed, 1); hashes.push(state.hash);
    }
    assert.equal(new Set(hashes).size, 6, 'Every map has distinct terrain');
    await page.locator('[data-battle-map="snow"]').click();
    await page.locator('#apply').click();
    assert.equal(await page.evaluate(() => window.mapRenderer.mapId), 'snow', 'Rebuild preserves selected map');
    const counts = await page.evaluate(() => window.mapRenderer.battle.counts());
    assert.deepEqual(counts, [160, 160]);
    await page.locator('#play').click();
    await page.waitForFunction(() => window.mapRenderer.battle.time > .1);
    await page.locator('#menu-setup').click();
    const before = await page.evaluate(() => { window.mapBattleBefore = window.mapRenderer.battle; return window.mapRenderer.battle.time; });
    await page.locator('[data-battle-map="desert"]').click();
    assert.ok(await page.evaluate(before => window.mapRenderer.battle === window.mapBattleBefore && window.mapRenderer.battle.time >= before, before));
    await page.locator('#play').click();

    // The export renderer receives the chosen map and follows changes during recording.
    await page.locator('#menu-recording').click(); await page.locator('#record').click();
    await page.waitForFunction(() => window.exportMapRenderer);
    assert.equal(await page.evaluate(() => window.exportMapRenderer.mapId), 'desert');
    await physicalClick('#menu-setup'); await physicalClick('[data-battle-map="stone"]');
    assert.equal(await page.evaluate(() => window.exportMapRenderer.mapId), 'stone');
    await page.waitForTimeout(1600);
    await physicalClick('#menu-recording');
    assert.match(await page.locator('#record').textContent(), /Kaydı bitir/);
    const download = page.waitForEvent('download'); await physicalClick('#record'); await download;
    await page.waitForFunction(() => document.querySelector('#record').textContent.includes('başlat'));

    await page.reload(); await page.locator('#menu-setup').click();
    assert.equal(await page.locator('[data-battle-map="stone"]').getAttribute('aria-pressed'), 'true', 'Map survives reload');
    await page.evaluate(() => {
      localStorage.setItem('marble-historical-armies-v1', JSON.stringify([{ samurai: 2 }, { roman: 3 }]));
      localStorage.setItem('marble-historical-commanders-v1', JSON.stringify([null, null]));
    });
    await page.goto(`${base}/crown-battle.html`);
    await page.locator('#menu-setup').click(); await page.locator('[data-battle-map="autumn"]').click();
    await page.reload();
    assert.equal(await page.locator('#north-count').textContent(), '2');
    assert.equal(await page.locator('#red-count').textContent(), '3');
    assert.equal(await page.locator('[data-battle-map="autumn"]').getAttribute('aria-pressed'), 'true');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    assert.deepEqual(errors, []);
    console.log(`PASS ${width}px: six maps, preserved armies/orders/camera, cache bounds/reuse, running change, rebuild/reload, historical saves and WebM renderer`);
    await page.close();
  }
  const page = await browser.newPage();
  await page.goto(`${base}/crown-battle.html`);
  const result = await page.evaluate(async () => {
    const { BATTLE_MAPS, makeBattleMap } = await import('/src/crown-battle-maps.js');
    const preview = document.createElement('canvas'); preview.width = 720; preview.height = 600;
    const g = preview.getContext('2d'); g.fillStyle = '#17221c'; g.fillRect(0, 0, 720, 600);
    const fingerprint = canvas => canvas.toDataURL();
    for (let i = 0; i < BATTLE_MAPS.length; i++) {
      const map = BATTLE_MAPS[i], x = i % 2 * 360, y = Math.floor(i / 2) * 200;
      const terrain = makeBattleMap(1066, map.id, 350, 170);
      if (fingerprint(terrain) !== fingerprint(makeBattleMap(1066, map.id, 350, 170))) throw new Error('Non-deterministic map');
      g.drawImage(terrain, x + 5, y + 5, 350, 170); g.fillStyle = '#eee6c9'; g.font = '15px Segoe UI'; g.fillText(map.name, x + 10, y + 192);
    }
    const one = makeBattleMap(1, 'steppe', 160, 90), two = makeBattleMap(2, 'steppe', 160, 90);
    if (fingerprint(one) === fingerprint(two)) throw new Error('Seed does not change map');
    return preview.toDataURL().split(',')[1];
  });
  await writeFile(`${artifactDir}/maps-preview.png`, Buffer.from(result, 'base64'));
  console.log('PASS deterministic terrain and seed variation; local preview saved');
} finally { await browser.close(); }
