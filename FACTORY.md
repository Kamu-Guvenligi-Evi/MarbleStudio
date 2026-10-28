# Video oluşturma ve indirme

Stüdyoda oyunu ve ayarlarını seç, **Video oluştur** düğmesine bas. Açık çalışma aynı ayarlarla tek video olarak renderlanır. Rastgele üretim, seri üretim ve günlük görevler kaldırıldı; eski kayıtlı otomatik görevler çalıştırılmaz.

**Videolarım** render ilerlemesini, önizlemeyi ve indirmeyi gösterir. Yeni videolar indirilene kadar geçici tutulur. Tam indirme bittiğinde video ve o renderın yardımcı dosyaları silinir; listede **İndirildi** görünür. Önizleme, HEAD isteği, geçersiz veya yarım indirme silme başlatmaz. Parçalı indirmede bütün byte aralıkları tamamlanmalıdır. İndirme bildirimi HTTP aktarımının tamamlandığını gösterir; tarayıcının diske yazma sonucunu sunucu okuyamaz.

GitHub'a otomatik video gönderimi, ortak video arşivi, arşive video yükleme ve **Klasörde göster** kaldırıldı. Arkadaşlara hazırlanan uygulama paketi video arşivini içermez. Önceden üretilmiş dosyalara dokunulmaz. Tarayıcıdan alınan WebM kayıtları doğrudan indirilir, sunucuda arşivlenmez.

Önceden açıkça istenmiş YouTube yüklemesi varsa geçici dosya yükleme bitene kadar korunur; başarısız yükleme tekrar denenebilir. İndirilen video için yalnız iş durumu saklanır.

Hizmet: `Start-Factory.cmd` veya Studio kısayolu. Çalışan render varsa güncelleme için tamamlanmasını bekle. Eski `factory.html` adresi manuel stüdyoya yönlenir.

Doğrulama: `npm run test:manual-export` otomatik işlerin reddini, geçici dosya temizliğini, yarım indirmeleri ve manuel dışa aktarma arayüzünü ayrı bir test hizmetinde kontrol eder.
