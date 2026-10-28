import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage();
  await page.routeWebSocket('**/*',s=>s.close());
  await page.goto('http://127.0.0.1:5173/crown-battle.html');
  const result=await page.evaluate(async()=>{
    const {BattleAudio}=await import('/src/crown-battle-audio.js');
    const a=new BattleAudio();a.configure(true,1);await a.unlock();
    const wait=ms=>new Promise(r=>setTimeout(r,ms));
    const banks=[...a.movementBanks].map(([kind,b])=>({kind,count:b.length,durations:b.map(x=>+x.duration.toFixed(3))}));
    const signal=a.context.createAnalyser();signal.fftSize=2048;a.gain.connect(signal);
    const values=new Float32Array(2048);let energy=0,maxVoices=0,maxMovement=0,accepted=0;
    let movementEnergy=0,approachSteps=0;
    for(let i=0;i<20;i++){
      approachSteps+=Number(a.move('foot',-.4,{gain:1,pace:1}));
      approachSteps+=Number(a.move('hoof',.4,{gain:.8,pace:1.2}));
      await wait(50);signal.getFloatTimeDomainData(values);
      movementEnergy=Math.max(movementEnergy,values.reduce((s,x)=>s+x*x,0));
    }
    a.stop();
    for(let i=0;i<30;i++){
      for(let n=0;n<20;n++){
        accepted+=Number(a.move('foot',-.4,{gain:1,pace:1}));
        accepted+=Number(a.move('hoof',.4,{gain:.8,pace:1.2}));
        a.play('clash');a.play('gun');
      }
      maxVoices=Math.max(maxVoices,a.voices.size);maxMovement=Math.max(maxMovement,a.movementVoices.size);
      await wait(40);signal.getFloatTimeDomainData(values);energy=Math.max(energy,values.reduce((s,x)=>s+x*x,0));
    }
    await wait(1600);const ended=a.voices.size===0&&a.movementVoices.size===0;
    a.move('hoof',0,{gain:1});a.stop();const paused=a.voices.size===0&&a.movementVoices.size===0;
    a.move('hoof',0,{gain:1});a.configure(false);const muted=a.voices.size===0&&!a.move('foot',0,{gain:1});
    a.configure(true);const restarted=a.move('foot',0,{gain:1});a.stop();
    const distant=a.distantBus.frequency.value===2200&&a.distantBus.type==='lowpass';
    // Verify spectral behavior through the actual shared distance bus, not
    // just its settings: 8kHz should be substantially quieter than 400Hz.
    async function tone(hz){
      const osc=a.context.createOscillator();osc.frequency.value=hz;osc.connect(a.distantBus);osc.start();
      await wait(90);signal.getFloatTimeDomainData(values);
      const e=values.reduce((s,x)=>s+x*x,0);osc.stop();osc.disconnect();await wait(50);return e;
    }
    const low=await tone(400),high=await tone(8000);
    await a.context.close();return {banks,energy,movementEnergy,approachSteps,maxVoices,maxMovement,accepted,ended,paused,muted,restarted,distant,low,high};
  });
  assert.deepEqual(result.banks.map(x=>[x.kind,x.count]),[['foot',3],['hoof',2]]);
  assert(result.energy>.001);assert(result.maxVoices<=8);assert(result.maxMovement<=2);
  assert(result.movementEnergy>.001&&result.approachSteps>=4,'Approaching armies audible without any weapon contact');
  assert(result.accepted>0&&result.accepted<15,'Bounded movement starts during flood');
  for(const key of ['ended','paused','muted','restarted','distant'])assert(result[key],key);
  assert(result.high<result.low*.05,'Distant bus attenuates high frequencies');
  await page.route('**/audio/battle/horse-*.mp3',r=>r.abort());
  const missing=await page.evaluate(async()=>{
    const {BattleAudio}=await import('/src/crown-battle-audio.js');const a=new BattleAudio();a.configure(true,1);
    const ready=await a.unlock(),silent=!a.move('hoof',0,{gain:1}),weapons=a.play('clash');
    a.stop();await a.context.close();return {ready,silent,weapons};
  });
  assert.deepEqual(missing,{ready:true,silent:true,weapons:true});
  console.log('PASS movement browser:',JSON.stringify(result),'missing hoof files silent, weapons preserved');
} finally {await browser.close();}
