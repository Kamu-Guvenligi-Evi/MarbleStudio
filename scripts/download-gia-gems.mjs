import fs from 'node:fs/promises';
const assets=[['amethyst','https://www.gia.edu/dam/gemstones/amethyst/overview/amethyst.png'],['topaz','https://www.gia.edu/dam/migrated-assets/images/polished-topaz.png'],['turquoise','https://www.gia.edu/dam/gemstones/turquoise/Photos-Videos/polished-turquoise.png']];
for(const [name,url] of assets){const r=await fetch(url);if(!r.ok)throw Error(r.status);const b=Buffer.from(await r.arrayBuffer());await fs.writeFile(`public/merge-cutouts/gia-${name}.png`,b);console.log(name,b.length);}
await fs.writeFile('artifacts/gia-gem-sources.json',JSON.stringify(assets));
