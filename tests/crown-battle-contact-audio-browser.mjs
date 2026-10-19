import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route('**/__contact-audio', r => r.fulfill({ contentType: 'text/html', body: '<button>Audio</button>' }));
  await page.goto('http://127.0.0.1:5173/__contact-audio');
  await page.click('button');
  const result = await page.evaluate(async () => {
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const a = new BattleAudio(); a.configure(true, .55); const ready = await a.unlock();
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const caps = { armor:.22, soft:.25, arrowArmor:.18, arrowSoft:.20 };
    const banks = [...a.contactBanks].map(([kind, buffers]) => ({ kind, count: buffers.length,
      valid: buffers.every(b => b.duration <= caps[kind] + 1 / b.sampleRate &&
        b.getChannelData(0).every(v => Number.isFinite(v) && Math.abs(v) <= .7) &&
        b.getChannelData(0)[0] === 0 && b.getChannelData(0).at(-1) === 0) }));
    const analyser = a.context.createAnalyser(); analyser.fftSize = 2048; a.gain.connect(analyser);
    const data = new Float32Array(analyser.fftSize), contacts = [];
    for (const [contact, projectileKind, bankKey] of [
      ['armor', undefined, 'armor'], ['soft', undefined, 'soft'],
      ['armor', 'arrow', 'arrowArmor'], ['soft', 'arrow', 'arrowSoft'],
      ['armor', 'bolt', 'arrowArmor'], ['soft', 'bolt', 'arrowSoft'],
      ['armor', 'bullet', 'armor'],
    ]) {
      const variants = []; let energy = 0, correct = true;
      for (let i = 0; i < 4; i++) {
        a.stop(); a.play('hit', 0, { contact, projectileKind, gain: 1, weight: .65 });
        const voice = [...a.voices][0];
        correct &&= a.contactBanks.get(bankKey).includes(voice?.buffer);
        variants.push(a.contactBanks.get(bankKey).indexOf(voice?.buffer));
        for (let j = 0; j < 3; j++) {
          await wait(15); analyser.getFloatTimeDomainData(data);
          energy = Math.max(energy, data.reduce((sum, x) => sum + x * x, 0));
        }
      }
      contacts.push({ contact, projectileKind, variants, correct, energy });
    }
    a.stop(); let accepted = 0, maxVoices = 0;
    for (let i = 0; i < 1000; i++) {
      accepted += Number(a.play('hit', 0, { contact: i % 2 ? 'armor' : 'soft', projectileKind:i % 3 ? 'arrow' : 'bullet' }));
      maxVoices = Math.max(maxVoices, a.voices.size);
    }
    const noCrowd = !a.crowdVoice;
    await wait(450); const ended = a.voices.size === 0;
    a.stop(); a.play('hit', 0, { contact: 'armor' }); a.configure(false);
    const muted = a.voices.size === 0 && !a.play('hit', 0, { contact: 'soft' });
    await a.context.close(); return { ready, banks, contacts, accepted, maxVoices, noCrowd, ended, muted };
  });
  assert(result.ready); assert.equal(result.banks.length, 4);
  assert(result.banks.every(b => b.count === 3 && b.valid));
  for (const c of result.contacts) {
    assert(c.correct && c.energy > .001, `${c.contact} uses its audible recorded bank`);
    assert(c.variants.every((v, i) => i === 0 || v !== c.variants[i - 1]));
  }
  assert.equal(result.accepted, 1, 'Material switching shares the same cooldown');
  assert(result.maxVoices <= 8 && result.noCrowd && result.ended && result.muted);
  await page.route('**/audio/battle/impactMetal_light_*.ogg', r => r.abort());
  const missing = await page.evaluate(async () => {
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const a = new BattleAudio(); a.configure(true, .55); await a.unlock();
    const plays = a.play('hit', 0, { contact: 'armor' });
    const fallback = a.clipBanks.get('hit').includes([...a.voices][0]?.buffer);
    const empty = a.contactBanks.get('armor').length === 0;
    a.stop(); await a.context.close(); return { plays, fallback, empty };
  });
  assert.deepEqual(missing, { plays: true, fallback: true, empty: true });
  // Removing the old metal asset must not remove arrow contacts. Conversely,
  // missing arrow assets must not bring back the generic punch/metal click.
  const independent = await page.evaluate(async () => {
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const a = new BattleAudio(); a.configure(true, .55); await a.unlock();
    const played = a.play('hit', 0, { contact:'armor', projectileKind:'arrow' });
    const dedicated = a.contactBanks.get('arrowArmor').includes([...a.voices][0]?.buffer);
    a.stop(); await a.context.close(); return {played, dedicated};
  });
  assert.deepEqual(independent, {played:true, dedicated:true});
  await page.route('**/audio/battle/impactSoft_heavy_*.ogg', r => r.abort());
  const noClickFallback = await page.evaluate(async () => {
    const { BattleAudio } = await import('/src/crown-battle-audio.js');
    const a = new BattleAudio(); a.configure(true, .55); await a.unlock();
    const played = a.play('hit', 0, { contact:'armor', projectileKind:'arrow' });
    const voices = a.voices.size;
    a.stop(); await a.context.close(); return {played, voices};
  });
  assert.deepEqual(noClickFallback, {played:false, voices:0});
  assert.deepEqual(errors, []);
  console.log('PASS material audio:', JSON.stringify({ ...result, missing }));
} finally { await browser.close(); }
