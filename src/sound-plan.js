// Portable, versioned score. AI selects cues; the player never invents AI decisions.
import {MEME_SOUNDS,MEME_INTERVALS,memeSamples} from './meme-audio.js';
import {RECORDED_SOUNDS,recordedSamples} from './recorded-sounds.js';
import {goalCrowdSamples} from './goal-arena-audio.js';
import {SOFT_SOUNDS,SOFT_INSTRUMENTS,SOFT_PHRASES,softSamples,createNoteClimb} from './soft-audio.js';
export const VOICES = ['tick','glass','pluck','sparkle','thump','sweep','resolve','goal-horn',...Object.keys(SOFT_SOUNDS),...Object.keys(MEME_SOUNDS),...Object.keys(RECORDED_SOUNDS)];
export const VOICE_NAMES = {tick:'Hafif temas',glass:'Cam tınısı',pluck:'Yumuşak nota',sparkle:'Parıltı',thump:'Bas vurgu',sweep:'Yükseliş',resolve:'Final akoru','goal-horn':'Mackolik goal alert',...SOFT_SOUNDS,...MEME_SOUNDS,...Object.fromEntries(Object.entries(RECORDED_SOUNDS).map(([id,clip])=>[id,clip.name]))};
const object = properties => ({type:'object',additionalProperties:false,required:Object.keys(properties),properties});
const num = (minimum,maximum,type='number') => ({type,minimum,maximum});
export const PLAN_SCHEMA = object({
  title:{type:'string',maxLength:80}, rationale:{type:'string',maxLength:500},
  bpm:num(60,160,'integer'), root:num(45,69,'integer'), scale:{type:'string',enum:['major','minor','pentatonic']},
  motif:{type:'array',minItems:4,maxItems:8,items:num(0,14,'integer')},
  sections:{type:'array',minItems:1,maxItems:8,items:object({start:num(0,90),energy:num(0,1),musicGain:num(0,1),label:{type:'string',maxLength:60}})},
  cues:{type:'array',maxItems:256,items:object({eventId:num(0,9999,'integer'),voice:{type:'string',enum:VOICES},degree:num(0,21,'integer'),gain:num(.05,.8),duck:num(0,.8),reason:{type:'string',maxLength:100}})},
});

