import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(15000);
  await page.routeWebSocket('**/*', socket => socket.close());
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5173/crown-battle.html');
  const labels = ['Yay', 'Ok isabeti · kumaş', 'Ok isabeti · zırh', 'Kılıç teması', 'Gövde darbesi', 'Tüfek', 'Ağır darbe', 'Yay'];
  for (const label of labels) {
    await page.locator('#battle-sound-test').click();
    await page.waitForFunction(expected => document.querySelector('#battle-sound-status').textContent === `${expected} çalındı.`, label);
    assert(await page.locator('#battle-sound-test').isEnabled());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Preview feedback fits the desktop dock');
  }
  const checks = await page.evaluate(async () => {
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const { BATTLE_SOUND, battleSoundSamples, prepareBattleSamples } = await import('/src/crown-battle-sound-design.js');
    const sound = new BattleAudio(); await sound.unlock();
    if (sound.clipBanks.get('bow')[0].duration > .161) throw new Error('Bow release retains its long tail');
    const results = [];
    for (const kind of Object.keys(BATTLE_SOUND)) {
      const bank = sound.clipBanks.get(kind)?.length ? sound.clipBanks.get(kind)
        : [0, 1, 2].map(i => sound.buffers.get(`${kind}:${i}`));
      for (const [variant, buffer] of bank.entries()) {
        const data = buffer.getChannelData(0), n = Math.round(buffer.sampleRate * .08);
        let peak = 0, energy = 0, tail = 0;
        for (let i = 0; i < data.length; i++) {
          peak = Math.max(peak, Math.abs(data[i]));
          if (i < n) energy += data[i] ** 2;
          if (i > data.length - buffer.sampleRate * .01) tail += data[i] ** 2;
        }
        results.push({ kind, variant, peak, rms: Math.sqrt(energy / n), tail: tail / (buffer.sampleRate * .01) });
      }
    }
    // Three simultaneous strongest voices at full user volume, before limiter.
    const offline = new OfflineAudioContext(1, 24000, 24000);
    for (const kind of ['gun', 'clash', 'stomp']) {
      const source = offline.createBufferSource();
      source.buffer = sound.clipBanks.get(kind)?.[0] || sound.buffers.get(`${kind}:0`);
      const level = offline.createGain(); level.gain.value = BATTLE_SOUND[kind].gain;
      source.connect(level); level.connect(offline.destination); source.start(0);
    }
    const mixed = (await offline.startRendering()).getChannelData(0);
    let mixPeak = 0; for (const value of mixed) mixPeak = Math.max(mixPeak, Math.abs(value));
    const warmCache = sound.buffers.size;
    const workerUsed = !sound.workerFailed && !sound.soundWorker;
    const input = sound.context.createBuffer(2, 4000, sound.context.sampleRate);
    for (let c=0;c<2;c++) for(let i=0;i<4000;i++) input.getChannelData(c)[i]=Math.sin(i*.11+c)*Math.exp(-i/600);
    const expected = prepareBattleSamples([input.getChannelData(0),input.getChannelData(1)],sound.context.sampleRate,'hit',1);
    const prepared = (await sound.prepareBuffer('hit',1,input)).getChannelData(0);
    const workerIdentical = prepared.length === expected.length && prepared.every((v,i)=>v===expected[i]);
    sound.soundWorker?.terminate(); sound.soundWorker=null; sound.workerFailed=true;
    const fallback = (await sound.prepareBuffer('gun',2)).getChannelData(0);
    const reference = battleSoundSamples('gun',sound.context.sampleRate,2);
    const fallbackIdentical = fallback.length === reference.length && fallback.every((v,i)=>v===reference[i]);
    sound.stop(); await sound.context.close();
    return { results, mixPeak, warmCache, workerUsed, workerIdentical, fallbackIdentical };
  });
  assert.equal(checks.results.length, 16);
  assert.equal(checks.warmCache, 0, 'All weapon banks use local recordings');
  assert(checks.workerUsed && checks.workerIdentical && checks.fallbackIdentical, 'Worker and no-worker path preserve exact sound samples');
  for (const r of checks.results) {
    assert(Number.isFinite(r.peak) && r.peak <= .621 && r.peak > .05, `${r.kind}: healthy bounded signal`);
    assert(r.rms > .04 && r.rms < .125, `${r.kind}/${r.variant}: consistent impact loudness (${r.rms})`);
    assert(r.tail < .0001, `${r.kind}/${r.variant}: no cut-off pop (${r.tail})`);
  }
  assert(checks.mixPeak < .8, 'Full-volume concurrent mix has headroom even without limiter');
  assert.deepEqual(errors, []);
  console.log(`PASS sound design: 16 recorded variants, loudness/tails/headroom (mix peak ${checks.mixPeak.toFixed(3)}), seven UI previews and wraparound`);
} finally { await browser.close(); }
