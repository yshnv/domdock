import dns from "node:dns/promises";
import net from "node:net";

/**
 * Validates domain format and strips protocols/paths/ports.
 */
export function sanitizeDomain(input: string): string {
  if (!input) return "";
  let clean = input.trim().toLowerCase();
  clean = clean.replace(/^https?:\/\//, "");
  clean = clean.replace(/\/.*$/, "");
  clean = clean.replace(/:\d+$/, "");
  return clean;
}

/**
 * Validates domain format using strict hostname regex.
 */
export function isValidDomainFormat(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  // Prevent localhost or single label hostnames
  if (domain === "localhost" || !domain.includes(".")) return false;
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return domainRegex.test(domain);
}

/**
 * Checks if an IP address is private, loopback, link-local, or cloud metadata address.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  if (!ip) return true;

  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) return true;

    const [a, b] = parts;

    // 0.0.0.0/8 (Current network)
    if (a === 0) return true;
    // 127.0.0.0/8 (Loopback)
    if (a === 127) return true;
    // 10.0.0.0/8 (Private)
    if (a === 10) return true;
    // 172.16.0.0/12 (Private)
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (a === 192 && b === 168) return true;
    // 169.254.0.0/16 (Link-local & AWS/GCP/Azure Metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 100.64.0.0/10 (Shared Address Space)
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (TEST-NET)
    if (a === 192 && b === 0) return true;
    // 224.0.0.0/4 (Multicast) & 240.0.0.0/4 (Reserved)
    if (a >= 224) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();
    // IPv6 Loopback ::1 / 0:0:0:0:0:0:0:1
    if (normalized === "::1" || normalized.endsWith(":1")) return true;
    // IPv6 Unique Local (fc00::/7, fd00::/7)
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
    // IPv6 Link-local (fe80::/10)
    if (normalized.startsWith("fe8")) return true;
    // IPv4-mapped IPv6 (::ffff:127.0.0.1)
    if (normalized.includes("::ffff:")) {
      const ipv4Part = normalized.split("::ffff:")[1];
      if (ipv4Part) return isPrivateOrReservedIp(ipv4Part);
    }
    return false;
  }

  return true;
}

/**
 * Resolves domain IPs and verifies that no IP falls in private/reserved ranges.
 * Throws error if domain targets a restricted target.
 */
export async function assertSafeDomainTarget(domain: string): Promise<string[]> {
  const clean = sanitizeDomain(domain);
  if (!isValidDomainFormat(clean)) {
    throw new Error(`Invalid or prohibited domain format: "${domain}"`);
  }

  const [ipv4s, ipv6s] = await Promise.all([
    dns.resolve4(clean).catch(() => []),
    dns.resolve6(clean).catch(() => [])
  ]);

  const allIps = [...ipv4s, ...ipv6s];

  if (allIps.length === 0) {
    // If DNS doesn't resolve, return empty array (not a direct security violation)
    return [];
  }

  for (const ip of allIps) {
    if (isPrivateOrReservedIp(ip)) {
      throw new Error(
        `Security Error (SSRF Guard): Domain "${clean}" resolves to restricted IP ${ip}`
      );
    }
  }

  return allIps;
}
