import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  await page.routeWebSocket('**/*', socket => socket.close());
  await page.route('**/pose-cache-test', route => route.fulfill({ contentType: 'text/html', body: '<canvas></canvas>' }));
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/pose-cache-test');
  const result = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const { SpriteLibrary } = await import('/src/crown-battle-art.js');
    const library = new SpriteLibrary();
    const source = library.get('sword', 0, 0, 'idle', 0);
    library.beginFrame(); library.remainingMs = 0;
    const fallback = library.get('sword', 0, 4, 'attack', 0);
    const fallbackSafe = fallback === source && !library.isExactPose(fallback, 4, 'attack');
    library.endFrame();
    const exact = library.get('sword', 0, 4, 'attack', 0);
    const exactSafe = library.isExactPose(exact, 4, 'attack');
    const b = new Battle({ size: 4 }), r = new BattleRenderer(document.querySelector('canvas'), b);
    r.readyPoses = new Map(); r.framePoses = new Map();
    const u = b.units[0];
    let lookups = 0;
    const original = r.sprites.get.bind(r.sprites);
    r.sprites.get = (...args) => { lookups++; return original(...args); };
    const first = r.cachedSprite(u);
    r.framePoses.clear();
    const second = r.cachedSprite(u), reused = first === second && lookups === 1;
    r.spriteCache.clear(); r.framePoses.clear();
    const third = r.cachedSprite(u);
    const evictionSafe = third !== first && r.spriteCache.pages.includes(third.page) && lookups === 2;
    return { fallbackSafe, exactSafe, reused, evictionSafe };
  });
  assert.deepEqual(errors, []);
  for (const [name, passed] of Object.entries(result)) assert(passed, name);
  console.log('PASS exact pose reuse, budget fallback recovery and atlas eviction');
} finally { await browser.close(); }
