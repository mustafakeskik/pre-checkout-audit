import React from 'react';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, TrendingUp, Award, Clock, ExternalLink, Accessibility } from 'lucide-react';

export default function ScoreCards({ results }) {
  if (!results) return null;

  const { scores, summary, url, timestamp, scoreUnreliable } = results;

  const getScoreBadge = (score) => {
    if (score === null || score === undefined) {
      return {
        label: 'Skor Hesaplanamadı',
        color: 'text-[#6e6e73] bg-black/[0.04] border-black/10',
        barColor: 'bg-black/20'
      };
    }
    if (score >= 85) {
      return {
        label: 'Yayına & Satışa Hazır',
        color: 'text-[#1d9a4e] bg-[#1d9a4e]/10 border-[#1d9a4e]/20',
        barColor: 'bg-[#1d9a4e]'
      };
    }
    if (score >= 65) {
      return {
        label: 'İyileştirme Gerekiyor',
        color: 'text-[#c77700] bg-[#c77700]/10 border-[#c77700]/20',
        barColor: 'bg-[#c77700]'
      };
    }
    return {
      label: 'Kritik Eksikler Var',
      color: 'text-[#d70015] bg-[#d70015]/10 border-[#d70015]/20',
      barColor: 'bg-[#d70015]'
    };
  };

  const overallBadge = getScoreBadge(scores.overall);

  return (
    <div className="space-y-6 mb-8">
      {/* Top Banner: Tested Target & Meta Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-black/[0.06] rounded-xl px-5 py-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-[#6e6e73]">Denetlenen Hedef:</span>
          <span className="text-xs font-mono font-bold text-[#0071e3] flex items-center gap-1">
            {url || 'Şirket HTML Kodu / Canlı Chrome'}
            {url && (
              <a href={url} target="_blank" rel="noreferrer" className="hover:text-[#0071e3]">
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-[#6e6e73]">
          <div className="flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date(timestamp).toLocaleTimeString('tr-TR')}</span>
          </div>
          <span className="text-[#86868b]">•</span>
          <span>{summary.total} Kontrol Maddesi Tamamlandı</span>
        </div>
      </div>

      {/* Main Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Big Overall Score Card */}
        <div className="lg:col-span-4 bg-white border border-black/[0.06] rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_20px_rgb(0,0,0,0.05)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#0071e3]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Genel Sağlık & Hazırlık Skoru
              </span>
              <Award className="w-5 h-5 text-[#0071e3]" />
            </div>

            <div className="flex items-baseline space-x-3 my-4">
              <span className="text-6xl font-black tracking-tight text-[#1d1d1f]">
                {scoreUnreliable ? '—' : scores.overall}
              </span>
              {!scoreUnreliable && <span className="text-2xl font-bold text-[#86868b]">/ 100</span>}
            </div>

            <div className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${overallBadge.color} mb-6`}>
              {overallBadge.label}
            </div>
          </div>

          {/* Metric Summary Breakdown */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-black/[0.06]">
            <div className="bg-[#1d9a4e]/[0.06] border border-[#1d9a4e]/15 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center space-x-1 text-[#1d9a4e] mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{summary.passed}</span>
              </div>
              <span className="text-[10px] text-[#6e6e73]">Başarılı</span>
            </div>

            <div className="bg-[#c77700]/[0.06] border border-[#c77700]/15 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center space-x-1 text-[#c77700] mb-0.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{summary.warning}</span>
              </div>
              <span className="text-[10px] text-[#6e6e73]">Uyarı</span>
            </div>

            <div className="bg-[#d70015]/[0.06] border border-[#d70015]/15 rounded-xl p-2.5 text-center">
              <div className="flex items-center justify-center space-x-1 text-[#d70015] mb-0.5">
                <XCircle className="w-3.5 h-3.5" />
                <span className="text-xs font-bold">{summary.failed}</span>
              </div>
              <span className="text-[10px] text-[#6e6e73]">Eksik/Hata</span>
            </div>
          </div>
        </div>

        {/* Category Cards */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Pre-Checkout Readiness */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-black/10 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#424245]">Pre-Checkout & Satış Hazırlığı</span>
                <span className="text-lg font-extrabold text-[#1d1d1f]">%{scores.preCheckout}</span>
              </div>
              <p className="text-xs text-[#6e6e73] mb-4">
                404 sayfası, teşekkür sayfası, sepet akışı ve sipariş tamamlama güvenliği.
              </p>
            </div>
            <div>
              <div className="w-full bg-black/[0.04] h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getScoreBadge(scores.preCheckout).barColor} transition-all duration-700`} 
                  style={{ width: `${scores.preCheckout}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Technical SEO */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-black/10 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#424245]">Teknik SEO & Zengin Veriler</span>
                <span className="text-lg font-extrabold text-[#1d1d1f]">%{scores.technicalSeo}</span>
              </div>
              <p className="text-xs text-[#6e6e73] mb-4">
                robots.txt, llms.txt, sitemap, meta etiketler, schema ve iç linkleme.
              </p>
            </div>
            <div>
              <div className="w-full bg-black/[0.04] h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getScoreBadge(scores.technicalSeo).barColor} transition-all duration-700`} 
                  style={{ width: `${scores.technicalSeo}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Legal & Trust */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-black/10 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#424245]">Yasal Mevzuat & Güven (Trust)</span>
                <span className="text-lg font-extrabold text-[#1d1d1f]">%{scores.legalTrust}</span>
              </div>
              <p className="text-xs text-[#6e6e73] mb-4">
                Mesafeli satış sözleşmesi, KVKK, iade politikası, açık adres & harita.
              </p>
            </div>
            <div>
              <div className="w-full bg-black/[0.04] h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getScoreBadge(scores.legalTrust).barColor} transition-all duration-700`} 
                  style={{ width: `${scores.legalTrust}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 4: Conversion & UX */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-black/10 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#424245]">Dönüşüm Oranı & UX</span>
                <span className="text-lg font-extrabold text-[#1d1d1f]">%{scores.conversionUx}</span>
              </div>
              <p className="text-xs text-[#6e6e73] mb-4">
                Üst CTA, sticky telefon/WhatsApp butonu, müşteri yorumları ve 5 adet SSS.
              </p>
            </div>
            <div>
              <div className="w-full bg-black/[0.04] h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getScoreBadge(scores.conversionUx).barColor} transition-all duration-700`} 
                  style={{ width: `${scores.conversionUx}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 5: Accessibility (WCAG) */}
          <div className="bg-white border border-black/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:border-black/10 transition-colors sm:col-span-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#424245] flex items-center gap-1.5">
                  <Accessibility className="w-3.5 h-3.5 text-[#0071e3]" />
                  Erişilebilirlik (WCAG 2.1 AA)
                </span>
                <span className="text-lg font-extrabold text-[#1d1d1f]">%{scores.accessibility}</span>
              </div>
              <p className="text-xs text-[#6e6e73] mb-4">
                Form etiketleri, klavye gezinmesi, landmark yapısı ve kurumsal/B2B uyumluluk kriterleri.
              </p>
            </div>
            <div>
              <div className="w-full bg-black/[0.04] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBadge(scores.accessibility).barColor} transition-all duration-700`}
                  style={{ width: `${scores.accessibility}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
