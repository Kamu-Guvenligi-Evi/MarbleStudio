// Historical affiliations are not claims that every member shared an ethnicity.
// Equipment reconstructions and game balance are distinguished from documented institutions.
const ref = (title, url) => ({ title, url });
const unit = (id, name, faction, period, kind, role, color, note, sources, combat) => ({
  id, name, faction, period, kind, role, color, note: `${period} · ${note}`,
  source: sources[0].url, sources, combat,
  credit: 'Tarihî donanım bilgileriyle özgün oyun çizimi',
  visualNote: 'Birliğin varlığı kaynaklıdır; çizim kesin üniforma rekonstrüksiyonu değildir. Renk, yüz ve küçük donanım ayrıntıları oyun yorumudur.',
});
export const TURKIC_ARAB_UNITS = [
  unit('khwarazm_hassa', 'Harezmşah hassa süvarisi', 'Harezmşahlar Devleti', '12. yy–1231', 'cavalry', 'Mızraklı hassa süvarisi', '#7e6153',
    'Sultanın yanındaki gulâmlardan oluşan hassa ordusu. Burada süvari seçeneği temsil edilir; hassa ordusunun tamamının aynı silahı taşıdığı ileri sürülmez. Konik miğfer, örgü zırh ve uzun kaftan bölgesel dönem donanımı yorumudur; Kıpçak yüz maskesi kullanılmaz.',
    [ref('TDV — Hârizmşahlar: gulâmlardan oluşan hassa ordusu', 'https://islamansiklopedisi.org.tr/harizmsahlar')],
    { hp: 182, damage: 28, reach: 33, cooldown: 1.35, speed: 37, armor: .23, chargeDamage: 44 }),
  unit('ottoman_deli', 'Deli — serhad süvarisi', 'Osmanlı Devleti', '16. yy', 'cavalry', 'Mızraklı öncü süvari', '#a5844e',
    'Serhad beylerinin ve beylerbeylerinin maiyetindeki seçilmiş öncü süvariler. Türk ve Balkan kökenli askerleri kapsar; Kapıkulu süvarilerinden ayrı teşkilattır. Hayvan postu, tüylü başlık, tekne kalkan ve orta boy mızrakla temsil edilir. Nicolay gravüründeki gösterişli tüyler sadeleştirilmiştir; sonraki yüzyılların ateşli silahları eklenmez.',
    [ref('TDV — Deli: teşkilat, 16. yüzyıl kıyafet ve silahları', 'https://islamansiklopedisi.org.tr/deli--asker'),
      ref('Nicolas de Nicolay — Delly gravürü, 1576 baskısı, folyo V.238', 'https://warfare.6te.net/Ottoman/byEuropeans/Nicolay-folio_V_238.htm')],
    { hp: 145, damage: 27, reach: 30, cooldown: 1.2, speed: 45, armor: .09, chargeDamage: 43 }),
  unit('umayyad_haras', 'Hares — Emevî halife muhafızı', 'Emevî Halifeliği', '661–750', 'spear', 'Mızraklı kişisel muhafız', '#b8aa87',
    'Muâviye döneminde kurulan özel halife muhafızları. Şehir kolluğunun tamamıyla veya bütün Emevî ordusuyla aynı birlik değildir. Oyunda yaya mızraklı koruma olarak temsil edilir. Sade başlık, uzun tunik ve küçük kalkan çizim tercihidir; doğrulanmış bir hares üniforması değildir.',
    [ref('TDV — Şurta: Muâviye’nin özel muhafız birliği (hares)', 'https://islamansiklopedisi.org.tr/surta'),
      ref('Al-Qantara — The Bodyguard of the Caliphs During the Umayyad and the Early Abbasid Periods', 'https://al-qantara.revistas.csic.es/index.php/al-qantara/article/view/348/340'),
      ref('Cleveland Museum — 700’lerden mızraklı avcı tasvirleri; muhafız portresi değildir', 'https://www.clevelandart.org/art/1947.193')],
    { hp: 126, damage: 24, reach: 29, cooldown: 1.2, speed: 23, armor: .12 }),
  unit('abbasid_abna', 'Ebnâü’d-devle — Abbâsî askeri', 'Abbâsî Halifeliği', '8. yy sonu–9. yy başı', 'sword', 'Seçkin çevreden kılıçlı piyade', '#4c4944',
    'Abbâsî hanedanını destekleyen, Horasanlı askerlerle ve onların soyuyla ilişkilendirilen askerî-siyasî çevre. Tek bir etnik Arap alayı değildir; kimliğinin oluşumu araştırmalarda tartışılır. Yaya kılıçlı seçenek oyun temsilidir. Samarra tasviri kaftan biçimi için dönem karşılaştırmasıdır, Ebnâ askerinin doğrudan portresi değildir.',
    [ref('John P. Turner — The abnā’ al-dawla: kimlik ve köken tartışması', 'https://digitalcommons.colby.edu/faculty_scholarship/69/'),
      ref('Encyclopaedia Iranica — Clothing VIII; 833–842 Samarra avcı freski', 'https://www.iranicaonline.org/articles/clothing-viii/')],
    { hp: 137, damage: 27, reach: 18, cooldown: 1.1, speed: 25, armor: .16 }),
];
export const TURKIC_ARAB_PROFILES = {
  khwarazm_hassa: { head: 'khwarazmHelmet', armor: 'khwarazmCoat', weapon: 'lance', shield: 'round', shieldColor: '#7e6153', cloth: '#7e6153', horse: 'grey', trousers: '#665344' },
  ottoman_deli: { head: 'deliFurCap', armor: 'deliPelt', weapon: 'shortSpear', shield: 'deliTekne', cloth: '#a5844e', horse: 'bay', trousers: '#897346' },
  umayyad_haras: { head: 'harasCap', armor: 'harasTunic', weapon: 'shortSpear', shield: 'round', shieldColor: '#876647', cloth: '#b8aa87', trousers: '#a69675' },
  abbasid_abna: { head: 'abnaCap', armor: 'abnaKaftan', weapon: 'sword', shield: 'round', shieldColor: '#4c4944', cloth: '#4c4944', trousers: '#987b61' },
};
