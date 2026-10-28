// Equipment roles described in ancient sources, not five named elite regiments.
const make = (id, name, faction, period, kind, role, source, note, visualNote, combat) => ({
  id, name, faction, period, kind, role, source, note: `${period} · ${note}`, visualNote, combat,
  color: '#947c57', credit: 'Dönem metinlerine dayanan özgün çizim; renkler ve eksik giysi ayrıntıları temsili',
  sources: [{ title: `${name} — dönem kaynağı`, url: source }],
});
export const IMPERIAL_AUXILIARY_UNITS = [
  make('egypt_achaemenid_marine', 'Mısırlı deniz mızraklısı', 'Mısır / Ahameniş hizmeti', 'MÖ 5. yy', 'spear', 'Geniş kenarlı kalkan taşıyan deniz piyadesi',
    'https://lexundria.com/hdt/7.89/mcly',
    'Herodotos 7.89, Pers donanmasındaki Mısırlıların örgülü başlıklarını, geniş kenarlı çukur kalkanlarını ve deniz savaşı mızraklarını kaydeder. Bu kart mızraklı rolü temsil eder; gemi savaşı mekaniği içermez.',
    'Örgü dokulu başlık, geniş kenarlı çukur kalkan ve mızrak. Kaynak çoğunun gövde zırhı taşıdığını söyler; zırhın malzemesi, kalkanın dış biçimi ve renkler görsel yorumdur.',
    { hp: 137, damage: 25, reach: 30, cooldown: 1.35, speed: 23, armor: .18 }),
  make('lycian_cornel_archer', 'Likya kızılcık yaylı okçusu', 'Likya / Ahameniş hizmeti', 'MÖ 5. yy', 'ranged', 'Zırhlı donanma okçusu',
    'https://lexundria.com/hdt/7.92/mcly',
    'Herodotos 7.92, Likyalı deniz askerlerinde kızılcık ağacından yay, tüysüz kamış ok, gövde zırhı ve baldır koruması anlatır. Kaynak çok silahlı asker tarif eder; kart bunların okçu rolünü sunar.',
    'Tüylerle çevrili keçe başlık, omuzda keçi postu, baldır korumaları ve ahşap yay. Başlık biçimi, zırh malzemesi ve renkler yorum; okun tüyü çizilmez.',
    { hp: 110, damage: 22, reach: 174, cooldown: 1.8, speed: 24, armor: .15 }),
  make('bactrian_short_spearman', 'Baktriyalı kısa mızraklı', 'Baktriya / Ahameniş hizmeti', 'MÖ 5. yy', 'spear', 'Kısa mızraklı hafif piyade',
    'https://lexundria.com/hdt/7.64/mcly',
    'Herodotos 7.64, Baktriyalıların Med başlığına benzer başlık, kamış yay ve kısa mızrak taşıdığını söyler. Kart yakın dövüş rolünü ayırır; ayrı bir tarihî alay adı veya yalnız mızrak taşıdıkları iddiası değildir.',
    'Yumuşak yanak örtülü başlık ve kısa mızrak; uzun sarissa veya sivri Saka başlığı yok. Tunik, pantolon ve renkler dönem yorumu. Bu metinde kalkan belirtilmediği için kalkan eklenmedi.',
    { hp: 111, damage: 24, reach: 25, cooldown: 1.05, speed: 29, armor: .06 }),
  make('late_roman_plumbatarius', 'Geç Roma plumbata piyadesi', 'Geç Roma İmparatorluğu', 'MS 4–5. yy', 'ranged', 'Kurşun ağırlıklı kısa dart atan piyade',
    'https://www.thelatinlibrary.com/vegetius1.html',
    'Vegetius I.17, kurşun ağırlıklı dart eğitimini ve kalkan içinde taşınan dartları anlatır. Oyunda bu donanım ayrı menzilli rol olarak sunulur; beş atımlık mühimmat sınırı veya ardından kılıca geçiş uygulanmaz.',
    'Kısa demir uçlu, belirgin kurşun ağırlıklı ve kanatçıklı dart; oval kalkan, uzun kollu tunik ve keçe başlık. Dartın ahşap bölümü ile kanatçıkları rekonstrüksiyon; kalkan deseni bir alay arması değildir.',
    { hp: 128, damage: 28, reach: 132, cooldown: 2.1, speed: 24, armor: .14, projectile: 'dart' }),
  make('late_roman_slinger', 'Geç Roma sapancısı', 'Geç Roma İmparatorluğu', 'MS 4–5. yy', 'ranged', 'Taş atan hafif destek piyadesi',
    'https://www.thelatinlibrary.com/vegetius1.html',
    'Vegetius I.16 askerlere sapan eğitimi verilmesini önerir. Bu bir eğitim ve donanım rolüdür; kaynak, bu adla bağımsız seçkin bir alay tanımlamaz.',
    'İki kordonlu el sapanı, taş kesesi, sade uzun kollu tunik ve kumaş bacak sargıları. Giysi ile renkler temsili; zincir sapan, yay veya asalı sapan çizilmez.',
    { hp: 91, damage: 21, reach: 166, cooldown: 1.65, speed: 28, armor: .03, projectile: 'sling' }),
];
IMPERIAL_AUXILIARY_UNITS.find(u => u.id === 'late_roman_plumbatarius').sources.push({
  title: 'Museum Wales — plumbata / martiobarbulus buluntusu',
  url: 'https://museum.wales/collections/online/object/cdb92b99-8b78-3f50-a22c-29cf011a2200/Roman-iron-javelin-head/',
});
export const IMPERIAL_AUXILIARY_PROFILES = {
  egypt_achaemenid_marine: { head: 'iaWovenCap', armor: 'iaMarineCorselet', shield: 'iaHollowShield', weapon: 'iaMarineSpear', cloth: '#d2bc8d', skin: '#ac7c52' },
  lycian_cornel_archer: { head: 'iaFeatherCap', armor: 'iaGoatskinCorselet', weapon: 'iaCornelBow', cloth: '#a27a5d', skin: '#b68b63', quiver: true },
  bactrian_short_spearman: { head: 'iaSoftHood', armor: 'iaBactrianCoat', weapon: 'iaShortSpear', cloth: '#847958', skin: '#b58c67' },
  late_roman_plumbatarius: { head: 'iaPannonianCap', armor: 'iaRomanDartTunic', shield: 'iaOvalShield', weapon: 'iaPlumbata', cloth: '#b89b7a', skin: '#bc9675' },
  late_roman_slinger: { head: 'iaCroppedHair', armor: 'iaSlingTunic', weapon: 'iaSling', cloth: '#85918a', skin: '#bc9474', legWraps: true },
};
