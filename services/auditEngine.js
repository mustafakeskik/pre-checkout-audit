const cheerio = require('cheerio');
const urlUtils = require('./urlUtils');

/**
 * Pre-Checkout & SEO Audit Engine
 * Evaluates 22+ criteria across E-commerce Readiness, Technical SEO, Legal Compliance, and Conversion.
 */

function runAudit(htmlContent, siteUrl = '', additionalData = {}) {
  const $ = cheerio.load(htmlContent || '');
  const urlObj = siteUrl ? safeParseUrl(siteUrl) : null;
  const domain = urlObj ? urlObj.hostname : '';

  const results = {
    url: siteUrl,
    timestamp: new Date().toISOString(),
    scores: {
      overall: 0,
      preCheckout: 0,
      technicalSeo: 0,
      legalTrust: 0,
      conversionUx: 0,
      accessibility: 0
    },
    summary: {
      passed: 0,
      warning: 0,
      failed: 0,
      total: 26
    },
    checklist: {},
    seoDetails: {},
    extractedData: {}
  };

  // 1. 404 Sayfası
  results.checklist.page_404 = audit404Page($, siteUrl, additionalData.status404);

  // 2. Üst Kısma CTA (Header / Announcement bar CTA)
  results.checklist.top_cta = auditTopCTA($);

  // 3. İç Linkleme (Internal Linking)
  results.checklist.internal_linking = auditInternalLinking($, domain);

  // 4. Teşekkür Sayfası (Thank You / Order Confirmation)
  results.checklist.thank_you_page = auditThankYouPage($, additionalData.thankYou);

  // 4b. Sepet Akışı (Cart Flow)
  results.checklist.cart_flow = auditCartFlow($);

  // 4c. Sipariş Tamamlama Güvenliği (Checkout Security)
  results.checklist.checkout_security = auditCheckoutSecurity($, siteUrl);

  // 5. Sayfa İşaret Yolu (Breadcrumbs)
  results.checklist.breadcrumbs = auditBreadcrumbs($);

  // 6. Vaka Çalışmaları / Referanslar (Case Studies)
  results.checklist.case_studies = auditCaseStudies($);

  // 7. 5 Adet SSS (FAQ)
  results.checklist.faq_5 = auditFAQ($);

  // 8. Site Hızı (Core Web Vitals & Resource Audit)
  results.checklist.page_speed = auditPageSpeed($, htmlContent, additionalData.speedMetrics);

  // 9. Sticky Telefon CTA (Floating / Sticky Call & WhatsApp)
  results.checklist.sticky_phone_cta = auditStickyPhoneCTA($);

  // 10. robots.txt
  results.checklist.robots_txt = auditRobotsTxt(additionalData.robotsTxt);

  // 11. llms.txt (Modern AI Crawler Standard)
  results.checklist.llms_txt = auditLlmsTxt(additionalData.llmsTxt);

  // 12. Benzersiz Meta Başlık (Unique Meta Title)
  results.checklist.meta_title = auditMetaTitle($);

  // 13. Hızlı Log in / Register Butonları
  results.checklist.fast_auth_buttons = auditFastAuthButtons($);

  // 14. Meta Açıklama (Meta Description)
  results.checklist.meta_description = auditMetaDescription($);

  // 15. Sosyal Medya Paylaşım Rehberi (Open Graph & Twitter Cards)
  results.checklist.social_sharing = auditSocialSharing($);

  // 16. Google Harita ve Adres (Local Business & Footer Info)
  results.checklist.google_map_address = auditGoogleMapAndAddress($);

  // 17. Müşteri Yorumları & Değerlendirmeler (Reviews / Social Proof)
  results.checklist.customer_reviews = auditCustomerReviews($);

  // 18. Resim Alt Etiketleri (Image Alt Tags)
  results.checklist.image_alt_tags = auditImageAltTags($);

  // 19. Google Zengin İçerik (Schema.org / JSON-LD / Microdata)
  results.checklist.google_rich_snippets = auditGoogleRichSnippets($);

  // 20. Gizlilik ve Yasal Politika Sayfaları (Tüm Zorunlu Sayfalar)
  results.checklist.legal_privacy_pages = auditLegalPrivacyPages($);

  // 21. Google Search Console Doğrulama & İndekslenme
  results.checklist.google_search_console = auditGoogleSearchConsole($);

  // 22. sitemap.xml / site.xml
  results.checklist.sitemap_xml = auditSitemapXml(additionalData.sitemapXml);

  // 23. Erişilebilirlik (WCAG 2.1 AA)
  results.checklist.accessibility_wcag = auditAccessibilityWcag($);

  // 24. Checkout Adım Sayacı & Form Analizi
  results.checklist.checkout_funnel = auditCheckoutFunnel($, siteUrl, siteUrl);

  // Ek SEO Detayları (H1-H6, Canonical, Viewport, SSL vb.)
  results.seoDetails = auditSeoDetails($, siteUrl);

  // Puanları Hesapla
  calculateScores(results);

  // Sonuç makul mü? (kök nedenden bağımsız güvenlik ağı)
  // Bot koruması / WAF, headless tarayıcı ile aynı sunucudan atılan düz HTTP isteğini de
  // engelleyebilir (ör. barındırma sağlayıcısının datacenter IP'sini itibar bazlı
  // engellemesi) — bu durumda chrome-render ile plain-fetch karşılaştırması işe yaramaz
  // çünkü ikisi de aynı (yanlış) sayfayı görür. Bu yüzden burada, HTML kaynağından
  // bağımsız olarak, hesaplanan checklist sonucunun yapısal olarak makul olup
  // olmadığını kontrol ediyoruz: gerçek, aktif bir e-ticaret ana sayfasının aynı anda
  // sıfır iç link + sıfır görsel + meta açıklaması yok + hiç schema yok olması
  // pratikte neredeyse imkansızdır.
  assessResultPlausibility(results);

  return results;
}

function safeParseUrl(urlStr) {
  return urlUtils.safeParseUrl(urlStr);
}

// 1. 404 Sayfası Denetimi — kademeli puanlama: her alt-kriter nihai puana giriyor
function audit404Page($, siteUrl, status404Data) {
  if (status404Data) {
    const { statusCode, isCustom, hasHomeLink, hasSearchBar } = status404Data;

    let score = 0;
    if (statusCode === 404) score += 40;   // temel: doğru HTTP durum kodu
    if (hasHomeLink) score += 25;          // kullanıcıyı kaybetmiyor
    if (hasSearchBar) score += 20;         // arama ile kurtarma şansı
    if (isCustom) score += 15;             // şablon değil, markaya uygun tasarım

    const missing = [];
    if (statusCode !== 404) missing.push('doğru HTTP 404 durum kodu (soft-404 riski)');
    if (!hasHomeLink) missing.push('ana sayfaya dönüş linki');
    if (!hasSearchBar) missing.push('arama kutusu');
    if (!isCustom) missing.push('markaya özel tasarım');

    const status = score >= 85 ? 'passed' : score >= 45 ? 'warning' : 'failed';

    return {
      id: 'page_404',
      name: '404 Sayfası',
      category: 'preCheckout',
      status,
      score,
      message: missing.length
        ? `404 sayfası ${score}/100 puan aldı. Eksik: ${missing.join(', ')}.`
        : '404 sayfası HTTP kodu, ana sayfa linki, arama kutusu ve marka tasarımıyla tam donanımlı.',
      details: { statusCode, hasHomeLink: !!hasHomeLink, hasSearchBar: !!hasSearchBar, isCustomBranded: !!isCustom },
      recommendation: missing.length
        ? `Skoru artırmak için ekleyin: ${missing.join(', ')}.`
        : '404 sayfanız iyi durumda; düzenli kırık link taraması yaparak koruyun.'
    };
  }

  // Ham HTML modu: canlı HTTP durum kodu test edilemiyor, sadece şablon içeriği heuristik olarak puanlanır.
  const textContent = $('body').text().toLowerCase();
  const has404Indicator = textContent.includes('404') || textContent.includes('sayfa bulunamadı') || textContent.includes('page not found');
  const hasHomeLinkHtml = $('a[href="/"]').length > 0 || textContent.includes('ana sayfa');
  const hasSearchBarHtml = $('input[type="search"], input[name="q"], input[name="s"]').length > 0;

  if (has404Indicator) {
    let score = 40; // özel 404 şablonu tespit edildi (temel puan, HTTP kodu doğrulanamadığı için tavan 100 değil)
    if (hasHomeLinkHtml) score += 30;
    if (hasSearchBarHtml) score += 30;

    const missing = [];
    if (!hasHomeLinkHtml) missing.push('ana sayfaya dönüş linki');
    if (!hasSearchBarHtml) missing.push('arama kutusu');

    return {
      id: 'page_404',
      name: '404 Sayfası',
      category: 'preCheckout',
      status: score >= 85 ? 'passed' : score >= 45 ? 'warning' : 'failed',
      score,
      message: `HTML içeriği özel bir 404 şablonu olarak algılandı (${score}/100)${missing.length ? `. Eksik: ${missing.join(', ')}` : ''}.`,
      details: { hasHomeLink: hasHomeLinkHtml, hasSearchBar: hasSearchBarHtml, verifiedLive: false },
      recommendation: 'Canlı sunucuda bu şablonun HTTP 404 durum koduyla döndüğünü doğrulamak için URL taraması yapın; eksik unsurları tamamlayın.'
    };
  }

  return {
    id: 'page_404',
    name: '404 Sayfası',
    category: 'preCheckout',
    status: 'warning',
    score: 60,
    message: 'Canlı URL taranmadığı için 404 sayfası doğrudan doğrulanamadı. Sitede özel 404 sayfası tanımlandığından emin olun.',
    recommendation: 'Site genelinde kırık linkler için özel 404 sayfası hazırlayın ve canlı URL taramasıyla test edin.'
  };
}

