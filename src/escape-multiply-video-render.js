import {EscapeMultiply,renderEscape} from './escape-multiply.js';
import {EscapeAudio} from './escape-multiply-audio.js';
let game,job,canvas,ctx,cues,director,steps;
export function beginEscape(config){
  job=config;game=new EscapeMultiply(config.recipe);cues=[];steps=0;
  canvas??=document.createElement('canvas');canvas.width=1080;canvas.height=1920;ctx=canvas.getContext('2d');
  // Run the same collision melody on a virtual clock, independent of render speed.
  director=Object.create(EscapeAudio.prototype);director.voices=new Set();director.context={currentTime:0,state:'running'};director.gate=()=>{};director.enabled=true;director.reset();
  director.note=(tone,gain=.3,pan=0,ending=false,delay=0)=>cues.push({time:director.context.currentTime+delay,tone,gain,pan,ending});
  director.update(game);
}
export function escapeFrame(elapsed){
  const speed=job.speed*game.settings.speed;
  const target=Math.ceil(Math.max(0,elapsed-(job.intro??0))*speed*120);
  while(steps<target&&game.state==='running'){
    game.step();steps++;
    if(steps%2===0){director.context.currentTime=(job.intro??0)+steps/(120*speed);director.update(game);}
  }
  renderEscape(ctx,game);return canvas;
}
export const escapeResult=()=>({complete:game.state==='finished',winner:null,balls:game.created});
export async function escapeWav(duration,audio='effects'){
  if(audio==='none'||job.recipe.sound===false)return null;
  const rate=48000,frames=Math.ceil(duration*rate),context=new OfflineAudioContext(2,frames,rate),engine=new EscapeAudio(context);
  engine.setEnabled(true);
  for(const cue of cues){
    if(cue.time>=duration)continue;
    // Cues already have bounded polyphony from the live melody's note cadence.
    const source=context.createBufferSource(),gain=context.createGain(),pan=context.createStereoPanner();
    source.buffer=engine.buffer(cue.tone,cue.ending);gain.gain.value=cue.gain;pan.pan.value=cue.pan;
    source.connect(gain);gain.connect(pan);pan.connect(engine.bus);source.start(cue.time);
  }
  engine.master.gain.setTargetAtTime(0,Math.max(0,duration-.2),.025);
  const rendered=await context.startRendering(),bytes=new Uint8Array(44+frames*4),view=new DataView(bytes.buffer);
  const text=(offset,value)=>{for(let i=0;i<value.length;i++)bytes[offset+i]=value.charCodeAt(i);};
  text(0,'RIFF');view.setUint32(4,36+frames*4,true);text(8,'WAVEfmt ');view.setUint32(16,16,true);
  view.setUint16(20,1,true);view.setUint16(22,2,true);view.setUint32(24,rate,true);view.setUint32(28,rate*4,true);
  view.setUint16(32,4,true);view.setUint16(34,16,true);text(36,'data');view.setUint32(40,frames*4,true);
  const left=rendered.getChannelData(0),right=rendered.getChannelData(1),clamp=v=>Math.max(-1,Math.min(1,v));
  for(let i=0;i<frames;i++){view.setInt16(44+i*4,Math.round(clamp(left[i])*32767),true);view.setInt16(46+i*4,Math.round(clamp(right[i])*32767),true);}
  let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(binary);
}
