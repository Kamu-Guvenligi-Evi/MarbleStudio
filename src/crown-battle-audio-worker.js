import { battleSoundSamples, prepareBattleSamples } from './crown-battle-sound-design.js';

self.onmessage = ({data:{id, kind, rate, variant, channels}}) => {
  try {
    const samples = channels ? prepareBattleSamples(channels, rate, kind, variant) : battleSoundSamples(kind, rate, variant);
    self.postMessage({id, samples}, [samples.buffer]);
  } catch (error) { self.postMessage({id, error:String(error)}); }
};
