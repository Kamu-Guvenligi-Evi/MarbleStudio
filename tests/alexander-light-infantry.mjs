import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { Battle } from '../src/crown-battle.js';
import { createCommanderArmy } from '../src/historical-army-presets.js';
import { restoreHistoricalArmies } from '../src/historical-combat.js';

const ids = ['thracian_peltast', 'greek_cretan_archer'];
let battles = 0;
for (const team of [0, 1]) {
  for (const [id, projectile] of [['thracian_peltast', 'dart'], ['greek_cretan_archer', 'arrow'], ['alexander_great', null]]) {
    const army = projectile ? { [id]: 12 } : createCommanderArmy(id, 48);
    const armies = [{ roman: projectile ? 12 : 48 }, { roman: projectile ? 12 : 48 }];
    armies[team] = army;
    assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(armies))).armies, armies);
    const commanders = [null, null];
    if (!projectile) commanders[team] = id;
    const b = new Battle({ historicalArmies: armies, commanders, seed: 19 });
    const shots = new Set(); let hits = 0;
    b.onCombatEvent = e => { if (e.kind === 'hit' && e.target.team !== team && e.projectileKind === projectile) hits++; };
    if (!projectile) for (const type of ids) assert.equal(b.units.filter(u => u.team === team && u.type === type).length, army[type]);
    for (let tick = 0; tick < 30 * 240 && b.winner === null; tick++) {
      b.step(1 / 30);
      for (const p of b.projectiles) shots.add(p.style);
    }
    assert.notEqual(b.winner, null, `${id}/${team}: battle finishes`);
    assert.ok(b.units.every(u => [u.x, u.y, u.hp].every(Number.isFinite)));
    if (projectile) {
      assert.ok(shots.has(projectile), `${id}/${team}: correct projectile`);
      assert.ok(hits > 0, `${id}/${team}: actual enemy projectile hits`);
    }
    battles++;
  }
}
console.log(`PASS: ${battles} natural battles; both teams, enemy projectile hits, commander spawning and saved armies.`);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 780, height: 550 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.route('**/__alexander-preview', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0;background:#28352d;color:#eee;font:16px sans-serif"></body>' }));
  await page.goto('http://127.0.0.1:5173/__alexander-preview');
  const frames = await page.evaluate(async ids => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const lib = new SpriteLibrary(); let frames = 0;
    for (const id of ids) {
      for (const team of [0, 1]) for (const action of ['idle', 'walk', 'attack', 'charge', 'charge-ready']) for (let f = 0; f < 8; f++) {
        const c = lib.get(id, team, f, action, 0), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let pixels = 0;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) {
          pixels++;
          if (!x || !y || x === c.width - 1 || y === c.height - 1) throw new Error(`${id}/${action}/${f}: clipped`);
        }
        if (!pixels) throw new Error(`${id}: empty`);
        frames++;
      }
      const row = document.createElement('section'), label = document.createElement('div');
      label.textContent = id === 'thracian_peltast' ? 'Trak peltastı' : 'Giritli okçu'; row.append(label);
      for (const [action, frame] of [['idle', 0], ['attack', 2], ['attack', 5]]) {
        const c = document.createElement('canvas'); c.width = 260; c.height = 240;
        const g = c.getContext('2d'); g.drawImage(lib.get(id, 0, frame, action, 0), 10, 0);
        g.fillStyle = '#eee'; g.fillText(`${action} ${frame}`, 15, 230); row.append(c);
      }
      document.body.append(row);
    }
    return frames;
  }, ids);
  await page.screenshot({ path: 'artifacts/alexander-light-infantry.jpg', type: 'jpeg', quality: 75 });
  assert.deepEqual(errors, []);
  console.log(`PASS: ${frames} nonempty, unclipped animation frames; local visual preview saved.`);
} finally { await browser.close(); }
