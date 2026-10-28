# Marble Studio

## Cam Kırıcı

Ana ekrandaki **Cam Kırıcı** bağlantısı veya `/glass-breaker.html`, CodeCraftedPhysics'in [cam kırma videosundan](https://www.youtube.com/shorts/K-xjYapAV9M) uyarlanan bağımsız oyunu açar. Sağ üstten bırakılan toplar spiral kanalı dolaşır, soldan cama girer ve darbe sırasında tüketilir. Cam korunarak 1, 2, 5, 10, 15… 100 topluk gruplar denenir; hareket durulduğunda sonraki denemeye geçilir. Üçgen cam parçaları, darbe çatlakları, dönen ve yerçekimiyle düşen kırıklar ve çarpışma sesleri bulunur. Cam yüzdesi gerçekten kırılan yüzey alanını ölçer; videodaki yüzdeler veya bitiş süresi sabitlenmez.

Toplar başlangıç hızı olmadan yerçekimiyle düşer. **Top ekle** düğmesi veya daireye dokunma aynı girişten yeni top bırakır. Otomatik gruplar kapatılabilir; hız 1×, 3×, 10× veya 25× seçilebilir. Oyun alanındaki × rozeti grubun top sayısını gösterir. Boşluk duraklatır, R aynı camı yeniden başlatır, A top ekler; **Yeni cam** farklı bir kırılma deseni oluşturur. Testler: `npm run test:glass` (tarayıcı testi için açık Studio adresi `TEST_STUDIO_ORIGIN` ile seçilebilir). Bu bağımsız oyun otomatik MP4 üretim kuyruğuna bağlı değildir.

Stüdyo arayüzü Türkçedir; videolardaki hazır isimler, yarış metinleri, istatistik etiketleri, Pi anlatımı ve otomatik başlık/açıklamalar İngilizcedir. Eski Türkçe dil tercihleri yeni üretimde İngilizce uygulanır. Elle yazılan özel metinleri İngilizce girin; kişi ve kulüp özel adları özgün yazımlarını korur.

Editörde **Çarpışma sesi** yanındaki **Ses efekti** menüsünden Klasik, Miyav, Havlama, Lastik oyuncak, Baloncuk, Lazer, Zil veya Tahta tıkırtısı seçilebilir. **Dinle** seçili sesi önceden çalar. Yeni efektler sentezlenmiş seslerdir. Seçim her yarış türü için kaydedilir, çalışma/yedek dosyalarında korunur ve WebM ile aynı çalışmadan üretilen MP4 videolara aktarılır. Spiral kırılmaları da seçili efekti kullanır; düşüş, çoğalma ve bitiş sesleri kendi efektlerini korur.

Menüde ayrıca kullanıcının gönderdiği YouTube videolarından alınan **Kasa · Cha-Ching** (1,70 sn) ve **Minecraft köylüsü** (0,57 sn) kayıtları bulunur. Baştaki ve sondaki sessizlikler kırpılır; ses seviyesi dengelenir. Kayıtlar yereldir, oynatırken YouTube bağlantısı gerekmez. Canlı oynatma, Dinle, WebM ve MP4 aynı ses verisini kullanır; sık çarpışmalarda kayıt süresi kadar beklenerek üst üste binme azaltılır. Dosyalar ve kaynak bilgileri `public/audio/youtube/` altında, yeniden içe aktarma aracı `scripts/import-youtube-effects.mjs` içindedir.

Video oluşturulmadan önce **LastBallStand** veya **VortexBallSpiral** seçilir. Seçilen ad, %13 opaklıkta ™ filigranı olarak bütün video türlerine işlenir. Seçim iptal edilirse üretim başlamaz. Otomatik YouTube yüklemesi açıksa seçilen markanın bağlı hesabı kullanılır. Günlük seri için kanal, reçete oluşturulurken seçilir; mevcut video dosyaları değişmez. Kontrol: Studio açıkken `npm.cmd run test:branding`.

Canlı içerikler ekranın tarayıcıya sunduğu yenileme hızında çizilir; 60 FPS sınırı yoktur. Sabit 120 Hz fizik adımları arasında toplar, engeller ve parçacıklar ara karelerle çizilir; yarış hızı ve sonuçları ekran hızına göre değişmez. WebM kaydı sabit FPS sınırı koymaz. MP4 varsayılanı 144 FPS'tir; gelişmiş seçeneklerde daha yüksek FPS girilebilir. Yüksek FPS dosya boyutunu ve üretim süresini artırır. Oynatma akıcılığı ekran, tarayıcı, video çözücü ve paylaşım platformuna bağlıdır; mevcut videoların kare hızı değişmez.

