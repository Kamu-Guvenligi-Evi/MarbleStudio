import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium } from 'playwright';
import { COMMANDER_ALLIED_CONTINGENTS_UNITS as units } from '../src/commander-allied-contingents-units.js';
import catalogue from '../src/historical-catalogue.js';
import { HISTORICAL_TYPES as types, restoreHistoricalArmies } from '../src/historical-combat.js';
import { cultureForCivilization } from '../src/historical-culture-groups.js';
import { createCommanderArmy, ARMY_PRESETS, presetMinimum } from '../src/historical-army-presets.js';
import { Battle } from '../src/crown-battle.js';

assert.equal(new Set(catalogue.map(u => u.id)).size, catalogue.length);
let battles = 0;
for (const u of units) {
  assert.equal(cultureForCivilization(u.faction).id, 'ancient', `${u.id}: ancient civilization navigation`);
  const commander = u.id.startsWith('alexander_') ? 'alexander_great' : 'hannibal_barca';
  const army = createCommanderArmy(commander, presetMinimum(ARMY_PRESETS[commander]));
  assert.ok(army[u.id] > 0, `${u.id}: included at minimum army size`);
  for (const team of [0, 1]) {
    const armies = [{ roman: 12 }, { roman: 12 }]; armies[team] = { [u.id]: 12 };
    assert.deepEqual(restoreHistoricalArmies(JSON.parse(JSON.stringify(armies))).armies, armies);
    const b = new Battle({ historicalArmies: armies, seed: 19 });
    let damage = 0;
    b.onCombatEvent = e => { if (e.kind === 'hit' && e.target.team !== team) damage++; };
    for (let tick=0; tick<30*240 && b.winner===null; tick++) b.step(1/30);
    assert.notEqual(b.winner, null, `${u.id}/${team}: natural battle finishes`);
    assert.ok(damage > 0, `${u.id}/${team}: actual enemy hits`);
    assert.ok(b.units.every(v => [v.x,v.y,v.hp].every(Number.isFinite)));
    battles++;
  }
}
assert.ok(types.alexander_odrysian_cavalry.speed > types.alexander_greek_mercenary_cavalry.speed);
assert.ok(types.alexander_odrysian_cavalry.armor < types.alexander_greek_mercenary_cavalry.armor);
console.log(`PASS ${battles} natural battles; both teams hit enemies, saves restore, minimum armies include new contingents.`);
const dir = 'artifacts/commander-allied-contingents';
await fs.mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1080, height: 300 } });
  page.setDefaultTimeout(15000);
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.routeWebSocket('**/*', s => s.close());
  await page.route('**/*', r => new URL(r.request().url()).hostname === '127.0.0.1' ? r.continue() : r.abort());
  await page.route('**/__allied-contingents-preview', r => r.fulfill({ contentType: 'text/html', body: '<body style="margin:0;background:#28352d;color:#eee;font:14px sans-serif;display:flex"></body>' }));
  await page.goto('http://127.0.0.1:5173/__allied-contingents-preview');
  const frames = await page.evaluate(async units => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const { historicalSprite } = await import('/src/historical-battle-art.js');
    const lib = new SpriteLibrary(), hashes = new Set(); let frames=0;
    for(const u of units) {
      for(const team of [0,1]) for(const action of ['idle','walk','attack','charge','charge-ready']) for(let f=0;f<8;f++) {
        const c=lib.get(u.id,team,f,action,0), d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;
        let pixels=0;
        for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(d[(y*c.width+x)*4+3]>20) {
          pixels++;
          if(!x||!y||x===c.width-1||y===c.height-1)throw new Error(`${u.id}/${action}/${f}: clipped`);
        }
        if(!pixels)throw new Error(`${u.id}: empty`);
        if(!team&&!f&&action==='idle') {
          // Detect namespace collisions that silently route custom equipment to another renderer.
          const signature = {
            alexander_greek_mercenary_infantry: [212,201,164],
            alexander_greek_mercenary_cavalry: [169,147,98],
            alexander_odrysian_cavalry: [148,79,59],
            hannibal_ligurian_infantry: [165,143,97],
          }[u.id];
          // Inspect pigment before SpriteLibrary applies its directional lighting.
          const raw=historicalSprite(u.id,team,f,action,0);
          const pigment=raw.getContext('2d').getImageData(0,0,raw.width,raw.height).data;
          let equipmentPixels=0;
          for(let i=0;i<pigment.length;i+=4)if(pigment[i+3]>240&&signature.every((v,k)=>Math.abs(pigment[i+k]-v)<3))equipmentPixels++;
          if(equipmentPixels<10)throw new Error(`${u.id}: custom equipment was replaced by a fallback`);
          const alpha=Uint8Array.from({length:c.width*c.height},(_,i)=>d[i*4+3]>=128?1:0);
          const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',alpha))).join(',');
          if(hashes.has(hash))throw new Error(`${u.id}: duplicate silhouette`);
          hashes.add(hash);
        }
        frames++;
      }
      const row=document.createElement('section');row.style.cssText='width:270px;text-align:center';
      const label=document.createElement('p');label.textContent=u.name;row.append(label);
      const c=document.createElement('canvas');c.width=260;c.height=240;
      c.getContext('2d').drawImage(lib.get(u.id,0,0,'idle',0),10,0);row.append(c);document.body.append(row);
      lib.cache.clear();
    }
    return frames;
  }, units);
  await page.screenshot({ path:`${dir}/units.jpg`,type:'jpeg',quality:75 });
  for(const width of [1366,390]) {
    await page.setViewportSize({width,height:850});
    await page.goto('http://127.0.0.1:5173/historical-armies.html');
    await page.evaluate(()=>localStorage.removeItem('marble-battle-alliances-v1'));
    for(const u of units) {
      await page.locator('[data-culture="culture:ancient"]').click();
      await page.locator(`[data-country="${u.faction}"]`).click();
      for(const team of [0,1]) {
        const input=page.locator(`input[data-id="${u.id}"][data-team="${team}"]`);
        await input.fill('2');assert.equal(await input.inputValue(),'2');
        await input.fill('0');assert.equal(await input.inputValue(),'0');await input.fill('2');
      }
    }
    await page.locator('#launch-battle').click();await page.waitForURL('**/crown-battle.html?historical=1');await page.reload();
    for(const u of units)for(const prefix of ['north','red'])assert.equal(await page.locator(`#${prefix}-${u.id}`).inputValue(),'2');
  }
  assert.deepEqual(errors,[]);
  await fs.writeFile(`${dir}/checks.json`,JSON.stringify({battles,frames,units:units.map(u=>u.id),widths:[1366,390],errors},null,2));
  console.log(`PASS ${frames} animation frames, distinct silhouettes, PC/phone selection, both armies, launch and reload.`);
} finally { await browser.close(); }
