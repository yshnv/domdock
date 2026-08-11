export type RegistrarInfo = {
  registrarName: string | null;
  registrarIanaId: string | null;
  registrarUrl: string | null;
  registrarDetectedAt: string | null;
};

/**
 * Extracts registrar details strictly from RDAP entity objects and roles.
 */
export function extractRegistrarFromRdap(rdapData: Record<string, unknown>): RegistrarInfo {
  if (!rdapData) {
    return {
      registrarName: null,
      registrarIanaId: null,
      registrarUrl: null,
      registrarDetectedAt: null
    };
  }

  const entities = (rdapData.entities as Array<Record<string, unknown>>) || [];
  let registrarEntity: Record<string, unknown> | null = null;

  // Search for entity with role "registrar"
  for (const entity of entities) {
    const roles = (entity.roles as string[]) || [];
    if (roles.includes("registrar")) {
      registrarEntity = entity;
      break;
    }
  }

  if (!registrarEntity && entities.length > 0) {
    // Fallback: check if handle or vcard contains registrar hints
    for (const entity of entities) {
      const handle = String(entity.handle || "").toLowerCase();
      if (handle.includes("registrar")) {
        registrarEntity = entity;
        break;
      }
    }
  }

  let registrarName: string | null = null;
  let registrarIanaId: string | null = null;
  let registrarUrl: string | null = null;

  if (registrarEntity) {
    // 1. Extract IANA ID from publicIds
    const publicIds = (registrarEntity.publicIds as Array<{ type?: string; identifier?: string }>) || [];
    const ianaObj = publicIds.find(
      (p) => p.type === "IANA Registrar ID" || p.type === "iana" || p.type?.toLowerCase().includes("iana")
    );
    if (ianaObj?.identifier) {
      registrarIanaId = String(ianaObj.identifier);
    }

    // 2. Extract name from vcardArray
    const vcards = (registrarEntity.vcardArray as unknown[]) || [];
    if (Array.isArray(vcards) && vcards.length > 1 && Array.isArray(vcards[1])) {
      const fields = vcards[1] as Array<unknown[]>;
      for (const f of fields) {
        if (Array.isArray(f) && f.length >= 4) {
          const key = f[0];
          if (key === "fn" || key === "org") {
            const val = String(f[3] || "").trim();
            if (val && !registrarName) {
              registrarName = val;
            }
          }
        }
      }
    }

    // Fallback handle if vcard doesn't supply FN/ORG
    if (!registrarName && registrarEntity.handle) {
      registrarName = String(registrarEntity.handle);
    }

    // 3. Extract URL from links
    const links = (registrarEntity.links as Array<{ href?: string; rel?: string }>) || [];
    const selfLink = links.find((l) => l.rel === "self" || l.rel === "related" || l.href);
    if (selfLink?.href) {
      registrarUrl = selfLink.href;
    }
  }

  // Also check top-level RDAP fields if entity was missing
  if (!registrarName && rdapData.port43) {
    registrarName = String(rdapData.port43).replace(/^whois\./i, "");
  }

  return {
    registrarName: registrarName || null,
    registrarIanaId: registrarIanaId || null,
    registrarUrl: registrarUrl || null,
    registrarDetectedAt: registrarName ? new Date().toISOString() : null
  };
}
