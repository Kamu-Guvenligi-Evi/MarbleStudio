import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

// Reproduce the 1,289 vs 1,501 opening reported on a 1,913 × 781 screen.
const armyConfigs = [
  { id: 'timur', team: 0, commanderId: 'timur', roster: {
    timur_aq_qoyunlu_cavalry: 108, timur_kara_tatar_archer: 108, timur: 53,
    timurid_horse_archer: 429, timurid_armored_lancer: 375, timurid_guard_cavalry: 215 } },
  { id: 'mehmed', team: 1, commanderId: 'mehmed_ii', roster: {
    ottoman_martolos: 62, ottoman_janissary_armoured_sword: 62, ottoman_akinci_archer: 125,
    ottoman_akinci_mace: 62, ottoman_timariot: 125, ottoman_cebelu: 125, ottoman_sipah: 188,
    ottoman_solak: 125, ottoman_akinci: 63, ottoman_janissary_bow: 313,
    ottoman_azap_frontline: 125, mehmed_serbian_auxiliary_cavalry: 125 } },
  { id: 'empty', team: 0, commanderId: null, roster: {} },
];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1913, height: 781 } });
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5173/') ? route.continue() : route.abort());
  await page.goto('http://127.0.0.1:5173/crown-battle.html?historical=new');
  const result = await page.evaluate(async armyConfigs => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const battle = new Battle({ seed: 42, armyConfigs, expandedMap: true });
    const canvas = document.createElement('canvas');
    canvas.id = 'projection-test';
    Object.assign(canvas.style, { position: 'fixed', inset: '0', zIndex: '99999', width: '1913px', height: '781px' });
    document.body.append(canvas);
    const renderer = new BattleRenderer(canvas, battle);
    const positions = JSON.stringify(battle.units.map(u => [u.x, u.y]));
    const checks = [], gpuChecks = [];
    // Capture the actual drawing transform, not a second copy of camera math.
    renderer.drawBattlefield = ctx => {
      const m = ctx.getTransform();
      const p = renderer.screenToWorld(.27, .63);
      const screen = new DOMPoint(p.x, p.y).matrixTransform(m);
      checks.push({ ratio: m.a / m.d,
        error: Math.hypot(screen.x / canvas.width - .27, screen.y / canvas.height - .63) });
    };
    for (const [w, h, landscape, dpr] of [[1913,781,true,1], [1366,900,true,2], [900,900,true,1], [390,844,false,2]]) {
      renderer.resize(w,h,landscape,dpr); renderer.fitMap(); renderer.render();
      if (landscape && renderer.spriteBatch?.gl) {
        const batch = renderer.spriteBatch;
        const camera = batch.gl.getUniform(batch.program, batch.cameraUniform);
        gpuChecks.push(Math.abs(camera[2] * canvas.width / (camera[3] * canvas.height)));
      }
      renderer.zoomAt(2); renderer.pan(.03,-.02); renderer.render();
    }
    renderer.resize(1913,781,true,1);
    const xs=battle.units.map(u=>u.x), ys=battle.units.map(u=>u.y);
    const left=Math.min(...xs)-100, right=Math.max(...xs)+100;
    const top=Math.min(...ys)-100, bottom=Math.max(...ys)+100;
    renderer.view={x:(left+right)/2,y:(top+bottom)/2,
      zoom:Math.min(renderer.viewWidth/(right-left),renderer.viewHeight/(bottom-top))};
    renderer.clampView();
    for (let i=0; i<12; i++) renderer.render();
    return { checks, gpuChecks, unchanged: positions === JSON.stringify(battle.units.map(u => [u.x,u.y])),
      counts: [0,1].map(team => battle.units.filter(u => u.team === team).length) };
  }, armyConfigs);
  assert.deepEqual(result.counts, [1289,1501]);
  assert.ok(result.unchanged, 'Camera changes do not move soldiers');
  assert.equal(result.gpuChecks.length, 3, 'Exercise the GPU army renderer');
  for (const ratio of result.gpuChecks) assert.ok(Math.abs(ratio - 1) < 1e-6, `GPU spacing: ${ratio}`);
  for (const [i, check] of result.checks.entries()) {
    // Portrait export retains its existing 1080 × 1920 presentation.
    if (i !== 6 && i !== 7) assert.ok(Math.abs(check.ratio - 1) < 1e-10, `Isotropic battlefield ${i}: ${check.ratio}`);
    assert.ok(check.error < 1e-6, `Order/selection projection ${i}: ${check.error}`);
  }
  await mkdir('artifacts/opening-inspection', { recursive: true });
  await page.locator('#projection-test').screenshot({ path: 'artifacts/opening-inspection/corrected-opening.jpg', type: 'jpeg', quality: 65 });
  console.log('PASS: 2,790 soldiers; landscape spacing, zoom/pan, resize, portrait order mapping, unchanged deployment.');
} finally { await browser.close(); }
