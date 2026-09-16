/**
 * Shared URL handling utilities.
 *
 * Root cause of several bugs: the raw string the user types (e.g. "www.site.com",
 * "/site.com/", no protocol at all) was being used directly for both `new URL()`
 * calls (which throw on invalid input, crashing whole React trees) AND for the
 * HTTPS check in checkout_security (which just did `siteUrl.startsWith('https://')`
 * on the RAW input instead of the actual, normalized/fetched URL). Every place
 * that needs to reason about "the URL" should go through normalizeUrl() first,
 * and every place that needs the hostname/etc. should use safeParseUrl().
 */

function normalizeUrl(input) {
  if (!input || typeof input !== 'string') {
    throw new Error('Geçersiz veya boş URL.');
  }
  let trimmed = input.trim();
  // Strip stray leading/trailing slashes some users paste (e.g. "/site.com/")
  trimmed = trimmed.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }
  // Validate — throws a clear, catchable error instead of letting `new URL()`
  // exceptions propagate uncontrolled into callers (and, on the client, into React).
  try {
    // eslint-disable-next-line no-new
    new URL(trimmed);
  } catch (e) {
    throw new Error(`Geçersiz URL formatı: "${input}"`);
  }
  return trimmed;
}

function safeParseUrl(input) {
  try {
    return new URL(normalizeUrl(input));
  } catch (e) {
    return null;
  }
}

// Deliberately specific, multi-word phrases only — single generic words like "captcha"
// or "bot" are common on completely legitimate pages (e.g. a reCAPTCHA widget on a
// contact form) and produced false positives on real sites in testing (trtmarket.com:
// 513K chars of real content, flagged only because it embeds a CAPTCHA widget).
const BOT_CHALLENGE_PATTERNS = [
  /just a moment\.\.\./i,
  /checking your browser before accessing/i,
  /attention required! \| cloudflare/i,
  /access denied.{0,30}(you don't have permission|you do not have permission)/i,
  /please verify you are a human/i,
  /verify you are human/i,
  /unusual traffic from your computer network/i,
  /ddos protection by/i,
  /cloudflare ray id/i,
  /güvenlik kontrolü yapılıyor/i,
  /erişiminiz (geçici olarak )?(kısıtlandı|engellendi)/i,
  /lütfen robot olmadığınızı doğrulayın/i,
];

/**
 * Heuristic check for whether a fetched/rendered page is actually a bot-block /
 * challenge page rather than real site content. Used to compare a headless-Chrome
 * render against a plain HTTP fetch so we never silently report on a decoy page.
 *
 * Deliberately conservative: a near-empty page OR a specific, unambiguous challenge
 * phrase is required to flag `suspected`. Weak signals (e.g. an empty <title>, which
 * many legitimate JS-rendered storefronts have before hydration) are only surfaced
 * as *supporting* context once something stronger has already triggered suspicion —
 * never as a standalone trigger, to avoid false positives on real sites.
 */
function looksLikeBotChallenge(html, title) {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const reasons = [];

  const isNearEmpty = text.length < 200;
  if (isNearEmpty) {
    reasons.push('Sayfa içeriği aşırı kısa (muhtemelen boş/placeholder sayfa).');
  }

  let patternMatched = false;
  for (const pattern of BOT_CHALLENGE_PATTERNS) {
    if (pattern.test(text) || pattern.test(title || '')) {
      reasons.push(`Bot/güvenlik doğrulama sayfası kalıbı tespit edildi ("${pattern.source}").`);
      patternMatched = true;
      break;
    }
  }

  const suspected = isNearEmpty || patternMatched;
  if (suspected && (!title || title.trim().length === 0)) {
    reasons.push('Sayfa başlığı (title) da boş.');
  }

  return { suspected, reasons };
}

/**
 * Compares a headless-rendered page against a plain-fetch of the same URL.
 * If the rendered version looks like a bot challenge while the plain fetch looks
 * like real content, we should trust the plain fetch instead of silently auditing
 * a decoy page.
 */
function compareRenderedVsPlainFetch(renderedHtml, renderedTitle, plainHtml, plainTitle) {
  const renderedCheck = looksLikeBotChallenge(renderedHtml, renderedTitle);
  const plainCheck = looksLikeBotChallenge(plainHtml, plainTitle);

  const renderedTextLen = (renderedHtml || '').replace(/<[^>]+>/g, ' ').trim().length;
  const plainTextLen = (plainHtml || '').replace(/<[^>]+>/g, ' ').trim().length;
  const massivelyShorter = plainTextLen > 500 && renderedTextLen < plainTextLen * 0.3;

  if (renderedCheck.suspected && !plainCheck.suspected) {
    return {
      preferPlainFetch: true,
      warning: `Otomatik tarayıcı ile alınan sayfa bir bot/güvenlik doğrulama sayfası gibi görünüyor (${renderedCheck.reasons.join(' ')}) Site muhtemelen headless tarayıcıları engelliyor. Daha güvenilir olan basit HTTP isteği sonucu kullanıldı, ancak yine de sonuçları manuel olarak doğrulamanızı öneririz.`
    };
  }

  if (massivelyShorter) {
    return {
      preferPlainFetch: true,
      warning: 'Otomatik tarayıcı ile alınan sayfa, aynı adresin basit bir HTTP isteğiyle alınan halinden çok daha kısa/az içerikli çıktı — site muhtemelen otomatik tarayıcıları engelliyor olabilir. Daha eksiksiz görünen sonuç kullanıldı, sonuçları manuel doğrulamanızı öneririz.'
    };
  }

  if (renderedCheck.suspected && plainCheck.suspected) {
    return {
      preferPlainFetch: false,
      warning: `Bu site otomatik tarayıcıları engelliyor olabilir (${renderedCheck.reasons.join(' ')}). Sonuçlar güvenilir olmayabilir — siteyi tarayıcınızda manuel kontrol etmenizi öneririz.`
    };
  }

  return { preferPlainFetch: false, warning: null };
}

module.exports = {
  normalizeUrl,
  safeParseUrl,
  looksLikeBotChallenge,
  compareRenderedVsPlainFetch
};
