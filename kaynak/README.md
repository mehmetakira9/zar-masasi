# Bugün Ne Oynasam? — kaynak kodu

Uygulama HTML, CSS ve JavaScript ile hazırlanmıştır. Paket bağımlılığı ve internet gerektirmez.
Bu klasörü Visual Studio Code ile açıp `index.html` dosyasını Edge veya Chrome'da çalıştırabilirsin.
Kodunu kaydettikten sonra tarayıcıda Ctrl+R ile yenile.

| Dosya | İçerik |
| --- | --- |
| `index.html` | Ekranlar, ayarlar ve oyun/geçmiş pencereleri |
| `styles.css` | Yerleşim, dört tema, kartlar ve mobil görünüm |
| `app.js` | Arayüz, kayıtlar, kapaklar, seçim animasyonu ve ses |
| `core.js` | Ruh hali, tekrar sınırı, ağırlıklı seçim, çark açıları, yedek doğrulama |
| `core.test.cjs` | Node.js ile çalışabilen bağımsız hesap testleri |
| `build.py` | Tek HTML dosyalık uygulamayı oluşturur |

İsteğe bağlı test komutu (Node.js gerektirir):

```bash
node core.test.cjs
```

İsteğe bağlı paketleme komutu (Python 3 gerektirir):

```bash
python build.py
```

Bu komut üst klasördeki `Bugun-Ne-Oynasam.html` dosyasını günceller.
Normal Windows kullanımında ZIP'i çıkartıp üst klasördeki `BASLAT.cmd` dosyasını aç.
Uygulama `%LOCALAPPDATA%\BugunNeOynasam` konumuna kopyalanır ve ayrı tarayıcı profili kullanır.
Kaynak `index.html` dosyasını doğrudan açmanın kayıtları normal başlatıcının kayıtlarından ayrıdır.

Seçim kütüphaneden yapılır. Ruh hali etiketleri kullanıcı tarafından belirlenir;
herhangi bir oyun hakkında çevrimiçi bilgi alınmaz. Tek seçim, çark ve üç öneri aynı
ağırlıkları kullanır: normal 1×, öncelikli 3×, çok istiyorum 5×; favori ek 2×.
Üç öneri aynı oyunu iki kez içermez. En fazla 500 oyun ve son 200 seçim saklanır.

Tekrar sınırı yalnızca son seçilen oyunları dışarıda tutar. Tekrar sınırını esnetmek,
ruh hali, bitirilmiş oyun ve bekletme kurallarını kaldırmaz. Birden fazla oyun
önerildiğinde yalnızca kullanıcının seçtiği oyun geçmişe yazılır.

Kayıtlar `bugun-ne-oynasam` adlı IndexedDB veritabanındaki `data/state` kaydındadır.
Yedek formatı `bugun-ne-oynasam`, sürümü `1`dir. İçe aktarma öncesinde bütün dosya
doğrulanır. Birleştirmede mevcut oyunlar korunur, yeni kimliklerle kopyalar eklenir.
Geri yükleme seçeneği mevcut kütüphaneyi değiştirmeden önce onay ister.

Seçim hesapları ve uygulama davranışları kontrollü DOM/kayıt test ortamında doğrulandı;
çark çizimi gerçek Canvas çıktısında kontrol edildi. Bu hazırlama ortamında Windows
başlatıcısı ve gerçek tarayıcı arayüzü çalıştırılamadı.
