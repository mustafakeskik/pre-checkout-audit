const axios = require('axios');
const { normalizeUrl } = require('./urlUtils');
const { UserFacingError } = require('./errors');

/**
 * Web Crawler and Asset Checker
 * Fetches page HTML, robots.txt, sitemap.xml, llms.txt, tests 404 response, and gathers speed metrics.
 */

const DEFAULT_TIMEOUT = 12000;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PreCheckoutAudit/1.0';

async function crawlSite(targetUrl) {
  const formattedUrl = normalizeUrl(targetUrl);

  const urlObj = new URL(formattedUrl);
  const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

  const client = axios.create({
    timeout: DEFAULT_TIMEOUT,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
    },
    validateStatus: () => true // Do not throw on 4xx/5xx to capture status code
  });

  // 1. Fetch Main Page & Speed — real TTFB (time to first response byte, via
  // onDownloadProgress' first tick) instead of a fabricated proportion of total load time.
  // Note: this is a plain HTTP fetch, NOT a browser render, so it cannot measure true
  // Core Web Vitals (LCP/CLS/INP) — only server response + download timing.
  const startTime = Date.now();
  let firstByteAt = null;
  let mainResponse;
  try {
    mainResponse = await client.get(formattedUrl, {
      onDownloadProgress: () => {
        if (firstByteAt === null) firstByteAt = Date.now();
      }
    });
  } catch (err) {
    console.error('crawlSite fetch failed:', err.message);
    throw new UserFacingError(`Hedef siteye erişilemedi (${formattedUrl}). Lütfen adresi kontrol edip tekrar deneyin.`);
  }
  const loadTime = Date.now() - startTime;
  const ttfb = firstByteAt !== null ? (firstByteAt - startTime) : loadTime;
  const finalUrl = mainResponse.request?.res?.responseUrl || formattedUrl;

  const html = mainResponse.data && typeof mainResponse.data === 'string' ? mainResponse.data : '';

  // 2. Fetch /robots.txt
  let robotsData = { content: null, exists: false };
  try {
    const robotsRes = await client.get(`${baseUrl}/robots.txt`);
    if (robotsRes.status === 200 && typeof robotsRes.data === 'string' && robotsRes.data.length > 5) {
      robotsData = { content: robotsRes.data, exists: true };
    }
  } catch (e) {}

  // 3. Fetch /sitemap.xml or /sitemap_index.xml or /site.xml
  let sitemapData = { exists: false, url: null, content: null };
  const sitemapCandidates = ['/sitemap.xml', '/sitemap_index.xml', '/site.xml'];
  for (const sPath of sitemapCandidates) {
    try {
      const sRes = await client.get(`${baseUrl}${sPath}`);
      if (sRes.status === 200 && typeof sRes.data === 'string' && (sRes.data.includes('<urlset') || sRes.data.includes('<sitemapindex'))) {
        sitemapData = {
          exists: true,
          url: `${baseUrl}${sPath}`,
          content: sRes.data.substring(0, 5000)
        };
        break;
      }
    } catch (e) {}
  }

  // 4. Fetch /llms.txt or /.well-known/llms.txt
  let llmsData = { exists: false, content: null };
  const llmsCandidates = ['/llms.txt', '/.well-known/llms.txt'];
  for (const lPath of llmsCandidates) {
    try {
      const lRes = await client.get(`${baseUrl}${lPath}`);
      if (lRes.status === 200 && typeof lRes.data === 'string' && lRes.data.length > 10 && !lRes.data.toLowerCase().includes('<!doctype html>')) {
        llmsData = {
          exists: true,
          content: lRes.data.substring(0, 500)
        };
        break;
      }
    } catch (e) {}
  }

  // 5. Test 404 Response
  const test404Slug = `/check-404-audit-${Date.now().toString(36)}`;
  let status404Data = { statusCode: 0, isCustom: false, hasHomeLink: false, hasSearchBar: false };
  try {
    const res404 = await client.get(`${baseUrl}${test404Slug}`);
    status404Data.statusCode = res404.status;
    if (typeof res404.data === 'string') {
      const dataLower = res404.data.toLowerCase();
      status404Data.hasHomeLink = dataLower.includes('href="/"') || dataLower.includes('ana sayfa');
      status404Data.hasSearchBar = dataLower.includes('type="search"') || dataLower.includes('name="q"');
      status404Data.isCustom = (dataLower.includes('404') || dataLower.includes('sayfa bulunamadı') || dataLower.includes('page not found')) && res404.data.length > 300;
    }
  } catch (e) {}

  // 6. Test Thank you page endpoints
  let thankYouData = { exists: false, url: null };
  const thankYouCandidates = ['/thank-you', '/siparis-onay', '/order-received', '/tesekkurler'];
  for (const tyPath of thankYouCandidates) {
    try {
      const tyRes = await client.get(`${baseUrl}${tyPath}`);
      if (tyRes.status === 200 || tyRes.status === 401 || tyRes.status === 403) { // 401/403 often means requires session
        thankYouData = { exists: true, url: `${baseUrl}${tyPath}`, status: tyRes.status };
        break;
      }
    } catch (e) {}
  }

  return {
    url: formattedUrl,
    finalUrl,
    baseUrl,
    html,
    title: (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '',
    speedMetrics: {
      loadTime,
      ttfb,
      score: loadTime < 1500 ? 95 : loadTime < 3000 ? 75 : 45,
      source: 'http_fetch' // plain HTTP timing — not a real browser render, no true Core Web Vitals
    },
    robotsTxt: robotsData,
    sitemapXml: sitemapData,
    llmsTxt: llmsData,
    status404: status404Data,
    thankYou: thankYouData
  };
}

module.exports = {
  crawlSite
};
