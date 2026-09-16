import React, { createContext, useContext, useEffect, useState } from 'react';

const DEFAULT_BRAND = {
  companyName: 'PreCheckout Audit',
  reportTitle: 'Pre-Checkout & SEO Denetim Raporu',
  logoUrl: '',
  primaryColor: '#0071e3',
  footerText: 'Pre-Checkout & SEO Audit Suite v2.0 • E-Ticaret Kalite ve Hazırlık Standartları',
  contactInfo: ''
};

const BrandContext = createContext({
  brand: DEFAULT_BRAND,
  setBrand: () => {},
  saveBrand: async () => {},
  loading: true
});

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/brand-settings')
      .then(res => res.json())
      .then(data => setBrand({ ...DEFAULT_BRAND, ...data }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveBrand = async (updates) => {
    const res = await fetch('/api/brand-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    setBrand({ ...DEFAULT_BRAND, ...data });
    return data;
  };

  return (
    <BrandContext.Provider value={{ brand, setBrand, saveBrand, loading }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