// 2. Üst Kısma CTA Denetimi
function auditTopCTA($) {
  const topBarSelectors = [
    'header', '.header', '.top-bar', '.topbar', '.announcement-bar', 
    '[class*="announcement"]', '[class*="top-bar"]', '[class*="topbar"]',
    '#top-bar', '.nav-top', '.header-top'
  ];

  let foundCta = null;
  let matchStrength = null; // 'dedicated_bar' (strong) | 'generic_header' (weak)
  const ctaKeywords = [
    'satın al', 'incele', 'fırsat', 'ücretsiz kargo', 'hemen al', 'iletişim',
    'kampanya', 'keşfet', 'indirim', 'ara', 'sipariş', 'üye ol', 'başla',
    'teklif al', 'randevu', 'shop now', 'buy now', 'get started', 'call now',
    'free shipping', 'order now', 'claim'
  ];

  for (const sel of topBarSelectors) {
    const $elem = $(sel);
    if ($elem.length > 0) {
      const linksAndButtons = $elem.find('a, button, [role="button"]');
      linksAndButtons.each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr('href') || '';
        const lowerText = text.toLowerCase();
        for (const kw of ctaKeywords) {
          if (lowerText.includes(kw)) {
            foundCta = { text, href, selector: sel };
            matchStrength = 'dedicated_bar';
            return false;
          }
        }
      });
      if (foundCta) break;
    }
  }

  // Header içinde genel buton var mı? (zayıf sinyal: kampanya/CTA olduğu kesin değil, sadece bir buton)
  if (!foundCta) {
    const headerBtn = $('header button, header a.btn, header a[class*="button"], header a[class*="btn"]').first();
    if (headerBtn.length > 0 && headerBtn.text().trim().length > 1) {
      foundCta = { text: headerBtn.text().trim(), href: headerBtn.attr('href') || '', selector: 'header button' };
      matchStrength = 'generic_header';
    }
  }

  if (foundCta) {
    const hasRealLink = !!foundCta.href && foundCta.href !== '#' && foundCta.href.trim() !== '';
    let score = matchStrength === 'dedicated_bar' ? 75 : 55; // kampanya niyeti net mi, yoksa sadece bir buton mu
    if (hasRealLink) score += 25; // gerçekten tıklanabilir bir hedefe götürüyor mu

    const missing = [];
    if (matchStrength !== 'dedicated_bar') missing.push('bu butonun net bir kampanya/CTA olduğuna dair daha güçlü sinyal (özel duyuru çubuğu)');
    if (!hasRealLink) missing.push('geçerli bir tıklama hedefi (href boş veya "#")');

    const status = score >= 85 ? 'passed' : score >= 45 ? 'warning' : 'failed';

    return {
      id: 'top_cta',
      name: 'Üst Kısma CTA',
      category: 'conversionUx',
      status,
      score,
      message: missing.length
        ? `Üst kısımda bir buton/link bulundu ("${foundCta.text}") ama ${score}/100 puan aldı. Eksik: ${missing.join(', ')}.`
        : `Üst kısımda belirgin eyleme çağrı (CTA) butonu/linki bulundu: "${foundCta.text}".`,
      details: { ...foundCta, matchStrength, hasRealLink },
      recommendation: missing.length
        ? `Skoru artırmak için: ${missing.join(', ')}.`
        : 'CTA butonunun mobilde de ekran genişliğine uygun ve tıklanabilir olduğundan emin olun.'
    };
  }

  return {
    id: 'top_cta',
    name: 'Üst Kısma CTA',
    category: 'conversionUx',
    status: 'failed',
    score: 0,
    message: 'Sayfanın üst barında (header/announcement) dikkat çekici bir kampanya veya CTA butonu tespit edilemedi.',
    recommendation: 'Header veya üst duyuru çubuğuna (Announcement Bar) "Ücretsiz Kargo / %15 İndirimi Yakala / Hemen İncele" gibi bir CTA ekleyin.'
  };
}

// 3. İç Linkleme (Internal Linking)
function auditInternalLinking($, domain) {
  const allLinks = $('a[href]');
  let internalCount = 0;
  let externalCount = 0;
  let nofollowCount = 0;
  let emptyAnchorCount = 0;
  const internalSample = [];

  allLinks.each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    const rel = ($(el).attr('rel') || '').toLowerCase();
    const text = $(el).text().trim();

    if (!text && $(el).find('img').length === 0) {
      emptyAnchorCount++;
    }

    if (rel.includes('nofollow')) {
      nofollowCount++;
    }

    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      // ignore utility links
    } else if (href.startsWith('/') || (domain && href.includes(domain))) {
      internalCount++;
      if (internalSample.length < 8 && href.length > 1) {
        internalSample.push({ text: text || '[Görsel Link]', href });
      }
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
      externalCount++;
    }
  });

  if (internalCount >= 10) {
    return {
      id: 'internal_linking',
      name: 'İç Linkleme (Internal Linking)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: `Sağlıklı iç linkleme yapısı mevcut (${internalCount} iç link tespit edildi, ${nofollowCount} nofollow).`,
      details: { internalCount, externalCount, emptyAnchorCount, sample: internalSample },
      recommendation: 'İç linklerin anchor textlerinin zengin ve hedef anahtar kelimeleri kapsadığından emin olun.'
    };
  } else if (internalCount >= 4) {
    return {
      id: 'internal_linking',
      name: 'İç Linkleme (Internal Linking)',
      category: 'technicalSeo',
      status: 'warning',
      score: 65,
      message: `İç linkleme sayısı düşük seviyede (${internalCount} iç link).`,
      details: { internalCount, externalCount, emptyAnchorCount, sample: internalSample },
      recommendation: 'Sayfa içerisinden ilgili alt kategorilere, blog yazılarına ve ürünlere giden iç link sayısını artırın.'
    };
  }

  return {
    id: 'internal_linking',
    name: 'İç Linkleme (Internal Linking)',
    category: 'technicalSeo',
    status: 'failed',
    score: 20,
    message: `Kritik: Yetersiz iç linkleme (${internalCount} link bulundu). Arama motorları ve kullanıcılar derin sayfalara ulaşmakta zorlanabilir.`,
    details: { internalCount, externalCount, emptyAnchorCount },
    recommendation: 'Menü, footer ve içerik bloklarına zengin iç bağlantılar ekleyin.'
  };
}

