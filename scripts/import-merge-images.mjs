import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {MERGE_THEMES} from '../src/merge-themes.js';
// Explicit subjects avoid unrelated search hits. Download small previews only.
const subjects={
 reference:'Skull|Green Lantern|Spider-Man|Batman|Iron Man|Hulk|Superman|Infinity Gauntlet',
 avengers:'Black Widow (Natasha Romanova)|Hawkeye (Clint Barton)|Captain America|Iron Man|Black Panther (Marvel Comics)|Hulk|Thor (Marvel Comics)|Captain Marvel (Marvel Comics)',
 justice:'Green Arrow|Cyborg (DC Comics)|Aquaman|Flash (Barry Allen)|Green Lantern|Batman|Wonder Woman|Superman',
 gotham:'Robin (character)|Barbara Gordon|Nightwing|Catwoman|Riddler|Two-Face|Joker (character)|Batman',
 'fire-pokemon':'Charmander|Charmeleon|Charizard','water-pokemon':'Squirtle|Wartortle|Blastoise','grass-pokemon':'Bulbasaur|Ivysaur|Venusaur','bug-pokemon':'Caterpie|Metapod|Butterfree',
 planets:'Mercury (planet)|Venus|Earth|Mars|Jupiter|Saturn|Uranus|Neptune',
 cosmos:'Meteoroid|Moon|Earth|Star|Star cluster|Galaxy|Galaxy cluster|Observable universe',
 'sun-life':'Nebula|Protostar|Sun|Red giant|Planetary nebula|White dwarf',
 'massive-star':'Molecular cloud|Protostar|Massive star|Red supergiant|Supernova|Black hole',
 missions:'Fireworks|V-2 rocket|Sputnik 1|Explorer 1|Apollo 11|International Space Station|Voyager 1|',
 moons:'Moon|Phobos (moon)|Deimos (moon)|Io (moon)|Europa (moon)|Ganymede (moon)|Titan (moon)|Triton (moon)',
 'first-elements':'Hydrogen|Helium|Lithium|Beryllium|Boron|Carbon|Nitrogen|Oxygen',
 'noble-gases':'Helium|Neon|Argon|Krypton|Xenon|Radon|Oganesson',
 alkali:'Lithium|Sodium|Potassium|Rubidium|Caesium|Francium',
 halogens:'Fluorine|Chlorine|Bromine|Iodine|Astatine|Tennessine',
 metals:'Aluminium|Iron|Nickel|Copper|Silver|Platinum|Gold|Iridium',
 gems:'Fluorite|Labradorite|Lazurite|Almandine|Topaz|Emerald|Ruby|Diamond',
 butterfly:'Butterfly egg|Caterpillar|Pupa|Butterfly',
 reef:'Polyp (zoology)|Coral|Shrimp|Crab|Coral reef fish|Sea turtle|Shark|Coral reef',
 ocean:'Shrimp|Crab|Fish|Octopus|Sea turtle|Dolphin|Shark|Whale',
 dinosaurs:'Compsognathus|Velociraptor|Ankylosaurus|Stegosaurus|Triceratops|Allosaurus|Tyrannosaurus|Titanosauria',
 garden:'Seed|Seedling|Leaf|Bud|Flower|Apple|Tree|Forest',
 weather:'Dew|Fog|Cloud|Rain|Snow|Lightning|Tornado|Rainbow',
 fruit:'Strawberry|Cherry|Plum|Apricot|Peach|Pear|Apple|Melon',
 berries:'Redcurrant|Blueberry|Raspberry|Blackberry|Strawberry|Grape',
 orchard:'Cherry|Plum|Apricot|Peach|Pear|Apple',
 harvest:'Seed|Seedling|Flower|Green apple|Apple|Basket|Harvest',
 strings:'Ukulele|Mandolin|Guitar|Violin|Viola|Cello|Double bass|Harp',
 winds:'Whistle|Flute|Clarinet|Oboe|Bassoon|Trumpet|Saxophone|Tuba',
 rhythm:'Cymbal|Tambourine|Bongo drum|Snare drum|Bass drum|Marimba|Timpani|Drum kit',
 orchestra:'Flute|Clarinet|Violin|Cello|Trumpet|Harp|Piano|Pipe organ',
 city:'Brick|Tent|Hut|House|Apartment building|Skyscraper|Castle|Metropolis',
 vehicles:'Wheel|Skateboard|Bicycle|Motorcycle|Car|Formula One car|High-speed rail|Rocket',
 chess:'Pawn (chess)|Knight (chess)|Bishop (chess)|Rook (chess)|Queen (chess)|King (chess)',
};
await fs.mkdir('public/merge-images',{recursive:true});
const cachePath='artifacts/merge-image-pages.json';let pages={};try{pages=JSON.parse(await fs.readFile(cachePath,'utf8'));}catch{}
const titles=[...new Set(Object.values(subjects).flatMap(s=>s.split('|')).filter(Boolean))];
for(let i=0;i<titles.length;i+=20){const batch=titles.slice(i,i+20).filter(t=>!Object.hasOwn(pages,t));if(!batch.length)continue;
 const url=new URL('https://en.wikipedia.org/w/api.php');url.search=new URLSearchParams({action:'query',format:'json',redirects:'1',prop:'pageimages',piprop:'thumbnail|name',pilicense:'any',pithumbsize:'240',titles:batch.join('|')});
 let response;for(let n=0;n<4;n++){response=await fetch(url,{signal:AbortSignal.timeout(30000)});if(response.status!==429)break;await new Promise(r=>setTimeout(r,16000));}if(!response.ok)throw Error(response.status);await new Promise(r=>setTimeout(r,1800));const {query}=await response.json();
 const aliases=new Map([...(query.normalized??[]),...(query.redirects??[])].map(r=>[r.from,r.to]));
 for(const title of batch){let key=title;for(let n=0;n<6&&aliases.has(key);n++)key=aliases.get(key);pages[title]=Object.values(query.pages).find(p=>p.title===key)??{};}
 await fs.writeFile(cachePath,JSON.stringify(pages,null,2));
}
const records={},missing=[];
for(const title of titles){const p=pages[title];if(!p.thumbnail){missing.push(title);continue;}
 if(/Pok.mon_logo/.test(p.pageimage??'')){missing.push(title);continue;}
 const url=p.thumbnail.source,ext=new URL(url).pathname.split('.').at(-1).toLowerCase();if(!['jpg','jpeg','png','webp','gif'].includes(ext)){missing.push(title);continue;}
 const src='/merge-images/'+crypto.createHash('sha1').update(title).digest('hex').slice(0,12)+'.'+ext;
 try{await fs.access('public'+src);}catch{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok){missing.push(title);continue;}const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>900000){missing.push(title);continue;}await fs.writeFile('public'+src,bytes);}
 records[title]={src,subject:title,source:'https://en.wikipedia.org/wiki/'+encodeURIComponent(p.title.replaceAll(' ','_')),file:p.pageimage,downloadUrl:url};
}
const result={};for(const theme of MERGE_THEMES){const list=subjects[theme.id]?.split('|');if(list)result[theme.id]=list.map(title=>records[title]??null);}
for(const [theme,ids] of Object.entries({'fire-pokemon':[4,5,6],'water-pokemon':[7,8,9],'grass-pokemon':[1,2,3],'bug-pokemon':[10,11,12]})){result[theme]=[];for(const id of ids){const src='/merge-images/pokemon-'+id+'.png',url='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/'+id+'.png';try{await fs.access('public'+src);}catch{const r=await fetch(url);if(!r.ok)throw Error('Pokemon '+id);await fs.writeFile('public'+src,Buffer.from(await r.arrayBuffer()));}result[theme].push({src,subject:MERGE_THEMES.find(t=>t.id===theme).stages[result[theme].length].name,source:'https://www.pokemon.com/us/pokedex/'+id,file:'Official artwork',downloadUrl:url});}}
await fs.writeFile('src/merge-image-manifest.js','// Local subject previews; source/file credits accompany each image.\nexport const MERGE_IMAGES='+JSON.stringify(result,null,2)+';\n');
console.log(JSON.stringify({subjects:Object.keys(records).length,themes:Object.keys(result).length,missing}));
