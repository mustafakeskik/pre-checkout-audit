import React, { useState } from 'react';
import { Search, Share2, Smartphone, Monitor, AlertCircle, CheckCircle, Image, FileText, Code2, Globe } from 'lucide-react';
import { safeHostname } from '../utils/url';

export default function SeoAuditTab({ results }) {
  const [serpDevice, setSerpDevice] = useState('desktop'); // 'desktop' | 'mobile'

  if (!results) return null;

  const { checklist, seoDetails, url } = results;
  const metaTitle = checklist.meta_title?.details?.title || 'Sayfa Başlığı Belirtilmemiş';
  const metaDesc = checklist.meta_description?.details?.description || 'Meta açıklama tanımlanmamış. Arama motorları sayfadan rastgele bir metin seçecektir.';
  const domain = safeHostname(url);
  const displayUrl = url ? `${domain} › pre-checkout` : 'https://siteniz.com';

  const ogTitle = checklist.social_sharing?.details?.ogTitle || metaTitle;
  const ogDesc = checklist.social_sharing?.details?.ogDesc || metaDesc;
  const ogImage = checklist.social_sharing?.details?.ogImage;

  return (
    <div className="space-y-6 mb-8">
      {/* SERP & Social Previews Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Google SERP Preview */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-[#0071e3]" />
                <h3 className="font-bold text-[#1d1d1f] text-sm">Google SERP Arama Önizlemesi</h3>
              </div>
              <div className="flex items-center space-x-1 bg-[#f5f5f7] border border-black/[0.06] rounded-lg p-0.5">
                <button
                  onClick={() => setSerpDevice('desktop')}
                  className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
                    serpDevice === 'desktop' ? 'bg-black/[0.04] text-[#1d1d1f] font-semibold' : 'text-[#6e6e73]'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Masaüstü</span>
                </button>
                <button
                  onClick={() => setSerpDevice('mobile')}
                  className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${
                    serpDevice === 'mobile' ? 'bg-black/[0.04] text-[#1d1d1f] font-semibold' : 'text-[#6e6e73]'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobil</span>
                </button>
              </div>
            </div>

            {/* Google SERP Simulated Box */}
            <div className={`bg-white rounded-xl p-4 text-slate-800 font-sans shadow-inner ${serpDevice === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
              <div className="flex items-center space-x-2 text-xs text-[#86868b] mb-1">
                <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-700">
                  G
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-slate-900 leading-tight">{domain}</span>
                  <span className="text-[11px] text-[#86868b] truncate leading-tight">{displayUrl}</span>
                </div>
              </div>
              <h4 className="text-blue-800 hover:underline text-base font-medium cursor-pointer leading-snug my-1 line-clamp-2">
                {metaTitle}
              </h4>
              <p className="text-[#86868b] text-xs leading-relaxed line-clamp-2">
                {metaDesc}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/[0.06] flex justify-between text-xs text-[#6e6e73]">
            <span>Başlık: <strong className="text-[#1d1d1f]">{metaTitle.length} karakter</strong> (İdeal: 50-60)</span>
            <span>Açıklama: <strong className="text-[#1d1d1f]">{metaDesc.length} karakter</strong> (İdeal: 120-160)</span>
          </div>
        </div>

        {/* 2. Social Media Share Preview (OG / Twitter) */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Share2 className="w-5 h-5 text-[#0071e3]" />
                <h3 className="font-bold text-[#1d1d1f] text-sm">Sosyal Medya & WhatsApp Önizlemesi</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-[#0071e3]">
                Open Graph
              </span>
            </div>

            {/* Social Card */}
            <div className="bg-[#f5f5f7] border border-black/[0.06] rounded-xl overflow-hidden shadow-lg">
              {ogImage ? (
                <div className="w-full h-36 bg-white overflow-hidden relative">
                  <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-32 bg-black/[0.04] flex flex-col items-center justify-center text-[#86868b] text-xs">
                  <Image className="w-8 h-8 mb-1 opacity-50" />
                  <span>og:image Görseli Bulunamadı!</span>
                </div>
              )}
              <div className="p-3">
                <span className="text-[10px] uppercase font-semibold text-[#6e6e73] tracking-wider block">
                  {domain}
                </span>
                <h4 className="text-[#1d1d1f] font-bold text-xs line-clamp-1 mt-0.5">
                  {ogTitle}
                </h4>
                <p className="text-[#6e6e73] text-[11px] line-clamp-2 mt-1">
                  {ogDesc}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-black/[0.06] text-xs text-[#6e6e73]">
            {ogImage ? (
              <span className="text-[#1d9a4e] flex items-center space-x-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Paylaşım görseli hazır: {ogImage.substring(0, 45)}...</span>
              </span>
            ) : (
              <span className="text-[#d70015] flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>WhatsApp ve LinkedIn'de görsel çıkması için og:image eklenmelidir.</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Technical SEO Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* H1-H6 Heading Structure */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-4 h-4 text-[#0071e3]" />
            <h4 className="font-bold text-[#1d1d1f] text-xs uppercase tracking-wider">
              Başlık Hiyerarşisi (H1-H6)
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[#6e6e73]">H1 Başlık Sayısı:</span>
              <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                seoDetails.h1?.count === 1 
                  ? 'bg-[#1d9a4e]/10 text-[#1d9a4e]' 
                  : 'bg-[#d70015]/10 text-[#d70015]'
              }`}>
                {seoDetails.h1?.count || 0} Adet (İdeal: 1)
              </span>
            </div>

            {seoDetails.h1?.values?.length > 0 && (
              <div className="p-2 rounded bg-[#f5f5f7] text-[11px] text-[#424245] font-mono border border-black/[0.06]">
                "{seoDetails.h1.values[0]}"
              </div>
            )}

            <div className="flex items-center justify-between text-[#6e6e73] text-xs px-1">
              <span>H2 Başlıkları: <strong className="text-[#1d1d1f]">{seoDetails.headings?.h2Count || 0}</strong></span>
              <span>H3 Başlıkları: <strong className="text-[#1d1d1f]">{seoDetails.headings?.h3Count || 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Indexing & Canonical Status */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Globe className="w-4 h-4 text-[#1d9a4e]" />
            <h4 className="font-bold text-[#1d1d1f] text-xs uppercase tracking-wider">
              İndekslenme & Güvenlik
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[#6e6e73]">Canonical Tag:</span>
              <span className="font-mono text-[11px] text-[#0071e3] truncate max-w-[150px]">
                {seoDetails.canonical ? 'Tanımlı ✅' : 'Eksik ❌'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[#6e6e73]">Dil (Lang) Niteliği:</span>
              <span className="font-mono text-xs text-[#1d1d1f]">
                {seoDetails.htmlLang ? `lang="${seoDetails.htmlLang}"` : 'Eksik'}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-[#f5f5f7] border border-black/[0.06]">
              <span className="text-[#6e6e73]">Mobil Viewport:</span>
              <span className="text-xs text-[#1d9a4e] font-semibold">
                {seoDetails.viewport ? 'Uyumlu' : 'Eksik'}
              </span>
            </div>
          </div>
        </div>

        {/* Schema.org Rich Data */}
        <div className="bg-white border border-black/[0.06] rounded-2xl p-5">
          <div className="flex items-center space-x-2 mb-3">
            <Code2 className="w-4 h-4 text-[#8944ab]" />
            <h4 className="font-bold text-[#1d1d1f] text-xs uppercase tracking-wider">
              Schema.org Zengin Veriler
            </h4>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] text-[#6e6e73]">
              Tespit edilen yapılandırılmış veri şemaları:
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {checklist.google_rich_snippets?.details?.schemas?.length > 0 ? (
                checklist.google_rich_snippets.details.schemas.map((s, idx) => (
                  <span key={idx} className="bg-[#8944ab]/10 border border-[#8944ab]/20 text-[#8944ab] text-xs px-2.5 py-1 rounded-lg font-mono">
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#d70015] italic">
                  Hiçbir Schema.org (JSON-LD) bulunamadı!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