İçerik Atölyesi, OAuth ile bağlanan YouTube kanallarına üretim sonrası otomatik yükleme ve kanal başına günlük reçete destekler. Kurulum ve Google API sınırlamaları: [FACTORY.md](FACTORY.md#youtubea-otomatik-yükleme).

## Hızlı kullanım

**Spiral → Hipnotik ses** varsayılan olarak kapalıdır. Açılınca ilk kullanıcı tıklaması/tuşuyla Web Audio etkinleşir; oyun oynarken yumuşak pentatonik kırılma notaları, çok kısık C/G arka planı ve bas vuruşları duyulur. Dosya müziği ve eski efektler bu seçenek açıkken çalmaz. **M** veya **Sesi kapat/aç** sesi değiştirir; oyunu durdurmaz ve yeniden başlatmaz. Yazı alanında M normal yazılır. Duraklatma, başka bölüme geçme ve sekmeyi gizleme sesi de susturur. Seçim çalışma/yedekte korunur, WebM ve MP4 çıktısında uygulanır; yeni sistem ses dosyası veya harici ses kütüphanesi kullanmaz.

Ses ayarları `src/spiral-hypnotic-audio.js` başındaki `CONFIG` nesnesindedir: 65 BPM, C majör pentatonik üç oktav, 0,82 sn sönüm, ±0,6 stereo, %35 reverb ve sekiz ses sınırı. Sekizlik vurguların arasındaki küçük adımlar gecikmeyi 120 ms altında tutar. Görseller, fizik ve oyun mantığı değiştirilmez. Kontrol: `npm.cmd run test:spiral:hypnotic`.

**Spiral** girişteki artan çarpana ek olarak rastgele 4–6 noktada ×2–×5 çoğalma kapısı oluşturur. Yerler ve değerler yarış düzeni numarasına bağlıdır; **Yeni yarış** veya **Çarpanları yenile** ile manuelde de değişir. Aynı düzeni başa almak, yeniden açmak ve aynı çalışmayı videoya dönüştürmek çarpanları korur. Otomatik üretimde her yeni içerik farklı çarpan düzeniyle hazırlanır. Top ve kopyaları aynı kapıyı bir kez kullanır; sonraki kapılarda yeniden çoğalabilir. Aynı anda en fazla 64 top bulunur.

**Hazır parkur → Uzun düello · 2 top · 30+ sn** iki yarışmacılı 24 bölümlük uzun parkuru açar. Normal oynatma hızında, bu parkura özel 6 birim hız sınırı kullanır; sınır kayıtlı çalışmalarda ve video üretiminde korunur. Doğrudan açmak için `http://127.0.0.1:5173/?course=longduel` kullanılır. Kazanan seçilmez; fizik belirler.

Ana sayfanın üstündeki **Maç gündemi** bandı uygulama açılır açılmaz görünür; dokuz futbol liginin maçlarını ve NFL maçlarını yan yana gösterir. Manuel stüdyoda ve otomatik üretim ekranında açık kalır. Kartlar yatay kaydırılır; karta tıklanınca ilgili lig ve tarihin ayrıntısı açılır. Tarih, önceki/sonraki gün, Bugün ve Yenile kontrolleri bantta bulunur. Sekme görünürken dakikada bir yenilenir; gizliyken sorgulama durur. Kaynağa erişilemeyince son verinin saati ve güncellenemedi uyarısı gösterilir.

**Maçlar → Futbol** düğmesi futbol seçimine doğrudan geçer; yeni kullanıcılar için Süper Lig seçilidir. Lig menüsündeki Futbol grubunda Süper Lig, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Portekiz, Brezilya ve Arjantin ligleri bulunur. NBA/NFL'den futbola dönerken son seçtiğin futbol ligi korunur. Maç olmayan bir günde önceki/sonraki gün düğmeleriyle fikstürü gezebilirsin.

**Arena → Bağ modu** menüsünde **Çarpışarak bağ kur** mevcut 3 başlangıç bağıyla çalışır; **Hazır bağlarla başla** her topa varsayılan 15 bağ verir. **Top başına başlangıç bağı** alanından 1–50 bağ seçilebilir. Hazır bağlar arena duvarına eşit aralıklarla dağılır. İki modda da duvar çarpışmaları yeni bağ ekler, rakipler bağları keser ve bağı kalmayan top elenir. Seçim çalışmalar, yedekler ve aynı çalışmadan üretilen videolarda korunur.

Üstteki **Maçlar** düğmesi NFL, NBA ve Süper Lig dahil dokuz futbol ligi için fikstür ve skorları açar. Lig/tarih seçimi, canlı–başlamadı–bitti filtresi ve önceki/sonraki gün kontrolleri vardır. Saatler Türkiye saatidir; gece oynanan Amerikan ligi maçları Türkiye'deki doğru güne yerleştirilir. ESPN'nin herkese açık skor uçları şu anda API anahtarı gerektirmez; kalıcı erişim veya anlık veri garantisi yoktur. Ekran açıkken dakikada bir kontrol edilir; aynı istekler hizmette önbellekten karşılanır. Bağlantı kesilirse son veri güncelleme uyarısıyla gösterilir. Video hizmeti çalışmalıdır; kod güncellendikten sonra masaüstü kısayolunu yeniden açmak hizmeti güvenle yeniler. Kontrol: `npm.cmd run test:matches`.

Takım kütüphanesi **Futbol Takımları** (48 kulüp), **Basketbol · NBA** (30 takım) ve **Amerikan Futbolu · NFL** (32 takım) olarak ayrılır. **Kadroyu seç → Kütüphane** üzerinden tek takım seçilebilir veya kategori içinden rastgele kadro oluşturulabilir. Logolar cihazda saklanır; otomatik üretim de NBA ve NFL kadrolarını dönüşümlü seçer. Takım kaynakları `scripts/catalog-team-sources.json` dosyasında tutulur; yeniden içe aktarma: `python scripts/expand-team-catalog.py`. Kontrol: Studio açıkken `node tests/team-catalog-browser.mjs`.

Görsel kütüphanesinde **Mısır Mitolojisi**, **Yunan Mitolojisi** ve **İskandinav Mitolojisi** kategorileri bulunur. Her kategoride 12 karakterin özgün, yapay zekâyla üretilmiş portresi vardır; görseller cihazda saklanır ve internet gerektirmez. **Kadroyu seç → Kütüphane** üzerinden isimle ara, tek bir topa ekle veya **12 top için kadro oluştur** ile seçtiğin mitolojinin kadrosunu hazırla. Türkçe isimlerle arama desteklenir; yarışmacı isimleri videoda İngilizce kullanılır. Görseller ve seçimler çalışmalarla birlikte kaydedilir. Portreler `public/catalog/` altında, üretim istemleri `scripts/mythology-prompts.json` içinde tutulur.

Studio doğrudan manuel stüdyoyla açılır. Üstteki sekmelerden Parkur, Arena, Alan Savaşı, Pi Çarpışmaları, İstatistik veya Spiral seç; kadronu ve ayarlarını düzenle, **Video oluştur** ile açık çalışmanı dışa aktar. **Çalışmalarım**, **Videolarım** ve **Yedekler** bu stüdyodan erişilir.

**Rastgele otomatik üretim, seri üretim ve günlük görevler kaldırıldı.** Videolar yalnız açık çalışmadan **Video oluştur** ile hazırlanır. GitHub video arşivi ve video yükleyerek arşivleme kapalıdır. Yeni render dosyası indirme tamamlanınca silinir; yarım indirme ve önizleme silmez. Önceden üretilmiş videolar otomatik silinmez.

Masaüstü kısayolu Studio ve video hizmetini birlikte başlatır. Video hizmeti güncellendiyse bir kez yeniden başlatılmalıdır. **Çalışmalarım** isimli kayıtları korur; editördeki **Yedekler** menüsünden yedek alıp yükleyebilirsin. Yeni videoları **Videolarım → İndir** ile kendi cihazına kaydet; uygulama indirmeden sonra ek video kopyası tutmaz.

Editörde **Hazır parkur → Rastgele parkur** yeni seed ve engel dizilimi oluşturur. Bu seçenek açıkken **Yeni yarış** tüm parkuru yeniden üretir; seed kayıtta korunur. Kontroller: `node tests/course-variety.mjs`, Studio açıkken `node tests/course-variety-browser.mjs`.

## Studio → MP4

Üstteki **Video oluştur** düğmesi açık çalışmayı aynı pencereden üretim kuyruğuna gönderir. Kadro, yüklenmiş görseller, isimler, müzik tercihi ve lider müziği eşleştirmeleri korunur. İstatistik ekranında uygulanan tablo, başlık, kaynak ve sunum seçenekleri kullanılır. Studio 5173, video hizmeti 5180 adresinde çalışır; masaüstü kısayolu ikisini birlikte başlatır.

- **Aynı çalışmayı dışa aktar:** mevcut düzen numarası ve hız 1× korunur. Parkurda bütün topların bitişi, ayarlı geri sayım ve sonuç süresi kaydedilir. İstatistik tablosu kendi süresinde oynatılır ve iki saniye son sonuç gösterilir. Tamamlama sınırı simülasyonda 10 dakikadır.
- MP4 için dikey / yatay / kare, 720p / 1080p, ses ve üç sunum seçeneği bulunur. Dışa aktarma varsayılan olarak **144 FPS** kullanır; gelişmiş seçeneklerden herhangi bir pozitif tam sayı FPS girilebilir. Önceki sürümün kaydettiği kare hızı bir kez yeni varsayılana geçirilir; diğer ayarlar korunur. Görüntü seçilen çerçeveye kesilmeden sığdırılır; farklı yönlerde boş alan kalabilir. Giriş ve kapanış metni düzenlenebilir. Eski **Videoya kaydet** düğmeleri doğrudan tarayıcıdan ekranın yenileme hızına bağlı WebM kaydı ister.
- **Yedek indir** bütün Studio ayarlarını, tabloları ve görselleri JSON dosyasına kaydeder. **Yedek yükle** önce mevcut ayarların kopyasını indirir, sonra yedeği uygular. Hatalı dosya mevcut çalışmayı değiştirmez. Yedek video dosyalarını ve Atölye iş geçmişini içermez; bunlar `output/` klasöründedir.

**Kontroller:** `npm.cmd test` veri/fizik kontrollerini ve derlemeyi; `npm.cmd run check` bunlara güncel tarayıcı testlerini ekler. `npm.cmd run check:export` ayrıca dört formatı gerçek MP4 olarak üretir ve çözer; birkaç dakika sürebilir. Test Atölyesi ayrı bir portta ve `artifacts/` altında çalışır, gerçek üretim kuyruğuna iş eklemez. Eski editör senaryoları tarihsel dosyalardır; güncel ana test listesine dahil değildir.


Spiral için düşüş, kırılma, çoğalma ve bitiş efektleri canlı oynatmada ve videolarda bulunur.

**Video hizmeti:** `Start-Factory.cmd` hizmeti başlatır ve manuel stüdyoyu açar. İndirme ve geçici dosya davranışı: [FACTORY.md](FACTORY.md).

Spiral çoğalma ekranındaki **Spiral teması** menüsünde Buz Kıran, Lav Çekirdeği, Kutup Işıkları, Altın Kasa, Şeker Sarmalı ve Kozmik Kristal bulunur. Temalar spiral malzemesini, arka planı, top paletini ve kırılma parçalarını değiştirir. Seçim otomatik saklanır ve video kaydında kullanılır; kayıt sırasında tema değiştirilemez. Tema kontrolleri: `node tests/spiral-themes.mjs`.

Kodla çizilen ve Matter.js fiziğiyle çalışan yerel 2D top yarışı uygulaması. Görsel/video AI servisi veya API anahtarı kullanmaz.

## İstatistik yarışı

Üstteki **İstatistik yarışı** sekmesi yıllara göre değişen yatay çubuk sıralamasını açar. Çubuklar soldan sağa uzar; değerler değiştikçe yarışmacılar sıralamada akıcı biçimde yer değiştirir. Bu alan parkur ve küre arenasından bağımsızdır; sekme değiştirmek oynayan yarışı duraklatır.

**Hazır veri kütüphanesi:** 11 kaynaklı veri setinden bir karta tıklayın; başlık, birim, kaynak ve tablo birlikte yüklenir. Yeni yarış hikâyeleri listenin başındadır. Kategori filtresiyle futbol, motor sporları, uzay, otomotiv, seyahat, nüfus, ekonomi veya teknoloji seçilebilir. Dosyalar yereldir; oynatma için internet gerekmez. Kaynak ve kapsam bölümünde bağlantılar, alınma tarihi, kullanım koşulları ve seçim yöntemi bulunur.

| Konu | Kapsam |
| --- | --- |
| Süper Lig: kupa yarışı | 1959–2026; 6 kulüp; sezon sonuçlarından birikimli kupalar |
| Formula 1: galibiyet rekoru | 1950–2025; 30 pilot; 1.149 yarışın sonuçlarından birikimli galibiyetler |
| Uzay yarışı: yörüngeye çıkanlar | 1957–2025; 18 ülke; UNOOSA kaydındaki birikimli uzay nesneleri |
| Elektrikli otomobil yarışı | 2015–2025; 15 ülke; yıllık bataryalı + fişli hibrit otomobil satışları |
| Turizm: pandemi kırılması | 1995–2020; 15 ülke; pandemi öncesi yükseliş ve ilk yıldaki düşüş |
| Avrupa Kupası / Şampiyonlar Ligi | 1956–2026; 24 şampiyon kulübün birikimli kupaları |
| Nüfus | 1960–2025; her sette seçili 30 ülke/ekonomi |
| GSYİH, kişi başına GSYİH, ihracat | 1990–2025; cari ABD doları; her sette seçili 30 ülke/ekonomi |
| İnternet kullanımı | 2000–2024; her sette seçili 30 ülke/ekonomi |

Dünya Bankası kadroları, dönem boyunca verisi eksiksiz olan ülke/ekonomilerin son yıl değerlerine göre seçilir; uygun verisi varsa Türkiye dahil edilir. Bu sabit kadrolar tüm dünyanın eksiksiz sıralaması değildir; eksik gözlemler sıfırla veya tahminle doldurulmaz. Futbol sayıları yıllık basamaklarla ilerler, kesirli kupa gösterilmez.

Yeni seriler `scripts/statistics_stories.py` ile ham kayıtlardan üretilir. Süper Lig için TFF sezon şampiyonları; F1 için sayfalanmış Jolpica/Ergast yarış sonuçları; uzay, otomotiv ve turizm için UNOOSA, IEA ve UN Tourism verilerinin Our World in Data sürümleri kullanılır. Ham CSV/JSON/HTML yanıtları ve indirme adresleri `scripts/statistics-cache/` içinde tutulur. `python scripts/import-statistics.py` önbellekten bütün 11 seriyi yeniden üretir.

Süper Lig sayımı 1959’dan başlar; Beşiktaş’ın yıldız hesabına eklenen 1957–1958 kupaları dahil değildir. F1 sprintleri sayılmaz, ortak yarış galibiyetleri her kazanan pilota yazılır; bütün tarihsel liderler kadroda korunur. Uzay serisi roket veya faal uydu sayısı değil, kayıttaki nesnelerin toplamıdır; kayıtsız yıllarda yeni nesne kaydı yok kabul edilir ve veri tabanının eksik kapsamı açıklamada belirtilir. EV ve turizm serilerinde eksik yıllar doldurulmaz. Turizm 2020 kırılmasını anlatan tarihsel bir penceredir, güncel sıralama değildir. Yeni seriler varsayılan olarak yıllık basamaklarla ilerler.

`npm run test:stories` yeni tablolardaki bütün değerleri kaynak kayıtlarıyla karşılaştırır; tarihsel liderlerin korunmasını, pandemi düşüşünü, kart seçimlerini, kaynak açıklamalarını, mobil görünümü ve video kaydını kontrol eder.

`public/statistics/manifest.json` kaynakları ve kapsam notlarını, yanındaki CSV dosyaları tabloları içerir. `python scripts/import-statistics.py` önbellekteki yanıtlarla aynı veri setlerini yeniden üretir. `--refresh` Dünya Bankası yanıtlarını yeniden indirir; UEFA sezon listesi kaynaklarıyla `scripts/statistics-football.json` içinde tutulur ve yeni sezonlar ayrıca doğrulanarak eklenir. Ham API yanıtları `scripts/statistics-cache/` içindedir. `npm run test:statistics-library` bütün sayıları kaynak yanıtlarıyla, sezon toplamlarını, kaldırılan seçimlerden geçişi, kaynak gösterimini ve tarayıcı akışını kontrol eder.

- İlk açılışta 2000–2025 arasında on hayali yarışmacının **örnek verisi** gösterilir; gerçek istatistik olmadığı görüntüde ve videoda belirtilir.
- **CSV yükle** ile kendi tablonu getir veya alttaki metni düzenleyip **Veriyi uygula** düğmesine bas. İlk satır `Yıl,Alfa,Beta`, sonraki satırlar `2000,10,20` gibi olmalıdır. 1–301 yıl ve 2–30 yarışmacı gerekir. Tek yıl satırı sabit karşılaştırmadır. Her satırda bütün değerler bulunmalı; eksik değerler sıfır sayılmaz. Negatif değerler desteklenmez. Akıcı geçiş ara yılları doğrusal hesaplar; yıllık geçiş değerleri bir sonraki veri yılına kadar korur. Kendi tablonu uygulamak hazır verinin kaynak etiketini kaldırır.
- Virgüllü CSV içinde ondalıklar noktayla yazılır. Excel'den gelen noktalı virgüllü CSV içinde ondalık virgül de kabul edilir. Binlik ayıracı kullanma. Hatalı dosya mevcut yarış verisini değiştirmez.
- Başlık, birim, kaynak, ilk 5/10/15 gösterimi ve 15/30/60/120 saniyelik süre seçilebilir. Başlat/duraklat, başa al, yıl çizgisinde gezinme ve tam ekran bulunur. Uygulanan veri ve sunum ayarları bu tarayıcıda otomatik saklanır; **CSV indir** uygulanan tabloyu dışa aktarır. CSV dosyası sunum ayarlarını içermez.
- **Videoya kaydet**, yarışı baştan **sessiz 1920×1080 yatay WebM** olarak kaydeder; son sıralamayı iki saniye gösterip indirir. Erken bitirme ve son videoyu yeniden indirme desteklenir. Kayıt boyunca sekmeyi görünür tut. Kayıt sırasında veri düzenleme ve diğer yarış sekmelerine geçiş kilitlenir.

`src/statistics-data.js` veri doğrulaması ve yıl hesaplamasını, `src/statistics.js` ekranı, animasyonu ve kaydı, `src/statistics.css` görünümü içerir. `npm run test:statistics` veri doğrulaması, sıralama, oynatma, CSV aktarımı, taslak kalıcılığı, mobil görünüm ve otomatik 1920×1080 video kaydını doğrular. Tarayıcı testi için yerel sunucu açık olmalıdır.

## Açılış

**Ortak geliştirme ve kullanım:** GitHub Desktop'ta bu depoyu **Clone** ile bilgisayarına indir, ardından **Repository → Show in Explorer** ile klasörü açıp `Baslat.cmd` dosyasına çift tıkla. İlk açılışta Node.js, uygulama bağımlılıkları ve video tarayıcısı otomatik hazırlanır; elle kurulum, npm komutu veya yönetici izni gerekmez. İlk hazırlık için internet gerekir. Sonraki açılışlarda aynı araçlar tekrar kullanılır.

Oyun ekranı hazır olduğunda video tarayıcısının kurulmasını beklemeden açılır. Video hazırlığı başarısız olursa oyunları kullanmaya devam edebilirsiniz; bağlantı düzeldikten sonra `Baslat.cmd` dosyasını yeniden açın. Başlatma ayrıntıları `artifacts/startup-*.log` dosyasına kaydedilir. ZIP indirdiyseniz önce tüm arşivi klasöre çıkarın. İki bilgisayarda aynı oyunları görmek için GitHub Desktop'ta aynı dalı seçip güncelleyin; 29 Ekim 2026 tarihli güncel oyun sürümü `codex/sync-two-computers-20261013` dalındadır.

Güncelleme almak için GitHub Desktop'ta **Fetch origin → Pull origin**, ardından `Baslat.cmd`. Bağımlılıklar değiştiyse otomatik yenilenir; uygulamanın yönettiği sunucular yeni kodla açılır. Devam eden video üretimi varsa video hizmeti yeniden başlatılmaz; iş bitince `Baslat.cmd` yeniden açılır. Kod değişiklikleri editörde anında uygulanır. Kendi değişikliklerini GitHub Desktop'ta **Commit → Push origin** ile paylaş. Herkesin yazabilmesi için organizasyondaki ekibe bu depoda **Write** yetkisi verilmeli. Araçlar ve kişisel ayarlar Git'e gönderilmez; tamamlanan videolar aşağıdaki ortak arşive otomatik gönderilir.

Geliştirme araçlarını elle yönetmek isteyenler için `npm install` ve `npm run dev` de kullanılabilir.

**Ortak çalışma videoları:** Paylaşılan kayıtlar `work-videos/` klasöründe tutulur. GitHub Desktop'ta Clone/Pull yapınca videolar Git LFS üzerinden gelir. Uygulamanın **Videolarım** listesinde diğer hazır videolarla birlikte görünür; izlenebilir, indirilebilir ve klasörde açılabilir. Üretim ayarları bulunan kayıtların `metadata.json` dosyaları da paylaşılır. Yeni videoların yerel kopyaları `output/` altında kalır ve otomatik paylaşım ortak arşive bir kopyasını ekler.

**Yeni videolar otomatik paylaşılır:** Üretimi tamamlanan MP4'ler, tarayıcıda kaydedilen WebM'ler ve **Videolarım → Video yükle** ile eklenen dosyalar GitHub'a arka planda gönderilir. Video, kapak ve üretim bilgileri Git LFS ile `work-videos/` arşivine eklenir. Kod dosyaları ve geliştiricinin commit bekleyen değişiklikleri otomatik gönderilmez; paylaşım ayrı bir Git çalışma kopyasında yapılır. İnternet veya erişim sorunu varsa dosya yerelde korunur ve yeniden denenir. **Videolarım** paylaşım durumunu gösterir. Otomatik gönderim için GitHub hesabının organizasyon deposuna yazma erişimi ve Git kimlik doğrulaması gerekir. `FACTORY_GITHUB_SYNC=0` otomatik gönderimi kapatır. Diğer ekip üyeleri Pull ile yeni videoları alır.

**Başka Windows PC’de kurulum olmadan:** Taşınabilir ZIP paketini bir klasöre çıkartıp `MarbleStudio/Baslat.cmd` dosyasına çift tıkla. Node.js, uygulama bağımlılıkları, FFmpeg ve video üretim tarayıcısı paketin içindedir; Node.js, npm veya Chrome kurmak gerekmez. Windows 10/11, 64 bit içindir. GitHub'daki **Code → Download ZIP** kaynak kodudur; taşınabilir paket **Releases** bölümünden indirilir.

## Dört ayrı yarış alanı

Üst menüden **Parkur yarışı**, **Küre arenası**, **İstatistik yarışı** veya **Spiral çoğalma** açılır. Uygulama doğrudan Parkur yarışı ekranında başlar. Parkur oluşturma, bölüm düzenleme ve Parkurlarım arayüzü kaldırılmıştır.

- **Parkur yarışı:** Hazır parkur seç, yarışmacı sayısını ayarla, **Kadroyu seç** ile görsel kütüphanesinden yarışmacı ekle ve **Başlat** düğmesine bas. Önceki taslakta bulunan özel parkur ilk açılışta korunur; hazır parkur seçmek bunu o yarışın taslağında değiştirir.
- **Küre arenası:** Kendi kadrosunu ve yarış ayarlarını kullanır. Toplar üç bağla başlar; duvara çarptıkça bağ kurar, rakiplerinin bağlarını keser. Her duvar çarpışmasında topun hızına başlangıç hızının %1'i eklenir; hız küçük ve eşit adımlarla artar. Bağı kalmayan elenir, son bağlı top kazanır. Kamera ve parkur seçimi bu alanda gösterilmez.
- **İstatistik yarışı:** Kendi veri kütüphanesi, tablo düzenlemesi, zaman çizgisi ve yatay video kaydı bulunur. Top yarışlarının ayarları bu ekranda gösterilmez.
- **Spiral çoğalma:** Sağ üstten gelen top buza temas edince küçük bir bölgeyi kırıp kaybolur. Buz iki boyutlu bir alandır; çentikler ve kenarlarda kalan çıkıntılar sonraki toplarla kırılır, ana kütleden kopan parçalar düşer. Grup tükenince bir kare sonra dışarıdan yeni top gelir. ×2 noktasında oluşan grup 0,06 saniyelik aralıklarla kanala girer; sonraki grup için çarpan bir artar. Toplar alt tarafta hızlanır, üst tarafta yavaşlar. Her topun rengi sabittir; spiral daha kalın, sabit gri-mavi kenarlıklara sahiptir. Merkez açılınca simülasyon biter. Üst sınır 64 toptur. Başlangıç sayısı, kadro, ses, hız ve sunum ayarları ayrı saklanır; tek müzik ve 1080 × 1920 video kaydı desteklenir. Başlık kaldırılmıştır; video görüntüsünde ek logo, alt sayaç veya ilerleme çubuğu yoktur. Referans: https://www.instagram.com/reel/DcRTleaon6_/ — animasyon Canvas ile yeniden çizilir; kaynak video oynatılmaz.

Spiral çizgisinde beyaz çekirdekli turkuaz bir ışık, yarış başlayınca dış girişten merkezdeki uca 14 simülasyon saniyesinde ilerler. Arkasındaki kısa iz sönerek kaybolur; ışık merkeze ulaştığında orada hafifçe parlar. Duraklatma ışığı da durdurur; yeni yarış ışığı girişe döndürür. Efekt bütün Spiral temalarında, WebM kaydında ve MP4 üretiminde görünür. `src/spiral-guide.js` çizgi geometrisini ve ışığın konumunu paylaşır; `npm run test:spiral:guide` çizgiyi takip etmeyi, temaları, duraklatmayı, sıfırlamayı ve video karelerini kontrol eder.

**Spiral teması** menüsünde 12 malzeme bulunur: Buz Kıran, Lav Çekirdeği, Kutup Işıkları, Altın Kasa, Şeker Sarmalı, Kozmik Kristal, Ağaç Halkaları, Bal Peteği, Mermer Damarı, Bakır Patina, Kumtaşı Katmanları ve Mercan Resifi. Topların kırdığı katman ve kopan parçalar seçilen malzemeyi kullanır. Buzda saydam yüzey, çatlak ve kabarcıklar; lavda kızıl damarlar ve kor kenarlar; kutup ışıklarında yeşil, turkuaz, mor ve pembe ışık perdeleri; şekerde kırmızı-beyaz şeritler; kozmik kristalde parlayan pembe prizma yüzeyleri vardır. Yeni temalar ağaç yaş halkaları, petek gözleri, taş damarları, bakır oksit lekeleri, tortul kum katmanları ve mercan gözenekleri içerir. Doku ayrıntıları 1080p için çizilir; kırılan bölgeler kalıcı olarak boş kalır. Tema çalışma dosyalarında korunur, otomatik üretimde seçilebilir ve videolara aktarılır. `src/spiral-materials.js` malzeme çizimini tutar; `npm run test:spiral:materials` doku, kırılma, kayıt, tema menüsü ve video kontrollerini çalıştırır.

`src/spiral-ice.js` temas alanını ve kırılan parçaları tutar. `scripts/analyze-spiral-reference.py`, yerelde bulunan referans videosundan top konumlarını ve buz alanını ölçer; uygulamada kullanılmaz. Varsayılan akış, referansın ilk darbe, çoğalma ve grup girişleri incelenerek ayarlanmıştır.

Spiral mantığı `src/spiral.js`, çizimi `src/spiral-renderer.js` içindedir. `marble-studio-spiral-v1` taslağı diğer alanlardan bağımsızdır. `npm run test:spiral` çoğalma, tamamlanma, aynı düzenin tekrar oynatılması, taslak doğrulaması, sekme geçişleri, duraklatma, mobil görünüm ve manuel/otomatik video indirmeyi denetler. Tarayıcı testi için yerel sunucu açık olmalıdır.

Parkur ve arena; kadro, sayı, ses, izler, düzen numarası, oynatma hızı, sunum süreleri ve müzik tercihlerini ayrı saklar. Yarış türü değiştirildiğinde seçilen tür kendi ayarlarıyla başa alınır. İstatistik ekranına geçmek oynayan top yarışını duraklatır. Müzik paneli gerektiğinde açılır; lider müziği parkura, tek parça müzik seçimi her iki top yarışına uygundur.

**Yarış ayarları** etkin top yarışının araç çubuğundadır. **İzleme seçenekleri** hız ve kamera kontrollerini içerir. **Videoya kaydet** mevcut yarışı baştan kaydeder; tamamlandığında indirir. Kayıt sırasında yarış türünü ve kadroyu değiştirmek kilitlenir. Erken bitirmek için **Kaydı bitir ve indir** kullanılır.

Yeni taslaklar `marble-studio-track-v1` ve `marble-studio-arena-v1` anahtarlarında saklanır. Eski taslak ilk geçişte ilgili alana aktarılır; eski isimli kayıtlar tarayıcıdan silinmez. İstatistik taslağı kendi anahtarını kullanır.

## Alan Savaşı

Stüdyodaki **Alan Savaşı** sekmesi doğrudan editörü açar. **Otomatik üretim → Alan Savaşı → Videomu oluştur** ile şekil, kadro ve müzik otomatik seçilir; 144 FPS MP4 üretilip ortak GitHub arşivine gönderilir. **Bana bırak** da Alan Savaşı'nı küre arenasından ayrı bir içerik olarak dönüşümlü seçer. Oyuncu sayısı 2–20 arasında seçilir; mevcut ülke, takım, burç veya özel görsel kadron yarışır. Üçgen, kare, altıgen, yıldız ve daireye ek olarak Türkiye, Almanya, Fransa, İtalya, İspanya ve Brezilya sahaları vardır.

Toplar kendi bölgelerinden çıkıp iz çizer; geri döndüklerinde rakiplerin taralı bölgeleri dahil çevreledikleri alanı ele geçirir. Kendi alanı dışındaki rakibin gövdesine veya açık izine dokunmak onu eler ve bütün alanını saldırana geçirir. Elenen oyuncu geri doğmaz. Şimşek 2 saniye boyunca hızı 1,8 katına çıkarır; kalkan 1,5 saniye elemeyi önler. Kalkan bölgenin çalınmasını engellemez; bütün alanını kaybeden oyuncu koruma bitince elenir. Son kalan oyuncu kazanır; aksi halde 30, 45 veya 60 saniye sonunda en çok alanı olan kazanır, eşit alan beraberliktir.

Ülke sınırları [Natural Earth 1:110m kamu malı verisinden](https://www.naturalearthdata.com/about/terms-of-use/) türetilmiştir ve oyun sırasında internetten indirilmez. Kesintisiz hareket için yalnız en büyük kara parçası kullanılır; adalar ve ayrı kara parçaları dahil değildir (Türkiye sahası Anadolu'dur). `src/territory-maps.js` bu küçük yerel veriyi içerir; `scripts/build-territory-maps.mjs` yerel GeoJSON'dan yeniden üretir.

Şekil, süre ve kadro taslaklarda, kaydedilmiş çalışmalarda ve yedeklerde korunur. Alan Savaşı taslağı `marble-studio-territory-v1` altında küre arenasından ayrı saklanır; eski Arena içindeki Alan Savaşı taslağı ilk açılışta taşınır. **Video oluştur** aynı mücadeleyi 144 FPS MP4 olarak üretir. İçerik Atölyesi'nde Arena içeriğini **Alan Savaşı** seçerek seri veya günlük üretim yapılabilir. Çalışmalarım ve Videolarım listeleri bu içeriği Alan Savaşı adıyla gösterir. Görsel referans: [üçgen alan mücadelesi](https://www.youtube.com/shorts/1vDss0KwZgk). Referans video uygulamaya eklenmez; alan kapatma ve çizim uygulamanın kendi simülasyonudur.

Kontroller: `node tests/territory.mjs`, `node tests/territory-rules.mjs`, yerel sunucu açıkken `node tests/territory-browser.mjs` ve `node tests/territory-integration.mjs`; yerel MP4 için `node tests/territory-export.mjs`, gerçek otomatik 144 FPS MP4 için `node tests/territory-integration.mjs --export`. Deneme çıktıları `artifacts/` altındadır.

## Geliştirme ve kontrol

- `src/app.js`: dört yarış alanı, ayrı taslaklar, oynatma ve video kaydı.
- `src/studio-layout.css`: yarış alanlarının masaüstü ve mobil düzeni.
- `src/music.js`: parkur ve arena için ayrı müzik tercihleri.
- `src/physics.js`, `src/courses.js`: parkur fiziği ve hazır parkurlar.
- `src/arena.js`, `src/arena-renderer.js`: küre arenası fiziği ve çizimi.
- `src/statistics.js`, `src/statistics-scale.js`: istatistik yarışı ve değişken eksen ölçeği.
- `src/ball-editor.js`, `src/image-catalog.js`: kadro ve görsel seçimi.

Yerel sunucu açıkken `npm run test:workspaces` üç alanın ayrımını, eski editörün kaldırılmasını, kadro/ayar/müzik kalıcılığını, video kaydı kilitlerini ve mobil taşmaları doğrular. `npm run test:recording` eşzamanlı kayıt başlangıcı, kaynakların bırakılması ve hata sonrası tekrar denemeyi kontrol eder. `node tests/statistics-scale.mjs` eksen büyümesi ve küçülmesini doğrular. `npm run build` üretim çıktısını `dist/` içine hazırlar.

Eski editör akışına bağlı tarayıcı testleri önceki arayüzü hedefler; yeni alanlar için `test:workspaces` kullanılır. Eski editör modülleri uygulamanın giriş noktasına bağlanmaz.


## Geçmişe göre otomatik üretim

Otomatik ana ekran yalnızca içerik türünü üretim hizmetine gönderir. Hizmet, son 300 tamamlanmış işin kalıcı kayıtlarına göre türü, genel amaçlı müziği, kadro kategorisini ve istatistik konusunu seçer. İstatistikte aynı veri otomatik olarak yeniden üretilmez; yeni veya güncellenmiş veri gerekir. Ülke, takım ve burç kadroları yerel görsel kütüphanesinden hazırlanır; spiral renkli topları kullanır. Mevcut kullanıcı taslakları bu seçimlerden etkilenmez.

Her otomatik yarış için en fazla 16 farklı aday denenir, beş uygun aday hedeflenir. Parkur yapısı, arena hareket seviyesi veya spiral tema/davranışı adaylar arasında değişir. Tamamlanma ve süre denetimlerine ek olarak çıktı zamanında ilk olayın 3 saniyeyi, olaysız aralığın 8 saniyeyi aşması; görünür yarışmacı oranının %35 altında veya durağan örnek oranının %65 üzerinde olması elenme nedenidir. Bu eşikler editoryal yardımcı kurallardır, izlenme tahmini değildir. İstatistik çıktıları ayrı veri doğrulaması kullanır.

`metadata.json`, seçim puanını, aday incelemesini, çıktı kalite ölçülerini, müzik atıflarını ve otomatik seçim bilgilerini tutar. Normal kullanıcı dışa aktarımında seçilmiş kadro ve düzen değiştirilmez. Yeni hizmet `automatic-diversity` yeteneğini bildirir; eski hizmette otomatik ana ekran yeniden başlatma açıklaması gösterir.

Kontroller: `node tests/automatic-diversity.mjs` aktarım, tekrar önleme ve aday çeşitliliğini test eder. `node tests/automatic-review.mjs` ayrı bir test hizmetinde altı gerçek MP4 üretir; başlangıç/orta/son karelerini ve ses ölçülerini `artifacts/automatic-review-*/review.json` yanında saklar. İnceleme için üretim çözünürlüğü 720p kullanılır; ana ekranın varsayılanı 1080p'dir.


## Uzun süreli tekrar koruması

Otomatik üretimde içerik imzası tüm geçmişle karşılaştırılır. Aynı içerik tekrar edilmez. Çok benzer bir düzen için hem 90 gün geçmesi hem araya en az 300 tamamlanmış video girmesi gerekir. Müzik, başlık, dil ve başlangıç numarası gibi değişiklikler yakın tekrar kontrolünü aşmaz. İstatistikte sütun/satır sırası, ayraç veya başlık değişimi yeni içerik sayılmaz; verilerin değişmesi gerekir.

İmzalar `output/repetition-ledger.json` ve aynı dosyanın `.bak` yedeğinde tutulur. Açılışta mevcut tamamlanmış işlerin geçmişi bu hafızaya aktarılır. Video klasörleri veya ana iş geçmişi arşivlense bile bu iki dosyayı koru; üretim yedeğine dahil et. Hafıza ve yedeği birlikte bozuksa hizmet boş hafızayla devam etmez.

Spiral kütüphanesindeki 24 tema/davranışın tamamı koruma altındaysa **Bana bırak** diğer türlere geçer. Özellikle spiral seçilmişse veya istatistik verileri tükenmişse iş **Tekrar önlendi** açıklamasıyla durur; boş yere otomatik yeniden denenmez. Editörden özellikle istenen aynı çalışmanın dışa aktarımı bu otomatik engelin dışındadır.

`node tests/repetition-guard.mjs` süre/adet sınırlarını, yeniden başlatmayı, arşivlemeyi ve hasarlı kayıt durumlarını; `node tests/repetition-service.mjs` gerçek hizmet üzerinden tekrar engelini denetler. Güncel otomatik ekran eski hizmetin koruma olmadan üretim yapmasına izin vermez; üretim hizmetini yeniden başlatmak gerekir.
