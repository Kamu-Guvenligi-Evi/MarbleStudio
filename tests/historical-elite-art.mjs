import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1530 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/__elite-art-preview', route => route.fulfill({ contentType: 'text/html', body: '<html><body style="margin:0;background:#1b2823;color:#eee;font:12px sans-serif"><main style="display:grid;grid-template-columns:repeat(5,220px)"></main></body></html>' }));
  await page.goto('http://127.0.0.1:5173/__elite-art-preview');
  const result = await page.evaluate(async () => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const lib = new SpriteLibrary();
    const { default: catalogue } = await import('/src/historical-catalogue.js');
    const { HISTORICAL_ART_PROFILES: profiles } = await import('/src/historical-art-profiles.js');
    const { MYTHOLOGICAL_BY_ID: creatures } = await import('/src/mythological-units.js');
    const { MIDDLE_EARTH_BY_ID: middleEarth } = await import('/src/middle-earth-units.js');
    const { HISTORICAL_TYPES: types } = await import('/src/historical-combat.js');
    const ids = catalogue.map(u => u.id);
    let count = 0; const clipped = [], empty = [], duplicates = [], duplicateSilhouettes = [], hashes = new Map(), silhouettes = new Map();
    const missing = ids.filter(id => types[id].role !== 'elephant' && !profiles[id] && !creatures[id] && !middleEarth[id]);
    for (const id of ids) {
      for (const team of [0, 1]) for (const action of ['idle', 'walk', 'attack']) for (let frame = 0; frame < 8; frame++) {
        const c = lib.get(id, team, frame, action, 0), { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
        let pixels = 0, edge = false;
        for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (data[(y*c.width+x)*4+3] > 20) {
          pixels++; if (x === 0 || y === 0 || x === c.width-1 || y === c.height-1) edge = true;
        }
        if (!pixels) empty.push(`${id}/${team}/${action}/${frame}`);
        if (edge) clipped.push(`${id}/${team}/${action}/${frame}`);
        // Film references are deliberately shared by some army role variants.
        if (team === 0 && action === 'idle' && frame === 0 && !middleEarth[id]) {
          const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data))).join(',');
          if (hashes.has(hash)) duplicates.push([hashes.get(hash), id]);
          hashes.set(hash, id);
          const alpha = new Uint8Array(c.width*c.height);
          for (let i = 0; i < alpha.length; i++) alpha[i] = data[i*4+3] >= 128 ? 1 : 0;
          const silhouette = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', alpha))).join(',');
          if (silhouettes.has(silhouette)) duplicateSilhouettes.push([silhouettes.get(silhouette), id]);
          silhouettes.set(silhouette, id);
        }
        count++;
      }
      const card = document.createElement('section'); card.style.cssText = 'height:170px;text-align:center;border:1px solid #506050;box-sizing:border-box';
      const label = document.createElement('p'); label.textContent = catalogue.find(u=>u.id===id).name; label.style.cssText = 'margin:8px 4px 0;height:20px'; card.append(label);
      const preview = document.createElement('canvas'); preview.width = 218; preview.height = 140;
      const g = preview.getContext('2d'); g.drawImage(lib.get(id, 0, 0, 'idle', 0), 0, -5, 148, 140.6);
      g.drawImage(lib.get(id, 1, 3, 'attack', 0), 136, 60, 80, 76);
      card.append(preview); document.querySelector('main').append(card);
      lib.cache.clear();
    }
    const kipchak = types.kipchak_masked_swordsman;
    return { count, clipped, empty, duplicates, duplicateSilhouettes, missing, kipchakMelee: kipchak.role === 'cavalry' && !kipchak.ranged && !kipchak.skirmish };
  });
  await fs.mkdir('artifacts/historical-combat', { recursive: true });
  await page.screenshot({ path: 'artifacts/historical-combat/elite-art-preview.jpg', type: 'jpeg', quality: 78 });
  await page.evaluate(async()=>{
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const { default: catalogue } = await import('/src/historical-catalogue.js');
    const lib = new SpriteLibrary(),main=document.querySelector('main');main.replaceChildren();main.style.gridTemplateColumns='repeat(3,260px)';
    for(const id of ['kipchak_masked_swordsman','samurai','hussar','german_armoured_foot','mexica_jaguar','parthian_cataphract']){
      const card=document.createElement('section');card.style.cssText='height:250px;text-align:center;border:1px solid #506050;box-sizing:border-box';
      const label=document.createElement('p');label.textContent=catalogue.find(u=>u.id===id).name;label.style.margin='8px 0 0';
      card.append(label,lib.get(id,0,0,'idle',0));main.append(card);
    }
  });
  await page.screenshot({ path: 'artifacts/historical-combat/elite-art-details.jpg', type:'jpeg',quality:82,clip:{x:0,y:0,width:780,height:500} });
  await fs.writeFile('artifacts/historical-combat/elite-art-checks.json', JSON.stringify(result, null, 2));
  assert.deepEqual(result.empty, []); assert.deepEqual(result.clipped, []); assert.deepEqual(errors, []);
  assert.deepEqual(result.missing, []); assert.deepEqual(result.duplicates, []); assert.ok(result.kipchakMelee);
  assert.deepEqual(result.duplicateSilhouettes, [], 'Different uniforms must also change geometry, not only colour');
  console.log(`PASS: ${result.count} elite sprite frames; both armies, idle/walk/attack; no empty or clipped sprites or browser errors.`);
} finally { await browser.close(); }
