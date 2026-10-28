import fs from 'node:fs/promises';
import {MERGE_IMAGES as m} from '../src/merge-image-manifest.js';
const cats=JSON.parse(await fs.readFile('artifacts/png-categories.json','utf8'));
const selections={batman:2,ironman:3,caterpillar:3,shrimps:3,fish:9,turtle:3,octopus:8,dolphin:2,redcurrant:2,plum:1,grape:1,donut:3,muffin:2,canoe:2,ship:7,earth:1};
let changed=0;
for(const entries of Object.values(m))for(const [i,item]of entries.entries()){const slug=item.src.match(/^\/merge-cutouts\/(.+)-\d+\.png$/)?.[1];if(slug in selections){entries[i]={...item,src:`/merge-cutouts/${slug}-${selections[slug]}.png`};delete entries[i].bounds;changed++;}}
function png(theme,i,slug,n){m[theme][i]={subject:m[theme][i].subject,src:`/merge-cutouts/${slug}-${n}.png`,source:'https://pngimg.com'+cats.find(([u])=>u.endsWith('/'+slug))[0],file:`PNGimg — ${slug}`,cutout:true};changed++;}
png('reference',2,'spider_man',2);
const heroes={'black-widow':[['avengers',0]],hawkeye:[['avengers',1]],'captain-marvel':[['avengers',7]],'green-lantern':[['reference',1],['justice',4]],cyborg:[['justice',1]],batgirl:[['gotham',1]],catwoman:[['gotham',3]]};
for(const [slug,uses]of Object.entries(heroes))for(const [t,i]of uses){m[t][i]={subject:m[t][i].subject,src:`/merge-cutouts/hero-${slug}.png`,source:`https://pnggallery.com/${slug}/`,file:'PNG Gallery — CC BY-NC 4.0',cutout:true};changed++;}
function generated(t,i,name){m[t][i]={subject:m[t][i].subject,src:`/merge-cutouts/${name}-dragon-generated.png`,source:'https://openai.com/index/image-generation/',file:'Marble Studio — AI generated artwork',cutout:true,artwork:'generated'};changed++;}
generated('dragon',4,'ruby');generated('dragon',5,'ice');generated('dragon',6,'emerald');generated('ice',6,'ice');png('dragon',7,'dragon',11);
// A medieval helmet must not be represented by a modern combat helmet.
const helmet='public/merge-cutouts/knight-medieval-helmet.svg';
await fs.writeFile(helmet,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><defs><linearGradient id="steel"><stop stop-color="#697a95"/><stop offset=".44" stop-color="#e6edf5"/><stop offset="1" stop-color="#8495b0"/></linearGradient></defs><path d="M94 16C47 16 29 48 31 101l15 51 50 26 50-26 15-51c2-53-19-85-67-85Z" fill="url(#steel)" stroke="#405169" stroke-width="5"/><path d="M39 79h114l-9 25H48Z" fill="#172536"/><path d="M94 19v151M45 116l49 19 52-19" fill="none" stroke="#53677f" stroke-width="7"/><path d="m58 117 6 22m12-16 3 23m37-23-3 23m20-29-6 22" stroke="#27394d" stroke-width="5"/><path d="M80 18C69 5 85 0 95 7l10 11" fill="#b42e42"/></svg>`);
m.knight[2]={subject:m.knight[2].subject,src:'/merge-cutouts/knight-medieval-helmet.svg',source:'https://game-icons.net/',file:'Marble Studio original vector artwork',cutout:true};
await fs.writeFile('src/merge-image-manifest.js','// Individually reviewed local cutouts and source attribution.\nexport const MERGE_IMAGES='+JSON.stringify(m,null,2)+';\n');console.log('Curated replacements:',changed);