// 4. Teşekkür Sayfası (Thank You / Order Confirmation) — kademeli puanlama
function auditThankYouPage($, thankYouData) {
  const html = $.html().toLowerCase();
  const thankYouKeywords = [
    'order-received', 'thank-you', 'siparis-onay', 'tesekkurler', 'teşekkürler',
    'checkout/success', 'order-success', 'purchase-complete'
  ];

  const hasReference = thankYouKeywords.some(kw => html.includes(kw));
  const hasConversionPixels = html.includes('purchase') || html.includes('ordertracking') || html.includes('conversion') || html.includes('datalayer');
  const hasOrderNumberIndicator = /sipariş\s*no|sipariş\s*numarası|order\s*number|order\s*#|referans\s*no/i.test($('body').text());

  // Canlı URL taramasında crawler /thank-you, /siparis-onay gibi adaylara istek atıp sayfanın
  // gerçekten var olduğunu doğruladı — bu, aşağıdaki içerik sinyallerinden bağımsız ek bir kanıttır.
  const pageReachable = !!(thankYouData && thankYouData.exists);

  let score = 0;
  if (hasConversionPixels) score += 55;      // dönüşüm takibi kurulu
  if (hasReference || pageReachable) score += 25; // sayfa/URL referansı doğrulandı (canlı veya statik)
  if (hasOrderNumberIndicator) score += 20;  // müşteri sipariş no görüyor

  const missing = [];
  if (!hasConversionPixels) missing.push('dönüşüm takip kodu (GA4 Purchase / Meta Pixel / Ads)');
  if (!(hasReference || pageReachable)) missing.push('tanınabilir teşekkür/sipariş-onay sayfa referansı');
  if (!hasOrderNumberIndicator) missing.push('görünür sipariş numarası');

  const status = score >= 85 ? 'passed' : score >= 45 ? 'warning' : 'failed';

  return {
    id: 'thank_you_page',
    name: 'Teşekkür / Sipariş Onay Sayfası',
    category: 'preCheckout',
    status,
    score,
    message: missing.length
      ? `Teşekkür sayfası ${score}/100 puan aldı. Eksik: ${missing.join(', ')}.`
      : `Teşekkür sayfası dönüşüm takibi, sayfa referansı ve sipariş numarasıyla tam donanımlı${pageReachable ? ` (canlı URL'de doğrulandı: ${thankYouData.url})` : ''}.`,
    details: { hasConversionPixels, hasReference, hasOrderNumberIndicator, pageReachable, liveUrl: thankYouData?.url },
    recommendation: missing.length
      ? `Skoru artırmak için ekleyin: ${missing.join(', ')}.`
      : 'Sipariş sonrası kargo takip linkinin de gösterildiğini canlı test edin.'
  };
}

// 4b. Sepet Akışı (Cart Flow) — mini-sepet, miktar güncelleme, misafir alışverişi
function auditCartFlow($) {
  const bodyText = ($('body').text() || '').toLowerCase();
  const htmlLower = ($.html() || '').toLowerCase();

  const hasAddToCartButton = $(
    '[class*="add-to-cart" i], [data-add-to-cart], button[class*="addtocart" i], a[class*="add-to-cart" i]'
  ).length > 0 || /sepete\s*ekle|add\s*to\s*cart/i.test(bodyText);

  const hasMiniCartOrDrawer = $(
    '[class*="mini-cart" i], [class*="cart-drawer" i], [class*="cart-flyout" i], [class*="cart-popup" i], [data-cart-drawer], .cart-count, [class*="cart-count" i], [class*="cart-badge" i]'
  ).length > 0;

  const hasQuantityStepper = $(
    'input[type="number"][name*="qty" i], input[name*="quantity" i], [class*="qty-selector" i], [class*="quantity-selector" i], button[class*="qty-plus" i], button[class*="qty-minus" i], [class*="quantity-input" i]'
  ).length > 0;

  const hasGuestCheckout = /misafir|üye olmadan|guest checkout|kayıt olmadan devam/i.test(bodyText);

  let score = 0;
  if (hasAddToCartButton) score += 25;
  if (hasMiniCartOrDrawer) score += 25;
  if (hasQuantityStepper) score += 25;
  if (hasGuestCheckout) score += 25;

  const missing = [];
  if (!hasAddToCartButton) missing.push('"Sepete Ekle" butonu (bu kontrol için bir ürün sayfası taratılması önerilir)');
  if (!hasMiniCartOrDrawer) missing.push('mini-sepet/sepet bildirimi (drawer)');
  if (!hasQuantityStepper) missing.push('sepette miktar güncelleme kontrolü');
  if (!hasGuestCheckout) missing.push('misafir (üye olmadan) satın alma seçeneği');

  const status = score >= 75 ? 'passed' : score >= 40 ? 'warning' : 'failed';

  return {
    id: 'cart_flow',
    name: 'Sepet Akışı',
    category: 'preCheckout',
    status,
    score,
    message: missing.length
      ? `Sepet akışı ${score}/100 puan aldı. Eksik: ${missing.join(', ')}.`
      : 'Sepete ekleme, mini-sepet, miktar güncelleme ve misafir alışverişi tespit edildi.',
    details: { hasAddToCartButton, hasMiniCartOrDrawer, hasQuantityStepper, hasGuestCheckout },
    recommendation: missing.length
      ? `Skoru artırmak için ekleyin: ${missing.join(', ')}. Not: Bu madde en doğru sonucu bir ÜRÜN sayfası taratıldığında verir.`
      : 'Sepet akışınız sağlam; checkout adım sayısını da "Checkout Adım Sayacı" maddesinden kontrol edin.'
  };
}

// 4c. Sipariş Tamamlama Güvenliği (Checkout Security)
function auditCheckoutSecurity($, siteUrl) {
  const bodyText = ($('body').text() || '').toLowerCase();
  const htmlLower = ($.html() || '').toLowerCase();
  const path = (siteUrl || '').toLowerCase();
  const looksLikeCheckout = /sepet|cart|checkout|odeme|ödeme|siparis|order/.test(path) ||
    /siparişi tamamla|ödemeye geç|proceed to checkout|place order/.test(bodyText);

  // Parse defensively (normalize) rather than trusting the raw input string's prefix —
  // the caller is expected to already pass a normalized/final URL, but this guards
  // against any future caller that doesn't, instead of silently misreporting HTTPS status.
  const parsedUrl = urlUtils.safeParseUrl(siteUrl);
  const isHttps = parsedUrl ? parsedUrl.protocol === 'https:' : false;

  const hasTrustSignal = /3d\s*secure|3ds\b|güvenli\s*ödeme|secure\s*checkout|ssl\s*sertifika/i.test(bodyText) ||
    $('img[alt*="secure" i], img[alt*="güvenli" i], img[alt*="3d secure" i], [class*="trust-badge" i], [class*="secure-badge" i]').length > 0;

  const hasKnownPaymentGateway = /iyzico|iyzipay|paytr|param\.com\.tr|craftgate|sipay|posnet|garanti\s*sanalpos|ykbsanalpos|payu|stripe\.com|moka\s*ödeme/i.test(htmlLower);

  const hasFormValidationSupport = $('input[required], select[required], textarea[required]').length > 0 &&
    ($('[class*="error-message" i], [class*="field-error" i], [class*="invalid-feedback" i], [aria-invalid]').length > 0 ||
      $('form').length > 0);

  if (!looksLikeCheckout) {
    // Checkout'a özgü sinyaller (3D Secure ibaresi, ödeme altyapısı) yalnızca gerçek checkout/ödeme
    // sayfasında anlamlıdır; bu sayfa öyle görünmediği için sadece siteUrl-bazlı HTTPS kontrolü sayılır.
    const score = isHttps ? 55 : 20;
    return {
      id: 'checkout_security',
      name: 'Sipariş Tamamlama Güvenliği',
      category: 'preCheckout',
      status: 'warning',
      score,
      message: `Bu sayfa bir ödeme/checkout sayfası gibi görünmüyor, bu yüzden yalnızca HTTPS kontrolü yapılabildi (${isHttps ? 'HTTPS aktif' : 'HTTPS yok'}).`,
      details: { isHttps, looksLikeCheckout, verifiedOnCheckoutPage: false },
      recommendation: 'Bu maddeden tam verim almak için doğrudan ödeme (checkout) sayfasının URL\'ini veya HTML\'ini denetleyin.'
    };
  }

  let score = 0;
  if (isHttps) score += 35;
  if (hasTrustSignal) score += 25;
  if (hasFormValidationSupport) score += 20;
  if (hasKnownPaymentGateway) score += 20;

  const missing = [];
  if (!isHttps) missing.push('HTTPS (kritik — kredi kartı bilgisi şifresiz iletiliyor olabilir)');
  if (!hasTrustSignal) missing.push('güven rozeti / 3D Secure ibaresi');
  if (!hasFormValidationSupport) missing.push('anlaşılır form hata mesajlaşması');
  if (!hasKnownPaymentGateway) missing.push('tanınan bir ödeme altyapısı sağlayıcısı işareti');

  const status = score >= 85 ? 'passed' : score >= 45 ? 'warning' : 'failed';

  return {
    id: 'checkout_security',
    name: 'Sipariş Tamamlama Güvenliği',
    category: 'preCheckout',
    status,
    score,
    message: missing.length
      ? `Checkout güvenliği ${score}/100 puan aldı. Eksik: ${missing.join(', ')}.`
      : 'HTTPS, güven rozeti, form doğrulama ve tanınan ödeme altyapısı tespit edildi.',
    details: { isHttps, hasTrustSignal, hasFormValidationSupport, hasKnownPaymentGateway },
    recommendation: missing.length
      ? `Skoru artırmak için ekleyin: ${missing.join(', ')}.${!isHttps ? ' HTTPS eksikliği en kritik risktir, önce onu çözün.' : ''}`
      : 'Ödeme güvenliğiniz iyi durumda; düzenli olarak SSL sertifikası son kullanma tarihini kontrol edin.'
  };
}

// 5. Sayfa İşaret Yolu (Breadcrumbs)
function auditBreadcrumbs($) {
  const breadcrumbEl = $(
    'nav[aria-label*="breadcrumb" i], .breadcrumb, [class*="breadcrumb"], ol.breadcrumb, ul.breadcrumb, [id*="breadcrumb"]'
  );

  // Schema kontrolü
  let hasSchemaBreadcrumb = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const checkBc = (item) => item['@type'] === 'BreadcrumbList';
      if (checkBc(data) || (Array.isArray(data['@graph']) && data['@graph'].some(checkBc))) {
        hasSchemaBreadcrumb = true;
      }
    } catch (e) {}
  });

  const hasHtmlBreadcrumb = breadcrumbEl.length > 0;

  if (hasHtmlBreadcrumb && hasSchemaBreadcrumb) {
    return {
      id: 'breadcrumbs',
      name: 'Sayfa İşaret Yolu (Breadcrumbs)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: 'Hem HTML Breadcrumb navigasyonu hem de Schema.org BreadcrumbList yapılandırılmış verisi mevcut.',
      details: { htmlPresent: true, schemaPresent: true },
      recommendation: 'Breadcrumb yolundaki tüm linklerin çalışır durumda olduğunu periyodik olarak kontrol edin.'
    };
  } else if (hasHtmlBreadcrumb && !hasSchemaBreadcrumb) {
    return {
      id: 'breadcrumbs',
      name: 'Sayfa İşaret Yolu (Breadcrumbs)',
      category: 'technicalSeo',
      status: 'warning',
      score: 75,
      message: 'Görsel breadcrumb navigasyonu var ancak Schema.org BreadcrumbList JSON-LD zengin verisi eksik.',
      details: { htmlPresent: true, schemaPresent: false },
      recommendation: 'Google arama sonuçlarında navigasyon yolunun görünmesi için BreadcrumbList JSON-LD şemasını ekleyin.'
    };
  }

  return {
    id: 'breadcrumbs',
    name: 'Sayfa İşaret Yolu (Breadcrumbs)',
    category: 'technicalSeo',
    status: 'failed',
    score: 0,
    message: 'Sayfada Breadcrumb (Sayfa İşaret Yolu) navigasyonu bulunamadı.',
    recommendation: 'Kullanıcı deneyimi ve SEO için hiyerarşik Breadcrumb yolu (Ana Sayfa > Kategori > Ürün) ekleyin.'
  };
}

// 6. Vaka Çalışmaları / Referanslar (Case Studies)
function auditCaseStudies($) {
  const text = $('body').text().toLowerCase();
  const links = $('a[href]').map((_, el) => $(el).attr('href').toLowerCase()).get();

  const keywords = ['vaka çalışması', 'vaka çalışmaları', 'case study', 'case studies', 'başarı hikayeleri', 'referanslar', 'portfolyo', 'portfolio', 'projelerimiz'];
  
  let foundKeyword = null;
  for (const kw of keywords) {
    if (text.includes(kw) || links.some(l => l.includes(kw.replace(/\s+/g, '-')))) {
      foundKeyword = kw;
      break;
    }
  }

  const caseStudySelectors = [
    '[class*="case-study"]', '[class*="case-studies"]', '[class*="portfolio"]', 
    '[class*="reference"]', '[id*="case-study"]', '[id*="referanslar"]'
  ];
  const hasElement = $(caseStudySelectors.join(', ')).length > 0;

  if (foundKeyword || hasElement) {
    return {
      id: 'case_studies',
      name: 'Vaka Çalışmaları / Referanslar',
      category: 'conversionUx',
      status: 'passed',
      score: 100,
      message: `Müşteri güvenini artıran vaka çalışmaları veya referans bölümü tespit edildi ("${foundKeyword || 'Referans Bloğu'}").`,
      details: { matched: foundKeyword || 'element' },
      recommendation: 'Vaka çalışmalarında somut rakamlar, öncesi/sonrası verileri ve müşteri logoları kullanmaya devam edin.'
    };
  }

  return {
    id: 'case_studies',
    name: 'Vaka Çalışmaları / Referanslar',
    category: 'conversionUx',
    status: 'warning',
    score: 40,
    message: 'Sitede vaka çalışmaları, müşteri başarı hikayeleri veya referanslar bölümü bulunamadı.',
    recommendation: 'Satın alma öncesi güveni (social proof) pekiştirmek için gerçek müşteri başarı hikayeleri veya referanslar sayfası ekleyin.'
  };
}

// 7. 5 Adet SSS (FAQ)
function auditFAQ($) {
  const faqQuestions = [];

  // Schema FAQPage kontrolü
  let schemaFaqCount = 0;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const checkFaqItem = (obj) => {
        if (obj['@type'] === 'FAQPage' && Array.isArray(obj.mainEntity)) {
          schemaFaqCount += obj.mainEntity.length;
          obj.mainEntity.forEach(q => {
            if (q.name) faqQuestions.push(q.name);
          });
        }
      };
      checkFaqItem(data);
      if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach(checkFaqItem);
      }
    } catch (e) {}
  });

  // HTML accordion / details kontrolü
  $('details summary, [class*="faq"] [class*="question"], [class*="faq-item"], [class*="accordion"] [class*="title"], [class*="accordion-item"]').each((_, el) => {
    const qText = $(el).text().trim();
    if (qText.length > 5 && (qText.includes('?') || qText.toLowerCase().includes('nasıl') || qText.toLowerCase().includes('nedir') || qText.toLowerCase().includes('ne zaman'))) {
      if (!faqQuestions.includes(qText)) {
        faqQuestions.push(qText);
      }
    }
  });

  const faqCount = Math.max(faqQuestions.length, schemaFaqCount);

  if (faqCount >= 5) {
    return {
      id: 'faq_5',
      name: '5 Adet SSS (FAQ & Schema)',
      category: 'conversionUx',
      status: 'passed',
      score: 100,
      message: `Harika! ${faqCount} adet sıkça sorulan soru ve ilgili şablon tespit edildi.`,
      details: { count: faqCount, schemaCount: schemaFaqCount, sampleQuestions: faqQuestions.slice(0, 5) },
      recommendation: 'Soruların kargo, iade, ödeme ve ürün kullanımı gibi en kritik müşteri tereddütlerini yanıtladığından emin olun.'
    };
  } else if (faqCount > 0) {
    return {
      id: 'faq_5',
      name: '5 Adet SSS (FAQ & Schema)',
      category: 'conversionUx',
      status: 'warning',
      score: 60,
      message: `Sitede ${faqCount} adet SSS bulundu. Önerilen minimum 5 adet soru hedefine ulaşılamadı.`,
      details: { count: faqCount, schemaCount: schemaFaqCount, sampleQuestions: faqQuestions },
      recommendation: 'Müşteri itirazlarını gidermek ve Google zengin sonuçlarında çıkmak için SSS sayısını en az 5 adede tamamlayın ve FAQPage şeması ekleyin.'
    };
  }

  return {
    id: 'faq_5',
    name: '5 Adet SSS (FAQ & Schema)',
    category: 'conversionUx',
    status: 'failed',
    score: 0,
    message: 'Sayfada SSS (Sıkça Sorulan Sorular) bölümü veya FAQPage şeması tespit edilemedi.',
    recommendation: 'Pre-checkout süreci için en az 5 adet SSS ekleyin ve Schema.org FAQPage JSON-LD formatında işaretleyin.'
  };
}

