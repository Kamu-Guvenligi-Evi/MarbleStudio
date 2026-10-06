// Shared deterministic synthesis for live Web Audio and offline video exports.
export function effectSamples(event={},rate=48000){
  const type=event.type??'impact',duration=({ice:.24,multiply:.36,drop:.16,complete:.7,impact:.09})[type]??.09;
  const out=new Float32Array(Math.ceil(rate*duration));
  let noise=(event.seed??17)|0,previous=0;
  const pitch=({lava:.7,gold:1.12,candy:1.35,cosmic:.85,aurora:1.18})[event.theme]??1;
  for(let i=0;i<out.length;i++){
    const t=i/rate,attack=Math.min(1,t/.002),fade=Math.min(1,(duration-t)/.018);
    noise^=noise<<13;noise^=noise>>>17;noise^=noise<<5;
    const white=(noise>>>0)/2147483648-1,high=white-previous;previous=white;
    let sample;
    if(type==='ice')sample=.27*high*Math.exp(-t*29)+.2*Math.sin(2*Math.PI*1850*pitch*t)*Math.exp(-t*38)+.16*Math.sin(2*Math.PI*155*t)*Math.exp(-t*36);
    else if(type==='multiply'||type==='complete'){
      const notes=type==='complete'?[523,659,784,1047]:[660,880,1320];sample=0;
      for(let n=0;n<notes.length;n++){const u=t-n*(type==='complete'?.085:.05);if(u>=0)sample+=.16*Math.sin(2*Math.PI*notes[n]*pitch*u)*Math.exp(-u*14);}
    }else if(type==='drop')sample=.12*white*Math.sin(Math.PI*t/duration)+.12*Math.sin(2*Math.PI*(900*t-2200*t*t))*Math.exp(-t*20);
    else sample=.23*Math.sin(2*Math.PI*(280+(event.x??270)*1.2)*pitch*t)*Math.exp(-t*55);
    out[i]=sample*attack*fade;
  }
  return out;
}
export function playEffect(context,destination,event){
  const samples=effectSamples(event,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);
  buffer.copyToChannel(samples,0);const source=context.createBufferSource(),pan=context.createStereoPanner();
  source.buffer=buffer;pan.pan.value=Math.max(-.8,Math.min(.8,((event.x??270)/540-.5)*1.4));
  source.connect(pan);pan.connect(destination);source.onended=()=>{source.disconnect();pan.disconnect();};source.start();
}
