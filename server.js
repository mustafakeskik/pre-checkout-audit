require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { runAudit } = require('./services/auditEngine');
const { crawlSite } = require('./services/crawler');
const { 
  isChromeInstalled, 
  capturePageWithChrome, 
  launchInteractiveSession, 
  captureCurrentInteractivePage 
} = require('./services/chromeManager');
const codeGenerators = require('./services/codeGenerators');
const { getBrandSettings, saveBrandSettings } = require('./services/brandSettings');
const aiInsights = require('./services/aiInsights');

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static frontend serve
app.use(express.static(path.join(__dirname, 'client/dist')));

// 1. Canlı URL Taraması Endpoint
app.post('/api/audit/url', async (req, res) => {
  try {
    const { url, useChrome } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Lütfen bir web sitesi adresi (URL) girin.' });
    }

    let html = '';
    let additionalData = {};
    let screenshot = null;

    if (useChrome && isChromeInstalled()) {
      // Use Mac's Google Chrome directly
      const chromeResult = await capturePageWithChrome(url);
      html = chromeResult.html;
      screenshot = chromeResult.screenshot;
      additionalData.speedMetrics = chromeResult.speedMetrics;

      // Still check robots.txt and sitemap.xml via crawler helpers
      try {
        const crawlData = await crawlSite(url);
        additionalData.robotsTxt = crawlData.robotsTxt;
        additionalData.sitemapXml = crawlData.sitemapXml;
        additionalData.llmsTxt = crawlData.llmsTxt;
        additionalData.status404 = crawlData.status404;
        additionalData.thankYou = crawlData.thankYou;
      } catch (e) {}
    } else {
      // Standard fast crawler
      const crawlData = await crawlSite(url);
      html = crawlData.html;
      additionalData = crawlData;
    }

    const auditResult = runAudit(html, url, additionalData);
    if (screenshot) {
      auditResult.screenshot = screenshot;
    }

    res.json(auditResult);
  } catch (err) {
    console.error('Audit URL Error:', err);
    res.status(500).json({ error: err.message || 'Site denetlenirken bir hata oluştu.' });
  }
});

// 2. Ham HTML Yapıştırma / Dosya Yükleme Endpoint
app.post('/api/audit/html', (req, res) => {
  try {
    const { html, url = 'https://siteniz.com' } = req.body;
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      return res.status(400).json({ error: 'Lütfen geçerli bir HTML içeriği gönderin.' });
    }

    const auditResult = runAudit(html, url);
    res.json(auditResult);
  } catch (err) {
    console.error('Audit HTML Error:', err);
    res.status(500).json({ error: err.message || 'HTML denetlenirken hata oluştu.' });
  }
});

// 2b. Rakip Karşılaştırma: Ana site + 1-3 rakip URL'i paralel tara ve denetle
app.post('/api/audit/compare', async (req, res) => {
  try {
    const { mainUrl, competitorUrls } = req.body;
    if (!mainUrl || !Array.isArray(competitorUrls) || competitorUrls.length === 0) {
      return res.status(400).json({ error: 'Ana site ve en az bir rakip URL girmelisiniz.' });
    }

    const targets = [
      { url: mainUrl, isMain: true },
      ...competitorUrls.filter(u => u && u.trim()).slice(0, 3).map(u => ({ url: u.trim(), isMain: false }))
    ];

    const settled = await Promise.allSettled(targets.map(async (t) => {
      const crawlData = await crawlSite(t.url);
      const auditResult = runAudit(crawlData.html, t.url, crawlData);
      return { url: t.url, isMain: t.isMain, ...auditResult };
    }));

    const sites = settled.map((r, idx) => {
      if (r.status === 'fulfilled') return r.value;
      return { url: targets[idx].url, isMain: targets[idx].isMain, error: r.reason?.message || 'Site taranamadı.' };
    });

    res.json({ sites });
  } catch (err) {
    console.error('Compare Error:', err);
    res.status(500).json({ error: err.message || 'Karşılaştırma sırasında hata oluştu.' });
  }
});

// 2c. AI ile Rakip Bulma (Gemini + Google Search grounding)
app.post('/api/ai/find-competitors', async (req, res) => {
  try {
    const { siteInfo } = req.body;
    if (!siteInfo || !siteInfo.url) {
      return res.status(400).json({ error: 'Rakip bulmak için ana site bilgisi (siteInfo) gerekli.' });
    }
    const result = await aiInsights.findCompetitors(siteInfo);
    res.json(result);
  } catch (err) {
    console.error('AI Find Competitors Error:', err);
    res.status(500).json({ error: err.message || 'Rakip bulma sırasında hata oluştu.' });
  }
});

// 2d. AI Çözüm Raporu (rakiplerden geride kaldığımız alanlara odaklı aksiyon planı)
app.post('/api/ai/solution-report', async (req, res) => {
  try {
    const { mainSite, competitors } = req.body;
    if (!mainSite || !mainSite.scores) {
      return res.status(400).json({ error: 'Çözüm raporu için ana site denetim sonucu gerekli.' });
    }
    const result = await aiInsights.generateSolutionReport(mainSite, competitors || []);
    res.json(result);
  } catch (err) {
    console.error('AI Solution Report Error:', err);
    res.status(500).json({ error: err.message || 'Çözüm raporu oluşturulurken hata oluştu.' });
  }
});

