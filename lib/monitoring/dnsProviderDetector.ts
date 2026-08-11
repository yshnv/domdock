export type DnsProviderResult = {
  dnsProvider: string | null;
  nameservers: string[];
  dnsCheckedAt: string;
};

const DNS_PATTERNS: Array<{ provider: string; pattern: RegExp }> = [
  { provider: "Cloudflare", pattern: /\.ns\.cloudflare\.com$/i },
  { provider: "AWS Route 53", pattern: /\.awsdns-[0-9]{2}\.(org|com|net|co\.uk)$/i },
  { provider: "Google Cloud DNS", pattern: /ns-cloud-[a-z0-9]+\.googledomains\.com$/i },
  { provider: "Google Domains", pattern: /\.googledomains\.com$/i },
  { provider: "GoDaddy", pattern: /\.domaincontrol\.com$/i },
  { provider: "Namecheap", pattern: /\.registrar-servers\.com$/i },
  { provider: "DigitalOcean", pattern: /ns[123]\.digitalocean\.com$/i },
  { provider: "Hetzner", pattern: /\.hetzner\.(com|de)$/i },
  { provider: "Linode / Akamai", pattern: /\.members\.linode\.com$/i },
  { provider: "DNSimple", pattern: /\.dnsimple\.com$/i },
  { provider: "Hover", pattern: /\.hover\.com$/i },
  { provider: "Vercel DNS", pattern: /\.vercel-dns\.com$/i },
  { provider: "Netlify DNS", pattern: /\.nsone\.net$/i },
  { provider: "Hostinger", pattern: /\.dns-parking\.com$/i },
  { provider: "Hostinger", pattern: /\.main-hosting\.eu$/i },
  { provider: "HostingRaja", pattern: /\.hostingraja\.(in|co\.in)$/i },
  { provider: "SiteGround", pattern: /\.siteground\.(biz|site|asia|net)$/i },
  { provider: "Bluehost", pattern: /\.bluehost\.com$/i },
  { provider: "HostGator", pattern: /\.hostgator\.com$/i },
  { provider: "Squarespace", pattern: /\.sqspdns\.com$/i },
  { provider: "Wix", pattern: /\.wixdns\.net$/i },
  { provider: "Shopify", pattern: /\.myshopify\.com$/i },
  { provider: "Porkbun", pattern: /\.porkbun\.com$/i },
  { provider: "Dyn / Oracle", pattern: /\.dynect\.net$/i }
];

export function detectDnsProvider(nameservers: string[]): DnsProviderResult {
  const normalizedNs = nameservers.map((ns) => ns.toLowerCase().trim());

  let detectedProvider: string | null = null;

  for (const ns of normalizedNs) {
    for (const rule of DNS_PATTERNS) {
      if (rule.pattern.test(ns)) {
        detectedProvider = rule.provider;
        break;
      }
    }
    if (detectedProvider) break;
  }

  // Fallback domain extraction if no exact pattern matched
  if (!detectedProvider && normalizedNs.length > 0) {
    const firstNs = normalizedNs[0];
    const parts = firstNs.split(".");
    if (parts.length >= 2) {
      const secondLevelDomain = parts.slice(-2).join(".");
      if (secondLevelDomain.includes("cloudflare")) detectedProvider = "Cloudflare";
      else if (secondLevelDomain.includes("hostinger")) detectedProvider = "Hostinger";
      else if (secondLevelDomain.includes("hostingraja")) detectedProvider = "HostingRaja";
      else if (secondLevelDomain.includes("siteground")) detectedProvider = "SiteGround";
      else if (secondLevelDomain.includes("godaddy")) detectedProvider = "GoDaddy";
    }
  }

  return {
    dnsProvider: detectedProvider || null,
    nameservers: normalizedNs,
    dnsCheckedAt: new Date().toISOString()
  };
}
