const axios = require('axios');
const { normalizeUrl } = require('./urlUtils');

/**
 * Gemini-powered AI features:
 * 1. Competitor discovery (grounded with live Google Search when available)
 * 2. Solution/action report for categories where the main site scores lower than competitors
 */

const MODEL = 'gemini-3.6-flash';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

// Google Search grounding needs billing enabled on the Google Cloud project and has
// its own (very low) free quota, separate from plain generateContent calls. When it's
// unavailable, every request would otherwise burn a grounding call AND a fallback call
// each time, doubling quota usage for no benefit. Once it fails, skip it for a cooldown
// instead of retrying on every single click.
let groundingDisabledUntil = 0;
const GROUNDING_COOLDOWN_MS = 10 * 60 * 1000;

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY tanımlı değil. Sunucu .env dosyasına ekleyin.');
  }
  return key;
}

async function callGemini({ prompt, useGrounding = false, jsonMode = false }) {
  const apiKey = getApiKey();
  const body = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  if (useGrounding) {
    body.tools = [{ google_search: {} }];
  } else if (jsonMode) {
    body.generationConfig = { responseMimeType: 'application/json' };
  }

  const res = await axios.post(
    `${API_BASE}/${MODEL}:generateContent?key=${apiKey}`,
    body,
    { headers: { 'Content-Type': 'application/json' }, timeout: 30000, validateStatus: () => true }
  );

  if (res.status !== 200) {
    const err = new Error(res.data?.error?.message || `Gemini API hatası (HTTP ${res.status})`);
    err.status = res.status;
    err.geminiError = res.data?.error;
    throw err;
  }

  const candidate = res.data?.candidates?.[0];
  const text = (candidate?.content?.parts || []).map(p => p.text || '').join('\n').trim();
  const grounded = !!candidate?.groundingMetadata;

  return { text, grounded };
}

const VERIFY_USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Checks whether a domain actually resolves/responds at all — not whether the page
 * content is "good", just whether it exists. `validateStatus: () => true` means axios
 * only throws on genuine network-level failures (DNS not found, connection refused,
 * timeout, TLS failure) — any HTTP response at all (even 403/404/500) still proves the
 * domain is real, so it's treated as reachable.
 */
