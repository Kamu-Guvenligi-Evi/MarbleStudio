// Institutions are documented; battlefield roles and colours are game interpretations.
const make = (id, name, faction, period, kind, role, color, note, source, combat) => ({
  id, name, faction, period, kind, role, color, note: `${period} · ${note}`, source, combat,
  sources: id === 'gokturk_bori' ? [{ title: 'Göktürk Dönemi Madeni Silahları — J. Özlem Oktay Çerezci', url: 'https://dergipark.org.tr/tr/download/article-file/810705' }] : [],
  credit: 'Tarihî araştırmadan özgün oyun çizimi',
  visualNote: 'Kesin bir birlik üniforması bilinmiyor. Dönem donanımından yorumlanan çizim; renkler ve savaş rolü oyun tercihidir.',
});
export const TURKIC_ELITE_UNITS = [
  make('gokturk_bori', 'Böri — kağan muhafızı', 'Göktürk Kağanlığı', '6.–8. yy', 'cavalry', 'Kılıçlı muhafız süvarisi', '#486d78',
    'Kağanın seçilmiş muhafızları. Atlı rolü yorumdur; Göktürk buluntularından lamelli zırh ve hafif eğri kılıç kullanılır. Böri adı kurt başlığı giyildiğinin kanıtı değildir.',
    'https://dergipark.org.tr/tr/download/article-file/3528902',
    { hp: 180, damage: 30, reach: 22, cooldown: 1.25, speed: 37, armor: .22, chargeDamage: 38 }),
  make('karakhanid_palace_guard', 'Yatgak / Turgak — saray muhafızı', 'Karahanlı Devleti', '11.–12. yy', 'spear', 'Mızraklı saray muhafızı', '#8a5345',
    'Gece ve gündüz hükümdarı ve sarayı koruyan muhafızlar tek kartta birleştirilir. Kaftan, başlık, kalkan ve mızrakla yaya temsili; belirli bir üniformanın kopyası değildir.',
    'https://islamansiklopedisi.org.tr/karahanlilar',
    { hp: 145, damage: 25, reach: 32, cooldown: 1.2, speed: 22, armor: .15 }),
  make('karakhanid_hassa', 'Karahanlı hassa askeri', 'Karahanlı Devleti', '11.–12. yy', 'cavalry', 'Hassa atlı okçusu', '#6b7048',
    'Hükümdarın maaşlı özel ordusu. Teşkilatın ayrıntıları sınırlı bilinir; atlı okçu rolü ve zırhlı giysisi oyun için yorumlanmıştır. Saray nöbetçileriyle aynı kart değildir.',
    'https://islamansiklopedisi.org.tr/karahanlilar',
    { hp: 135, damage: 20, reach: 170, cooldown: 1.7, speed: 39, armor: .13, chargeDamage: 0 }),
];
export const TURKIC_ELITE_PROFILES = {
  gokturk_bori: { head: 'boriSegmented', armor: 'boriLamellar', weapon: 'earlySabre', cloth: '#486d78', horse: 'black', trim: '#b69867' },
  karakhanid_palace_guard: { head: 'karakhanidCap', armor: 'karakhanidKaftan', weapon: 'spear', shield: 'round', cloth: '#8a5345', shieldColor: '#765736', trim: '#d1b77b' },
  karakhanid_hassa: { head: 'karakhanidCone', armor: 'karakhanidLamellar', weapon: 'bow', cloth: '#6b7048', horse: 'dun', quiver: true, trim: '#d4be8a' },
};
