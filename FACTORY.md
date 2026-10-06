# İçerik Atölyesi

## YouTube'a otomatik yükleme

İçerik Atölyesi, tamamlanan MP4 dosyasını seçtiğin YouTube kanalına otomatik yükleyebilir. Her Google/YouTube kanalını panelde **YouTube kanalı bağla** ile ayrı ayrı bağla. Sonra üretim reçetesinde veya Studio ana ekranında **YouTube kanalı** ve **Görünürlük** seç. **Gizli** varsayılandır; **Herkese açık** seçilirse video üretim biter bitmez yayınlanır. Farklı kanallar için ayrı günlük reçeteler eklenebilir. Günlük reçete eklendiği gün ilk işi kuyruğa alır ve sonraki İstanbul takvim günlerinde bir kez daha ekler.

Kurulum: Google Cloud Console'da bir proje oluştur, **YouTube Data API v3** etkinleştir ve OAuth onay ekranını yapılandır. **Web application** türünde OAuth istemcisi oluştur. Yetkili yönlendirme adresine `http://127.0.0.1:5180/api/youtube/callback` ekle. İstemci kimliği ve gizli anahtarını hizmeti başlatmadan önce `YOUTUBE_CLIENT_ID` ve `YOUTUBE_CLIENT_SECRET` ortam değişkenlerine tanımla. Örnek PowerShell oturumu:

```powershell
$env:YOUTUBE_CLIENT_ID = 'Google istemci kimliği'
$env:YOUTUBE_CLIENT_SECRET = 'Google istemci gizli anahtarı'
./Start-Factory.cmd
```

Bağlantı anahtarları `output/.youtube-accounts.json` içinde saklanır ve panel tarafından dosya olarak sunulmaz. `output/` klasörünün tamamını yedekle; bu dosyayı paylaşma. Bağlı kanallar ve günlük reçeteler panelden görülebilir, yükleme sonucu veya hatası her işin yanında gösterilir. Yükleme oturumu kaydedilir; hizmet kesilirse aynı oturumdan devam etmeye çalışır. Video hazır kaldığı halde YouTube yüklemesi başarısız olabilir; hata üretim dosyasını silmez.

