// Support roles for complete commander armies. Ratios and combat values are game
// interpretations, not measured historical statistics or reconstructed muster rolls.
const hastings = 'https://www.english-heritage.org.uk/visit/places/1066-battle-of-hastings-abbey-and-battlefield/history-and-stories/what-happened-battle-hastings';
const make = (id, name, faction, period, kind, role, source, note, combat) => ({
  id, name, faction, period, kind, role, source, note, combat, color: '#897c60',
  sources: [{ title: `${name} — donanım ve dönem kaynağı`, url: source }],
  credit: 'Kaynaklardan hareketle özgün oyun çizimi',
  visualNote: 'Mevcut oyun çizim dili kullanılır. Renkler, sayısal güçler ve birlik oranları oyun yorumudur; tarihî üniforma veya kesin ordu mevcudu iddiası değildir.',
});
export const HISTORICAL_ARMY_SUPPORT_UNITS = [
  make('english_fyrd_spearman', 'Anglosakson fyrd mızraklısı', 'Anglosakson İngiltere', '11. yy; 1066', 'spear', 'Kalkanlı yaya mızraklı', hastings,
    'Housecarlların yanında çağrı üzerine gelen piyade. Oyunda mızrak ve yuvarlak kalkanlı, zırhsız örnek temsil edilir; bütün fyrdin donanımı aynı değildi.',
    { hp: 108, speed: 25, damage: 21, reach: 31, cooldown: 1.2, armor: .08 }),
  make('english_early_archer', 'Anglosakson yaya okçusu', 'Anglosakson İngiltere', '11. yy; 1066', 'ranged', 'Hafif yaya okçu', hastings,
    'Bayeux işlemesinde İngiliz tarafında bir okçu görülür; sayıları belirsizdir. Hazır orduda küçük destek grubudur, sonraki yüzyılların İngiliz uzun yay birlikleri değildir.',
    { hp: 74, speed: 26, damage: 17, reach: 160, cooldown: 1.65, armor: 0 }),
  make('spartan_helot_light', 'Sparta helot destek piyadesi', 'Sparta', 'MÖ 5. yy başı', 'spear', 'Hafif yaya destek', 'https://lexundria.com/hdt/9.28/mcly',
    'Herodotos 9.28, Plataia ordusundaki hafif silahlı helotları anlatır. Kesin silah dökümü verilmez; kısa mızraklı zırhsız temsil oyun yorumudur. Leonidasın Termopylai mevcudunun birebir yeniden yapımı değildir.',
    { hp: 82, speed: 29, damage: 18, reach: 25, cooldown: 1.05, armor: 0 }),
  make('achaemenid_horse_archer', 'Ahameniş atlı okçusu', 'Ahameniş İmparatorluğu', 'MÖ 6.–5. yy', 'cavalry', 'Yaylı hafif süvari', 'https://www.iranicaonline.org/articles/army-i/',
    'Erken Pers ordularının yay kullanan süvarisini temsil eder. Ağır katafrakt veya ortaçağ mızrak hücumcusu değildir; zırhsız at ve üzengisiz donanım kullanır.',
    { hp: 120, speed: 42, damage: 17, reach: 170, cooldown: 1.65, armor: .04, ranged: true, skirmish: true, chargeDamage: 0 }),
  make('seljuk_turkmen_archer', 'Selçuklu Türkmen atlı okçusu', 'Büyük Selçuklu Devleti', '11. yy', 'cavalry', 'Hafif atlı okçu', 'https://www.iranicaonline.org/articles/army-ii/',
    'Hassa süvarisinin yanında Türkmen atlı okçuları hareketli menzilli destek verir. Hafif donanım ve bileşik yay esastır. Hassa hücum grubuna otomatik katılmaz; mesafe koruması sınırlıdır.',
    { hp: 126, speed: 46, damage: 18, reach: 178, cooldown: 1.5, armor: .04, ranged: true, skirmish: true, chargeDamage: 0 }),
  make('qin_swordsman', 'Qin kılıçlı destek piyadesi', 'Qin Hanedanı', 'MÖ 3. yy', 'sword', 'Jian kullanan yakın destek', 'https://www.nature.com/articles/s41598-019-40613-7',
    'Qin mezar ordusunda bulunan bronz kılıçlardan hareketle yakın destek rolü. Ayrı ve standart bir tarihî kılıç alayı iddiası değildir; ji ve arbaletlerin yanındaki kısa silahlı askeri oyunda ayrı kartla gösterir.',
    { hp: 112, speed: 26, damage: 24, reach: 18, cooldown: 1.05, armor: .12 }),
  make('ming_matchlock', 'Ming fitilli tüfekçisi', 'Ming Hanedanı', '16. yy; Qi Jiguang dönemi', 'ranged', 'Fitilli tüfekli yaya destek', 'https://zh.wikisource.org/wiki/紀效新書_(四庫全書本)/卷15',
    'Qi Jiguangın eserinde geçen niao chong ateşli silahlarını temsil eder. Karma yakın dövüş düzenine menzilli destek sağlar; uzun doldurma süresi ve zayıf yakın savunması vardır. Her mandarin ördeği takımının sabit üyesi olduğu iddia edilmez.',
    { hp: 82, speed: 22, damage: 35, reach: 190, cooldown: 3.1, armor: .02, projectile: 'bullet' }),
];
export const HISTORICAL_ARMY_SUPPORT_PROFILES = {
  english_fyrd_spearman: { head: 'nasal', armor: 'robe', weapon: 'spear', shield: 'round', cloth: '#8c7855', shieldColor: '#877142', beard: true },
  english_early_archer: { head: 'cap', armor: 'robe', weapon: 'bow', cloth: '#788062', quiver: true },
  spartan_helot_light: { head: 'bare', armor: 'robe', weapon: 'shortSpear', cloth: '#a18d6e', beard: true },
  achaemenid_horse_archer: { head: 'tiara', armor: 'robe', weapon: 'rfCompositeBow', cloth: '#9a7760', trousers: '#88735b', horse: 'bay', noStirrups: true, quiver: true, beard: true },
  seljuk_turkmen_archer: { head: 'furCone', armor: 'robe', weapon: 'rfCompositeBow', cloth: '#6c8178', trousers: '#867253', horse: 'bay', quiver: true, braid: true },
  qin_swordsman: { head: 'mcQinKnot', armor: 'mcQinPlates', weapon: 'jian', cloth: '#826f5c', legWraps: true },
  ming_matchlock: { head: 'mingHeadwrap', armor: 'mingShortCoat', weapon: 'musket', cloth: '#7b8590', trousers: '#9a927c', legWraps: true },
};
