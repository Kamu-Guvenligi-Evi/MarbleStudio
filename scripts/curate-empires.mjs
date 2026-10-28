// Explicit historical selections: never infer a flag from an article thumbnail.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const entries = [
 ['Ottoman Empire',null,'1844–1922 · Osmanlı bayrağı'],
 ['Roman Empire','Vexilloid of the Roman Empire.svg','Roma vexillum yorumu · modern temsili sancak'],
 ['Byzantine Empire','Byzantine imperial flag, 14th century.svg','14. yüzyıl · Palaiologos deniz sancağı'],
 ['Seljuk Empire','Flag of the Seljuks.svg','Modern atıf · tarihî devlet bayrağı değildir'],
 ['Mongol Empire',null,'Dokuz ak tuğ · temsili çizim, ulusal bayrak değil'],
 ['British Empire',null,'1707–1800 · Büyük Britanya Birlik Bayrağı'],
 ['Russian Empire',null,'1896–1917 · Rus üç renkli bayrağı'],
 ['Austria-Hungary',null,'1914 · ortak arma; ortak devlet bayrağı yoktu'],
 ['German Empire',null,'1871–1918 · siyah, beyaz, kırmızı'],
 ['Mughal Empire','Flag of the Mughal Empire.png','Alam sancağı · tarihî resimlerden yeniden çizim'],
 ['Safavid Iran',null,'Safevîlere atfedilen sancak · tek tip ulusal bayrak değil'],
 ['Achaemenid Empire','Standard of Cyrus the Great.svg','Kartallı sancak · modern rekonstrüksiyon'],
 ['Inca Empire',null,'Suntur paucar · hükümdarlık alametinin tasviri'],
 ['Aztec Empire','Tenochtitlan Glyph ZP.svg','Tenochtitlan şehir glifi · devlet bayrağı değil'],
 ['Qing dynasty',null,'1889–1912 · sarı ejderha bayrağı'],
 ['Timurid Empire','TimuridFlag attributed.svg','Modern atfedilen bayrak · tarihî bayrak değildir'],
 ['First French Empire','Flag of France (1794–1815, 1830–1974).svg','1804–1814 / 1815 · Fransız üç renkli bayrağı','Fransız İmparatorluğu'],
 ['Spanish Empire','Flag of Spain (1785–1873, 1875–1931).svg','1785–1873 · İspanyol deniz ve devlet bayrağı','İspanyol İmparatorluğu'],
 ['Portuguese Empire','Flag of Portugal (1830–1910).svg','1830–1910 · Portekiz Krallığı bayrağı','Portekiz İmparatorluğu'],
 ['Empire of Brazil','Bandeira Imperial oficial (com heráldica certa).svg','1850–1889 · yirmi yıldızlı imparatorluk bayrağı','Brezilya İmparatorluğu'],
 ['Austrian Empire','Flag of the Habsburg Monarchy.svg','1804–1867 · Habsburg siyah-sarı renkleri','Avusturya İmparatorluğu'],
 ['Empire of Japan','Flag of Japan (1870–1999).svg','1870–1945 · imparatorluk döneminin Hinomaru bayrağı','Japon İmparatorluğu'],
 ['Ethiopian Empire','Flag of Ethiopia (1897–1914).svg','1897–1914 · Menelik döneminin bayrağı','Etiyopya İmparatorluğu'],
 ['Korean Empire','Flag of Korea (1899).svg','1899 · Kore İmparatorluğu Taegeukgi bayrağı','Kore İmparatorluğu'],
];
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const manifest=await read('public/catalog/manifest.json'),seed=await read('scripts/catalog-seed.json');
const group=seed.find(x=>x.id==='empires');
const cachePath='artifacts/empire-source-metadata.json';
let cache={};try{cache=await read(cachePath);}catch{}
const needed=entries.map(x=>x[1]).filter(file=>file&&!cache[file]);
if(needed.length){
 const u=new URL('https://commons.wikimedia.org/w/api.php');
 u.search=new URLSearchParams({action:'query',format:'json',redirects:'1',titles:needed.map(file=>'File:'+file).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:330});
 const response=await fetch(u);if(!response.ok)throw Error(response.status);
 const j=await response.json();
 for(const p of Object.values(j.query.pages)){const info=p.imageinfo?.[0];if(info)cache[p.title.slice(5)]=info;else console.log('MISSING',p.title);}
 for(const r of j.query.redirects??[])cache[r.from.slice(5)]=cache[r.to.slice(5)];
}
await fs.writeFile(cachePath,JSON.stringify(cache,null,2));
if(!process.argv.includes('--write')){
 for(const [title,file]of entries)if(file)console.log(title+': '+(cache[file]?.extmetadata?.ImageDescription?.value??'MISSING').replace(/<[^>]*>/g,'').slice(0,450));
 process.exit();
}
const strip=s=>(s??'').replace(/<[^>]*>/g,'');
for(const [title,file,note,newName]of entries){
 const pair=group.items.find(x=>x[1]===title);
 const id='empires-'+crypto.createHash('sha1').update(title).digest('hex').slice(0,10);
 const item=manifest.items.find(x=>x.id===id)??{id,category:'empires',name:newName};
 if(title==='Mongol Empire'){
  const poles=Array.from({length:9},(_,i)=>{const x=30+i*30,y=i===4?22:58+Math.abs(i-4)*7;return `<path d="M${x} ${y}v205" stroke="#cfaa60" stroke-width="4"/><path d="M${x} ${y-14}l-6 17h12z" fill="#cfaa60"/><path d="M${x-9} ${y+19}q9 -13 18 0l5 74q-14 -13 -28 0z" fill="#f5f3e6" stroke="#b9c8ce" stroke-width="2"/>`;}).join('');
  item.src='/catalog/'+id+'-historical.svg';
  await fs.writeFile('public'+item.src,`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" rx="150" fill="#22374a"/>${poles}</svg>`);
  Object.assign(item,{source:'https://acta.bibl.u-szeged.hu/67901/1/altaica_053.pdf',credit:'Marble Studio · dokuz ak tuğ temsili çizimi',license:'CC0-1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',generated:true});
  delete item.downloadUrl;
 }
 if(file){
  const info=cache[file];if(!info)throw Error('Missing '+file);
  const url=info.thumburl??info.url;
  const response=await fetch(url);if(!response.ok)throw Error(file+': '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());
  const ext=response.headers.get('content-type')?.includes('svg')?'svg':response.headers.get('content-type')?.includes('jpeg')?'jpg':'png';
  item.src='/catalog/'+id+'-historical.'+ext;
  await fs.writeFile('public'+item.src,bytes);
  Object.assign(item,{source:info.descriptionurl,credit:strip(info.extmetadata?.Artist?.value),license:strip(info.extmetadata?.LicenseShortName?.value),licenseUrl:info.extmetadata?.LicenseUrl?.value??'',downloadUrl:url,fileOverride:file});
  await new Promise(resolve=>setTimeout(resolve,1100));
 }
 Object.assign(item,{fit:'flag',historicalNote:note,curated:true});
 await fs.writeFile('public/catalog/'+id+'.json',JSON.stringify(item,null,2)+'\n');
 if(!manifest.items.some(x=>x.id===id))manifest.items.push(item);
 if(!pair)group.items.push([newName,title]);
}
await fs.writeFile('public/catalog/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('scripts/catalog-seed.json',JSON.stringify(seed,null,2)+'\n');
console.log('Curated',entries.length,'empires');
