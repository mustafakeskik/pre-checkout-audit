// Shared client-side URL helpers. The backend now always normalizes URLs before
// returning them in `results.url`, but this stays defensive (e.g. for HTML-paste
// audits with no url, or any future caller) so a bad string can never crash a
// render tree via an uncaught `new URL()` exception.

export function safeHostname(url, fallback = 'siteniz.com') {
  if (!url) return fallback;
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(normalized).hostname;
  } catch {
    return fallback;
  }
}

export function safeUrlObject(url) {
  if (!url) return null;
  try {
    const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    return new URL(normalized);
  } catch {
    return null;
  }
}
