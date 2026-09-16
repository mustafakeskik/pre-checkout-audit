import React, { useState } from 'react';
import { Swords, Plus, X, Loader2, Trophy, Globe, AlertCircle, Sparkles, FileText, Info, Download, ShieldCheck } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

const CATEGORY_META = [
  { key: 'overall', label: 'Genel Skor' },
  { key: 'preCheckout', label: 'Pre-Checkout' },
  { key: 'technicalSeo', label: 'Teknik SEO' },
  { key: 'legalTrust', label: 'Yasal & Güven' },
  { key: 'conversionUx', label: 'Dönüşüm & UX' },
  { key: 'accessibility', label: 'Erişilebilirlik' },
];

// Tiny markdown -> JSX renderer (no external dependency): supports #/##/### headers,
// **bold**, and "- " bullet lists, which is all the AI report prompt is asked to produce.
function renderMarkdown(md) {
  const lines = (md || '').split('\n');
  const blocks = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="list-disc pl-5 space-y-1 my-2">
          {listBuffer.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
        </ul>
      );
      listBuffer = [];
    }
  };

  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-[#1d1d1f]">{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); return; }

    if (trimmed.startsWith('### ')) {
      flushList();
      blocks.push(<h4 key={idx} className="text-sm font-bold text-[#1d1d1f] mt-4 mb-1">{renderInline(trimmed.slice(4))}</h4>);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push(<h3 key={idx} className="text-base font-bold text-[#1d1d1f] mt-5 mb-2">{renderInline(trimmed.slice(3))}</h3>);
    } else if (trimmed.startsWith('# ')) {
      flushList();
      blocks.push(<h2 key={idx} className="text-lg font-bold text-[#1d1d1f] mt-2 mb-2">{renderInline(trimmed.slice(2))}</h2>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listBuffer.push(trimmed.slice(2));
    } else if (trimmed === '---') {
      flushList();
      blocks.push(<hr key={idx} className="my-4 border-black/[0.06]" />);
    } else {
      flushList();
      blocks.push(<p key={idx} className="text-sm text-[#424245] leading-relaxed my-1.5">{renderInline(trimmed)}</p>);
    }
  });
  flushList();
  return blocks;
}

