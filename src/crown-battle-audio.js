// Local CC0 weapon recordings; see public/audio/battle/SOURCES.txt.
// Neither selection nor synthesis consumes the battle engine's random sequence.
export const BATTLE_CLIPS = Object.freeze({
  clash: [1, 2, 3, 4, 5, 6].map(n => `sword-clash-0${n}.ogg`),
  bow: ['bow-release.wav'],
  gun: [1, 2, 3].map(n => `black-powder-0${n}.wav`),
  hit: ['000', '001', '002'].map(n => `impactPunch_medium_${n}.ogg`),
  stomp: ['000', '001', '002'].map(n => `impactWood_heavy_${n}.ogg`),
});
export const MOVEMENT_CLIPS = Object.freeze({
  foot: ['00', '01', '02'].map(n => `footstep${n}.ogg`),
  hoof: ['horse-grass.mp3', 'horse-ground.mp3'],
});
export const CONTACT_CLIPS = Object.freeze({
  armor: ['000', '001', '002'].map(n => `impactMetal_light_${n}.ogg`),
  soft: ['000', '001', '002'].map(n => `impactSoft_medium_${n}.ogg`),
  arrowSoft: ['000', '001', '002'].map(n => `impactSoft_heavy_${n}.ogg`),
});
import { BATTLE_SOUND as SOUND, battleSoundSamples, prepareBattleSamples } from './crown-battle-sound-design.js';
export { battleSoundSamples } from './crown-battle-sound-design.js';

