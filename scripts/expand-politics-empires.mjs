import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const people=[
 ['İsmet İnönü','İsmet İnönü','Türkiye'],['Bülent Ecevit','Bülent Ecevit','Türkiye'],['Süleyman Demirel','Süleyman Demirel','Türkiye'],
 ['Turgut Özal','Turgut Özal','Türkiye'],['Necmettin Erbakan','Necmettin Erbakan','Türkiye'],['Adnan Menderes','Adnan Menderes','Türkiye'],
 ['Deniz Baykal','Deniz Baykal','Türkiye'],['Tansu Çiller','Tansu Çiller','Türkiye'],['Ahmet Davutoğlu','Ahmet Davutoğlu','Türkiye'],
 ['Ali Babacan','Ali Babacan','Türkiye'],['Fatih Erbakan','Fatih Erbakan','Türkiye'],['Ümit Özdağ','Ümit Özdağ','Türkiye'],['Muharrem İnce','Muharrem İnce','Türkiye'],
 ['Winston Churchill','Winston Churchill','Birleşik Krallık'],['Margaret Thatcher','Margaret Thatcher','Birleşik Krallık'],['Charles de Gaulle','Charles de Gaulle','Fransa'],
 ['Mihail Gorbaçov','Mikhail Gorbachev','Sovyetler Birliği'],['Vladimir Lenin','Vladimir Lenin','Sovyetler Birliği'],['Josef Stalin','Joseph Stalin','Sovyetler Birliği'],
 ['Fidel Castro','Fidel Castro','Küba'],['John F. Kennedy','John F. Kennedy','ABD'],['Ronald Reagan','Ronald Reagan','ABD'],
 ['Bill Clinton','Bill Clinton','ABD'],['George W. Bush','George W. Bush','ABD'],['Shinzo Abe','Shinzo Abe','Japonya'],
 ['Jacinda Ardern','Jacinda Ardern','Yeni Zelanda'],['Justin Trudeau','Justin Trudeau','Kanada'],['Benazir Butto','Benazir Bhutto','Pakistan'],['İndira Gandhi','Indira Gandhi','Hindistan'],
];
// Explicit flags only. Ancient dynastic colours are identified as representations.
const empires=[
 ['Kutsal Roma İmparatorluğu','Holy Roman Empire','Banner of the Holy Roman Emperor (after 1400).svg','1400 sonrası · imparatorluk sancağı'],
 ['İsveç İmparatorluğu','Swedish Empire','Flag of Sweden.svg','İsveç haçlı bayrağının modern çizimi · dönem oranları değişebilir'],
 ['Danimarka Sömürge İmparatorluğu','Danish colonial empire','Flag of Denmark.svg','Dannebrog · modern standart çizim'],
 ['Hollanda Sömürge İmparatorluğu','Dutch Empire','Flag of the Netherlands.svg','Kırmızı-beyaz-mavi · sömürge döneminin bir bölümünde kullanılan bayrak'],
 ['Belçika Sömürge İmparatorluğu','Belgian colonial empire','Flag of Belgium.svg','Belçika devlet bayrağı · kolonilerin ayrı bayrakları da vardı'],
 ['İtalyan Sömürge İmparatorluğu','Italian Empire','Flag of Italy (1861-1946).svg','1861–1946 · İtalya Krallığı sivil bayrağı'],
 ['İkinci Fransız İmparatorluğu','Second French Empire','Flag of France (1794–1815, 1830–1974).svg','1852–1870 · Fransız üç renkli bayrağı'],
 ['Birinci Meksika İmparatorluğu','First Mexican Empire','Bandera del Primer Imperio Mexicano.svg','1822–1823 · taçlı kartallı bayrak'],
 ['İkinci Meksika İmparatorluğu','Second Mexican Empire','Flag of Mexico (1864-1867).svg','1864–1867 · imparatorluk sancağı'],
 ['Sih İmparatorluğu','Sikh Empire','Sikh Empire flag.svg','Sih sancağının modern yeniden çizimi'],
 ['Sasani İmparatorluğu','Sasanian Empire','Derafsh Kaviani flag of the late Sassanid Empire.svg','Derafş-ı Kaviyan · modern rekonstrüksiyon'],
 ['Abbasi Halifeliği','Abbasid Caliphate',null,'Siyah hanedan rengi · temsili sancak, standart ulusal bayrak değil','#111111'],
 ['Emevi Halifeliği','Umayyad Caliphate',null,'Beyaz hanedan rengi · temsili sancak, standart ulusal bayrak değil','#f5f2e9'],
 ['Fatımi Halifeliği','Fatimid Caliphate',null,'Yeşil hanedan rengi · modern atıf, kesin tarihî bayrak değil','#207445'],
 ['Sovyetler Birliği','Soviet Union','Flag of the Soviet Union.svg','1955–1991 bayrağı · tarihî devlet; resmî adı imparatorluk değildi'],
 ['Nazi Almanyası (sansürlü)','Nazi Germany',null,'1933–1945 · tarihî devlet; sembol yerine sansür bandı kullanıldı','censored'],
];
const read=async p=>JSON.parse(await fs.readFile(p,'utf8')),cachePath='artifacts/politics-empire-sources.json';
let cache={pages:{},files:{}};try{cache=await read(cachePath);}catch{}
const save=()=>fs.writeFile(cachePath,JSON.stringify(cache,null,2));
const delay=()=>new Promise(r=>setTimeout(r,1400));
const norm=s=>s.replaceAll(' ','_');
async function query(host,params){const url=new URL('https://'+host+'/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',redirects:'1',...params});
 for(let n=0;n<3;n++){const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(r.status===429&&n<2){await new Promise(r=>setTimeout(r,15000));continue;}if(!r.ok)throw Error('API '+r.status);const j=await r.json();if(!j.query)throw Error(JSON.stringify(j));await delay();return j.query;}}
