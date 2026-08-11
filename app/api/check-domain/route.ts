import { NextResponse } from "next/server";
import dns from "node:dns/promises";

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

  // Run RDAP expiration lookup, Website status check, and DNS resolution in parallel
  const [expiryResult, siteResult, dnsResult] = await Promise.all([
    fetchRdapExpiry(cleanDomain),
    checkWebsiteStatus(cleanDomain),
    fetchDnsRecords(cleanDomain)
  ]);

  return NextResponse.json({
    domain: cleanDomain,
    expiresAt: expiryResult,
    health: siteResult.health,
    statusCode: siteResult.statusCode,
    statusText: siteResult.statusText,
    responseTimeMs: siteResult.responseTimeMs,
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
      // Return ISO date portion (YYYY-MM-DD)
      return expEvent.eventDate.split("T")[0];
    }
  } catch {
    // Fail gracefully if RDAP server is slow or domain extension isn't supported by RDAP
  }
  return null;
}

async function checkWebsiteStatus(domain: string): Promise<{
  health: "healthy" | "warning" | "offline";
  statusCode: number;
  statusText: string;
  responseTimeMs: number | null;
}> {
  const start = Date.now();

  // Try HTTPS first
  try {
    const res = await fetch(`https://${domain}`, {
      method: "GET",
      signal: AbortSignal.timeout(6000),
      headers: {
        "User-Agent": "DomDock-Status-Checker/1.0"
      }
    });

    const duration = Date.now() - start;
    const isOk = res.ok || (res.status >= 200 && res.status < 400);

    return {
      health: isOk ? "healthy" : "warning",
      statusCode: res.status,
      statusText: `${res.status} ${res.statusText || (isOk ? "OK" : "Error")}`,
      responseTimeMs: duration
    };
  } catch {
    // Try HTTP fallback if HTTPS fails
    try {
      const httpStart = Date.now();
      const resHttp = await fetch(`http://${domain}`, {
        method: "GET",
        signal: AbortSignal.timeout(6000),
        headers: {
          "User-Agent": "DomDock-Status-Checker/1.0"
        }
      });

      const duration = Date.now() - httpStart;
      const isOk = resHttp.ok || (resHttp.status >= 200 && resHttp.status < 400);

      return {
        health: isOk ? "healthy" : "warning",
        statusCode: resHttp.status,
        statusText: `${resHttp.status} ${resHttp.statusText || (isOk ? "OK" : "Error")}`,
        responseTimeMs: duration
      };
    } catch {
      return {
        health: "offline",
        statusCode: 0,
        statusText: "Offline / Unreachable",
        responseTimeMs: null
      };
    }
  }
}
