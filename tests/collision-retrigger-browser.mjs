import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto((process.env.TEST_STUDIO_ORIGIN??'http://127.0.0.1:5174')+'/factory-render.html');
  const result=await page.evaluate(async()=>{
    const {EffectVoicePlayer}=await import('/src/effect-voices.js');
    const {GameSoundPlayer,createGameSoundDirector}=await import('/src/game-sound-director.js');
    const {effectSamples}=await import('/src/impact-audio.js');
    const {VOICES}=await import('/src/sound-plan.js');
    const {directedSamples}=await import('/src/game-sound-director.js');
    const context=new OfflineAudioContext(2,48000,48000);let clock=0;
    // Schedule real Web Audio nodes at exact contact times for a sample-level check.
    const clocked=new Proxy(context,{get(target,key){if(key==='currentTime')return clock;if(key==='state')return 'running';const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
    const player=new EffectVoicePlayer(clocked,context.destination),decide=createGameSoundDirector('glass-breaker','balanced',{ice:'bruh'});
    const times=[0,.08,.16,.24],events=times.map(time=>decide({type:'ice',time,x:270}));
    const samples=effectSamples(events[0]);
    for(const event of events){clock=event.time;player.play(event,samples);}
    const active=player.voices.size,rendered=(await context.startRendering()).getChannelData(0);let error=0,peak=0;
    for(let i=0;i<rendered.length;i++){
      const time=i/48000;let expected=0;
      for(let j=0;j<times.length;j++){
        const offset=i-Math.round(times[j]*48000);if(offset<0||offset>=samples.length)continue;
        let gain=1;
        for(let next=j+1;next<times.length;next++){
          if(time<times[next])break;
          const from=[1,.28,.08,0][next-j-1]??0,to=[.28,.08,0][next-j-1]??0;
          gain=from+(to-from)*Math.min(1,(time-times[next])/.018);
        }
        expected+=samples[offset]*gain;
      }
      // A centered StereoPanner splits mono equally across the two channels.
      peak=Math.max(peak,Math.abs(rendered[i]));error=Math.max(error,Math.abs(rendered[i]-expected*Math.SQRT1_2));
    }
    const live=new GameSoundPlayer('glass-breaker','balanced',{ice:'bruh'});await live.unlock();
    for(let i=0;i<4;i++){live.event({type:'ice'});await new Promise(resolve=>setTimeout(resolve,80));}
    const state=live.state();live.stop();const stopped=live.state().active;await live.context.close();
    const {RingAudio}=await import('/src/ring-escape-audio.js');
    const ring=new RingAudio({sound:true,music:'off',speed:1,musicVolume:.5,effectsVolume:.5,soundOverrides:{hit:'bruh'}});ring.setScore(null,null);await ring.unlock(false);
    for(let i=0;i<4;i++){ring.event({type:'hit',time:i*.08});await new Promise(resolve=>setTimeout(resolve,80));}
    const ringVoices=ring.effects.voices.size;ring.stop();const ringStopped=ring.effects.voices.size;await ring.context.close();
    const {BreakerAudio}=await import('/src/breaker-audio.js');
    const breaker=new BreakerAudio();await breaker.enable();
    const playedBefore=breaker.played;
    for(let i=0;i<4;i++){breaker.play('brick');await new Promise(resolve=>setTimeout(resolve,80));}
    const referencePlayed=breaker.played-playedBefore,referenceVoices=breaker.active.size;breaker.stop();
    await breaker.context.close();await breaker.director.context.close();
    const stressContext=new AudioContext();await stressContext.resume();
    const stress=new EffectVoicePlayer(stressContext,stressContext.destination);
    for(const voice of VOICES){
      const event={type:'directed',cue:{voice,degree:0,gain:.3},priority:1};
      const pcm=directedSamples(event,stressContext.sampleRate);
      if(!pcm.length||!pcm.every(Number.isFinite))throw Error('Invalid PCM: '+voice);
      for(let i=0;i<4;i++)if(!stress.play(event,pcm))throw Error('Dropped voice: '+voice);
      if(stress.voices.size!==3)throw Error('Unbounded layers: '+voice);
      stress.stop();
      if(stress.voices.size||stress.releasing.size)throw Error('Leaked voice: '+voice);
    }
    const short=stressContext.createBuffer(1,Math.ceil(stressContext.sampleRate*.04),stressContext.sampleRate);
    let maxActive=0,maxReleasing=0;
    for(let i=0;i<200;i++){
      stress.play({type:'mixed-'+i,priority:i%3},short);
      maxActive=Math.max(maxActive,stress.voices.size);maxReleasing=Math.max(maxReleasing,stress.releasing.size);
    }
    await new Promise(resolve=>setTimeout(resolve,200));
    const naturallyEnded=stress.voices.size+stress.releasing.size;
    stress.stop();stress.stop();await stressContext.close();
    return {active,error,peak,state,stopped,ringVoices,ringStopped,referencePlayed,referenceVoices,catalogVoices:VOICES.length,maxActive,maxReleasing,naturallyEnded};
  });
  assert.equal(result.active,3);assert.ok(result.error<.00001,'Actual Web Audio follows smooth overlap envelopes: '+result.error);
  assert.ok(result.peak>.02&&result.peak<1);assert.equal(result.state.played,4);assert.equal(result.state.skipped,0);assert.equal(result.state.active,3);assert.equal(result.stopped,0);
  assert.equal(result.ringVoices,3);assert.equal(result.ringStopped,0);assert.equal(result.referencePlayed,4);assert.equal(result.referenceVoices,3);assert.deepEqual(errors,[]);
  assert.equal(result.maxActive,8);assert.ok(result.maxReleasing<=8);assert.equal(result.naturallyEnded,0);
  console.log('PASS: Web Audio PCM matches overlap fades, rapid Bruh retriggers, bounded layers, stop, Ring recording bus and reference clips.',JSON.stringify(result));
}finally{await browser.close();}
