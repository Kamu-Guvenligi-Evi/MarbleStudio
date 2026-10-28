// Equipment roles reconstructed for the late 14th / early 15th century.
const organization = { title: 'TDV — Timurlular: ordu ve Kavçin muhafızları', url: 'https://islamansiklopedisi.org.tr/timurlular' };
const armor = { title: 'Encyclopaedia Iranica — Armor: erken Timurlu donanımı', url: 'https://www.iranicaonline.org/articles/armor/' };
const make = (id, name, role, note, combat) => ({
  id, name, faction: 'Timurlular', period: '14. yy sonu–15. yy başı', kind: 'cavalry', role, note, combat,
  color: '#537c83', source: organization.url, sources: [organization, armor],
  credit: 'Tarihî kaynaklardan hareketle özgün oyun çizimi',
  visualNote: 'Miğfer ve lamelli/zincir zırh dönem donanımının temsili yorumudur. Renkler, silah alt rolleri ve sayısal güçler kesin üniforma veya alay kaydı değildir.',
});
export const TIMURID_UNITS = [
  make('timurid_horse_archer', 'Timurlu atlı okçusu', 'Hareketli yay desteği',
    'Timurlu ordusunun yaylı süvari rolü. Cengiz Han dönemi muhafızları veya Kıpçak adıyla ayrı bir Timurlu alayı olarak sunulmaz.',
    { hp: 140, speed: 42, damage: 21, reach: 175, cooldown: 1.6, armor: .12, ranged: true, skirmish: true, chargeDamage: 0 }),
  make('timurid_armored_lancer', 'Timurlu zırhlı mızraklı süvarisi', 'Zırhlı süvari hücumu',
    'Timurlu süvarisinin mızraklı yakın dövüş rolü; ayrı tarihî alay adı değildir. Lamelli gövde zırhı ve miğfer erken 15. yüzyıl İran donanımından hareketle yorumlanmıştır.',
    { hp: 190, speed: 37, damage: 27, reach: 32, cooldown: 1.3, armor: .24, chargeDamage: 46 }),
  make('timurid_guard_cavalry', 'Timurlu Kavçin muhafızı', 'Hükümdarın yakın süvari muhafızı',
    'TDV, hükümdarın bin kişilik Kavçin muhafız bölüğünü kaydeder. Bu kartın kılıçlı ve kalkanlı süvari donanımı oyun rekonstrüksiyonudur; bütün muhafızların tek tip teçhizatı olarak doğrulanmış değildir.',
    { hp: 200, speed: 35, damage: 29, reach: 23, cooldown: 1.2, armor: .27, chargeDamage: 35 }),
];
export const TIMURID_PROFILES = {
  timurid_horse_archer: { head: 'furCone', armor: 'lamellar', weapon: 'rfCompositeBow', cloth: '#617e77', horse: 'dun', quiver: true, longCoat: true },
  timurid_armored_lancer: { head: 'byzantineMailHelm', armor: 'lamellar', weapon: 'lance', cloth: '#496879', horse: 'bay', longCoat: true },
  timurid_guard_cavalry: { head: 'byzantineMailHelm', armor: 'mail', weapon: 'longsword', shield: 'round', cloth: '#7e4a50', trim: '#c3a365', shieldColor: '#876b49', horse: 'grey', longCoat: true },
};
