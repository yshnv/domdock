export type DomainMonitoringSnapshot = {
  expiresAt: string | null;
  registrarName: string | null;
  nameservers: string[];
  dnsProvider: string | null;
  hostingProvider: string | null;
  sslValid: boolean | null;
  sslValidTo: string | null;
  sslDaysRemaining: number | null;
  sslSerialNumber: string | null;
  websiteOnline: boolean | null;
  websiteStatusCode: number | null;
  healthScore: number;
};

export type GeneratedEvent = {
  eventType: string;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export function compareSnapshots(
  prev: DomainMonitoringSnapshot | null,
  curr: DomainMonitoringSnapshot
): GeneratedEvent[] {
  const events: GeneratedEvent[] = [];

  if (!prev) {
    events.push({
      eventType: "DOMAIN_ADDED",
      title: "Domain added",
      description: "Domain monitoring initialized in DomDock."
    });
    return events;
  }

  // 1. Expiration date changed
  if (prev.expiresAt !== curr.expiresAt && curr.expiresAt) {
    events.push({
      eventType: "EXPIRY_CHANGED",
      title: "Expiry date updated",
      description: `Domain expiration date changed from ${prev.expiresAt || "Unknown"} to ${curr.expiresAt}.`,
      metadata: { from: prev.expiresAt, to: curr.expiresAt }
    });
  }

  // 2. Registrar changed
  if (
    prev.registrarName !== curr.registrarName &&
    curr.registrarName &&
    prev.registrarName
  ) {
    events.push({
      eventType: "REGISTRAR_CHANGED",
      title: "Registrar changed",
      description: `Domain registrar transferred from ${prev.registrarName} to ${curr.registrarName}.`,
      metadata: { from: prev.registrarName, to: curr.registrarName }
    });
  }

  // 3. Nameservers changed
  const prevNs = [...(prev.nameservers || [])].sort().join(",");
  const currNs = [...(curr.nameservers || [])].sort().join(",");
  if (prevNs !== currNs && currNs.length > 0) {
    events.push({
      eventType: "NAMESERVERS_CHANGED",
      title: "Nameservers updated",
      description: `Authoritative nameservers were modified.`,
      metadata: { from: prev.nameservers, to: curr.nameservers }
    });
  }

  // 4. DNS Provider changed
  if (
    prev.dnsProvider !== curr.dnsProvider &&
    curr.dnsProvider &&
    prev.dnsProvider
  ) {
    events.push({
      eventType: "DNS_PROVIDER_CHANGED",
      title: "DNS provider changed",
      description: `DNS provider changed from ${prev.dnsProvider} to ${curr.dnsProvider}.`,
      metadata: { from: prev.dnsProvider, to: curr.dnsProvider }
    });
  }

  // 5. Hosting Provider changed
  if (
    prev.hostingProvider !== curr.hostingProvider &&
    curr.hostingProvider &&
    curr.hostingProvider !== "Unknown"
  ) {
    events.push({
      eventType: "HOSTING_PROVIDER_CHANGED",
      title: "Hosting provider detected",
      description: `Hosting provider updated to ${curr.hostingProvider}.`,
      metadata: { from: prev.hostingProvider, to: curr.hostingProvider }
    });
  }

  // 6. SSL Renewed or Expired
  if (prev.sslDaysRemaining !== null && curr.sslDaysRemaining !== null) {
    if (prev.sslDaysRemaining <= 0 && curr.sslDaysRemaining > 0) {
      events.push({
        eventType: "SSL_RENEWED",
        title: "SSL certificate renewed",
        description: `TLS certificate was successfully renewed (${curr.sslDaysRemaining} days remaining).`
      });
    } else if (prev.sslDaysRemaining > 0 && curr.sslDaysRemaining <= 0) {
      events.push({
        eventType: "SSL_EXPIRED",
        title: "SSL certificate expired",
        description: `TLS certificate has expired.`
      });
    } else if (
      prev.sslSerialNumber &&
      curr.sslSerialNumber &&
      prev.sslSerialNumber !== curr.sslSerialNumber
    ) {
      events.push({
        eventType: "SSL_CERTIFICATE_CHANGED",
        title: "SSL certificate replaced",
        description: `A new TLS certificate was issued for the domain.`
      });
    }
  }

  // 7. Website Online / Offline status
  if (prev.websiteOnline !== curr.websiteOnline && curr.websiteOnline !== null) {
    if (curr.websiteOnline) {
      events.push({
        eventType: "WEBSITE_ONLINE",
        title: "Website back online",
        description: `Website responded successfully (HTTP status ${curr.websiteStatusCode || 200}).`
      });
    } else {
      events.push({
        eventType: "WEBSITE_OFFLINE",
        title: "Website offline",
        description: `Website is unreachable or failing to respond.`
      });
    }
  }

  // 8. Health Score Significant Shift
  if (Math.abs(prev.healthScore - curr.healthScore) >= 15) {
    events.push({
      eventType: "DOMAIN_STATUS_CHANGED",
      title: "Health score updated",
      description: `Domain health score changed from ${prev.healthScore} to ${curr.healthScore}.`,
      metadata: { from: prev.healthScore, to: curr.healthScore }
    });
  }

  return events;
}
