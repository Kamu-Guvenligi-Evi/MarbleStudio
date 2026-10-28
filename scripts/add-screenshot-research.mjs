import fs from 'node:fs';

const researchPath = 'docs/historical-elite-research-2026-10-14.json';
const visualPath = 'src/historical-unit-visuals.json';
const research = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
const visuals = JSON.parse(fs.readFileSync(visualPath, 'utf8'));
const sources = {
  rus_druzhyna_ieu: {
    title: 'Internet Encyclopedia of Ukraine — Druzhyna',
    url: 'https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CD%5CR%5CDruzhynaIT.htm',
    access: 'Madde metni incelendi; prens maiyeti, ordunun çekirdeği ve muhafızlık işlevi.'
  },
  met_armour_faq: {
    title: 'The Metropolitan Museum of Art — Arms and Armor: Common Misconceptions',
    url: 'https://www.metmuseum.org/essays/arms-and-armor-common-misconceptions-and-frequently-asked-questions',
    access: 'Zırhı yalnız şövalyelerin giymediğini açıklayan 1. bölüm incelendi.'
  },
  talhoffer_1459: {
    title: 'Hans Talhoffer — Alte Armatur und Ringkunst, 1459, yaprak görseli 076',
    url: 'https://commons.wikimedia.org/wiki/File:De_Alte_Armatur_und_Ringkunst_Talhofer_076.jpg',
    access: 'Danimarka Kraliyet Kütüphanesi kaynaklı dönem çizimi ve kamu malı lisansı incelendi; zırhlı yaya düellosu.'
  }
};
Object.assign(research.sources, sources);
const additions = [
  {
    id: 'rus_druzhina', faction: 'Kiev Rus ve Rus Prenslikleri',
    name: 'Drujina — prensin savaşçı maiyeti', period: '10.–13. yy seçkisi',
    kind: 'prens maiyeti', mount: 'mixed', status: 'ana',
    historicalNote: 'Prensin yakın hizmetindeki savaşçı maiyeti; seferlerde ordunun çekirdeğini oluştururdu. Oyunda atlı mızraklı temsil kullanılır.',
    equipmentDraft: 'Atlı mızrak ve kılıç temsili; bütün drujina mensupları için tek tip teçhizat iddiası değildir.',
    sourceIds: ['rus_druzhyna_ieu'], visualSourceIds: [],
    caution: 'Bizans Varang Muhafızı ile aynı kurum değildir. Ekran görüntüsündeki mavi savaşçıyla eşleşmesi doğrulanmadı.'
  },
  {
    id: 'german_armoured_foot', faction: 'Kutsal Roma İmparatorluğu',
    name: 'Zırhlı yaya savaşçı — Alman toprakları', period: '15. yy seçkisi',
    kind: 'zırhlı savaşçı temsili', mount: 'foot', status: 'ana',
    historicalNote: 'Alman topraklarından dönem düello çizimine dayanan zırhlı yaya savaşçı temsili. Adı belgelenmiş tek bir alay veya muhafız birliği değildir.',
    equipmentDraft: 'Levha zırh ve yakın dövüş kılıcı; dönem çizimindeki düello teçhizatı bütün ordulara genellenmez.',
    sourceIds: ['talhoffer_1459', 'met_armour_faq'], visualSourceIds: ['talhoffer_1459'],
    caution: 'Her zırhlı asker şövalye değildir. Görseldeki sarı kartal arması veya yeşil kıyafet bu kaydın kesin kimlik kanıtı sayılmadı.'
  }
];
for (const unit of additions) {
  const index = research.units.findIndex(item => item.id === unit.id);
  if (index >= 0) research.units[index] = unit;
  else research.units.push(unit);
}
Object.assign(visuals, {
  rus_druzhina: {
    image: '/warrior-references/elite-rus-druzhina.jpg',
    credit: 'V. Prohorov, 1884; Devlet Tarih Müzesi taraması / Wikimedia Commons',
    source: 'https://commons.wikimedia.org/wiki/File:Prince_Vladimir_Varangian_Druzhina.jpg',
    visualNote: 'Vladimir ve drujinasını gösteren 1884 tarihli tarihî tasvir. Çağdaş üniforma belgesi veya kullanıcı ekran görüntüsünün kaynağı değildir.',
    license: 'Kamu malı — Commons PD-Russia / PD-scan'
  },
  german_armoured_foot: {
    image: '/warrior-references/elite-german-armoured-foot.jpg',
    credit: 'Hans Talhoffer, Alte Armatur und Ringkunst, 1459; Det Kongelige Bibliotek / Wikimedia Commons',
    source: sources.talhoffer_1459.url,
    visualNote: '1459 tarihli zırhlı yaya düellosu çizimi. Bir alayın standart üniformasını veya sarı kartallı karakterin kimliğini göstermez.',
    license: 'Kamu malı — PD-old-100-expired / Public Domain Mark'
  }
});
fs.writeFileSync(researchPath, JSON.stringify(research, null, 2) + '\n');
fs.writeFileSync(visualPath, JSON.stringify(visuals, null, 2) + '\n');
console.log(JSON.stringify({ addedUnitIds: additions.map(unit => unit.id), researchUnits: research.units.length }));
