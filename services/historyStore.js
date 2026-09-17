const path = require('path');
const Database = require('better-sqlite3');
const urlUtils = require('./urlUtils');

// Local SQLite file. Note (documented for the user): on a host like Render's free
// tier, the filesystem is wiped on every redeploy, so history only persists reliably
// on localhost / a host with a real persistent disk. Accepted tradeoff for now.
const DB_PATH = path.join(__dirname, '..', 'history.db');
const MIN_SECTOR_SAMPLE = 5;

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL,
    url TEXT NOT NULL,
    scanned_at TEXT NOT NULL,
    overall_score INTEGER,
    precheckout_score INTEGER,
    technical_seo_score INTEGER,
    legal_trust_score INTEGER,
    conversion_ux_score INTEGER,
    accessibility_score INTEGER,
    sector TEXT,
    passed_count INTEGER,
    warning_count INTEGER,
    failed_count INTEGER,
    checklist_json TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_scans_domain ON scans(domain);
  CREATE INDEX IF NOT EXISTS idx_scans_sector ON scans(sector);
`);

/**
 * Normalizes a URL down to a bare domain for grouping (strips protocol, "www.",
 * path, query) so https://www.site.com, http://site.com and site.com/urun all
 * bucket into the same history entry — consistent with the normalizeUrl work
 * done earlier for the audit/scoring pipeline.
 */
function domainKey(rawUrl) {
  const parsed = urlUtils.safeParseUrl(rawUrl);
  if (!parsed) return null;
  return parsed.hostname.replace(/^www\./i, '').toLowerCase();
}

/**
 * Records a completed audit result. Deliberately refuses to store results the
 * reliability safety net already flagged as unusable (scoreUnreliable) — a
 * decoy/bot-blocked page's fake data must never pollute trend history or sector
 * averages, the exact same principle as never showing it in a single report.
 */
function recordScan(auditResult, sector = null) {
  if (!auditResult || auditResult.scoreUnreliable) return null;
  const domain = domainKey(auditResult.url);
  if (!domain) return null;

  const checklistSummary = {};
  for (const [id, item] of Object.entries(auditResult.checklist || {})) {
    checklistSummary[id] = item.status;
  }

  const stmt = db.prepare(`
    INSERT INTO scans (
      domain, url, scanned_at, overall_score, precheckout_score, technical_seo_score,
      legal_trust_score, conversion_ux_score, accessibility_score, sector,
      passed_count, warning_count, failed_count, checklist_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    domain,
    auditResult.url,
    auditResult.timestamp || new Date().toISOString(),
    auditResult.scores?.overall ?? null,
    auditResult.scores?.preCheckout ?? null,
    auditResult.scores?.technicalSeo ?? null,
    auditResult.scores?.legalTrust ?? null,
    auditResult.scores?.conversionUx ?? null,
    auditResult.scores?.accessibility ?? null,
    sector || null,
    auditResult.summary?.passed ?? null,
    auditResult.summary?.warning ?? null,
    auditResult.summary?.failed ?? null,
    JSON.stringify(checklistSummary)
  );
  return info.lastInsertRowid;
}

/** All past scans for a domain, most recent first. */
function getHistoryForDomain(rawUrl) {
  const domain = domainKey(rawUrl);
  if (!domain) return [];
  return db.prepare('SELECT * FROM scans WHERE domain = ? ORDER BY scanned_at DESC').all(domain);
}

/**
 * The most recent PRIOR scan for the same domain, strictly before the given
 * timestamp — used to compute "previous vs now" trend deltas right after a new
 * audit completes.
 */
function getPreviousScan(rawUrl, beforeTimestamp) {
  const domain = domainKey(rawUrl);
  if (!domain) return null;
  return db.prepare(
    'SELECT * FROM scans WHERE domain = ? AND scanned_at < ? ORDER BY scanned_at DESC LIMIT 1'
  ).get(domain, beforeTimestamp || new Date().toISOString()) || null;
}

/**
 * Sector average across all stored scans tagged with that sector, EXCLUDING the
 * domain being compared (so a site isn't compared against its own history).
 * Refuses to fabricate an average from too few data points — returns
 * insufficientData instead, mirroring the muzemagaza.com lesson: never present
 * a number that looks authoritative but is actually meaningless.
 */
function getSectorAverage(sector, excludeDomainUrl) {
  if (!sector) return { insufficientData: true, sampleCount: 0, required: MIN_SECTOR_SAMPLE };
  const excludeDomain = excludeDomainUrl ? domainKey(excludeDomainUrl) : null;

  const rows = excludeDomain
    ? db.prepare('SELECT * FROM scans WHERE sector = ? AND domain != ?').all(sector, excludeDomain)
    : db.prepare('SELECT * FROM scans WHERE sector = ?').all(sector);

  // Count distinct domains, not raw scan rows — repeatedly re-scanning the same
  // site shouldn't let it dominate/inflate the "sector" sample size.
  const distinctDomains = new Set(rows.map(r => r.domain));
  if (distinctDomains.size < MIN_SECTOR_SAMPLE) {
    return { insufficientData: true, sampleCount: distinctDomains.size, required: MIN_SECTOR_SAMPLE };
  }

  const avg = (key) => {
    const values = rows.map(r => r[key]).filter(v => v !== null && v !== undefined);
    if (values.length === 0) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  return {
    insufficientData: false,
    sampleCount: distinctDomains.size,
    scores: {
      overall: avg('overall_score'),
      preCheckout: avg('precheckout_score'),
      technicalSeo: avg('technical_seo_score'),
      legalTrust: avg('legal_trust_score'),
      conversionUx: avg('conversion_ux_score'),
      accessibility: avg('accessibility_score')
    }
  };
}

const SECTORS = ['Giyim', 'Kozmetik', 'Elektronik', 'Gıda', 'Mobilya', 'Sağlık & Takviye', 'Genel E-ticaret'];

const SECTOR_KEYWORDS = {
  'Giyim': ['giyim', 'elbise', 'gömlek', 'pantolon', 'tekstil', 'moda', 'ayakkabı', 'çanta', 'aksesuar'],
  'Kozmetik': ['kozmetik', 'makyaj', 'cilt bakım', 'parfüm', 'güzellik', 'krem'],
  'Elektronik': ['elektronik', 'telefon', 'laptop', 'bilgisayar', 'kulaklık', 'teknoloji', 'tablet', 'televizyon'],
  'Gıda': ['gıda', 'market', 'yiyecek', 'içecek', 'kahve', 'çay', 'atıştırmalık'],
  'Mobilya': ['mobilya', 'dekorasyon', 'koltuk', 'yatak', 'mutfak eşyası', 'ev tekstili'],
  'Sağlık & Takviye': ['takviye', 'vitamin', 'sağlık ürünleri', 'eczane', 'bitkisel', 'supplement']
};

/**
 * Cheap keyword heuristic (no AI call — deliberately, given how tight the Gemini
 * free quota already is) to pre-fill a suggested sector in the UI. The user can
 * always override it before/after the scan; this is just a starting guess.
 */
function detectSector(text) {
  const lower = (text || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    const score = keywords.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = sector;
    }
  }
  return best || 'Genel E-ticaret';
}

module.exports = {
  recordScan,
  getHistoryForDomain,
  getPreviousScan,
  getSectorAverage,
  domainKey,
  detectSector,
  SECTORS,
  MIN_SECTOR_SAMPLE
};
