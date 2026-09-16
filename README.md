# Pre-Checkout & SEO Audit Suite

E-ticaret siteleri için 26 maddelik pre-checkout, teknik SEO, yasal/güven, dönüşüm ve erişilebilirlik (WCAG) denetimi yapan; hazır kod/çözüm üreten (Fix Studio), rakip karşılaştırması ve AI destekli çözüm raporu sunan bir denetim paneli.

## Özellikler

- 26 maddelik kademeli puanlamalı kontrol listesi (Pre-Checkout, Teknik SEO, Yasal & Güven, Dönüşüm & UX, Erişilebilirlik)
- Fix Studio: her madde için platforma özel (Shopify/WooCommerce/Ticimax/İkas) hazır kod üretimi
- Rakip Karşılaştırma: AI ile gerçek rakip bulma + yan yana skor kıyaslaması
- AI Çözüm Raporu: rakiplerden geride kalınan alanlara odaklı, PDF olarak indirilebilir aksiyon planı
- White-label: firma logosu, rengi ve rapor markasını özelleştirme
- macOS'ta yerel Google Chrome ile canlı sayfa yakalama (yalnızca localhost'ta çalışır)

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

- "Chrome ile Canlı Bağlan" özelliği, sunucunun çalıştığı makinedeki yerel Google Chrome'u kullanır; bu nedenle yalnızca kendi bilgisayarınızda (localhost) çalışır, uzak bir sunucuya deploy edildiğinde bu sekme işlevsiz kalır.
- "Gerçek Chrome ile render et" seçeneği de aynı sebeple yalnızca localhost'ta aktif olur; uzak sunucuda otomatik olarak hızlı (Chrome'suz) tarama moduna düşer.