function check(value,schema,path='plan') {
  if(schema.type==='object') {
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`${path}: nesne bekleniyor.`);
    if(Object.keys(value).some(k=>!Object.hasOwn(schema.properties,k)))throw Error(`${path}: bilinmeyen alan.`);
    for(const [key,shape] of Object.entries(schema.properties))check(value[key],shape,`${path}.${key}`);
  } else if(schema.type==='array') {
    if(!Array.isArray(value)||value.length<(schema.minItems??0)||value.length>schema.maxItems)throw Error(`${path}: geçersiz liste.`);
    value.forEach((v,i)=>check(v,schema.items,`${path}[${i}]`));
  } else if(schema.type==='string') {
    if(typeof value!=='string'||value.length>(schema.maxLength??Infinity)||schema.enum&&!schema.enum.includes(value))throw Error(`${path}: geçersiz metin.`);
  } else if(!Number.isFinite(value)||value<schema.minimum||value>schema.maximum||schema.type==='integer'&&!Number.isInteger(value))throw Error(`${path}: geçersiz sayı.`);
}
export function validatePlan(plan,trace) {
  check(plan,PLAN_SCHEMA);
  if(plan.sections[0].start!==0)throw Error('Müzik planı sıfırdan başlamalı.');
  const ids=new Set();
  for(let i=0;i<plan.sections.length;i++) {
    const s=plan.sections[i];
    if(s.start>=trace.duration||i&&s.start<=plan.sections[i-1].start)throw Error('Müzik bölümleri zaman sırasıyla olmalı.');
  }
  const byId=new Map(trace.events.map(e=>[e.id,e]));
  for(const cue of plan.cues) {
    if(!byId.has(cue.eventId)||ids.has(cue.eventId))throw Error('Efekt gerçek, benzersiz bir oyun olayına bağlı olmalı.');
    ids.add(cue.eventId);
  }
  const ending=trace.events.find(e=>['win','timeout','complete'].includes(e.type));
  if(ending&&!ids.has(ending.id))throw Error('Final olayı ses planında eksik.');
  return structuredClone(plan);
}
export function sectionAt(plan,time) {return plan.sections.findLast(s=>s.start<=time)??plan.sections[0];}
export function frequency(plan,degree,octave=0) {
  const scale=plan.scale==='minor'?[0,2,3,5,7,8,10]:plan.scale==='pentatonic'?[0,2,4,7,9]:[0,2,4,5,7,9,11];
  return 440*2**((plan.root+12*octave+scale[degree%scale.length]+12*Math.floor(degree/scale.length)-69)/12);
}
// Explicitly labelled local preset, useful without credentials. Not an AI response.
function spreadCues(events){
  // Keep the start and ending, distributing the limited cue budget across the clip.
  return events.length<=256?events:Array.from({length:256},(_,i)=>events[Math.round(i*(events.length-1)/255)]);
}
export function localPlan(trace) {
  let last=-Infinity;
  return validatePlan({title:'Studio dengeli',rationale:'Yerel hazır düzen: seyrek temas, belirgin kırılma ve ayrı final vurgusu.',bpm:108,root:48,scale:'pentatonic',motif:[0,4,2,7,4,2,1,4],
    sections:[{start:0,energy:.25,musicGain:.55,label:'Merak'},{start:trace.duration*.55,energy:.55,musicGain:.65,label:'Hareket'},{start:trace.duration*.82,energy:.8,musicGain:.75,label:'Finale yaklaşım'}],
    cues:spreadCues(trace.events.filter(e=>{if(e.type!=='hit')return true;if(e.time-last<.18)return false;last=e.time;return true;})).map((e,i)=>({eventId:e.id,voice:e.type==='win'?'resolve':e.type==='timeout'?'thump':e.type==='break'?'sparkle':'pluck',degree:e.type==='win'?0:i%8,gain:e.type==='hit'?.23:.5,duck:e.type==='hit'?.12:.55,reason:e.type==='hit'?'Ritmik temas':e.type==='break'?'Açıklıktan kaçış':'Final vurgusu'}))},trace);
}

export function memePlan(trace,spoken=false){
  const plan=localPlan(trace);let next=0,nextReaction=0,hits=0,breaks=0;
  plan.title=spoken?'Sözlü tepkiler':'Meme tepkileri';plan.rationale='Kısa temaslar, aralıklı komik tepkiler ve finalde tek güçlü vurgu.';
  plan.sections=plan.sections.map(s=>({...s,musicGain:s.musicGain*.65}));
  plan.cues=plan.cues.flatMap(c=>{
    const event=trace.events.find(e=>e.id===c.eventId),time=event.time/trace.speed;
    const ending=['win','timeout','complete'].includes(event.type);
    if(!ending&&time<(event.type==='break'?nextReaction:next))return [];
    const escapes=['sonic-ring','bonk','mario-jump','coin','cartoon-run','meme-meow','cartoon-spring','rizz'];
    const touches=['bubble-pop','cartoon-slip','whoosh','bubble-pop','rubber-duck'];
    let voice=ending?(event.type==='timeout'?'wrong-buzzer':'vine-boom'):event.type==='break'?escapes[breaks++%escapes.length]:touches[hits++%touches.length];
    if(spoken&&ending)voice=event.type==='timeout'?'oh-no':'yippee';
    else if(spoken&&event.type==='break'){
      const reactions=['yoink','nani','nice','sheesh','lets-go','gotcha','huh','oh-my-god','bruh','what-dog','anime-wow'];
      voice=reactions[(breaks-1)%reactions.length];
    }
    next=time+Math.max(.4,MEME_INTERVALS[voice]);
    if(event.type==='break')nextReaction=next;
    return [{...c,voice,gain:ending?.55:.4,duck:ending?.65:.3,reason:ending?'Final vurgusu':event.type==='break'?'Kaçış tepkisi':'Kısa temas'}];
  });
  return validatePlan(plan,trace);
}

