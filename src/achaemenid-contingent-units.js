// Equipment roles in Herodotus; no invented guard status or modern nationality.
const make = (id, name, faction, kind, role, section, note, visualNote, combat) => ({
  id, name, faction, kind, role, period: 'MÖ 5. yy', color: '#a08a5c', combat,
  source: `https://lexundria.com/hdt/7.${section}/mcly`,
  sources: [{ title: `Herodotos 7.${section} — donanım tarifi`, url: `https://lexundria.com/hdt/7.${section}/mcly` }],
  note: `MÖ 5. yy · ${note}`, visualNote,
  credit: 'Dönem metnine dayanan özgün çizim; belirtilmeyen biçim ve renkler temsili',
});
export const ACHAEMENID_CONTINGENT_UNITS = [
  make('paphlagonian_short_spearman', 'Paflagon kısa mızraklısı', 'Paflagonya / Ahameniş hizmeti', 'spear', 'Küçük kalkanlı hareketli mızrak piyadesi', 72,
    'Herodotos örgülü başlık, küçük kalkan, kısa mızrak, cirit, hançer ve baldır ortasına çıkan çizme anlatır. Kart yakın dövüş rolünü temsil eder; ayrı bir seçkin alay değildir.',
    'Örgü dokulu dar başlık, küçük kalkan, kısa mızrak ve yüksek deri çizme. Kalkanın biçimi, başlığın yapısı, tunik ve renkler yorumdur.',
    { hp: 116, damage: 22, reach: 27, cooldown: 1.08, speed: 30, armor: .08 }),
  make('colchian_hide_spearman', 'Kolhis deri kalkanlı mızraklısı', 'Kolhis / Ahameniş hizmeti', 'spear', 'Ahşap başlıklı kalkanlı piyade', 79,
    'Herodotos Kolhislilerde ahşap başlık, küçük ham sığır derisi kalkan, kısa mızrak ve bıçak kaydeder. Antik Kolhis kimliği korunur; modern ulusal üniforma veya muhafız statüsü atfedilmez.',
    'Ahşap dokulu başlık, dikişli deri kalkan ve kısa mızrak. Başlığın dilimli yapısı ile kalkanın oval biçimi rekonstrüksiyon tercihidir; kaynak bu biçimleri belirtmez.',
    { hp: 127, damage: 26, reach: 26, cooldown: 1.4, speed: 26, armor: .1 }),
  make('libyan_fire_javelineer', 'Libyalı ahşap uçlu ciritçi', 'Libya / Ahameniş hizmeti', 'ranged', 'Hafif cirit piyadesi', 71,
    'Herodotos deri donanım ve ucu ateşte sertleştirilmiş ciritler tarif eder. Ateş silahı değildir; oyun ateş hasarı vermez. Hannibal dönemi Libya ağır piyadesinden farklı dönem ve donanım rolüdür.',
    'Deri omuz ve bel örtüsü, yedek ciritler, metal başlık yerine karartılmış ahşap uç. Saç, örtünün kesimi ve bağlar temsili; kaynak ağır deri zırh tanımlamaz.',
    { hp: 94, damage: 24, reach: 118, cooldown: 1.7, speed: 32, armor: .02, projectile: 'dart' }),
  make('aithiopian_palm_archer', 'Aithiop uzun yaylısı', 'Aithioplar / Ahameniş hizmeti', 'ranged', 'Uzun ahşap yaylı hafif okçu', 69,
    'Herodotos Mısır güneyindeki Aithiop askerleri uzun palmiye yayı, taş uçlu kamış ok ve hayvan postuyla anlatır. Aithiop antik coğrafi adlandırmadır; modern Etiyopya devleti veya tek bir etnik kimlikle eşitlenmez.',
    'Uzun palmiye yayı, kısa taş uçlu ok, benekli post ve kırmızı/beyaz gövde boyası. Boyanın iki yana bölünmesi, saç ve post kesimi yorumdur; yay oyun ölçeğine uyarlanmıştır.',
    { hp: 89, damage: 25, reach: 201, cooldown: 2.2, speed: 27, armor: .01 }),
];
export const ACHAEMENID_CONTINGENT_PROFILES = {
  paphlagonian_short_spearman: { head: 'acPlaitedCap', armor: 'acBootTunic', shield: 'acSmallShield', weapon: 'acShortSpear', skin: '#ba916e', cloth: '#96714c' },
  colchian_hide_spearman: { head: 'acWoodCap', armor: 'acMountainTunic', shield: 'acHideShield', weapon: 'acColchianSpear', skin: '#bf9776', cloth: '#737d70' },
  libyan_fire_javelineer: { head: 'acTiedHair', armor: 'acLeatherWrap', weapon: 'acWoodJavelin', skin: '#a87952', cloth: '#a88859', bareLegs: true, bareFeet: true },
  aithiopian_palm_archer: { head: 'acShortCurls', armor: 'acPaintedHide', weapon: 'acPalmBow', skin: '#73513d', cloth: '#af8e56', bareLegs: true, bareFeet: true },
};
