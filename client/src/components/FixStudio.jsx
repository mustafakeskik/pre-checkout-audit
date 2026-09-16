import React, { useState, useEffect } from 'react';
import {
  Wrench, Copy, Check, Download, Sparkles, FileCode, Shield, PhoneCall, HelpCircle,
  Layers, Share2, FileX, Megaphone, Link2, PartyPopper, Quote, Gauge, Type, TextCursorInput,
  LogIn, MapPin, Star, ImageIcon, Code2, SearchCheck, Map, Accessibility, ListChecks,
  ShoppingCart, Lock
} from 'lucide-react';

// Every entry's id matches a checklist item id 1:1, so clicking "Hazır Çözüm"
// on any audit item always opens its own dedicated generator — no silent fallback.
const TOOLS = [
  { id: 'page_404', name: '404 Sayfası', icon: FileX, desc: 'Satışa yönlendiren, arama kutulu özel 404 şablonu.' },
  { id: 'top_cta', name: 'Üst Kısma CTA', icon: Megaphone, desc: 'Sabit duyuru/kampanya şeridi.' },
  { id: 'internal_linking', name: 'İç Linkleme Rehberi', icon: Link2, desc: 'İlgili ürün bloğu ve iç link stratejisi.' },
  { id: 'thank_you_page', name: 'Teşekkür Sayfası', icon: PartyPopper, desc: 'Sipariş onay içeriği ve dönüşüm pikseli.' },
  { id: 'cart_flow', name: 'Sepet Akışı (Mini-Sepet)', icon: ShoppingCart, desc: 'Mini-sepet, miktar güncelleme ve misafir checkout kodu.' },
  { id: 'checkout_security', name: 'Checkout Güvenliği', icon: Lock, desc: 'HTTPS, güven rozeti, form doğrulama ve ödeme altyapısı rehberi.' },
  { id: 'breadcrumbs', name: 'Breadcrumbs & Schema', icon: Layers, desc: 'Semantik işaret yolu HTML ve BreadcrumbList şeması.' },
  { id: 'case_studies', name: 'Vaka Çalışması Bloğu', icon: Quote, desc: 'Müşteri referansı / başarı hikayesi şablonu.' },
  { id: 'faq_5', name: '5 Adet SSS Schema', icon: HelpCircle, desc: 'Google zengin sonuçlar için FAQPage şeması.' },
  { id: 'page_speed', name: 'Site Hızı Rehberi', icon: Gauge, desc: 'Core Web Vitals için aksiyon listesi.' },
  { id: 'sticky_phone_cta', name: 'Sticky Telefon / WhatsApp', icon: PhoneCall, desc: 'Ekranın köşesinde sabit hızlı iletişim butonu.' },
  { id: 'robots_txt', name: 'robots.txt Üretici', icon: FileCode, desc: 'Arama motoru botları ve sitemap yönergeleri.' },
  { id: 'llms_txt', name: 'llms.txt Üretici', icon: Sparkles, desc: 'Yapay zeka (AI/LLM) ajanları için manifest dosyası.' },
  { id: 'meta_title', name: 'Meta Başlık Şablonu', icon: Type, desc: 'Benzersiz <title> kuralları ve örnek.' },
  { id: 'fast_auth_buttons', name: 'Hızlı Giriş Butonları', icon: LogIn, desc: 'Google/SMS girişi + misafir alışverişi notu.' },
  { id: 'meta_description', name: 'Meta Açıklama Şablonu', icon: TextCursorInput, desc: 'Benzersiz meta description kuralları.' },
  { id: 'social_sharing', name: 'OpenGraph & Twitter Meta', icon: Share2, desc: 'WhatsApp ve sosyal medyada zengin paylaşım kartları.' },
  { id: 'google_map_address', name: 'Google Harita & Adres', icon: MapPin, desc: 'Gömülü harita ve açık adres bloğu.' },
  { id: 'customer_reviews', name: 'Müşteri Yorumları Widget\'ı', icon: Star, desc: 'Yorum bloğu + AggregateRating şeması.' },
  { id: 'image_alt_tags', name: 'Resim Alt Etiketi Rehberi', icon: ImageIcon, desc: 'Doğru/yanlış örnekler ve toplu kontrol script\'i.' },
  { id: 'google_rich_snippets', name: 'Product Schema (Rich Snippet)', icon: Code2, desc: 'Fiyat, stok ve puan içeren ürün şeması.' },
  { id: 'legal_privacy_pages', name: 'Zorunlu Yasal Sözleşmeler', icon: Shield, desc: 'Mesafeli Satış Sözleşmesi & KVKK metni.' },
  { id: 'google_search_console', name: 'Search Console Kurulumu', icon: SearchCheck, desc: 'Doğrulama ve sitemap gönderim adımları.' },
  { id: 'sitemap_xml', name: 'sitemap.xml Rehberi', icon: Map, desc: 'Kontrol, kurulum ve robots.txt entegrasyonu.' },
  { id: 'accessibility_wcag', name: 'Erişilebilirlik (WCAG 2.1 AA)', icon: Accessibility, desc: 'Sitenize özel bulgular ve düzeltme kod örnekleri.' },
  { id: 'checkout_funnel', name: 'Checkout Optimizasyon Rehberi', icon: ListChecks, desc: 'Adım sayısı, gereksiz form alanları ve dönüşüm önerileri.' },
];

