import tls from "node:tls";
import { assertSafeDomainTarget, sanitizeDomain } from "./ssrfGuard";

export type SslMonitorResult = {
  sslValid: boolean | null;
  httpsAvailable: boolean | null;
  issuer: string | null;
  subject: string | null;
  validFrom: string | null;
  validTo: string | null;
  daysRemaining: number | null;
  hostnameMatches: boolean | null;
  serialNumber: string | null;
  status: "healthy" | "warning" | "critical" | "expired" | "invalid" | "unknown";
  checkedAt: string;
};

export async function checkSslCertificate(domain: string): Promise<SslMonitorResult> {
  const clean = sanitizeDomain(domain);
  const now = new Date();
  const checkedAt = now.toISOString();

  if (!clean) {
    return {
      sslValid: null,
      httpsAvailable: null,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      hostnameMatches: null,
      serialNumber: null,
      status: "unknown",
      checkedAt
    };
  }

  // Enforce SSRF safety before initiating TLS socket connection
  try {
    await assertSafeDomainTarget(clean);
  } catch (securityErr) {
    console.warn(`[sslMonitor] SSRF Security check blocked ${clean}:`, securityErr);
    return {
      sslValid: false,
      httpsAvailable: false,
      issuer: null,
      subject: null,
      validFrom: null,
      validTo: null,
      daysRemaining: null,
      hostnameMatches: false,
      serialNumber: null,
      status: "invalid",
      checkedAt
    };
  }

  return new Promise<SslMonitorResult>((resolve) => {
    let resolved = false;

    const socket = tls.connect(
      {
        host: clean,
        port: 443,
        servername: clean,
        rejectUnauthorized: false,
        timeout: 8000
      },
      () => {
        if (resolved) return;
        resolved = true;

        try {
          const cert = socket.getPeerCertificate(true);
          const isAuthorized = socket.authorized;

          if (!cert || Object.keys(cert).length === 0) {
            socket.destroy();
            return resolve({
              sslValid: false,
              httpsAvailable: true,
              issuer: null,
              subject: null,
              validFrom: null,
              validTo: null,
              daysRemaining: null,
              hostnameMatches: false,
              serialNumber: null,
              status: "invalid",
              checkedAt
            });
          }

          const validFromDate = cert.valid_from ? new Date(cert.valid_from) : null;
          const validToDate = cert.valid_to ? new Date(cert.valid_to) : null;

          let daysRemaining: number | null = null;
          if (validToDate && !isNaN(validToDate.getTime())) {
            const diffMs = validToDate.getTime() - now.getTime();
            daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          }

          // Check subject alt names & CN for hostname matching
          const rawAlt = cert.subjectaltname || "";
          const altNamesStr = Array.isArray(rawAlt) ? rawAlt.join(",") : String(rawAlt);
          const altNames = altNamesStr
            .split(",")
            .map((s) => s.trim().replace(/^DNS:/i, "").toLowerCase());

          const rawCn = cert.subject?.CN;
          const cn = Array.isArray(rawCn) ? rawCn[0]?.toLowerCase() || "" : String(rawCn || "").toLowerCase();

          const hostnameMatches =
            altNames.includes(clean) ||
            cn === clean ||
            (cn.startsWith("*.") && clean.endsWith(cn.slice(2))) ||
            altNames.some(
              (alt) => alt.startsWith("*.") && clean.endsWith(alt.slice(2))
            );

          const sslValid = Boolean(
            isAuthorized &&
              hostnameMatches &&
              daysRemaining !== null &&
              daysRemaining > 0
          );

          // Status determination logic
          let status: SslMonitorResult["status"] = "unknown";
          if (!sslValid) {
            status = daysRemaining !== null && daysRemaining <= 0 ? "expired" : "invalid";
          } else if (daysRemaining !== null) {
            if (daysRemaining <= 7) status = "critical";
            else if (daysRemaining <= 30) status = "warning";
            else status = "healthy";
          }

          const rawIssuer = cert.issuer?.O || cert.issuer?.CN;
          const issuerStr = Array.isArray(rawIssuer) ? rawIssuer.join(", ") : String(rawIssuer || "");

          const rawSubject = cert.subject?.CN || cert.subject?.O;
          const subjectStr = Array.isArray(rawSubject) ? rawSubject.join(", ") : String(rawSubject || "");

          socket.destroy();

          resolve({
            sslValid,
            httpsAvailable: true,
            issuer: issuerStr || null,
            subject: subjectStr || null,
            validFrom: validFromDate ? validFromDate.toISOString() : null,
            validTo: validToDate ? validToDate.toISOString() : null,
            daysRemaining,
            hostnameMatches,
            serialNumber: cert.serialNumber || null,
            status,
            checkedAt
          });
        } catch {
          socket.destroy();
          resolve({
            sslValid: false,
            httpsAvailable: false,
            issuer: null,
            subject: null,
            validFrom: null,
            validTo: null,
            daysRemaining: null,
            hostnameMatches: false,
            serialNumber: null,
            status: "invalid",
            checkedAt
          });
        }
      }
    );

    socket.on("error", () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({
        sslValid: false,
        httpsAvailable: false,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        hostnameMatches: false,
        serialNumber: null,
        status: "invalid",
        checkedAt
      });
    });

    socket.on("timeout", () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({
        sslValid: false,
        httpsAvailable: false,
        issuer: null,
        subject: null,
        validFrom: null,
        validTo: null,
        daysRemaining: null,
        hostnameMatches: false,
        serialNumber: null,
        status: "unknown",
        checkedAt
      });
    });
  });
}
