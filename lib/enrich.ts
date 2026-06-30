// Optional, best-effort website enrichment (concept step [3]). Fetches the startup site
// and reduces it to plain text so it can be appended to the scoring context. Failures are
// non-fatal — enrichment never blocks intake or scoring.

const MAX_CHARS = 6000;
const FETCH_TIMEOUT_MS = 8000;

export async function enrichFromWebsite(url: string): Promise<string> {
  const normalized = normalizeUrl(url);
  if (!normalized) throw new Error("Ungültige URL.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(normalized, {
      signal: controller.signal,
      headers: { "User-Agent": "BatchScout/0.1 (+concept-prototype)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return htmlToText(html).slice(0, MAX_CHARS);
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return null;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}
