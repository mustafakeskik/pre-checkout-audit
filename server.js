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
const { normalizeUrl, looksLikeBotChallenge, compareRenderedVsPlainFetch } = require('./services/urlUtils');
const historyStore = require('./services/historyStore');

const app = express();
const PORT = process.env.PORT || 3300;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static frontend serve
app.use(express.static(path.join(__dirname, 'client/dist')));

/**
 * Records a completed audit into history and attaches trend (vs. this domain's
 * previous scan) and sector-average comparison data to the result before it's
 * sent to the client. Centralized here so every audit entry point (URL scan,
 * HTML paste, compare tool) behaves identically.
 */
function enrichWithHistory(auditResult, sector) {
  const detectedSector = sector || historyStore.detectSector(
    `${auditResult.checklist?.meta_title?.details?.title || ''} ${auditResult.checklist?.meta_description?.details?.description || ''}`
  );

  const previous = historyStore.getPreviousScan(auditResult.url, auditResult.timestamp);
  historyStore.recordScan(auditResult, detectedSector);
  const sectorComparison = historyStore.getSectorAverage(detectedSector, auditResult.url);

  auditResult.sector = detectedSector;
  if (previous) {
    auditResult.trend = {
      previousScanAt: previous.scanned_at,
      previous: {
        overall: previous.overall_score,
        preCheckout: previous.precheckout_score,
        technicalSeo: previous.technical_seo_score,
        legalTrust: previous.legal_trust_score,
        conversionUx: previous.conversion_ux_score,
        accessibility: previous.accessibility_score
      },
      deltaOverall: auditResult.scores.overall !== null && previous.overall_score !== null
        ? auditResult.scores.overall - previous.overall_score
        : null
    };
  }
  auditResult.sectorComparison = sectorComparison;
  return auditResult;
}

// 1. Canlı URL Taraması Endpoint
app.post('/api/audit/url', async (req, res) => {
  try {
    const { url, useChrome, sector } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Lütfen bir web sitesi adresi (URL) girin.' });
    }

    let normalizedUrl;
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    let html = '';
    let additionalData = {};
    let screenshot = null;
    let finalUrl = normalizedUrl;
    let botProtectionWarning = null;

    if (useChrome && isChromeInstalled()) {
      // Run the headless-Chrome render AND a plain HTTP fetch in parallel — the plain
      // fetch is needed anyway for robots.txt/sitemap/etc, and doubling as a sanity
      // check lets us catch sites whose bot-protection serves Chrome a decoy page.
      const [chromeResult, crawlData] = await Promise.all([
        capturePageWithChrome(normalizedUrl),
        crawlSite(normalizedUrl).catch(() => null)
      ]);

      const comparison = crawlData
        ? compareRenderedVsPlainFetch(chromeResult.html, chromeResult.title, crawlData.html, crawlData.title)
        : { preferPlainFetch: false, warning: null };

      if (comparison.preferPlainFetch && crawlData) {
        // The Chrome-rendered page looks like a bot challenge/decoy; the plain fetch
        // looks like real content, so audit that instead of the fake page.
        html = crawlData.html;
        finalUrl = crawlData.finalUrl || normalizedUrl;
        additionalData.speedMetrics = crawlData.speedMetrics;
      } else {
        html = chromeResult.html;
        finalUrl = chromeResult.finalUrl || normalizedUrl;
        screenshot = chromeResult.screenshot;
        additionalData.speedMetrics = chromeResult.speedMetrics;
      }
      botProtectionWarning = comparison.warning;

      if (crawlData) {
        additionalData.robotsTxt = crawlData.robotsTxt;
        additionalData.sitemapXml = crawlData.sitemapXml;
        additionalData.llmsTxt = crawlData.llmsTxt;
        additionalData.status404 = crawlData.status404;
        additionalData.thankYou = crawlData.thankYou;
      }
    } else {
      // Standard fast crawler (no browser rendering available/requested)
      const crawlData = await crawlSite(normalizedUrl);
      html = crawlData.html;
      finalUrl = crawlData.finalUrl || normalizedUrl;
      additionalData = crawlData;

      const check = looksLikeBotChallenge(crawlData.html, crawlData.title);
      if (check.suspected) {
        botProtectionWarning = `Bu site otomatik istekleri engelliyor olabilir (${check.reasons.join(' ')}). Sonuçlar güvenilir olmayabilir — "Gerçek Chrome ile render et" seçeneğiyle tekrar deneyin veya siteyi tarayıcınızda manuel kontrol edin.`;
      }
    }

    const auditResult = runAudit(html, finalUrl, additionalData);
    if (screenshot) {
      auditResult.screenshot = screenshot;
    }
    if (botProtectionWarning) {
      auditResult.botProtectionWarning = botProtectionWarning;
    }
    enrichWithHistory(auditResult, sector);

    res.json(auditResult);
  } catch (err) {
    console.error('Audit URL Error:', err);
    res.status(500).json({ error: err.message || 'Site denetlenirken bir hata oluştu.' });
  }
});

// 2. Ham HTML Yapıştırma / Dosya Yükleme Endpoint
app.post('/api/audit/html', (req, res) => {
  try {
    const { html, url, sector } = req.body;
    if (!html || typeof html !== 'string' || html.trim().length === 0) {
      return res.status(400).json({ error: 'Lütfen geçerli bir HTML içeriği gönderin.' });
    }

    let normalizedUrl;
    try {
      normalizedUrl = normalizeUrl(url || 'https://siteniz.com');
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    const auditResult = runAudit(html, normalizedUrl);
    enrichWithHistory(auditResult, sector);
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
      const resolvedUrl = crawlData.finalUrl || crawlData.url;
      const auditResult = runAudit(crawlData.html, resolvedUrl, crawlData);
      enrichWithHistory(auditResult);
      return { url: resolvedUrl, isMain: t.isMain, ...auditResult };
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
    // Full detail (provider, model, quota numbers) stays server-side only — the client
    // gets a clean, user-facing message via toUserFacingError().
    console.error('AI Find Competitors Error:', err);
    res.status(err.status === 429 ? 429 : 500).json({ error: aiInsights.toUserFacingError(err) });
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
    res.status(err.status === 429 ? 429 : 500).json({ error: aiInsights.toUserFacingError(err) });
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
    enrichWithHistory(auditResult, req.body?.sector);
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

// 8. AI Kota Kullanım İstatistikleri (debug/izleme amaçlı — hangi özellik ne kadar
// Gemini çağrısı yapıyor ve kotayı ne sıklıkla tüketiyor görmek için)
app.get('/api/ai/usage-stats', (req, res) => {
  res.json(aiInsights.getUsageStats());
});

// 9. Domain Geçmişi (trend takibi için)
app.get('/api/history', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'url query parametresi gerekli.' });
  }
  const history = historyStore.getHistoryForDomain(url);
  res.json({ domain: historyStore.domainKey(url), scans: history });
});

// 10. Sektör Listesi (dropdown için)
app.get('/api/sectors', (req, res) => {
  res.json({ sectors: historyStore.SECTORS });
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
