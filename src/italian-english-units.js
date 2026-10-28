// Named formations and their equipment references; statistics are game balance.
const unit = (id, name, faction, period, kind, role, color, note, sources, combat) => ({
  id, name, faction, period, kind, role, color, note: `${period} · ${note}`,
  source: sources[0].url, sources, combat,
  credit: 'Dönem donanımından özgün oyun çizimi',
  visualNote: 'Donanım kaynaklardan yorumlanmıştır. Renkler ve küçük ayrıntılar, aksi belirtilmedikçe kesin üniforma iddiası taşımaz.',
});
const ref = (title, url) => ({ title, url });
export const ITALIAN_ENGLISH_UNITS = [
  unit('genoese_crossbowman', 'Ceneviz arbaletçisi', 'Ceneviz Cumhuriyeti', '14.–15. yy', 'ranged', 'Pavizli profesyonel arbaletçi', '#a85643',
    'Ceneviz ve çevresinden toplanan, farklı devletlere de hizmet eden uzman arbaletçiler. Tek bir saray muhafız alayı değillerdi. Büyük paviz koruması ve yavaş doldurulan arbalet oyun temsilidir; yardımcı paviz taşıyıcısı ayrı modellenmez.',
    [ref('Fabio Romanoni — 1357 tarihli Ceneviz arbaletçi kayıtları ve askerî teşkilat', 'https://serena.atcult.it/index.php/rm/article/download/urn%3Anbn%3Ait%3Aunina-3153/5213'),
      ref('Walters Art Museum — 15. yüzyıl paviz örneği (Ceneviz birliğine ait değildir)', 'https://art.thewalters.org/object/51.1371/')],
    { hp: 108, damage: 35, reach: 185, cooldown: 2.6, speed: 20, armor: .19, projectile: 'bolt' }),
  unit('venetian_stradiot', 'Stradiot — Venedik hafif süvarisi', 'Venedik Cumhuriyeti', '15. yy sonu–16. yy başı', 'cavalry', 'Mızraklı akın süvarisi', '#9a6743',
    'Venedik hizmetindeki Balkan kökenli, özellikle Arnavut ve Rum süvariler. İtalya’da 1482 Ferrara Savaşı sırasında kullanıldılar. Hafif donanım, küçük kalkan ve uzun mızrakla temsil edilir; İtalyan kökenli tek tip bir muhafız alayı değildir.',
    [ref('Treccani — Stradiotti', 'https://www.treccani.it/enciclopedia/stradiotti/'),
      ref('Stathis Birtachas — Venedik hizmetindeki Balkan askerleri', 'https://brill.com/display/book/edcoll/9789004362048/B9789004362048_017.pdf')],
    { hp: 138, damage: 25, reach: 33, cooldown: 1.2, speed: 46, armor: .08, chargeDamage: 39 }),
  unit('milan_ducal_cavalry', 'Famiglia ducale — Milano dükalık süvarisi', 'Milano Dükalığı', '15. yy ikinci yarısı', 'cavalry', 'Dükün ağır maiyet süvarisi', '#596f68',
    'Dükün koruma maiyetinden gelişen famiglia ducale içindeki ağır silahlı süvari temsili. Bütün condottierelerin ortak adı değildir. Yuvarlatılmış İtalyan plaka zırhı ve kapalı armet kullanır; kesin bir bölük üniforması yeniden kurulmaz.',
    [ref('Belsanti — Quattrocento İtalya’sında askerî teşkilat, famiglia ducale', 'https://www.storiaonline.org/mi/belsanti.situazione.pdf'),
      ref('Metropolitan Museum — İtalyan armet, yaklaşık 1490', 'https://www.metmuseum.org/art/collection/search/24810'),
      ref('Metropolitan Museum — 1400–1500 Avrupa zırhları', 'https://www.metmuseum.org/essays/fashion-in-european-armor-1400-1500')],
    { hp: 210, damage: 31, reach: 35, cooldown: 1.55, speed: 31, armor: .36, chargeDamage: 50 }),
  unit('english_cheshire_guard', 'Cheshire muhafız okçusu', 'İngiltere Krallığı', '1397–1399', 'ranged', 'II. Richard’ın uzun yaylı muhafızı', '#7a7054',
    'II. Richard’ın Cheshire’dan seçtiği kişisel koruma okçuları. 1398’de yedi nöbete ayrılan 300’den fazla muhafız kaydedilir. Bütün İngiliz uzun yaycıları bu birliğe mensup değildi. Kapitone ceket, açık miğfer ve uzun yay döneme uygun oyun yorumudur.',
    [ref('Medieval Soldier — Cheshire okçuları ve II. Richard’ın muhafızları', 'https://www.medievalsoldier.org/about/soldier-profiles/archers-at-the-battle-of-shrewsbury/'),
      ref('J. L. Gillespie — Richard II and the Cheshire Archers', 'https://www.hslc.org.uk/wp-content/uploads/2017/05/125-2-Gillespie.pdf')],
    { hp: 100, damage: 23, reach: 218, cooldown: 1.65, speed: 25, armor: .1 }),
  unit('english_yeoman_guard', 'Yeoman — erken Tudor muhafızı', 'İngiltere Krallığı', '1485–1509', 'spear', 'Teberli kral muhafızı', '#537b56',
    'VII. Henry’nin 1485’te kurduğu kişisel muhafızlar. 1501 tören tasviri beyaz-yeşil ceket, kırmızı gül ve teberleri kaydeder. Kart bu erken donanımı yorumlar; bugünkü kırmızı tören kıyafeti kullanılmaz. Yalnız teberli seçenek temsil edilir.',
    [ref('Kraliyet — Yeomen of the Guard’ın kuruluşu', 'https://www.royal.uk/yeomen-guard'),
      ref('Anita Hewerdine — erken Tudor muhafızlarının kıyafet ve silah kayıtları', 'https://www.yeomenoftheguard.co.uk/anita-hewerdine-thesis')],
    { hp: 142, damage: 30, reach: 32, cooldown: 1.4, speed: 22, armor: .16 }),
];
export const ITALIAN_ENGLISH_PROFILES = {
  genoese_crossbowman: { head: 'genoeseKettle', armor: 'genoeseJack', weapon: 'genoeseCrossbow', cloth: '#a85643', trousers: '#78776b' },
  venetian_stradiot: { head: 'stradiotCap', armor: 'stradiotCoat', weapon: 'lance', shield: 'round', shieldColor: '#6d4d36', cloth: '#9a6743', horse: 'dun', beard: true },
  milan_ducal_cavalry: { head: 'milanArmet', armor: 'plate', milanese: true, weapon: 'lance', cloth: '#596f68', horse: 'black' },
  english_cheshire_guard: { head: 'cheshireBascinet', armor: 'cheshireJack', weapon: 'longbow', cloth: '#7a7054', trousers: '#8b7559', quiver: true },
  english_yeoman_guard: { head: 'tudorCap', armor: 'tudorLivery', weapon: 'tudorHalberd', cloth: '#537b56', trousers: '#e2dac6' },
};
