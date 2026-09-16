import React, { useState, useEffect } from 'react';
import { X, Palette, Upload, Check, Loader2 } from 'lucide-react';
import { useBrand } from '../context/BrandContext';

export default function BrandSettingsModal({ onClose }) {
  const { brand, saveBrand } = useBrand();
  const [form, setForm] = useState(brand);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(brand), [brand]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => handleChange('logoUrl', ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveBrand(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm no-print" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-[0_20px_60px_rgb(0,0,0,0.2)] w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.06] sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1d1d1f] flex items-center gap-2">
            <Palette className="w-4.5 h-4.5 text-[#0071e3]" />
            Marka Ayarları (White-Label)
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/[0.04] text-[#6e6e73]">
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-xs text-[#6e6e73] leading-relaxed">
            Burada girdiğiniz bilgiler panelde ve müşterilerinize gönderilen PDF raporlarında sizin danışmanlık firmanızın kimliğiyle görünür — "PreCheckout Audit" markası yerine.
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#424245] mb-1.5">Firma Adı</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              placeholder="Örn: Akme Dijital Danışmanlık"
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#424245] mb-1.5">Rapor Başlığı</label>
            <input
              type="text"
              value={form.reportTitle}
              onChange={(e) => handleChange('reportTitle', e.target.value)}
              placeholder="Örn: E-Ticaret Hazırlık Denetim Raporu"
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#424245] mb-1.5">Logo</label>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#f5f5f7] border border-black/10 flex items-center justify-center overflow-hidden shrink-0">
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-[10px] text-[#86868b]">Logo Yok</span>
                )}
              </div>
              <label className="flex-1 border-2 border-dashed border-black/10 hover:border-[#0071e3]/40 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer text-center transition-colors">
                <Upload className="w-4 h-4 text-[#6e6e73] mb-1" />
                <span className="text-xs text-[#424245] font-medium">Logo Yükle (PNG/SVG)</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#424245] mb-1.5">Marka Rengi</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="w-11 h-11 rounded-lg border border-black/10 cursor-pointer bg-transparent"
              />
              <input
                type="text"
                value={form.primaryColor}
                onChange={(e) => handleChange('primaryColor', e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] font-mono focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#424245] mb-1.5">İletişim Bilgisi (Rapor Altbilgisinde)</label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => handleChange('contactInfo', e.target.value)}
              placeholder="Örn: info@ajansiniz.com · +90 5xx xxx xx xx"
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#424245] mb-1.5">Rapor Alt Metni</label>
            <input
              type="text"
              value={form.footerText}
              onChange={(e) => handleChange('footerText', e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#f5f5f7] border border-black/10 rounded-xl text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-black/[0.06] sticky bottom-0 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-full text-xs font-semibold text-[#6e6e73] hover:bg-black/[0.04]">
            Kapat
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-semibold text-white transition-colors disabled:opacity-60"
            style={{ backgroundColor: saved ? '#1d9a4e' : form.primaryColor }}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{saving ? 'Kaydediliyor...' : saved ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