// 8. Site Hızı & Core Web Vitals
function auditPageSpeed($, htmlContent, speedMetrics) {
  const scriptCount = $('script[src]').length;
  const styleCount = $('link[rel="stylesheet"]').length;
  const imageCount = $('img').length;
  const htmlSizeBytes = Buffer.byteLength(htmlContent || '', 'utf8');
  const htmlSizeKb = (htmlSizeBytes / 1024).toFixed(1);

  if (speedMetrics) {
    const ttfb = speedMetrics.ttfb ?? 0;
    const loadTime = speedMetrics.loadTime ?? 0;
    const score = speedMetrics.score ?? (loadTime < 1500 ? 95 : loadTime < 3000 ? 75 : 45);

    // Name/message are honest about what was actually measured — a plain HTTP fetch
    // cannot claim Core Web Vitals (LCP/CLS/INP), only real Chrome navigation timing can
    // get close (and even that isn't full CWV, just TTFB + load duration).
    const isRealBrowserMeasurement = speedMetrics.source === 'chrome_navigation_timing' || speedMetrics.source === 'chrome_estimate';
    const name = isRealBrowserMeasurement ? 'Site Hızı (Chrome Performans Ölçümü)' : 'Sunucu Yanıt Süresi (HTTP Ölçümü)';
    const methodNote = isRealBrowserMeasurement
      ? 'Gerçek Chrome render süresi ölçüldü (tam Core Web Vitals — LCP/CLS/INP — değil, sayfa yükleme ve TTFB süresidir).'
      : 'Bu, gerçek bir tarayıcı render süresi değil, düz bir HTTP isteğinin yanıt süresidir. Gerçek render/CWV\'ye yakın ölçüm için "Gerçek Chrome ile render et" seçeneğini kullanın.';

    return {
      id: 'page_speed',
      name,
      category: 'technicalSeo',
      status: score >= 80 ? 'passed' : score >= 50 ? 'warning' : 'failed',
      score: score,
      message: `TTFB: ${ttfb}ms, Toplam Süre: ${loadTime}ms. ${methodNote}`,
      details: {
        ttfb,
        loadTime,
        measurementSource: speedMetrics.source || 'unknown',
        htmlSizeKb: `${htmlSizeKb} KB`,
        externalScripts: scriptCount,
        stylesheets: styleCount,
        images: imageCount
      },
      recommendation: loadTime > 2500 ? 'Gereksiz JavaScript paketlerini erteleyin (defer/async) ve görsel boyutlarını WebP/AVIF formatına optimize edin.' : 'Hız değerleriniz tatmin edici. CDN önbelleklemesiyle bu performansı koruyun.'
    };
  }

  // Statik analiz
  let speedScore = 100;
  const issues = [];
  if (htmlSizeBytes > 300 * 1024) {
    speedScore -= 25;
    issues.push(`Aşırı büyük HTML boyutu (${htmlSizeKb} KB).`);
  }
  if (scriptCount > 25) {
    speedScore -= 20;
    issues.push(`Çok fazla harici script (${scriptCount} adet).`);
  }
  if (styleCount > 10) {
    speedScore -= 10;
    issues.push(`Çok fazla stil dosyası (${styleCount} adet).`);
  }

  return {
    id: 'page_speed',
    name: 'Site Hızı & Kaynak Taraması',
    category: 'technicalSeo',
    status: speedScore >= 75 ? 'passed' : speedScore >= 50 ? 'warning' : 'failed',
    score: speedScore,
    message: issues.length ? issues.join(' ') : `Kaynak yapısı dengeli (${htmlSizeKb} KB HTML, ${scriptCount} script, ${styleCount} css).`,
    details: { htmlSizeKb: `${htmlSizeKb} KB`, scriptCount, styleCount, imageCount },
    recommendation: 'Canlı hız testi için URL ile tarama yapın veya gereksiz JS kütüphanelerini ayıklayın.'
  };
}

// 9. Sticky Telefon CTA
function auditStickyPhoneCTA($) {
  const telLinks = $('a[href^="tel:"]');
  const waLinks = $('a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="api.whatsapp.com"]');
  
  const stickyPhoneElements = $(
    '[class*="sticky-call"], [class*="fixed-call"], [class*="floating-phone"], [class*="whatsapp-float"], [class*="sticky-phone"], [class*="floating-whatsapp"]'
  );

  let detectedType = null;
  let detectedHref = '';

  if (telLinks.length > 0) {
    detectedType = 'Telefon Arama';
    detectedHref = telLinks.first().attr('href');
  } else if (waLinks.length > 0) {
    detectedType = 'WhatsApp Canlı Destek';
    detectedHref = waLinks.first().attr('href');
  }

  const isSticky = stickyPhoneElements.length > 0 || $('body').html().includes('position: fixed') || $('body').html().includes('position:fixed');

  if (detectedType && (isSticky || stickyPhoneElements.length > 0)) {
    return {
      id: 'sticky_phone_cta',
      name: 'Sticky Telefon / WhatsApp CTA',
      category: 'conversionUx',
      status: 'passed',
      score: 100,
      message: `Ekran üzerinde sabit duran doğrudan iletişim butonu mevcut: ${detectedType} (${detectedHref}).`,
      details: { type: detectedType, href: detectedHref },
      recommendation: 'Özellikle mobil cihazlarda baş parmak erişim alanında (alt sağ/sol) yer aldığını teyit edin.'
    };
  } else if (detectedType && !isSticky) {
    return {
      id: 'sticky_phone_cta',
      name: 'Sticky Telefon / WhatsApp CTA',
      category: 'conversionUx',
      status: 'warning',
      score: 65,
      message: `Telefon veya WhatsApp linki (${detectedHref}) bulundu ancak ekranda sabit (sticky/floating) değil.`,
      details: { type: detectedType, href: detectedHref },
      recommendation: 'Kullanıcının her an sipariş öncesi arayabilmesi için butonu mobil ekranda sabit (sticky) hale getirin.'
    };
  }

  return {
    id: 'sticky_phone_cta',
    name: 'Sticky Telefon / WhatsApp CTA',
    category: 'conversionUx',
    status: 'failed',
    score: 0,
    message: 'Sayfada doğrudan telefon arama (tel:) veya sabit WhatsApp hızlı sipariş butonu bulunamadı.',
    recommendation: 'Pre-checkout tereddütlerini anında çözmek için ekranın altına sabitlenen "Hemen Ara" veya "WhatsApp Destek" butonu ekleyin.'
  };
}

// 10. robots.txt
function auditRobotsTxt(robotsData) {
  if (robotsData && robotsData.content) {
    const content = robotsData.content;
    const hasUserAgent = content.includes('User-agent:');
    const hasSitemap = content.toLowerCase().includes('sitemap:');

    if (hasUserAgent && hasSitemap) {
      return {
        id: 'robots_txt',
        name: 'robots.txt Dosyası',
        category: 'technicalSeo',
        status: 'passed',
        score: 100,
        message: 'robots.txt dosyası mevcut ve sitemap.xml yönlendirmesi doğru tanımlanmış.',
        details: { length: content.length, hasSitemap: true },
        recommendation: 'Disallow kurallarında checkout, sepet ve admin sayfalarının engellendiğini doğrulayın.'
      };
    } else if (hasUserAgent && !hasSitemap) {
      return {
        id: 'robots_txt',
        name: 'robots.txt Dosyası',
        category: 'technicalSeo',
        status: 'warning',
        score: 70,
        message: 'robots.txt mevcut ancak Sitemap yönergesi (Sitemap: https://...) eksik.',
        details: { length: content.length, hasSitemap: false },
        recommendation: 'robots.txt dosyasının en altına `Sitemap: https://alanadiniz.com/sitemap.xml` satırını ekleyin.'
      };
    }
  }

  return {
    id: 'robots_txt',
    name: 'robots.txt Dosyası',
    category: 'technicalSeo',
    status: 'failed',
    score: 0,
    message: 'robots.txt dosyası bulunamadı veya erişilemedi.',
    recommendation: 'Arama motoru botlarının sitenizi doğru taraması için kök dizine standart bir robots.txt yükleyin.'
  };
}

// 11. llms.txt (Modern AI Web Crawler Standard)
function auditLlmsTxt(llmsData) {
  if (llmsData && llmsData.content && llmsData.content.length > 20) {
    return {
      id: 'llms_txt',
      name: 'llms.txt (Yapay Zeka Crawler Dosyası)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: 'Mükemmel! Modern LLM ve yapay zeka ajanları için /llms.txt manifest dosyası hazır ve erişilebilir.',
      details: { length: llmsData.content.length },
      recommendation: 'llms.txt dosyanızda sitenin sunduğu ana hizmetleri, API/dokümantasyon bağlantılarını güncel tutun.'
    };
  }

  return {
    id: 'llms_txt',
    name: 'llms.txt (Yapay Zeka Crawler Dosyası)',
    category: 'technicalSeo',
    status: 'warning',
    score: 30,
    message: 'Yeni nesil /llms.txt dosyası bulunamadı. Yapay zeka ajanları (Claude, Perplexity, GPT) sitenizi özetlerken standart dışı kalabilir.',
    recommendation: 'Fix Studio sekmesinden tek tıkla sitenize özel llms.txt dosyası oluşturup kök dizine yükleyin.'
  };
}

// 12. Benzersiz Meta Başlık (Unique Meta Title)
function auditMetaTitle($) {
  const title = $('title').text().trim();
  const len = title.length;

  if (len >= 40 && len <= 65) {
    return {
      id: 'meta_title',
      name: 'Benzersiz Meta Başlık (<title>)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: `İdeal başlık uzunluğu (${len} karakter): "${title}"`,
      details: { title, length: len },
      recommendation: 'Başlıkta ana hedef kelimenizin ve marka adınızın yer aldığından emin olun.'
    };
  } else if (len > 0 && (len < 40 || len <= 75)) {
    return {
      id: 'meta_title',
      name: 'Benzersiz Meta Başlık (<title>)',
      category: 'technicalSeo',
      status: 'warning',
      score: 75,
      message: `Başlık mevcut ancak uzunluk ideal aralığın (40-60 karakter) biraz dışında (${len} karakter): "${title}"`,
      details: { title, length: len },
      recommendation: len < 40 ? 'Başlığa anahtar kelime veya marka ekleyerek zenginleştirin.' : 'Google SERP mobilde kesilmemesi için 60 karaktere yaklaştırın.'
    };
  } else if (len > 75) {
    return {
      id: 'meta_title',
      name: 'Benzersiz Meta Başlık (<title>)',
      category: 'technicalSeo',
      status: 'warning',
      score: 60,
      message: `Başlık çok uzun (${len} karakter), arama motorlarında kesilecektir: "${title.substring(0, 60)}..."`,
      details: { title, length: len },
      recommendation: 'Başlığı 50-60 karakter aralığına kısaltın.'
    };
  }

  return {
    id: 'meta_title',
    name: 'Benzersiz Meta Başlık (<title>)',
    category: 'technicalSeo',
    status: 'failed',
    score: 0,
    message: 'Kritik SEO Hatası: <title> etiketi bulunamadı veya boş!',
    recommendation: '<head> bölümüne sayfanın amacını ve markayı anlatan benzersiz bir <title> etiketi ekleyin.'
  };
}

