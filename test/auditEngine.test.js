const assert = require('assert');
const { runAudit } = require('../services/auditEngine');
const { normalizeUrl, looksLikeBotChallenge } = require('../services/urlUtils');
const { toUserFacingError, isDomainReachable, verifyCompetitors, parseRetryDelaySeconds } = require('../services/aiInsights');

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

console.log(`\n${passed} test(s) passed.`);
}

main();
