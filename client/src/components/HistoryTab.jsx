import React, { useEffect, useState } from 'react';
import { History, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle } from 'lucide-react';

export default function HistoryTab({ results }) {
  const [scans, setScans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!results?.url) return;
    setLoading(true);
    setError(null);
    fetch(`/api/history?url=${encodeURIComponent(results.url)}`)
      .then(res => res.json())
      .then(data => setScans(data.scans || []))
      .catch(() => setError('Geçmiş veriler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [results?.url]);

  if (loading) {
    return (
      <div className="bg-white border border-black/[0.06] rounded-2xl p-10 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#0071e3]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#d70015]/[0.06] border border-[#d70015]/20 rounded-xl p-4 flex items-center gap-3 text-[#d70015] text-xs">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!scans || scans.length < 2) {
    return (
      <div className="bg-white border border-black/[0.06] rounded-2xl p-10 text-center">
        <History className="w-8 h-8 text-[#86868b] mx-auto mb-3" />
        <h3 className="text-sm font-bold text-[#1d1d1f] mb-1">Henüz yeterli geçmiş yok</h3>
        <p className="text-xs text-[#6e6e73]">
          Bu domain için kayıtlı {scans?.length || 0} denetim var. Trend görmek için aynı siteyi zaman içinde tekrar taratın.
        </p>
      </div>
    );
  }

  const maxScore = 100;
  const chartWidth = 600;
  const chartHeight = 120;
  const padding = 10;
  const sorted = [...scans].reverse(); // oldest first for the chart

  const points = sorted.map((s, i) => {
    const x = padding + (i / Math.max(1, sorted.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((s.overall_score ?? 0) / maxScore) * (chartHeight - padding * 2);
    return { x, y, score: s.overall_score, date: s.scanned_at };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] mb-8">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center gap-2">
          <History className="w-5 h-5 text-[#0071e3]" />
          Denetim Geçmişi
        </h2>
        <p className="text-xs text-[#6e6e73]">
          {sorted.length} geçmiş denetim — genel skorun zaman içindeki değişimi.
        </p>
      </div>

      <div className="bg-[#f5f5f7] rounded-xl p-4 mb-6 overflow-x-auto">
        <svg width={chartWidth} height={chartHeight} className="min-w-full">
          <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#00000010" />
          <path d={pathD} fill="none" stroke="#0071e3" strokeWidth="2" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#0071e3" />
          ))}
        </svg>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[#6e6e73] border-b border-black/[0.06]">
              <th className="pb-2 pr-4 font-semibold">Tarih</th>
              <th className="pb-2 pr-4 font-semibold">Genel</th>
              <th className="pb-2 pr-4 font-semibold">Pre-Checkout</th>
              <th className="pb-2 pr-4 font-semibold">Teknik SEO</th>
              <th className="pb-2 pr-4 font-semibold">Yasal & Güven</th>
              <th className="pb-2 pr-4 font-semibold">Dönüşüm & UX</th>
              <th className="pb-2 pr-4 font-semibold">Erişilebilirlik</th>
              <th className="pb-2 font-semibold">Değişim</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((s, idx) => {
              const older = scans[idx + 1];
              const delta = older && s.overall_score !== null && older.overall_score !== null
                ? s.overall_score - older.overall_score
                : null;
              return (
                <tr key={s.id} className="border-b border-black/[0.04]">
                  <td className="py-2 pr-4 text-[#424245]">{new Date(s.scanned_at).toLocaleString('tr-TR')}</td>
                  <td className="py-2 pr-4 font-bold text-[#1d1d1f]">{s.overall_score ?? '—'}</td>
                  <td className="py-2 pr-4 text-[#6e6e73]">{s.precheckout_score ?? '—'}</td>
                  <td className="py-2 pr-4 text-[#6e6e73]">{s.technical_seo_score ?? '—'}</td>
                  <td className="py-2 pr-4 text-[#6e6e73]">{s.legal_trust_score ?? '—'}</td>
                  <td className="py-2 pr-4 text-[#6e6e73]">{s.conversion_ux_score ?? '—'}</td>
                  <td className="py-2 pr-4 text-[#6e6e73]">{s.accessibility_score ?? '—'}</td>
                  <td className="py-2">
                    {delta === null ? (
                      <span className="text-[#86868b]">—</span>
                    ) : (
                      <span className={`flex items-center gap-1 font-semibold ${delta > 0 ? 'text-[#1d9a4e]' : delta < 0 ? 'text-[#d70015]' : 'text-[#6e6e73]'}`}>
                        {delta > 0 ? <TrendingUp className="w-3 h-3" /> : delta < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
