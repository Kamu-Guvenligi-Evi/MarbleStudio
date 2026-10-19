import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { populateClassic } from './crown-battle-fixture.mjs';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
  await page.routeWebSocket('**/*', socket => socket.close());
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.__audioContexts = []; const Native = window.AudioContext;
    window.AudioContext = class extends Native { constructor(...args) { super(...args); window.__audioContexts.push(this); } };
    window.__recordings = []; const NativeRecorder = window.MediaRecorder;
    window.MediaRecorder = class extends NativeRecorder { constructor(stream, options) { super(stream, options); const entry = { tracks: stream.getTracks().map(t => t.kind), recorder: this, chunks: [] }; this.addEventListener('dataavailable', event => entry.chunks.push(event.data)); window.__recordings.push(entry); } };
  });
  await page.goto('http://127.0.0.1:5173/crown-battle.html?mode=classic');
  assert.equal(await page.evaluate(() => window.__audioContexts.length), 0, 'No autoplay context');
  await page.locator('#battle-sound-test').click();
  await page.waitForFunction(() => window.__audioContexts[0]?.state === 'running');
  await page.waitForFunction(() => document.getElementById('battle-sound-status').textContent.includes('çalındı'));
  assert.match(await page.locator('#battle-sound-status').innerText(), /çalındı/);
  await page.locator('#battle-sound').click();
  assert.equal(await page.locator('#battle-sound').getAttribute('aria-pressed'), 'false');
  await page.reload();
  assert.equal(await page.locator('#battle-sound').getAttribute('aria-pressed'), 'false', 'Mute persists');
  await page.locator('#battle-sound-test').click();
  await populateClassic(page);
  assert.equal(await page.locator('#north-count').innerText(), '160', JSON.stringify(errors));
  // Audio/recording regression does not need a crowded performance fixture.
  await page.locator('#menu-setup').click();
  for (const side of ['north', 'red']) for (const type of ['sword', 'pike', 'archer', 'cavalry']) await page.locator(`#${side}-${type}`).fill('2');
  await page.locator('#apply').click();
  await page.locator('#menu-recording').click();
  await page.locator('#record').click();
  await page.waitForFunction(() => window.__recordings.length > 0);
  console.log('Audio recording started');
  assert.deepEqual(await page.evaluate(() => window.__recordings[0].tracks.sort()), ['audio', 'video']);
  await page.evaluate(() => document.getElementById('battle-sound-test').click());
  // Wait for actual encoded media; a fixed 1.1 seconds can expire before the
  // first video chunk on a busy machine, producing an empty recording.
  await page.waitForFunction(() => window.__recordings[0].chunks.some(chunk => chunk.size > 100), { }, { timeout: 30000 });
  const download = page.waitForEvent('download');
  // captureStream can stall Chrome's locator box-model query; use a physical
  // pointer click at the live DOM rectangle, with an occlusion check.
  const stop = await page.locator('#record').evaluate(el => { const r = el.getBoundingClientRect(); const x = r.x + r.width / 2, y = r.y + r.height / 2; return { x, y, exposed: document.elementFromPoint(x, y) === el }; });
  assert(stop.exposed); await page.mouse.click(stop.x, stop.y);
  console.log('Recording stop:', await page.evaluate(() => ({ state: window.__recordings[0].recorder.state, note: document.getElementById('record-note').textContent })));
  await download;
  // Avoid Chrome's captureStream/locator input acknowledgement stall here too.
  await page.locator('#play').evaluate(el => { if (el.textContent.includes('Duraklat')) el.click(); });
  const recordedEnergy = await page.evaluate(async () => {
    const bytes = await new Blob(window.__recordings[0].chunks).arrayBuffer();
    const decoded = await window.__audioContexts[0].decodeAudioData(bytes);
    return decoded.getChannelData(0).reduce((sum, n) => sum + n * n, 0);
  });
  assert(recordedEnergy > .00001, 'Downloaded WebM contains a non-silent audio signal');
  const audioChecks = await page.evaluate(async () => {
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const sound = new BattleAudio(); sound.configure(true, .55); await sound.unlock();
    const banks = [...sound.clipBanks].map(([kind, bank]) => ({ kind, count: bank.length, valid: bank.every(buffer => {
      const data = buffer.getChannelData(0);
      return data.every(n => Number.isFinite(n) && Math.abs(n) < .7) && data.some(n => Math.abs(n) > .05) && data[0] === 0 && data.at(-1) === 0;
    }) }));
    const analyser = sound.context.createAnalyser(); analyser.fftSize = 2048; sound.gain.connect(analyser);
    let energy = 0;
    const values = new Float32Array(analyser.fftSize);
    for (let i = 0; i < 20 && energy < .00001; i++) {
      sound.play('gun'); await new Promise(resolve => setTimeout(resolve, 20));
      analyser.getFloatTimeDomainData(values); energy = Math.max(energy, values.reduce((sum, n) => sum + n * n, 0));
    }
    for (let i = 0; i < 1000; i++) sound.play('clash');
    const voices = sound.voices.size, clone = sound.recordingTrack(); clone.stop();
    const live = sound.destination.stream.getAudioTracks()[0].readyState;
    sound.configure(false); const muted = !sound.play('gun') && sound.voices.size === 0;
    await sound.context.close();
    return { energy, voices, live, muted, banks };
  });
  assert(audioChecks.energy > .00001, `Non-silent Web Audio output: ${JSON.stringify(audioChecks)}`);
  assert.equal(audioChecks.banks.length, 5);
  assert(audioChecks.banks.every(b => b.count === ({clash:6, bow:1, gun:3, hit:3, stomp:3}[b.kind]) && b.valid), `Recorded weapon banks decode with bounded peaks and faded edges: ${JSON.stringify(audioChecks.banks)}`);
  assert(audioChecks.voices <= 8); assert.equal(audioChecks.live, 'live'); assert(audioChecks.muted);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobile = await page.locator('.battle-audio-controls').evaluate(el => ({ right: el.getBoundingClientRect().right, scroll: document.documentElement.scrollWidth, width: innerWidth }));
  assert(mobile.right <= mobile.width + 1); assert(mobile.scroll <= mobile.width + 1);
  await page.route('**/audio/battle/*', route => route.abort());
  const fallback = await page.evaluate(async () => {
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const sound = new BattleAudio(); sound.configure(true, .55);
    const ready = await sound.unlock(), emptyBanks = [...sound.clipBanks.values()].every(bank => bank.length === 0);
    const plays = sound.play('clash'); sound.stop(); await sound.context.close();
    return { ready, emptyBanks, plays };
  });
  assert.deepEqual(fallback, { ready: true, emptyBanks: true, plays: true }, 'Missing/corrupt clips retain a working local fallback');
  await page.route('**/__feedback-render', route => route.fulfill({ contentType: 'text/html', body: '<canvas></canvas>' }));
  await page.goto('http://127.0.0.1:5173/__feedback-render');
  const visuals = await page.evaluate(async () => {
    const { Battle } = await import('/src/crown-battle.js');
    const { BattleRenderer } = await import('/src/crown-battle-renderer.js');
    const { BattleFeedback } = await import('/src/crown-battle-feedback.js');
    const b = new Battle({ historicalArmies: [{ samurai: 1 }, { roman: 1 }] }), f = new BattleFeedback(b);
    const canvas = document.querySelector('canvas'), renderer = new BattleRenderer(canvas, b);
    const results = [];
    for (const desktop of [true, false]) {
      renderer.resize(600, 600, desktop, 1); renderer.fitMap();
      for (const kind of ['sparks', 'slash', 'thrust', 'release', 'muzzle', 'dust', 'smoke', 'body-hit', 'armor-hit', 'impact']) {
        f.effects = []; renderer.render(); const plain = canvas.toDataURL();
        f.effects = [{ kind, x: 300, y: 480, born: -.08, life: .3, angle: .4 }];
        renderer.render(); const effect = canvas.toDataURL(); renderer.render();
        results.push({ kind, desktop, visible: plain !== effect, paused: effect === canvas.toDataURL() });
      }
    }
    return results;
  });
  // Release intentionally has no extra streak: the projectile draws the arrow.
  assert.equal(visuals.length, 20); assert(visuals.every(x => x.visible === (x.kind !== 'release') && x.paused), JSON.stringify(visuals));
  assert.deepEqual(errors, []);
  console.log('PASS audio browser: 16 recorded clips, failed-load fallback, gesture unlock, audible graph, mute/persistence, voice cap, audio+video recording, clone cleanup, PC/mobile fit; 20 effect visibility/pause checks');
} finally { await browser.close(); }
