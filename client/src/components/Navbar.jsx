import React, { useState } from 'react';
import { ShieldCheck, Chrome, RefreshCw, Settings } from 'lucide-react';
import { useBrand } from '../context/BrandContext';
import BrandSettingsModal from './BrandSettingsModal';

export default function Navbar({ onReset, isChromeReady }) {
  const { brand } = useBrand();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <header className="border-b border-black/[0.06] bg-white/70 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={onReset}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 overflow-hidden"
            style={{ backgroundColor: brand.logoUrl ? 'transparent' : brand.primaryColor || '#1d1d1f' }}
          >
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={brand.companyName} className="w-full h-full object-contain" />
            ) : (
              <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-[15px] tracking-tight text-[#1d1d1f]">
                {brand.companyName}
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-[#86868b] border border-black/10 px-1.5 py-0.5 rounded-full">
                Panel
              </span>
            </div>
            <p className="text-[11px] text-[#86868b] hidden sm:block">
              Pre-Launch & SEO E-Ticaret Denetim Platformu
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-black/[0.03] text-xs">
            <Chrome className={`w-3.5 h-3.5 ${isChromeReady ? 'text-[#1d9a4e]' : 'text-[#c77700]'}`} />
            <span className={`font-medium ${isChromeReady ? 'text-[#1d9a4e]' : 'text-[#c77700]'}`}>
              {isChromeReady ? 'Chrome Bağlı' : 'Chrome Kontrol Ediliyor'}
            </span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            title="Marka Ayarları"
            className="p-2 rounded-full hover:bg-black/[0.04] text-[#6e6e73] transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-white text-xs font-medium transition-colors"
            style={{ backgroundColor: brand.primaryColor || '#0071e3' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Yeni Denetim</span>
          </button>
        </div>
      </div>

      {settingsOpen && <BrandSettingsModal onClose={() => setSettingsOpen(false)} />}
    </header>
  );
}
