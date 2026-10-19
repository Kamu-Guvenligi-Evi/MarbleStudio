import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { combatPose } from '../src/crown-battle-combat-motion.js';
import { strideClock } from '../src/crown-battle-reference-motion.js';
import { soldierFrame } from '../src/crown-battle-tactical-visuals.js';

const dir = 'artifacts/video-motion-2026-10-17';
mkdirSync(dir, { recursive: true });
for (const type of ['sword', 'pike', 'archer', 'cavalry', 'roman', 'hussar']) {
  const u = { type, id: 3, hp: 100, face: 1, phase: .7, moving: true, attack: 0 };
  const snapshot = JSON.stringify(u);
  for (let i = 0; i < 80; i++) {
    const time = i / 80;
    const p = combatPose(u, time, 0, {});
    const mirrored = combatPose({ ...u, face: -1 }, time, 0, {});
    assert.ok(Object.values(p).every(Number.isFinite));
    assert.ok(p.a * p.d - p.b * p.c > .9, 'No collapsed living sprites');
    assert.equal(p.c, -mirrored.c);
    assert.equal(p.y, mirrored.y);
    assert.equal(soldierFrame(u, 'walk', time), Math.floor(strideClock(u, time)) % 8);
    assert.deepEqual(combatPose(u, time, 0, {}), p, 'Pause freezes the pose');
  }
  assert.notDeepEqual(combatPose(u, 0, 0, {}), combatPose(u, .19, 0, {}));
  assert.equal(JSON.stringify(u), snapshot, 'Animation must not mutate simulation state');
  u.moving = false;
  assert.equal(combatPose(u, 1, 0, {}).c, 0, 'Stationary ranks have planted bodies');
  u.attack = .12;
  const contact = combatPose(u, 1, 0, {});
  if (type !== 'archer') assert.ok(contact.c < -.05, 'Melee leans into contact');
  u.attack = .03;
  assert.ok(Math.abs(combatPose(u, 1, 0, {}).c) < 1e-8, 'Recover with the weapon');
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 680 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/__reference-motion', route => route.fulfill({ contentType: 'text/html', body: '<body style="margin:0"><canvas id="preview" width="1000" height="680"></canvas></body>' }));
  await page.goto('http://127.0.0.1:5173/__reference-motion');
  const result = await page.evaluate(async () => {
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const { BattleSpriteCache } = await import('/src/crown-battle-sprite-cache.js');
    const { BattleSpriteBatch } = await import('/src/crown-battle-sprite-batch.js');
    const { combatPose, drawPosedSprite } = await import('/src/crown-battle-combat-motion.js');
    const { soldierAction, soldierFrame } = await import('/src/crown-battle-tactical-visuals.js');
    const { combatOffset } = await import('/src/crown-battle-feedback.js');
    const { visualScaleOf } = await import('/src/crown-battle-visual-scale.js');
    const { unitAtPoint } = await import('/src/crown-battle-hit-test.js');
    const library = new SpriteLibrary(), cache = new BattleSpriteCache(), batch = new BattleSpriteBatch();
    cache.beginFrame(2);
    const sheet = document.querySelector('#preview'), ctx = sheet.getContext('2d');
    ctx.fillStyle = '#394536'; ctx.fillRect(0, 0, sheet.width, sheet.height);
    ctx.font = '16px sans-serif'; ctx.fillStyle = '#eee7d6';
    ctx.fillText('Video motion study: march / canter / charge / thrust / sword / release', 20, 24);
    const examples = [
      ['roman', 'walk'], ['cavalry', 'walk'], ['hussar', 'charge'],
      ['pike', 'attack'], ['sword', 'attack'], ['archer', 'attack'],
    ];
    const a = document.createElement('canvas'), b = document.createElement('canvas');
    a.width = b.width = 600; a.height = b.height = 480;
    const ac = a.getContext('2d', { willReadFrequently: true }), bc = b.getContext('2d', { willReadFrequently: true });
    const comparisons = []; let picks = 0;
    for (let frame = 0; frame < 8; frame++) {
      const time = frame / 11, units = [], frameSprites = new Map();
      examples.forEach(([type, state], row) => {
        for (const face of [-1, 1]) {
          const u = { id: row, type, team: 0, hp: 100, face, phase: 0, moving: state !== 'attack',
            attack: state === 'attack' ? .24 * (1 - frame / 8) : 0,
            charge: state === 'charge' ? { age: 1 } : null, x: face === 1 ? 400 : 180, y: 130 + row * 140 };
          const action = soldierAction(u), index = soldierFrame(u, action, time);
          const source = library.get(type, 0, index, action, row % 3);
          const entry = cache.get(source, face, row === 1 || row === 2, 2, null);
          const pose = combatPose(u, time, combatOffset(u), {});
          units.push(u); frameSprites.set(u, entry);
          if (face === 1) {
            ctx.fillStyle = '#eee7d6'; if (!frame) ctx.fillText(`${type} / ${state}`, 12, row * 106 + 54);
            ctx.save(); ctx.translate(210 + frame * 100, row * 106 + 115); ctx.scale(1.6, 1.6);
            drawPosedSprite(ctx, entry, pose, new Float64Array(15)); ctx.restore();
          }
          // Transform an opaque torso pixel into world space; picking must invert
          // the new pose, including mirrored horses and attack displacement.
          const pixels = source.getContext('2d').getImageData(0, 0, source.width, source.height).data;
          let sample;
          for (let y = 25; y < 51 && !sample; y++) for (let x = 25; x < 40; x++) {
            const ix = Math.floor(x * source.width / 80), iy = Math.floor(y * source.height / 76);
            if (pixels[(iy * source.width + ix) * 4 + 3] > 230) { sample = { x: ((ix + .5) * 80 / source.width - 30) * face, y: (iy + .5) * 76 / source.height - 61 }; break; }
          }
          if (!sample) throw new Error(`No torso sample for ${type}`);
          const size = visualScaleOf(u), point = {
            x: u.x + (pose.a * sample.x + pose.c * sample.y + pose.x) * size,
            y: u.y + (pose.b * sample.x + pose.d * sample.y + pose.y) * size,
          };
          const pickRenderer = { canvas: sheet, sprites: library, view: { zoom: 1 }, spriteScaleX: 1, spriteScaleY: 1 };
          if (unitAtPoint({ units: [u], time }, pickRenderer, point, null, 0) !== u) throw new Error(`Missed posed ${type}, face ${face}, frame ${frame}`);
          picks++;
        }
      });
      for (const c of [ac, bc]) { c.fillStyle = '#394536'; c.fillRect(0, 0, 600, 480); }
      const renderer = { canvas: b, ctx: bc, spriteCache: cache, frameSprites, viewWidth: 600, viewHeight: 960,
        view: { x: 300, y: 480, zoom: 1 }, spriteScaleX: 1, spriteScaleY: 1, battle: { time, winner: null } };
      ac.save(); ac.scale(1, .5);
      for (const u of units) {
        const size = visualScaleOf(u); ac.save(); ac.translate(u.x, u.y); ac.scale(size, size);
        drawPosedSprite(ac, frameSprites.get(u), combatPose(u, time, combatOffset(u), {}), new Float64Array(15)); ac.restore();
      }
      ac.restore();
      if (!batch.render(renderer, [], units, combatOffset)) throw new Error('GPU unavailable');
      const ap = ac.getImageData(0, 0, 600, 480).data, bp = bc.getImageData(0, 0, 600, 480).data;
      let delta = 0; for (let i = 0; i < ap.length; i++) delta += Math.abs(ap[i] - bp[i]);
      comparisons.push(delta / ap.length);
    }
    return { comparisons, picks, glError: batch.gl.getError(), cacheEntries: library.cache.size };
  });
  assert.deepEqual(errors, []);
  assert.equal(result.picks, 96);
  assert.equal(result.glError, 0);
  assert.ok(Math.max(...result.comparisons) < .5, 'Canvas/GPU active pose parity');
  await page.locator('#preview').screenshot({ path: `${dir}/motion-preview.png` });
  writeFileSync(`${dir}/results.json`, JSON.stringify(result, null, 2));
  console.log('PASS reference motion, pause, recovery, mirrored selection and Canvas/GPU parity', JSON.stringify(result));
} finally { await browser.close(); }
