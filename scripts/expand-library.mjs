import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const people=[
  [
    "Abdullah Gül",
    "Abdullah Gül",
    "Türkiye",
    "politicians"
  ],
  [
    "Ahmet Necdet Sezer",
    "Ahmet Necdet Sezer",
    "Türkiye",
    "politicians"
  ],
  [
    "Cemal Gürsel",
    "Cemal Gürsel",
    "Türkiye",
    "politicians"
  ],
  [
    "Cevdet Sunay",
    "Cevdet Sunay",
    "Türkiye",
    "politicians"
  ],
  [
    "Ellen Johnson Sirleaf",
    "Ellen Johnson Sirleaf",
    "Liberya",
    "politicians"
  ],
  [
    "Kwame Nkrumah",
    "Kwame Nkrumah",
    "Gana",
    "politicians"
  ],
  [
    "Julius Nyerere",
    "Julius Nyerere",
    "Tanzanya",
    "politicians"
  ],
  [
    "Patrice Lumumba",
    "Patrice Lumumba",
    "Kongo",
    "politicians"
  ],
  [
    "Lee Kuan Yew",
    "Lee Kuan Yew",
    "Singapur",
    "politicians"
  ],
  [
    "Sukarno",
    "Sukarno",
    "Endonezya",
    "politicians"
  ],
  [
    "Muhammed Ali Cinnah",
    "Muhammad Ali Jinnah",
    "Pakistan",
    "politicians"
  ],
  [
    "Cevahirlal Nehru",
    "Jawaharlal Nehru",
    "Hindistan",
    "politicians"
  ],
  [
    "Golda Meir",
    "Golda Meir",
    "İsrail",
    "politicians"
  ],
  [
    "Yaser Arafat",
    "Yasser Arafat",
    "Filistin",
    "politicians"
  ],
  [
    "Cemal Abdünnasır",
    "Gamal Abdel Nasser",
    "Mısır",
    "politicians"
  ],
  [
    "Thomas Sankara",
    "Thomas Sankara",
    "Burkina Faso",
    "politicians"
  ],
  [
    "Naim Süleymanoğlu",
    "Naim Süleymanoğlu",
    "Türkiye · halter",
    "athletes"
  ],
  [
    "Halil Mutlu",
    "Halil Mutlu",
    "Türkiye · halter",
    "athletes"
  ],
  [
    "Neslihan Demir",
    "Neslihan Demir",
    "Türkiye · voleybol",
    "athletes"
  ],
  [
    "Eda Erdem",
    "Eda Erdem",
    "Türkiye · voleybol",
    "athletes"
  ],
  [
    "Vargas",
    "Melissa Vargas",
    "Türkiye · voleybol",
    "athletes"
  ],
  [
    "Busenaz Sürmeneli",
    "Busenaz Sürmeneli",
    "Türkiye · boks",
    "athletes"
  ],
  [
    "Buse Naz Çakıroğlu",
    "Buse Naz Çakıroğlu",
    "Türkiye · boks",
    "athletes"
  ],
  [
    "Yasemin Adar",
    "Yasemin Adar",
    "Türkiye · güreş",
    "athletes"
  ],
  [
    "Pelé",
    "Pelé",
    "Brezilya · futbol",
    "athletes"
  ],
  [
    "Diego Maradona",
    "Diego Maradona",
    "Arjantin · futbol",
    "athletes"
  ],
  [
    "Zinedine Zidane",
    "Zinedine Zidane",
    "Fransa · futbol",
    "athletes"
  ],
  [
    "Ronaldinho",
    "Ronaldinho",
    "Brezilya · futbol",
    "athletes"
  ],
  [
    "Simone Biles",
    "Simone Biles",
    "ABD · jimnastik",
    "athletes"
  ],
  [
    "Michael Phelps",
    "Michael Phelps",
    "ABD · yüzme",
    "athletes"
  ],
  [
    "Naomi Osaka",
    "Naomi Osaka",
    "Japonya · tenis",
    "athletes"
  ],
  [
    "Yuzuru Hanyu",
    "Yuzuru Hanyu",
    "Japonya · artistik patinaj",
    "athletes"
  ],
  [
    "Aziz Sancar",
    "Aziz Sancar",
    "Türkiye · biyokimya",
    "history"
  ],
  [
    "Safiye Ali",
    "Safiye Ali",
    "Türkiye · hekim",
    "history"
  ],
  [
    "Afet İnan",
    "Afet İnan",
    "Türkiye · tarihçi",
    "history"
  ],
  [
    "Osman Hamdi Bey",
    "Osman Hamdi Bey",
    "Osmanlı · ressam ve arkeolog",
    "history"
  ],
  [
    "Nâzım Hikmet",
    "Nâzım Hikmet",
    "Türkiye · şair",
    "history"
  ],
  [
    "Sabahattin Ali",
    "Sabahattin Ali",
    "Türkiye · yazar",
    "history"
  ],
  [
    "Yaşar Kemal",
    "Yaşar Kemal",
    "Türkiye · yazar",
    "history"
  ],
  [
    "Wangari Maathai",
    "Wangari Maathai",
    "Kenya · çevre ve barış",
    "history"
  ],
  [
    "Katherine Mansfield",
    "Katherine Mansfield",
    "Yeni Zelanda · yazar",
    "history"
  ],
  [
    "Srinivasa Ramanujan",
    "Srinivasa Ramanujan",
    "Hindistan · matematik",
    "history"
  ],
  [
    "Chien-Shiung Wu",
    "Chien-Shiung Wu",
    "Çin ABD · fizik",
    "history"
  ],
  [
    "Erkin Koray",
    "Erkin Koray",
    "Türkiye · Anadolu rock",
    "celebrities"
  ],
  [
    "Tarık Akan",
    "Tarık Akan",
    "Türkiye · sinema",
    "celebrities"
  ],
  [
    "Türkan Şoray",
    "Türkan Şoray",
    "Türkiye · sinema",
    "celebrities"
  ],
  [
    "Hülya Koçyiğit",
    "Hülya Koçyiğit",
    "Türkiye · sinema",
    "celebrities"
  ]
];
const countries=[["Küba","Cuba","cu"],["Jamaika","Jamaica","jm"],["Kosta Rika","Costa Rica","cr"],["Panama","Panama","pa"],["Bolivya","Bolivia","bo"],["Paraguay","Paraguay","py"],["Venezuela","Venezuela","ve"],["Kenya","Kenya","ke"],["Gana","Ghana","gh"],["Etiyopya","Ethiopia","et"],["Tanzanya","Tanzania","tz"],["Kamerun","Cameroon","cm"],["Fildişi Sahili","Ivory Coast","ci"],["Estonya","Estonia","ee"],["Letonya","Latvia","lv"],["Litvanya","Lithuania","lt"],["Slovakya","Slovakia","sk"],["Slovenya","Slovenia","si"],["Nepal","Nepal","np"],["Filipinler","Philippines","ph"],["Singapur","Singapore","sg"],["Sri Lanka","Sri Lanka","lk"],["Maldivler","Maldives","mv"]];
const empires=countries.map(([name,title,iso])=>[name,title,"Flag of "+(title==="Philippines"||title==="Maldives"?"the ":"")+title+".svg","Ülke bayrağı",iso]);
const read=async p=>JSON.parse(await fs.readFile(p,'utf8')),cachePath='artifacts/library-expansion-sources.json';
let cache={pages:{},files:{}};try{cache=await read(cachePath);}catch{}
cache.pages['Sabahattin Ali']={title:'Sabahattin Ali',pageimage:'Sabahattin Ali, date and location unknown.jpg'};
const save=()=>fs.writeFile(cachePath,JSON.stringify(cache,null,2));
const delay=()=>new Promise(r=>setTimeout(r,1400));
const norm=s=>s.replaceAll(' ','_');
async function query(host,params){const url=new URL('https://'+host+'/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',redirects:'1',...params});
 for(let n=0;n<3;n++){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(r.status===429&&n<2){await new Promise(r=>setTimeout(r,15000));continue;}if(!r.ok)throw Error('API '+r.status);const j=await r.json();if(!j.query)throw Error(JSON.stringify(j));await delay();return j.query;}}
