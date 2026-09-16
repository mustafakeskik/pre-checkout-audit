const puppeteer = require('puppeteer-core');
const fs = require('fs');

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

  let formattedUrl = targetUrl.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = 'https://' + formattedUrl;
  }

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
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

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
    const loadTime = Date.now() - startTime;

    // Extract performance timings
    const perfTiming = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      if (nav) {
        return {
          ttfb: Math.round(nav.responseStart - nav.requestStart),
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
          duration: Math.round(nav.duration)
        };
      }
      return {
        ttfb: 150,
        domContentLoaded: 800,
        duration: 1200
      };
    });

    const renderedHtml = await page.content();
    const screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 75 });
    const title = await page.title();

    return {
      url: formattedUrl,
      title,
      html: renderedHtml,
      screenshot: `data:image/jpeg;base64,${screenshotBase64}`,
      speedMetrics: {
        loadTime: perfTiming.duration || loadTime,
        ttfb: perfTiming.ttfb || Math.round(loadTime * 0.4),
        score: (perfTiming.duration || loadTime) < 1500 ? 95 : (perfTiming.duration || loadTime) < 3000 ? 75 : 50
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

module.exports = {
  isChromeInstalled,
  capturePageWithChrome,
  launchInteractiveSession,
  captureCurrentInteractivePage
};
