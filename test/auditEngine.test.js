const assert = require('assert');
const { runAudit } = require('../services/auditEngine');
const { normalizeUrl, looksLikeBotChallenge } = require('../services/urlUtils');
const { toUserFacingError, isDomainReachable, verifyCompetitors, parseRetryDelaySeconds } = require('../services/aiInsights');
const historyStore = require('../services/historyStore');
const { UserFacingError, toSafeErrorMessage } = require('../services/errors');

let passed = 0;
async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    process.exitCode = 1;
  }
}

async function main() {
console.log('auditEngine + urlUtils regression tests');

// --- Bug #4: image alt tag message must match the actual missing+empty count ---
await test('image_alt_tags message reports the real missing/empty count (not a stray unused variable)', () => {
  const imgs = Array.from({ length: 57 }, (_, i) => {
    // 27 with alt="" (empty), 30 with a real alt — mirrors the real trtmarket.com report
    return i < 27 ? `<img src="p${i}.jpg" alt="">` : `<img src="p${i}.jpg" alt="Ürün ${i}">`;
  }).join('\n');
  const html = `<html><body>${imgs}</body></html>`;
  const result = runAudit(html, 'https://trtmarket-example.com').checklist.image_alt_tags;

  assert.strictEqual(result.details.total, 57);
  assert.strictEqual(result.details.emptyAlt, 27);
  assert.strictEqual(result.details.missingAlt, 0);
  // The message must not silently report 0 while the status/score reflect 27 missing.
  assert.ok(result.message.includes('27'), `expected message to mention 27, got: "${result.message}"`);
  assert.ok(!/\(57 görselden 0 tanesi|0 alt etiketsiz resim\)/.test(result.message), `message still shows a contradictory 0: "${result.message}"`);
});

// --- Bug #2/#3: URL normalization must never throw, and must actually add https:// ---
await test('normalizeUrl adds https:// to a bare domain', () => {
  assert.strictEqual(normalizeUrl('www.trtmarket.com'), 'https://www.trtmarket.com');
});

await test('normalizeUrl strips stray leading/trailing slashes before checking protocol', () => {
  assert.strictEqual(normalizeUrl('/www.trtmarket.com/'), 'https://www.trtmarket.com');
});

await test('normalizeUrl throws a clear, catchable error on garbage input instead of a raw URL exception', () => {
  assert.throws(() => normalizeUrl(''), /Geçersiz veya boş URL/);
});

// --- Bug #3: checkout_security HTTPS check must reflect the actual normalized URL,
// not whatever prefix the user happened to type ---
await test('checkout_security reports HTTPS as active for a protocol-less https-normalized URL', () => {
  const html = `<html><body><p>siparişi tamamla ödemeye geç</p></body></html>`;
  const normalized = normalizeUrl('www.trtmarket.com/checkout');
  const result = runAudit(html, normalized).checklist.checkout_security;
  assert.strictEqual(result.details.isHttps, true);
});

await test('checkout_security and page_404 stay consistent regardless of how the URL was typed (with vs without protocol)', () => {
  const html = `<html><body><p>siparişi tamamla ödemeye geç</p></body></html>`;
  const a = runAudit(html, normalizeUrl('trtmarket.com/checkout')).checklist.checkout_security;
  const b = runAudit(html, normalizeUrl('https://trtmarket.com/checkout')).checklist.checkout_security;
  assert.strictEqual(a.details.isHttps, b.details.isHttps);
  assert.strictEqual(a.score, b.score);
});

// --- Bug #1: bot-challenge heuristic should catch an obvious decoy page ---
await test('looksLikeBotChallenge flags a short/empty decoy page', () => {
  const check = looksLikeBotChallenge('<html><body></body></html>', 'Sizin İçin Çalışıyoruz');
  assert.strictEqual(check.suspected, true);
});

await test('looksLikeBotChallenge does not flag a normal, content-rich page', () => {
  const longText = '<p>' + 'Gerçek ürün açıklaması burada uzun uzun devam ediyor. '.repeat(20) + '</p>';
  const check = looksLikeBotChallenge(`<html><body>${longText}</body></html>`, 'D&R - Kültür, Sanat ve Eğlence Dünyası');
  assert.strictEqual(check.suspected, false);
});

await test('looksLikeBotChallenge does not flag a real, long page just because it embeds a CAPTCHA widget and has an empty <title> (regression: trtmarket.com false positive)', () => {
  const longText = '<p>' + 'Gerçek ürün açıklaması burada uzun uzun devam ediyor. '.repeat(50) + '</p>';
  const html = `<html><head><title></title></head><body>${longText}<script>grecaptcha.render('captcha-widget');</script></body></html>`;
  const check = looksLikeBotChallenge(html, '');
  assert.strictEqual(check.suspected, false, `expected NOT suspected, got reasons: ${JSON.stringify(check.reasons)}`);
});

// --- Structural-implausibility safety net (catches the dr.com.tr-on-Render case:
// a decoy/wrong page served to the scraping server's IP, with no obvious "captcha"
// text pattern to catch it) ---
await test('a decoy page with zero links/images/meta/schema gets scoreUnreliable=true and a null overall score, regardless of WHY the HTML is wrong', () => {
  const decoyHtml = '<html><head><title>Sizin İçin Çalışıyoruz</title></head><body><p>Kısa bir mesaj.</p></body></html>';
  const result = runAudit(decoyHtml, 'https://www.dr.com.tr/', {
    robotsTxt: { exists: false, content: null },
    sitemapXml: { exists: false, url: null, content: null }
  });
  assert.strictEqual(result.scoreUnreliable, true);
  assert.strictEqual(result.scores.overall, null);
  assert.ok(result.reliabilityWarning && result.reliabilityWarning.length > 0);
});

await test('a real, content-rich page never gets flagged scoreUnreliable even with a weak spot or two', () => {
  const goodHtml = `<html><head><title>D&R</title>
    <meta name="description" content="Kültür sanat ve eğlence ürünleri.">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"D&R"}</script>
    </head><body>
    ${Array.from({ length: 20 }, (_, i) => `<a href="/kategori-${i}">Kategori ${i}</a>`).join('')}
    ${Array.from({ length: 10 }, (_, i) => `<img src="urun${i}.jpg" alt="Ürün ${i}">`).join('')}
    </body></html>`;
  const result = runAudit(goodHtml, 'https://www.dr.com.tr/', {
    robotsTxt: { exists: true, content: 'User-agent: *' },
    sitemapXml: { exists: true, url: 'https://www.dr.com.tr/sitemap.xml', content: '<urlset><url><loc>x</loc></url></urlset>' }
  });
  assert.strictEqual(result.scoreUnreliable, undefined);
  assert.strictEqual(typeof result.scores.overall, 'number');
});

// --- AI error sanitization: never leak provider/model/quota internals to the client ---
const SENSITIVE_SUBSTRINGS = ['gemini', 'generativelanguage', 'quota', 'billing', 'google', 'flash', 'free_tier'];

await test('toUserFacingError produces a clean message for a real Gemini 429 quota error, with no leaked internals', () => {
  const err = new Error(
    "You exceeded your current quota, please check your plan and billing details. " +
    "Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, " +
    "limit: 20, model: gemini-3.6-flash. Please retry in 6.6s."
  );
  err.status = 429;
  const message = toUserFacingError(err);
  const lower = message.toLowerCase();
  for (const term of SENSITIVE_SUBSTRINGS) {
    assert.ok(!lower.includes(term), `sanitized message still leaks "${term}": "${message}"`);
  }
  assert.ok(message.length > 0);
});

await test('toUserFacingError handles auth (401/403) and server (5xx) errors without leaking details too', () => {
  const authErr = new Error('API key not valid. Please pass a valid API key.');
  authErr.status = 401;
  assert.ok(!toUserFacingError(authErr).toLowerCase().includes('api key'));

  const serverErr = new Error('Internal error encountered.');
  serverErr.status = 503;
  assert.ok(toUserFacingError(serverErr).length > 0);
});

// --- Domain verification: never show a hallucinated/non-existent competitor domain ---
// Uses real network calls (no mocking) against a domain guaranteed not to resolve, and
// one guaranteed to resolve, since the whole point is to catch a real DNS failure.
await test('isDomainReachable returns false for a domain that cannot possibly resolve (regression: muzemagaza.com hallucination)', async () => {
  const reachable = await isDomainReachable('https://this-domain-definitely-does-not-exist-xyz123abc456.com');
  assert.strictEqual(reachable, false);
});

await test('isDomainReachable returns true for a real, always-up domain', async () => {
  const reachable = await isDomainReachable('https://www.google.com');
  assert.strictEqual(reachable, true);
});

await test('verifyCompetitors drops hallucinated domains and keeps real ones, without ever throwing', async () => {
  const competitors = [
    { name: 'Google', url: 'https://www.google.com', reason: 'real' },
    { name: 'Müze Mağaza', url: 'https://muzemagaza-hallucinated-xyz789.com', reason: 'fake, should be dropped' }
  ];
  const { verified, dropped } = await verifyCompetitors(competitors);
  assert.strictEqual(verified.length, 1);
  assert.strictEqual(verified[0].name, 'Google');
  assert.strictEqual(dropped.length, 1);
  assert.strictEqual(dropped[0].name, 'Müze Mağaza');
});

// --- Retry-delay parsing: real Gemini 429 payload shape (captured from a live
// deliberately-triggered quota error) must parse correctly ---
await test('parseRetryDelaySeconds reads the real RetryInfo shape Gemini returns', () => {
  const geminiError = {
    code: 429,
    status: 'RESOURCE_EXHAUSTED',
    details: [
      { '@type': 'type.googleapis.com/google.rpc.Help', links: [] },
      { '@type': 'type.googleapis.com/google.rpc.QuotaFailure', violations: [] },
      { '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '17.3s' }
    ]
  };
  assert.strictEqual(parseRetryDelaySeconds(geminiError), 17.3);
});

await test('parseRetryDelaySeconds returns null when there is no RetryInfo (never throws)', () => {
  assert.strictEqual(parseRetryDelaySeconds(undefined), null);
  assert.strictEqual(parseRetryDelaySeconds({ details: [] }), null);
});

await test('toUserFacingError gives a concrete wait time when Gemini provides one, instead of a vague "few minutes"', () => {
  const err = new Error('quota exceeded');
  err.status = 429;
  err.geminiError = { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '6.6s' }] };
  const msg = toUserFacingError(err);
  assert.ok(msg.includes('7') || msg.includes('6'), `expected message to include the actual wait time, got: "${msg}"`);
  assert.ok(!msg.toLowerCase().includes('dakika'), `expected a seconds-based message, not the old vague "minutes" one: "${msg}"`);
});

