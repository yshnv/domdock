import { assertSafeDomainTarget, sanitizeDomain } from "./ssrfGuard";
import { fetchRdapData } from "./rdapService";
import { fetchDnsRecords } from "./dnsService";
import { detectDnsProvider } from "./dnsProviderDetector";
import { detectHostingProvider } from "./hostingDetector";
import { checkSslCertificate } from "./sslMonitor";
import { checkWebsiteAvailability } from "./websiteMonitor";
import { calculateDomainHealthScore } from "./healthScoreService";
import { compareSnapshots, DomainMonitoringSnapshot } from "./domainEventService";
import { SupabaseClient } from "@supabase/supabase-js";

export type FullDomainMonitoringResult = {
  domainId: string;
  domainName: string;
  expiresAt: string | null;
  daysUntilExpiry: number | null;
  registrarName: string | null;
  registrarIanaId: string | null;
  registrarUrl: string | null;
  dnsProvider: string | null;
  nameservers: string[];
  dnsRecords: {
    a: string[];
    aaaa: string[];
    mx: Array<{ exchange: string; priority: number }>;
    ns: string[];
    txt: string[];
    cname: string[];
  };
  hostingProvider: string;
  sslValid: boolean | null;
  sslIssuer: string | null;
  sslSubject: string | null;
  sslValidFrom: string | null;
  sslValidTo: string | null;
  sslDaysRemaining: number | null;
  sslHostnameMatches: boolean | null;
  sslSerialNumber: string | null;
  sslStatus: string;
  httpsAvailable: boolean | null;
  websiteOnline: boolean | null;
  websiteStatusCode: number | null;
  websiteResponseTimeMs: number | null;
  websiteFinalUrl: string | null;
  websiteRedirectCount: number;
  websiteStatus: string;
  healthScore: number;
  healthLabel: string;
  healthChecks: Array<{ label: string; status: string; points: number }>;
  lastCheckedAt: string;
};

