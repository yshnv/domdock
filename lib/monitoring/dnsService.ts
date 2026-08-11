import dns from "node:dns/promises";
import { sanitizeDomain } from "./ssrfGuard";

export type DnsRecordsResult = {
  a: string[];
  aaaa: string[];
  mx: Array<{ exchange: string; priority: number }>;
  ns: string[];
  txt: string[];
  cname: string[];
};

export async function fetchDnsRecords(domain: string): Promise<DnsRecordsResult> {
  const clean = sanitizeDomain(domain);
  if (!clean) {
    return { a: [], aaaa: [], mx: [], ns: [], txt: [], cname: [] };
  }

  try {
    const [a, aaaa, mx, ns, txt, cname] = await Promise.all([
      dns.resolve4(clean).catch(() => []),
      dns.resolve6(clean).catch(() => []),
      dns.resolveMx(clean).catch(() => []),
      dns.resolveNs(clean).catch(() => []),
      dns.resolveTxt(clean).then((entries) => entries.map((e) => e.join(""))).catch(() => []),
      dns.resolveCname(clean).catch(() => [])
    ]);

    return {
      a,
      aaaa,
      mx: mx.map((item) => ({
        exchange: item.exchange.toLowerCase(),
        priority: item.priority
      })),
      ns: ns.map((item) => item.toLowerCase()),
      txt,
      cname: cname.map((item) => item.toLowerCase())
    };
  } catch {
    return { a: [], aaaa: [], mx: [], ns: [], txt: [], cname: [] };
  }
}