// 3. Chrome Canlı Oturum Başlat (Kullanıcı e-ticaret paneline login olsun)
app.post('/api/chrome/launch', async (req, res) => {
  try {
    const { startUrl } = req.body;
    const result = await launchInteractiveSession(startUrl || 'https://google.com');
    res.json(result);
  } catch (err) {
    console.error('Chrome Launch Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Chrome'da Açık Olan Sayfayı Canlı Yakala ve Analiz Et
app.post('/api/chrome/capture', async (req, res) => {
  try {
    const pageData = await captureCurrentInteractivePage();
    const auditResult = runAudit(pageData.html, pageData.url);
    auditResult.screenshot = pageData.screenshot;
    auditResult.interactive = true;
    res.json(auditResult);
  } catch (err) {
    console.error('Chrome Capture Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 5. Kod & Şablon Üretici
app.post('/api/generate-fix', (req, res) => {
  try {
    const { type, siteInfo, platform, issues, checkoutDetails } = req.body;
    let snippet = '';

    switch (type) {
      case 'llms_txt':
        snippet = codeGenerators.generateLlmsTxt(siteInfo);
        break;
      case 'robots_txt':
        snippet = codeGenerators.generateRobotsTxt(siteInfo);
        break;
      case 'faq_5':
        snippet = codeGenerators.generateFaqSchema(siteInfo);
        break;
      case 'breadcrumbs':
        snippet = codeGenerators.generateBreadcrumbSnippet(siteInfo);
        break;
      case 'social_sharing':
        snippet = codeGenerators.generateSocialMeta(siteInfo);
        break;
      case 'sticky_phone_cta':
        snippet = codeGenerators.generateStickyPhoneHtml();
        break;
      case 'legal_privacy_pages':
        snippet = codeGenerators.generateLegalTemplates(siteInfo);
        break;
      case 'page_404':
        snippet = codeGenerators.generate404Page(siteInfo, platform);
        break;
      case 'top_cta':
        snippet = codeGenerators.generateTopCtaBanner(siteInfo, platform);
        break;
      case 'internal_linking':
        snippet = codeGenerators.generateInternalLinkingGuide(siteInfo);
        break;
      case 'thank_you_page':
        snippet = codeGenerators.generateThankYouPageSnippet(siteInfo, platform);
        break;
      case 'case_studies':
        snippet = codeGenerators.generateCaseStudyBlock(siteInfo);
        break;
      case 'page_speed':
        snippet = codeGenerators.generatePageSpeedGuide(siteInfo);
        break;
      case 'meta_title':
        snippet = codeGenerators.generateMetaTitleGuide(siteInfo);
        break;
      case 'meta_description':
        snippet = codeGenerators.generateMetaDescriptionGuide(siteInfo);
        break;
      case 'fast_auth_buttons':
        snippet = codeGenerators.generateFastAuthButtons();
        break;
      case 'google_map_address':
        snippet = codeGenerators.generateGoogleMapEmbed(siteInfo);
        break;
      case 'customer_reviews':
        snippet = codeGenerators.generateReviewsWidget(siteInfo);
        break;
      case 'image_alt_tags':
        snippet = codeGenerators.generateImageAltGuide();
        break;
      case 'google_rich_snippets':
        snippet = codeGenerators.generateProductRichSnippet(siteInfo);
        break;
      case 'google_search_console':
        snippet = codeGenerators.generateSearchConsoleGuide(siteInfo, platform);
        break;
      case 'sitemap_xml':
        snippet = codeGenerators.generateSitemapGuide(siteInfo, platform);
        break;
      case 'accessibility_wcag':
        snippet = codeGenerators.generateAccessibilityGuide(siteInfo, issues || []);
        break;
      case 'checkout_funnel':
        snippet = codeGenerators.generateCheckoutFunnelGuide(siteInfo, checkoutDetails || {});
        break;
      case 'cart_flow':
        snippet = codeGenerators.generateCartFlowGuide();
        break;
      case 'checkout_security':
        snippet = codeGenerators.generateCheckoutSecurityGuide(siteInfo);
        break;
      default:
        return res.status(400).json({ error: 'Geçersiz kod üretici tipi.' });
    }

    res.json({ type, snippet });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. White-Label Marka Ayarları (Danışmanlık firmasının kendi kimliği)
app.get('/api/brand-settings', (req, res) => {
  res.json(getBrandSettings());
});

app.put('/api/brand-settings', (req, res) => {
  try {
    const updated = saveBrandSettings(req.body || {});
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Marka ayarları kaydedilemedi.' });
  }
});

// 6. Sistem Sağlık & Chrome Durum Kontrolü
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    chromeInstalled: isChromeInstalled(),
    uptime: process.uptime()
  });
});

// Fallback SPA
app.use((req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.send(`
        <html>
          <body style="font-family:sans-serif; text-align:center; padding:50px;">
            <h2>Pre-Checkout & SEO Audit Suite API Çalışıyor 🚀</h2>
            <p>Frontend henüz derlenmedi veya API modunda çalışıyor.</p>
            <p>Port: ${PORT}</p>
          </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Pre-Checkout & SEO Audit Server running on http://localhost:${PORT}`);
});
