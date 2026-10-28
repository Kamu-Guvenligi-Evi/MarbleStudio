import assert from 'node:assert/strict';
import { BattleAudio, battleSoundSamples } from '../src/crown-battle-audio.js';

// A controlled audio clock makes the 10,000-event burst reproducible.
const sound = new BattleAudio(), played = [], levels = [], pans = [];
const node = () => ({ connect() {}, disconnect() {} });
sound.gain = node();
sound.context = {
  state: 'running', currentTime: 0, sampleRate: 24000,
  createBuffer: (channels, length, rate) => ({ duration: length / rate, copyToChannel() {} }),
  createGain: () => { const n = { ...node(), gain: { value: 1 } }; levels.push(n); return n; },
  createStereoPanner: () => { const n = { ...node(), pan: { value: 0 } }; pans.push(n); return n; },
  createBufferSource() {
    return { ...node(), playbackRate: { value: 1 },
      start() { this.started = sound.context.currentTime; played.push(this); }, stop() { this.onended?.(); } };
  },
};
const advance = time => {
  sound.context.currentTime = time;
  for (const voice of sound.voices) if (voice.started + voice.buffer.duration / voice.playbackRate.value <= time) voice.onended();
};
const kinds = ['clash', 'hit', 'bow', 'gun', 'stomp'];
// Production prepares buffers during unlock, never during a contact event.
for (const kind of kinds) for (let variant = 0; variant < 3; variant++) {
  sound.buffers.set(`${kind}:${variant}`, await sound.prepareBuffer(kind, variant));
}
for (let i = 0; i < 2000; i++) {
  advance(i / 2000);
  for (const kind of kinds) sound.play(kind);
  assert(sound.voices.size <= 8);
}
assert(played.length <= 15 && played.length >= 10, `Bounded one-second mix: ${played.length}`);
assert(sound.buffers.size <= 15, 'Bounded cached variations');
const before = played.length; advance(10); assert.equal(played.length, before, 'No delayed queue after an event flood');
assert.equal(sound.voices.size, 0);
const variants = [];
for (let i = 0; i < 12; i++) { advance(11 + i); assert(sound.play('clash')); variants.push(played.at(-1).buffer); }
assert(variants.every((buffer, i) => i === 0 || buffer !== variants[i - 1]), 'No immediate sample repetition');
assert(new Set(variants).size >= 2);
// Continuous ranged fire leaves room for impacts, even when shots arrive first.
advance(30); sound.stop();
let shots = 0, contacts = 0;
const contactTimes = [];
for (let i = 0; i < 2000; i++) {
  advance(30 + i / 2000);
  shots += Number(sound.play('gun')) + Number(sound.play('bow'));
  if (sound.play('clash')) { contacts++; contactTimes.push(sound.context.currentTime); }
}
assert(shots <= 6 && shots >= 3, `Bounded volley: ${shots}`);
assert(contacts >= 4, `Impacts audible during volleys: ${contacts}`);
const gaps = contactTimes.slice(1).map((t, i) => Math.round((t - contactTimes[i]) * 1000));
assert(new Set(gaps).size > 1, 'Dense contact is not a mechanical fixed-interval loop');
sound.stop(); assert.equal(sound.voices.size, 0);
advance(40); assert(sound.play('hit', -.6, { gain: 1, weight: 1 })); const nearLevel = levels.at(-1).gain.value;
sound.stop(); advance(41); assert(sound.play('hit', .6, { gain: .2, weight: 1.5 }));
assert(levels.at(-1).gain.value < nearLevel * .3, 'Distant contacts are quieter');
assert.equal(pans.at(-1).pan.value, .6, 'Contact uses camera-relative stereo');
assert(played.at(-1).playbackRate.value < .95, 'Heavy contact has a lower pitch');
sound.stop();
sound.enabled = false; assert.equal(sound.play('gun'), false);
sound.enabled = true; sound.volume = 0; assert.equal(sound.play('gun'), false);
assert.equal(sound.play('unknown'), false);
for (const rate of [24000, 44100, 48000]) for (const kind of kinds) {
  const a = battleSoundSamples(kind, rate, 0), b = battleSoundSamples(kind, rate, 1);
  assert.notDeepEqual(a, b, `${kind} has distinct fallback takes`);
  assert(a.every(n => Number.isFinite(n) && Math.abs(n) <= .651));
  assert.equal(Math.abs(a[0]), 0); assert.equal(Math.abs(a.at(-1)), 0);
  const tail = a.slice(-Math.round(rate * .01));
  assert(tail.reduce((s, n) => s + n * n, 0) / tail.length < .0001, `${kind} ends quietly`);
}
console.log(`PASS audio mix: 10,000 events -> ${before} voices/second, bounded caches, no queue/repeated take, mute/stop, 3 sample rates`);