export async function runFullDomainCheck(
  domainId: string,
  domainName: string,
  supabase: SupabaseClient
): Promise<FullDomainMonitoringResult> {
  const clean = sanitizeDomain(domainName);
  await assertSafeDomainTarget(clean);

  // 1. Run all checks in parallel safely
  const [rdapRes, dnsRes, sslRes, siteRes] = await Promise.all([
    fetchRdapData(clean),
    fetchDnsRecords(clean),
    checkSslCertificate(clean),
    checkWebsiteAvailability(clean)
  ]);

  // 2. Detect Providers
  const dnsProviderInfo = detectDnsProvider(dnsRes.ns);
  const hostingInfo = detectHostingProvider({
    cnameRecords: dnsRes.cname,
    aRecords: dnsRes.a,
    headers: siteRes.headers
  });

  // 3. Expiry Days
  let daysUntilExpiry: number | null = null;
  if (rdapRes.expiresAt) {
    const target = new Date(`${rdapRes.expiresAt}T00:00:00`).getTime();
    if (!isNaN(target)) {
      daysUntilExpiry = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
    }
  }

  // 4. Calculate Health Score
  const healthResult = calculateDomainHealthScore({
    domainActive: true,
    domainDaysRemaining: daysUntilExpiry,
    sslValid: sslRes.sslValid,
    sslDaysRemaining: sslRes.daysRemaining,
    websiteOnline: siteRes.online,
    dnsHealthy: dnsRes.a.length > 0 || dnsRes.aaaa.length > 0 || dnsRes.ns.length > 0
  });

  const checkedAt = new Date().toISOString();

  // 5. Construct current snapshot object
  const currentSnapshot: DomainMonitoringSnapshot = {
    expiresAt: rdapRes.expiresAt,
    registrarName: rdapRes.registrar.registrarName,
    nameservers: dnsProviderInfo.nameservers,
    dnsProvider: dnsProviderInfo.dnsProvider,
    hostingProvider: hostingInfo.hostingProvider,
    sslValid: sslRes.sslValid,
    sslValidTo: sslRes.validTo,
    sslDaysRemaining: sslRes.daysRemaining,
    sslSerialNumber: sslRes.serialNumber,
    websiteOnline: siteRes.online,
    websiteStatusCode: siteRes.statusCode,
    healthScore: healthResult.score
  };

  // 6. Save/Compare Snapshot & Change Events
  try {
    const { data: latestSnapshotRow } = await supabase
      .from("domain_snapshots")
      .select("snapshot_data")
      .eq("domain_id", domainId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousSnapshot = (latestSnapshotRow?.snapshot_data as DomainMonitoringSnapshot) || null;
    const generatedEvents = compareSnapshots(previousSnapshot, currentSnapshot);

    // Save snapshot
    await supabase.from("domain_snapshots").insert({
      domain_id: domainId,
      snapshot_data: currentSnapshot
    });

    // Insert change history events if any occurred
    if (generatedEvents.length > 0) {
      await supabase.from("domain_events").insert(
        generatedEvents.map((evt) => ({
          domain_id: domainId,
          event_type: evt.eventType,
          title: evt.title,
          description: evt.description,
          metadata: evt.metadata || {}
        }))
      );
    }
  } catch (dbErr) {
    console.warn(`[domainService] Snapshot/Event persistence warning for ${domainId}:`, dbErr);
  }

  // 7. Save to domain_monitoring table & update main domains row
  try {
    const monitoringPayload = {
      domain_id: domainId,
      registrar_name: rdapRes.registrar.registrarName,
      registrar_iana_id: rdapRes.registrar.registrarIanaId,
      registrar_url: rdapRes.registrar.registrarUrl,
      dns_provider: dnsProviderInfo.dnsProvider,
      nameservers: dnsProviderInfo.nameservers,
      hosting_provider: hostingInfo.hostingProvider,
      ssl_valid: sslRes.sslValid,
      ssl_issuer: sslRes.issuer,
      ssl_subject: sslRes.subject,
      ssl_valid_from: sslRes.validFrom,
      ssl_valid_to: sslRes.validTo,
      ssl_days_remaining: sslRes.daysRemaining,
      ssl_hostname_matches: sslRes.hostnameMatches,
      ssl_serial_number: sslRes.serialNumber,
      https_available: sslRes.httpsAvailable,
      website_online: siteRes.online,
      website_status_code: siteRes.statusCode,
      website_response_time_ms: siteRes.responseTimeMs,
      website_final_url: siteRes.finalUrl,
      website_redirect_count: siteRes.redirectCount,
      health_score: healthResult.score,
      last_checked_at: checkedAt,
      updated_at: checkedAt
    };

    await supabase.from("domain_monitoring").upsert(monitoringPayload, {
      onConflict: "domain_id"
    });

    // Update root domains table summary columns
    let rootHealth: "healthy" | "warning" | "offline" = "healthy";
    if (siteRes.status === "offline" || (daysUntilExpiry !== null && daysUntilExpiry <= 0)) {
      rootHealth = "offline";
    } else if (
      siteRes.status === "warning" ||
      (daysUntilExpiry !== null && daysUntilExpiry <= 30) ||
      (sslRes.daysRemaining !== null && sslRes.daysRemaining <= 30)
    ) {
      rootHealth = "warning";
    }

    await supabase
      .from("domains")
      .update({
        health: rootHealth,
        expires_at: rdapRes.expiresAt,
        status_code: siteRes.statusCode,
        response_time_ms: siteRes.responseTimeMs,
        dns_records: dnsRes,
        last_checked_at: checkedAt
      })
      .eq("id", domainId);
  } catch (dbErr) {
    console.warn(`[domainService] DB upsert warning for domain ${domainId}:`, dbErr);
  }

  return {
    domainId,
    domainName: clean,
    expiresAt: rdapRes.expiresAt,
    daysUntilExpiry,
    registrarName: rdapRes.registrar.registrarName,
    registrarIanaId: rdapRes.registrar.registrarIanaId,
    registrarUrl: rdapRes.registrar.registrarUrl,
    dnsProvider: dnsProviderInfo.dnsProvider,
    nameservers: dnsProviderInfo.nameservers,
    dnsRecords: dnsRes,
    hostingProvider: hostingInfo.hostingProvider,
    sslValid: sslRes.sslValid,
    sslIssuer: sslRes.issuer,
    sslSubject: sslRes.subject,
    sslValidFrom: sslRes.validFrom,
    sslValidTo: sslRes.validTo,
    sslDaysRemaining: sslRes.daysRemaining,
    sslHostnameMatches: sslRes.hostnameMatches,
    sslSerialNumber: sslRes.serialNumber,
    sslStatus: sslRes.status,
    httpsAvailable: sslRes.httpsAvailable,
    websiteOnline: siteRes.online,
    websiteStatusCode: siteRes.statusCode,
    websiteResponseTimeMs: siteRes.responseTimeMs,
    websiteFinalUrl: siteRes.finalUrl,
    websiteRedirectCount: siteRes.redirectCount,
    websiteStatus: siteRes.status,
    healthScore: healthResult.score,
    healthLabel: healthResult.label,
    healthChecks: healthResult.checks,
    lastCheckedAt: checkedAt
  };
}
