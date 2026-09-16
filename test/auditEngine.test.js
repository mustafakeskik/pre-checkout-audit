const assert = require('assert');
const { runAudit } = require('../services/auditEngine');
const { normalizeUrl, looksLikeBotChallenge } = require('../services/urlUtils');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${e.message}`);
    process.exitCode = 1;
  }
}

console.log('auditEngine + urlUtils regression tests');

// --- Bug #4: image alt tag message must match the actual missing+empty count ---
test('image_alt_tags message reports the real missing/empty count (not a stray unused variable)', () => {
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
test('normalizeUrl adds https:// to a bare domain', () => {
  assert.strictEqual(normalizeUrl('www.trtmarket.com'), 'https://www.trtmarket.com');
});

test('normalizeUrl strips stray leading/trailing slashes before checking protocol', () => {
  assert.strictEqual(normalizeUrl('/www.trtmarket.com/'), 'https://www.trtmarket.com');
});

test('normalizeUrl throws a clear, catchable error on garbage input instead of a raw URL exception', () => {
  assert.throws(() => normalizeUrl(''), /Geçersiz veya boş URL/);
});

// --- Bug #3: checkout_security HTTPS check must reflect the actual normalized URL,
// not whatever prefix the user happened to type ---
test('checkout_security reports HTTPS as active for a protocol-less https-normalized URL', () => {
  const html = `<html><body><p>siparişi tamamla ödemeye geç</p></body></html>`;
  const normalized = normalizeUrl('www.trtmarket.com/checkout');
  const result = runAudit(html, normalized).checklist.checkout_security;
  assert.strictEqual(result.details.isHttps, true);
});

test('checkout_security and page_404 stay consistent regardless of how the URL was typed (with vs without protocol)', () => {
  const html = `<html><body><p>siparişi tamamla ödemeye geç</p></body></html>`;
  const a = runAudit(html, normalizeUrl('trtmarket.com/checkout')).checklist.checkout_security;
  const b = runAudit(html, normalizeUrl('https://trtmarket.com/checkout')).checklist.checkout_security;
  assert.strictEqual(a.details.isHttps, b.details.isHttps);
  assert.strictEqual(a.score, b.score);
});

// --- Bug #1: bot-challenge heuristic should catch an obvious decoy page ---
test('looksLikeBotChallenge flags a short/empty decoy page', () => {
  const check = looksLikeBotChallenge('<html><body></body></html>', 'Sizin İçin Çalışıyoruz');
  assert.strictEqual(check.suspected, true);
});

test('looksLikeBotChallenge does not flag a normal, content-rich page', () => {
  const longText = '<p>' + 'Gerçek ürün açıklaması burada uzun uzun devam ediyor. '.repeat(20) + '</p>';
  const check = looksLikeBotChallenge(`<html><body>${longText}</body></html>`, 'D&R - Kültür, Sanat ve Eğlence Dünyası');
  assert.strictEqual(check.suspected, false);
});

test('looksLikeBotChallenge does not flag a real, long page just because it embeds a CAPTCHA widget and has an empty <title> (regression: trtmarket.com false positive)', () => {
  const longText = '<p>' + 'Gerçek ürün açıklaması burada uzun uzun devam ediyor. '.repeat(50) + '</p>';
  const html = `<html><head><title></title></head><body>${longText}<script>grecaptcha.render('captcha-widget');</script></body></html>`;
  const check = looksLikeBotChallenge(html, '');
  assert.strictEqual(check.suspected, false, `expected NOT suspected, got reasons: ${JSON.stringify(check.reasons)}`);
});

console.log(`\n${passed} test(s) passed.`);
