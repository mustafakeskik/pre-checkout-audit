const puppeteer = require('puppeteer-core');
const fs = require('fs');
const lighthouse = require('lighthouse').default;
const { normalizeUrl } = require('./urlUtils');

/**
 * Chrome Browser Integration Manager
 * Connects directly to Google Chrome installed on macOS (/Applications/Google Chrome.app)
 * No API keys needed. Supports rendering live DOM, capturing authenticated sessions, and screenshots.
 */

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function isChromeInstalled() {
  return fs.existsSync(CHROME_PATH);
}

/**
 * Renders a page in Google Chrome and extracts rendered DOM + performance metrics + screenshot
 */
async function capturePageWithChrome(targetUrl, options = {}) {
  if (!isChromeInstalled()) {
    throw new Error('Sistemde kurulu Google Chrome bulunamadı (/Applications/Google Chrome.app).');
  }

  const formattedUrl = normalizeUrl(targetUrl);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: options.headless !== false ? 'new' : false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1440,900'
    ],
    defaultViewport: {
      width: 1440,
      height: 900
    }
  });

  try {
    const page = await browser.newPage();
    // A recent, realistic desktop Chrome UA/fingerprint — headless-looking UAs are a
    // common trigger for bot-protection systems to serve a decoy/challenge page instead
    // of real content (see compareRenderedVsPlainFetch in urlUtils for the safety net).
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7' });

    const startTime = Date.now();
    try {
      await page.goto(formattedUrl, {
        waitUntil: 'networkidle2',
        timeout: options.timeout || 25000
      });
    } catch (navErr) {
      if (navErr.message.includes('ERR_NAME_NOT_RESOLVED') || navErr.message.includes('ERR_CONNECTION_REFUSED') || navErr.message.includes('Cannot navigate to invalid URL')) {
        throw new Error(`Web sitesine ulaşılamadı (${formattedUrl}). Lütfen geçerli bir internet adresi girdiğinizden emin olun.`);
      }
      console.warn('Page navigation warning (proceeding with rendered DOM):', navErr.message);
    }

    // Best-effort extra wait for content that hydrates after the network-idle signal
    // (common in SPA storefronts). Never fails the capture if this threshold isn't met.
    await page.waitForFunction(
      () => document.body && document.body.innerText && document.body.innerText.trim().length > 200,
      { timeout: 5000 }
    ).catch(() => {});

    const loadTime = Date.now() - startTime;

    // Extract real Navigation Timing API measurements (TTFB, DOM/load duration).
    // This is genuine browser timing, but note it is still NOT full Core Web Vitals
    // (no LCP/CLS/INP) — auditEngine labels it accordingly based on `source`.
    const perfTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          duration: Math.round(nav.duration)
        };
      }
      return null;
    });

    const renderedHtml = await page.content();
    const screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 });
    const title = await page.title();
    const finalUrl = page.url();

    const duration = perfTiming?.duration ?? loadTime;
    const ttfb = perfTiming?.ttfb ?? Math.round(loadTime * 0.4);

    return {
      url: formattedUrl,
      finalUrl,
      title,
      html: renderedHtml,
      screenshot: `data:image/jpeg;base64,${screenshotBase64}`,
      speedMetrics: {
        loadTime: duration,
        ttfb,
        score: duration < 1500 ? 95 : duration < 3000 ? 75 : 50,
        source: perfTiming ? 'chrome_navigation_timing' : 'chrome_estimate'
      }
    };
  } finally {
    await browser.close();
  }
}

/**
 * Launch an interactive Chrome window for user to log into their e-commerce admin or store
 */
let interactiveSession = null;

async function launchInteractiveSession(startUrl = 'https://google.com') {
  if (!isChromeInstalled()) {
    throw new Error('Google Chrome bulunamadı.');
  }

  if (interactiveSession && interactiveSession.browser.isConnected()) {
    return {
      status: 'already_running',
      message: 'Aktif bir Chrome oturumu zaten açık.'
    };
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false, // Opens visible Chrome window
    args: [
      '--no-sandbox',
      '--start-maximized'
    ],
    defaultViewport: null
  });

  let validUrl = 'https://google.com';
  if (startUrl && typeof startUrl === 'string') {
    const trimmed = startUrl.trim();
    if (trimmed && trimmed !== 'https://' && trimmed !== 'http://') {
      validUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    }
  }

  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();
  try {
    await page.goto(validUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch (e) {
    console.warn('Initial interactive URL navigation warning:', e.message);
  }

  interactiveSession = { browser, page };

  return {
    status: 'launched',
    message: 'Google Chrome penceresi açıldı. E-ticaret panelinize veya sitenize gidin, ardından "Açık Sayfayı Çek" butonuna basın.'
  };
}

/**
 * Captures currently open page from the interactive session
 */
async function captureCurrentInteractivePage() {
  if (!interactiveSession || !interactiveSession.browser.isConnected()) {
    throw new Error('Aktif bir canlı Chrome oturumu bulunamadı. Lütfen önce "Chrome\'u Başlat" butonuna tıklayın.');
  }

  const pages = await interactiveSession.browser.pages();
  const activePage = pages[pages.length - 1]; // active or last tab

  const currentUrl = activePage.url();
  const renderedHtml = await activePage.content();
  const title = await activePage.title();
  const screenshotBase64 = await activePage.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 });

  return {
    url: currentUrl,
    title,
    html: renderedHtml,
    screenshot: `data:image/jpeg;base64,${screenshotBase64}`
  };
}

