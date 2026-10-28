// Ancient service contingents; equipment interpretations are identified in cards.
const ARRIAN = 'https://en.wikisource.org/wiki/The_Anabasis_of_Alexander/Book_III/Chapter_XII';
const POLYBIUS = 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Polybius/15*.html';
const DIODORUS = 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Diodorus_Siculus/5B*.html';
const make = (id, name, faction, period, kind, role, note, visualNote, combat, sources) => ({
  id, name, faction, period, kind, role, note: `${period} · ${note}`, visualNote, combat, sources,
  source: sources[0].url, color: '#947953',
  credit: 'Özgün oyun çizimi; kaynakta belirtilmeyen donanım, kesim ve renkler dönemsel yorum',
});
const arrian = [{ title: 'Arrianos, Anabasis 3.12 — Gaugamela kanatları', url: ARRIAN }];
export const COMMANDER_ALLIED_CONTINGENTS_UNITS = [
  make('alexander_greek_mercenary_infantry', 'İskender’in Yunan paralı piyadesi', 'Yunan şehir devletleri', 'MÖ 4. yy', 'spear', 'Kalkanlı kanat piyadesi',
    'Arrianos 3.12, Kleandros komutasındaki kıdemli paralı askerleri sağ kanattaki okçuların yanında kaydeder. Kart bu piyade kontenjanını temsil eder; Thermopylai müttefik hoplitleriyle aynı birlik değildir.',
    'Yuvarlak aspis, mızrak, bronz miğfer ve açık renk gövde zırhı dönemsel yorumdur. Arrianos burada donanımın malzemesini veya üniformasını belirtmez.',
    { hp: 126, damage: 24, reach: 31, cooldown: 1.35, speed: 24, armor: .19 }, arrian),
  make('alexander_greek_mercenary_cavalry', 'İskender’in Yunan paralı süvarisi', 'Yunan şehir devletleri', 'MÖ 4. yy', 'cavalry', 'Mızraklı kanat karşı hücumu',
    'Arrianos 3.12, Menidasın Yunan paralı süvarilerine çevirmeye gelen düşmanın yanına saldırma emrini aktarır; Andromakhosun sol kanat paralı süvarilerini de kaydeder. İkisi ayrı kopya kartlar yerine aynı hizmet türünde temsil edilir.',
    'Geniş kenarlı açık miğfer, bronz gövdelik, kısa pelerin ve mızrak dönemsel yorumdur; kaynak bu kontenjanın kesin donanımını vermez. Üzengi çizilmez.',
    { hp: 150, damage: 26, reach: 27, cooldown: 1.45, speed: 41, armor: .17, chargeDamage: 38 }, arrian),
  make('alexander_odrysian_cavalry', 'Odris müttefik süvarisi', 'Traklar', 'MÖ 4. yy', 'cavalry', 'Hafif müttefik süvari kanadı',
    'Arrianos 3.12, Tyrimmas oğlu Agathonun Odris süvarilerini İskenderin sol kanadında kaydeder. Trak yaya ciritçilerinden ayrı bir atlı kontenjandır; tüm Odrisler elit muhafız sayılmaz.',
    'Trak başlığı, desenli zeira pelerini ve mızrak dönemsel yorumdur; bu birliğin tek tip üniforması belgelenmiş değildir. Hafif gövde, yüksek çizmeler ve üzengisiz at çizilir.',
    { hp: 132, damage: 23, reach: 26, cooldown: 1.3, speed: 45, armor: .05, chargeDamage: 32 }, arrian),
  make('hannibal_ligurian_infantry', 'Hannibal’ın Ligur piyadesi', 'Ligurlar / Kartaca hizmeti', 'MÖ 202, Zama', 'sword', 'Uzun kalkanlı paralı piyade',
    'Polybios 15.11, Zamada fillerin gerisindeki paralı askerler arasında Ligurları sayar. Diodoros 5.39.7 daha geç bir tarihte uzun kalkan, kuşaklı giysi, hayvan postu ve orta uzunlukta kılıç anlatır; bu tasvir doğrudan Zama üniforması değildir.',
    'Uzun ahşap kalkan, kuşaklı tunik, omuz postu ve orta uzunlukta kılıç. Diodorosun daha geç tasviri görsel dayanak olarak yorumlanır; saç, renkler ve kalkanın kesin kesimi temsilidir.',
    { hp: 108, damage: 25, reach: 20, cooldown: 1.1, speed: 28, armor: .06 },
    [{ title: 'Polybios 15.11 — Zama paralı piyadeleri', url: POLYBIUS }, { title: 'Diodoros 5.39.7 — Ligur donanımı, daha geç tasvir', url: DIODORUS }]),
];
export const COMMANDER_ALLIED_CONTINGENTS_PROFILES = {
  alexander_greek_mercenary_infantry: { head: 'allyGreekHelmet', armor: 'allyLinen', weapon: 'spear', shield: 'allyAspis', cloth: '#827462', skin: '#bd9775', bareLegs: true },
  alexander_greek_mercenary_cavalry: { head: 'allyBoeotian', armor: 'allyBronze', weapon: 'crLance', cloth: '#78827b', cape: '#6c7772', skin: '#bd9775', horse: 'bay', bareLegs: true, noStirrups: true },
  alexander_odrysian_cavalry: { head: 'allyThracianCap', armor: 'allyZeira', weapon: 'crLance', cloth: '#ad9166', skin: '#bc9674', horse: 'dun', noStirrups: true },
  hannibal_ligurian_infantry: { head: 'allyLigurianHair', armor: 'allyHide', weapon: 'sword', shield: 'allyLongShield', cloth: '#8c9475', skin: '#bd9777', bareLegs: true },
};
