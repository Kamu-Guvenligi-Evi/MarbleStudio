import { VISUAL_SCALES } from './middle-earth-visual-profiles.js';
// Stable IDs share the existing army save format and combat presets.
// Height is a gameplay presentation ratio, not a claim about canonical heights.
const root = '/warrior-references/middle-earth/';
const tor = 'https://www.theonering.com/';
const generated = name => ({image:`/warrior-sprites/middle-earth/${name}-portrait.webp`, source:`/warrior-sprites/middle-earth/${name}.webp`, generated:true});
export const MIDDLE_EARTH_IMAGES = {
  ...Object.fromEntries(['theoden','eomer','boromir','faramir','saruman','thranduil','haldir','dain','shelob','mumakil'].map(name=>[name,generated(name)])),
  elrond: generated('elrond'), ent: generated('ent'), nazgul: generated('nazgul'),
  rohirrim: generated('rohirrim'), gondor_cavalry: generated('gondor-cavalry'),
  dwarf_ram_rider: generated('dwarf-ram-rider'), elf_stag_rider: generated('elf-stag-rider'), azog_warg: generated('azog-warg'),
  aragorn: {...generated('aragorn'), drawn:true},
  legolas: {...generated('legolas'), drawn:true},
  gimli: {...generated('gimli'), drawn:true},
  gandalf: { file: 'fellowship-meduseld.jpg', source: tor + 'rotk-legolas-gimli-gandalf-and-aragorn-new-line-cinema/', crop: [310,177,210,490] },
  sauron: { file: 'sauron-candidate.png', source: 'https://www.pngkit.com/bigpic/u2e6q8y3y3y3q8q8/', cutout: true },
  witchking: { file: 'witchking-preview.png', source: 'https://officialpsds.com/witch-king-angmar-lord-of-the-rings-psd-721wx4', cutout: true },
  gondor: { file: 'gondor-film.png', source: tor + 'complete-list-of-film-changes/the-return-of-the-king/', crop: [182,40,50,99] },
  rohan: { file: 'rohan-film.jpg', source: 'https://www.elfenomeno.com/en/info/ver/2527/rohirrim-soldiers-at-helm-alongside-the-refugees', crop: [220,40,200,370] },
  uruk: { file: 'uruk-film.png', source: tor + 'complete-list-of-film-changes/the-fellowship-of-the-ring/', crop: [245,18,30,100] },
  orc: { file: 'orc-film.jpg', source: tor + 'complete-list-of-film-changes/the-two-towers/', crop: [55,65,72,145] },
  elf: { file: 'elf-film.jpg', source: tor + 'complete-list-of-film-changes/the-two-towers/', crop: [190,40,65,133] },
  dwarf: { file: 'dwarf-film.png', source: 'https://www.indiedb.com/members/lorddainironfoot/images/iron-hills-soldier', crop: [100,0,600,752] },
  troll: { file: 'troll-film.jpg', source: tor + 'complete-list-of-film-changes/the-fellowship-of-the-ring/', crop: [150,0,150,159] },
  balrog: { file: 'balrog-film.jpg', source: tor + 'complete-list-of-film-changes/the-fellowship-of-the-ring/', crop: [138,0,160,130] },
};
function unit(id, name, faction, kind, role, art, heightScale = 1, combat = {}, hero = false) {
  const reference = {...generated(id.replaceAll('_','-')), drawn:true};
  return {
    id: `me_${id}`, name, faction, kind, role: `${hero ? 'Kahraman · ' : ''}${role}`,
    hero, universe: 'middle-earth', art, heightScale, combat,
    image: reference.image || root + reference.file, source: reference.source,
    credit: reference.drawn ? 'Oyunun yerel çizim tarzında hazırlanmış karakter' : reference.generated ? 'Oyun için üretilmiş çizim' : 'Görsel kaynağı', color: '#a58c55',
    note: 'Yüzüklerin Efendisi / Hobbit · Oyun dengelemesi kurmacadır.',
    visualNote: reference.generated ? 'Oyun için üretilmiş altı pozlu çizim; bekleme, hareket ve saldırı animasyonları.' : 'Savaşta tam boy, hareketli oyun çizimi kullanılır. Referans sekmesindeki uyarlama görseli yalnız görsel kaynaktır.',
    license: reference.drawn ? 'Proje için hazırlanmış stilize oyun çizimi; karakter hakları ilgili sahiplerine aittir.' : reference.generated ? 'Yapay zekâ ile üretilmiş oyun çizimi; resmî uyarlama görseli değildir.' : 'Görsel hakları ilgili sahiplerine aittir; kaynak sitesi bir yeniden kullanım lisansı sağlamaz.',
  };
}
export const MIDDLE_EARTH_UNITS = [
  // Armored troops trade attack tempo for durability; heroes/giants retain their
  // separate power tier. Regression matchups: tests/middle-earth-balance.mjs.
  unit('gondor_swordsman', 'Gondor Kılıçlısı', 'Gondor', 'sword', 'Kılıçlı piyade', 'gondor', 1, { armor: .24 }),
  unit('gondor_spearman', 'Gondor Mızraklısı', 'Gondor', 'spear', 'Mızraklı piyade', 'gondor', 1, { armor: .2 }),
  unit('gondor_veteran', 'Gondor Seçkin Askeri', 'Gondor', 'sword', 'Seçkin piyade', 'gondor', 1, { hp: 170, damage: 29, cooldown: 1.1, armor: .26 }),
  unit('rohan_warrior', 'Rohan Savaşçısı', 'Rohan', 'sword', 'Yaya savaşçı', 'rohan', 1, { speed: 27 }),
  unit('uruk_swordsman', 'Uruk-hai Kılıçlısı', 'Isengard', 'sword', 'Ağır piyade', 'uruk', 1.05, { hp: 165, damage: 30, armor: .2 }),
  unit('uruk_pikeman', 'Uruk-hai Kargıcısı', 'Isengard', 'spear', 'Uzun kargılı piyade', 'uruk', 1.05, { hp: 145, reach: 36, armor: .18 }),
  unit('uruk_warg_rider', 'Uruk-hai Warg Binicisi', 'Isengard', 'cavalry', 'Sırtlan görünümlü Warg üzerinde zırhlı binici', 'uruk', 1, { hp: 205, damage: 30, armor: .18, speed: 40, reach: 24, chargeDamage: 51, cooldown: 1.3 }),
  unit('mordor_orc', 'Mordor Orku', 'Mordor', 'sword', 'Ork piyadesi', 'orc', .88, { hp: 95, damage: 20, speed: 26 }),
  unit('lorien_elf', 'Lórien Elf Savaşçısı', 'Elfler', 'sword', 'Elf piyadesi', 'elf', 1.03, { hp: 125, speed: 29, cooldown: .8 }),
  unit('iron_hills_dwarf', 'Demir Tepeler Cücesi', 'Cüceler', 'sword', 'Zırhlı cüce piyadesi', 'dwarf', .67, { hp: 175, speed: 19, armor: .28, damage: 34, cooldown: 1.25 }),
  unit('iron_hills_veteran', 'Demir Tepeler Seçkin Cücesi', 'Cüceler', 'sword', 'Seçkin cüce piyadesi', 'dwarf', .67, { hp: 210, speed: 18, armor: .3, damage: 34, cooldown: 1.25 }),
  unit('aragorn', 'Aragorn', 'Orta Dünya Kahramanları', 'sword', 'Kılıç ustası', 'aragorn', 1, { hp: 650, damage: 65, cooldown: .7, armor: .24, speed: 29 }, true),
  unit('legolas', 'Legolas', 'Orta Dünya Kahramanları', 'ranged', 'Elf okçusu', 'legolas', 1.03, { hp: 380, damage: 42, reach: 235, cooldown: .65, speed: 32 }, true),
  unit('gimli', 'Gimli', 'Orta Dünya Kahramanları', 'sword', 'Cüce balta ustası', 'gimli', .67, { hp: 750, damage: 78, cooldown: 1.05, armor: .34, speed: 21 }, true),
  unit('gandalf', 'Gandalf', 'Orta Dünya Kahramanları', 'sword', 'Asa ve Glamdring · yakın dövüş', 'gandalf', 1, { hp: 550, damage: 70, reach: 30, cooldown: 1.6, splash: 26 }, true),
  unit('sauron', 'Sauron', 'Orta Dünya Kahramanları', 'sword', 'Karanlık Lord', 'sauron', 1.25, { visualScale: 1.4, hp: 1600, damage: 120, reach: 30, cooldown: 1.8, armor: .38, splash: 30, speed: 18 }, true),
  unit('witch_king', 'Witch-king · Angmar’ın Cadı Kralı', 'Orta Dünya Kahramanları', 'sword', 'Nazgûl efendisi', 'witchking', 1.13, { visualScale: 1.12, hp: 950, damage: 85, reach: 25, cooldown: 1.25, armor: .28 }, true),
  unit('cave_troll', 'Mağara Trolü', 'Orta Dünya Yaratıkları', 'sword', 'Büyük düşman', 'troll', 1.3, { hp: 1000, damage: 70, reach: 34, cooldown: 1.8, splash: 24, speed: 18 }),
  unit('balrog', 'Balrog', 'Orta Dünya Yaratıkları', 'sword', 'Büyük düşman', 'balrog', 1.32, { visualScale: 3.5, hp: 1800, damage: 100, reach: 42, cooldown: 2, splash: 40, speed: 19 }),
];
// Append only: existing army keys and foot variants remain unchanged.
MIDDLE_EARTH_UNITS.push(
  unit('elrond', 'Elrond', 'Orta Dünya Kahramanları', 'sword', 'Elf kılıç ustası', 'elrond', 1.03, {visualScale:1.4,hp:620,damage:62,cooldown:.75,armor:.26,speed:29}, true),
  unit('ent', 'Ent', 'Orta Dünya Yaratıkları', 'sword', 'Ağaç çobanı · alan vuruşu', 'ent', 1.3, {visualScale:2.65,hp:1300,damage:80,reach:38,cooldown:2.3,splash:36,armor:.18,speed:15}),
  unit('nazgul', 'Nazgûl · Kara Süvari', 'Mordor', 'cavalry', 'Kara atlı kılıçlı süvari', 'nazgul', 1, {visualScale:1.6,hp:360,damage:38,armor:.2,speed:41,chargeDamage:65}),
  unit('rohirrim', 'Rohirrim', 'Rohan', 'cavalry', 'Atlı mızraklı · hücum süvarisi', 'rohirrim', 1, {visualScale:1.65,hp:210,damage:28,reach:29,armor:.18,speed:44,chargeDamage:64}),
  unit('gondor_cavalry', 'Gondor Zırhlı Süvarisi', 'Gondor', 'cavalry', 'Atlı mızraklı · zırhlı süvari', 'gondor_cavalry', 1, {visualScale:1.55,hp:245,damage:30,reach:29,armor:.28,speed:38,chargeDamage:59,cooldown:1.25}),
  unit('dwarf_ram_rider', 'Demir Tepeler Koç Süvarisi', 'Cüceler', 'cavalry', 'Koç üzerinde baltalı cüce', 'dwarf_ram_rider', .85, {visualScale:1.25,hp:255,damage:32,armor:.3,speed:34,chargeDamage:60,cooldown:1.4}),
  unit('elf_stag_rider', 'Elf Geyik Süvarisi', 'Elfler', 'cavalry', 'Geyik üzerinde elf kılıçlısı', 'elf_stag_rider', 1, {visualScale:1.55,hp:200,damage:30,armor:.15,speed:46,chargeDamage:56,cooldown:1}),
  unit('azog_warg', 'Azog · Beyaz Warg', 'Orta Dünya Kahramanları', 'cavalry', 'Beyaz Warg üzerinde topuzlu ork', 'azog_warg', 1, {visualScale:1.65,hp:850,damage:72,armor:.23,speed:43,chargeDamage:88,cooldown:1.25}, true),
);
MIDDLE_EARTH_UNITS.push(
  unit('theoden', 'Théoden', 'Orta Dünya Kahramanları', 'cavalry', 'Atlı kral · kılıç ve kalkan', 'theoden', 1, {visualScale:1.65,hp:640,damage:53,armor:.28,speed:39,chargeDamage:78,cooldown:1.2}, true),
  unit('eomer', 'Éomer', 'Orta Dünya Kahramanları', 'cavalry', 'Rohan atlı komutanı · kılıç ve kalkan', 'eomer', 1, {visualScale:1.65,hp:660,damage:57,armor:.25,speed:44,chargeDamage:84,cooldown:1.1}, true),
  unit('boromir', 'Boromir', 'Orta Dünya Kahramanları', 'sword', 'Gondor kılıç ve kalkan ustası', 'boromir', 1, {visualScale:1.35,hp:720,damage:61,armor:.3,speed:26,cooldown:.9}, true),
  unit('faramir', 'Faramir', 'Orta Dünya Kahramanları', 'ranged', 'Ithilien yaya okçusu', 'faramir', 1, {visualScale:1.35,hp:420,damage:36,reach:215,cooldown:1.05,armor:.12,speed:29}, true),
  unit('saruman', 'Saruman', 'Orta Dünya Kahramanları', 'sword', 'Asa · yakın alan vuruşu', 'saruman', 1, {visualScale:1.4,hp:580,damage:65,reach:31,cooldown:1.8,splash:28,speed:23}, true),
  unit('thranduil', 'Thranduil', 'Orta Dünya Kahramanları', 'cavalry', 'Büyük geyik üzerinde elf kılıç ustası', 'thranduil', 1, {visualScale:1.75,hp:650,damage:59,armor:.24,speed:44,chargeDamage:76,cooldown:1}, true),
  unit('haldir', 'Haldir', 'Orta Dünya Kahramanları', 'sword', 'Lórien elf kılıç komutanı', 'haldir', 1.03, {visualScale:1.4,hp:510,damage:51,armor:.25,speed:29,cooldown:.8}, true),
  unit('dain', 'Dáin Demirayak', 'Orta Dünya Kahramanları', 'cavalry', 'Zırhlı yaban domuzu üzerinde çekiçli cüce', 'dain', .85, {visualScale:1.4,hp:920,damage:76,armor:.34,speed:34,chargeDamage:90,cooldown:1.4}, true),
  unit('shelob', 'Shelob', 'Orta Dünya Yaratıkları', 'sword', 'Dev örümcek · yakın ısırık', 'shelob', 1, {visualScale:2.1,hp:1100,damage:85,reach:30,cooldown:1.45,armor:.15,speed:32}),
  unit('mumakil', 'Mûmakil', 'Orta Dünya Yaratıkları', 'elephant', 'Dev savaş fili · alan ezme saldırısı', 'mumakil', 1.3, {visualScale:3.4,hp:2200,damage:95,reach:44,cooldown:2.5,splash:44,armor:.19,speed:16,chargeDamage:85}),
);
// Visual proportions share the historical infantry/cavalry baseline. Combat stats stay intact.
Object.assign(MIDDLE_EARTH_UNITS.find(entry => entry.id === 'me_azog_warg'), {
  image:'/warrior-sprites/middle-earth/azog-warg-portrait.webp',
  source:'https://www.wetanz.com/us/azog-the-defiler-on-warg',
  sources:[{title:'Weta Workshop — Azog the Defiler on Warg',url:'https://www.wetanz.com/us/azog-the-defiler-on-warg'}],
  visualNote:'Weta heykeli referans alınarak çizilmiş özgün oyun karakteri: iri, soluk tenli ve yara izli Azog, demir kanca kol ve ağır topuz. Beyaz Warg için kürklü omuz, güçlü çene, dişler, pençeli patiler ve eklemli bacaklar.',
});
const wargRider = MIDDLE_EARTH_UNITS.find(entry => entry.id === 'me_uruk_warg_rider');
Object.assign(wargRider, {
  image: '/warrior-sprites/middle-earth/uruk-warg-rider-portrait.webp',
  source: 'https://www.zbrushcentral.com/t/interview-ben-mauro/334929',
  sources: [
    {title:'Ben Mauro — sırtlan ve kurt görünümlü Warg tasarımları',url:'https://www.zbrushcentral.com/t/interview-ben-mauro/334929'},
    {title:'Isengard ordusunda Warg binicileri',url:'https://www.warhammer-community.com/en-gb/articles/sjZ0P8uD/middle-earth-faction-focus-isengard/'},
  ],
  note: 'Orta Dünya · Isengard Warg süvarisi. Uruk-hai zırhlı binici bu oyun için uyarlamadır; filmdeki bütün Warg binicilerinin Uruk-hai olduğu iddia edilmez.',
  visualNote: 'Yüzüklerin Efendisi tasarımındaki sırtlanı andıran Warg: yüksek omuz, alçalan sağrı, kısa kuyruk, iri çene ve koyu yele. Koyu levha zırhlı binici, beyaz el işaretli kalkan ve pala; özgün hareketli oyun çizimi.',
});
for (const entry of MIDDLE_EARTH_UNITS) {
  if (VISUAL_SCALES[entry.id]) entry.combat.visualScale = VISUAL_SCALES[entry.id];
}
export const MIDDLE_EARTH_BY_ID = Object.fromEntries(MIDDLE_EARTH_UNITS.map(unit => [unit.id, unit]));
