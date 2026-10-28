// Missing battlefield roles, not invented elite orders. Values are game balance.
const make = (id, name, faction, period, kind, role, source, note, visualNote, combat) => ({
  id, name, faction, period, kind, role, source, note: `${period} · ${note}`, visualNote, combat,
  color: '#887959', credit: 'Kaynak donanımından özgün oyun çizimi; belirtilmeyen renk ve ayrıntılar temsili',
  sources: [{ title: `${name} — tarihî dayanak`, url: source }],
});
const aztec = 'https://en.wikipedia.org/wiki/Aztec_warfare';
const scots = 'https://portal.historicenvironment.scot/apex/f?p=1505:300:::::VIEWTYPE,VIEWREF:designation,BTL28';
export const WORLD_ROSTER_GAPS = [
  make('mexica_foot_archer', 'Mexica yaya okçusu', 'Meksika / Mexica (Aztek)', '15–erken 16. yy', 'ranged', 'Yaylı destek piyadesi', aztec,
    'Mexica ordusunun yay kullanan piyadelerini temsil eder. Kartal ve Jaguar rütbelerinden ayrı bir destek rolüdür; her okçuya seçkin rütbe atfedilmez.',
    'Tek parça ahşap yay, okluk, sade pamuklu gövde koruması ve bel örtüsü. Hayvan başlı miğfer yok; saç ve renkler temsili rekonstrüksiyon.',
    { hp: 96, damage: 21, reach: 168, cooldown: 1.75, speed: 27, armor: .07 }),
  make('mexica_slinger', 'Mexica sapancısı', 'Meksika / Mexica (Aztek)', '15–erken 16. yy', 'ranged', 'Taş atan hafif piyade', aztec,
    'Ordunun sapancı desteği. Taş atan sapan kullanır; atlatl veya metal mermi kullanan bir birlik değildir.',
    'İki kordonlu sapan, taş kesesi, baş bağı ve kısa bel örtüsü. Metal zırh yok; kıyafet ayrıntıları temsili.',
    { hp: 87, damage: 18, reach: 151, cooldown: 1.55, speed: 29, armor: .01, projectile: 'sling' }),
  make('scots_foot_archer', 'İskoç yaya okçusu', 'İskoçya Krallığı', 'Geç 13–14. yy', 'ranged', 'Yaya okçu desteği', scots,
    'Historic Environment Scotland, Stirling Köprüsü ordusunda okçuları kaydeder. Fransa hizmetindeki İskoç Muhafızlarından ve 1676 tarihli Royal Company of Archers teşkilatından ayrıdır.',
    'Ahşap yay, kumaş başlık, kısa pelerin, kapitone ceket ve ok kesesi. Modern kilt, klan tartanı veya ortak üniforma varsayılmadı.',
    { hp: 101, damage: 24, reach: 187, cooldown: 1.95, speed: 25, armor: .08 }),
  make('scots_light_horse', 'İskoç hafif süvarisi', 'İskoçya Krallığı', 'Geç 13–14. yy', 'cavalry', 'Mızraklı hafif süvari', scots,
    'Historic Environment Scotland, İskoç ordusunda hafif atlıları zırhlı şövalyelerden ayrı sayar. Bu kart hafif süvari rolünün mızraklı oyun yorumudur.',
    'Zırhsız at, kısa kapitone ceket, demir başlık ve mızrak. Kalkan ve tam plaka at zırhı yok; kesin alay donanımı iddiası taşımaz.',
    { hp: 146, damage: 25, reach: 33, cooldown: 1.4, speed: 45, armor: .1, chargeDamage: 37 }),
  make('inca_spearman', 'İnka mızraklısı', 'İnka İmparatorluğu', '15–erken 16. yy', 'spear', 'Chuki mızraklı piyade',
    'https://en.wikipedia.org/wiki/Inca_army',
    'İnka ordusunda kullanılan chuki mızrağını temsil eder. Bronz uçlu saplama mızrağı seçildi; bütün bölgesel birliklerin tek tip donandığı iddia edilmez.',
    'Dama desenli uncu tunik, sade baş koruması, bronz uçlu mızrak ve küçük ahşap kalkan. Tunik için müze örnekleri esas alındı; başlık ve kalkan ayrıntıları temsili.',
    { hp: 112, damage: 25, reach: 32, cooldown: 1.45, speed: 25, armor: .08 }),
  make('tang_long_spearman', 'Tang uzun mızraklısı', 'Tang Hanedanı', '7–8. yy', 'spear', 'Uzun mızraklı hat piyadesi',
    'https://en.wikipedia.org/wiki/Military_history_of_the_Tang_dynasty',
    '657 İrtiş seferi anlatısında süvariyi uzun mızraklarla karşılayan Tang piyadesi kaydedilir. Belirli bir muhafız alayı adı uydurulmadı.',
    'İki elle taşınan uzun mızrak, göğüs levhaları, üst kol korumaları ve ortadan ayrılan zırhlı etek. Bowers Museum Tang savaşçı figürünün donanım tarifi kaynak alındı; renkler temsili.',
    { hp: 132, damage: 27, reach: 43, cooldown: 1.6, speed: 21, armor: .23 }),
];
WORLD_ROSTER_GAPS.find(u => u.id === 'inca_spearman').sources.push({
  title: 'LACMA — askerî dama desenli uncu tunikleri', url: 'https://www.lacma.org/andean-uncu',
});
WORLD_ROSTER_GAPS.find(u => u.id === 'tang_long_spearman').sources.push({
  title: 'Bowers Museum — Tang savaşçı figürü ve zırhı', url: 'https://collections.bowers.org/objects/151/tomb-figure',
});
export const WORLD_ROSTER_GAP_PROFILES = {
  mexica_foot_archer: { head: 'wrgBoundHair', armor: 'wrgCottonVest', weapon: 'wrgSelfBow', cloth: '#c7b98d', skin: '#ad805c', bareLegs: true, quiver: true },
  mexica_slinger: { head: 'wrgHeadband', armor: 'wrgLoincloth', weapon: 'ecSling', cloth: '#bb9464', skin: '#ab7a57', bareLegs: true },
  scots_foot_archer: { head: 'wrgCoif', armor: 'wrgArcherJack', weapon: 'longbow', cloth: '#85816b', quiver: true },
  scots_light_horse: { head: 'wrgIronCap', armor: 'wrgRidingJack', weapon: 'lance', cloth: '#877c58', horse: 'dun' },
  inca_spearman: { head: 'wrgAndeanCap', armor: 'wrgUncu', weapon: 'wrgBronzeSpear', shield: 'wrgAndeanShield', cloth: '#b15c3b', skin: '#b58a65', bareLegs: true },
  tang_long_spearman: { head: 'wrgTangHelmet', armor: 'wrgTangCuirass', weapon: 'wrgLongSpear', cloth: '#875643', legWraps: true },
};
