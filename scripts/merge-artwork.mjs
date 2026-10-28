import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import {MERGE_THEMES} from '../src/merge-themes.js';
const dir='public/merge-art';await fs.mkdir(dir,{recursive:true});
const video='C:/Users/yigit/Videos/Ekran Kayıtları/Ekran Kaydı 2026-10-28 112031.mp4';
const reference=[['skull',45,250,92,36],['lantern',45,307,342,54],['spider',45,400,352,60],['batman',45,140,342,82],['iron',45,80,434,100],['hulk',50,214,479,126],['superman',50,283,341,196],['gauntlet',58,109,369,252]];
const manifest={};
for(const [id,time,x,y,size]of reference){const file=`${dir}/reference-${id}.png`;const result=spawnSync(ffmpeg,['-v','error','-y','-ss',String(time),'-i',video,'-vf',`crop=${size}:${size}:${x}:${y}`,'-frames:v','1',file],{windowsHide:true});if(result.status)throw new Error(result.stderr.toString());}
manifest.reference=reference.map(([id])=>({src:`/merge-art/reference-${id}.png`,source:'Kullanıcının referans videosu',reference:true}));
const titles={
avengers:'Black Widow (Natasha Romanova)|Hawkeye (Clint Barton)|Captain America|Iron Man|Black Panther (Marvel Comics)|Hulk|Thor (Marvel Comics)|Carol Danvers',
justice:'Green Arrow|Cyborg (DC Comics)|Aquaman|Flash (Barry Allen)|Green Lantern|Batman|Wonder Woman|Superman',
gotham:'Robin (character)|Batgirl|Nightwing|Catwoman|Riddler|Two-Face|Joker (character)|Batman',
planets:'Mercury (planet)|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune',
cosmos:'Meteoroid|Moon|Earth|Sun|Star cluster|Galaxy|Galaxy cluster|Observable universe',
'sun-life':'Orion Nebula|Protostar|Sun|Red giant|Planetary nebula|White dwarf',
'massive-star':'Molecular cloud|Protostar|Blue supergiant|Red supergiant|Supernova|Black hole',
missions:'Sputnik 1|Vostok 1|Apollo 11|Space Shuttle|International Space Station|Mars rover|James Webb Space Telescope|Space Launch System',
moons:'Phobos (moon)|Deimos (moon)|Europa (moon)|Moon|Io (moon)|Callisto (moon)|Titan (moon)|Ganymede (moon)',
'first-elements':'Hydrogen|Helium|Lithium|Beryllium|Boron|Carbon|Nitrogen|Oxygen',
'noble-gases':'Helium|Neon|Argon|Krypton|Xenon|Radon|Oganesson',
alkali:'Lithium|Sodium|Potassium|Rubidium|Caesium|Francium',
halogens:'Fluorine|Chlorine|Bromine|Iodine|Astatine|Tennessine',
metals:'Aluminium|Iron|Nickel|Copper|Silver|Platinum|Gold|Iridium',
gems:'Fluorite|Labradorite|Lazurite|Almandine|Topaz|Emerald|Ruby|Diamond',
butterfly:'Butterfly egg|Caterpillar|Pupa|Monarch butterfly',
reef:'Polyp|Coral|Shrimp|Crab|Clownfish|Sea turtle|Reef shark|Coral reef',
ocean:'Shrimp|Crab|Fish|Octopus|Sea turtle|Dolphin|Shark|Blue whale',
dinosaurs:'Compsognathus|Velociraptor|Ankylosaurus|Stegosaurus|Triceratops|Allosaurus|Tyrannosaurus|Titanosaurus',
garden:'Seed|Seedling|Leaf|Bud|Flower|Apple|Tree|Forest',
weather:'Dew|Fog|Cloud|Rain|Snow|Lightning|Tornado|Rainbow',
fruit:'Strawberry|Cherry|Plum|Apricot|Peach|Pear|Apple|Melon',
berries:'Redcurrant|Blueberry|Raspberry|Blackberry|Strawberry|Grape',
orchard:'Cherry|Plum|Apricot|Peach|Pear|Apple',
harvest:'Seed|Seedling|Apple blossom|Apple|Apple|Basket|Harvest',
strings:'Ukulele|Mandolin|Guitar|Violin|Viola|Cello|Double bass|Harp',
winds:'Whistle|Flute|Clarinet|Oboe|Bassoon|Trumpet|Saxophone|Tuba',
rhythm:'Cymbal|Tambourine|Bongo drum|Snare drum|Bass drum|Marimba|Timpani|Drum kit',
orchestra:'Flute|Clarinet|Violin|Cello|Trumpet|Harp|Piano|Pipe organ',
dragon:'Spark (fire)|Egg|Lizard|Wyvern|Dragon|Ice dragon|Chinese dragon|Dragon',
wizard:'Spark (fire)|Magician (fantasy)|Grimoire|Potion|Crystal ball|Magic wand|Merlin|Magic circle',
knight:'Wooden sword|Shield|Helmet|Sword|Knight|Military commander|King|Crown (headgear)',
fire:'Ember|Spark (fire)|Flame|Torch|Fireball|Lava|Phoenix (mythology)|Sun',
ice:'Drop (liquid)|Frost|Snowflake|Ice|Quartz|Iceberg|Dragon|Crown (headgear)',
forest:'Spore|Mushroom|Moss|Seedling|Tree|Ent|Fairy|World tree',
shadow:'Shadow|Ghost|Bat|Human skull|Black Knight (Arthurian legend)|Curse|Dragon|Crown (headgear)',
treasure:'Copper coin|Silver coin|Gold coin|Key (lock)|Money bag|Treasure chest|Gemstone|Crown Jewels of the United Kingdom',
robots:'Screw|Gear|Printed circuit board|Electric battery|Robotic arm|Robot|Mecha|Artificial intelligence',
city:'Brick|Tent|Hut|House|Apartment|Skyscraper|Castle|Metropolis',
vehicles:'Wheel|Skateboard|Bicycle|Motorcycle|Car|Formula One car|High-speed rail|Rocket',
candy:'Sugar|Candy|Lollipop|Cookie|Doughnut|Cupcake|Cake|Gingerbread house',
chess:'Pawn (chess)|Knight (chess)|Bishop (chess)|Rook (chess)|Queen (chess)|King (chess)',
'sea-quest':'Seashell|Compass|Map|Anchor|Rowing boat|Sailing ship|Pirate|Treasure chest'
};
const aliases={'Butterfly egg':'Insect egg','Apple blossom':'Apple','Ice dragon':'Dragon','Fireball':'Fire breathing','Copper coin':'Coin','Rowing boat':'Rowing','Treasure chest':'Treasure','Spark (fire)':'Spark (fire)','Black Knight (Arthurian legend)':'Black knight'};
const requested=[...new Set(Object.values(titles).flatMap(x=>x.split('|')).map(x=>aliases[x]||x))];
const pages=new Map();
for(let offset=0;offset<requested.length;offset+=40){const batch=requested.slice(offset,offset+40);const url=new URL('https://en.wikipedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',prop:'pageimages',piprop:'thumbnail|name',pithumbsize:'256',pilicense:'any',redirects:'1',titles:batch.join('|')});const r=await fetch(url);if(!r.ok)throw new Error(`Metadata ${r.status}`);const data=await r.json();const redirects=new Map((data.query.redirects||[]).map(x=>[x.from,x.to]));for(const title of batch){let canonical=title;for(let i=0;i<4&&redirects.has(canonical);i++)canonical=redirects.get(canonical);const page=Object.values(data.query.pages).find(x=>x.title===canonical);if(page?.thumbnail)pages.set(title,page);}}
const downloaded=new Map(),missing=[];let bytes=0;
for(const title of requested){const page=pages.get(title);if(!page){missing.push(title);continue;}const id='wiki-'+String(requested.indexOf(title)).padStart(3,'0'),extension=page.thumbnail.source.split('?')[0].split('.').pop().toLowerCase(),file=`${dir}/${id}.${extension}`;let exists=false;try{exists=(await fs.stat(file)).size>0;}catch{}
 if(!exists){const r=await fetch(page.thumbnail.source);if(!r.ok){missing.push(`${title}: HTTP ${r.status}`);continue;}const data=Buffer.from(await r.arrayBuffer());if(data.length>600000){missing.push(`${title}: oversized`);continue;}bytes+=data.length;await fs.writeFile(file,data);}
 downloaded.set(title,{src:`/merge-art/${id}.${extension}`,source:`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ','_'))}`,fileSource:`https://en.wikipedia.org/wiki/File:${encodeURIComponent(page.pageimage)}`,title:page.title});
}
for(const [id,list]of Object.entries(titles))manifest[id]=list.split('|').map(title=>downloaded.get(aliases[title]||title)||null);
for(const [id,start]of [['grass-pokemon',1],['fire-pokemon',4],['water-pokemon',7],['bug-pokemon',10]]){manifest[id]=[];for(let n=start;n<start+3;n++){const padded=String(n).padStart(3,'0'),src=`/merge-art/pokemon-${padded}.png`,url=`https://www.pokemon.com/static-assets/content-assets/cms2/img/pokedex/detail/${padded}.png`;try{await fs.stat('public'+src);}catch{const r=await fetch(url);if(!r.ok)throw new Error(`Pokemon ${n}: ${r.status}`);const data=Buffer.from(await r.arrayBuffer());bytes+=data.length;await fs.writeFile('public'+src,data);}manifest[id].push({src,source:'https://www.pokemon.com/pokedex/'+n});}}
await fs.writeFile(dir+'/manifest.json',JSON.stringify(manifest,null,2));
await fs.writeFile(dir+'/missing.json',JSON.stringify(missing,null,2));
console.log(JSON.stringify({themes:Object.keys(manifest).length,downloaded:downloaded.size,downloadedFileBytes:bytes,missing,counts:MERGE_THEMES.filter(t=>manifest[t.id]?.length!==t.stages.length).map(t=>({id:t.id,expected:t.stages.length,actual:manifest[t.id]?.length}))}));