// --- historyStore: trend tracking, sector averages, and the "never fabricate from
// too little data" rule (same principle as the muzemagaza.com fix, applied here) ---
const TEST_DOMAIN_SUFFIX = `histtest-${Date.now()}`;

await test('domainKey normalizes www/https/path differences to the same bucket', () => {
  const a = historyStore.domainKey(`https://www.${TEST_DOMAIN_SUFFIX}.com/urun/1`);
  const b = historyStore.domainKey(`http://${TEST_DOMAIN_SUFFIX}.com`);
  assert.strictEqual(a, b);
});

await test('recordScan refuses to store a scoreUnreliable result (garbage data must never enter history)', () => {
  const domain = `unreliable-${TEST_DOMAIN_SUFFIX}.com`;
  const fakeResult = {
    url: `https://${domain}`,
    timestamp: new Date().toISOString(),
    scoreUnreliable: true,
    scores: { overall: null },
    checklist: {},
    summary: {}
  };
  const id = historyStore.recordScan(fakeResult, 'Genel E-ticaret');
  assert.strictEqual(id, null);
  assert.strictEqual(historyStore.getHistoryForDomain(fakeResult.url).length, 0);
});

await test('recordScan + getPreviousScan: a second scan of the same domain sees the first as its predecessor', () => {
  const domain = `trend-${TEST_DOMAIN_SUFFIX}.com`;
  const makeResult = (overall) => ({
    url: `https://${domain}`,
    timestamp: new Date().toISOString(),
    scores: { overall, preCheckout: overall, technicalSeo: overall, legalTrust: overall, conversionUx: overall, accessibility: overall },
    checklist: { page_404: { status: 'passed' } },
    summary: { passed: 1, warning: 0, failed: 0 }
  });
  historyStore.recordScan(makeResult(40), 'Elektronik');
  const previous = historyStore.getPreviousScan(`https://${domain}`, new Date(Date.now() + 60000).toISOString());
  assert.ok(previous, 'expected to find the just-recorded scan as a predecessor');
  assert.strictEqual(previous.overall_score, 40);

  const history = historyStore.getHistoryForDomain(`https://${domain}`);
  assert.strictEqual(history.length, 1);
});

