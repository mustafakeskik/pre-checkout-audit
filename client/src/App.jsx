import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuditInputBar from './components/AuditInputBar';
import ScoreCards from './components/ScoreCards';
import ChecklistTable from './components/ChecklistTable';
import SeoAuditTab from './components/SeoAuditTab';
import FixStudio from './components/FixStudio';
import ExportReport from './components/ExportReport';
import CompetitorCompare from './components/CompetitorCompare';
import { useBrand } from './context/BrandContext';
import {
  CheckSquare, Search, Wrench, FileDown, AlertCircle, Sparkles, ShoppingBag,
  Layers, ArrowRight, ShieldCheck, Zap, Swords
} from 'lucide-react';

export default function App() {
  const { brand } = useBrand();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' | 'seo' | 'fix_studio' | 'export'
  const [selectedFixTool, setSelectedFixTool] = useState('llms_txt');
  const [isChromeReady, setIsChromeReady] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Check backend health and Chrome availability
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setIsChromeReady(data.chromeInstalled);
      })
      .catch(() => setIsChromeReady(false));
  }, []);

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Audit Live URL
  const handleAuditUrl = async (url, useChrome) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/audit/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, useChrome })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Denetim sırasında sunucu hatası oluştu.');
      }
      setResults(data);
      setActiveTab('checklist');
      showNotification('Denetim başarıyla tamamlandı!', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Audit Raw HTML
  const handleAuditHtml = async (html, url) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/audit/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, url })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'HTML analizi sırasında hata oluştu.');
      }
      setResults(data);
      setActiveTab('checklist');
      showNotification('HTML denetimi tamamlandı!', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Launch Chrome Session
  const handleLaunchChrome = async (startUrl) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chrome/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showNotification(data.message || 'Chrome penceresi açıldı.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Capture Active Chrome Page
  const handleCaptureChrome = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chrome/capture', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data);
      setActiveTab('checklist');
      showNotification('Canlı Chrome sekmesi başarıyla çekildi ve denetlendi!', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fix Studio tool ids now map 1:1 to checklist item ids — every checklist
  // item has its own dedicated code generator, no more silent fallback.
  const handleSelectFixItem = (checklistId) => {
    setSelectedFixTool(checklistId);
    setActiveTab('fix_studio');
  };

  // Demo audit loader for quick trial
  const loadDemoAudit = () => {
    const demoHtml = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <title>ModaStyle - Kadın & Erkek Yeni Sezon Giyim</title>
        <meta name="description" content="ModaStyle ile en yeni sezon kadın ve erkek giyim ürünlerini keşfedin. Peşin fiyatına 3 taksit ve ücretsiz kargo avantajıyla hemen sipariş verin.">
        <meta property="og:title" content="ModaStyle - Yeni Sezon Giyim">
        <meta property="og:image" content="https://modastyle.com/og-banner.jpg">
        <meta property="og:url" content="https://modastyle.com">
        <meta name="twitter:card" content="summary_large_image">
        <link rel="canonical" href="https://modastyle.com">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "Oversize Keten Gömlek",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "reviewCount": "124"
          }
        }
        </script>
      </head>
      <body>
        <header class="top-bar">
          <div class="announcement">İlk Alışverişe Özel %15 İndirim! <a href="/kampanya">Hemen İncele</a></div>
          <a href="/login">Giriş Yap</a>
          <a href="/register">Üye Ol</a>
        </header>
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li><a href="/">Ana Sayfa</a></li>
            <li>Kadın</li>
          </ol>
        </nav>
        <h1>ModaStyle Yeni Sezon Koleksiyonu</h1>
        <h2>Öne Çıkan Ürünler</h2>
        <a href="tel:08502223344" class="sticky-call">Hemen Ara</a>
        <div class="faq-item">Soru: Kargo kaç günde gelir?</div>
        <div class="faq-item">Soru: İade süresi kaç gün?</div>
        <div class="faq-item">Soru: Kapıda ödeme var mı?</div>
        <div class="faq-item">Soru: Değişim nasıl yapılır?</div>
        <div class="faq-item">Soru: Ürün bedenleri standart mı?</div>
        <div class="review-box">Müşteri Yorumları (4.8 / 5)</div>
        <div class="case-study">Vaka Çalışmaları ve Başarı Hikayeleri</div>
        <footer>
          <p>Barbaros Bulvarı No:42 Beşiktaş İstanbul Türkiye</p>
          <a href="/gizlilik-politikasi">Gizlilik Politikası</a>
          <a href="/mesafeli-satis-sozlesmesi">Mesafeli Satış Sözleşmesi</a>
          <a href="/iade-kosullari">İade ve Değişim Koşulları</a>
          <a href="/kargo-teslimat">Teslimat ve Kargo</a>
          <a href="/kvkk">KVKK Aydınlatma Metni</a>
          <a href="/kullanim-kosullari">Kullanım Koşulları</a>
        </footer>
      </body>
      </html>
    `;
    handleAuditHtml(demoHtml, 'https://modastyle.com');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col font-sans">
      <div className="no-print">
        <Navbar onReset={() => setResults(null)} isChromeReady={isChromeReady} />
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1d1d1f] text-white px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center space-x-2 text-xs font-medium no-print animate-[fadeIn_0.2s_ease-out]">
          <Sparkles className="w-4 h-4 text-[#0071e3]" />
          <span>{notification.msg}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Banner when no results yet */}
        {!results && (
          <div className="mb-8 text-center max-w-3xl mx-auto pt-4 pb-2 no-print">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-black/[0.04] text-[#6e6e73] text-[11px] font-medium mb-5">
              <ShieldCheck className="w-3 h-3" />
              <span>E-Ticaret & Pre-Checkout Kalite Güvencesi</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-[#1d1d1f] mb-4 leading-[1.05]">
              Yayına almadan önce,<br />
              <span className="text-[#0071e3]">eksiksiz olun.</span>
            </h1>
            <p className="text-[#6e6e73] text-base sm:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              404 sayfası, üst CTA, iç linkleme, 5 adet SSS, teşekkür sayfası, robots.txt, llms.txt, zengin schema verileri ve yasal sözleşmeleri dakikalar içinde denetleyin.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={loadDemoAudit}
                className="flex items-center space-x-2 px-5 py-2.5 bg-white hover:bg-black/[0.02] text-[#0071e3] rounded-full text-sm font-medium border border-black/10 transition-colors shadow-[0_2px_10px_rgb(0,0,0,0.04)]"
              >
                <Zap className="w-4 h-4" />
                <span>Örnek Denetimi Çalıştır</span>
              </button>
            </div>
          </div>
        )}

        {/* Input Bar (URL / HTML / Chrome) */}
        <div className="no-print">
          <AuditInputBar
            onAuditUrl={handleAuditUrl}
            onAuditHtml={handleAuditHtml}
            onLaunchChrome={handleLaunchChrome}
            onCaptureChrome={handleCaptureChrome}
            loading={loading}
            chromeSessionActive={isChromeReady}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 bg-[#d70015]/[0.06] border border-[#d70015]/20 rounded-xl p-4 flex items-center space-x-3 text-[#d70015] text-xs shadow-sm no-print">
            <AlertCircle className="w-5 h-5 text-[#d70015] shrink-0" />
            <div>
              <span className="font-bold block">Hata Oluştu:</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Results View */}
        {results && (
          <div>
            {/* Scorecard Overview (Visible only in interactive dashboard, hidden in print) */}
            <div className="no-print">
              <ScoreCards results={results} />
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 mb-6 no-print overflow-x-auto bg-black/[0.04] p-1 rounded-full w-fit max-w-full">
              <button
                onClick={() => setActiveTab('checklist')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-xs transition-all shrink-0 ${
                  activeTab === 'checklist'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Kontrol Listesi</span>
              </button>

              <button
                onClick={() => setActiveTab('seo')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-xs transition-all shrink-0 ${
                  activeTab === 'seo'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>SEO Raporu</span>
              </button>

              <button
                onClick={() => setActiveTab('fix_studio')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-xs transition-all shrink-0 ${
                  activeTab === 'fix_studio'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Fix Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-xs transition-all shrink-0 ${
                  activeTab === 'export'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Raporu Dışa Aktar</span>
              </button>

              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium text-xs transition-all shrink-0 ${
                  activeTab === 'compare'
                    ? 'bg-white text-[#1d1d1f] shadow-sm'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Rakip Karşılaştırma</span>
              </button>
            </div>

            {/* Active Tab Content */}
            {activeTab === 'checklist' && (
              <ChecklistTable
                checklist={results.checklist}
                onSelectFixItem={handleSelectFixItem}
              />
            )}

            {activeTab === 'seo' && (
              <SeoAuditTab results={results} />
            )}

            {activeTab === 'fix_studio' && (
              <FixStudio results={results} initialTool={selectedFixTool} />
            )}

            {activeTab === 'export' && (
              <ExportReport results={results} />
            )}

            {activeTab === 'compare' && (
              <CompetitorCompare mainResults={results} />
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-black/[0.06] bg-white/80 py-6 text-center text-xs text-[#86868b] no-print">
        {brand.footerText}
      </footer>
    </div>
  );
}
