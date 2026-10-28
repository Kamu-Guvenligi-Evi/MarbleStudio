import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { MIDDLE_EARTH_UNITS as units, MIDDLE_EARTH_IMAGES as refs } from '../src/middle-earth-units.js';
import { HISTORICAL_TYPES, validateHistoricalArmies } from '../src/historical-combat.js';
import { Battle } from '../src/crown-battle.js';
import catalogue from '../src/historical-catalogue.js';
import './middle-earth-combat.mjs';

assert.equal(units.length, 37);
assert.equal(units.filter(u => u.hero).length, 16);
for (const unit of units) {
  assert.ok(HISTORICAL_TYPES[unit.id]);
  assert.equal(HISTORICAL_TYPES[unit.id].hp, catalogue.find(u => u.id === unit.id).combat.hp);
  await fs.access(`public${unit.image}`);
}
const armies = [{ me_aragorn: 1, me_legolas: 1, me_gimli: 1, me_iron_hills_dwarf: 4 }, { me_sauron: 1, me_witch_king: 1, me_mordor_orc: 6 }];
assert.deepEqual(validateHistoricalArmies(armies), armies);
const battle = new Battle({ historicalArmies: armies });
assert.equal(battle.units.length, 15);
assert.equal(battle.units.find(u => u.type === 'me_gimli').maxHp, 750);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  const errors = [], external = [], failed = [];
  page.on('pageerror', e => errors.push(e.stack || e.message));
  page.on('request', req => { if (!req.url().startsWith('http://127.0.0.1:5173') && !req.url().startsWith('data:') && !req.url().startsWith('blob:')) external.push(req.url()); });
  page.on('response', res => { if (res.url().includes('/middle-earth/') && res.status() >= 400) failed.push(res.url()); });
  await page.route('**/*', route => route.request().url().startsWith('http://127.0.0.1:5173') ? route.continue() : route.abort());
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  await page.locator('.unit-card[data-id="me_gimli"]').waitFor();
  assert.equal(await page.locator('.unit-card[data-id^="me_"]').count(), units.length);
  await page.locator('#clear').click();
  for (const [team, army] of armies.entries()) for (const [id, count] of Object.entries(army)) {
    await page.locator(`input[data-id="${id}"][data-team="${team}"]`).fill(String(count));
  }
  await page.reload();
  assert.equal(await page.locator('input[data-id="me_gimli"][data-team="0"]').inputValue(), '1');
  assert.equal(await page.locator('input[data-id="me_sauron"][data-team="1"]').inputValue(), '1');
  const spriteChecks = await page.evaluate(async () => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    await (await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
    const { BattleSpriteCache } = await import('/src/crown-battle-sprite-cache.js');
    const { MIDDLE_EARTH_UNITS } = await import('/src/middle-earth-units.js');
    const lib = new SpriteLibrary(), cache = new BattleSpriteCache(), heights = {}, empty = [], clipped = [], duplicates = [], frozen = [], teamFailures = [];
    const silhouettes = new Map(); let poses = 0;
    function hash(canvas, alphaOnly = false) {
      const bytes = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let h = 2166136261;
      for (let i = alphaOnly ? 3 : 0; i < bytes.length; i += alphaOnly ? 4 : 1) h = Math.imul(h ^ (alphaOnly ? +(bytes[i] > 80) : bytes[i]), 16777619);
      return h >>> 0;
    }
    for (const unit of MIDDLE_EARTH_UNITS) {
      const idle = lib.get(unit.id, 0, 0, 'idle', 0), silhouette = hash(idle, true);
      if (silhouettes.has(silhouette)) duplicates.push([unit.id, silhouettes.get(silhouette)]);
      silhouettes.set(silhouette, unit.id);
      if (hash(idle) === hash(lib.get(unit.id, 1, 0, 'idle', 0))) teamFailures.push(unit.id);
      for (const team of [0, 1]) for (const action of ['idle', 'walk', 'attack']) {
        const frames = new Set();
        for (let frame = 0; frame < 8; frame++) {
        const source = lib.get(unit.id, team, frame, action, 0); poses++; frames.add(hash(source));
        const bounds = cache.boundsOf(source);
        if (!bounds) empty.push(unit.id);
        if (bounds && (bounds.top <= -61 || bounds.bottom >= 15 || bounds.left <= -30 || bounds.right >= 50)) clipped.push(`${unit.id}/${team}/${action}/${frame}`);
        if (action === 'idle' && frame === 0) heights[unit.id] = (bounds.bottom - bounds.top) * (unit.combat.visualScale || 1);
        }
        if (frames.size < 3) frozen.push(`${unit.id}/${team}/${action}`);
      }
    }
    const aragorn = lib.get('me_aragorn', 0, 0, 'idle', 0);
    const gimli = lib.get('me_gimli', 0, 0, 'idle', 0);
    cache.beginFrame(2);
    const shadow = document.createElement('canvas'); shadow.width = shadow.height = 16;
    const atlasHuman = cache.get(aragorn, 1, false, 2, shadow);
    const atlasDwarf = cache.get(gimli, 1, false, 2, shadow);
    return { poses, heights, empty, clipped, duplicates, frozen, teamFailures, atlasHuman: atlasHuman.height * MIDDLE_EARTH_UNITS.find(u=>u.id==='me_aragorn').combat.visualScale, atlasDwarf: atlasDwarf.height * MIDDLE_EARTH_UNITS.find(u=>u.id==='me_gimli').combat.visualScale,
      animated: lib.get('me_aragorn', 0, 0, 'walk', 0).toDataURL() !== lib.get('me_aragorn', 0, 2, 'walk', 0).toDataURL() };
  });
  assert.deepEqual(spriteChecks.empty, []); assert.deepEqual(spriteChecks.clipped, []);
  assert.equal(spriteChecks.poses, 1728);
  assert.deepEqual(spriteChecks.duplicates, []); assert.deepEqual(spriteChecks.frozen, []); assert.deepEqual(spriteChecks.teamFailures, []);
  for (const id of ['me_gimli', 'me_iron_hills_dwarf', 'me_iron_hills_veteran']) {
    assert.ok(spriteChecks.heights[id] < spriteChecks.heights.me_aragorn * .75, `${id} must stay short in the battlefield sprite`);
    assert.ok(spriteChecks.heights[id] < spriteChecks.heights.me_legolas * .75);
  }
  assert.ok(spriteChecks.animated);
  assert.ok(spriteChecks.atlasDwarf < spriteChecks.atlasHuman * .8, 'Atlas packing must preserve dwarf height');
  await page.locator('#launch-battle').click();
  await page.waitForURL('**/crown-battle.html?historical=1');
  await page.locator('canvas').first().waitFor();
  await page.waitForTimeout(1800);
  const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('marble-historical-armies-v1')));
  assert.deepEqual(saved.map(army => Object.fromEntries(Object.entries(army).filter(([,count]) => count > 0))), armies);
  await fs.mkdir('artifacts/middle-earth', { recursive: true });
  await page.screenshot({ path: 'artifacts/middle-earth/battle.jpg', type: 'jpeg', quality: 70 });
  // Leave the live battle before building a preview, so its RAF cannot access removed UI.
  await page.route('**/middle-earth-preview', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body></body>' }));
  await page.goto('http://127.0.0.1:5173/middle-earth-preview');
  // Same world scale, both facing directions, idle and attack, including dwarf height.
  await page.evaluate(async () => {
    await (await import('/src/middle-earth-painted-art.js')).middleEarthArtReady;
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const { MIDDLE_EARTH_UNITS } = await import('/src/middle-earth-units.js');
    const lib = new SpriteLibrary();
    document.body.style = 'margin:0;background:#1c2926';
    for (let group = 0; group < 4; group++) {
      const main = document.createElement('main'); main.id = `roster-${group}`;
      main.style = 'display:grid;grid-template-columns:repeat(3,310px);width:930px;background:#283831;color:#f0e5c6;font:14px sans-serif';
      for (const unit of MIDDLE_EARTH_UNITS.slice(group * 9, group * 9 + 9)) {
        const cell = document.createElement('div'); cell.style = 'height:300px;text-align:center;box-shadow:inset 0 0 0 1px #506052';
        const canvas = document.createElement('canvas'); canvas.width = 310; canvas.height = 274; canvas.style = 'display:block';
        const ctx = canvas.getContext('2d');
        for (const team of [0,1]) {
          const size = (unit.combat.visualScale || 1) * .4;
          ctx.save(); ctx.translate(team ? 245 : 65, 255);ctx.scale(team ? -size : size, size);
          ctx.drawImage(lib.get(unit.id,team,team ? 3 : 0,team ? 'attack' : 'idle',0),-90,-183,240,228);ctx.restore();
        }
        cell.append(canvas, unit.name); main.append(cell);
      }
      document.body.append(main);
    }
  });
  for (let group=0;group<4;group++) await page.locator(`#roster-${group}`).screenshot({ path: `artifacts/middle-earth/roster-${group+1}.jpg`, type: 'jpeg', quality: 82 });
  await page.goto('http://127.0.0.1:5173/historical-armies.html');
  for (const width of [1366,390]) {
    await page.setViewportSize({width,height:850});
    await page.locator('#search').fill('Gimli');
    await page.locator('.unit-card[data-id="me_gimli"]').waitFor({state:'visible'});
    assert.equal(await page.locator('.unit-card:visible').count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1), `${width}px catalogue overflow`);
  }
  await page.locator('#search').fill('Sauron');
  const red = page.locator('input[data-id="me_sauron"][data-team="1"]');
  await red.fill('0');await page.reload();
  assert.equal(await red.inputValue(),'0','Red hero can be removed and stays removed');
  assert.deepEqual(errors, []); assert.deepEqual(external, []); assert.deepEqual(failed, []);
  await fs.writeFile('artifacts/middle-earth/checks.json', JSON.stringify({ units: units.length, assets: Object.keys(refs).length, ...spriteChecks, errors, external, failed }, null, 2));
  console.log('PASS: 36 unique silhouettes, 16 heroes; army save/reload/launch; 1728 poses, both teams animated; dwarf scale; no browser errors or external requests.');
} finally { await browser.close(); }