await test('getSectorAverage refuses to compute an average from fewer than 5 distinct domains (never fabricate a "sector average" from one site)', () => {
  const sector = `test-sector-${TEST_DOMAIN_SUFFIX}`;
  const domain = `onlyone-${TEST_DOMAIN_SUFFIX}.com`;
  historyStore.recordScan({
    url: `https://${domain}`,
    timestamp: new Date().toISOString(),
    scores: { overall: 80, preCheckout: 80, technicalSeo: 80, legalTrust: 80, conversionUx: 80, accessibility: 80 },
    checklist: {},
    summary: { passed: 1, warning: 0, failed: 0 }
  }, sector);

  const result = historyStore.getSectorAverage(sector, null);
  assert.strictEqual(result.insufficientData, true);
  assert.strictEqual(result.sampleCount, 1);
  assert.strictEqual(result.required, historyStore.MIN_SECTOR_SAMPLE);
});

await test('getSectorAverage computes a real average once 5+ distinct domains exist, excluding the comparison domain itself', () => {
  const sector = `full-sector-${TEST_DOMAIN_SUFFIX}`;
  // 6 domains recorded so that excluding one (site0, the "self") still leaves 5 —
  // meeting MIN_SECTOR_SAMPLE.
  for (let i = 0; i < 6; i++) {
    historyStore.recordScan({
      url: `https://site${i}-${TEST_DOMAIN_SUFFIX}.com`,
      timestamp: new Date().toISOString(),
      scores: { overall: 60, preCheckout: 60, technicalSeo: 60, legalTrust: 60, conversionUx: 60, accessibility: 60 },
      checklist: {},
      summary: { passed: 1, warning: 0, failed: 0 }
    }, sector);
  }
  const result = historyStore.getSectorAverage(sector, `https://site0-${TEST_DOMAIN_SUFFIX}.com`);
  assert.strictEqual(result.insufficientData, false);
  assert.strictEqual(result.sampleCount, 5); // site0 excluded, 5 remain
  assert.strictEqual(result.scores.overall, 60);
});