export default function CompetitorCompare({ mainResults }) {
  const { brand } = useBrand();
  const mainSiteUrl = mainResults?.url || '';
  const [mainUrl, setMainUrl] = useState(mainSiteUrl);
  const [competitorUrls, setCompetitorUrls] = useState(['', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sites, setSites] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiWarning, setAiWarning] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [report, setReport] = useState(null);

  const updateCompetitor = (idx, value) => {
    const next = [...competitorUrls];
    next[idx] = value;
    setCompetitorUrls(next);
  };

  const addCompetitorField = () => {
    if (competitorUrls.length < 3) setCompetitorUrls([...competitorUrls, '']);
  };

  const removeCompetitorField = (idx) => {
    setCompetitorUrls(competitorUrls.filter((_, i) => i !== idx));
  };

  const handleFindCompetitorsAI = async () => {
    if (!mainUrl.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiWarning(null);
    setAiSuggestions(null);
    try {
      const siteInfo = {
        title: mainResults?.checklist?.meta_title?.details?.title || '',
        description: mainResults?.checklist?.meta_description?.details?.description || '',
        url: mainUrl.trim()
      };
      const res = await fetch('/api/ai/find-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteInfo })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rakip bulma başarısız oldu.');
      setAiSuggestions(data.competitors || []);
      if (data.warning) setAiWarning(data.warning);
      const urls = (data.competitors || []).map(c => c.url).slice(0, 3);
      if (urls.length > 0) {
        setCompetitorUrls(urls.length < 2 ? [...urls, ''] : urls);
      }
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCompare = async (e) => {
    e.preventDefault();
    const validCompetitors = competitorUrls.map(u => u.trim()).filter(Boolean);
    if (!mainUrl.trim() || validCompetitors.length === 0) return;

    setLoading(true);
    setError(null);
    setSites(null);
    setReport(null);
    try {
      const res = await fetch('/api/audit/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainUrl: mainUrl.trim(), competitorUrls: validCompetitors })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Karşılaştırma başarısız oldu.');
      setSites(data.sites);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSolutionReport = async () => {
    const main = validSites.find(s => s.isMain);
    const others = validSites.filter(s => !s.isMain);
    if (!main) return;

    setReportLoading(true);
    setReportError(null);
    setReport(null);
    try {
      const res = await fetch('/api/ai/solution-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mainSite: main, competitors: others })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Çözüm raporu oluşturulamadı.');
      setReport(data.report);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!report) return;
    window.print();
  };

  const getWinnerIndex = (key, validSitesArr) => {
    let best = -1;
    let bestScore = -1;
    validSitesArr.forEach((s, idx) => {
      const score = s.scores?.[key] ?? -1;
      if (score > bestScore) {
        bestScore = score;
        best = idx;
      }
    });
    return best;
  };

  const validSites = (sites || []).filter(s => !s.error);
  const domainOf = (url) => { try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname; } catch { return url; } };

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] mb-8">
      <div className="mb-6 no-print">
        <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center space-x-2">
          <Swords className="w-5 h-5 text-[#0071e3]" />
          <span>Rakip Karşılaştırma</span>
        </h2>
        <p className="text-xs text-[#6e6e73]">
          Sizi 2-3 rakip ile yan yana kıyaslayın — müşteriye "rakibiniz burada, siz buradasınız" demenin en ikna edici yolu.
        </p>
      </div>

      <form onSubmit={handleCompare} className="space-y-3 mb-6 no-print">
        <div>
          <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5">Sizin Siteniz</label>
          <input
            type="text"
            value={mainUrl}
            onChange={(e) => setMainUrl(e.target.value)}
            placeholder="https://sizinsiteniz.com"
            disabled={loading}
            className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#6e6e73]">Rakip Site(ler)</label>
            <button
              type="button"
              onClick={handleFindCompetitorsAI}
              disabled={aiLoading || !mainUrl.trim()}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#0071e3] hover:text-[#0077ed] disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{aiLoading ? 'AI Rakip Arıyor...' : 'AI ile Rakip Bul'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {competitorUrls.map((val, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => updateCompetitor(idx, e.target.value)}
                  placeholder={`https://rakip${idx + 1}.com`}
                  disabled={loading}
                  className="flex-1 px-3.5 py-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
                />
                {competitorUrls.length > 1 && (
                  <button type="button" onClick={() => removeCompetitorField(idx)} className="px-3 rounded-xl bg-black/[0.04] hover:bg-black/[0.06] text-[#6e6e73]">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {competitorUrls.length < 3 && (
            <button type="button" onClick={addCompetitorField} className="mt-2 flex items-center gap-1 text-xs font-semibold text-[#0071e3] hover:text-[#0077ed]">
              <Plus className="w-3.5 h-3.5" />
              <span>Bir Rakip Daha Ekle</span>
            </button>
          )}

          {aiError && (
            <div className="mt-2 text-xs text-[#d70015] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{aiError}</span>
            </div>
          )}
          {aiWarning && !aiError && (
            <div className="mt-2 bg-[#c77700]/[0.06] border border-[#c77700]/20 rounded-lg p-2.5 text-[11px] text-[#c77700] flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{aiWarning}</span>
            </div>
          )}
          {aiSuggestions && aiSuggestions.length > 0 && (
            <div className="mt-2 space-y-1">
              {aiSuggestions.map((c, i) => (
                <div key={i} className="text-[11px] text-[#6e6e73]">
                  <strong className="text-[#1d1d1f]">{c.name}</strong> — {c.reason}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || !mainUrl.trim()}
            className="flex items-center space-x-2 px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-full text-sm shadow-lg shadow-[#0071e3]/10 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Karşılaştırılıyor...</span>
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                <span>Karşılaştır</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 bg-[#d70015]/[0.06] border border-[#d70015]/20 rounded-xl p-4 flex items-center space-x-3 text-[#d70015] text-xs no-print">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {sites && (
        <div className="space-y-6">
          {sites.some(s => s.error) && (
            <div className="bg-[#c77700]/[0.06] border border-[#c77700]/20 rounded-xl p-3 text-xs text-[#c77700] no-print">
              {sites.filter(s => s.error).map((s, i) => (
                <div key={i}>⚠ {domainOf(s.url)}: {s.error}</div>
              ))}
            </div>
          )}

          {validSites.length > 0 && (
            <div className="overflow-x-auto no-print">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-[#6e6e73] pb-3 pr-4">Kriter</th>
                    {validSites.map((s, idx) => (
                      <th key={idx} className="text-center pb-3 px-3 min-w-[130px]">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          s.isMain ? 'bg-[#0071e3]/10 text-[#0071e3]' : 'bg-black/[0.04] text-[#424245]'
                        }`}>
                          <Globe className="w-3 h-3" />
                          {domainOf(s.url)}
                          {s.isMain && <span className="ml-1 text-[9px] uppercase font-bold">Siz</span>}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORY_META.map(cat => {
                    const winnerIdx = getWinnerIndex(cat.key, validSites);
                    return (
                      <tr key={cat.key} className="border-t border-black/[0.06]">
                        <td className="py-3 pr-4 text-xs font-semibold text-[#424245] whitespace-nowrap">{cat.label}</td>
                        {validSites.map((s, idx) => {
                          const score = s.scores?.[cat.key] ?? 0;
                          const isWinner = idx === winnerIdx;
                          return (
                            <td key={idx} className="py-3 px-3">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex items-center gap-1">
                                  <span className={`text-lg font-extrabold ${isWinner ? 'text-[#1d9a4e]' : 'text-[#1d1d1f]'}`}>
                                    {score}
                                  </span>
                                  {isWinner && <Trophy className="w-3.5 h-3.5 text-[#1d9a4e]" />}
                                </div>
                                <div className="w-full max-w-[100px] bg-black/[0.06] h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-700 ${isWinner ? 'bg-[#1d9a4e]' : 'bg-[#0071e3]/60'}`}
                                    style={{ width: `${score}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {validSites.length > 1 && (
            <div className="bg-[#f5f5f7] border border-black/[0.06] rounded-xl p-4 text-xs text-[#424245] leading-relaxed no-print">
              <strong className="text-[#1d1d1f]">Özet:</strong>{' '}
              {(() => {
                const mainSite = validSites.find(s => s.isMain);
                if (!mainSite) return 'Karşılaştırma tamamlandı.';
                const others = validSites.filter(s => !s.isMain);
                const winning = others.filter(o => mainSite.scores.overall > o.scores.overall);
                const losing = others.filter(o => mainSite.scores.overall < o.scores.overall);
                let msg = `${domainOf(mainSite.url)} genel skoru %${mainSite.scores.overall}. `;
                if (winning.length > 0) msg += `${winning.map(w => domainOf(w.url)).join(', ')} sitesinden daha iyi durumdasınız. `;
                if (losing.length > 0) msg += `${losing.map(w => domainOf(w.url)).join(', ')} sitesi sizden önde — özellikle en düşük skorlu kriterlere odaklanın.`;
                if (winning.length > 0 && losing.length === 0) msg += 'Tüm rakiplerinizden öndesiniz 🎉';
                return msg;
              })()}
            </div>
          )}

          {validSites.length > 1 && validSites.some(s => s.isMain) && (
            <div className="border-t border-black/[0.06] pt-6 no-print">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1d1d1f] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#0071e3]" />
                    AI Çözüm Raporu
                  </h3>
                  <p className="text-xs text-[#6e6e73]">
                    Rakiplerden geride kaldığınız alanlara odaklanan, önceliklendirilmiş ayrı bir aksiyon raporu.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report && !reportLoading && (
                    <button
                      onClick={handleDownloadPdf}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black/[0.04] hover:bg-black/[0.06] text-[#1d1d1f] rounded-full text-xs font-semibold border border-black/10 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF Olarak İndir</span>
                    </button>
                  )}
                  <button
                    onClick={handleGenerateSolutionReport}
                    disabled={reportLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1d1d1f] hover:bg-black text-white rounded-full text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    {reportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>{reportLoading ? 'Rapor Hazırlanıyor...' : report ? 'Yeniden Oluştur' : 'Çözüm Raporu Oluştur'}</span>
                  </button>
                </div>
              </div>

              {report && (
                <div className="bg-[#0071e3]/[0.06] border border-[#0071e3]/20 rounded-xl p-3 mb-4 text-xs text-[#0071e3] flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>
                    <strong>İpucu:</strong> "PDF Olarak İndir" butonuna bastığınızda açılan yazdırma penceresinde <em>Hedef: "PDF Olarak Kaydet"</em> seçerek raporu bilgisayarınıza indirebilirsiniz.
                  </span>
                </div>
              )}

              {reportError && (
                <div className="bg-[#d70015]/[0.06] border border-[#d70015]/20 rounded-xl p-4 flex items-center space-x-3 text-[#d70015] text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{reportError}</span>
                </div>
              )}

              {report && (
                <div className="bg-[#f5f5f7] border border-black/[0.06] rounded-2xl p-6 mt-2">
                  {renderMarkdown(report)}
                </div>
              )}
            </div>
          )}

          {/* Print-only branded version of the report — hidden on screen, shown only in the PDF/print output */}
          {report && (
            <div id="printable-report" className="hidden print:block bg-white text-slate-900 font-sans">
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-6 mb-8">
                <div className="flex items-center space-x-2">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.companyName} className="w-8 h-8 object-contain" />
                  ) : (
                    <ShieldCheck className="w-8 h-8" style={{ color: brand.primaryColor }} />
                  )}
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">AI Çözüm Raporu</h1>
                    <span className="text-[11px] font-semibold text-slate-500">{brand.companyName}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>Hedef: <strong style={{ color: brand.primaryColor }}>{mainUrl}</strong></div>
                  <div>Tarih: {new Date().toLocaleDateString('tr-TR')}</div>
                </div>
              </div>

              {renderMarkdown(report)}

              <div className="mt-12 pt-6 border-t border-slate-200 text-center text-[11px] text-slate-400 report-footer">
                {brand.footerText}
                {brand.contactInfo && <span> • {brand.contactInfo}</span>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
