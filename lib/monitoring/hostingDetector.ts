export type HostingDetectionInput = {
  cnameRecords?: string[];
  aRecords?: string[];
  headers?: Record<string, string>;
};

export type HostingDetectionResult = {
  hostingProvider: string;
  confidence: "high" | "medium" | "low" | "none";
};

export function detectHostingProvider(input: HostingDetectionInput): HostingDetectionResult {
  const cnames = (input.cnameRecords || []).map((c) => c.toLowerCase());
  const headers = input.headers || {};
  const serverHeader = (headers["server"] || "").toLowerCase();
  const xPoweredBy = (headers["x-powered-by"] || "").toLowerCase();
  const viaHeader = (headers["via"] || "").toLowerCase();

  // 1. Hostinger
  if (
    cnames.some((c) => c.includes("main-hosting.eu") || c.includes("hostinger")) ||
    headers["x-hostinger-page-cache"] ||
    headers["x-hostinger-cache"] ||
    serverHeader.includes("hostinger") ||
    xPoweredBy.includes("hostinger")
  ) {
    return { hostingProvider: "Hostinger", confidence: "high" };
  }

  // 2. HostingRaja
  if (
    cnames.some((c) => c.includes("hostingraja")) ||
    serverHeader.includes("hostingraja") ||
    xPoweredBy.includes("hostingraja")
  ) {
    return { hostingProvider: "HostingRaja", confidence: "high" };
  }

  // 3. Vercel
  if (
    cnames.some((c) => c.includes("vercel.app") || c.includes("vercel-dns.com")) ||
    headers["x-vercel-id"] ||
    headers["x-vercel-cache"] ||
    serverHeader.includes("vercel")
  ) {
    return { hostingProvider: "Vercel", confidence: "high" };
  }

  // 4. Netlify
  if (
    cnames.some((c) => c.includes("netlify.app") || c.includes("netlify.com")) ||
    headers["x-nf-request-id"] ||
    serverHeader.includes("netlify")
  ) {
    return { hostingProvider: "Netlify", confidence: "high" };
  }

  // 5. GitHub Pages
  if (
    cnames.some((c) => c.includes("github.io")) ||
    headers["x-github-request-id"] ||
    serverHeader.includes("github.com")
  ) {
    return { hostingProvider: "GitHub Pages", confidence: "high" };
  }

  // 6. Cloudflare Pages / Workers
  if (
    cnames.some((c) => c.includes("pages.dev") || c.includes("workers.dev")) ||
    headers["cf-ray"] ||
    serverHeader.includes("cloudflare")
  ) {
    return { hostingProvider: "Cloudflare", confidence: "medium" };
  }

  // 7. AWS (CloudFront / S3 / EC2)
  if (
    cnames.some(
      (c) =>
        c.includes("cloudfront.net") ||
        c.includes("amazonaws.com") ||
        c.includes("elasticbeanstalk.com")
    ) ||
    headers["x-amz-cf-id"] ||
    headers["x-amz-request-id"] ||
    serverHeader.includes("amazons3") ||
    serverHeader.includes("awselb")
  ) {
    return { hostingProvider: "Amazon Web Services (AWS)", confidence: "high" };
  }

  // 8. Google Cloud / Firebase / App Engine
  if (
    cnames.some(
      (c) =>
        c.includes("appspot.com") ||
        c.includes("firebaseapp.com") ||
        c.includes("googleusercontent.com") ||
        c.includes("ghs.googlehosted.com")
    ) ||
    headers["x-cloud-trace-context"] ||
    serverHeader.includes("gws") ||
    serverHeader.includes("gse")
  ) {
    return { hostingProvider: "Google Cloud", confidence: "high" };
  }

  // 9. Azure Web Apps
  if (
    cnames.some((c) => c.includes("azurewebsites.net") || c.includes("cloudapp.net")) ||
    serverHeader.includes("microsoft-iis")
  ) {
    return { hostingProvider: "Microsoft Azure", confidence: "high" };
  }

  // 10. WP Engine
  if (
    cnames.some((c) => c.includes("wpengine.com")) ||
    headers["x-powered-by"]?.includes("wp engine") ||
    headers["wpe-backend"]
  ) {
    return { hostingProvider: "WP Engine", confidence: "high" };
  }

  // 11. Kinsta
  if (
    cnames.some((c) => c.includes("kinsta.cloud")) ||
    headers["x-kinsta-cache"] ||
    headers["kinsta-cache"]
  ) {
    return { hostingProvider: "Kinsta", confidence: "high" };
  }

  // 12. Render
  if (
    cnames.some((c) => c.includes("onrender.com")) ||
    headers["x-render-origin-server"]
  ) {
    return { hostingProvider: "Render", confidence: "high" };
  }

  // 13. Fly.io
  if (cnames.some((c) => c.includes("fly.dev")) || viaHeader.includes("fly.io")) {
    return { hostingProvider: "Fly.io", confidence: "high" };
  }

  // 14. Railway
  if (cnames.some((c) => c.includes("railway.app"))) {
    return { hostingProvider: "Railway", confidence: "high" };
  }

  // 15. SiteGround
  if (
    cnames.some((c) => c.includes("siteground")) ||
    headers["x-sg-cdn"] ||
    xPoweredBy.includes("siteground")
  ) {
    return { hostingProvider: "SiteGround", confidence: "high" };
  }

  // 16. Bluehost / HostGator
  if (cnames.some((c) => c.includes("bluehost.com") || c.includes("hostgator.com"))) {
    return { hostingProvider: "Bluehost / HostGator", confidence: "high" };
  }

  // 17. DigitalOcean
  if (serverHeader.includes("caddy") || xPoweredBy.includes("digitalocean")) {
    return { hostingProvider: "DigitalOcean", confidence: "medium" };
  }

  return { hostingProvider: "Unknown", confidence: "none" };
}