// --- Core Web Vitals scoring (feature 1): only a real, measured result may claim
// the "Core Web Vitals" name/score; a failed measurement must fall back honestly,
// never fabricate a number ---
await test('page_speed uses real Core Web Vitals scoring when coreWebVitals.measured is true', () => {
  const html = '<html><body></body></html>';
  const coreWebVitals = {
    measured: true,
    lcp: { value: 1800, unit: 'ms', rating: 'good' },
    cls: { value: 0.05, unit: '', rating: 'good' },
    inp: { value: 150, unit: 'ms', rating: 'good', isProxy: false },
    performanceScore: 95
  };
  const result = runAudit(html, 'https://cwv-good-test.com', { coreWebVitals }).checklist.page_speed;
  assert.ok(result.name.includes('Core Web Vitals'), `expected CWV name, got: "${result.name}"`);
  assert.strictEqual(result.status, 'passed');
  assert.ok(result.score >= 80);
});

await test('page_speed never fabricates a score when coreWebVitals measurement failed — falls back to honest labeling with the failure reason noted', () => {
  const html = '<html><body></body></html>';
  const coreWebVitals = { measured: false, reason: 'Site bot korumasına takıldı.' };
  const speedMetrics = { ttfb: 100, loadTime: 500, score: 90, source: 'chrome_navigation_timing' };
  const result = runAudit(html, 'https://cwv-failed-test.com', { speedMetrics, coreWebVitals }).checklist.page_speed;
  assert.ok(!result.name.includes('Core Web Vitals'), `expected non-CWV fallback name, got: "${result.name}"`);
  assert.ok(result.message.includes('bot korumasına takıldı'), `expected the failure reason surfaced in the message, got: "${result.message}"`);
});

