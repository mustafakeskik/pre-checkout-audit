import React, { useState } from 'react';
import { Globe, Code, Chrome, ArrowRight, Upload, Play, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuditInputBar({ onAuditUrl, onAuditHtml, onLaunchChrome, onCaptureChrome, loading, chromeSessionActive }) {
  const [activeTab, setActiveTab] = useState('url'); // 'url' | 'html' | 'chrome'
  const [url, setUrl] = useState('');
  const [useChromeForUrl, setUseChromeForUrl] = useState(true);
  const [htmlContent, setHtmlContent] = useState('');
  const [companyDomain, setCompanyDomain] = useState('https://sirketim.com');
  const [chromeStartUrl, setChromeStartUrl] = useState('');

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAuditUrl(url.trim(), useChromeForUrl);
  };

  const handleHtmlSubmit = (e) => {
    e.preventDefault();
    if (!htmlContent.trim()) return;
    onAuditHtml(htmlContent, companyDomain.trim() || 'https://sirketim.com');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setHtmlContent(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-xl mb-8">
      {/* Tab Selectors */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-black/[0.06] pb-4">
        <button
          onClick={() => setActiveTab('url')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'url'
              ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/15 ring-2 ring-[#0071e3]/20'
              : 'text-[#6e6e73] hover:text-white hover:bg-black/[0.04]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>1. Canlı URL Taraması</span>
        </button>

        <button
          onClick={() => setActiveTab('html')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'html'
              ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/15 ring-2 ring-[#0071e3]/20'
              : 'text-[#6e6e73] hover:text-white hover:bg-black/[0.04]'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>2. Şirket HTML Kodu / Dosya Yapıştır</span>
        </button>

        <button
          onClick={() => setActiveTab('chrome')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            activeTab === 'chrome'
              ? 'bg-[#0071e3] text-white shadow-lg shadow-[#0071e3]/15 ring-2 ring-[#0071e3]/20'
              : 'text-[#6e6e73] hover:text-white hover:bg-black/[0.04]'
          }`}
        >
          <Chrome className="w-4 h-4 text-[#1d9a4e]" />
          <span>3. Chrome ile Canlı Bağlan (E-Ticaret Paneli)</span>
          <span className="text-[10px] bg-[#1d9a4e]/10 text-[#1d9a4e] font-bold px-1.5 py-0.5 rounded ml-1">
            API Keysiz
          </span>
        </button>
      </div>

      {/* Tab 1: Live URL */}
      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#86868b]">
                <Globe className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Örn: https://magazaniz.com veya www.site.com"
                disabled={loading}
                className="w-full pl-11 pr-4 py-3.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] focus:border-transparent text-sm transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-xl shadow-lg shadow-[#0071e3]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Denetleniyor...</span>
                </>
              ) : (
                <>
                  <span>Pre-Checkout Denetimi Başlat</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-[#6e6e73] pt-1">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useChromeForUrl}
                onChange={(e) => setUseChromeForUrl(e.target.checked)}
                className="w-4 h-4 rounded border-black/10 bg-[#f5f5f7] text-blue-600 focus:ring-[#0071e3]"
              />
              <span className="text-[#424245]">
                Gerçek Google Chrome ile render et (Dinamik JS, ekran görüntüsü ve Core Web Vitals analizi)
              </span>
            </label>
            <span className="text-[#86868b]">
              * robots.txt, sitemap.xml, 404 testi, LLMS.txt ve 22+ madde otomatik taranır.
            </span>
          </div>
        </form>
      )}

      {/* Tab 2: Raw HTML */}
      {activeTab === 'html' && (
        <form onSubmit={handleHtmlSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#424245] mb-1.5">
                Şirket / Mağaza HTML Kodunu Yapıştırın:
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="<!DOCTYPE html><html><head>...</head><body>...</body></html>"
                rows={6}
                disabled={loading}
                className="w-full p-3 bg-[#f5f5f7] border border-black/10 rounded-xl text-[#1d1d1f] font-mono text-xs placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3] transition-all resize-y"
              />
            </div>

            <div className="space-y-3 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-[#424245] mb-1.5">
                  Alternatif: .html Dosyası Yükle
                </label>
                <label className="border-2 border-dashed border-black/10 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-[#f5f5f7] transition-colors">
                  <Upload className="w-6 h-6 text-[#6e6e73] mb-1" />
                  <span className="text-xs text-[#424245] font-medium">Dosya Seç veya Sürükle</span>
                  <span className="text-[10px] text-[#86868b]">.html veya .htm</span>
                  <input type="file" accept=".html,.htm" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#424245] mb-1">
                  Site Alan Adı (İç linkleme analizi için):
                </label>
                <input
                  type="text"
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder="https://siteniz.com"
                  className="w-full px-3 py-2 bg-[#f5f5f7] border border-black/10 rounded-lg text-[#1d1d1f] text-xs focus:ring-1 focus:ring-[#0071e3]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !htmlContent.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-xl shadow-lg shadow-[#0071e3]/10 disabled:opacity-50 text-sm transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>HTML Analiz Ediliyor...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>HTML'i Pre-Checkout & SEO Denetiminden Geçir</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Interactive Chrome Session */}
      {activeTab === 'chrome' && (
        <div className="space-y-4">
          <div className="bg-[#0071e3]/[0.06] border border-[#0071e3]/30 rounded-xl p-4 text-xs text-indigo-200 leading-relaxed">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-[#0071e3] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0071e3] font-bold block mb-1">
                  API Key Olmadan E-Ticaret Paneline Doğrudan Bağlantı:
                </strong>
                Kullanıcı adı ve şifrenizle giriş yaptığınız Shopify, WooCommerce, Ticimax, İkas veya IdeaSoft panelindeki sayfayı tek tıkla analiz edebilirsiniz. Sistem Mac'inizdeki yerel Google Chrome'u başlatır; siz giriş yaptıktan veya sayfayı açtıktan sonra "Açık Sayfayı Canlı Çek" demeniz yeterlidir!
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Step 1 */}
            <div className="bg-[#f5f5f7] border border-black/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">1. Adım</span>
                <span className="text-[10px] bg-[#0071e3]/[0.1] text-[#0071e3] px-2 py-0.5 rounded font-semibold">
                  Tarayıcı Başlatıcı
                </span>
              </div>
              <p className="text-xs text-[#424245]">
                Mac üzerinde yeni bir Google Chrome penceresi açılır:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chromeStartUrl}
                  onChange={(e) => setChromeStartUrl(e.target.value)}
                  placeholder="https://panel.magazaniz.com"
                  className="flex-1 px-3 py-2 bg-white border border-black/10 rounded-lg text-xs text-[#1d1d1f]"
                />
                <button
                  onClick={() => onLaunchChrome(chromeStartUrl)}
                  disabled={loading}
                  className="flex items-center space-x-1.5 px-4 py-2 bg-black/[0.04] hover:bg-black/[0.06] text-[#1d1d1f] rounded-lg text-xs font-semibold border border-black/10 transition-colors"
                >
                  <Chrome className="w-3.5 h-3.5 text-[#0071e3]" />
                  <span>Chrome'u Başlat</span>
                </button>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-[#f5f5f7] border border-black/[0.06] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">2. Adım</span>
                <span className="text-[10px] bg-[#1d9a4e]/10 text-[#1d9a4e] px-2 py-0.5 rounded font-semibold">
                  Canlı Yakalama
                </span>
              </div>
              <p className="text-xs text-[#424245]">
                Chrome'da ilgili sayfaya (checkout, anasayfa veya panel) geldikten sonra:
              </p>
              <button
                onClick={onCaptureChrome}
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Chrome'dan Çekiliyor...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Açık Sayfayı Canlı Çek ve Analiz Et</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
