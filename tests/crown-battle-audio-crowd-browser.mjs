import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();
  await page.routeWebSocket('**/*',socket=>socket.close());
  await page.goto('http://127.0.0.1:5173/crown-battle.html');
  const result=await page.evaluate(async()=>{
    const {BattleAudio}=await import('/src/crown-battle-audio.js');
    const audio=new BattleAudio();audio.configure(true,1);await audio.unlock();
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const valid=audio.crowdBuffer?.numberOfChannels===2;
    let peak=0,energy=0;
    for(let c=0;c<2;c++) for(const x of audio.crowdBuffer.getChannelData(c)) {peak=Math.max(peak,Math.abs(x));energy+=x*x;}
    const idle=audio.voices.size===0;
    for(let i=0;i<100;i++) audio.play('bow');
    const rangedQuiet=!audio.crowdVoice;
    audio.stop();audio.play('clash');const singleQuiet=!audio.crowdVoice;
    audio.stop();
    for(let i=0;i<1000;i++) audio.play('clash',.5,{gain:0});
    const distantQuiet=!audio.crowdVoice;audio.stop();
    const analyser=audio.context.createAnalyser();analyser.fftSize=2048;audio.gain.connect(analyser);
    const data=new Float32Array(2048);
    let maxVoices=0,audible=0;
    for(let i=0;i<16;i++) {
      for(let n=0;n<40;n++) audio.play('clash',-.4,{gain:.8});
      maxVoices=Math.max(maxVoices,audio.voices.size);
      await wait(80);analyser.getFloatTimeDomainData(data);
      audible=Math.max(audible,data.reduce((s,x)=>s+x*x,0));
    }
    const active=!!audio.crowdVoice;
    // Foreground blade tails may last 1.4 s; crowd must end sooner than that.
    await wait(850);const contactEnded=!audio.crowdVoice;
    await wait(850);const silent=audio.voices.size===0;
    for(let n=0;n<20;n++)audio.play('clash');
    const restarted=!!audio.crowdVoice;audio.stop();
    const paused=audio.voices.size===0&&!audio.crowdVoice;
    for(let n=0;n<20;n++)audio.play('clash');
    audio.configure(false);const muted=audio.voices.size===0&&!audio.crowdVoice&&!audio.play('clash');
    audio.configure(true);audio.play('clash');const reset=!audio.crowdVoice;
    audio.stop();await audio.context.close();
    return {valid,peak,energy,idle,rangedQuiet,singleQuiet,distantQuiet,maxVoices,audible,active,contactEnded,silent,restarted,paused,muted,reset};
  });
  for(const key of ['valid','idle','rangedQuiet','singleQuiet','distantQuiet','active','contactEnded','silent','restarted','paused','muted','reset']) assert(result[key],`${key}: ${JSON.stringify(result)}`);
  assert(result.peak<.8&&result.energy>1,'Precomputed stereo mix has headroom');
  assert(result.maxVoices<=8);assert(result.audible>.001);
  console.log(`PASS crowd audio: recorded stereo bed, contact-only activation/fade, pause/mute/reset, ranged/distant/idle silence, max ${result.maxVoices} voices, peak ${result.peak.toFixed(3)}`);
} finally {await browser.close();}