await test('page_speed does not tell the user to "check that option" when Core Web Vitals WAS attempted but unavailable server-side (regression: Render deployment had no Chrome, but kept telling the user to check a box they already checked)', () => {
  const html = '<html><body></body></html>';
  const coreWebVitals = {
    measured: false,
    reason: 'Bu sunucuda Core Web Vitals ölçümü için gerekli yerel Google Chrome kurulu değil. Bu özellik yalnızca geliştiricinin kendi bilgisayarında (localhost) çalışır — canlı/deploy edilmiş sunucuda devre dışıdır.'
  };
  // This mirrors exactly what happens on Render: useChrome was true but isChromeInstalled()
  // is false there, so speedMetrics comes from the plain HTTP crawler (source: http_fetch).
  const speedMetrics = { ttfb: 80, loadTime: 300, score: 90, source: 'http_fetch' };
  const result = runAudit(html, 'https://cwv-no-chrome-server-test.com', { speedMetrics, coreWebVitals }).checklist.page_speed;
  assert.ok(!result.message.includes('seçeneğini kullanın'), `message still tells the user to check an option they already checked: "${result.message}"`);
  assert.ok(result.message.includes('yerel Google Chrome kurulu değil'), `expected the real reason surfaced: "${result.message}"`);
});

await test('page_speed DOES suggest checking the Chrome option when Core Web Vitals was never even attempted (checkbox genuinely off)', () => {
  const html = '<html><body></body></html>';
  const speedMetrics = { ttfb: 80, loadTime: 300, score: 90, source: 'http_fetch' };
  // No coreWebVitals passed at all — matches the checkbox-off path in server.js.
  const result = runAudit(html, 'https://cwv-checkbox-off-test.com', { speedMetrics }).checklist.page_speed;
  assert.ok(result.message.includes('seçeneğini kullanın'), `expected the suggestion to still appear when CWV was never attempted: "${result.message}"`);
});

await test('page_speed rates a poor LCP/CLS/INP combination as failed with a low score, not a fabricated pass', () => {
  const html = '<html><body></body></html>';
  const coreWebVitals = {
    measured: true,
    lcp: { value: 19000, unit: 'ms', rating: 'poor' },
    cls: { value: 0.4, unit: '', rating: 'poor' },
    inp: { value: 3000, unit: 'ms', rating: 'poor', isProxy: true, proxyLabel: 'Total Blocking Time (INP yerine)' },
    performanceScore: 10
  };
  const result = runAudit(html, 'https://cwv-poor-test.com', { coreWebVitals }).checklist.page_speed;
  assert.strictEqual(result.status, 'failed');
  assert.strictEqual(result.score, 0);
  assert.ok(result.message.includes('LCP') && result.message.includes('CLS'));
});

// --- Never leak a raw system/Node error (regression: "spawn ETXTBSY" reached the
// client's top-level error banner instead of a clean message) ---
await test('toSafeErrorMessage shows the message for a deliberately-thrown UserFacingError', () => {
  const err = new UserFacingError('Geçersiz URL formatı: "not a url"');
  assert.strictEqual(toSafeErrorMessage(err), 'Geçersiz URL formatı: "not a url"');
});

await test('toSafeErrorMessage replaces a raw Node/system error (e.g. spawn ETXTBSY) with a generic fallback', () => {
  const rawErr = new Error('spawn ETXTBSY');
  const message = toSafeErrorMessage(rawErr, 'Site denetlenirken bir hata oluştu.');
  assert.strictEqual(message, 'Site denetlenirken bir hata oluştu.');
  assert.ok(!message.includes('ETXTBSY') && !message.includes('spawn'));
});

await test('toSafeErrorMessage falls back safely even for a null/undefined error', () => {
  assert.strictEqual(toSafeErrorMessage(null, 'Bir hata oluştu.'), 'Bir hata oluştu.');
  assert.strictEqual(toSafeErrorMessage(undefined, 'Bir hata oluştu.'), 'Bir hata oluştu.');
});

// --- normalizeUrl/crawlSite throw UserFacingError so their messages are always
// safe to show verbatim, never a raw system error ---
await test('normalizeUrl throws a UserFacingError (not a bare Error) so its message is always safe to display', () => {
  try {
    normalizeUrl('');
    assert.fail('expected normalizeUrl to throw');
  } catch (err) {
    assert.ok(err.userFacing, 'expected err.userFacing to be true');
    assert.strictEqual(toSafeErrorMessage(err), err.message);
  }
});

console.log(`\n${passed} test(s) passed.`);
}

main();
