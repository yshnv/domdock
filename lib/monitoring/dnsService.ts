import dns from "node:dns/promises";
import { sanitizeDomain } from "./ssrfGuard";

export type DnsRecordsResult = {
  a: string[];
  aaaa: string[];
  mx: Array<{ exchange: string; priority: number }>;
  ns: string[];
  txt: string[];
  cname: string[];
  dmarc: string[];
  dkim: string[];
};

export async function fetchDnsRecords(domain: string): Promise<DnsRecordsResult> {
  const clean = sanitizeDomain(domain);
  if (!clean) {
    return { a: [], aaaa: [], mx: [], ns: [], txt: [], cname: [], dmarc: [], dkim: [] };
  }

  try {
    const dkimSelectors = ['google', 'default', 'mail', 'selector1', 'k1'];
    
    const [a, aaaa, mx, ns, txt, cname, dmarc, ...dkimResults] = await Promise.all([
      dns.resolve4(clean).catch(() => []),
      dns.resolve6(clean).catch(() => []),
      dns.resolveMx(clean).catch(() => []),
      dns.resolveNs(clean).catch(() => []),
      dns.resolveTxt(clean).then((entries) => entries.map((e) => e.join(""))).catch(() => []),
      dns.resolveCname(clean).catch(() => []),
      dns.resolveTxt(`_dmarc.${clean}`).then((entries) => entries.map((e) => e.join(""))).catch(() => []),
      ...dkimSelectors.map(selector => 
        dns.resolveTxt(`${selector}._domainkey.${clean}`)
           .then((entries) => entries.map((e) => e.join("")))
           .catch(() => [])
      )
    ]);

    const dkim = dkimResults.flat();

    return {
      a,
      aaaa,
      mx: mx.map((item) => ({
        exchange: item.exchange.toLowerCase(),
        priority: item.priority
      })),
      ns: ns.map((item) => item.toLowerCase()),
      txt,
      cname: cname.map((item) => item.toLowerCase()),
      dmarc,
      dkim
    };
  } catch {
    return { a: [], aaaa: [], mx: [], ns: [], txt: [], cname: [], dmarc: [], dkim: [] };
  }
}