const missing=people.filter(x=>!cache.pages[x[1]]);
for(let offset=0;offset<missing.length;offset+=25){const batch=missing.slice(offset,offset+25);const q=await query('en.wikipedia.org',{titles:batch.map(x=>x[1]).join('|'),prop:'pageimages',piprop:'thumbnail|name',pithumbsize:330,pilicense:'free'}),aliases=new Map([...(q.normalized??[]),...(q.redirects??[])].map(x=>[x.from,x.to]));
 for(const [,title]of batch){let t=title;for(let i=0;i<5&&aliases.has(t);i++)t=aliases.get(t);const p=Object.values(q.pages).find(x=>x.title===t);if(!p?.pageimage){console.log('NO PORTRAIT',title);continue;}cache.pages[title]=p;}await save();}
const files=[...people.map(x=>cache.pages[x[1]]?.pageimage),...empires.map(x=>x[2]).filter(Boolean)].filter(f=>f&&!cache.files[norm(f)]);
for(let i=0;i<files.length;i+=30){const q=await query('commons.wikimedia.org',{titles:files.slice(i,i+30).map(f=>'File:'+f).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:330});
 for(const p of Object.values(q.pages))if(p.imageinfo)cache.files[norm(p.title.slice(5))]=p.imageinfo[0];else console.log('MISSING',p.title);
 for(const r of q.redirects??[])cache.files[norm(r.from.slice(5))]=cache.files[norm(r.to.slice(5))];await save();}
