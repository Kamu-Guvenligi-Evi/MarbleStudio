import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {BounceWaves,WAVE_MODES} from '../src/bounce-waves.js';
import {wavesSoundEvents} from '../src/bounce-waves-audio.js';
import {productionAudio} from '../scripts/factory-audio.mjs';
import {productionBrowserOptions} from '../scripts/browser-runtime.mjs';

for(const variant of Object.keys(WAVE_MODES))for(const speed of [.5,.75,1,2]){
  const game=new BounceWaves({variant,speed,count:8000,duration:30});
  const events=wavesSoundEvents(game,{speed,intro:2});
  assert.ok(events.length>20&&events.length<30/speed/.115);
  assert.deepEqual(events,wavesSoundEvents(game,{speed,intro:2}));
  for(let i=0;i<events.length;i++){
    const event=events[i],time=(event.time-2)*speed;
    assert.ok(time>0&&time<30);
    assert.ok(game.balls.some(b=>Math.abs((time-b.dropTime)/b.period-Math.round((time-b.dropTime)/b.period))<1e-8),'sound must match an actual floor contact');
    if(i)assert.ok(event.time-events[i-1].time>=.115-1e-8);
  }
}
assert.deepEqual(wavesSoundEvents(new BounceWaves({sound:false})),[]);
const recipe={mode:'bounce-waves',duration:15,speed:1.5,count:8000};
const events={effects:wavesSoundEvents(new BounceWaves(recipe)),leaders:[]};
const {buffer}=await productionAudio({events,recipe,duration:10,audio:'effects',project:process.cwd()});
let peak=0,energy=0;
for(let i=44;i<buffer.length;i+=2){const v=buffer.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));energy+=v*v;}
assert.ok(peak>.02&&peak<.25,'audible mix with comfortable headroom');
assert.ok(Math.sqrt(energy/((buffer.length-44)/2))>.005);
for(let i=44;i<44+Math.floor(events.effects[0].time*48000)*2;i+=2)assert.equal(buffer.readInt16LE(i),0,'no sound before first landing');
const muted=await productionAudio({events,recipe,duration:10,audio:'none',project:process.cwd()});
assert.ok(muted.buffer.subarray(44).every(value=>value===0));
await mkdir('artifacts/bounce-waves-audio',{recursive:true});
await writeFile('artifacts/bounce-waves-audio/soft-landings.wav',buffer);
console.log('PASS all variants/speeds: physical contact timing, bounded density, deterministic audio, mute, PCM peak',peak.toFixed(3));

const browser=await chromium.launch(productionBrowserOptions());
try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    localStorage.setItem('marble-studio-bounce-waves-v1',JSON.stringify({duration:15,count:500,densityVersion:2}));
    localStorage.setItem('marble-studio-export-bounce-waves-v1',JSON.stringify({audio:'music'}));
    window.audioTest={starts:0,stops:0};
    const Base=window.AudioContext;
    window.AudioContext=class extends Base{
      createBufferSource(){const source=super.createBufferSource(),start=source.start.bind(source),stop=source.stop.bind(source);
        source.start=(...args)=>{window.audioTest.starts++;return start(...args);};
        source.stop=(...args)=>{window.audioTest.stops++;return stop(...args);};return source;
      }
    };
  });
  await page.goto('http://127.0.0.1:5173/bounce-waves.html');
  await page.locator('#replay').click();
  await page.waitForFunction(()=>window.audioTest.starts>=3);
  await page.locator('#pause').click();
  const paused=await page.evaluate(()=>window.audioTest.starts);
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>window.audioTest.starts),paused);
  assert.ok(await page.evaluate(()=>window.audioTest.stops>0));
  await page.locator('#sound').click();await page.locator('#pause').click();
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>window.audioTest.starts),paused);
  await page.locator('#sound').click();
  await page.waitForFunction(n=>window.audioTest.starts>n,paused);
  await page.locator('#studio-export').click();
  await page.waitForFunction(()=>document.querySelector('#video-dialog select[name=audio]')?.value==='all');
  assert.deepEqual(errors,[]);
  console.log('PASS browser: live playback, pause, mute/unmute, legacy music-only export upgraded');
}finally{await browser.close();}