export class BattleAudio {
  constructor() {
    this.enabled = true; this.volume = .55; this.voices = new Set(); this.buffers = new Map(); this.lastKind = new Map();
    this.sequence = 0; this.tokens = 3; this.refillAt = 0; this.clipBanks = new Map(); this.lastVariant = new Map(); this.nextKind = new Map();
    this.shotTokens = 2; this.impactTokens = 3;
    this.contactPressure = 0; this.contactAt = -Infinity; this.crowdUpdateAt = -Infinity;
    this.movementBanks = new Map(); this.movementVoices = new Map(); this.nextMovement = new Map();
    this.contactBanks = new Map();
    try { const saved = JSON.parse(localStorage.getItem('marble-battle-audio') || 'null'); if (saved) { this.enabled = saved.enabled !== false; this.volume = Math.max(0, Math.min(1, Number(saved.volume) || 0)); } } catch {}
  }
  async unlock() {
    try {
      if (!this.context) {
        const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!Audio) return false;
        this.context = new Audio();
        this.gain = this.context.createGain(); this.gain.gain.value = this.enabled ? this.volume : 0;
        // One shared distance filter, rather than a new filter for each hit.
        this.distantBus = this.context.createBiquadFilter(); this.distantBus.type = 'lowpass';
        this.distantBus.frequency.value = 2200; this.distantBus.Q.value = .5;
        this.distantBus.connect(this.gain);
        const highpass = this.context.createBiquadFilter(); highpass.type = 'highpass'; highpass.frequency.value = 55; highpass.Q.value = .5;
        const lowpass = this.context.createBiquadFilter(); lowpass.type = 'lowpass'; lowpass.frequency.value = 7600; lowpass.Q.value = .5;
        const limiter = this.context.createDynamicsCompressor();
        limiter.threshold.value = -9; limiter.ratio.value = 6; limiter.knee.value = 6; limiter.attack.value = .002; limiter.release.value = .10;
        this.destination = this.context.createMediaStreamDestination();
        this.gain.connect(highpass); highpass.connect(lowpass); lowpass.connect(limiter);
        limiter.connect(this.context.destination); limiter.connect(this.destination);
      }
      if (this.context.state !== 'running') await this.context.resume();
      // Local assets only, fetched once per game session after a user gesture.
      this.loading ||= Promise.all([this.loadClips(), this.loadClips(MOVEMENT_CLIPS, this.movementBanks),
        this.loadClips(CONTACT_CLIPS, this.contactBanks)]).then(async () => {
        // Reuse local Foley buffers, preparing dedicated arrow contacts once.
        // No extra downloads, filters or layered voices during a volley.
        // Arrows use a padded contact source, never the ringing metal sample.
        for (const [kind, material] of [['arrowArmor', 'arrowSoft']]) {
          const bank = this.contactBanks.get(material) || [];
          this.contactBanks.set(kind, await Promise.all(bank.map((buffer, i) => this.prepareBuffer(kind, i, buffer))));
        }
        // Synthesis runs off the animation thread, including the fallback bank.
        for (const kind of Object.keys(SOUND)) if (!this.clipBanks.get(kind)?.length) {
          for (let variant = 0; variant < 3; variant++) {
            this.buffers.set(`${kind}:${variant}`, await this.prepareBuffer(kind, variant));
          }
        }
        await this.prepareCrowd();
      }).finally(() => {
        this.soundWorker?.terminate(); this.soundWorker = null;
      });
      await this.loading;
      return this.context.state === 'running';
    } catch { return false; }
  }
  async prepareBuffer(kind, variant, decoded) {
    const rate = this.context.sampleRate;
    const channels = decoded && Array.from({length:decoded.numberOfChannels}, (_, c) => decoded.getChannelData(c));
    let samples;
    try {
      if (this.workerFailed || typeof Worker === 'undefined') throw new Error('Worker unavailable');
      if (!this.soundWorker) {
        this.pendingSounds = new Map();
        this.soundWorker = new Worker(new URL('./crown-battle-audio-worker.js', import.meta.url), {type:'module'});
        this.soundWorker.onmessage = ({data}) => {
          const job = this.pendingSounds.get(data.id); if (!job) return;
          this.pendingSounds.delete(data.id); clearTimeout(job.timeout);
          if (data.error) job.reject(new Error(data.error)); else job.resolve(data.samples);
        };
        this.soundWorker.onerror = event => {
          event.preventDefault(); this.workerFailed = true; this.soundWorker?.terminate(); this.soundWorker = null;
          for (const job of this.pendingSounds.values()) { clearTimeout(job.timeout); job.reject(new Error('Audio worker failed')); }
          this.pendingSounds.clear();
        };
      }
      samples = await new Promise((resolve, reject) => {
        const id = this.soundJob = (this.soundJob || 0) + 1;
        const timeout = setTimeout(() => { this.pendingSounds.delete(id); reject(new Error('Audio worker timeout')); }, 10000);
        this.pendingSounds.set(id, {resolve, reject, timeout});
        this.soundWorker.postMessage({id, kind, rate, variant, channels});
      });
    } catch {
      // Older browsers still work; yield between sounds instead of building
      // the whole bank in the start button's task.
      await new Promise(resolve => setTimeout(resolve, 0));
      samples = channels ? prepareBattleSamples(channels, rate, kind, variant) : battleSoundSamples(kind, rate, variant);
    }
    const buffer = this.context.createBuffer(1, samples.length, rate);
    buffer.copyToChannel(samples, 0); return buffer;
  }
  async loadClips(clips = BATTLE_CLIPS, banks = this.clipBanks) {
    await Promise.all(Object.entries(clips).map(async ([kind, files]) => {
      const results = await Promise.all(files.map(async (file, variant) => {
        const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 2000);
        try {
          const response = await fetch(`${import.meta.env?.BASE_URL || '/'}audio/battle/${file}`, { signal: controller.signal });
          if (!response.ok) return null;
          const decoded = await this.context.decodeAudioData(await response.arrayBuffer());
          return await this.prepareBuffer(kind, variant, decoded);
        } catch { return null; } finally { clearTimeout(timeout); }
      }));
      banks.set(kind, results.filter(Boolean));
    }));
  }
  async prepareCrowd() {
    // Render once on the audio rendering thread. Dense battles use one voice
    // for distant contacts instead of allocating a node for every soldier.
    const blades = this.clipBanks.get('clash');
    if (!blades?.length || typeof OfflineAudioContext === 'undefined') return;
    try {
      const rate = 24000, duration = 6.7;
      const offline = new OfflineAudioContext(2, Math.round(rate * duration), rate);
      let seed = 8417, t = 0;
      const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
      while (t < duration) {
        const bank = random() < .25 ? this.clipBanks.get('hit') || blades : blades;
        const buffer = bank[Math.floor(random() * bank.length)] || blades[0];
        const pitch = .87 + random() * .23, gain = .26 + random() * .20, pan = random() * 1.6 - .8;
        // Wrap decays across the loop boundary so there is no periodic gap.
        for (const time of [t, t - duration]) {
          const offset = time < 0 ? -time * pitch : 0;
          if (offset >= buffer.duration) continue;
          const source = offline.createBufferSource(), level = offline.createGain(), stereo = offline.createStereoPanner();
          source.buffer = buffer; source.playbackRate.value = pitch; level.gain.value = gain; stereo.pan.value = pan;
          source.connect(level); level.connect(stereo); stereo.connect(offline.destination);
          source.start(Math.max(0, time), offset);
        }
        t += .075 + random() * .16;
      }
      this.crowdBuffer = await offline.startRendering();
    } catch { this.crowdBuffer = null; }
  }
  crowdContact(perspective, pan) {
    if (!this.crowdBuffer) return;
    const ctx = this.context, now = ctx.currentTime;
    const distance = Number.isFinite(perspective.gain) ? Math.max(0, Math.min(1, perspective.gain)) : 1;
    this.contactPressure = Math.min(48, this.contactPressure * Math.exp(-Math.max(0, now - this.contactAt) / .35) + distance);
    this.contactAt = now;
    if (this.contactPressure < 6 || now - this.crowdUpdateAt < .06) return;
    if (!this.crowdVoice) {
      if (this.voices.size >= 8) return;
      const source = ctx.createBufferSource(), level = ctx.createGain(), stereo = ctx.createStereoPanner();
      source.buffer = this.crowdBuffer; source.loop = true; level.gain.value = 0;
      source.connect(level); level.connect(stereo); stereo.connect(this.gain);
      const voice = {source, level, stereo}; this.crowdVoice = voice;
      source.onended = () => {
        this.voices.delete(source); source.disconnect(); level.disconnect(); stereo.disconnect();
        if (this.crowdVoice === voice) this.crowdVoice = null;
      };
      this.voices.add(source); source.start(0, (now * .731) % this.crowdBuffer.duration);
    }
    const {source, level, stereo} = this.crowdVoice;
    const volume = Math.min(.65, .14 + (this.contactPressure - 6) * .022);
    // No timer or queued hits: contact stops renewing this short envelope as
    // soon as the front separates. Pause/mute stops the source immediately.
    level.gain.cancelAndHoldAtTime(now);
    level.gain.linearRampToValueAtTime(volume, now + .08);
    level.gain.setValueAtTime(volume, now + .16);
    level.gain.linearRampToValueAtTime(0, now + .65);
    stereo.pan.setTargetAtTime(Math.max(-.5, Math.min(.5, Number(pan) || 0)), now, .15);
    source.stop(now + .68); this.crowdUpdateAt = now;
  }
  configure(enabled, volume = this.volume) {
    this.enabled = enabled; this.volume = Math.max(0, Math.min(1, Number(volume) || 0));
    if (this.gain) this.gain.gain.setTargetAtTime(enabled ? this.volume : 0, this.context.currentTime, .015);
    if (!enabled || !this.volume) this.stop();
    try { localStorage.setItem('marble-battle-audio', JSON.stringify({ enabled, volume: this.volume })); } catch {}
  }
  stop() {
    for (const source of this.voices) { try { source.stop(); } catch {} }
    this.voices.clear(); this.lastKind.clear(); this.nextKind.clear();
    this.crowdVoice = null; this.contactPressure = 0; this.contactAt = -Infinity; this.crowdUpdateAt = -Infinity;
    this.movementVoices.clear(); this.nextMovement.clear();
    this.tokens = 3; this.shotTokens = 2; this.impactTokens = 3; this.refillAt = this.context?.currentTime || 0;
  }
  move(kind, pan = 0, perspective = {}) {
    const ctx = this.context, bank = this.movementBanks.get(kind);
    if (!bank?.length || !this.enabled || !this.volume || ctx?.state !== 'running') return false;
    const now = ctx.currentTime;
    // At most two movement voices; leave room for foreground weapon contacts.
    if (this.voices.size >= 6 || this.movementVoices.has(kind) || now < (this.nextMovement.get(kind) ?? 0)) return false;
    const distanceGain = Math.max(0, Math.min(1, Number(perspective.gain) || 0));
    if (distanceGain < .08) return false;
    this.sequence = (Math.imul(this.sequence + 1, 1664525) + 1013904223) >>> 0;
    let variant = this.sequence % bank.length;
    if (variant === this.lastVariant.get(kind)) variant = (variant + 1) % bank.length;
    this.lastVariant.set(kind, variant);
    const pace = Math.max(.8, Math.min(1.3, Number(perspective.pace) || 1));
    const source = ctx.createBufferSource(), level = ctx.createGain(), stereo = ctx.createStereoPanner();
    source.buffer = bank[variant]; source.playbackRate.value = pace;
    level.gain.value = (kind === 'hoof' ? .29 : .18) * distanceGain / Math.sqrt(1 + this.voices.size * .4);
    stereo.pan.value = Math.max(-.7, Math.min(.7, Number(pan) || 0));
    source.connect(level); level.connect(stereo); stereo.connect(distanceGain < .6 && this.distantBus || this.gain);
    source.onended = () => {
      this.voices.delete(source); source.disconnect(); level.disconnect(); stereo.disconnect();
      if (this.movementVoices.get(kind) === source) this.movementVoices.delete(kind);
    };
    this.voices.add(source); this.movementVoices.set(kind, source);
    this.nextMovement.set(kind, now + Math.max(source.buffer.duration, kind === 'hoof' ? .31 : .38) / pace);
    source.start(); return true;
  }
  play(kind, pan = 0, perspective = {}) {
    const ctx = this.context, settings = SOUND[kind];
    if (!settings || !this.enabled || !this.volume || ctx?.state !== 'running') return false;
    const now = ctx.currentTime;
    if (kind === 'clash') this.crowdContact(perspective, pan);
    const elapsed = Math.max(0, now - this.refillAt); this.refillAt = now;
    this.tokens = Math.min(3, this.tokens + elapsed * 12);
    this.shotTokens = Math.min(2, this.shotTokens + elapsed * 4);
    this.impactTokens = Math.min(3, this.impactTokens + elapsed * 9);
    const group = kind === 'gun' || kind === 'bow' ? 'shotTokens' : 'impactTokens';
    // Volleys cannot spend the entire contact budget. Drop excess immediately;
    // never queue sounds that would continue after the battle has stopped.
    if (this.voices.size >= 8 || this.tokens < 1 || this[group] < 1 || now < (this.nextKind.get(kind) ?? 0)) return false;
    // Contact variants share the hit budget; changing material cannot bypass
    // rate limits or add another source for the same impact.
    const arrow = perspective.projectileKind === 'arrow' || perspective.projectileKind === 'bolt';
    const contact = arrow ? (perspective.contact === 'armor' ? 'arrowArmor' : 'arrowSoft') : perspective.contact;
    const contactBank = kind === 'hit' && this.contactBanks.get(contact);
    // Do not reintroduce the old punch/click if an arrow asset is missing.
    if (kind === 'hit' && arrow && !contactBank?.length) return false;
    const specialized = contactBank?.length > 0;
    const bank = specialized ? contactBank : this.clipBanks.get(kind), count = bank?.length || 3;
    const variantKey = specialized ? `contact:${contact}` : kind;
    this.sequence = (Math.imul(this.sequence + 1, 1664525) + 1013904223) >>> 0;
    let variant = this.sequence % count;
    if (variant === this.lastVariant.get(variantKey)) variant = (variant + 1) % count;
    this.lastVariant.set(variantKey, variant);
    const key = `${kind}:${variant}`;
    const buffer = bank?.[variant] || this.buffers.get(key);
    if (!buffer) return false;
    const source = ctx.createBufferSource(); source.buffer = buffer;
    const variation = (this.sequence >>> 8) % 101 / 100;
    const weight = Math.max(.6, Math.min(1.6, Number(perspective.weight) || 1));
    const distanceGain = Number.isFinite(perspective.gain) ? Math.max(0, Math.min(1, perspective.gain)) : 1;
    source.playbackRate.value = (.95 + variation * .10) * (arrow ? 1 : Math.max(.86, Math.min(1.12, 1 / Math.sqrt(weight))));
    const contactGain = specialized ? (arrow ? .68 : perspective.contact === 'armor' ? .75 : .9) : 1;
    const level = ctx.createGain(); level.gain.value = settings.gain * contactGain * distanceGain * (.88 + variation * .20) / Math.sqrt(1 + this.voices.size * .4);
    const stereo = ctx.createStereoPanner(); stereo.pan.value = Math.max(-.7, Math.min(.7, Number(pan) || 0));
    source.connect(level); level.connect(stereo); stereo.connect(distanceGain < .6 && this.distantBus || this.gain);
    source.onended = () => { this.voices.delete(source); source.disconnect(); level.disconnect(); stereo.disconnect(); };
    this.voices.add(source); this.tokens--; this[group]--; this.lastKind.set(kind, now);
    this.nextKind.set(kind, now + settings.interval * (.82 + variation * .45));
    source.start(); return true;
  }
  recordingTrack() { return this.destination?.stream.getAudioTracks()[0]?.clone() || null; }
}
