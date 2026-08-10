const FETCH_TIMEOUT_MS = 8000;
const SECONDARY_FETCH_TIMEOUT_MS = 4000;
const MAX_BYTES = 512 * 1024; // enough for <head> + most of <body>; avoids buffering huge pages
const USER_AGENT = "Mozilla/5.0 (compatible; StillDreamingAuditBot/1.0)";

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
 * explicit action or a portal signup's own declared website, not a
 * general-purpose fetch proxy.
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

export interface MarketingTech {
  googleAnalytics: boolean;
  googleTagManager: boolean;
  metaPixel: boolean;
}

export interface SocialLinks {
  facebook: string | null;
  instagram: string | null;
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
}

export interface LocalBusinessInfo {
  hasStructuredData: boolean;
  hasMapsEmbed: boolean;
  name: string | null;
  address: string | null;
  phone: string | null;
}

export interface SeoSignals {
  hasMetaDescription: boolean;
  h1Count: number;
  hasOpenGraph: boolean;
  hasCanonical: boolean;
  /** Percentage of <img> tags with a non-empty alt attribute; null if the page has no images. */
  imageAltCoveragePct: number | null;
  hasRobotsTxt: boolean;
  hasSitemap: boolean;
}

export interface SiteSignals {
  ok: boolean;
  status?: number;
  loadTimeMs?: number;
  title?: string | null;
  description?: string | null;
  hasViewportMeta?: boolean;
  hasHttps?: boolean;
  marketingTech?: MarketingTech;
  social?: SocialLinks;
  localBusiness?: LocalBusinessInfo;
  seo?: SeoSignals;
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

async function urlExists(url: string, timeoutMs: number): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": USER_AGENT },
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function detectMarketingTech(html: string): MarketingTech {
  return {
    googleAnalytics: /gtag\(|googletagmanager\.com\/gtag|analytics\.js|['"]G-[A-Z0-9]{6,}['"]|UA-\d{4,}-\d+/i.test(html),
    googleTagManager: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/i.test(html),
    metaPixel: /connect\.facebook\.net\/[^"']+\/fbevents\.js|fbq\(\s*['"]init['"]/i.test(html),
  };
}

const SOCIAL_PATTERNS: { key: keyof SocialLinks; pattern: RegExp }[] = [
  { key: "facebook", pattern: /https?:\/\/(www\.)?facebook\.com\/[^\s"'<>)]+/i },
  { key: "instagram", pattern: /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>)]+/i },
  { key: "linkedin", pattern: /https?:\/\/(www\.)?linkedin\.com\/[^\s"'<>)]+/i },
  { key: "twitter", pattern: /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>)]+/i },
  { key: "youtube", pattern: /https?:\/\/(www\.)?youtube\.com\/[^\s"'<>)]+/i },
  { key: "tiktok", pattern: /https?:\/\/(www\.)?tiktok\.com\/[^\s"'<>)]+/i },
];

function detectSocialLinks(html: string): SocialLinks {
  const result = {} as SocialLinks;
  for (const { key, pattern } of SOCIAL_PATTERNS) {
    const match = html.match(pattern);
    result[key] = match ? match[0].replace(/[.,;]+$/, "") : null;
  }
  return result;
}

function detectLocalBusiness(html: string): LocalBusinessInfo {
  const hasMapsEmbed = /google\.com\/maps\/embed|maps\.google\.com\/maps\?/i.test(html);
  const jsonLdBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        const isBusiness = types.some((t: unknown) => typeof t === "string" && /LocalBusiness|Organization|Restaurant|Store/i.test(t));
        if (isBusiness) {
          const address =
            typeof item.address === "string"
              ? item.address
              : item.address?.streetAddress || null;
          return {
            hasStructuredData: true,
            hasMapsEmbed,
            name: typeof item.name === "string" ? item.name : null,
            address,
            phone: typeof item.telephone === "string" ? item.telephone : null,
          };
        }
      }
    } catch {
      // Malformed JSON-LD on their page — not something we can fix, just skip it.
    }
  }

  return { hasStructuredData: false, hasMapsEmbed, name: null, address: null, phone: null };
}

function computeOnPageSeo(html: string): Pick<SeoSignals, "hasMetaDescription" | "h1Count" | "hasOpenGraph" | "hasCanonical" | "imageAltCoveragePct"> {
  const hasMetaDescription = /<meta[^>]+name=["']description["']/i.test(html);
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const hasOpenGraph = /<meta[^>]+property=["']og:/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);

  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const imagesWithAlt = imgTags.filter((tag) => /\balt=["'][^"']+["']/i.test(tag));
  const imageAltCoveragePct = imgTags.length ? Math.round((imagesWithAlt.length / imgTags.length) * 100) : null;

  return { hasMetaDescription, h1Count, hasOpenGraph, hasCanonical, imageAltCoveragePct };
}

export async function fetchSiteSignals(url: string): Promise<SiteSignals> {
  if (!isSafeAuditUrl(url)) {
    return { ok: false, error: "Unsupported or unsafe URL." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const start = Date.now();

  try {
    const origin = new URL(url).origin;
    const [res, hasRobotsTxt, hasSitemap] = await Promise.all([
      fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": USER_AGENT } }),
      urlExists(`${origin}/robots.txt`, SECONDARY_FETCH_TIMEOUT_MS),
      urlExists(`${origin}/sitemap.xml`, SECONDARY_FETCH_TIMEOUT_MS),
    ]);

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
      marketingTech: detectMarketingTech(html),
      social: detectSocialLinks(html),
      localBusiness: detectLocalBusiness(html),
      seo: { ...computeOnPageSeo(html), hasRobotsTxt, hasSitemap },
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Site fetch failed." };
  } finally {
    clearTimeout(timeout);
  }
}

/** Deterministic 0-100 headline score for the portal KPI row — real signals, not a vibe. */
export function scoreSiteAudit(signals: SiteSignals): number {
  if (!signals.ok) return 0;

  let score = 20;
  if (signals.hasHttps) score += 10;
  if (signals.hasViewportMeta) score += 10;
  if (signals.description) score += 10;
  if (signals.seo?.hasOpenGraph) score += 5;
  if (signals.seo?.hasCanonical) score += 5;
  if (signals.seo?.h1Count === 1) score += 5;
  if (signals.seo?.imageAltCoveragePct != null && signals.seo.imageAltCoveragePct >= 80) score += 5;
  if (signals.seo?.hasRobotsTxt) score += 5;
  if (signals.seo?.hasSitemap) score += 5;
  if (signals.marketingTech?.googleAnalytics || signals.marketingTech?.googleTagManager) score += 10;
  if (signals.marketingTech?.metaPixel) score += 5;

  const socialCount = signals.social ? Object.values(signals.social).filter(Boolean).length : 0;
  score += Math.min(socialCount * 2, 10);

  if (signals.localBusiness?.hasStructuredData || signals.localBusiness?.hasMapsEmbed) score += 5;

  return Math.min(100, score);
}
