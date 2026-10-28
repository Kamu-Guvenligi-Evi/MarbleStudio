import fs from 'node:fs/promises';
import crypto from 'node:crypto';
// Name, article identity, searchable field. Existing portraits remain intact.
const additions=[
 ['Osman Gazi','Osman I','Osmanlı · hükümdar'],['Orhan Gazi','Orhan','Osmanlı · hükümdar'],
 ['Yıldırım Bayezid','Bayezid I','Osmanlı · hükümdar'],['Yavuz Sultan Selim','Selim I','Osmanlı · hükümdar'],
 ['II. Abdülhamid','Abdul Hamid II','Osmanlı · hükümdar'],['Alp Arslan','Alp Arslan','Selçuklu · hükümdar'],
 ['Melikşah','Malik-Shah I','Selçuklu · hükümdar'],['Timur','Timur','Orta Asya · hükümdar'],
 ['Babür Şah','Babur','Hindistan · hükümdar'],['Ekber Şah','Akbar','Hindistan · hükümdar'],
 ['Şah İsmail','Ismail I','Safevî · hükümdar'],['Selahaddin Eyyubi','Saladin','Eyyûbî · hükümdar'],
 ['Barbaros Hayreddin Paşa','Hayreddin Barbarossa','Osmanlı · denizci'],['Piri Reis','Piri Reis','Osmanlı · haritacı ve denizci'],
 ['Mimar Sinan','Mimar Sinan','Osmanlı · mimar'],['Sabiha Gökçen','Sabiha Gökçen','Türkiye · havacı'],
 ['Halide Edib Adıvar','Halide Edib Adıvar','Türkiye · yazar'],['Nene Hatun','Nene Hatun','Osmanlı · tarihî kahraman'],
 ['Mevlânâ','Rumi','Anadolu · şair ve düşünür'],['Yunus Emre','Yunus Emre','Anadolu · şair'],
 ['Hacı Bektaş Veli','Haji Bektash Veli','Anadolu · düşünür'],['İbn Haldun','Ibn Khaldun','Kuzey Afrika · tarihçi'],
 ['Farabi','Al-Farabi','Orta Asya · filozof'],['Harezmi','Al-Khwarizmi','Orta Asya · matematikçi'],
 ['Biruni','Al-Biruni','Orta Asya · bilim insanı'],['Uluğ Bey','Ulugh Beg','Orta Asya · astronom'],
 ['Ömer Hayyam','Omar Khayyam','İran · şair ve matematikçi'],['İbn Rüşd','Averroes','Endülüs · filozof'],
 ['Sokrates','Socrates','Antik Yunan · filozof'],['Platon','Plato','Antik Yunan · filozof'],
 ['Aristoteles','Aristotle','Antik Yunan · filozof'],['Arşimet','Archimedes','Antik Yunan · matematikçi'],
 ['Konfüçyüs','Confucius','Çin · filozof'],['Sun Tzu','Sun Tzu','Çin · askerî düşünür'],
 ['Augustus','Augustus','Roma · hükümdar'],['Marcus Aurelius','Marcus Aurelius','Roma · hükümdar ve filozof'],
 ['Hannibal','Hannibal','Kartaca · komutan'],['II. Ramses','Ramesses II','Mısır · firavun'],
 ['Hatşepsut','Hatshepsut','Mısır · firavun'],['Büyük Kiros','Cyrus the Great','Pers · hükümdar'],
 ['Aşoka','Ashoka','Hindistan · hükümdar'],['Qin Shi Huang','Qin Shi Huang','Çin · hükümdar'],
 ['Wu Zetian','Wu Zetian','Çin · hükümdar'],['Kubilay Han','Kublai Khan','Çin ve Moğolistan · hükümdar'],
 ['Jeanne d’Arc','Joan of Arc','Fransa · askerî lider'],['I. Elizabeth','Elizabeth I','İngiltere · hükümdar'],
 ['Büyük Katerina','Catherine the Great','Rusya · hükümdar'],['Büyük Petro','Peter the Great','Rusya · hükümdar'],
 ['George Washington','George Washington','ABD · devlet insanı'],['Simón Bolívar','Simón Bolívar','Güney Amerika · bağımsızlık lideri'],
 ['Mahatma Gandhi','Mahatma Gandhi','Hindistan · bağımsızlık lideri'],['Nelson Mandela','Nelson Mandela','Güney Afrika · devlet insanı'],
 ['Martin Luther King Jr.','Martin Luther King Jr.','ABD · insan hakları savunucusu'],['Rosa Parks','Rosa Parks','ABD · insan hakları savunucusu'],
 ['Harriet Tubman','Harriet Tubman','ABD · kölelik karşıtı aktivist'],['Frederick Douglass','Frederick Douglass','ABD · yazar ve aktivist'],
 ['Galileo Galilei','Galileo Galilei','İtalya · astronom'],['Johannes Kepler','Johannes Kepler','Almanya · astronom'],
 ['Charles Darwin','Charles Darwin','İngiltere · doğa bilimci'],['Ada Lovelace','Ada Lovelace','İngiltere · matematikçi'],
 ['Alan Turing','Alan Turing','İngiltere · matematikçi'],['Rosalind Franklin','Rosalind Franklin','İngiltere · kimyager'],
 ['Louis Pasteur','Louis Pasteur','Fransa · bilim insanı'],['Florence Nightingale','Florence Nightingale','İngiltere · hemşire ve istatistikçi'],
 ['Dmitri Mendeleyev','Dmitri Mendeleev','Rusya · kimyager'],['Katherine Johnson','Katherine Johnson','ABD · matematikçi'],
 ['Ludwig van Beethoven','Ludwig van Beethoven','Almanya · besteci'],['Wolfgang Amadeus Mozart','Wolfgang Amadeus Mozart','Avusturya · besteci'],
 ['Johann Sebastian Bach','Johann Sebastian Bach','Almanya · besteci'],['William Shakespeare','William Shakespeare','İngiltere · oyun yazarı'],
 ['Fyodor Dostoyevski','Fyodor Dostoevsky','Rusya · yazar'],['Lev Tolstoy','Leo Tolstoy','Rusya · yazar'],
 ['Jane Austen','Jane Austen','İngiltere · yazar'],['Mary Shelley','Mary Shelley','İngiltere · yazar'],
 ['Rabindranath Tagore','Rabindranath Tagore','Hindistan · şair'],['Frida Kahlo','Frida Kahlo','Meksika · ressam'],
 ['Vincent van Gogh','Vincent van Gogh','Hollanda · ressam'],['Michelangelo','Michelangelo','İtalya · sanatçı'],
 ['İbn Battuta','Ibn Battuta','Fas · gezgin'],['Marco Polo','Marco Polo','Venedik · gezgin'],
];
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const cachePath='artifacts/history-source-metadata.json';let cache={pages:{},files:{}};
try{cache=await read(cachePath);}catch{}
const save=()=>fs.writeFile(cachePath,JSON.stringify(cache,null,2));
const pause=()=>new Promise(r=>setTimeout(r,1300));
async function query(host,params){
 const u=new URL(`https://${host}/w/api.php`);u.search=new URLSearchParams({action:'query',format:'json',redirects:'1',...params});
 for(let attempt=0;attempt<3;attempt++){
  const r=await fetch(u,{headers:{'User-Agent':'MarbleStudio/0.3 (local portrait library)'},signal:AbortSignal.timeout(30000)});
  if(r.status===429&&attempt<2){await new Promise(r=>setTimeout(r,15000));continue;}
  if(!r.ok)throw Error('Source API '+r.status);const j=await r.json();if(!j.query)throw Error(JSON.stringify(j));await pause();return j.query;
 }
}
const missing=additions.filter(x=>!cache.pages[x[1]]);
for(let start=0;start<missing.length;start+=35){
 const batch=missing.slice(start,start+35),j=await query('en.wikipedia.org',{titles:batch.map(x=>x[1]).join('|'),prop:'pageimages|extracts',piprop:'thumbnail|name',pithumbsize:330,pilicense:'free',exintro:'1',explaintext:'1',exsentences:2,exlimit:'max'});
 const pages=Object.values(j.pages),aliases=new Map([...(j.normalized??[]),...(j.redirects??[])].map(r=>[r.from,r.to]));
 for(const [,title]of batch){let t=title;for(let i=0;i<5&&aliases.has(t);i++)t=aliases.get(t);const p=pages.find(x=>x.title===t);if(!p?.thumbnail)throw Error('No free portrait: '+title);cache.pages[title]=p;}
 await save();console.log('Identity sources',Math.min(start+35,missing.length),'/',missing.length);
}
const overrides={'Mimar Sinan':'Mimar_Sinan_monument_in_2024_6024.jpg','Haji Bektash Veli':'Hacibektas-01-mihalorel.jpg'};
for(const [title,file]of Object.entries(overrides))cache.pages[title].pageimage=file;
await save();
const files=additions.map(x=>cache.pages[x[1]].pageimage).filter(f=>!cache.files[f.replaceAll(' ','_')]);
for(let start=0;start<files.length;start+=35){
 const j=await query('commons.wikimedia.org',{titles:files.slice(start,start+35).map(f=>'File:'+f).join('|'),prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:330});
 for(const p of Object.values(j.pages))if(p.imageinfo)cache.files[p.title.slice(5).replaceAll(' ','_')]=p.imageinfo[0];
 for(const r of j.redirects??[])cache.files[r.from.slice(5).replaceAll(' ','_')]=cache.files[r.to.slice(5).replaceAll(' ','_')];
 await save();console.log('Portrait credits',Math.min(start+35,files.length),'/',files.length);
}
if(!process.argv.includes('--write')){console.log('Ready',additions.length);process.exit();}
const manifest=await read('public/catalog/manifest.json'),seed=await read('scripts/catalog-seed.json'),group=seed.find(x=>x.id==='history');
const strip=s=>(s??'').replace(/<[^>]*>/g,'').replaceAll('&amp;','&').trim();
for(const [name,title,field]of additions){
 const p=cache.pages[title],info=cache.files[p.pageimage.replaceAll(' ','_')];if(!info)throw Error('No Commons license: '+title);
 const meta=info.extmetadata,license=strip(meta?.LicenseShortName?.value);if(!license)throw Error('No license: '+title);
 const id='history-'+crypto.createHash('sha1').update(title).digest('hex').slice(0,10),path='public/catalog/'+id+'.json';
 let item;try{item=await read(path);}catch{}
 if(!item){
  const url=info.thumburl??p.thumbnail.source,r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error(title+': '+r.status);
  const mime=r.headers.get('content-type')??'',ext=mime.includes('jpeg')?'jpg':mime.includes('png')?'png':mime.includes('webp')?'webp':null;if(!ext)throw Error('Unexpected image '+mime);
  const src='/catalog/'+id+'.'+ext;await fs.writeFile('public'+src,Buffer.from(await r.arrayBuffer()));
  item={id,category:'history',name,englishName:title,src,fit:'cover',source:info.descriptionurl,identitySource:'https://en.wikipedia.org/wiki/'+encodeURIComponent(p.title.replaceAll(' ','_')),credit:strip(meta.Artist?.value)||strip(meta.Credit?.value),license,licenseUrl:meta.LicenseUrl?.value??'',downloadUrl:url,curated:true,historicalNote:field,keywords:title+' '+field};
  const photoTitles=['Abdul Hamid II','Sabiha Gökçen','Halide Edib Adıvar'];
  if(additions.findIndex(x=>x[1]===title)<48&&!photoTitles.includes(title))item.historicalNote+=' · Sanatsal tasvir';
  if(title==='Ashoka')item.historicalNote=field+' · Sanchi kabartması';
  if(title==='Saladin')item.historicalNote=field+' · Tarihî sikke';
  if(title==='Timur')item.historicalNote=field+' · Rekonstrüksiyon büstü';
  await fs.writeFile(path,JSON.stringify(item,null,2)+'\n');await pause();
 }
 if(!manifest.items.some(x=>x.id===id))manifest.items.push(item);
 if(!group.items.some(x=>x[1]===title))group.items.push([name,title]);
 console.log('Added',name);
}
await fs.writeFile('public/catalog/manifest.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('scripts/catalog-seed.json',JSON.stringify(seed,null,2)+'\n');
console.log('Published',group.items.length,'historical people');