// 13. Hızlı Log in / Register Butonları
function auditFastAuthButtons($) {
  const authKeywords = ['giriş yap', 'üye ol', 'kayıt ol', 'hesabım', 'login', 'sign in', 'register', 'sign up', 'profil'];
  const authLinks = $('header a, nav a, .header a, .top-bar a, button, [role="button"]');

  let foundAuth = [];
  authLinks.each((_, el) => {
    const text = $(el).text().trim().toLowerCase();
    const href = ($(el).attr('href') || '').toLowerCase();

    for (const kw of authKeywords) {
      if (text.includes(kw) || href.includes(kw.replace(/\s+/g, ''))) {
        foundAuth.push($(el).text().trim() || kw);
        break;
      }
    }
  });

  const uniqueAuth = [...new Set(foundAuth)];

  if (uniqueAuth.length >= 2) {
    return {
      id: 'fast_auth_buttons',
      name: 'Hızlı Giriş / Üyelik Butonları',
      category: 'conversionUx',
      status: 'passed',
      score: 100,
      message: `Kullanıcı dostu giriş/üyelik butonları header/menüde mevcut: ${uniqueAuth.join(', ')}`,
      details: { buttons: uniqueAuth },
      recommendation: 'Tek tıkla Google / Apple ile hızlı giriş seçeneğinin aktif olduğunu kontrol edin.'
    };
  } else if (uniqueAuth.length === 1) {
    return {
      id: 'fast_auth_buttons',
      name: 'Hızlı Giriş / Üyelik Butonları',
      category: 'conversionUx',
      status: 'warning',
      score: 70,
      message: `Yalnızca tek bir üyelik linki tespit edildi (${uniqueAuth[0]}).`,
      details: { buttons: uniqueAuth },
      recommendation: 'Hem "Giriş Yap" hem de "Üye Ol" butonlarını açıkça göstererek kayıt olma sürtünmesini azaltın.'
    };
  }

  return {
    id: 'fast_auth_buttons',
    name: 'Hızlı Giriş / Üyelik Butonları',
    category: 'conversionUx',
    status: 'failed',
    score: 20,
    message: 'Header veya menüde belirgin Giriş Yap / Üye Ol butonları bulunamadı.',
    recommendation: 'Kullanıcıların sipariş takibi yapabilmesi ve üye olabilmesi için üst menüye hızlı giriş/kayıt butonları ekleyin.'
  };
}

// 14. Meta Açıklama (Meta Description)
function auditMetaDescription($) {
  const desc = $('meta[name="description" i]').attr('content') || '';
  const len = desc.trim().length;

  if (len >= 120 && len <= 165) {
    return {
      id: 'meta_description',
      name: 'Meta Açıklama (<meta name="description">)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: `İdeal meta açıklama uzunluğu (${len} karakter): "${desc}"`,
      details: { description: desc, length: len },
      recommendation: 'Açıklama içerisinde eyleme geçirici bir çağrı (CTA) yer aldığından emin olun.'
    };
  } else if (len >= 60 && len < 120) {
    return {
      id: 'meta_description',
      name: 'Meta Açıklama (<meta name="description">)',
      category: 'technicalSeo',
      status: 'warning',
      score: 75,
      message: `Meta açıklama biraz kısa (${len} karakter). İdeal uzunluk 120-160 karakterdir.`,
      details: { description: desc, length: len },
      recommendation: 'Ürün avantajları ve güven verici unsurlar ekleyerek açıklamayı 140 karaktere yaklaştırın.'
    };
  } else if (len > 165) {
    return {
      id: 'meta_description',
      name: 'Meta Açıklama (<meta name="description">)',
      category: 'technicalSeo',
      status: 'warning',
      score: 70,
      message: `Meta açıklama çok uzun (${len} karakter), Google arama sonuçlarında kesilecektir.`,
      details: { description: desc, length: len },
      recommendation: 'Açıklamayı 155 karakteri aşmayacak şekilde revize edin.'
    };
  }

  return {
    id: 'meta_description',
    name: 'Meta Açıklama (<meta name="description">)',
    category: 'technicalSeo',
    status: 'failed',
    score: 0,
    message: 'Kritik: <meta name="description"> etiketi bulunamadı veya boş!',
    recommendation: 'Tıklama oranını (CTR) artırmak için 120-160 karakterlik cazip bir meta description ekleyin.'
  };
}

// 15. Sosyal Medya Paylaşım Rehberi (Open Graph & Twitter Cards)
function auditSocialSharing($) {
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogUrl = $('meta[property="og:url"]').attr('content');
  const twitterCard = $('meta[name="twitter:card"], meta[property="twitter:card"]').attr('content');
  const twitterImage = $('meta[name="twitter:image"], meta[property="twitter:image"]').attr('content');

  const hasCompleteOG = Boolean(ogTitle && ogImage);
  const hasTwitter = Boolean(twitterCard);

  if (hasCompleteOG && hasTwitter) {
    return {
      id: 'social_sharing',
      name: 'Sosyal Medya Paylaşım Rehberi (OG & Twitter)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: 'Open Graph ve Twitter Card etiketleri eksiksiz yapılandırılmış.',
      details: { ogTitle, ogImage, ogUrl, twitterCard, twitterImage },
      recommendation: 'Paylaşılan og:image görselinin 1200x630px boyutunda ve net olduğundan emin olun.'
    };
  } else if (hasCompleteOG && !hasTwitter) {
    return {
      id: 'social_sharing',
      name: 'Sosyal Medya Paylaşım Rehberi (OG & Twitter)',
      category: 'technicalSeo',
      status: 'warning',
      score: 80,
      message: 'Open Graph etiketleri mevcut ancak twitter:card etiketi eksik.',
      details: { ogTitle, ogImage, ogUrl },
      recommendation: '<meta name="twitter:card" content="summary_large_image"> etiketini ekleyin.'
    };
  } else if (ogTitle && !ogImage) {
    return {
      id: 'social_sharing',
      name: 'Sosyal Medya Paylaşım Rehberi (OG & Twitter)',
      category: 'technicalSeo',
      status: 'warning',
      score: 55,
      message: 'og:title var ancak og:image (sosyal medya önizleme görseli) eksik. WhatsApp ve LinkedIn paylaşımlarında görsel çıkmaz!',
      details: { ogTitle },
      recommendation: '1200x630 piksel boyutunda bir og:image görsel bağlantısı tanımlayın.'
    };
  }

  return {
    id: 'social_sharing',
    name: 'Sosyal Medya Paylaşım Rehberi (OG & Twitter)',
    category: 'technicalSeo',
    status: 'failed',
    score: 0,
    message: 'Open Graph (og:title, og:image) etiketleri tanımlanmamış.',
    recommendation: 'Bağlantı sosyal medyada veya WhatsApp\'ta paylaşıldığında zengin kart çıkması için OG etiketlerini ekleyin.'
  };
}

// 16. Google Harita ve Adres (Local Business & Footer Info)
function auditGoogleMapAndAddress($) {
  const footerText = $('footer, [class*="footer"], #footer, .contact, [class*="contact"]').text().toLowerCase();

  const hasMapIframe = $('iframe[src*="google.com/maps"], iframe[src*="maps.google"]').length > 0;
  const hasMapLink = $('a[href*="google.com/maps"], a[href*="maps.app.goo.gl"]').length > 0;
  
  const addressKeywords = ['mah.', 'mahallesi', 'cad.', 'caddesi', 'sok.', 'sokak', 'no:', 'kat:', 'istanbul', 'ankara', 'izmir', 'bursa', 'türkiye', 'pk:'];
  let foundAddressKw = addressKeywords.filter(kw => footerText.includes(kw));

  const telLink = $('a[href^="tel:"]').length > 0 || footerText.includes('0850') || footerText.includes('+90') || footerText.includes('0212');

  let hasLocalSchema = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const checkLocal = (o) => ['LocalBusiness', 'Store', 'Organization'].includes(o['@type']) && (o.address || o.telephone);
      if (checkLocal(data) || (Array.isArray(data['@graph']) && data['@graph'].some(checkLocal))) {
        hasLocalSchema = true;
      }
    } catch (e) {}
  });

  const addressDetected = foundAddressKw.length >= 2;

  if ((hasMapIframe || hasMapLink || hasLocalSchema) && addressDetected && telLink) {
    return {
      id: 'google_map_address',
      name: 'Google Harita & Açık Adres Bilgisi',
      category: 'legalTrust',
      status: 'passed',
      score: 100,
      message: 'Fiziksel adres, telefon ve Google Harita bağlantısı eksiksiz yer alıyor.',
      details: { hasMap: hasMapIframe || hasMapLink, addressDetected, telLink, hasLocalSchema },
      recommendation: 'Google İşletme Profili (Google Business) bağlantınız ile footer adresinizi birebir eşleştirin.'
    };
  } else if (addressDetected && telLink) {
    return {
      id: 'google_map_address',
      name: 'Google Harita & Açık Adres Bilgisi',
      category: 'legalTrust',
      status: 'warning',
      score: 75,
      message: 'Açık adres ve telefon mevcut ancak Google Harita embed/linki veya LocalBusiness şeması eksik.',
      details: { addressDetected, telLink, hasMap: false },
      recommendation: 'Footer veya iletişim sayfasına Google Haritalar konumu ve LocalBusiness JSON-LD şeması ekleyin.'
    };
  }

  return {
    id: 'google_map_address',
    name: 'Google Harita & Açık Adres Bilgisi',
    category: 'legalTrust',
    status: 'failed',
    score: 25,
    message: 'Sayfada doğrulanabilir şirket adresi veya Google Harita bilgisi tespit edilemedi.',
    recommendation: 'Müşteri güveni ve pre-checkout dönüşüm oranı için footer alanına resmi şirket adresi, telefon ve Google Harita ekleyin.'
  };
}

