import { extractRegistrarFromRdap, RegistrarInfo } from "./registrarDetector";
import { sanitizeDomain } from "./ssrfGuard";

export type RdapResult = {
  expiresAt: string | null;
  registrar: RegistrarInfo;
  rawRdap: Record<string, unknown> | null;
};

export async function fetchRdapData(domain: string): Promise<RdapResult> {
  const clean = sanitizeDomain(domain);
  if (!clean) {
    return {
      expiresAt: null,
      registrar: {
        registrarName: null,
        registrarIanaId: null,
        registrarUrl: null,
        registrarDetectedAt: null
      },
      rawRdap: null
    };
  }

  try {
    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(clean)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) {
      return {
        expiresAt: null,
        registrar: {
          registrarName: null,
          registrarIanaId: null,
          registrarUrl: null,
          registrarDetectedAt: null
        },
        rawRdap: null
      };
    }

    const data = (await res.json()) as Record<string, unknown>;
    const events = (data?.events as Array<{ eventAction?: string; eventDate?: string }>) || [];

    // Find expiration event
    const expEvent = events.find(
      (e) =>
        e.eventAction === "expiration" ||
        e.eventAction === "registration expiration" ||
        e.eventAction === "paid-till"
    );

    let expiresAt: string | null = null;
    if (expEvent?.eventDate) {
      expiresAt = expEvent.eventDate.split("T")[0];
    }

    const registrar = extractRegistrarFromRdap(data);

    return {
      expiresAt,
      registrar,
      rawRdap: data
    };
  } catch (err) {
    console.warn(`[rdapService] RDAP lookup failed for ${clean}:`, err);
    return {
      expiresAt: null,
      registrar: {
        registrarName: null,
        registrarIanaId: null,
        registrarUrl: null,
        registrarDetectedAt: null
      },
      rawRdap: null
    };
  }
}
