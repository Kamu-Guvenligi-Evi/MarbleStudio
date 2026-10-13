import {mkdir,writeFile} from 'node:fs/promises';
import {cueSamples} from '../src/sound-plan.js';
import {SOFT_INSTRUMENTS,SOFT_PHRASES} from '../src/soft-audio.js';
const directory='artifacts/soft-audio',rate=24000,plan={root:48,scale:'pentatonic'};
await mkdir(directory,{recursive:true});
function wav(samples){
  const out=Buffer.alloc(44+samples.length*2);out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);out.write('data',36);out.writeUInt32LE(samples.length*2,40);
  for(let i=0;i<samples.length;i++)out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,samples[i]))*30000),44+i*2);return out;
}
for(const id of Object.keys(SOFT_INSTRUMENTS)){
  const samples=new Float32Array(rate*7);
  function add(voice,degree,time){const pcm=cueSamples(plan,{voice,degree,gain:.42},rate),start=Math.round(time*rate);for(let i=0;i<pcm.length&&start+i<samples.length;i++)samples[start+i]+=pcm[i];}
  for(let n=0;n<11;n++)add('soft-'+id,n,n*.24);
  add('soft-'+id+'-rise',0,3.7);add('soft-resolve',0,5.6);
  await writeFile(`${directory}/${id}-yukselis.wav`,wav(samples));
}
const comparison=new Float32Array(rate*Object.keys(SOFT_PHRASES).length*2),rows=[];
let index=0;
for(const [voice,phrase] of Object.entries(SOFT_PHRASES)){
  const pcm=cueSamples(plan,{voice,degree:0,gain:.42},rate);
  await writeFile(`${directory}/${voice}.wav`,wav(pcm));
  comparison.set(pcm,index*rate*2);
  rows.push(`${index*2}s: ${phrase.name} (${voice}.wav)`);index++;
}
await writeFile(`${directory}/yeni-notalar.wav`,wav(comparison));
await writeFile(`${directory}/README.txt`,'Original locally synthesized sounds. Instrument demos: ascending C-major pentatonic contacts, short rise, soft final chord. No external recordings.\nComparison order (yeni-notalar.wav):\n'+rows.join('\n')+'\n');
await writeFile(`${directory}/dinle.html`,`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Yumuşak notalar</title><style>body{font:17px system-ui;background:#111827;color:#f3f4f6;max-width:850px;margin:40px auto;padding:16px}article{background:#1f2937;border-radius:14px;padding:16px;margin:14px 0}audio{width:100%}p{color:#cbd5e1}</style><h1>Yumuşak notalar ve kısa melodiler</h1><p>Özgün sesler · aynı pentatonik gam · yerel ön dinleme</p><h2>10 melodiyi sırayla dinle</h2><audio controls src="yeni-notalar.wav" preload="none"></audio>${Object.entries(SOFT_PHRASES).map(([id,p])=>`<article><h2>${p.name}</h2><p>${p.hint}</p><audio controls src="${id}.wav" preload="none"></audio></article>`).join('')}<h2>Temas tınıları</h2>${Object.entries(SOFT_INSTRUMENTS).map(([id,name])=>`<article><h3>${name}</h3><audio controls src="${id}-yukselis.wav" preload="none"></audio></article>`).join('')}<script>document.addEventListener('play',e=>{if(e.target.tagName==='AUDIO')document.querySelectorAll('audio').forEach(a=>{if(a!==e.target)a.pause()})},true)</script></html>`);
console.log(`Created ${Object.keys(SOFT_INSTRUMENTS).length} instrument demos, ${index} motif demos, a 20-second comparison and dinle.html in ${directory}.`);