// 17. Müşteri Yorumları & Değerlendirmeler (Reviews / Social Proof)
function auditCustomerReviews($) {
  let hasRatingSchema = false;
  let schemaRatingValue = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const checkRating = (o) => {
        if (o.aggregateRating) {
          hasRatingSchema = true;
          schemaRatingValue = o.aggregateRating.ratingValue;
        }
      };
      checkRating(data);
      if (Array.isArray(data['@graph'])) data['@graph'].forEach(checkRating);
    } catch (e) {}
  });

  const reviewSelectors = [
    '[class*="review"]', '[class*="yorum"]', '[class*="testimonial"]', 
    '[class*="rating"]', '[class*="degerlendirme"]', '[id*="review"]', 
    '[id*="yorum"]', '.stars', '.trustpilot-widget'
  ];

  const reviewElements = $(reviewSelectors.join(', '));
  const hasHtmlReviews = reviewElements.length > 0;

  if (hasRatingSchema && hasHtmlReviews) {
    return {
      id: 'customer_reviews',
      name: 'Müşteri Yorumları & Değerlendirmeler',
      category: 'conversionUx',
      status: 'passed',
      score: 100,
      message: `Müşteri yorumları ve Google AggregateRating yıldız şeması (Puan: ${schemaRatingValue || '5.0'}) aktif.`,
      details: { hasRatingSchema, schemaRatingValue, htmlElementsCount: reviewElements.length },
      recommendation: 'Yorumlarda fotoğraflı müşteri geri bildirimlerini öne çıkararak dönüşüm oranını artırın.'
    };
  } else if (hasHtmlReviews && !hasRatingSchema) {
    return {
      id: 'customer_reviews',
      name: 'Müşteri Yorumları & Değerlendirmeler',
      category: 'conversionUx',
      status: 'warning',
      score: 75,
      message: 'Müşteri yorum blokları görsel olarak mevcut ancak Google SERP için AggregateRating şeması eksik.',
      details: { htmlElementsCount: reviewElements.length, hasRatingSchema: false },
      recommendation: 'Google arama sonuçlarında sarı yıldızların çıkması için AggregateRating JSON-LD şemasını ekleyin.'
    };
  }

  return {
    id: 'customer_reviews',
    name: 'Müşteri Yorumları & Değerlendirmeler',
    category: 'conversionUx',
    status: 'failed',
    score: 0,
    message: 'Sayfada müşteri yorumu, puanlama rozeti veya kullanıcı değerlendirmesi bulunamadı.',
    recommendation: 'Pre-checkout karar aşamasında olan alıcıların güvenini kazanmak için gerçek müşteri yorumlarını ekleyin.'
  };
}

// 18. Resim Alt Etiketleri (Image Alt Tags)
function auditImageAltTags($) {
  const images = $('img');
  const total = images.length;
  let missingAlt = 0;
  let emptyAlt = 0;
  const missingSample = [];

  images.each((_, el) => {
    const alt = $(el).attr('alt');
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (alt === undefined) {
      missingAlt++;
      if (missingSample.length < 5) missingSample.push(src);
    } else if (alt.trim() === '') {
      emptyAlt++;
    }
  });

  const validAltCount = total - (missingAlt + emptyAlt);
  const ratio = total > 0 ? Math.round((validAltCount / total) * 100) : 100;

  if (total === 0) {
    return {
      id: 'image_alt_tags',
      name: 'Resim Alt Etiketleri (Image Alt Tags)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: 'Sayfada resim bulunmuyor.',
      details: { total: 0 }
    };
  }

  if (missingAlt === 0 && ratio >= 85) {
    return {
      id: 'image_alt_tags',
      name: 'Resim Alt Etiketleri (Image Alt Tags)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: `Mükemmel! Toplam ${total} resmin ${validAltCount} tanesinde açıklayıcı alt etiketi mevcut (%${ratio}).`,
      details: { total, validAltCount, emptyAlt, missingAlt },
      recommendation: 'Alt etiketlerinde ürün adı ve açıklayıcı anahtar kelimeleri doğal şekilde kullanın.'
    };
  } else if (ratio >= 60) {
    return {
      id: 'image_alt_tags',
      name: 'Resim Alt Etiketleri (Image Alt Tags)',
      category: 'technicalSeo',
      status: 'warning',
      score: 70,
      message: `${total} görselden ${missingAlt + emptyAlt} tanesinde alt etiketi eksik veya boş (%${ratio} tamamlandı).`,
      details: { total, missingAlt, emptyAlt, sample: missingSample },
      recommendation: 'Görsel SEO ve ekran okuyucu erişilebilirliği için eksik resimlere açıklayıcı alt metinleri ekleyin.'
    };
  }

  return {
    id: 'image_alt_tags',
    name: 'Resim Alt Etiketleri (Image Alt Tags)',
    category: 'technicalSeo',
    status: 'failed',
    score: 30,
    message: `Kritik: Görsellerin çoğunda alt etiketi eksik (${total} görselden ${missingAlt + emptyAlt} tanesinde alt etiketi eksik veya boş — ${missingAlt} tanesinde alt niteliği hiç yok, ${emptyAlt} tanesinde boş).`,
    details: { total, missingAlt, emptyAlt, sample: missingSample },
    recommendation: 'Tüm ürün ve banner görsellerine arama motorlarının anlayacağı alt etiketleri ekleyin.'
  };
}

// 19. Google Zengin İçerik (Schema.org / JSON-LD / Microdata)
function auditGoogleRichSnippets($) {
  const schemas = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const addType = (item) => {
        if (item && item['@type']) schemas.push(item['@type']);
      };
      addType(data);
      if (Array.isArray(data['@graph'])) {
        data['@graph'].forEach(addType);
      }
    } catch (e) {}
  });

  // Microdata kontrolü
  $('[itemtype]').each((_, el) => {
    const it = $(el).attr('itemtype') || '';
    const clean = it.split('/').pop();
    if (clean) schemas.push(clean);
  });

  const uniqueSchemas = [...new Set(schemas)];
  const hasCommerceSchema = uniqueSchemas.some(s => ['Product', 'Organization', 'LocalBusiness', 'Offer', 'BreadcrumbList'].includes(s));

  if (uniqueSchemas.length >= 2 && hasCommerceSchema) {
    return {
      id: 'google_rich_snippets',
      name: 'Google Zengin İçerik (Schema.org)',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: `Google yapılandırılmış verileri aktif: ${uniqueSchemas.join(', ')}`,
      details: { schemas: uniqueSchemas },
      recommendation: 'Google Zengin Sonuçlar Testi (Rich Results Test) ile şemaların hatasız olduğunu teyit edin.'
    };
  } else if (uniqueSchemas.length > 0) {
    return {
      id: 'google_rich_snippets',
      name: 'Google Zengin İçerik (Schema.org)',
      category: 'technicalSeo',
      status: 'warning',
      score: 65,
      message: `Temel şemalar bulundu (${uniqueSchemas.join(', ')}), ancak Product / Organization gibi kritik e-ticaret şemaları eksik.`,
      details: { schemas: uniqueSchemas },
      recommendation: 'E-ticaret ürün detayları, fiyat ve stok için Product & Offer şemalarını ekleyin.'
    };
  }

  return {
    id: 'google_rich_snippets',
    name: 'Google Zengin İçerik (Schema.org)',
    category: 'technicalSeo',
    status: 'failed',
    score: 0,
    message: 'Sayfada hiçbir Schema.org yapılandırılmış verisi (JSON-LD) bulunamadı.',
    recommendation: 'Google\'da zengin kartlar ve fiyat/stok bilgisi sergilemek için JSON-LD şemaları ekleyin.'
  };
}

// 20. Gizlilik ve Yasal Politika Sayfaları (Tüm Zorunlu Sayfalar)
function auditLegalPrivacyPages($) {
  const links = $('a[href]').map((_, el) => ({
    text: $(el).text().trim().toLowerCase(),
    href: ($(el).attr('href') || '').toLowerCase()
  })).get();

  const requiredPolicies = [
    { id: 'privacy', name: 'Gizlilik Politikası', keywords: ['gizlilik', 'privacy', 'privacy-policy'] },
    { id: 'terms', name: 'Mesafeli Satış Sözleşmesi', keywords: ['mesafeli satış', 'distance sales', 'mesafeli-satis'] },
    { id: 'return', name: 'İade ve Değişim Koşulları', keywords: ['iade', 'iptal', 'değişim', 'return', 'refund'] },
    { id: 'shipping', name: 'Teslimat ve Kargo Bilgileri', keywords: ['teslimat', 'kargo', 'shipping', 'delivery'] },
    { id: 'kvkk', name: 'KVKK / Çerez Politikası', keywords: ['kvkk', 'çerez', 'cookie', 'aydinlatma-metni', 'aydınlatma'] },
    { id: 'tos', name: 'Kullanım Koşulları', keywords: ['kullanım koşulları', 'terms', 'şartlar', 'terms-of-service'] }
  ];

  const foundPolicies = [];
  const missingPolicies = [];

  for (const pol of requiredPolicies) {
    const match = links.find(link => 
      pol.keywords.some(kw => link.text.includes(kw) || link.href.includes(kw.replace(/\s+/g, '-')))
    );
    if (match) {
      foundPolicies.push({ name: pol.name, link: match.href });
    } else {
      missingPolicies.push(pol.name);
    }
  }

  const score = Math.round((foundPolicies.length / requiredPolicies.length) * 100);

  if (missingPolicies.length === 0) {
    return {
      id: 'legal_privacy_pages',
      name: 'Gizlilik & Zorunlu Yasal Sayfalar',
      category: 'legalTrust',
      status: 'passed',
      score: 100,
      message: 'Tüm yasal sayfalar (Gizlilik, Mesafeli Satış, İade, Teslimat, KVKK, Kullanım Koşulları) eksiksiz footer\'da mevcut.',
      details: { foundPolicies, missingPolicies: [] },
      recommendation: 'Sözleşmelerdeki şirket unvanı, MERSİS numarası ve vergi dairesi bilgilerini güncel tutun.'
    };
  } else if (foundPolicies.length >= 3) {
    return {
      id: 'legal_privacy_pages',
      name: 'Gizlilik & Zorunlu Yasal Sayfalar',
      category: 'legalTrust',
      status: 'warning',
      score: score,
      message: `${foundPolicies.length}/${requiredPolicies.length} yasal sayfa bulundu. Eksikler: ${missingPolicies.join(', ')}`,
      details: { foundPolicies, missingPolicies },
      recommendation: `E-ticaret mevzuatına tam uyum için eksik olan sayfaları (${missingPolicies.join(', ')}) footer linklerine ekleyin.`
    };
  }

  return {
    id: 'legal_privacy_pages',
    name: 'Gizlilik & Zorunlu Yasal Sayfalar',
    category: 'legalTrust',
    status: 'failed',
    score: score,
    message: `Kritik Hukuki Risk: Zorunlu e-ticaret sözleşmelerinin çoğu eksik (${missingPolicies.join(', ')}).`,
    details: { foundPolicies, missingPolicies },
    recommendation: 'Mesafeli satış sözleşmesi, KVKK ve iade şartları olmadan online ödeme almak yasal risk oluşturur. Hemen ekleyin.'
  };
}