async function isDomainReachable(rawUrl) {
  let normalized;
  try {
    normalized = normalizeUrl(rawUrl);
  } catch {
    return false;
  }
  try {
    await axios.head(normalized, {
      timeout: 6000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': VERIFY_USER_AGENT }
    });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Verifies every AI-suggested competitor domain actually exists before it's ever shown
 * to the user — Gemini occasionally hallucinates a plausible-sounding but non-existent
 * domain (confirmed in testing: "muzemagaza.com" returned NXDOMAIN) and would otherwise
 * present it with a confident, specific-sounding description. Runs all checks in
 * parallel so the extra step doesn't meaningfully slow the response down.
 */
async function verifyCompetitors(competitors) {
  const list = Array.isArray(competitors) ? competitors : [];
  const checks = await Promise.all(
    list.map(async (c) => ({ competitor: c, reachable: c && c.url ? await isDomainReachable(c.url) : false }))
  );
  const verified = checks.filter(c => c.reachable).map(c => c.competitor);
  const dropped = checks.filter(c => !c.reachable).map(c => c.competitor);
  return { verified, dropped };
}

function extractJson(text) {
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1] : text;
  const start = jsonText.indexOf('[') !== -1 && (jsonText.indexOf('{') === -1 || jsonText.indexOf('[') < jsonText.indexOf('{'))
    ? jsonText.indexOf('[')
    : jsonText.indexOf('{');
  const end = Math.max(jsonText.lastIndexOf(']'), jsonText.lastIndexOf('}'));
  const sliced = start !== -1 && end !== -1 ? jsonText.slice(start, end + 1) : jsonText;
  return JSON.parse(sliced);
}

/**
 * Finds real, currently active e-commerce competitor sites for the given site.
 * Tries live Google Search grounding first (most accurate, avoids stale/hallucinated URLs).
 * Falls back to the model's own knowledge if grounding is unavailable (e.g. quota/billing),
 * clearly flagging the result as unverified in that case.
 */
async function findCompetitors(siteInfo = {}) {
  const { title, description, url, sector } = siteInfo;
  const basePrompt = `Aşağıdaki e-ticaret sitesine benzer, TÜRKİYE'de faaliyet gösteren, hâlâ AKTİF ve GERÇEK 3 rakip site bul.

Site: ${title || 'Bilinmiyor'}
Açıklama: ${description || 'Bilinmiyor'}
URL: ${url || 'Bilinmiyor'}
${sector ? `Sektör: ${sector}` : ''}

Kurallar:
- Uydurma marka veya URL önerme; sadece gerçekten var olduğuna emin olduğun siteleri öner.
- Aynı sektörde, benzer ürün/hizmet satan, Türkiye'de erişilebilir siteler olmalı.
- Sonucu SADECE şu JSON formatında ver, başka açıklama ekleme:
[{"name":"Marka Adı","url":"https://gercek-domain.com","reason":"neden rakip olduğuna dair tek cümlelik açıklama"}]`;

  const groundingOnCooldown = Date.now() < groundingDisabledUntil;
  let rawResult;

  if (!groundingOnCooldown) {
    try {
      const { text } = await callGemini({ prompt: basePrompt, useGrounding: true });
      rawResult = { competitors: extractJson(text), grounded: true, source: 'google_search_grounding' };
    } catch (err) {
      // Grounding unavailable (quota/billing/etc.) — fall back to the model's own
      // knowledge, and skip retrying grounding for a while to avoid burning two
      // API calls (one guaranteed to fail) per user click.
      console.warn('Grounded competitor search failed, falling back:', err.message);
      groundingDisabledUntil = Date.now() + GROUNDING_COOLDOWN_MS;
    }
  }

  if (!rawResult) {
    const { text } = await callGemini({
      prompt: `${basePrompt}\n\nNot: Canlı arama yapamıyorsun, kendi bilgine dayanarak en isabetli tahminini yap.`,
      jsonMode: true
    });
    rawResult = {
      competitors: extractJson(text),
      grounded: false,
      source: 'model_knowledge',
      warning: 'Bu öneriler canlı arama olmadan üretildi (bilinen bir sınırlama). URL\'lerin hâlâ geçerli olduğunu kontrol edip karşılaştırmadan önce doğrulayın.'
    };
  }

  // Never show a domain the AI may have hallucinated — verify each one actually
  // resolves before it's presented to the user (see verifyCompetitors() above).
  const { verified, dropped } = await verifyCompetitors(rawResult.competitors);

  let warning = rawResult.warning || null;
  if (dropped.length > 0) {
    const droppedNames = dropped.map(c => c.name || c.url).join(', ');
    const droppedNote = `AI ${dropped.length} öneri daha üretti ama bunlar gerçek bir siteye çözümlenemediği için listeden çıkarıldı (muhtemelen AI'nin uydurduğu, var olmayan domain): ${droppedNames}.`;
    warning = warning ? `${warning} ${droppedNote}` : droppedNote;
  }

  return {
    ...rawResult,
    competitors: verified,
    droppedCount: dropped.length,
    warning
  };
}

/**
 * Generates a prioritized, Turkish-language solution/action report focused specifically
 * on the categories/items where the main site scores lower than its competitors.
 */
async function generateSolutionReport(mainSite, competitors = []) {
  const gaps = [];
  const categoryLabels = {
    preCheckout: 'Pre-Checkout & Satış Hazırlığı',
    technicalSeo: 'Teknik SEO',
    legalTrust: 'Yasal & Güven',
    conversionUx: 'Dönüşüm & UX',
    accessibility: 'Erişilebilirlik (WCAG)'
  };

  Object.entries(mainSite.scores || {}).forEach(([key, score]) => {
    if (key === 'overall') return;
    const betterCompetitors = competitors.filter(c => !c.error && (c.scores?.[key] ?? 0) > score);
    if (betterCompetitors.length > 0) {
      gaps.push({
        category: categoryLabels[key] || key,
        ourScore: score,
        bestCompetitorScore: Math.max(...betterCompetitors.map(c => c.scores[key])),
        competitorNames: betterCompetitors.map(c => c.url)
      });
    }
  });

  const failedItems = Object.values(mainSite.checklist || {})
    .filter(item => item.status === 'failed' || item.status === 'warning')
    .map(item => `- [${item.status === 'failed' ? 'EKSİK' : 'UYARI'}] ${item.name}: ${item.message}`)
    .join('\n');

  const prompt = `Sen bir e-ticaret dönüşüm ve SEO danışmanısın. Aşağıdaki veriye göre, MÜŞTERİYE sunulacak, önceliklendirilmiş bir "Çözüm Raporu" yaz (Türkçe, profesyonel ama net bir dil, markdown formatında).

## Ana Site: ${mainSite.url}
Genel Skor: ${mainSite.scores?.overall}/100

## Rakiplerden Geride Kaldığımız Alanlar:
${gaps.length > 0 ? gaps.map(g => `- ${g.category}: Biz %${g.ourScore}, en iyi rakip %${g.bestCompetitorScore} (${g.competitorNames.join(', ')})`).join('\n') : 'Tüm kategorilerde rakiplerin önündeyiz.'}

## Denetimde Tespit Edilen Eksik/Uyarı Maddeleri:
${failedItems || 'Kritik eksik bulunamadı.'}

Raporu şu yapıda yaz:
1. **Yönetici Özeti** (2-3 cümle, en kritik 2-3 bulguyu vurgula)
2. **Öncelik Sırasına Göre Aksiyon Planı** (en çok etkiyi yaratacak maddeden başlayarak, her biri için: ne yapılmalı, neden önemli, tahmini etki)
3. **Rakip Kıyaslaması Özeti** (geride kaldığımız alanlar ve rakiplerin bunu nasıl yaptığına dair kısa yorum, spekülasyon yapma sadece skor farkına odaklan)
4. **Hızlı Kazanımlar (Quick Wins)** (1 gün içinde yapılabilecek 3-5 basit düzeltme)

Rapor müşteri-dostu olmalı, teknik jargonu abartmamalı ama somut ve aksiyona dönüktür.`;

  const { text } = await callGemini({ prompt, useGrounding: false });
  return { report: text };
}

/**
 * Converts a raw Gemini/axios error into a safe, user-facing Turkish message.
 * Never leaks provider name, model id, quota numbers, or billing details to the
 * client — those are internal implementation details that (a) are confusing to a
 * non-technical user and (b) are exactly the kind of thing you don't want a public
 * demo leaking. Full detail is still available via the caller's console.error.
 */
function toUserFacingError(err) {
  const status = err.status || err.response?.status;

  if (status === 429) {
    return 'Şu anda çok fazla istek var, lütfen birkaç dakika sonra tekrar deneyin.';
  }
  if (status === 401 || status === 403) {
    return 'AI servisine bağlanırken bir yetkilendirme sorunu oluştu. Lütfen daha sonra tekrar deneyin.';
  }
  if (status >= 500) {
    return 'AI servisi şu anda yanıt vermiyor. Lütfen birkaç dakika sonra tekrar deneyin.';
  }
  if (err.message?.includes('GEMINI_API_KEY')) {
    return 'AI özellikleri şu anda yapılandırılmamış. Lütfen yöneticinizle iletişime geçin.';
  }
  return 'AI isteği tamamlanamadı. Lütfen tekrar deneyin.';
}

module.exports = {
  findCompetitors,
  generateSolutionReport,
  toUserFacingError,
  isDomainReachable,
  verifyCompetitors
};
