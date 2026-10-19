// Institutions are sourced; equipment variants and balance are game interpretations.
const make = (id, name, faction, period, kind, role, color, note, source, combat) => ({
  id, name, faction, period, kind, role, color, note: `${period} · ${note}`, source, combat,
  credit: 'Dönem donanımından özgün oyun çizimi',
  visualNote: 'Çizim, dönemin donanımından yorumlanmıştır; renkler kesin bir birlik üniforması iddiası değildir.',
  sources: [{ title: 'Orta Çağ Avrupa silahları ve zırhları — Metropolitan Museum', url: 'https://www.metmuseum.org/essays/arms-and-armor-in-medieval-europe' }],
});
export const EUROPEAN_ELITE_UNITS = [
  make('german_doppelsoldner', 'Doppelsöldner — çift maaşlı kılıççı', 'Alman Toprakları', '15. yy sonu–16. yy', 'sword', 'Çift elli kılıç piyadesi', '#a87a36',
    'Landsknechtler içindeki çift maaşlı askerlerin büyük kılıç taşıyan çeşidi. Her Doppelsöldner kılıççı değildi; burada mızraklı Landsknecht kartından farklı silahlı seçenek temsil edilir.',
    'https://www.historisches-lexikon-bayerns.de/Lexikon/Landsknechte',
    { hp: 150, damage: 39, reach: 30, cooldown: 1.55, speed: 24, armor: .18 }),
  make('german_ministerial', 'Ministerial şövalye', 'Kutsal Roma İmparatorluğu', '11.–13. yy', 'cavalry', 'Mızraklı hizmet şövalyesi', '#997f54',
    'Hükümdar ve büyük lordlara idari ve atlı askerî hizmet veren ministerial sınıfından bir şövalye. Tek bir muhafız alayının adı değildir. Erken dönem zincir zırhlı süvari temsili.',
    'https://historisches-lexikon.li/Ministerialit%C3%A4t_%28Dienstmannschaft%29',
    { hp: 180, damage: 28, reach: 34, cooldown: 1.4, speed: 35, armor: .23, chargeDamage: 44 }),
  make('rus_hryd_guard', 'Hryd — knez muhafızı', 'Kiev Rus ve Rus Prenslikleri', '10.–13. yy', 'sword', 'Kılıçlı maiyet muhafızı', '#6b7a57',
    'Drujina maiyetinin genç kolu hryd, knezin kişisel korunması ve çeşitli hizmetlerinde görev alırdı. Ayrı bir ordu değildir; mevcut atlı Drujina yanında yaya kılıç-kalkan seçeneği oyun yorumudur.',
    'https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CD%5CR%5CDruzhynaIT.htm',
    { hp: 145, damage: 27, reach: 23, cooldown: 1.15, speed: 25, armor: .2 }),
  make('french_ordonnance_gendarme', 'Ordonnance ağır süvarisi', 'Fransa Krallığı', '15. yy ikinci yarısı', 'cavalry', 'Zırhlı kral süvarisi', '#365b86',
    'VII. Charles’ın 1445 düzenlemesiyle kurulan sürekli bölüklerdeki ağır silahlı süvari. Bir lance içindeki okçular ve yardımcılar bu kartın parçası değildir. Plaka zırh ve uzun süvari mızrağı taşır.',
    'https://www.musee-armee.fr/ExpoChevaliersBombardes/time-of-refom.html',
    { hp: 205, damage: 32, reach: 36, cooldown: 1.5, speed: 32, armor: .34, chargeDamage: 52 }),
  make('french_scots_guard', 'Garde Écossaise — İskoç Muhafızı', 'Fransa Krallığı', '15. yy', 'ranged', 'Kraliyet muhafız okçusu', '#e4d6b4',
    'Fransız kralının hizmetindeki İskoç kökenli seçkin muhafızlar. 15. yüzyıl kayıtlarındaki yakın koruma okçuları temsil edilir; Fransa’ya hizmet ettikleri için Fransızlar menüsündedir. Uzun yaylı savaş rolü oyun yorumudur.',
    'https://larevuedhistoiremilitaire.fr/2024/07/24/la-genese-des-archers-du-corps-lelite-de-la-garde-ecossaise-et-les-precurseurs-des-gardes-de-la-manche/',
    { hp: 115, damage: 24, reach: 205, cooldown: 1.8, speed: 24, armor: .13 }),
];
export const EUROPEAN_ELITE_PROFILES = {
  german_doppelsoldner: { head: 'beret', armor: 'landsknechtBreastplate', weapon: 'zweihander', cloth: '#a87a36', secondary: '#693e3c', trousers: '#8d533e' },
  german_ministerial: { head: 'mailHood', armor: 'mail', weapon: 'lance', shield: 'kite', cloth: '#997f54', horse: 'bay', shieldColor: '#997f54', emblem: 'stripe', badge: '#eee3be' },
  rus_hryd_guard: { head: 'rus', armor: 'mail', weapon: 'longsword', shield: 'round', cloth: '#6b7a57', shieldColor: '#6b7a57', cape: '#646b4d', emblem: 'quarters', beard: true, legWraps: true },
  french_ordonnance_gendarme: { head: 'frenchArmet', armor: 'plate', weapon: 'lance', cloth: '#365b86', horse: 'grey', bard: 'cloth', emblem: 'fleur', badge: '#d4b465' },
  french_scots_guard: { head: 'frenchKettle', armor: 'guardCoat', weapon: 'longbow', cloth: '#e4d6b4', quiver: true, trousers: '#565f66' },
};
// Clarify existing cards without changing saved identifiers or their combat roles.
export const EUROPEAN_HISTORICAL_REVIEWS = {
  teutonic_knight: {
    name: 'Töton şövalyesi — Teutonik tarikat süvarisi',
    period: '13. yy seçkisi',
    note: '13. yy seçkisi · Kökeni 1190 Akka hastanesine uzanan askerî-dinî tarikatın şövalye kardeşi. Daha sonra Baltık bölgesinde savaştılar. Zincir zırh, kapalı büyük miğfer, mızrak ve kalkanla temsil edilir. Beyaz pelerin üzerindeki siyah haç tarikatın işaretidir; bütün ordu şövalye kardeşlerden oluşmazdı.',
    sources: [{ title: 'Deutscher Orden — Akka, 1190 kuruluşu', url: 'https://www.deutscher-orden.de/spiritualitaet/ordenspatrone' }, { title: 'Deutscher Orden — Beyaz pelerin ve siyah haç', url: 'https://www.deutscher-orden.de/spiritualitaet/das-kreuz' }, { title: 'The Met — 1000–1300 Avrupa zırhı', url: 'https://www.metmuseum.org/essays/fashion-in-european-armor-1000-1300' }],
  },
  landsknecht: {
    name: 'Landsknecht — mızraklı piyade',
    role: 'Uzun mızraklı ücretli piyade',
    note: '15. yy sonu–16. yy · Alman topraklarında toplanan ücretli piyadelerin uzun mızraklı seçeneği. Bütün Landsknechtler seçkin muhafız değildi. Çift maaşlı büyük kılıç seçeneği Doppelsöldner kartında temsil edilir; renkli giysiler ortak ve kesin bir üniforma değildir.',
    sources: [{ title: 'Historisches Lexikon Bayerns — Landsknechte', url: 'https://www.historisches-lexikon-bayerns.de/Lexikon/Landsknechte' }],
  },
  rus_druzhina: {
    note: '10.–13. yy · Orta Çağ Rus knezlerinin silahlı maiyeti ve ordularının çekirdeği. Kart zincir zırhlı, mızraklı atlı seçeneği temsil eder; bütün Drujina aynı donanımı taşımazdı. Hryd bu maiyetin genç koludur, bağımsız bir ordu değildir.',
    sources: [{ title: 'Canadian Institute of Ukrainian Studies — Druzhyna', url: 'https://www.encyclopediaofukraine.com/display.asp?linkpath=pages%5CD%5CR%5CDruzhynaIT.htm' }],
  },
};