const missing=people.filter(x=>!cache.pages[x[1]]);
if(missing.length){const q=await query('en.wikipedia.org',{titles:missing.map(x=>x[1]).join('|'),prop:'pageimages',piprop:'thumbnail|name',pithumbsize:330,pilicense:'free'}),aliases=new Map([...(q.normalized??[]),...(q.redirects??[])].map(x=>[x.from,x.to]));
 for(const [,title]of missing){let t=title;for(let i=0;i<5&&aliases.has(t);i++)t=aliases.get(t);const p=Object.values(q.pages).find(x=>x.title===t);if(!p?.pageimage)throw Error('No portrait '+title);cache.pages[title]=p;}await save();}
const files=[...people.map(x=>cache.pages[x[1]].pageimage),...empires.map(x=>x[2]).filter(Boolean)].filter(f=>!cache.files[norm(f)]);
for(let i=0;i<files.length;i+=30){const q=await query('commons.wikimedia.org',{titles:files.slice(i,i+30).map(f=>'File:'+f).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:330});
 for(const p of Object.values(q.pages))if(p.imageinfo)cache.files[norm(p.title.slice(5))]=p.imageinfo[0];else console.log('MISSING',p.title);
 for(const r of q.redirects??[])cache.files[norm(r.from.slice(5))]=cache.files[norm(r.to.slice(5))];await save();}
if(!process.argv.includes('--write')){console.log('Prepared',people.length,'people,',empires.length,'states');process.exit();}
const m=await read('public/catalog/manifest.json'),seed=await read('scripts/catalog-seed.json');
const strip=s=>(s??'').replace(/<[^>]*>/g,'').replaceAll('&amp;','&').trim();
async function add(category,name,title,file,note,design){
 const id=category+'-'+crypto.createHash('sha1').update(title).digest('hex').slice(0,10),sidecar='public/catalog/'+id+'.json';
 let item;try{item=await read(sidecar);}catch{}
 if(!item){item={id,category,name,englishName:title,fit:category==='empires'?'flag':'cover',curated:true,historicalNote:note,keywords:title+' '+note,identitySource:'https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_'))};
 if(file){const info=cache.files[norm(file)];if(!info)throw Error('Missing file '+file);const url=info.thumburl??info.url,r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(file+': '+r.status);const mime=r.headers.get('content-type'),ext=mime.includes('jpeg')?'jpg':mime.includes('png')?'png':mime.includes('svg')?'svg':null;if(!ext)throw Error('MIME '+mime);
 item.src='/catalog/'+id+'.'+ext;await fs.writeFile('public'+item.src,Buffer.from(await r.arrayBuffer()));Object.assign(item,{source:info.descriptionurl,credit:strip(info.extmetadata?.Artist?.value)||'Wikimedia Commons',license:strip(info.extmetadata?.LicenseShortName?.value),licenseUrl:info.extmetadata?.LicenseUrl?.value??'',downloadUrl:url});if(!item.license)throw Error('No license '+title);await delay();
 }else{item.src='/catalog/'+id+'.svg';const censored=design==='censored';
 const art=censored?'<rect width="300" height="200" fill="#c8202b"/><circle cx="150" cy="100" r="65" fill="#fff"/><rect x="87" y="76" width="126" height="48" rx="4" fill="#171717"/><text x="150" y="106" text-anchor="middle" fill="white" font-family="sans-serif" font-size="17" font-weight="bold">SANSÜRLÜ</text>':`<rect width="300" height="200" fill="${design}"/>`;
 await fs.writeFile('public'+item.src,`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><title>${name}</title>${art}</svg>`);
 Object.assign(item,{source:item.identitySource,credit:'Marble Studio · '+(censored?'sansürlü temsil':'temsili hanedan rengi'),license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',generated:true,...(censored?{censored:true}: {})});}
 await fs.writeFile(sidecar,JSON.stringify(item,null,2)+'\n');}
 if(!m.items.some(x=>x.id===id))m.items.push(item);const g=seed.find(x=>x.id===category);if(!g.items.some(x=>x[1]===title))g.items.push([name,title]);console.log('Added',name);
}
for(const [name,title,region]of people)await add('politicians',name,title,cache.pages[title].pageimage,region+' · siyasetçi');
for(const [name,title,file,note,design]of empires)await add('empires',name,title,file,note,design);
await fs.writeFile('public/catalog/manifest.json',JSON.stringify(m,null,2)+'\n');await fs.writeFile('scripts/catalog-seed.json',JSON.stringify(seed,null,2)+'\n');
console.log('Published:',m.items.filter(x=>x.category==='politicians').length,'politicians;',m.items.filter(x=>x.category==='empires').length,'empires/states');
