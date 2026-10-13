import assert from 'node:assert/strict';
import {createGameSoundDirector} from '../src/game-sound-director.js';
import {createDuelSoundEvents} from '../src/ball-duel-audio.js';
import {BallDuel} from '../src/ball-duel.js';
import {collisionEvent,effectInterval,effectSamples} from '../src/impact-audio.js';
import {productionAudio} from '../scripts/factory-audio.mjs';
import {VOICES} from '../src/sound-plan.js';

for(const [mode,type] of [['glass-breaker','ice'],['spiral-breaker','brick'],['ball-duel','bounce'],['ring-escape','hit']]){
  for(const style of ['original','balanced','meme','reactions']){
    for(const voice of VOICES){
      const decide=createGameSoundDirector(mode,style,{[type]:voice});
      for(const time of [0,.08,.16,.24])assert.equal(decide({type,time}).cue.voice,voice,mode+' retriggers '+voice);
      assert.equal(decide({type,time:.241}),null,'One physics burst stays bounded');
    }
    assert.equal(createGameSoundDirector(mode,style,{[type]:'off'})({type,time:0}),null,'Explicit silence stays silent');
  }
}
for(const style of ['original','balanced','meme','reactions']){
  const decide=createDuelSoundEvents(style),game={balls:[{weapon:'laser'},{weapon:'blaster'}]};
  for(const type of ['wall','shot','hit','bounce','heal'])assert.ok(decide({type,time:0,x:300,owner:0},game),style+' '+type+' survives simultaneous events');
  assert.ok(decide({type:'wall',time:0,x:300,owner:1},game),'The other ball has an independent contact channel');
}
// The physics boost cooldown used to prevent a legitimate second impact event.
const duel=new BallDuel({seed:42});let bounced=0;duel.onEvent=e=>{if(e.type==='bounce')bounced++;};
function collide(){const [a,b]=duel.balls;a.x=270;a.y=400;b.x=270+a.r+b.r-1;b.y=400;a.vx=200;b.vx=-200;a.vy=b.vy=0;duel.collide();}
collide();assert.ok(duel.contactCooldown>0);collide();assert.equal(bounced,2);

const choose=createGameSoundDirector('glass-breaker','balanced',{ice:'bruh'});
const events=[0,.08,.16,.24].map(time=>choose({type:'ice',time,x:270}));
const pcm=effectSamples(events[0]),rate=48000;
assert.ok(pcm.length/rate>.24);assert.ok(effectInterval(collisionEvent({type:'impact'},'bruh'))<.08);
const {buffer}=await productionAudio({events:{effects:events,leaders:[]},recipe:{},duration:1,audio:'effects'});
// Independent sample oracle: three audible layers; old layers fade over 18 ms.
let maxError=0;
for(let i=0;i<rate;i++){
  const time=i/rate;let expected=0;
  for(let j=0;j<events.length;j++){
    const offset=i-Math.round(events[j].time*rate);if(offset<0||offset>=pcm.length)continue;
    let level=1;
    for(let next=j+1;next<events.length;next++){
      if(time<events[next].time)break;
      const from=[1,.28,.08,0][next-j-1]??0,to=[.28,.08,0][next-j-1]??0;
      level=from+(to-from)*Math.min(1,(time-events[next].time)/.018);
    }
    expected+=pcm[offset]*level*.35;
  }
  maxError=Math.max(maxError,Math.abs(buffer.readInt16LE(44+i*2)-Math.round(Math.tanh(expected)*30000)));
}
assert.ok(maxError<=1,'Export preserves each new attack and fades older tails: '+maxError);
console.log(`PASS: ${VOICES.length} voices retrigger across 4 games and 4 styles; independent duel channels, real contact cooldown, mute, bounded bursts and exported overlap envelopes.`);
