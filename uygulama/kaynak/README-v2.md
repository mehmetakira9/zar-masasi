# Zar Masası 2.0 — kaynak kodları

Uygulamanın tamamı (HTML + CSS + JavaScript) tek dosyada: **index.html**.
Harici kütüphane yok; sadece başlık yazı tipleri (Cinzel, Manrope) Google Fonts'tan gelir,
internet yoksa sistem yazı tipine düşer.

## Yenilikler (1.0'a göre)
- Yeni tasarım: koyu fantastik tema, yeşil çuha masa, altın detaylar
- Yeni zarlar: d8, d10 (gerçek beşgen trapezohedron), d12 (gerçek on iki yüzlü), d2
- ✦ Hileli Zar modu: zarın üst yarısı garanti (d20: 10–20, d6: 3–6, d100: 50–100)
  - "Bir atıştan sonra kapat" seçeneği
  - Hileli jeton sayacı (0–2): hileli atışta jeton varsa 1 tane düşer
- Avantaj / Dezavantaj: d20'ler iki kez atılır, yüksek/düşük olan alınır, diğeri üstü çizili gösterilir
- Bonus (+/−) toplamı otomatik ekler, formül gösterilir (örn. 12 + 5 + 3)
- Nat 20 / Nat 1 efektleri ve sesleri
- Reroll sayacı (0–4)
- Geçmiş: son 30 atış; hileli, avantaj, nat 20 etiketleriyle
- Telefon uyumlu yerleşim, sabit "Hepsini At" çubuğu
- Kısayollar: Boşluk = hepsini at, H = hileli mod

## Kodda düzenleyebileceğin yerler (index.html içindeki <script>)
- `MAX_DICE`, `MAX_HISTORY`, `MAX_RR`, `MAX_TK`: sınırlar
- `cheatMin(s)`: hileli modda en düşük sonuç (şu an zarın yarısı)
- `rollOne()`: tek zar atma (hileli dahil); `rnd()`: kripto tabanlı eşit olasılık
- `DEFAULT_COLORS`: zar renkleri
- `THEMES`: Ahşap / Cam / Metal sesleri
- `model()` ve `draw()`: 3D zar modelleri ve çizimi
- CSS değişkenleri (`:root`): tüm renkler

## Klasörler
- `windows-baslatici/`: "Zar Masasi.exe" başlatıcısının C# kodu. `derle.cmd` ile Windows'ta yeniden derlenir.
- `electron/`: Edge'e bağlı olmayan tam bağımsız masaüstü sürümü için (isteğe bağlı).

Ayarlar ve geçmiş tarayıcının yerel depolamasında (localStorage) tutulur.
