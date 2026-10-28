import fs from 'node:fs/promises';
import {chromium} from 'playwright';
import {MERGE_IMAGES} from '../src/merge-image-manifest.js';
import {MERGE_IMAGES as BEFORE} from '../artifacts/merge-image-manifest-before-cutouts.js';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage();await page.goto('http://127.0.0.1:5173');
const cachePath='artifacts/merge-commons-cutouts.json';let cache={};try{cache=JSON.parse(await fs.readFile(cachePath,'utf8'));}catch{}
const targets=new Set(['avengers','justice','gotham','planets','moons','gems','butterfly','reef','dinosaurs','strings','winds','rhythm','orchestra','missions']);
const report=[];
for(const [theme,entries]of Object.entries(MERGE_IMAGES)){if(!targets.has(theme))continue;for(const [i,item]of entries.entries()){
 if(item.artwork!=='illustration')continue;const subject=BEFORE[theme]?.[i]?.subject;if(!subject)continue;
 if(!(subject in cache)){cache[subject]=null;try{let query=subject.replace(/\s*\([^)]*\)/g,'')+' png -anatomie -beschriftung -map -flag -diagram -logo';const url='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',generator:'search',gsrnamespace:'6',gsrlimit:'5',gsrsearch:query,prop:'imageinfo',iiprop:'url',iiurlwidth:'240'});let data=await(await fetch(url,{signal:AbortSignal.timeout(15000)})).json();let candidates=Object.values(data.query?.pages||{}).sort((a,b)=>a.index-b.index).filter(x=>/\.png$/i.test(x.title));
 for(const [n,candidate]of candidates.entries()){const info=candidate.imageinfo?.[0];if(!info)continue;const src=`/merge-cutouts/commons-${theme}-${i}-${n}.png`;try{await fs.access('public'+src);}catch{const r=await fetch(info.thumburl||info.url,{signal:AbortSignal.timeout(15000)});if(!r.ok)continue;await fs.writeFile('public'+src,Buffer.from(await r.arrayBuffer()));}
 const good=await page.evaluate(async src=>{let im=new Image();im.src=src;try{await im.decode();}catch{return false;}const c=document.createElement('canvas');c.width=c.height=96;let x=c.getContext('2d');x.drawImage(im,0,0,96,96);const d=x.getImageData(0,0,96,96).data;let clear=0,edge=0;for(let y=0;y<96;y++)for(let x=0;x<96;x++){let a=d[(y*96+x)*4+3];if(a<10)clear++;if((x===0||y===0||x===95||y===95)&&a>200)edge++;}return clear>1800&&clear<8400&&edge<65;},src);
 if(good){cache[subject]={src,source:info.descriptionurl,file:candidate.title,cutout:true};break;}}
 }catch(e){report.push({subject,error:e.message});}await fs.writeFile(cachePath,JSON.stringify(cache,null,2));}
 if(cache[subject]){entries[i]={...cache[subject],subject:item.subject};console.log('Replaced',theme,i,subject,cache[subject].file);}else console.log('No verified cutout:',subject);
 }}
await fs.writeFile('src/merge-image-manifest.js','// Local transparent artwork and attribution.\nexport const MERGE_IMAGES='+JSON.stringify(MERGE_IMAGES,null,2)+';\n');await browser.close();await fs.writeFile('artifacts/merge-commons-report.json',JSON.stringify(report,null,2));