// Google's official Core Web Vitals thresholds (ai.dev/gemini-api aside — this is the
// real web.dev spec, unrelated to any AI quota concerns): used to rate each metric so
// the UI can show a real good/needs-improvement/poor badge instead of a fabricated one.
const CWV_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },       // ms
  cls: { good: 0.1, needsImprovement: 0.25 },         // unitless
  inp: { good: 200, needsImprovement: 500 },          // ms
  tbt: { good: 200, needsImprovement: 600 }           // ms — fallback proxy for INP when unavailable
};

function rateMetric(value, thresholds) {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Runs a real Lighthouse performance audit against the given URL using a fresh,
 * dedicated Chrome instance (kept separate from the content-capture browser so the
 * two don't contend over the same page/navigation lifecycle). Returns measured:false
 * with a reason on ANY failure — timeout, bot-blocked, crashed — and NEVER a
 * fabricated/estimated number, per the same principle as the reliability safety net
 * elsewhere in this app (a wrong "88/100 site speed" is worse than no number at all).
 */
async function runLighthouseAudit(targetUrl, options = {}) {
  if (!isChromeInstalled()) {
    return { measured: false, reason: 'Google Chrome bulunamadı.' };
  }

  const formattedUrl = normalizeUrl(targetUrl);
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: options.headless !== false ? 'new' : false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--remote-debugging-port=0', '--window-size=1440,900'],
      defaultViewport: { width: 1440, height: 900 }
    });

    const wsEndpoint = browser.wsEndpoint();
    const portMatch = wsEndpoint.match(/:(\d+)\//);
    if (!portMatch) {
      throw new Error('Chrome remote debugging portu belirlenemedi.');
    }
    const port = parseInt(portMatch[1], 10);

    const runnerResult = await lighthouse(formattedUrl, {
      port,
      output: 'json',
      onlyCategories: ['performance'],
      logLevel: 'error'
    }, undefined);

    if (!runnerResult || !runnerResult.lhr) {
      return { measured: false, reason: 'Lighthouse sonuç üretemedi.' };
    }

    const audits = runnerResult.lhr.audits;
    const lcpMs = audits['largest-contentful-paint']?.numericValue;
    const clsValue = audits['cumulative-layout-shift']?.numericValue;
    let inpMs = audits['interaction-to-next-paint']?.numericValue;
    let inpIsProxy = false;
    let inpProxyLabel = null;
    if (inpMs === undefined || inpMs === null) {
      inpMs = audits['total-blocking-time']?.numericValue;
      inpIsProxy = true;
      inpProxyLabel = 'Total Blocking Time (INP yerine)';
    }

    if (lcpMs === undefined || clsValue === undefined || inpMs === undefined) {
      return { measured: false, reason: 'Bazı metrikler Lighthouse tarafından ölçülemedi (sayfa çok yavaş açılmış veya engellenmiş olabilir).' };
    }

    const inpThresholds = inpIsProxy ? CWV_THRESHOLDS.tbt : CWV_THRESHOLDS.inp;

    return {
      measured: true,
      lcp: { value: Math.round(lcpMs), unit: 'ms', rating: rateMetric(lcpMs, CWV_THRESHOLDS.lcp) },
      cls: { value: Math.round(clsValue * 1000) / 1000, unit: '', rating: rateMetric(clsValue, CWV_THRESHOLDS.cls) },
      inp: { value: Math.round(inpMs), unit: 'ms', rating: rateMetric(inpMs, inpThresholds), isProxy: inpIsProxy, proxyLabel: inpProxyLabel },
      performanceScore: runnerResult.lhr.categories?.performance?.score !== null && runnerResult.lhr.categories?.performance?.score !== undefined
        ? Math.round(runnerResult.lhr.categories.performance.score * 100)
        : null
    };
  } catch (err) {
    console.error('Lighthouse audit failed:', err.message);
    return { measured: false, reason: err.message || 'Core Web Vitals ölçümü sırasında beklenmeyen bir hata oluştu.' };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

module.exports = {
  isChromeInstalled,
  capturePageWithChrome,
  launchInteractiveSession,
  captureCurrentInteractivePage,
  runLighthouseAudit
};
