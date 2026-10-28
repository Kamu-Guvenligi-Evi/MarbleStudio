import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/__hit-test', route => route.fulfill({ contentType: 'text/html', body: '<canvas></canvas>' }));
  await page.goto('http://127.0.0.1:5173/__hit-test');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const { unitAtPoint } = await import('/src/crown-battle-hit-test.js');
    const canvas = document.querySelector('canvas'), checks = [];
    for (const [width, height, desktop, dpr] of [[1100, 600, true, 1], [1100, 600, true, 2], [390, 693, false, 1]]) {
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
      const battle = new Battle({ historicalArmies: [{ samurai: 1 }, { kipchak_masked_swordsman: 1 }] });
      const renderer = new BattleRenderer(canvas, battle);
      renderer.resize(width, height, desktop, dpr);
      for (const zoom of [1, 3]) for (const unit of battle.units) for (const face of [-1, 1]) {
        renderer.view.zoom = zoom; unit.face = face;
        const sprite = renderer.sprites.get(unit.type, unit.team, 0, 'idle', unit.id % 3);
        const data = sprite.getContext('2d').getImageData(0, 0, sprite.width, sprite.height).data;
        let found = false;
        for (let y = 0; y < sprite.height && !found; y++) for (let x = 0; x < sprite.width; x++) {
          if (data[(y * sprite.width + x) * 4 + 3] < 128) continue;
          const localX = (x + .5) / sprite.width * 80 - 30;
          const localY = (y + .5) / sprite.height * 76 - 61;
          if (localY > -22) continue;
          const p = { x: unit.x + localX * face * renderer.spriteScaleX, y: unit.y + localY * renderer.spriteScaleY };
          checks.push(unitAtPoint(battle, renderer, p, unit.team, 0)?.id === unit.id);
          checks.push(unitAtPoint(battle, renderer, p, null, 0)?.id === unit.id);
          checks.push(unitAtPoint(battle, renderer, p, 1 - unit.team, 0) === null);
          unit.removed = true;
          checks.push(unitAtPoint(battle, renderer, p, unit.team, 0) === null);
          unit.removed = false; found = true; break;
        }
        checks.push(found);
        checks.push(unitAtPoint(battle, renderer, { x: unit.x, y: unit.y }, unit.team)?.id === unit.id);
        const blank = { x: unit.x - 29.9 * face * renderer.spriteScaleX, y: unit.y - 60.9 * renderer.spriteScaleY };
        checks.push(unitAtPoint(battle, renderer, blank, unit.team, 0) === null);
      }
    }
    return { checks: checks.length, failed: checks.filter(value => !value).length };
  });
  assert.equal(result.failed, 0, JSON.stringify(result));
  console.log(`PASS: ${result.checks} sprite hit checks; PC/mobile, DPR 1/2, zoom 1/3, both teams/faces, transparency and removed units.`);
} finally { await browser.close(); }