export function softPlan(trace,instrument='kalimba',phrase=''){
  if(!Object.hasOwn(SOFT_INSTRUMENTS,instrument))instrument='kalimba';
  if(!Object.hasOwn(SOFT_PHRASES,phrase))phrase='';
  const plan=localPlan(trace),climb=createNoteClimb();let last=-Infinity,lastPhrase=-Infinity;
  plan.title=SOFT_INSTRUMENTS[instrument]+' · yükselen temaslar';
  plan.rationale='Do–Re–Mi–Sol–La gamında yumuşak temaslar. Her temas bir üst notaya çıkar; ses seviyesi sabit kalır. Kısa bir aradan sonra yeniden başlar.';
  if(phrase)plan.rationale+=' Kaçışlarda '+SOFT_PHRASES[phrase].name+' duyulur.';
  plan.sections=plan.sections.map(s=>({...s,musicGain:0}));
  plan.cues=spreadCues(trace.events.filter(e=>{
    if(['win','timeout','complete'].includes(e.type))return true;
    const time=e.time/trace.speed;if(time-last<.095)return false;last=time;return true;
  })).map(e=>{
    const final=['win','timeout','complete'].includes(e.type),degree=final?0:climb(e.time/trace.speed);
    if(!final&&phrase&&e.type==='break'&&e.time/trace.speed-lastPhrase>=1.1){
      lastPhrase=e.time/trace.speed;
      return {eventId:e.id,voice:phrase,degree:0,gain:.42,duck:0,reason:SOFT_PHRASES[phrase].name+' · kaçış vurgusu'};
    }
    return {eventId:e.id,voice:final?'soft-resolve':`soft-${instrument}`,degree,gain:.42,duck:0,reason:final?'Yumuşak kapanış':'Aynı gamda yükselen temas'};
  });
  return validatePlan(plan,trace);
}

// Both live playback and exported PCM use the same deterministic instrument.
export function cueSamples(plan,cue,rate=48000) {
  // Keep the saved voice ID compatible with existing projects.
  if(cue.voice==='goal-horn')return goalCrowdSamples(cue.gain,rate);
  const soft=softSamples(cue.voice,d=>frequency(plan,d,1),cue.degree,cue.gain,rate);
  if(soft)return soft;
  const recorded=memeSamples(cue.voice,rate)??recordedSamples(cue.voice,rate);
  if(recorded)return recorded.map(s=>s*cue.gain);
  const duration={tick:.07,glass:.32,pluck:.24,sparkle:.4,thump:.35,sweep:.5,resolve:1.15}[cue.voice];
  const out=new Float32Array(Math.ceil(rate*duration)),f=frequency(plan,cue.degree,cue.voice==='thump'?-1:1);
  for(let i=0;i<out.length;i++) {
    const t=i/rate,u=t/duration,attack=Math.min(1,t/.006),env=attack*Math.exp(-u*6)*(1-u);
    let s=Math.sin(2*Math.PI*f*t);
    if(cue.voice==='glass')s=(s+.3*Math.sin(2*Math.PI*f*2.76*t))/.99;
    if(cue.voice==='tick')s=Math.sin(2*Math.PI*f*2*t);
    if(cue.voice==='pluck')s=(s+.2*Math.sin(2*Math.PI*f*2*t))/1.2;
    if(cue.voice==='sparkle')s=(s+Math.sin(2*Math.PI*f*2*t)+.4*Math.sin(2*Math.PI*f*3*t))/2.4;
    if(cue.voice==='thump')s=Math.sin(2*Math.PI*(65*t+35*.06*(1-Math.exp(-t/.06))));
    if(cue.voice==='sweep')s=Math.sin(2*Math.PI*f*(t+t*t));
    if(cue.voice==='resolve')s=(s+Math.sin(2*Math.PI*frequency(plan,cue.degree+2,1)*t)+Math.sin(2*Math.PI*frequency(plan,cue.degree+4,1)*t))/3;
    out[i]=Math.max(-1,Math.min(1,s))*env*cue.gain;
  }
  return out;
}
