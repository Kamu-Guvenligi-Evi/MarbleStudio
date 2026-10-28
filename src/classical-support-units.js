// Ancient contingents and troop classes, not five invented elite regiments.
const make = (id, name, faction, period, kind, role, source, note, visualNote, combat) => ({
  id, name, faction, period, kind, role, source, note: `${period} · ${note}`, visualNote, combat,
  color: '#94794f', credit: 'Yazılı donanım kaynaklarına dayanan özgün çizim; giysi ve renk tamamlamaları temsili',
  sources: [{ title: `${name} — tarihî dayanak`, url: source }],
});
const polybius = 'https://sourcebooks.web.fordham.edu/ancient/polybius6.asp';
const arrian = 'https://www.gutenberg.org/files/46976/46976-h/46976-h.htm';
export const CLASSICAL_SUPPORT_UNITS = [
  make('roman_triarius', 'Roma triarii mızraklısı', 'Roma Cumhuriyeti', 'MÖ 3–2. yy', 'spear', 'Kalkanlı kıdemli mızrak piyadesi', polybius,
    'Polybios 6.21–23: yaşça kıdemli triarii, diğer ağır piyadeden farklı olarak fırlatma silahı yerine mızrak taşır. Zincir zırh burada varlıklı askerin donanım seçeneğidir; tüm triarii için zorunlu değildir.',
    'Uzun oval scutum, bronz miğferde üç tüy, zincir gömlek, baldır koruması ve hasta. Geç Cumhuriyet kılıçlı lejyonerinden farklı dönem ve silah; kalkan rengi temsili.',
    { hp: 158, damage: 25, reach: 36, cooldown: 1.35, speed: 21, armor: .26 }),
  make('roman_veles', 'Roma velites ciritçisi', 'Roma Cumhuriyeti', 'MÖ 3–2. yy', 'ranged', 'Kısa menzilli hafif cirit piyadesi', polybius,
    'Polybios 6.22: velites hafif ciritler, kılıç ve küçük yuvarlak kalkan taşır. Kurt postu olası baş örtülerinden biridir; her askerin aynı postu giydiği varsayılmadı.',
    'Küçük parma kalkanı, kurt postlu başlık, kısa tunik, ince cirit ve yedek ciritler. Zırhsız gövde ve küçük kalkanla triarii siluetinden ayrılır.',
    { hp: 97, damage: 28, reach: 124, cooldown: 2.05, speed: 29, armor: .06, projectile: 'dart' }),
  make('agrianian_javelineer', 'Agrian ciritçisi', 'Makedonya Krallığı', 'MÖ 4. yy', 'ranged', 'İskender ordusunda hafif cirit piyadesi', arrian,
    'Arrianos Anabasis 3.13: Agrianlar Gaugamela savaşında tırpanlı savaş arabalarına cirit atar. Makedon ordusunda hizmet eden ayrı bir topluluktur; Makedon etnik kimliği atfedilmez.',
    'Hafif kalkan, cirit demeti, kısa tunik, omuz örtüsü ve sade keçe başlık. Kaynak birlik ve silahı doğrular; başlık, kalkan biçimi ve renkler temsili rekonstrüksiyondur.',
    { hp: 103, damage: 30, reach: 132, cooldown: 2.15, speed: 31, armor: .04, projectile: 'dart' }),
  make('thessalian_cavalry', 'Tesalya müttefik süvarisi', 'Makedonya Krallığı', 'MÖ 4. yy', 'cavalry', 'Mızraklı müttefik yakın dövüş süvarisi', arrian,
    'Arrianos Anabasis 2.9 ve 3.15, Tesalya süvarilerinin İssos ve Gaugamela sol kanadındaki görevini anlatır. Bu birliğin menü konumu İskender ordusundaki hizmetini gösterir; Tesalyalı kimliği korunur.',
    'Geniş kenarlı Boiotia tipi miğfer, göğüslük, omuz pelerini, mızrak ve zırhsız at. Donanım dönemin Yunan süvari kaynaklarından yorumlandı; standart Tesalya üniforması iddiası yoktur.',
    { hp: 171, damage: 28, reach: 29, cooldown: 1.3, speed: 44, armor: .18, chargeDamage: 54 }),
  make('achaemenid_indian_archer', 'Pers hizmetinde Hint okçusu', 'Ahameniş İmparatorluğu', 'MÖ 5. yy', 'ranged', 'Hint yardımcı yaya okçu',
    'https://classics.mit.edu/Herodotus/history.7.vii.html',
    'Herodotos 7.65, Kserkses ordusundaki Hint askerlerini pamuklu giysiler, kamış yaylar ve demir uçlu kamış oklarla tanımlar. Yardımcı birliktir; Pers etnik kimliği veya seçkin muhafız statüsü atfedilmez.',
    'Boğumları işlenmiş kamış yay, açık renk pamuklu gövde ve bel örtüsü, demir uçlu oklar. Giysinin kesimi, saç ve ok kılıfı temsili; kaynak kesin bir üniforma tarif etmez.',
    { hp: 91, damage: 23, reach: 189, cooldown: 1.85, speed: 26, armor: .02 }),
];
CLASSICAL_SUPPORT_UNITS.find(u => u.id === 'thessalian_cavalry').sources.push({
  title: 'Ksenophon, Atçılık 12 — çağdaş Yunan süvari donanımı; Tesalya üniforması değildir',
  url: 'https://www.gutenberg.org/files/1176/1176-h/1176-h.htm',
});
export const CLASSICAL_SUPPORT_PROFILES = {
  roman_triarius: { head: 'csTriplePlume', armor: 'csMail', shield: 'csScutum', weapon: 'csHasta', cloth: '#9d6950', skin: '#bd9676', bareLegs: true },
  roman_veles: { head: 'csWolfHood', armor: 'csVelesTunic', shield: 'csParma', weapon: 'csJavelin', cloth: '#baab7a', skin: '#c09a78', bareLegs: true },
  agrianian_javelineer: { head: 'csFeltCap', armor: 'csAgrianTunic', shield: 'csPelta', weapon: 'csJavelin', cloth: '#6e8585', skin: '#bf9776', bareLegs: true },
  thessalian_cavalry: { head: 'csBoeotian', armor: 'csCuirass', weapon: 'csCavalrySpear', cloth: '#9c8165', skin: '#c19c7e', horse: 'bay', bareLegs: true },
  achaemenid_indian_archer: { head: 'csIndianHair', armor: 'csCotton', weapon: 'csCaneBow', cloth: '#d8ccb0', skin: '#976948', bareLegs: true, bareFeet: true },
};
