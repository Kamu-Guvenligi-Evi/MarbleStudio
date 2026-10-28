// Research helper: caches small Commons metadata responses; never fetches originals.
import fs from 'node:fs/promises';
const dir = 'artifacts/elite-visual-research';
await fs.mkdir(dir, { recursive: true });
const clean = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
for (const query of process.argv.slice(2)) {
  const key = query.replace(/[^a-z0-9_-]/gi, '_');
  const file = `${dir}/${key}.json`;
  let records;
  try { records = JSON.parse(await fs.readFile(file, 'utf8')); }
  catch {
    await new Promise(resolve => setTimeout(resolve, 3200));
    const url = new URL('https://commons.wikimedia.org/w/api.php');
    url.search = new URLSearchParams({action:'query',generator:'search',gsrsearch:query+' -filetype:pdf -filetype:djvu',gsrnamespace:'6',gsrlimit:'7',prop:'imageinfo',iiprop:'url|extmetadata|size',iiurlwidth:'360',format:'json'});
    const response = await fetch(url, {signal:AbortSignal.timeout(20000)});
    if (!response.ok) { console.log(JSON.stringify({query,error:`HTTP ${response.status}`})); if(response.status===429) break; else continue; }
    const data = await response.json();
    records = Object.values(data.query?.pages || {}).sort((a,b)=>a.index-b.index).map(p=>{
      const i=p.imageinfo?.[0]||{}, m=i.extmetadata||{};
      return {title:p.title,pageId:p.pageid,source:i.descriptionurl,thumbnail:i.thumburl,original:i.url,width:i.width,height:i.height,originalBytes:i.size,description:clean(m.ImageDescription?.value).slice(0,1800),artist:clean(m.Artist?.value),credit:clean(m.Credit?.value),date:clean(m.DateTimeOriginal?.value),license:clean(m.LicenseShortName?.value),licenseUrl:m.LicenseUrl?.value||null,attributionRequired:m.AttributionRequired?.value||null};
    });
    await fs.writeFile(file, JSON.stringify(records,null,2)+'\n');
  }
  console.log(JSON.stringify({query,records:records.map(r=>({title:r.title,description:r.description.slice(0,220),license:r.license}))}));
}
