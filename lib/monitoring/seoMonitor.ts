import https from "node:https";
import http from "node:http";
import { assertSafeDomainTarget } from "./ssrfGuard";

export type SeoCheckResult = {
  // Title
  title: string | null;
  titleLength: number | null;
  titleOk: boolean;

  // Meta Description
  metaDescription: string | null;
  metaDescriptionLength: number | null;
  metaDescriptionOk: boolean;

  // Canonical
  canonicalUrl: string | null;
  canonicalOk: boolean;

  // Robots meta
  robotsMeta: string | null;
  isIndexable: boolean;
  isNoindex: boolean;
  isNofollow: boolean;

  // robots.txt
  robotsTxtExists: boolean;
  robotsTxtContent: string | null;
  robotsTxtBlocksSelf: boolean;

  // Sitemap
  sitemapFound: boolean;
  sitemapUrl: string | null;

  // HTTPS
  httpsRedirects: boolean;
  finalUrl: string | null;

  // www/non-www canonicalization
  wwwCanonical: "www" | "non-www" | "both" | "none" | null;

  // Open Graph
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogUrl: string | null;
  ogType: string | null;
  hasOpenGraph: boolean;

  // Twitter / X Card
  twitterCard: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  twitterImage: string | null;
  hasTwitterCard: boolean;

  // Score
  score: number;
  checks: Array<{ label: string; status: "pass" | "fail" | "warn"; detail?: string }>;
};

function extractMeta(html: string, name: string): string | null {
  // property="og:..." or name="..."
  const propRegex = new RegExp(
    `<meta[^>]+(?:property|name)=["\']${name}["\'][^>]*content=["\']([^"\']*)["\']`,
    "i"
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\']${name}["\']`,
    "i"
  );
  return (
    html.match(propRegex)?.[1] ||
    html.match(contentFirst)?.[1] ||
    null
  );
}

function extractTitle(html: string): string | null {
  return html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() || null;
}

function extractCanonical(html: string): string | null {
  const m = html.match(/<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']*)["\'][^>]*\/?>/i)
    || html.match(/<link[^>]+href=["\']([^"\']*)["\'][^>]*rel=["\']canonical["\'][^>]*\/?>/i);
  return m?.[1] || null;
}

async function fetchHtml(url: string): Promise<{ html: string; finalUrl: string; statusCode: number }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;
    let data = "";

    const req = client.request(
      url,
      {
        method: "GET",
        timeout: 10000,
        headers: {
          "User-Agent": "DomDock-SEO-Checker/1.0 (+https://domdock.io)",
          Accept: "text/html,application/xhtml+xml",
        },
      },
      (res) => {
        const statusCode = res.statusCode || 0;

        // Follow redirects (up to 5)
        if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
          req.destroy();
          const next = new URL(res.headers.location, url).toString();
          fetchHtml(next)
            .then(resolve)
            .catch(reject);
          return;
        }

        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
          // Stop at 200KB to avoid huge payloads
          if (data.length > 200_000) req.destroy();
        });
        res.on("end", () => resolve({ html: data, finalUrl: url, statusCode }));
      }
    );

    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.end();
  });
}

async function fetchText(url: string): Promise<{ text: string; ok: boolean }> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;
    let data = "";

    const req = client.request(url, { method: "GET", timeout: 8000, headers: { "User-Agent": "DomDock-SEO-Checker/1.0" } }, (res) => {
      const ok = (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400;
      res.setEncoding("utf8");
      res.on("data", (c) => { data += c; if (data.length > 50_000) req.destroy(); });
      res.on("end", () => resolve({ text: data, ok }));
    });
    req.on("error", () => resolve({ text: "", ok: false }));
    req.on("timeout", () => { req.destroy(); resolve({ text: "", ok: false }); });
    req.end();
  });
}

