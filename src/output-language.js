// Studio controls are Turkish; built-in content and recordings are English.
export const OUTPUT_LANGUAGE = 'en';

const names = new Map();
const regionsTR = new Intl.DisplayNames(['tr'], {type:'region'});
const regionsEN = new Intl.DisplayNames(['en'], {type:'region'});
for (let a=65;a<=90;a++) for (let b=65;b<=90;b++) {
  const code=String.fromCharCode(a,b),tr=regionsTR.of(code),en=regionsEN.of(code);
  if(tr!==code && en!==code) names.set(tr,en);
}
const translations = {
  'Lavanta':'Lavender','Mercan':'Coral','Buz':'Ice','Altın':'Gold','Nane':'Mint','Mavi':'Blue','Alev':'Flame',
  'İnci':'Pearl','Bakır':'Copper','Fıstık':'Pistachio','Orkide':'Orchid','Turkuaz':'Turquoise',
  'Limon':'Lemon','Pembe':'Pink','Okyanus':'Ocean','Leylak':'Lilac','Yeşim':'Jade',
  'Türkiye':'Turkey','ABD':'USA','BAE':'UAE','SSCB / Rusya':'USSR / Russia',
  'Bosna Hersek':'Bosnia and Herzegovina','Filistin':'Palestine',
  'Kongo - Kinşasa':'DR Congo','Çin Makao ÖİB':'Macao SAR, China','Çin Hong Kong ÖİB':'Hong Kong SAR, China',
  'Bayern Münih':'Bayern Munich','Steaua Bükreş':'Steaua Bucharest','Kızılyıldız':'Red Star Belgrade','Marsilya':'Marseille',
  'Osmanlı İmparatorluğu':'Ottoman Empire','Roma İmparatorluğu':'Roman Empire','Bizans İmparatorluğu':'Byzantine Empire',
  'Büyük Selçuklu':'Great Seljuk Empire','Moğol İmparatorluğu':'Mongol Empire','Britanya İmparatorluğu':'British Empire',
  'Rus İmparatorluğu':'Russian Empire','Avusturya-Macaristan':'Austria-Hungary','Alman İmparatorluğu':'German Empire',
  'Babür İmparatorluğu':'Mughal Empire','Safevî Devleti':'Safavid Empire','Ahameniş İmparatorluğu':'Achaemenid Empire',
  'İnka İmparatorluğu':'Inca Empire','Aztek İmparatorluğu':'Aztec Empire','Qing Hanedanı':'Qing Dynasty','Timur İmparatorluğu':'Timurid Empire',
  'Fatih Sultan Mehmet':'Mehmed the Conqueror','Kanuni Sultan Süleyman':'Suleiman the Magnificent',
  'Napolyon Bonapart':'Napoleon Bonaparte','Jül Sezar':'Julius Caesar','Büyük İskender':'Alexander the Great',
  'Cengiz Han':'Genghis Khan','Kleopatra':'Cleopatra','Kraliçe Victoria':'Queen Victoria','İbn Sina':'Avicenna',
  'Koç':'Aries','Boğa':'Taurus','İkizler':'Gemini','Yengeç':'Cancer','Aslan':'Leo','Başak':'Virgo',
  'Terazi':'Libra','Akrep':'Scorpio','Yay':'Sagittarius','Oğlak':'Capricorn','Kova':'Aquarius','Balık':'Pisces',
  'Süper Lig: kupa yarışı':'Super Lig: Trophy Race','Formula 1: galibiyet rekoru':'Formula 1: Race Win Records',
  'Uzay yarışı: yörüngeye çıkanlar':'Space Race: Objects Launched','Elektrikli otomobil yarışı':'Electric Car Sales Race',
  'Turizm: pandemi kırılması':'Tourism: The Pandemic Shock','Avrupa Kupası / Şampiyonlar Ligi':'European Cup / Champions League',
  'Nüfus yarışı':'Population Race','Ekonomilerin büyüklüğü':'Size of Economies','Kişi başına GSYİH':'GDP per Capita',
  'Mal ve hizmet ihracatı':'Exports of Goods and Services','İnternet kullanım oranı':'Internet Usage Rate',
  'şampiyonluk':'titles','galibiyet':'wins','kayıtlı nesne':'registered objects','bin otomobil':'thousand cars',
  'milyon ziyaret':'million arrivals','milyon kişi':'million people','milyar ABD doları':'billion USD',
  'ABD doları / kişi':'USD per person','% nüfus':'% of population','puan':'points',
  'TFF · Süper Lig sezon şampiyonları':'TFF · Super Lig season champions',
  'Jolpica / Ergast · F1 yarış sonuçları':'Jolpica / Ergast · F1 race results',
  'UEFA · sezon sonu toplam şampiyonluk':'UEFA · Cumulative season-end titles',
  'Zamanla değişen sıralama':'Rankings Over Time','Yıllara göre sıralama':'Rankings by Year',
  'Örnek veri · Gerçek istatistik değildir.':'Sample data · Not real statistics.',
  'ÖRNEK VERİ':'SAMPLE DATA','SABİT KARŞILAŞTIRMA':'SNAPSHOT COMPARISON','Karşılaştırma':'Comparison',
  'Kaynak belirtilmedi':'Source not specified','Değer':'Value','Yıl':'Year','İris':'Iris',
  'Parkurum':'My Course','Parkur yarışı':'Marble Race','Küre arenası':'Sphere Arena','Alan Savaşı':'Territory Battle','Spiral çoğalma':'Spiral Multiplication',
};
for (const [tr,en] of Object.entries(translations)) names.set(tr,en);

// Translate known built-in labels, including old saved rosters. Personal names
// retain their proper spelling; unknown user text is preserved.
export function englishOutput(value) {
  if(value==null)return value;
  const text=String(value);
  if(names.has(text))return names.get(text);
  return text.replace(/^Dünya Bankası · Seçili (\d+) ülke\/ekonomi · /,'World Bank · Selected $1 countries/economies · ');
}

export function englishRosterName(value) {
  const name=englishOutput(value);
  return name==null?name:name.slice(0,24);
}
