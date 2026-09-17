# Pre-Checkout & SEO Audit Suite

E-ticaret siteleri için 26 maddelik pre-checkout, teknik SEO, yasal/güven, dönüşüm ve erişilebilirlik (WCAG) denetimi yapan; hazır kod/çözüm üreten (Fix Studio), rakip karşılaştırması ve AI destekli çözüm raporu sunan bir denetim paneli.

## Özellikler

- 26 maddelik kademeli puanlamalı kontrol listesi (Pre-Checkout, Teknik SEO, Yasal & Güven, Dönüşüm & UX, Erişilebilirlik)
- Gerçek Core Web Vitals (LCP, CLS, INP/TBT) — Lighthouse ile ölçülür (localhost'ta yerel Chrome, sunucuda gömülü `@sparticuz/chromium` ile), ölçülemezse asla tahmini sayı göstermez
- Denetim Geçmişi & Trend Takibi: aynı domain tekrar taratıldığında önceki skorla otomatik kıyaslama (SQLite, yerel dosya)
- Sektör Ortalaması Karşılaştırması: en az 5 farklı domain'lik geçmiş veri birikince sektör ortalaması gösterir, azsa "yeterli veri yok" der
- Fix Studio: her madde için platforma özel (Shopify/WooCommerce/Ticimax/İkas) hazır kod üretimi
- Rakip Karşılaştırma: AI ile gerçek rakip bulma + yan yana skor kıyaslaması
- AI Çözüm Raporu: rakiplerden geride kalınan alanlara odaklı, PDF olarak indirilebilir aksiyon planı
- White-label: firma logosu, rengi ve rapor markasını özelleştirme
- Canlı sayfa yakalama: localhost'ta yerel Google Chrome, sunucuda (örn. Render) gömülü serverless Chromium ile — ikisi de otomatik seçilir

## Kurulum

```bash
npm install
cd client && npm install && cd ..
cp .env.example .env   # GEMINI_API_KEY değerini gir
npm run build           # client'ı derler
npm start                # http://localhost:3300
```

Geliştirme sırasında hot-reload için ayrıca `cd client && npm run dev` çalıştırıp `http://localhost:5173` kullanabilirsiniz (API istekleri otomatik olarak backend'e proxy'lenir).

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| `GEMINI_API_KEY` | Google AI Studio API key — rakip bulma ve çözüm raporu özellikleri için gerekli |
| `PORT` | Sunucu portu (opsiyonel, varsayılan 3300; barındırma platformları genelde otomatik atar) |

## Bilinen Sınırlamalar

- "Chrome ile Canlı Bağlan" (interaktif oturum: kullanıcı panelinize giriş yapıp "Açık Sayfayı Çek" demesi gereken özellik) gerçekten görünür bir tarayıcı penceresi açar — bu yüzden yalnızca kendi bilgisayarınızda (localhost, yerel Google Chrome ile) çalışır; uzak bir sunucuda görünür pencere açmanın bir karşılığı olmadığından bu sekme orada işlevsiz kalır.
- "Gerçek Chrome ile render et" seçeneği ve Core Web Vitals (Lighthouse) ölçümü ise **hem localhost'ta hem uzak sunucuda (Render dahil) çalışır**: localhost'ta yerel Google Chrome'u, sunucuda ise `@sparticuz/chromium` ile gömülü gelen headless Chromium binary'sini otomatik kullanır. Bu, "Gerçek Chrome" modunu ~10-20 saniye daha yavaşlatır (Lighthouse'un tam bir performans denetimi çalıştırması gerekir). Ölçüm başarısız olursa (bot koruması, timeout) asla tahmini bir sayı göstermez, açıkça "ölçülemedi" der.
- Denetim geçmişi `history.db` dosyasında yerel olarak tutulur; Render'ın ücretsiz katmanında dosya sistemi her redeploy'da sıfırlanır, bu nedenle geçmiş/sektör verisi orada kalıcı değildir.