export async function checkSeoHealth(domain: string): Promise<SeoCheckResult> {
  const empty: SeoCheckResult = {
    title: null, titleLength: null, titleOk: false,
    metaDescription: null, metaDescriptionLength: null, metaDescriptionOk: false,
    canonicalUrl: null, canonicalOk: false,
    robotsMeta: null, isIndexable: false, isNoindex: false, isNofollow: false,
    robotsTxtExists: false, robotsTxtContent: null, robotsTxtBlocksSelf: false,
    sitemapFound: false, sitemapUrl: null,
    httpsRedirects: false, finalUrl: null,
    wwwCanonical: null,
    ogTitle: null, ogDescription: null, ogImage: null, ogUrl: null, ogType: null, hasOpenGraph: false,
    twitterCard: null, twitterTitle: null, twitterDescription: null, twitterImage: null, hasTwitterCard: false,
    score: 0, checks: [],
  };

  try {
    await assertSafeDomainTarget(domain);
  } catch {
    return empty;
  }

  const checks: Array<{ label: string; status: "pass" | "fail" | "warn"; detail?: string }> = [];

  // Fetch main page
  let html = "";
  let finalUrl = `https://${domain}`;
  let statusCode = 0;
  let httpsRedirects = false;

  try {
    const result = await fetchHtml(`https://${domain}`);
    html = result.html;
    finalUrl = result.finalUrl;
    statusCode = result.statusCode;
    httpsRedirects = finalUrl.startsWith("https://");
  } catch {
    // Try http
    try {
      const result = await fetchHtml(`http://${domain}`);
      html = result.html;
      finalUrl = result.finalUrl;
      statusCode = result.statusCode;
      httpsRedirects = finalUrl.startsWith("https://");
    } catch {
      return { ...empty, score: 0 };
    }
  }

  // Title
  const title = extractTitle(html);
  const titleLength = title?.length ?? null;
  const titleOk = titleLength !== null && titleLength >= 30 && titleLength <= 70;
  checks.push({ label: "Title Tag", status: titleOk ? "pass" : titleLength !== null ? "warn" : "fail", detail: title || "Missing" });

  // Meta Description
  const metaDescription = extractMeta(html, "description");
  const metaDescriptionLength = metaDescription?.length ?? null;
  const metaDescriptionOk = metaDescriptionLength !== null && metaDescriptionLength >= 70 && metaDescriptionLength <= 160;
  checks.push({ label: "Meta Description", status: metaDescriptionOk ? "pass" : metaDescriptionLength !== null ? "warn" : "fail", detail: metaDescription || "Missing" });

  // Canonical
  const canonicalUrl = extractCanonical(html);
  const canonicalOk = canonicalUrl !== null;
  checks.push({ label: "Canonical URL", status: canonicalOk ? "pass" : "fail", detail: canonicalUrl || "Missing" });

  // Robots meta
  const robotsMeta = extractMeta(html, "robots");
  const isNoindex = !!(robotsMeta && /noindex/i.test(robotsMeta));
  const isNofollow = !!(robotsMeta && /nofollow/i.test(robotsMeta));
  const isIndexable = !isNoindex && statusCode < 400;
  checks.push({ label: "Indexability", status: isIndexable ? "pass" : "fail", detail: isNoindex ? "noindex detected" : "Indexable" });
  checks.push({ label: "Robots Meta", status: robotsMeta ? "pass" : "warn", detail: robotsMeta || "Not set (default: index,follow)" });

  // HTTPS
  checks.push({ label: "HTTPS", status: httpsRedirects ? "pass" : "fail", detail: httpsRedirects ? "Served over HTTPS" : "Not HTTPS" });

  // www / non-www canonicalization
  let wwwCanonical: "www" | "non-www" | "both" | "none" | null = null;
  try {
    const [wwwRes, nonWwwRes] = await Promise.allSettled([
      fetchHtml(`https://www.${domain}`),
      fetchHtml(`https://${domain}`),
    ]);
    const wwwFinal = wwwRes.status === "fulfilled" ? wwwRes.value.finalUrl : null;
    const nonWwwFinal = nonWwwRes.status === "fulfilled" ? nonWwwRes.value.finalUrl : null;
    const wwwOk = wwwFinal && !wwwFinal.includes("error");
    const nonWwwOk = nonWwwFinal && !nonWwwFinal.includes("error");
    if (wwwOk && nonWwwOk) {
      const wwwLandsOnWww = wwwFinal!.includes("://www.");
      const nonWwwLandsOnNonWww = !nonWwwFinal!.includes("://www.");
      if (wwwLandsOnWww && nonWwwLandsOnNonWww) wwwCanonical = "both";
      else if (!wwwLandsOnWww && nonWwwLandsOnNonWww) wwwCanonical = "non-www";
      else wwwCanonical = "www";
    } else if (wwwOk) wwwCanonical = "www";
    else if (nonWwwOk) wwwCanonical = "non-www";
    else wwwCanonical = "none";
  } catch { wwwCanonical = null; }
  checks.push({ label: "www Canonicalization", status: wwwCanonical && wwwCanonical !== "both" && wwwCanonical !== "none" ? "pass" : "warn", detail: wwwCanonical || "Unknown" });

  // robots.txt
  const robotsTxtResult = await fetchText(`https://${domain}/robots.txt`);
  const robotsTxtExists = robotsTxtResult.ok && robotsTxtResult.text.length > 0;
  const robotsTxtContent = robotsTxtExists ? robotsTxtResult.text.slice(0, 500) : null;
  // Check if robots.txt blocks self (Disallow: / for all agents)
  const robotsTxtBlocksSelf = !!(robotsTxtContent && /User-agent:\s*\*/i.test(robotsTxtContent) && /Disallow:\s*\//i.test(robotsTxtContent));
  checks.push({ label: "robots.txt", status: robotsTxtExists ? (robotsTxtBlocksSelf ? "fail" : "pass") : "warn", detail: robotsTxtExists ? (robotsTxtBlocksSelf ? "Blocking all crawlers!" : "Found") : "Not found" });

  // Sitemap — first check robots.txt for sitemap directive, then guess
  let sitemapUrl: string | null = null;
  let sitemapFound = false;
  if (robotsTxtContent) {
    const sitemapMatch = robotsTxtContent.match(/Sitemap:\s*(.+)/i);
    if (sitemapMatch) sitemapUrl = sitemapMatch[1].trim();
  }
  if (!sitemapUrl) sitemapUrl = `https://${domain}/sitemap.xml`;
  const sitemapCheck = await fetchText(sitemapUrl);
  sitemapFound = sitemapCheck.ok && sitemapCheck.text.includes("<");
  checks.push({ label: "Sitemap", status: sitemapFound ? "pass" : "warn", detail: sitemapFound ? sitemapUrl : "Not found at /sitemap.xml" });

  // Open Graph
  const ogTitle = extractMeta(html, "og:title");
  const ogDescription = extractMeta(html, "og:description");
  const ogImage = extractMeta(html, "og:image");
  const ogUrl = extractMeta(html, "og:url");
  const ogType = extractMeta(html, "og:type");
  const hasOpenGraph = !!(ogTitle || ogDescription || ogImage);
  checks.push({ label: "Open Graph Tags", status: hasOpenGraph ? (ogTitle && ogDescription && ogImage ? "pass" : "warn") : "fail", detail: hasOpenGraph ? `title, desc, image ${ogImage ? "✓" : "✗"}` : "No OG tags found" });

  // Twitter Card
  const twitterCard = extractMeta(html, "twitter:card");
  const twitterTitle = extractMeta(html, "twitter:title");
  const twitterDescription = extractMeta(html, "twitter:description");
  const twitterImage = extractMeta(html, "twitter:image");
  const hasTwitterCard = !!(twitterCard || twitterTitle);
  checks.push({ label: "Twitter/X Card", status: hasTwitterCard ? "pass" : "warn", detail: twitterCard || "Not configured" });

  // Score calculation
  const scoreMap: Record<string, number> = {
    "Title Tag": 10,
    "Meta Description": 10,
    "Canonical URL": 8,
    "Indexability": 12,
    "Robots Meta": 5,
    "HTTPS": 12,
    "www Canonicalization": 5,
    "robots.txt": 8,
    "Sitemap": 8,
    "Open Graph Tags": 12,
    "Twitter/X Card": 10,
  };
  let score = 0;
  for (const check of checks) {
    if (check.status === "pass") score += scoreMap[check.label] ?? 5;
    else if (check.status === "warn") score += Math.floor((scoreMap[check.label] ?? 5) / 2);
  }
  score = Math.min(100, score);

  return {
    title, titleLength, titleOk,
    metaDescription, metaDescriptionLength, metaDescriptionOk,
    canonicalUrl, canonicalOk,
    robotsMeta, isIndexable, isNoindex, isNofollow,
    robotsTxtExists, robotsTxtContent, robotsTxtBlocksSelf,
    sitemapFound, sitemapUrl,
    httpsRedirects, finalUrl,
    wwwCanonical,
    ogTitle, ogDescription, ogImage, ogUrl, ogType, hasOpenGraph,
    twitterCard, twitterTitle, twitterDescription, twitterImage, hasTwitterCard,
    score, checks,
  };
}
