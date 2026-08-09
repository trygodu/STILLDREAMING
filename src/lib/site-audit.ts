const FETCH_TIMEOUT_MS = 8000;
const MAX_BYTES = 512 * 1024; // enough for <head>; avoids buffering huge pages

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // link-local, includes cloud metadata endpoints (169.254.169.254)
  /^\[?::1\]?$/,
  /^\[?fc[0-9a-f]{2}:/i,
  /^\[?fe80:/i,
];

/**
 * Blocks the obvious SSRF targets (loopback, private ranges, link-local /
 * cloud metadata) for a URL a visitor supplied. Not exhaustive (doesn't
 * defend DNS rebinding), but this is only ever fetched on an admin's
 * explicit action for a single stored lead, not a public-facing endpoint.
 */
export function isSafeAuditUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const hostname = parsed.hostname.toLowerCase();
    return !BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
  } catch {
    return false;
  }
}

export interface SiteSignals {
  ok: boolean;
  status?: number;
  loadTimeMs?: number;
  title?: string | null;
  description?: string | null;
  hasViewportMeta?: boolean;
  hasHttps?: boolean;
  error?: string;
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < maxBytes) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
    }
  }
  reader.cancel().catch(() => {});
  return Buffer.concat(chunks).toString("utf-8", 0, maxBytes);
}

export async function fetchSiteSignals(url: string): Promise<SiteSignals> {
  if (!isSafeAuditUrl(url)) {
    return { ok: false, error: "Unsupported or unsafe URL." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const start = Date.now();

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; StillDreamingAuditBot/1.0)" },
    });
    const html = await readCapped(res, MAX_BYTES);
    const loadTimeMs = Date.now() - start;

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);

    return {
      ok: res.ok,
      status: res.status,
      loadTimeMs,
      title: titleMatch?.[1]?.trim() || null,
      description: descMatch?.[1]?.trim() || null,
      hasViewportMeta,
      hasHttps: url.startsWith("https://"),
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Site fetch failed." };
  } finally {
    clearTimeout(timeout);
  }
}