const PLATFORMS = [
  { id: 'generic', name: 'Genel / Diğer' },
  { id: 'shopify', name: 'Shopify' },
  { id: 'woocommerce', name: 'WooCommerce' },
  { id: 'ticimax', name: 'Ticimax' },
  { id: 'ikas', name: 'İkas' },
];

export default function FixStudio({ results, initialTool = 'page_404' }) {
  const [selectedTool, setSelectedTool] = useState(initialTool);
  const [platform, setPlatform] = useState('generic');
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const tools = TOOLS;

  useEffect(() => {
    if (initialTool) {
      setSelectedTool(initialTool);
    }
  }, [initialTool]);

  useEffect(() => {
    fetchFixCode(selectedTool, platform);
  }, [selectedTool, platform, results]);

  const fetchFixCode = async (toolId, platformId) => {
    setLoading(true);
    try {
      const siteInfo = {
        title: results?.checklist?.meta_title?.details?.title || 'E-Ticaret Mağazası',
        description: results?.checklist?.meta_description?.details?.description || 'En yeni ürünler ve avantajlı fırsatlar.',
        url: results?.url || 'https://siteniz.com'
      };

      const issues = results?.checklist?.accessibility_wcag?.details?.issues || [];
      const checkoutDetails = results?.checklist?.checkout_funnel?.details || {};

      const res = await fetch('/api/generate-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: toolId, siteInfo, platform: platformId, issues, checkoutDetails })
      });

      const data = await res.json();
      if (typeof data.snippet === 'object') {
        setGeneratedCode(data.snippet.mesafeliSatis + '\n\n' + '---' + '\n\n' + data.snippet.kvkk);
      } else {
        setGeneratedCode(data.snippet || '');
      }
    } catch (err) {
      console.error('Error generating fix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PLATFORM_AWARE = ['page_404', 'top_cta', 'thank_you_page', 'google_search_console', 'sitemap_xml'];

  const handleDownload = () => {
    let filename = `${selectedTool}.txt`;
    if (selectedTool === 'llms_txt') filename = 'llms.txt';
    if (selectedTool === 'robots_txt') filename = 'robots.txt';
    if (selectedTool === 'faq_5' || selectedTool === 'breadcrumbs' || selectedTool === 'google_rich_snippets' || selectedTool === 'customer_reviews') filename = 'schema.html';

    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-[#0071e3]" />
            <span>Fix Studio — Otomatik Çözüm ve Kod Üretici</span>
          </h2>
          <p className="text-xs text-[#6e6e73]">
            22 kontrol maddesinin her biri kendi çözümüne bağlıdır — sitenize anında entegre edin.
          </p>
        </div>

        {/* Platform Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#6e6e73]">Platform:</span>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="bg-[#f5f5f7] border border-black/[0.06] rounded-lg px-2.5 py-1.5 text-[#1d1d1f] text-xs font-medium focus:ring-1 focus:ring-[#0071e3]"
          >
            {PLATFORMS.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tool Selectors (Left Column) */}
        <div className="lg:col-span-4 space-y-2">
          {tools.map((t) => {
            const Icon = t.icon;
            const isSelected = selectedTool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTool(t.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start space-x-3 ${
                  isSelected
                    ? 'bg-[#0071e3]/10 border-[#0071e3]/30 text-[#1d1d1f] shadow-md'
                    : 'bg-[#f5f5f7]/40 border-black/[0.06] text-[#6e6e73] hover:border-black/10 hover:text-[#1d1d1f]'
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#0071e3] text-white' : 'bg-black/[0.04] text-[#6e6e73]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#1d1d1f]">
                    {t.name}
                  </div>
                  <div className="text-[11px] text-[#86868b] mt-0.5 leading-tight">
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Code Output Viewer (Right Column) */}
        <div className="lg:col-span-8 bg-[#f5f5f7] border border-black/[0.06] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-mono font-bold text-[#424245]">
                  {tools.find(t => t.id === selectedTool)?.name} Çıktısı
                </span>
                {PLATFORM_AWARE.includes(selectedTool) && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#0071e3]/10 text-[#0071e3]">
                    {PLATFORMS.find(p => p.id === platform)?.name} için özelleştirildi
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-black/[0.04] hover:bg-black/[0.06] text-[#424245] text-xs font-medium transition-colors border border-black/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Dosyayı İndir</span>
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-semibold shadow transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#1d9a4e]" />
                      <span>Kopyalandı!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kodu Kopyala</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Body */}
            <div className="relative">
              {loading ? (
                <div className="h-72 flex items-center justify-center text-xs text-[#86868b]">
                  Kod oluşturuluyor...
                </div>
              ) : (
                <pre className="p-4 bg-white rounded-lg text-[#1d1d1f] font-mono text-xs overflow-x-auto max-h-96 leading-relaxed border border-black/[0.06]">
                  {generatedCode}
                </pre>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/[0.06] text-[11px] text-[#86868b] flex items-center justify-between">
            <span>* Sitenizin başlık ve alan adı verilerine göre otomatik optimize edilmiştir.</span>
            <span>UTF-8 Kodlama</span>
          </div>
        </div>
      </div>
    </div>
  );
}