// 21. Google Search Console Doğrulama & İndekslenme
function auditGoogleSearchConsole($) {
  const gscTag = $('meta[name="google-site-verification"]').attr('content');
  const robotsMeta = $('meta[name="robots" i]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href');

  const hasNoindex = robotsMeta.toLowerCase().includes('noindex');

  if (hasNoindex) {
    return {
      id: 'google_search_console',
      name: 'Google Search Console & İndekslenme',
      category: 'technicalSeo',
      status: 'failed',
      score: 0,
      message: 'KRİTİK HATA: Sayfada `noindex` meta etiketi bulundu! Google bu siteyi indeksleyemez!',
      details: { robotsMeta, canonical },
      recommendation: 'Canlıya geçmeden önce `<meta name="robots" content="noindex">` etiketini derhal kaldırın.'
    };
  }

  if (gscTag && canonical) {
    return {
      id: 'google_search_console',
      name: 'Google Search Console & İndekslenme',
      category: 'technicalSeo',
      status: 'passed',
      score: 100,
      message: 'Search Console doğrulama etiketi ve Canonical linki mevcut. İndekslenme önünde engel yok.',
      details: { gscTag, canonical, robotsMeta: robotsMeta || 'index, follow' },
      recommendation: 'Sitemap dosyanızı Search Console paneline göndererek indeksleme durumunu izleyin.'
    };
  } else if (canonical && !gscTag) {
    return {
      id: 'google_search_console',
      name: 'Google Search Console & İndekslenme',
      category: 'technicalSeo',
      status: 'passed',
      score: 85,
      message: 'Canonical etiketi doğru ve noindex engeli yok. (Search Console doğrulaması DNS veya HTML dosyası ile yapılmış olabilir).',
      details: { canonical, robotsMeta: robotsMeta || 'index, follow' },
      recommendation: 'Search Console mülkünüzün doğrulanmış olduğunu Google panelinden kontrol edin.'
    };
  }

  return {
    id: 'google_search_console',
    name: 'Google Search Console & İndekslenme',
    category: 'technicalSeo',
    status: 'warning',
    score: 60,
    message: 'Canonical etiketi veya Google Site Doğrulama etiketi bulunamadı.',
    recommendation: 'Yinelenen içerik (duplicate content) riskini önlemek için her sayfaya rel="canonical" ekleyin.'
  };
}

// 22. sitemap.xml / site.xml
function auditSitemapXml(sitemapData) {
  if (!sitemapData || !sitemapData.exists) {
    return {
      id: 'sitemap_xml',
      name: 'sitemap.xml / site.xml',
      category: 'technicalSeo',
      status: 'failed',
      score: 0,
      message: 'sitemap.xml veya site.xml dosyasına erişilemedi.',
      recommendation: 'Arama motorlarının tüm ürün ve kategorilerinizi anında keşfetmesi için XML site haritası oluşturun.'
    };
  }

  const content = sitemapData.content || '';
  const isXml = content.includes('<urlset') || content.includes('<sitemapindex');
  const urlCount = (content.match(/<loc>/g) || []).length;
  const isIndex = content.includes('<sitemapindex');

  let score = 40; // dosya erişilebilir (reachable)
  if (isXml) score += 30;
  if (urlCount > 0 || isIndex) score += 30; // içinde gerçekten URL/alt-sitemap var mı (not truncated/empty)

  const missing = [];
  if (!isXml) missing.push('geçerli XML formatı (<urlset>/<sitemapindex>)');
  if (!(urlCount > 0 || isIndex)) missing.push('en az bir <loc> URL girişi (dosya boş veya kesik olabilir)');

  const status = score >= 85 ? 'passed' : score >= 45 ? 'warning' : 'failed';

  return {
    id: 'sitemap_xml',
    name: 'sitemap.xml / site.xml',
    category: 'technicalSeo',
    status,
    score,
    message: missing.length
      ? `sitemap.xml ${score}/100 puan aldı (${sitemapData.url}). Eksik: ${missing.join(', ')}.`
      : `sitemap.xml başarıyla bulundu, geçerli XML formatında ve içeriği doğrulandı (${sitemapData.url}, önizlemede ${urlCount} URL girişi).`,
    details: { url: sitemapData.url, isXml, isIndex, urlsCountInPreview: urlCount },
    recommendation: missing.length
      ? `Skoru artırmak için: ${missing.join(', ')}.`
      : 'Yeni ürünler eklendiğinde site haritasının dinamik güncellendiğinden emin olun.'
  };
}

// Genel SEO Detayları (H1-H6, Dil, Viewport, SSL)
// 23. Erişilebilirlik (WCAG 2.1 AA Heuristik Denetimi)
function auditAccessibilityWcag($) {
  const issues = [];
  let score = 100;

  const deduct = (points, message) => {
    score -= points;
    issues.push(message);
  };

  // 1. <html lang> eksikliği — ekran okuyucular doğru dili telaffuz edemez
  const htmlLang = $('html').attr('lang');
  if (!htmlLang) {
    deduct(12, 'HTML etiketinde lang niteliği eksik (ekran okuyucular dili tanıyamıyor).');
  }

  // 2. Etiketsiz form alanları
  let unlabeledInputs = 0;
  $('input, textarea, select').each((_, el) => {
    const $el = $(el);
    const type = ($el.attr('type') || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'image'].includes(type)) return;
    const id = $el.attr('id');
    const hasLabel = id && $(`label[for="${id}"]`).length > 0;
    const hasAria = $el.attr('aria-label') || $el.attr('aria-labelledby');
    const wrappedInLabel = $el.closest('label').length > 0;
    if (!hasLabel && !hasAria && !wrappedInLabel) unlabeledInputs++;
  });
  if (unlabeledInputs > 0) {
    deduct(Math.min(25, unlabeledInputs * 6), `${unlabeledInputs} adet form alanının ilişkili <label> veya aria-label'ı yok (form doldurma erişilebilirliği risk altında).`);
  }

  // 3. Metinsiz / erişilemez butonlar ve linkler
  let emptyInteractive = 0;
  $('a, button').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    const ariaLabel = $el.attr('aria-label');
    const hasImgAlt = $el.find('img[alt]').filter((_, img) => $(img).attr('alt').trim() !== '').length > 0;
    if (!text && !ariaLabel && !hasImgAlt) emptyInteractive++;
  });
  if (emptyInteractive > 0) {
    deduct(Math.min(20, emptyInteractive * 5), `${emptyInteractive} adet link/buton için okunabilir metin veya aria-label bulunamadı (ekran okuyucuda "bağlantı" olarak duyuruluyor).`);
  }

  // 4. Semantik landmark eksikliği (main, nav, header/footer veya role eşdeğerleri)
  const hasMain = $('main, [role="main"]').length > 0;
  const hasNav = $('nav, [role="navigation"]').length > 0;
  if (!hasMain) {
    deduct(10, 'Sayfada <main> (veya role="main") landmark\'ı eksik — klavye/ekran okuyucu kullanıcıları ana içeriğe hızlı atlayamıyor.');
  }
  if (!hasNav) {
    deduct(6, 'Sayfada <nav> (veya role="navigation") landmark\'ı eksik.');
  }

  // 5. "İçeriğe Geç" (Skip to content) linki
  const hasSkipLink = $('a[href^="#"]').filter((_, el) => {
    const t = $(el).text().toLowerCase();
    return t.includes('içeriğe geç') || t.includes('skip to content') || t.includes('içeriğe atla');
  }).length > 0;
  if (!hasSkipLink) {
    deduct(8, '"İçeriğe Geç" (skip to content) bağlantısı bulunamadı — klavye kullanıcıları her sayfada menüyü baştan tab\'lamak zorunda kalıyor.');
  }

  // 6. Pozitif tabindex kullanımı (anti-pattern, klavye gezinme sırasını bozar)
  const positiveTabindex = $('[tabindex]').filter((_, el) => parseInt($(el).attr('tabindex'), 10) > 0).length;
  if (positiveTabindex > 0) {
    deduct(8, `${positiveTabindex} elementte pozitif tabindex kullanılmış — doğal klavye gezinme sırasını bozarak kafa karıştırıyor.`);
  }

  // 7. Başlık (title) attribute'u olmayan iframe'ler
  const untitledIframes = $('iframe').filter((_, el) => !$(el).attr('title')).length;
  if (untitledIframes > 0) {
    deduct(6, `${untitledIframes} adet <iframe> için title niteliği eksik.`);
  }

  // 8. Yinelenen id değerleri (aria-* referanslarını ve form etiketlemesini bozar)
  const idMap = {};
  $('[id]').each((_, el) => {
    const id = $(el).attr('id');
    idMap[id] = (idMap[id] || 0) + 1;
  });
  const duplicateIds = Object.values(idMap).filter(c => c > 1).length;
  if (duplicateIds > 0) {
    deduct(6, `${duplicateIds} adet tekrarlanan id değeri tespit edildi (aria-labelledby/for ilişkilerini bozabilir).`);
  }

  // 9. Kontrolsüz otomatik oynatılan medya (nöbetçi/dikkat dağıtıcı içerik riski)
  const autoplayMedia = $('video[autoplay]:not([muted]), audio[autoplay]:not([muted])').length;
  if (autoplayMedia > 0) {
    deduct(5, `${autoplayMedia} adet ses açık şekilde otomatik oynatılan medya öğesi bulundu (WCAG 1.4.2 ihlali riski).`);
  }

  score = Math.max(0, Math.round(score));
  const status = score >= 85 ? 'passed' : score >= 55 ? 'warning' : 'failed';

  return {
    id: 'accessibility_wcag',
    name: 'Erişilebilirlik (WCAG 2.1 AA)',
    category: 'accessibility',
    status,
    score,
    message: issues.length
      ? `${issues.length} erişilebilirlik bulgusu tespit edildi: ${issues[0]}`
      : 'Statik analizde önemli bir WCAG ihlali tespit edilmedi. Renk kontrastı ve klavye gezinmesini manuel test etmenizi öneririz.',
    details: { issues, checkedRules: 9 },
    recommendation: issues.length
      ? 'Kurumsal/B2B müşteriler ve kamu ihaleleri için WCAG 2.1 AA uyumluluğu artık aranan bir kriterdir. Yukarıdaki bulguları önceliklendirip düzeltin; ardından axe DevTools veya Lighthouse Accessibility denetimiyle kapsamlı (renk kontrastı dahil) bir test yapın.'
      : 'Temel erişilebilirlik kriterlerini karşılıyorsunuz. Renk kontrastı oranlarını (WCAG AA: metin için en az 4.5:1) ve tam klavye gezinmesini manuel olarak da doğrulayın.'
  };
}

