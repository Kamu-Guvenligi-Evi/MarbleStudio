import fs from 'node:fs/promises';
import {MERGE_IMAGES} from '../src/merge-image-manifest.js';
const bounds=JSON.parse(await fs.readFile('artifacts/gia-gem-bounds.json','utf8'));
const urls=JSON.parse(await fs.readFile('artifacts/gia-gem-sources.json','utf8'));
const gia=name=>({subject:name[0].toUpperCase()+name.slice(1),src:`/merge-cutouts/gia-${name}.png`,source:urls.find(r=>r[0]===name)[1],file:'GIA Gem Encyclopedia',cutout:true,bounds:bounds.find(r=>r.name===name).bounds});
const old=MERGE_IMAGES.gems;
MERGE_IMAGES.gems=[gia('amethyst'),gia('topaz'),{...old[0],subject:'Sapphire'},{...old[1],subject:'Emerald'},{...old[2],subject:'Ruby'},{...old[4],subject:'Diamond'}];
await fs.writeFile('src/merge-image-manifest.js','export const MERGE_IMAGES = '+JSON.stringify(MERGE_IMAGES,null,2)+';\n');
let s=await fs.readFile('src/merge-themes.js','utf8');
s=s.replace("'Safir:*|Zümrüt:*|Yakut:*|Pembe elmas:*|Elmas:*|Elmas koleksiyonu:*'", "'Amethyst:*|Topaz:*|Sapphire:*|Emerald:*|Ruby:*|Diamond:*','Artan oyun değeri; gerçek fiyatlar kalite, boyut ve işleme göre değişir.'");
// Video labels use English. Keep the studio menus in the user's language.
const translations={Kurukafa:'Skull','Sonsuzluk Eldiveni':'Infinity Gauntlet','Merkür':'Mercury','Venüs':'Venus','Jüpiter':'Jupiter','Uranüs':'Uranus','Neptün':'Neptune',Ay:'Moon','Yıldız':'Star','Yıldız kümesi':'Star Cluster','Galaksi kümesi':'Galaxy Cluster','Evren':'Universe','Bulutsu':'Nebula','Önyıldız':'Protostar','Ana kol yıldızı':'Main Sequence Star','Kırmızı dev':'Red Giant','Gezegenimsi bulutsu':'Planetary Nebula','Beyaz cüce':'White Dwarf','Gaz bulutu':'Gas Cloud','Dev yıldız':'Massive Star','Kırmızı süperdev':'Red Supergiant','Süpernova':'Supernova','Kara delik':'Black Hole','Havai fişek':'Firework','İlk roket':'Early Rocket','Gezegen sondası':'Space Probe','Yıldız yolcusu':'Star Voyager',Karides:'Shrimp','Yengeç':'Crab','Ahtapot':'Octopus','Kaplumbağa':'Turtle','Köpekbalığı':'Shark',Balina:'Whale','Çilek':'Strawberry',Kiraz:'Cherry','Kayısı':'Apricot','Şeftali':'Peach',Elma:'Apple',Kavun:'Melon','Frenk üzümü':'Redcurrant','Yaban mersini':'Blueberry',Ahududu:'Raspberry','Böğürtlen':'Blackberry','Üzüm':'Grape',Erik:'Plum',Armut:'Pear',Tohum:'Seed',Fide:'Seedling','Çiçek':'Flower','Küçük meyve':'Young Fruit','Olgun meyve':'Ripe Fruit',Hasat:'Harvest',Gitar:'Guitar',Keman:'Violin','Çello':'Cello',Arp:'Harp','Flüt':'Flute',Klarnet:'Clarinet',Obua:'Oboe',Fagot:'Bassoon',Trompet:'Trumpet',Zil:'Cymbal',Tef:'Tambourine',Trampet:'Snare Drum',Davul:'Bass Drum',Bateri:'Drum Kit',Piyano:'Piano'};
for(const [tr,en]of Object.entries(translations))s=s.replaceAll(tr+':',en+':');
await fs.writeFile('src/merge-themes.js',s);
for(const p of ['src/merge-evolution-app.js','src/merge-evolution-video.js']){let code=await fs.readFile(p,'utf8');code=code.replace("{win:'sparkle'}","{complete:'sparkle'}").replace("e.type==='final'?'win':'multiply'","e.type==='final'?'complete':'multiply'");await fs.writeFile(p,code);}
console.log('Six gem stages: Amethyst, Topaz, Sapphire, Emerald, Ruby, Diamond.');
