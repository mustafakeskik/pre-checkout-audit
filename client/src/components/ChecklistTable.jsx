import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, 
  Wrench, Search, Filter, Sparkles, ExternalLink 
} from 'lucide-react';

export default function ChecklistTable({ checklist, onSelectFixItem }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'failed' | 'warning' | 'passed' | 'category'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  if (!checklist) return null;

  const items = Object.values(checklist);

  const filteredItems = items.filter(item => {
    // Status filter
    if (filter === 'failed' && item.status !== 'failed') return false;
    if (filter === 'warning' && item.status !== 'warning') return false;
    if (filter === 'passed' && item.status !== 'passed') return false;

    // Category filter
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchMsg = item.message.toLowerCase().includes(q);
      if (!matchName && !matchMsg) return false;
    }

    return true;
  });

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'passed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#1d9a4e]/[0.06] text-[#1d9a4e] border border-[#1d9a4e]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Başarılı</span>
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#c77700]/[0.06] text-[#c77700] border border-[#c77700]/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Uyarı</span>
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#d70015]/[0.06] text-[#d70015] border border-[#d70015]/20">
            <XCircle className="w-3.5 h-3.5" />
            <span>Eksik / Hatalı</span>
          </span>
        );
    }
  };

  const getCategoryName = (cat) => {
    switch (cat) {
      case 'preCheckout': return 'Pre-Checkout';
      case 'technicalSeo': return 'Teknik SEO';
      case 'legalTrust': return 'Yasal & Güven';
      case 'conversionUx': return 'Dönüşüm & UX';
      case 'accessibility': return 'Erişilebilirlik (WCAG)';
      default: return cat;
    }
  };

  return (
    <div className="bg-white border border-black/[0.06] rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.05)] mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#1d1d1f] flex items-center space-x-2">
            <span>Pre-Checkout & SEO Kontrol Listesi</span>
            <span className="text-xs bg-black/[0.04] text-[#6e6e73] px-2 py-0.5 rounded-full font-mono">
              {filteredItems.length}/{items.length} Madde
            </span>
          </h2>
          <p className="text-xs text-[#6e6e73]">
            Siteyi yayına almadan önce kontrol edilmesi gereken 22 kritik kriterin detaylı durumu.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Kriterlerde ara (örn: 404, llms)..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#f5f5f7] border border-black/[0.06] rounded-xl text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-1 focus:ring-[#0071e3]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-black/[0.06] pb-4 text-xs">
        <span className="text-[#86868b] font-medium mr-1">Durum:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filter === 'all' ? 'bg-black/[0.06] text-[#1d1d1f]' : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
          }`}
        >
          Tümü ({items.length})
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filter === 'failed' ? 'bg-[#d70015]/10 text-[#d70015] border border-[#d70015]/25' : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
          }`}
        >
          Eksikler / Hatalar ({items.filter(i => i.status === 'failed').length})
        </button>
        <button
          onClick={() => setFilter('warning')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filter === 'warning' ? 'bg-[#c77700]/10 text-[#c77700] border border-[#c77700]/25' : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
          }`}
        >
          Uyarılar ({items.filter(i => i.status === 'warning').length})
        </button>
        <button
          onClick={() => setFilter('passed')}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            filter === 'passed' ? 'bg-[#1d9a4e]/10 text-[#1d9a4e] border border-[#1d9a4e]/25' : 'text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.04]'
          }`}
        >
          Başarılılar ({items.filter(i => i.status === 'passed').length})
        </button>

        <div className="h-4 w-px bg-black/[0.04] mx-2 hidden sm:block" />

        <span className="text-[#86868b] font-medium mr-1">Kategori:</span>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-[#f5f5f7] border border-black/[0.06] rounded-lg px-2.5 py-1 text-[#424245] text-xs focus:ring-1 focus:ring-[#0071e3]"
        >
          <option value="all">Tüm Kategoriler</option>
          <option value="preCheckout">Pre-Checkout</option>
          <option value="technicalSeo">Teknik SEO</option>
          <option value="legalTrust">Yasal & Güven</option>
          <option value="conversionUx">Dönüşüm & UX</option>
          <option value="accessibility">Erişilebilirlik (WCAG)</option>
        </select>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item, index) => {
          const isExpanded = expandedId === item.id;
          return (
            <div
              key={item.id}
              className={`border rounded-xl transition-all ${
                item.status === 'failed'
                  ? 'border-[#d70015]/20 bg-[#d70015]/[0.03] hover:border-[#d70015]/35'
                  : item.status === 'warning'
                  ? 'border-[#c77700]/20 bg-[#c77700]/[0.03] hover:border-[#c77700]/35'
                  : 'border-black/[0.06] bg-[#f5f5f7]/40 hover:border-black/10'
              }`}
            >
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-4 flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center space-x-3 min-w-0 pr-2">
                  <span className="text-xs font-mono font-bold text-[#86868b] w-6">
                    #{index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="font-bold text-sm text-[#1d1d1f] truncate">
                        {item.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-black/[0.04] text-[#6e6e73]">
                        {getCategoryName(item.category)}
                      </span>
                    </div>
                    <p className="text-xs text-[#6e6e73] mt-1 line-clamp-1">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {getStatusBadge(item.status)}
                  <div className="text-[#6e6e73]">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Accordion Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-black/[0.06] bg-white space-y-3 rounded-b-xl text-xs">
                  <div>
                    <span className="font-semibold text-[#424245] block mb-1">Tespit & Değerlendirme:</span>
                    <p className="text-[#424245] leading-relaxed bg-[#f5f5f7] p-2.5 rounded-lg border border-black/[0.06]">
                      {item.message}
                    </p>
                  </div>

                  {item.recommendation && (
                    <div className="bg-[#0071e3]/[0.05] border border-[#0071e3]/20 rounded-lg p-3">
                      <span className="font-bold text-[#0071e3] block mb-1">
                        💡 Nasıl Düzeltilir / Öneri:
                      </span>
                      <p className="text-[#424245] leading-relaxed">
                        {item.recommendation}
                      </p>
                    </div>
                  )}

                  {/* Fix / Action Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFixItem(item.id);
                      }}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-lg font-semibold text-xs transition-colors shadow-sm"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Hazır Çözüm / Kod Üret</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-[#86868b] text-sm">
            Seçilen filtre kriterine uygun kontrol maddesi bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
