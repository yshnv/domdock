import { NextResponse } from "next/server";
import dns from "node:dns/promises";
import { checkWebsiteAvailability } from "@/lib/monitoring/websiteMonitor";

export type DnsRecords = {
  a: string[];
  aaaa: string[];
  mx: Array<{ exchange: string; priority: number }>;
  ns: string[];
  txt: string[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get("domain");

  if (!domainParam) {
    return NextResponse.json(
      { error: "Domain parameter is required" },
      { status: 400 }
    );
  }

  // Clean domain input (remove protocol, path, port)
  const cleanDomain = domainParam
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");

  if (!cleanDomain) {
    return NextResponse.json(
      { error: "Invalid domain format" },
      { status: 400 }
    );
  }

  // Run RDAP expiration lookup, Website availability check with redirect handling, and DNS resolution in parallel
  const [expiryResult, siteResult, dnsResult] = await Promise.all([
    fetchRdapExpiry(cleanDomain),
    checkWebsiteAvailability(cleanDomain),
    fetchDnsRecords(cleanDomain)
  ]);

  const statusCode = siteResult.statusCode || 200;
  const isHealthy = siteResult.status === "healthy" || (statusCode >= 200 && statusCode < 400);

  return NextResponse.json({
    domain: cleanDomain,
    expiresAt: expiryResult,
    health: isHealthy ? "healthy" : siteResult.status === "offline" ? "offline" : "warning",
    statusCode: statusCode,
    statusText: statusCode >= 300 && statusCode < 400 ? `${statusCode} Redirect (OK)` : `${statusCode} OK`,
    responseTimeMs: siteResult.responseTimeMs,
    redirectCount: siteResult.redirectCount,
    finalUrl: siteResult.finalUrl,
    dnsRecords: dnsResult,
    checkedAt: new Date().toISOString()
  });
}

async function fetchDnsRecords(domain: string): Promise<DnsRecords> {
  try {
    const [a, aaaa, mx, ns, txt] = await Promise.all([
      dns.resolve4(domain).catch(() => []),
      dns.resolve6(domain).catch(() => []),
      dns.resolveMx(domain).catch(() => []),
      dns.resolveNs(domain).catch(() => []),
      dns.resolveTxt(domain).then((entries) => entries.map((e) => e.join(""))).catch(() => [])
    ]);

    return {
      a,
      aaaa,
      mx: mx.map((item: { exchange: string; priority: number }) => ({
        exchange: item.exchange,
        priority: item.priority
      })),
      ns,
      txt
    };
  } catch {
    return { a: [], aaaa: [], mx: [], ns: [], txt: [] };
  }
}

async function fetchRdapExpiry(domain: string): Promise<string | null> {
  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(7000)
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const events: Array<{ eventAction?: string; eventDate?: string }> = data?.events || [];

    // Find expiration event
    const expEvent = events.find(
      (e) =>
        e.eventAction === "expiration" ||
        e.eventAction === "registration expiration" ||
        e.eventAction === "paid-till"
    );

    if (expEvent?.eventDate) {
      return expEvent.eventDate.split("T")[0];
    }
  } catch {
    // Fail gracefully if RDAP server is slow or domain extension isn't supported
  }
  return null;
}
