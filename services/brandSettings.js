const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '..', 'brand-settings.json');

const DEFAULT_SETTINGS = {
  companyName: 'PreCheckout Audit',
  reportTitle: 'Pre-Checkout & SEO Denetim Raporu',
  logoUrl: '',
  primaryColor: '#0071e3',
  footerText: 'Pre-Checkout & SEO Audit Suite v2.0 • E-Ticaret Kalite ve Hazırlık Standartları',
  contactInfo: ''
};

function getBrandSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Marka ayarları okunamadı:', e.message);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveBrandSettings(newSettings) {
  const merged = { ...DEFAULT_SETTINGS, ...getBrandSettings(), ...newSettings };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

module.exports = {
  getBrandSettings,
  saveBrandSettings,
  DEFAULT_SETTINGS
};