if(!process.argv.includes('--write')){console.log('Prepared',people.length,'people,',empires.length,'states');process.exit();}
const m=await read('public/catalog/manifest.json'),seed=await read('scripts/catalog-seed.json');
const strip=s=>(s??'').replace(/<[^>]*>/g,'').replaceAll('&amp;','&').trim();
async function add(category,name,title,file,note,design){
 const id=category+'-'+crypto.createHash('sha1').update(category==='countries'?design:title).digest('hex').slice(0,10),sidecar='public/catalog/'+id+'.json';
 let item;try{item=await read(sidecar);}catch{}
 if(!item){item={id,category,name,englishName:title,fit:category==='countries'?'flag':'cover',curated:true,collectionBatch:'library-2026-10-28',historicalNote:note,keywords:title+' '+note,identitySource:'https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_'))};
 if(file){const info=cache.files[norm(file)];if(!info)throw Error('Missing file '+file);const url=info.thumburl??info.url,r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(file+': '+r.status);const mime=r.headers.get('content-type'),ext=mime.includes('jpeg')?'jpg':mime.includes('png')?'png':mime.includes('svg')?'svg':null;if(!ext)throw Error('MIME '+mime);
 item.src='/catalog/'+id+'.'+ext;await fs.writeFile('public'+item.src,Buffer.from(await r.arrayBuffer()));Object.assign(item,{source:info.descriptionurl,credit:strip(info.extmetadata?.Artist?.value)||'Wikimedia Commons',license:strip(info.extmetadata?.LicenseShortName?.value),licenseUrl:info.extmetadata?.LicenseUrl?.value??'',downloadUrl:url});if(!item.license)throw Error('No license '+title);await delay();
 }else{item.src='/catalog/'+id+'.svg';const censored=design==='censored';
 const art=censored?'<rect width="300" height="200" fill="#c8202b"/><circle cx="150" cy="100" r="65" fill="#fff"/><rect x="87" y="76" width="126" height="48" rx="4" fill="#171717"/><text x="150" y="106" text-anchor="middle" fill="white" font-family="sans-serif" font-size="17" font-weight="bold">SANSÜRLÜ</text>':`<rect width="300" height="200" fill="${design}"/>`;
 await fs.writeFile('public'+item.src,`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><title>${name}</title>${art}</svg>`);
 Object.assign(item,{source:item.identitySource,credit:'Marble Studio · '+(censored?'sansürlü temsil':'temsili hanedan rengi'),license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',generated:true,...(censored?{censored:true}: {})});}
 await fs.writeFile(sidecar,JSON.stringify(item,null,2)+'\n');}
 if(!m.items.some(x=>x.id===id))m.items.push(item);const g=seed.find(x=>x.id===category);const seedKey=category==='countries'?design:title;if(!g.items.some(x=>x[1]===seedKey))g.items.push([name,seedKey]);console.log('Added',name);
}
for(const [name,title,region,category]of people){if(!cache.pages[title]?.pageimage){console.log('SKIPPED',title);continue;}await add(category,name,title,cache.pages[title].pageimage,region);}
for(const [name,title,file,note,design]of empires)await add('countries',name,title,file,note,design);
await fs.writeFile('public/catalog/manifest.json',JSON.stringify(m,null,2)+'\n');await fs.writeFile('scripts/catalog-seed.json',JSON.stringify(seed,null,2)+'\n');
console.log('Published batch:',m.items.filter(x=>x.collectionBatch==='library-2026-10-28').length);
