import { CIVILIZATIONS } from './historical-combat.js';

// Navigation families only: these do not change identity, equipment or combat roles.
const families = [
  ['maori', 'Māoriler', ['Aotearoa / Māori toplulukları']],
  ['hawaiian', 'Hawaiililer', ['Hawaiʻi şeflikleri']],
  ['middle-earth', 'Orta Dünya', ['Gondor', 'Rohan', 'Isengard', 'Mordor', 'Elfler', 'Cüceler', 'Orta Dünya Kahramanları', 'Orta Dünya Yaratıkları']],
  ['mythology', 'Mitoloji', ['Yunan Mitolojisi', 'İskandinav Mitolojisi', 'Mısır Mitolojisi']],
  ['turkic', 'Türkler', ['Osmanlı Devleti', 'Büyük Selçuklu Devleti', 'Anadolu Selçuklu Devleti', 'Gazneli Devleti', 'Kıpçak / Kuman', 'Timurlular', 'Göktürk Kağanlığı', 'Karahanlı Devleti', 'Harezmşahlar Devleti', 'Karluklar', 'Uygurlar', 'Akkoyunlular', 'Uzlar']],
  ['marwanid', 'Mervânîler', ['Mervânîler']],
  ['serbian', 'Sırplar', ['Sırp Despotluğu']],
  ['kara-tatar', 'Anadolu Kara Tatarları', ['Anadolu Kara Tatarları']],
  ['andalusian', 'Endülüslüler', ['Kurtuba Halifeliği']],
  ['arab', 'Araplar / Halifelikler', ['Medine Arapları', 'Emevî Halifeliği', 'Abbâsî Halifeliği']],
  ['persian', 'Farslar', ['Ahameniş İmparatorluğu', 'Part / Arsak İmparatorluğu', 'Sâsânî İmparatorluğu']],
  ['daylamite', 'Deylemliler', ['Deylem toplulukları']],
  ['bactrian', 'Baktriyalılar', ['Baktriya / Ahameniş hizmeti', 'Baktriya / Makedon hizmeti']],
  ['lycian', 'Likyalılar', ['Likya / Ahameniş hizmeti']],
  ['paphlagonian', 'Paflagonlar', ['Paflagonya / Ahameniş hizmeti']],
  ['colchian', 'Kolhisliler', ['Kolhis / Ahameniş hizmeti']],
  ['libyan', 'Antik Libyalılar', ['Libya / Ahameniş hizmeti']],
  ['aithiopian', 'Aithioplar (antik adlandırma)', ['Aithioplar / Ahameniş hizmeti']],
  ['assyrian', 'Asurlular', ['Yeni Asur']],
  ['mughal', 'Babürler / Hindistan', ['Babür İmparatorluğu']],
  ['german', 'Almanlar', ['Alman Toprakları', 'Kutsal Roma İmparatorluğu', 'Töton Tarikatı / Tarikat Devleti']],
  ['spanish', 'İspanyollar', ['León / Kastilya', 'Aragon Tacı', 'İspanyol İtalya Seferi Orduları', 'İspanyol Tercioları']],
  ['portuguese', 'Portekizliler', ['Portekiz Krallığı']],
  ['flemish', 'Flamanlar', ['Flandre şehir milisleri']],
  ['burgundian', 'Burgonyalılar', ['Burgonya Dükalığı']],
  ['frankish', 'Franklar', ['Merovenj Frank Krallıkları']],
  ['sarmatian', 'Sarmatlar', ['Roksolan / Sarmat toplulukları']],
  ['french', 'Fransızlar', ['Fransa Krallığı']],
  ['italian', 'İtalyanlar / Roma', ['Roma Cumhuriyeti', 'Roma İmparatorluğu', 'Geç Roma İmparatorluğu', 'Ceneviz Cumhuriyeti', 'Venedik Cumhuriyeti', 'Milano Dükalığı', 'Floransa Cumhuriyeti', 'İtalyan Şehir Devletleri']],
  ['hunnic', 'Hunlar', ['Avrupa Hun Devleti']],
  ['germanic-allies', 'Gotlar / Gepidler / Skirler', ['Ostrogotlar', 'Gepidler', 'Skirler']],
  ['continental-celts', 'Galya Keltleri', ['Galya / Kartaca hizmeti']],
  ['ancient-iberian', 'Antik İberler / Hispanlar', ['İberya / Kartaca hizmeti', 'Hispania / Roma hizmeti']],
  ['ancient-ligurian', 'Ligurlar', ['Ligurlar / Kartaca hizmeti']],
  ['ancient-germanic', 'Antik Cermenler', ['Ren ötesi Cermenler / Roma hizmeti']],
  ['numidian', 'Numidyalılar', ['Numidya / Roma hizmeti']],
  ['mongol', 'Moğollar', ['Moğol İmparatorluğu', 'İlhanlı Devleti']],
  ['japanese', 'Japonlar', ['Japonya']],
  ['chinese', 'Çinliler', ['Qin Hanedanı', 'Han Hanedanı', 'Tang Hanedanı', 'Song Hanedanı', 'Ming Hanedanı']],
  ['sogdian', 'Soğdlar', ['Soğd şehir devletleri', 'Soğdlar / Makedon hizmeti']],
  ['ancient-mauri', 'Antik Mauriler', ['Mauri / Kartaca hizmeti']],
  ['scottish', 'İskoçlar', ['İskoçya Krallığı']],
  ['welsh', 'Galliler', ['Galler / İngiliz hizmeti', 'Galler Prenslikleri']],
  ['hungarian', 'Macarlar', ['Macaristan Krallığı']],
  ['czech', 'Çekler / Bohemya', ['Bohemya / Hussitler']],
  ['scythian', 'İskitler', ['İskitler']],
  ['dahae', 'Dahalar', ['Dahalar / Makedon hizmeti']],
  ['thracian', 'Traklar', ['Traklar']],
  ['dacian', 'Daklar', ['Daklar']],
  ['swiss', 'İsviçreliler', ['İsviçre kantonları']],
  ['tibetan', 'Tibetliler', ['Tibet']],
  ['moche', 'Moche', ['Moche']],
  ['mixtec', 'Mixtecler', ['Mixtec şehir devletleri']],
  ['nubian', 'Nubyalılar', ['Nubya']],
  ['korean', 'Koreliler', ['Goryeo Kore']],
  ['khmer', 'Khmerler', ['Khmer İmparatorluğu']],
  ['greek', 'Yunanlar / Bizans', ['Atina', 'Sparta', 'Makedonya Krallığı', 'Bizans İmparatorluğu', 'Rodos', 'Girit Şehir Devletleri', 'Thebai', 'Thespiai', 'Phokis', 'Opus Lokris', 'Yunan şehir devletleri']],
  ['egyptian', 'Mısır / Eyyûbîler / Memlükler', ['Eski Krallık Mısır', 'Orta Krallık Mısır', 'Yeni Krallık Mısır', 'Mısır / Ahameniş hizmeti', 'Eyyûbîler', 'Memlük Sultanlığı', 'Eyyûbîler / Memlük Sultanlığı']],
  ['norse', 'İskandinavlar', ['İskandinavya']],
  ['english', 'İngilizler', ['Anglosakson İngiltere', 'İngiltere Krallığı']],
  ['gaelic', 'İrlandalılar', ['İrlanda Gal lordlukları']],
  ['rus', 'Ruslar', ['Kiev Rus ve Rus Prenslikleri']],
  ['polish', 'Lehler / Litvanlar', ['Polonya Krallığı', 'Polonya-Litvanya']],
  ['carthaginian', 'Kartacalılar', ['Kartaca']],
  ['benin', 'Benin / Edo', ['Benin Krallığı']],
  ['mexica', 'Aztekler', ['Meksika / Mexica (Aztek)']],
  ['maya', 'Mayalar', ['Maya şehir devletleri']],
  ['inca', 'İnkalar', ['İnka İmparatorluğu']],
  ['crusader', 'Haçlı Orduları', ['Hospitalier / Aziz Yuhanna Tarikatı', 'Tapınak Tarikatı', 'Haçlı Seferi Orduları']],
  ['orders', 'Orta Çağ Avrupası', ['Orta Çağ Avrupası']],
];
// Menu collections, not shared ethnic identities or combat rules. Keep the
// original families as search aliases even when their countries move.
const ancientFamilies = new Set([
  'persian', 'bactrian', 'lycian', 'paphlagonian', 'colchian', 'libyan',
  'aithiopian', 'assyrian', 'sarmatian', 'hunnic', 'germanic-allies',
  'continental-celts', 'ancient-iberian', 'ancient-germanic', 'scythian',
  'thracian', 'dacian', 'carthaginian', 'numidian', 'dahae', 'ancient-mauri',
]);
const americanFamilies = new Set(['moche', 'mixtec', 'mexica', 'maya', 'inca']);
const africanFamilies = new Set(['egyptian', 'nubian', 'benin']);
const oceanianFamilies = new Set(['maori', 'hawaiian']);
const ancientCountries = new Set([
  'Soğdlar / Makedon hizmeti',
  'Ligurlar / Kartaca hizmeti',
  'Roma Cumhuriyeti', 'Roma İmparatorluğu', 'Geç Roma İmparatorluğu',
  'Qin Hanedanı', 'Han Hanedanı',
  'Atina', 'Sparta', 'Makedonya Krallığı', 'Rodos', 'Girit Şehir Devletleri',
  'Thebai', 'Thespiai', 'Phokis', 'Opus Lokris', 'Yunan şehir devletleri',
  'Eski Krallık Mısır', 'Orta Krallık Mısır', 'Yeni Krallık Mısır', 'Mısır / Ahameniş hizmeti',
]);
const ancient = ['ancient', 'Antik Medeniyetler', []];
const americas = ['americas', 'Amerika Medeniyetleri', []];
const africa = ['africa', 'Afrika Medeniyetleri', []];
const oceania = ['oceania', 'Okyanusya', []];
const westernEurope = ['western-europe', 'Batı ve Güney Avrupa', []];
const easternEurope = ['eastern-europe', 'Orta ve Doğu Avrupa', []];
const northernEurope = ['northern-europe', 'Kuzey Avrupa ve Britanya', []];
const middleEast = ['middle-east', 'Orta Doğu', []];
const asia = ['asia', 'Asya Medeniyetleri', []];
const regionalCollections = new Map([
  ...['andalusian', 'spanish', 'portuguese', 'flemish', 'burgundian', 'frankish', 'french', 'italian'].map(id => [id, westernEurope]),
  ...['german', 'hungarian', 'czech', 'swiss', 'greek', 'rus', 'polish', 'crusader', 'orders'].map(id => [id, easternEurope]),
  ...['scottish', 'welsh', 'norse', 'english', 'gaelic'].map(id => [id, northernEurope]),
  ...['arab', 'daylamite', 'marwanid'].map(id => [id, middleEast]),
  ...['mughal', 'mongol', 'japanese', 'chinese', 'sogdian', 'tibetan', 'korean', 'khmer'].map(id => [id, asia]),
]);
const remainingLabels = { italian: 'İtalyanlar', greek: 'Bizans', egyptian: 'Eyyûbîler / Memlükler' };
const navigation = families.map(([id, name, countries]) => {
  const remaining = countries.filter(country => {
    const collection = americanFamilies.has(id) ? americas
      : ancientFamilies.has(id) || ancientCountries.has(country) ? ancient
      : africanFamilies.has(id) ? africa
      : oceanianFamilies.has(id) ? oceania : regionalCollections.get(id);
    if (!collection) return true;
    collection[2].push(country);
    return false;
  });
  return [id, remainingLabels[id] || name, remaining];
});
navigation.unshift(ancient, westernEurope, easternEurope, northernEurope, middleEast, asia, africa, americas, oceania);
const known = new Map(CIVILIZATIONS.map(country => [country.name, country]));
export const CULTURE_GROUPS = navigation.map(([id, name, countries]) => ({
  id, name, countries: countries.map(name => known.get(name)).filter(Boolean),
})).filter(group => group.countries.length);
const assigned = new Set(CULTURE_GROUPS.flatMap(group => group.countries.map(country => country.name)));
const remaining = CIVILIZATIONS.filter(country => !assigned.has(country.name));
if (remaining.length) CULTURE_GROUPS.push({ id: 'other', name: 'Diğer', countries: remaining });
export const cultureForCivilization = name => CULTURE_GROUPS.find(group => group.countries.some(country => country.name === name));
export const civilizationSearchTerms = name => `${cultureForCivilization(name)?.name || ''} ${families.find(([, , countries]) => countries.includes(name))?.[1] || ''}`;
export function civilizationMatches(value, name) {
  if (!value) return true;
  if (value.startsWith('culture:')) return cultureForCivilization(name)?.id === value.slice(8);
  return value === name;
}
