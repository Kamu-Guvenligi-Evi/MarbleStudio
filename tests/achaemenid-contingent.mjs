import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { ACHAEMENID_CONTINGENT_UNITS } from '../src/achaemenid-contingent-units.js';


import catalogue from '../src/historical-catalogue.js';
import { HISTORICAL_TYPES as types, restoreHistoricalArmies } from '../src/historical-combat.js';
import { HISTORICAL_ART_PROFILES as profiles } from '../src/historical-art-profiles.js';
import { cultureForCivilization } from '../src/historical-culture-groups.js';
import { Battle } from '../src/crown-battle.js';
const units = ACHAEMENID_CONTINGENT_UNITS;

assert.equal(new Set(catalogue.map(u => u.id)).size, catalogue.length);
const army = Object.fromEntries(units.map(u => [u.id, 2]));
const saved = [{ roman: 3, ...army }, { kipchak: 4, ...army }];
assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(saved))).armies, saved);
for (const u of units) {
  assert.ok(profiles[u.id] && cultureForCivilization(u.faction));
  for (const team of [0, 1]) {
    const b = new Battle({ historicalArmies: team ? [{ roman: 1 }, { [u.id]: 1 }] : [{ [u.id]: 1 }, { roman: 1 }], seed: 19 });
    const a = b.units.find(v => v.team === team), enemy = b.units.find(v => v.team !== team);
    Object.assign(a, { x: 250, y: 400, cooldown: 0, chargeCooldown: 100 });
    Object.assign(enemy, { x: (types[u.id].ranged || types[u.id].role === 'archer') ? 360 : 276, y: 400, cooldown: 100 });
    const projectiles = new Set();
    for (let i = 0; i < 150; i++) {
      b.step(1 / 30);
      b.projectiles.forEach(p => projectiles.add(p.style));
    }
    assert.ok(enemy.hp < enemy.maxHp, `${u.id}/${team}: actual damage`);
    if ((types[u.id].ranged || types[u.id].role === 'archer')) assert.ok(projectiles.has(u.combat.projectile || 'arrow'), `${u.id}: correct projectile`);
    assert.ok(b.units.every(v => [v.x, v.y, v.hp].every(Number.isFinite)));
  }
}
assert.equal(types.paphlagonian_short_spearman.role, 'pike');
assert.equal(types.colchian_hide_spearman.role, 'pike');
assert.equal(types.libyan_fire_javelineer.projectile, 'dart');
assert.equal(types.aithiopian_palm_archer.role, 'archer');
for (const u of units) assert.notEqual(cultureForCivilization(u.faction).id, 'other');
console.log('PASS four roles: damage on both teams, projectiles, saved armies.');
const battles = [];
for (const u of units) for (const team of [0, 1]) {
  const armies = [{ [u.id]: 12 }, { roman: 12 }];
  const b = new Battle({ historicalArmies: team ? armies.reverse() : armies, seed: 19 });
  for (let tick = 0; tick < 30 * 240 && b.winner === null; tick++) b.step(1 / 30);
  assert.notEqual(b.winner, null, `${u.id}/${team}: battle finishes`);
  assert.ok(b.units.every(v => [v.x, v.y, v.hp].every(Number.isFinite)));
  if ((types[u.id].ranged || types[u.id].role === 'archer')) assert.ok(b.stats.arrows > 0, `${u.id}: arrows in full battle`);
  battles.push({ id: u.id, team, winner: b.winner, seconds: +b.time.toFixed(2) });
}
await fs.mkdir('artifacts/achaemenid-contingent', { recursive: true });
await fs.writeFile('artifacts/achaemenid-contingent/full-battles.json', JSON.stringify(battles, null, 2));
console.log(`PASS ${battles.length} full battles; longest ${Math.max(...battles.map(b => b.seconds))} seconds.`);
if (process.argv.includes('--node-only')) process.exit(0);

const dir = 'artifacts/achaemenid-contingent';
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 850 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.stack || e.message));
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.route('**/__achaemenid-contingent-preview', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0;background:#28352d;color:#eee;font:14px sans-serif"><main style="display:flex;flex-wrap:wrap"></main></body>' }));
  await page.goto('http://127.0.0.1:5173/__achaemenid-contingent-preview');
  const art = await page.evaluate(async units => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const lib = new SpriteLibrary(), faults = [], silhouettes = new Set();
    let frames = 0;
    for (const u of units) {
      for (const team of [0, 1]) for (const action of ['idle', 'walk', 'attack', 'charge', 'charge-ready']) for (let f = 0; f < 8; f++) {
        const c = lib.get(u.id, team, f, action, 0), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        let n = 0, edge = false;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 20) {
          n++; edge ||= !x || !y || x === c.width - 1 || y === c.height - 1;
        }
        if (!n || edge) faults.push(`${u.id}/${team}/${action}/${f}: empty or clipped`);
        if (!team && !f && action === 'idle') {
          const alpha = Uint8Array.from({ length: c.width * c.height }, (_, i) => d[i * 4 + 3] >= 128 ? 1 : 0);
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', alpha))).join(',');
          if (silhouettes.has(hash)) faults.push(`${u.id}: duplicate silhouette`);
          silhouettes.add(hash);
        }
        frames++;
      }
      const card = document.createElement('section'); card.style.cssText = 'width:270px;text-align:center';
      const title = document.createElement('p'); title.textContent = u.name; card.append(title);
      const c = document.createElement('canvas'); c.width = 260; c.height = 228;
      c.getContext('2d').drawImage(lib.get(u.id, 0, 0, 'idle', 0), 10, 0);
      card.append(c); document.querySelector('main').append(card); lib.cache.clear();
    }
    return { frames, faults, distinct: silhouettes.size };
  }, units);
  await page.screenshot({ path: `${dir}/units.jpg`, type: 'jpeg', quality: 72, fullPage: true });
  assert.deepEqual(art.faults, []);
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('http://127.0.0.1:5173/historical-armies.html');
    // A separate workshop save must not inherit the previous viewport's alliance plan.
    await page.evaluate(() => localStorage.removeItem('marble-battle-alliances-v1'));
    for (const u of units) {
      await page.locator(`[data-culture="culture:${cultureForCivilization(u.faction).id}"]`).click();
      await page.locator(`[data-country="${u.faction}"]`).click();
      for (const team of [0, 1]) {
        const input = page.locator(`input[data-id="${u.id}"][data-team="${team}"]`);
        await input.fill('2'); assert.equal(await input.inputValue(), '2');
        await input.fill('0'); assert.equal(await input.inputValue(), '0');
        await input.fill('2');
      }
    }
    await page.locator('#launch-battle').click();
    await page.waitForURL('**/crown-battle.html?historical=1');
    await page.reload();
    for (const u of units) for (const prefix of ['north', 'red']) assert.equal(await page.locator(`#${prefix}-${u.id}`).inputValue(), '2');
  }
  assert.deepEqual(errors, []);
  await fs.writeFile(`${dir}/checks.json`, JSON.stringify({ ...art, units: units.map(u => u.id), pcAndPhoneBothTeams: true, errors }, null, 2));
  console.log(`PASS ${art.frames} animation frames; PC/phone, both teams add/remove, launch and reload.`);
} finally { await browser.close(); }


