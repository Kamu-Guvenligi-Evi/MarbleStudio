// Missing battlefield roles identified in historical-tactics-research-2026-10-15.txt.
// Numbers are equipment-based game balance, not measured historical performance.
const carrhae = 'https://www.iranicaonline.org/articles/carrhae-harran-town-in-mesopotamia-where-in-may-53-b/';
const mingManual = 'https://zh.wikisource.org/zh/紀效新書/卷十一';
const mingRoster = 'https://zh.wikisource.org/zh/紀效新書/卷一';
const make = (id, name, faction, period, kind, role, note, source, combat, visualNote) => ({
  id, name, faction, period, kind, role, note, source, combat, color: '#987951',
  sources: [{ title: `${name} — tarihî donanım ve görev`, url: source }],
  credit: 'Kaynak metinlerden hareketle özgün oyun çizimi',
  visualNote: `${visualNote} Renkler ve yüzler oyun yorumudur; standart üniforma iddiası değildir.`,
});

export const HISTORICAL_TACTICS_UNITS = [
  make('parthian_horse_archer', 'Part atlı okçusu', 'Part / Arsak İmparatorluğu', 'MÖ 1. yy; Carrhae, MÖ 53',
    'cavalry', 'Hafif atlı okçu',
    'Bileşik yaylı hareketli süvari; katafraktların yanında menzilli taciz rolünü tamamlar. Hafif donanımı hız sağlar; yakın dövüşte ve ağır süvari hücumunda zayıftır. Oyunda sınırlı mesafe koruma kullanır; sonsuz ricat veya cephane ikmali bonusu yoktur.',
    carrhae, { hp: 124, speed: 46, damage: 18, reach: 176, cooldown: 1.55, armor: .03, ranged: true, skirmish: true, chargeDamage: 0 },
    'Kısa bileşik yay, sadak, uzun kollu giysi, pantolon ve zırhsız at; üzengi çizilmez.'),
  make('ming_long_spearman', 'Ming uzun mızraklısı', 'Ming Hanedanı', '16. yy; Qi Jiguang dönemi',
    'spear', 'Uzun mızraklı destek piyadesi',
    'Kalkanlı ve langxian taşıyan ön sıraların arkasından uzun mızrakla vuruş yapan piyade. Uzun erişimi önden süvariyi karşılamaya uygundur; hafif koruması kuşatılmaya karşı zayıflıktır. Tek başına tam mandarin ördeği düzeni oluşturmaz.',
    mingManual, { hp: 106, speed: 22, damage: 27, reach: 40, cooldown: 1.3, armor: .05 },
    'Ming kısa ceketi, baş bağı, bacak sargıları ve iki elle tutulan uzun mızrak; Avrupa zırhı kullanılmaz.'),
  make('ming_long_shield', 'Ming uzun kalkanlısı', 'Ming Hanedanı', '16. yy; Qi Jiguang dönemi',
    'sword', 'Uzun kalkanlı ön hat piyadesi',
    'Uzun kalkan ve dao ile destek piyadesinin önünü korur. Rattan kalkanlıya göre daha yavaş ve savunma ağırlıklıdır; ağır zırhlı asker değildir. Oyundaki zırh değeri kalkanın korumasını da yaklaşık olarak temsil eder.',
    mingRoster, { hp: 132, speed: 23, damage: 21, reach: 20, cooldown: 1.2, armor: .19 },
    'Uzun dikdörtgen ahşap kalkan, dao, kısa ceket ve baş bağı; kalkan bezemesi sade oyun yorumudur.'),
  make('ming_short_weapon_support', 'Ming kısa silahlı desteği', 'Ming Hanedanı', '16. yy; Qi Jiguang dönemi',
    'sword', 'Dao kullanan yakın destek piyadesi',
    'Uzun mızraklıların yakınına giren düşmana karşı kısa silahlı destek rolü. Kaynakta bu görev yalnız tek bir silaha indirgenmez; oyunda büyük dao kullanan örneği temsil edilir. Kalkanı olmadığı için daha hareketli, fakat daha az korunaklıdır.',
    mingManual, { hp: 112, speed: 29, damage: 29, reach: 23, cooldown: 1.15, armor: .04 },
    'Baş bağı, kısa ceket ve iki elle tutulan geniş dao; sanjiaocha taşıdığı iddia edilmez.'),
];

export const HISTORICAL_TACTICS_PROFILES = {
  parthian_horse_archer: { head: 'cap', armor: 'robe', weapon: 'rfCompositeBow', cloth: '#a57d58', trousers: '#8b6c50', trim: '#d0b587', horse: 'bay', quiver: true, noStirrups: true, beard: true },
  ming_long_spearman: { head: 'mingHeadwrap', armor: 'mingShortCoat', weapon: 'mcPike', cloth: '#778975', trousers: '#9a927c', legWraps: true },
  ming_long_shield: { head: 'mingHeadwrap', armor: 'mingShortCoat', weapon: 'mingDao', shield: 'mingLongShield', cloth: '#8e775d', trousers: '#9a927c', legWraps: true },
  ming_short_weapon_support: { head: 'mingHeadwrap', armor: 'mingShortCoat', weapon: 'mingSupportDao', cloth: '#6f8290', trousers: '#9a927c', legWraps: true },
};
