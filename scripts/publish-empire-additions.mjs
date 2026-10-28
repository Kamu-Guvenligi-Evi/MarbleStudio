import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const read=async path=>JSON.parse(await fs.readFile(path,'utf8'));
const batch=process.argv[2]??'empire';
if(!/^[a-z-]+$/.test(batch))throw Error('Invalid batch name');
const rows=await read(`artifacts/${batch}-additions.json`);
const {query}=await read(`artifacts/${batch}-addition-files.json`);
const aliases=new Map([...(query.normalized??[]),...(query.redirects??[])].map(x=>[x.from,x.to]));
const manifest=await read('public/catalog/manifest.json'),seed=await read('scripts/catalog-seed.json');
const strip=s=>(s??'').replace(/<[^>]*>/g,'').replaceAll('&amp;','&').trim();
let bytes=0,added=0;
for(const [name,title,file,note,fit='flag']of rows){
 let key='File:'+file;for(let n=0;n<5&&aliases.has(key);n++)key=aliases.get(key);
 const info=Object.values(query.pages).find(p=>p.title===key)?.imageinfo?.[0];
 if(!info){console.log('Skipped unavailable source:',title);continue;}
 const id='empires-'+crypto.createHash('sha1').update(title).digest('hex').slice(0,10);
 if(manifest.items.some(x=>x.id===id))continue;
 const license=strip(info.extmetadata?.LicenseShortName?.value);if(!license)throw Error('Missing license: '+title);
 const url=info.thumburl??info.url,response=await fetch(url,{signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(title+': HTTP '+response.status);
 const mime=response.headers.get('content-type'),ext=mime.includes('png')?'png':mime.includes('jpeg')?'jpg':mime.includes('svg')?'svg':null;
 if(!ext)throw Error('Unsupported image '+mime);
 const data=Buffer.from(await response.arrayBuffer());bytes+=data.length;
 const item={id,category:'empires',name,englishName:title,fit,curated:true,historicalNote:note,keywords:title+' '+note,identitySource:'https://en.wikipedia.org/wiki/'+encodeURIComponent(title.replaceAll(' ','_')),src:'/catalog/'+id+'.'+ext,source:info.descriptionurl,credit:strip(info.extmetadata?.Artist?.value)||'Wikimedia Commons',license,licenseUrl:info.extmetadata?.LicenseUrl?.value??'',downloadUrl:url};
 await fs.writeFile('public'+item.src,data);await fs.writeFile('public/catalog/'+id+'.json',JSON.stringify(item,null,2)+'\n');
 manifest.items.push(item);const group=seed.find(x=>x.id==='empires');if(!group.items.some(x=>x[1]===title))group.items.push([name,title]);added++;
 // Persist each completed download so reruns do not transfer it again.
 await fs.writeFile('public/catalog/manifest.json',JSON.stringify(manifest,null,2)+'\n');await fs.writeFile('scripts/catalog-seed.json',JSON.stringify(seed,null,2)+'\n');
 await new Promise(resolve=>setTimeout(resolve,500));
}
console.log(JSON.stringify({added,total:manifest.items.filter(x=>x.category==='empires').length,imageFileBytes:bytes}));
