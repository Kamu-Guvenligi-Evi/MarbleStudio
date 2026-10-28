import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5173/') ? route.continue() : route.abort());
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const armyConfigs = Array.from({ length: 4 }, (_, i) => ({ id: `army-${i}`, team: i % 2,
      commanderId: 'julius_caesar', roster: { roman: 60, achaemenid_archer: 30, seljuk_hassa: 30 } }));
    const battle = new Battle({ seed: 42, armyConfigs, expandedMap: true });
    const canvas = document.createElement('canvas');
    canvas.id = 'deployment-test';
    Object.assign(canvas.style, { position: 'fixed', inset: '0', zIndex: '99999', width: '1366px', height: '900px' });
    document.body.append(canvas);
    const renderer = new BattleRenderer(canvas, battle);
    renderer.resize(1366, 900, true, 1); renderer.fitMap(); renderer.render();
    window.deploymentFixture = { battle, renderer };
    return { count: battle.units.length, areas: battle.initialArmyAreas.size };
  });
  assert.deepEqual(result, { count: 484, areas: 4 });
  await mkdir('artifacts/army-deployment', { recursive: true });
  await page.locator('#deployment-test').screenshot({ path: 'artifacts/army-deployment/start.jpg', type: 'jpeg', quality: 65 });
  const combat = await page.evaluate(() => {
    const { battle, renderer } = window.deploymentFixture;
    for (let i = 0; i < 900 && !battle.winner; i++) battle.step(1 / 30);
    renderer.render({ running: true });
    return { finite: battle.units.every(u => Number.isFinite(u.x + u.y)), time: battle.time,
      wounded: battle.units.filter(u => u.hp < u.maxHp).length };
  });
  assert.ok(combat.finite && combat.time > 0 && combat.wounded > 0, JSON.stringify(combat));
  console.log('PASS browser: 484 units, four separate army areas, rendered setup and 30 seconds of active combat', JSON.stringify(combat));
} finally { await browser.close(); }
