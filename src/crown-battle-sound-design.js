// Prepared once at audio unlock. No oscillators, filters or convolution per hit.
export const BATTLE_SOUND = Object.freeze({
  gun: { duration: .46, gain: .52, interval: .19 },
  bow: { duration: .16, gain: .23, interval: .13 },
  clash: { duration: .38, gain: .34, interval: .115 },
  hit: { duration: .24, gain: .40, interval: .10 },
  stomp: { duration: .40, gain: .48, interval: .24 },
});

const decay = (t, seconds) => Math.exp(-t / seconds);
const coefficient = (hz, rate) => 1 - Math.exp(-2 * Math.PI * hz / rate);

function finish(samples, rate, targetRms = .12, attack = .0008) {
  let mean = 0;
  for (const value of samples) mean += value;
  mean /= samples.length;
  let peak = 0, energy = 0;
  const window = Math.min(samples.length, Math.round(rate * .08));
  for (let i = 0; i < samples.length; i++) {
    const edge = Math.min(1, i / (rate * attack)) * Math.min(1, (samples.length - 1 - i) / (rate * .018));
    samples[i] = (samples[i] - mean) * edge;
    peak = Math.max(peak, Math.abs(samples[i]));
    if (i < window) energy += samples[i] ** 2;
  }
  // Equal perceived impact energy, with headroom; never amplify a tiny tail.
  const gain = Math.min(3, .62 / (peak || 1), targetRms / (Math.sqrt(energy / window) || 1));
  for (let i = 0; i < samples.length; i++) samples[i] *= gain;
  samples[0] = 0; samples[samples.length - 1] = 0;
  return samples;
}

export function battleSoundSamples(kind, rate = 44100, variant = 0) {
  const settings = BATTLE_SOUND[kind] || BATTLE_SOUND.hit;
  const samples = new Float32Array(Math.ceil(rate * settings.duration));
  let seed = (731 + variant * 7919) >>> 0, bass = 0, body = 0, air = 0;
  const bassA = coefficient(160, rate), bodyA = coefficient(1200, rate), airA = coefficient(5200, rate);
  const pitch = .94 + (variant % 5) * .031;
  for (let i = 0; i < samples.length; i++) {
    const t = i / rate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    bass += bassA * (noise - bass); body += bodyA * (noise - body); air += airA * (noise - air);
    const pulse = (hz, length) => Math.sin(2 * Math.PI * hz * pitch * t) * decay(t, length);
    if (kind === 'gun') {
      // Powder crack, low pressure pulse, short irregular outdoor tail.
      samples[i] = (air - body) * decay(t, .004) * .8 + body * decay(t, .025) * 1.2
        + bass * decay(t, .065) * 2.2 + pulse(73, .023) * .18
        + body * decay(t, .105) * (.12 + .10 * Math.sin(t * 137) ** 2);
    } else if (kind === 'bow') {
      // Damped string release followed by air; no long electronic chirp.
      samples[i] = pulse(205, .009) * .16 + pulse(417, .006) * .045
        + body * decay(t, .008) * .3
        + (air - body) * decay(t, .007) * .35
        + (air - body) * (1 - decay(t, .012)) * decay(t, .027) * .25;
    } else if (kind === 'clash') {
      // Inharmonic steel modes damp quickly instead of ringing like a bell.
      samples[i] = (air - body) * decay(t, .006) * .42 + body * decay(t, .019) * .65
        + pulse(1577, .046) * .06 + pulse(2311, .032) * .04
        + pulse(3463, .019) * .025 + bass * decay(t, .028) * .7;
    } else if (kind === 'stomp') {
      samples[i] = bass * decay(t, .065) * 2.2 + body * decay(t, .014) * .5
        + pulse(58, .036) * .28 + (t > .025 ? body * decay(t - .025, .032) * .15 : 0);
    } else {
      samples[i] = body * decay(t, .012) * .75 + bass * decay(t, .034) * 1.6;
    }
  }
  return finish(samples, rate, kind === 'bow' ? .09 : .12);
}

export function prepareBattleClip(ctx, decoded, kind, variant) {
  const channels = Array.from({length:decoded.numberOfChannels}, (_, c) => decoded.getChannelData(c));
  const samples = prepareBattleSamples(channels, ctx.sampleRate, kind, variant);
  const result = ctx.createBuffer(1, samples.length, ctx.sampleRate);
  result.copyToChannel(samples, 0); return result;
}

export function prepareBattleSamples(channels, rate, kind, variant) {
  const length = channels[0].length, mono = new Float32Array(length);
  for (const data of channels) {
    for (let i = 0; i < length; i++) mono[i] += data[i] / channels.length;
  }
  let mean = 0, peak = 0;
  for (const n of mono) { mean += n; peak = Math.max(peak, Math.abs(n)); }
  if (peak < .0001) throw new Error('Empty battle sound');
  mean /= length;
  let start = 0;
  while (start < length - 1 && Math.abs(mono[start] - mean) < peak * .025) start++;
  start = Math.max(0, start - Math.round(rate * .001));
  // Arrow contacts have their own dry envelopes. Keep the full recorded
  // rattle/decay for other weapons; prepare everything before combat starts.
  const dry = {
    bow: { duration:.16, low:4100, high:180, hold:.018, decay:.035, rms:.075 },
    arrowArmor: { duration:.18, low:2600, high:100, hold:.020, decay:.045, rms:.075, attack:.004 },
    arrowSoft: { duration:.20, low:1900, high:65, hold:.025, decay:.050, rms:.080, attack:.005 },
  }[kind];
  const maxDuration = dry?.duration || {clash:1.2, gun:.7, hit:.5, stomp:.6, foot:.32, hoof:.6, armor:.22, soft:.25}[kind] || .6;
  const output = new Float32Array(Math.min(length - start, Math.ceil(rate * maxDuration)));
  const a = coefficient(dry?.low || (kind === 'stomp' ? 1900 : 8500), rate), dcA = coefficient(dry?.high || 30, rate);
  let low = 0, dc = 0;
  for (let i = 0; i < output.length; i++) {
    const raw = mono[i + start] - mean;
    low += a * (raw - low);
    dc += dcA * (low - dc);
    output[i] = (low - dc) * (dry ? Math.exp(-Math.max(0, i / rate - dry.hold) / dry.decay) : 1);
  }
  finish(output, rate, dry?.rms || .12, dry?.attack || .0008);
  return output;
}