Google'ın [video yükleme API'si](https://developers.google.com/youtube/v3/docs/videos/insert) ve [devam ettirilebilir yükleme protokolü](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol) kullanılır. Google, 28 Temmuz 2020 sonrasında oluşturulan ve doğrulanmamış API projelerinden yüklenen videoları **gizli** görünürlükle sınırlar; herkese açık otomasyon için projenin Google denetiminden geçmesi gerekir. API kotası da Google projesine uygulanır. Google OAuth bilgileri ve kanal bağlantısı olmadan canlı YouTube yüklemesi test edilemez.

## Otomatik seçim

Ana ekrandaki **Bana bırak**, son 300 tamamlanmış üretime göre yarış türünü, müziği ve kadroyu seçer. Parkur, arena veya spiral özellikle seçilirse tür korunur. **İstatistik** seçimi kaynaklı veri kütüphanesindeki konuları geçmişe göre döndürür. Otomatik yarışlarda ayrı düzenlere sahip adaylar denenir; düşük hareket, görünürlük ve uzun boşluk denetimlerinden geçenler arasından seçim yapılır. Seçim gerekçeleri ve aday ölçüleri `metadata.json` içindedir.

## Yeni üretim akışı

Studio'daki **Video oluştur** aynı pencerede mevcut çalışmayı MP4 olarak hazırlar. **Bu ayarlarla seri üret** yeni başlangıç düzenleriyle birden fazla video oluşturur. Dikey, yatay veya kare biçim seçilir; çözünürlük, FPS, ses ve sunum ayarları **Gelişmiş seçenekler** içindedir. Tercihler yarış türüne göre hatırlanır. İstatistik yarışında mevcut tablo dışa aktarılır. Aynı çalışmada özgün simülasyon süresi korunur.

**Videolarım** üretim durumunu, video önizlemesini, indirmeyi, klasörde göstermeyi ve başlık kopyalamayı bir araya getirir. **Çalışmalarım** adlandırılmış çalışmaları önizlemeleriyle kaydeder; açma, kopyalama ve doğrudan video oluşturmayı destekler. En fazla 50 çalışma saklanır; Studio yedeğine dahil edilir.

Masaüstündeki **Marble Studio** kısayolu hem Studio'yu hem video hizmetini başlatır. Ayrı Atölye paneli gelişmiş seri ve günlük üretim için kullanılabilir.

Müzik ve efekt, yalnız efekt, yalnız müzik veya sessiz çıktı seçilebilir. Lider müziği, her yarışmacının ayrı kaldığı-yerden-devam imlecini çevrimdışı ses üretiminde korur. Kullanılan parçaların kaynak/atıf metinleri `upload.txt` ve `metadata.json` içine eklenir. Sade, yarış yayını ve sinema sunumları; kanal adı, özel giriş sorusu ve kapanış metniyle kullanılabilir.

Kalite ölçümü ilk olayın zamanı, gerçek konum değişimi, uzun sessiz aralıklar, kamerada görünen yarışmacı oranı ve son bölümdeki rekabeti izler. Spiral tüketimini lider değişimi saymaz. Son 24 tamamlanmış işin parkur/tema benzerliği seçim puanına ceza getirir. Bunlar editoryal yardımcı ölçülerdir; izlenme tahmini değildir. Kapak hareketli bir andan seçilir.

Geçmiş 12 işlik sayfalarda görüntülenir ve durumla filtrelenebilir. `output/factory.json` indeks, `output/.jobs/` iş ayrıntılarıdır; `.bak` dosyaları önceki kayıtları korur. Eski tek dosyalı geçmiş açılışta otomatik taşınır. **Yedeklemek için bütün `output/` klasörünü kopyala.** Hizmet çıktı klasörünü kilitler; aynı klasörle ikinci örnek açılmaz. Disk yazma hatası sonraki kayıt denemelerini kalıcı olarak bozmaz; panel hatayı gösterir.

Atölye açılışta uygulamayı derler ve hazırlanmış dosyaları sunar. Kod değişikliğinden sonra Atölye hizmetini yeniden başlat. Günlük üretim bilgisayar açıkken çalışır; YouTube'a yükleme yapılmaz.


Üretici v2: parkurlar altı profil (sprint, pinball, zamanlama, yol ayrımları, engel serisi, karma), üç tempo akışı ve 4–8 bölümle oluşturulur. Aynı bölüm art arda gelmez, bir tür en fazla iki kez kullanılır. Yarışçı sayısı 6–20 arasında sekiz seçeneklidir. Spiral için altı tema × dört davranış (klasik, çığ, ince çatlak, seri dalga); arena için üç hareket enerjisi vardır. Çığ daha büyük parçalar koparır, ince çatlak daha küçük parçalar kırar; dalgaların aralığı ve top hızları da değişir. Standart spiral ekranındaki klasik davranış korunur.

Spiral sesleri: düşüş, temas, buz kırılması, çoğalma ve merkeze ulaşma ayrı sentezlenir. Tema sesin tonunu değiştirir. Aynı sentezleyici canlı oynatma ve otomatik MP4 çıktısında kullanılır. Spiral ekranında efektler ilk güncellemede açılır; kullanıcı kapatırsa tercih saklanır. Ses testleri ve kombinasyon taraması: `npm run test:generation`.

`Start-Factory.cmd` dosyasını aç ve [üretim paneline](http://127.0.0.1:5180) git. Alternatif: `npm run factory`. Node.js, kurulu Chrome ve `npm install` gerekir. FFmpeg bağımlılıkla gelir; harici hizmet anahtarı gerekmez.

Panelde seri/kanal adı, adet, hedef süre, dil ve formatları seç. Sistem her video için adaylar üretir; tamamlanmayan, 25–180 saniye aralığı dışında kalan veya çok fazla kurtarma müdahalesi olan simülasyonları eler. Yarışlar 1× hızda kaydedilir; hedef süre aday seçiminde kullanılır. Hareket / lider değişimi puanı ve son 24 işteki görsel yapı benzerliği cezası ile aday seçer. Bu ölçümler izlenme garantisi değildir; üretici kurallı ve prosedüreldir, bir dil modeli kullanmaz.

Parkur formatında bölüm sırası, engel ayarları, başlangıç düzeni ve yarışçı sayısı değişir. Spiral altı malzemeyi ve farklı başlangıç tohumlarını kullanır. Arena farklı yarışçı sayılarıyla eleme simülasyonu üretir. Parkur videosu ilk gerçek kazananı gösterir; spiral merkezin açılmasını, arena sonucun belli olmasını bekler. Otomatik seriler ilk 3,5 saniye kısa bir soru ve sonda 2 saniyelik sonuç içerir. Video süresi yarışın doğal akışına göre belirlenir.

Çıktılar `output/<iş kimliği>/` altındadır; varsayılan çıktı 1080×1920, 30 FPS H.264/AAC `video.mp4`; `cover.jpg`; `upload.txt`; yeniden üretilebilir reçete, seçim ölçümleri ve süre bilgisi içeren `metadata.json`. Kaynak aktarılmamış otomatik serilerde sesler yerel olarak sentezlenir. Studio aktarımında seçilen müzik de kullanılabilir. Başlık ve giriş sorusu seçilen dilde hazırlanır; mevcut yarış görsellerindeki bazı sabit etiketler İngilizcedir.

Günlük üretim düğmesi seçili reçeteyi İstanbul takvim gününde bir kez ekler. Hizmet açık kalmalıdır; kapanan bilgisayarda çalışmaz. Kaçırılan günler topluca doldurulmaz. Günlük ayar tek seriye aittir; farklı kanallar için ayrı toplu işler oluşturulabilir. İşler sırayla işlenir. Hizmet yeniden açılırsa yarıda kalan iş baştan üretilir. Hatalı işler en fazla üç kez otomatik denenir; sonra panelden yeniden denenebilir; tamamlananlar tekrar kuyruğa alınmaz. Aynı anda yalnızca bir hizmet örneği çalıştır.

YouTube bağlantısı/yayınlama bu sürümde yoktur; dosyalar yayınlanmaz. Günlük üretim başlangıçta kapalıdır. Panel sadece `127.0.0.1:5180` üzerinde çalışır. Üretim geçmişi `output/factory.json` ve `output/.jobs/` içindedir; yedeklemeden silme. İş iptalinde yarım dosyalar inceleme için iş klasöründe kalabilir.

Kontroller: `npm run test:factory`, `npm run build`. Gerçek kodlama duman testi: hizmet açıkken `node tests/factory-export.mjs`; 30 saniyelik bir arena videosu üretir ve çıktıların eksiksizliğini kontrol eder.

Shorts süre referansı: [YouTube — üç dakikalık Shorts](https://support.google.com/youtube/answer/15424877?hl=en). Bu panel 25–180 saniyelik dikey videolar üretir.
