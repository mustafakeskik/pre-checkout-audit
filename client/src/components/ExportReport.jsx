import React from 'react';
import { Download, ShieldCheck, CheckCircle2, AlertTriangle, XCircle, FileText, Info } from 'lucide-react';
import IssueVisualMockup from './IssueVisualMockup';
import { useBrand } from '../context/BrandContext';

export default function ExportReport({ results }) {
  const { brand } = useBrand();
  if (!results) return null;

  const { scores, summary, url, timestamp, checklist } = results;

  const handleDownloadPdf = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] mb-8">
      {/* Action Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-black/[0.06] pb-4 no-print">
        <div>
          <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#0071e3]" />
            <span>Denetim Raporunu İndir (PDF)</span>
          </h2>
          <p className="text-xs text-[#6e6e73] mt-0.5">
            Tüm sorunların görsel açıklamalarını ve düzeltme adımlarını içeren kapsamlı denetim raporu.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center space-x-2 px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#0071e3]/15 hover:scale-[1.02] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Raporu İndir (PDF)</span>
          </button>
        </div>
      </div>

      <div className="no-print bg-[#0071e3]/[0.06] border border-[#0071e3]/30 rounded-xl p-3 mb-6 text-xs text-[#0071e3] flex items-center space-x-2">
        <Info className="w-4 h-4 text-[#0071e3] shrink-0" />
        <span>
          <strong>İpucu:</strong> "Raporu İndir (PDF)" butonuna bastığınızda açılan tarayıcı penceresinde <em>Hedef: "PDF Olarak Kaydet"</em> seçerek raporu anında bilgisayarınıza indirebilirsiniz.
        </span>
      </div>

      {/* Printable Report Document (A4 Optimized) */}
      <div id="printable-report" className="bg-white text-slate-900 p-6 sm:p-12 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] font-sans print:p-0 print:shadow-none print:bg-white print:text-black">
        {/* Report Header */}
        <div className="flex items-center justify-between border-b-2 border-slate-200 pb-6 mb-8">
          <div>
            <div className="flex items-center space-x-2">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt={brand.companyName} className="w-8 h-8 object-contain" />
              ) : (
                <ShieldCheck className="w-8 h-8" style={{ color: brand.primaryColor }} />
              )}
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {brand.reportTitle}
                </h1>
                <span className="text-[11px] font-semibold text-[#86868b]">{brand.companyName}</span>
              </div>
            </div>
            <p className="text-xs text-[#86868b] mt-1 font-mono">
              Hedef: <strong style={{ color: brand.primaryColor }}>{url || 'Şirket HTML Kodu'}</strong> • Tarih: {new Date(timestamp).toLocaleDateString('tr-TR')} {new Date(timestamp).toLocaleTimeString('tr-TR')}
            </p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black" style={{ color: brand.primaryColor }}>
              {scores.overall}/100
            </span>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6e6e73]">
              Genel Sağlık Skoru
            </span>
          </div>
        </div>

        {/* Executive Summary Grid */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-[#86868b] block mb-1">Pre-Checkout</span>
            <span className="text-2xl font-extrabold text-slate-900">%{scores.preCheckout}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-[#86868b] block mb-1">Teknik SEO</span>
            <span className="text-2xl font-extrabold text-slate-900">%{scores.technicalSeo}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-[#86868b] block mb-1">Yasal & Güven</span>
            <span className="text-2xl font-extrabold text-slate-900">%{scores.legalTrust}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-[#86868b] block mb-1">Dönüşüm & UX</span>
            <span className="text-2xl font-extrabold text-slate-900">%{scores.conversionUx}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs font-bold text-[#86868b] block mb-1">Erişilebilirlik</span>
            <span className="text-2xl font-extrabold text-slate-900">%{scores.accessibility}</span>
          </div>
        </div>

        {/* Live Screenshot (if captured) */}
        {results.screenshot && (
          <div className="mb-8 p-4 rounded-xl border border-slate-200 bg-slate-50 report-item-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                🌐 Canlı Site Ekran Görüntüsü (Görsel İnceleme)
              </span>
              <span className="text-[11px] text-[#86868b] font-mono">Google Chrome 1440x900</span>
            </div>
            <div className="max-h-72 overflow-hidden rounded-lg border border-slate-300 shadow-sm bg-white">
              <img src={results.screenshot} alt="Canlı Sayfa Ekran Görüntüsü" className="w-full object-cover object-top" />
            </div>
          </div>
        )}

        {/* Summary Counter */}
        <div className="flex items-center space-x-6 text-xs font-semibold mb-8 p-3 bg-slate-100 rounded-lg">
          <span className="text-emerald-700 flex items-center space-x-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{summary.passed} Madde Başarılı</span>
          </span>
          <span className="text-amber-700 flex items-center space-x-1">
            <AlertTriangle className="w-4 h-4" />
            <span>{summary.warning} Madde Uyarı Seviyesinde</span>
          </span>
          <span className="text-rose-700 flex items-center space-x-1">
            <XCircle className="w-4 h-4" />
            <span>{summary.failed} Madde Eksik / Hatalı</span>
          </span>
        </div>

        {/* Detailed Items Table with Visual Mockups for Every Item */}
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
          Denetlenen Tüm Kriterler, Görsel Örnekler ve Düzeltme Rehberi
        </h3>

        <div className="space-y-6 text-xs">
          {Object.values(checklist).map((item, idx) => (
            <div 
              key={item.id} 
              className={`p-4 rounded-xl border report-item-card ${
                item.status === 'failed' 
                  ? 'border-rose-300 bg-rose-50/30' 
                  : item.status === 'warning' 
                  ? 'border-amber-300 bg-amber-50/30' 
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Item Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-[#6e6e73]">#{idx + 1}</span>
                  <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${
                  item.status === 'passed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                  item.status === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                  'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {item.status === 'passed' ? 'BAŞARILI ✓' : item.status === 'warning' ? 'UYARI ⚠' : 'KRİTİK EKSİK ✕'}
                </span>
              </div>

              {/* Status Message */}
              <p className="text-slate-700 text-xs mb-2 leading-relaxed">
                <strong>Tespit:</strong> {item.message}
              </p>

              {/* Action Recommendation */}
              {item.recommendation && (
                <div className="mb-3 p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-900 text-xs">
                  <strong>💡 Aksiyon / Nasıl Düzeltilir:</strong> {item.recommendation}
                </div>
              )}

              {/* Visual Mockup Illustration for Non-Technical Users */}
              <IssueVisualMockup itemId={item.id} item={item} siteUrl={url} />
            </div>
          ))}
        </div>

        {/* Report Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[11px] text-[#6e6e73] report-footer">
          {brand.footerText}
          {brand.contactInfo && <span> • {brand.contactInfo}</span>}
        </div>
      </div>
    </div>
  );
}