// 24. Checkout Adım Sayacı & Form Alanı Analizi (Dönüşüm Odaklı)
function normalizeFieldText(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[şŞ]/g, 's').replace(/[ığĞ]/g, (m) => (m === 'ğ' || m === 'Ğ' ? 'g' : 'i'))
    .replace(/[İI]/g, 'i').replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u').replace(/[çÇ]/g, 'c')
    .replace(/[_\-.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const UNNECESSARY_FIELD_PATTERNS = [
  { test: /fax/i, reason: 'Faks numarası günümüz e-ticaretinde kullanılmıyor, doldurma süresini uzatıyor.' },
  { test: /tc\s*kimlik|tckn|kimlik\s*no/i, reason: 'TC Kimlik No zorunlu değilse istenmemeli (yalnızca kurumsal e-fatura seçilirse gerekir).' },
  { test: /meslek|occupation/i, reason: 'Meslek bilgisi satın alma işlemiyle ilgisiz, terk oranını artırır.' },
  { test: /dogum\s*tarihi|birthdate|birth.?day/i, reason: 'Doğum tarihi (yaş doğrulaması gerekmiyorsa) checkout\'ta gereksiz bir alan.' },
  { test: /cinsiyet|gender/i, reason: 'Cinsiyet bilgisi çoğu üründe sipariş süreci için gerekli değil.' },
  { test: /sifre\s*tekrar|password.?confirm|sifre\s*onay/i, reason: 'Şifre tekrar alanı misafir/guest checkout\'ta hiç istenmemeli.' },
  { test: /ikinci\s*telefon|alternatif\s*telefon/i, reason: 'İkinci telefon numarası nadiren gerekli, form uzunluğunu artırıyor.' },
  { test: /^unvan$|title\b/i, reason: 'Unvan (Sayın/Bay/Bayan) alanı satın alma sürecinde gereksiz sürtünme yaratır.' },
];

function auditCheckoutFunnel($, siteUrl, urlPath) {
  const bodyText = ($('body').text() || '').toLowerCase();
  const htmlLower = ($.html() || '').toLowerCase();
  const path = (urlPath || siteUrl || '').toLowerCase();

  const looksLikeCheckout = /sepet|cart|checkout|odeme|ödeme|siparis|order/.test(path) ||
    /sepetim|siparişi tamamla|ödemeye geç|proceed to checkout|place order/.test(bodyText);

  // 1. Adım göstergesi (step indicator) tespiti
  const stepSelectors = [
    '[class*="checkout-step"]', '[class*="step-indicator"]', '[class*="steps-bar"]',
    'ol.steps li', 'ul.steps li', '[class*="progress-step"]', '[data-step]', '[class*="wizard-step"]'
  ];
  let stepElements = $();
  stepSelectors.forEach(sel => { stepElements = stepElements.add($(sel)); });
  const stepLabels = stepElements
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(t => t && t.length < 40);
  const detectedStepCount = stepElements.length;

  // 2. Form alanı analizi (checkout / sepet formu varsayılan olarak sayfadaki tüm formlar)
  const formFields = $('form input, form select, form textarea').filter((_, el) => {
    const type = ($(el).attr('type') || '').toLowerCase();
    return !['hidden', 'submit', 'button', 'checkbox'].includes(type) || $(el).attr('name');
  });

  const flaggedFields = [];
  formFields.each((_, el) => {
    const $el = $(el);
    const label = $el.attr('name') || $el.attr('id') || $el.attr('placeholder') || '';
    const $label = $el.attr('id') ? $(`label[for="${$el.attr('id')}"]`).text() : '';
    const haystack = normalizeFieldText(`${label} ${$label}`);
    for (const pattern of UNNECESSARY_FIELD_PATTERNS) {
      if (pattern.test.test(haystack)) {
        flaggedFields.push({ field: label || '(isimsiz alan)', reason: pattern.reason });
        break;
      }
    }
  });

  const totalFields = formFields.length;
  const requiredFields = formFields.filter((_, el) => $(el).attr('required') !== undefined || $(el).attr('aria-required') === 'true').length;

  // 3. Misafir (guest) checkout imkanı
  const hasGuestCheckout = /misafir|üye olmadan|guest checkout|kayıt olmadan devam/.test(bodyText);
  const forcesAccountCreation = /(üye ol|kayıt ol|sign up|register)/.test(bodyText) && !hasGuestCheckout && /şifre|password/.test(bodyText);

  // Skor hesaplama
  let score = 100;
  const issues = [];

  if (!looksLikeCheckout) {
    return {
      id: 'checkout_funnel',
      name: 'Checkout Adım Sayacı & Form Analizi',
      category: 'conversionUx',
      status: 'warning',
      score: 60,
      message: 'Bu sayfa bir sepet/checkout sayfası gibi görünmüyor, bu yüzden adım ve form analizi sınırlı yapıldı.',
      details: { looksLikeCheckout, detectedStepCount, stepLabels, totalFields, requiredFields, flaggedFields, hasGuestCheckout, forcesAccountCreation },
      recommendation: 'Bu analizden tam verim almak için doğrudan sepet veya ödeme (checkout) sayfasının URL\'ini ya da HTML\'ini denetleyin.'
    };
  }

  if (detectedStepCount === 0) {
    score -= 15;
    issues.push('Sayfada net bir "adım göstergesi" (1. Sepet, 2. Adres, 3. Ödeme gibi) bulunamadı — kullanıcı sürecin ne kadar sürdüğünü bilmiyor.');
  } else if (detectedStepCount > 4) {
    score -= 15;
    issues.push(`${detectedStepCount} adım tespit edildi — 4'ten fazla adım terk oranını artırır, tek sayfa (one-page) checkout'a geçmeyi değerlendirin.`);
  }

  if (totalFields > 12) {
    score -= 20;
    issues.push(`Formda ${totalFields} alan var — araştırmalar 8-10 alanın üzerinin sepet terkini artırdığını gösteriyor.`);
  }

  if (flaggedFields.length > 0) {
    score -= Math.min(30, flaggedFields.length * 8);
    issues.push(`${flaggedFields.length} adet muhtemelen gereksiz form alanı tespit edildi (aşağıda listelenmiştir).`);
  }

  if (forcesAccountCreation) {
    score -= 20;
    issues.push('Sipariş öncesi zorunlu üyelik/hesap oluşturma tespit edildi — bu, sepet terkinin en yaygın nedenlerinden biridir.');
  }

  score = Math.max(0, Math.round(score));
  const status = score >= 85 ? 'passed' : score >= 55 ? 'warning' : 'failed';

  return {
    id: 'checkout_funnel',
    name: 'Checkout Adım Sayacı & Form Analizi',
    category: 'conversionUx',
    status,
    score,
    message: issues.length
      ? issues[0]
      : `Checkout akışı dengeli görünüyor: ${detectedStepCount || 1} adım, ${totalFields} form alanı.`,
    details: {
      looksLikeCheckout,
      detectedStepCount,
      stepLabels,
      totalFields,
      requiredFields,
      flaggedFields,
      hasGuestCheckout,
      forcesAccountCreation,
      allIssues: issues
    },
    recommendation: flaggedFields.length > 0
      ? `Şu alanları kaldırmayı veya opsiyonel yapmayı değerlendirin: ${flaggedFields.map(f => f.field).join(', ')}. Her kaldırılan gereksiz alan ortalama %2-4 dönüşüm artışı sağlayabilir.`
      : 'Checkout akışınızı düzenli olarak gerçek kullanıcılarla (5 saniye testi) deneyerek gereksiz sürtünme noktalarını tespit edin.'
  };
}

function auditSeoDetails($, siteUrl) {
  const h1Elements = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const lang = $('html').attr('lang') || '';
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const isHttps = siteUrl ? siteUrl.startsWith('https://') : null;

  return {
    h1: {
      count: h1Elements.length,
      values: h1Elements,
      status: h1Elements.length === 1 ? 'optimal' : h1Elements.length === 0 ? 'missing' : 'multiple'
    },
    headings: {
      h2Count,
      h3Count
    },
    htmlLang: lang,
    viewport: viewport,
    canonical: canonical,
    isHttps: isHttps
  };
}

// Skor Hesaplama Motoru
function calculateScores(results) {
  let passed = 0;
  let warning = 0;
  let failed = 0;

  const categories = {
    preCheckout: [],
    technicalSeo: [],
    legalTrust: [],
    conversionUx: [],
    accessibility: []
  };

  for (const key in results.checklist) {
    const item = results.checklist[key];
    if (item.status === 'passed') passed++;
    else if (item.status === 'warning') warning++;
    else failed++;

    if (categories[item.category]) {
      categories[item.category].push(item.score);
    }
  }

  const calcAvg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  results.summary = {
    passed,
    warning,
    failed,
    total: Object.keys(results.checklist).length
  };

  results.scores.preCheckout = calcAvg(categories.preCheckout);
  results.scores.technicalSeo = calcAvg(categories.technicalSeo);
  results.scores.legalTrust = calcAvg(categories.legalTrust);
  results.scores.conversionUx = calcAvg(categories.conversionUx);
  results.scores.accessibility = calcAvg(categories.accessibility);

  // Ağırlıklı genel skor
  results.scores.overall = Math.round(
    (results.scores.preCheckout * 0.25) +
    (results.scores.technicalSeo * 0.25) +
    (results.scores.legalTrust * 0.15) +
    (results.scores.conversionUx * 0.15) +
    (results.scores.accessibility * 0.2)
  );
}

// Yapısal olarak imkansıza yakın bir kombinasyon tespit edilirse (ör. sıfır iç link +
// sıfır görsel + meta açıklaması yok + hiç schema yok), taranan HTML muhtemelen gerçek
// site değil — bir bot koruması/WAF decoy sayfası, yanlış yönlendirme veya sessizce
// yutulmuş bir hata sonucu boş bırakılmış bir gövde. Bu durumda skoru güvenilir gibi
// sunmak, hiç sonuç üretmemekten daha kötüdür: skoru "hesaplanamadı" olarak işaretleyip
// kullanıcıyı açıkça uyarıyoruz.
function assessResultPlausibility(results) {
  const internalCount = results.checklist.internal_linking?.details?.internalCount ?? null;
  const imageCount = results.checklist.image_alt_tags?.details?.total ?? null;
  const hasMetaDescription = !!(results.checklist.meta_description?.details?.description);
  const schemaCount = results.checklist.google_rich_snippets?.details?.schemas?.length ?? 0;
  const hasRobotsTxt = results.checklist.robots_txt?.status !== 'failed';
  const hasSitemap = results.checklist.sitemap_xml?.status !== 'failed';

  const redFlags = [];
  if (internalCount === 0) redFlags.push('sıfır iç link');
  if (imageCount === 0) redFlags.push('sıfır görsel');
  if (!hasMetaDescription) redFlags.push('meta açıklama yok');
  if (schemaCount === 0) redFlags.push('hiç schema.org verisi yok');
  if (!hasRobotsTxt) redFlags.push('robots.txt erişilemedi');
  if (!hasSitemap) redFlags.push('sitemap.xml erişilemedi');

  // Tek tek bu bulguların her biri gerçek (ve zayıf) bir sitede de görülebilir — asıl
  // güçlü sinyal, hepsinin AYNI ANDA görülmesi: gerçek, aktif bir e-ticaret sitesinde
  // bu kombinasyon pratikte neredeyse hiç olmaz.
  if (redFlags.length >= 4) {
    results.scoreUnreliable = true;
    results.reliabilityWarning =
      `Bu taramanın sonuçları güvenilir görünmüyor: ${redFlags.join(', ')} aynı anda tespit edildi ` +
      `(gerçek, aktif bir site için bu kombinasyon son derece olağandışıdır). Site muhtemelen otomatik ` +
      `tarama isteklerini engelliyor, farklı bir sayfaya yönlendiriyor veya sunucu bu taramayı ` +
      `barındırma altyapınızın IP adresi üzerinden farklı işliyor olabilir. Skor bu yüzden hesaplanmadı — ` +
      `siteyi kendi tarayıcınızda manuel kontrol edin veya farklı bir ağdan/sunucudan tekrar deneyin.`;
    results.scores.overall = null;
  }
}

module.exports = {
  runAudit
};
