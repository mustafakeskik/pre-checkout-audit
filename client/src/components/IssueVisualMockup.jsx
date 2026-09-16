import React from 'react';
import { 
  FileCode, Sparkles, Search, ShoppingBag, ShieldCheck, Star, 
  MapPin, Phone, HelpCircle, Layers, Image as ImageIcon, CheckCircle, AlertTriangle 
} from 'lucide-react';

/**
 * Visual Mockup & Illustration Component for Each Audit Checklist Item
 * Helps non-technical stakeholders instantly understand what the issue looks like visually.
 */
export default function IssueVisualMockup({ itemId, item, siteUrl }) {
  const domain = siteUrl ? new URL(siteUrl).hostname : 'magazaniz.com';

  switch (itemId) {
    case 'page_404':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Özel 404 Hata Sayfası Nasıl Olmalıdır?</span>
            <span className="text-blue-600 font-mono">/{domain}/olmayan-sayfa</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm text-center">
            <div className="text-3xl font-black text-rose-500 mb-1">404</div>
            <div className="font-bold text-slate-800 text-xs mb-1">Aradığınız Sayfa Bulunamadı!</div>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto mb-2">
              Ulaşmaya çalıştığınız ürün veya sayfa taşınmış veya silinmiş olabilir.
            </p>
            <div className="flex justify-center items-center gap-2 max-w-xs mx-auto">
              <input 
                type="text" 
                readOnly 
                value="Ürün, kategori veya marka ara..." 
                className="bg-slate-100 border border-slate-300 text-[11px] text-slate-400 px-3 py-1 rounded-md w-full"
              />
              <button className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-md shrink-0">
                Ana Sayfa
              </button>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Özel 404 sayfası, yanlış veya kırık linke tıklayan müşteriyi sitede tutmak için arama çubuğu ve ana sayfa butonu içermelidir.
          </span>
        </div>
      );

    case 'top_cta':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Header Üst Duyuru Çubuğu & Kampanya CTA</span>
            <span className="text-emerald-600 font-semibold">Pre-Checkout Dönüşüm</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-center py-2 px-3 text-xs font-semibold flex items-center justify-center gap-2 flex-wrap">
              <span>🔥 İlk Siparişe Özel <strong>%15 İndirim</strong> & <strong>Ücretsiz Kargo!</strong></span>
              <span className="bg-white text-blue-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm hover:scale-105">
                KAMPANYAYI İNCELE ›
              </span>
            </div>
            <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <div className="font-extrabold text-slate-900">{domain.toUpperCase()}</div>
              <div className="flex gap-3 text-[11px]">
                <span>Kadın</span>
                <span>Erkek</span>
                <span>Çok Satanlar</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Sayfanın en tepesinde yer alan bu şerit, müşteriye ilk anda indirim ve ücretsiz kargo motivasyonu verir.
          </span>
        </div>
      );

    case 'internal_linking':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Sayfa İçi Zengin Linkleme & İlgili Kategoriler</span>
            <span className="text-indigo-600 font-semibold">SEO Navigasyonu</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm">
            <p className="text-xs text-slate-700 leading-relaxed">
              Örnek İçerik: "En çok tercih edilen <span className="text-blue-600 underline font-semibold">çiftlere özel takviye edici gıdalar</span> ve 
              vitamin kombinasyonlarımızı <span className="text-blue-600 underline font-semibold">günlük sağlık destekleri</span> kategorimizden inceleyebilirsiniz."
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-slate-100">
              <span className="bg-slate-100 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                🔗 /kategori/takviye-edici-gidalar
              </span>
              <span className="bg-slate-100 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                🔗 /urun/faynmen-bitkisel-destek
              </span>
              <span className="bg-slate-100 text-blue-600 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
                🔗 /blog/gebelik-oncesi-saglik
              </span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Arama motorları ve kullanıcılar, sayfadaki bu tıklanabilir bağlantılar sayesinde sitede daha uzun kalır.
          </span>
        </div>
      );

    case 'thank_you_page':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Teşekkür & Sipariş Onay Sayfası Tasarımı</span>
            <span className="text-emerald-600 font-semibold">Dönüşüm Takibi</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm text-center">
            <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-1">
              ✓
            </div>
            <div className="font-extrabold text-slate-900 text-xs">Siparişiniz Başarıyla Alındı!</div>
            <div className="text-[11px] text-slate-500 mb-2">Sipariş Takip No: <strong>#FN-948201</strong> • Kargo Takip Linki SMS ile iletildi.</div>
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[10px] text-slate-600 text-left flex justify-between">
              <span>Sipariş Özeti: 2 Adet Ürün</span>
              <span className="font-bold text-slate-900">Toplam: ₺1.450,00</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Bu sayfada Google Ads, Meta Pixel ve GA4 Purchase eylemleri tetiklenerek reklam getirisi hesaplanır.
          </span>
        </div>
      );

    case 'breadcrumbs':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Sayfa İşaret Yolu (Breadcrumb) Görünümü</span>
            <span className="text-amber-600 font-semibold">Kullanıcı Deneyimi</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm">
            <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-600">
              <span className="text-blue-600 hover:underline cursor-pointer">🏠 Ana Sayfa</span>
              <span className="text-slate-400">›</span>
              <span className="text-blue-600 hover:underline cursor-pointer">Kadın Sağlığı</span>
              <span className="text-slate-400">›</span>
              <span className="text-blue-600 hover:underline cursor-pointer">Doğal Takviyeler</span>
              <span className="text-slate-400">›</span>
              <span className="text-slate-900 font-bold">FaynWomen 2000mg İnositol</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Sayfa işaret yolu, kullanıcının sitenizde nerede olduğunu anlamasını ve Google arama sonuçlarında kategori hiyerarşisinin görünmesini sağlar.
          </span>
        </div>
      );

    case 'case_studies':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Vaka Çalışmaları ve Başarı Hikayeleri Bloğu</span>
            <span className="text-indigo-600 font-semibold">Sosyal Kanıt (Social Proof)</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
              +94%
            </div>
            <div>
              <div className="font-bold text-xs text-slate-900">Vaka İncelemesi: 3 Aylık Düzenli Kullanım Sonuçları</div>
              <p className="text-[11px] text-slate-600 line-clamp-1">
                "Klinik destek sürecinde değerlerimizde %94 oranında gözle görülür artış sağlandı." — Doç. Dr. M. Kaya
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Satın alma öncesi güven kazanmak için müşteri başarı verileri ve somut sonuçlar sayfada sergilenmelidir.
          </span>
        </div>
      );

    case 'faq_5':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: 5 Adet SSS Akordeon Bölümü</span>
            <span className="text-purple-600 font-semibold">Google FAQPage Schema</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm space-y-1.5 text-xs">
            <div className="border border-slate-200 rounded-md p-2 bg-blue-50/40">
              <div className="font-bold text-slate-800 flex justify-between">
                <span>1. Siparişim ne zaman kargoya teslim edilir?</span>
                <span className="text-blue-600">▲</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Saat 15:00'e kadar verilen tüm siparişler aynı gün anlaşmalı kargo firmasına teslim edilir.
              </p>
            </div>
            <div className="border border-slate-200 rounded-md p-2 flex justify-between text-slate-700">
              <span>2. Satın aldığım ürünü nasıl iade edebilirim?</span>
              <span className="text-slate-400">▼</span>
            </div>
            <div className="border border-slate-200 rounded-md p-2 flex justify-between text-slate-700">
              <span>3. Hangi ödeme seçenekleri ve taksit imkanları var?</span>
              <span className="text-slate-400">▼</span>
            </div>
            <div className="border border-slate-200 rounded-md p-2 flex justify-between text-slate-700">
              <span>4. Ürünler orijinal ve bakanlık onaylı mı?</span>
              <span className="text-slate-400">▼</span>
            </div>
            <div className="border border-slate-200 rounded-md p-2 flex justify-between text-slate-700">
              <span>5. Kargo ücreti ne kadar, ücretsiz kargo limiti var mı?</span>
              <span className="text-slate-400">▼</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Müşterinin aklındaki 5 temel şüphe giderildiğinde sepeti terk etme oranı (drop-off) %30'a kadar azalır.
          </span>
        </div>
      );

    case 'page_speed':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Core Web Vitals Hız Göstergesi</span>
            <span className="text-emerald-600 font-semibold">Performans Metrikleri</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] text-emerald-800 font-bold block">TTFB</span>
              <span className="text-sm font-extrabold text-emerald-700">63 ms</span>
              <span className="text-[9px] text-emerald-600 block">Çok Hızlı ✓</span>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="text-[10px] text-emerald-800 font-bold block">LCP Yüklenme</span>
              <span className="text-sm font-extrabold text-emerald-700">731 ms</span>
              <span className="text-[9px] text-emerald-600 block">İdeal Süre ✓</span>
            </div>
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-[10px] text-blue-800 font-bold block">HTML Boyutu</span>
              <span className="text-sm font-extrabold text-blue-700">48 KB</span>
              <span className="text-[9px] text-blue-600 block">Hafif Sayfa ✓</span>
            </div>
          </div>
        </div>
      );

    case 'sticky_phone_cta':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Sabit (Sticky) WhatsApp & Hızlı İletişim Butonu</span>
            <span className="text-emerald-600 font-semibold">Mobil Başparmak Erişimi</span>
          </div>
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 text-slate-900 flex items-center justify-between shadow-sm">
            <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
              <span>📱 Mobil Görünüm (Ekranın Sağ Alt Köşesi)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-md">
              <span>💬 WhatsApp Hızlı Sipariş</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Sayfa ne kadar aşağı kaydırılırsa kaydırılsın, kullanıcının tek dokunuşla WhatsApp veya telefonla sipariş verebilmesini sağlar.
          </span>
        </div>
      );

    case 'robots_txt':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: robots.txt Dosyası & Sitemap Yönergesi</span>
            <span className="text-blue-600 font-mono">/{domain}/robots.txt</span>
          </div>
          <div className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-3 rounded-lg border border-slate-300 leading-relaxed shadow-sm">
            <div className="text-emerald-400 font-bold">User-agent: *</div>
            <div className="text-slate-300">Disallow: /admin/</div>
            <div className="text-slate-300">Disallow: /checkout/</div>
            <div className="text-slate-300">Disallow: /sepet/</div>
            <div className="text-cyan-300 font-bold mt-1">Sitemap: https://{domain}/sitemap.xml</div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Arama motoru botlarına gereksiz sistem sayfalarını taramamasını söyler ve site haritasının adresini verir.
          </span>
        </div>
      );

    case 'llms_txt':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Yapay Zeka Ajanları için /llms.txt Standardı</span>
            <span className="text-purple-600 font-semibold">AI & LLM Manifest</span>
          </div>
          <div className="bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-lg border border-slate-300 leading-relaxed shadow-sm">
            <div className="text-purple-300 font-bold"># {domain.toUpperCase()} - AI Kılavuzu</div>
            <div className="text-slate-300">&gt; Doğal sağlık destekleri ve bitkisel ürünler mağazası.</div>
            <div className="text-slate-300 mt-1">- [Ürünler](https://{domain}/urunler)</div>
            <div className="text-slate-300">- [Mesafeli Satış](https://{domain}/mesafeli-satis)</div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * ChatGPT, Perplexity ve Claude gibi yapay zeka motorları bu dosyayı okuyarak müşterilere doğru tavsiyeler verir.
          </span>
        </div>
      );

    case 'meta_title':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Google Arama Sonucu Başlık (&lt;title&gt;) Görünümü</span>
            <span className="text-blue-600 font-semibold">50-60 Karakter</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm">
            <div className="text-xs text-slate-500">{domain} › anasayfa</div>
            <div className="text-blue-800 text-sm font-medium hover:underline mt-0.5">
              FaynMed | Doğadan Bilime Bütüncül Sağlık Destekleri
            </div>
            <div className="mt-1 flex items-center gap-2">
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[85%]" />
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-bold shrink-0">51 / 60 Karakter (İdeal)</span>
            </div>
          </div>
        </div>
      );

    case 'fast_auth_buttons':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Header Hızlı Giriş Yap & Üye Ol Butonları</span>
            <span className="text-blue-600 font-semibold">Kullanıcı Erişimi</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex items-center justify-end gap-2">
            <button className="px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">
              👤 Giriş Yap
            </button>
            <button className="px-3 py-1 text-xs font-bold text-white bg-blue-600 rounded-md shadow-sm">
              ✍️ Hızlı Üye Ol
            </button>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Müşterinin sipariş takibi yapabilmesi ve kayıt olabilmesi için üst menüde net bir şekilde görünmelidir.
          </span>
        </div>
      );

    case 'meta_description':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Google Arama Sonucu Snippet Açıklaması</span>
            <span className="text-blue-600 font-semibold">120-160 Karakter</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm text-xs">
            <div className="text-slate-600 leading-relaxed">
              "Doğadan bilime bütüncül sağlık destekleri. Çiftlere özel takviye edici formüller, yüksek saflıkta bileşenler ve aynı gün kargo avantajıyla hemen sipariş verin."
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500 flex justify-between">
              <span>Hedef Uzunluk: 120-160 Karakter</span>
              <span className="font-bold text-blue-700">Mevcut: ~145 Karakter ✓</span>
            </div>
          </div>
        </div>
      );

    case 'social_sharing':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: WhatsApp & Sosyal Medya Paylaşım Kartı (og:image)</span>
            <span className="text-indigo-600 font-semibold">1200x630px Kart</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm max-w-sm">
            <div className="h-24 bg-gradient-to-r from-blue-900 to-indigo-900 flex items-center justify-center text-white font-bold text-xs">
              🖼️ Marka Logosu & 1200x630 Görsel
            </div>
            <div className="p-2.5 bg-slate-950 text-white text-xs">
              <div className="text-[10px] text-slate-400 uppercase">{domain}</div>
              <div className="font-bold text-slate-100 line-clamp-1">FaynMed | Bütüncül Sağlık Destekleri</div>
              <div className="text-[11px] text-slate-400 line-clamp-1">Aynı gün kargo ve güvenli ödeme fırsatıyla keşfedin.</div>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * og:image tanımlı olmadığında, WhatsApp ve LinkedIn'de paylaşılan bağlantıda hiçbir görsel çıkmaz.
          </span>
        </div>
      );

    case 'google_map_address':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Footer Açık Şirket Adresi ve Google Harita</span>
            <span className="text-emerald-600 font-semibold">Yerel Güven</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex items-start gap-3 text-xs">
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center shrink-0 font-bold">
              📍
            </div>
            <div>
              <div className="font-bold text-slate-900">Resmi Şirket ve İletişim Bilgileri:</div>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Bağdat Caddesi No:142 Kadıköy / İstanbul / Türkiye • Tel: 0850 300 00 00
              </p>
              <span className="text-blue-600 text-[10px] font-bold hover:underline cursor-pointer block mt-1">
                🗺️ Google Haritalarda Görüntüle ›
              </span>
            </div>
          </div>
        </div>
      );

    case 'customer_reviews':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Müşteri Yorumları & Yıldız Puanı Rozeti</span>
            <span className="text-amber-600 font-semibold">Sosyal Kanıt (Social Proof)</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm text-xs">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-500 font-bold text-sm">★★★★★</span>
              <span className="font-extrabold text-slate-900">4.9 / 5.0</span>
              <span className="text-slate-500 text-[11px]">(348 Onaylı Alıcı Değerlendirmesi)</span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] text-slate-700 italic">
              "Kargo 24 saatte elime ulaştı. Paketleme çok özenliydi, teşekkür ederim." — Zeynep T. (Onaylı Alışveriş)
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * E-ticarette kararsız müşterilerin %72'si satın almadan önce diğer müşteri yorumlarını okur.
          </span>
        </div>
      );

    case 'image_alt_tags':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Görsel Alt Metni (alt="...") Denetimi</span>
            <span className="text-blue-600 font-semibold">Görsel SEO</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex items-center gap-3 text-xs">
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded flex items-center justify-center text-slate-400 font-bold text-[10px] shrink-0">
              🖼️ Ürün
            </div>
            <div className="font-mono text-[11px] text-slate-700">
              &lt;img src="faynwomen.jpg" <br />
              <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded">
                alt="FaynWomen 2000mg İnositol Bütüncül Takviye"
              </span>&gt;
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Alt etiketi boş veya eksik olan resimler Google Görsellerde sıralama alamaz.
          </span>
        </div>
      );

    case 'google_rich_snippets':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Google Arama Sonuçlarında Zengin Kart (Rich Snippet)</span>
            <span className="text-purple-600 font-semibold">Schema.org Product</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm text-xs">
            <div className="text-blue-800 font-medium text-sm">FaynWomen 2000mg Doğal Takviye</div>
            <div className="flex items-center gap-3 text-[11px] text-slate-700 mt-1">
              <span className="text-amber-500 font-bold">★★★★★ 4.8</span>
              <span className="font-bold text-emerald-700">₺1.250,00</span>
              <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">Stokta Var ✓</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Fiyat ve stok bilgisi Google'da zengin kart olarak çıkarak tıklama oranını 2 katına çıkarır.
          </span>
        </div>
      );

    case 'legal_privacy_pages':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Footer Zorunlu Yasal Sözleşmeler Listesi</span>
            <span className="text-rose-600 font-semibold">Yasal Uyumluluk</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex flex-wrap gap-2 text-xs">
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 font-medium">
              📄 Mesafeli Satış Sözleşmesi
            </span>
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 font-medium">
              🔒 Gizlilik Politikası
            </span>
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 font-medium">
              🔄 İade & Cayma Koşulları
            </span>
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 font-medium">
              🚚 Teslimat & Kargo
            </span>
            <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded border border-slate-200 font-medium">
              🛡️ KVKK Aydınlatma Metni
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1.5 block italic">
            * Türkiye e-ticaret mevzuatında bu sayfaların footer linklerinde açıkça yer alması zorunludur.
          </span>
        </div>
      );

    case 'google_search_console':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: Search Console & İndekslenme Onay Durumu</span>
            <span className="text-emerald-600 font-semibold">Google Dizini</span>
          </div>
          <div className="bg-white border border-slate-300 rounded-lg p-3 shadow-sm flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <span>✓ Google Doğrulama: Onaylı</span>
              <span className="text-slate-300">|</span>
              <span>✓ Robots: index, follow</span>
              <span className="text-slate-300">|</span>
              <span>✓ Canonical: Tanımlı</span>
            </div>
          </div>
        </div>
      );

    case 'sitemap_xml':
      return (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            <span>📸 Görsel Mockup: XML Site Haritası Hiyerarşisi</span>
            <span className="text-blue-600 font-mono">/{domain}/sitemap.xml</span>
          </div>
          <div className="bg-slate-950 text-blue-400 font-mono text-[11px] p-3 rounded-lg border border-slate-800 leading-relaxed">
            <div>&lt;sitemapindex&gt;</div>
            <div className="text-slate-300 pl-4">&lt;sitemap&gt; /sitemap-products.xml (350 Ürün) &lt;/sitemap&gt;</div>
            <div className="text-slate-300 pl-4">&lt;sitemap&gt; /sitemap-categories.xml (18 Kategori) &lt;/sitemap&gt;</div>
            <div>&lt;/sitemapindex&gt;</div>
          </div>
        </div>
      );

    default:
      return null;
  }
}
