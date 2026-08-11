import https from "node:https";
import http from "node:http";
import { assertSafeDomainTarget, sanitizeDomain } from "./ssrfGuard";

export type WebsiteMonitorResult = {
  online: boolean | null;
  statusCode: number | null;
  responseTimeMs: number | null;
  finalUrl: string | null;
  redirectCount: number;
  headers: Record<string, string>;
  status: "healthy" | "warning" | "offline" | "unknown";
  checkedAt: string;
};

export async function checkWebsiteAvailability(domain: string): Promise<WebsiteMonitorResult> {
  const clean = sanitizeDomain(domain);
  const checkedAt = new Date().toISOString();

  if (!clean) {
    return {
      online: null,
      statusCode: null,
      responseTimeMs: null,
      finalUrl: null,
      redirectCount: 0,
      headers: {},
      status: "unknown",
      checkedAt
    };
  }

  const start = Date.now();

  try {
    const result = await fetchWithRedirectGuard(`https://${clean}`, 0, 5);
    const duration = Date.now() - start;

    const isOk = result.statusCode >= 200 && result.statusCode < 400;

    return {
      online: isOk || result.statusCode > 0,
      statusCode: result.statusCode,
      responseTimeMs: duration,
      finalUrl: result.finalUrl,
      redirectCount: result.redirectCount,
      headers: result.headers,
      status: isOk ? "healthy" : result.statusCode >= 400 ? "warning" : "offline",
      checkedAt
    };
  } catch {
    // Fallback attempt over HTTP if HTTPS fails completely
    try {
      const httpStart = Date.now();
      const resultHttp = await fetchWithRedirectGuard(`http://${clean}`, 0, 5);
      const durationHttp = Date.now() - httpStart;
      const isOk = resultHttp.statusCode >= 200 && resultHttp.statusCode < 400;

      return {
        online: isOk || resultHttp.statusCode > 0,
        statusCode: resultHttp.statusCode,
        responseTimeMs: durationHttp,
        finalUrl: resultHttp.finalUrl,
        redirectCount: resultHttp.redirectCount,
        headers: resultHttp.headers,
        status: isOk ? "healthy" : resultHttp.statusCode >= 400 ? "warning" : "offline",
        checkedAt
      };
    } catch {
      return {
        online: false,
        statusCode: 0,
        responseTimeMs: null,
        finalUrl: null,
        redirectCount: 0,
        headers: {},
        status: "offline",
        checkedAt
      };
    }
  }
}

async function fetchWithRedirectGuard(
  targetUrl: string,
  currentRedirects: number,
  maxRedirects: number
): Promise<{
  statusCode: number;
  finalUrl: string;
  redirectCount: number;
  headers: Record<string, string>;
}> {
  if (currentRedirects > maxRedirects) {
    throw new Error(`Exceeded maximum redirect limit (${maxRedirects})`);
  }

  const parsedUrl = new URL(targetUrl);
  await assertSafeDomainTarget(parsedUrl.hostname);

  const client = parsedUrl.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    let resolved = false;

    const req = client.request(
      targetUrl,
      {
        method: "GET",
        timeout: 10000,
        headers: {
          "User-Agent": "DomDock-Health-Checker/2.0 (+https://domdock.io)"
        }
      },
      (res) => {
        if (resolved) return;

        const statusCode = res.statusCode || 0;
        const normalizedHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          if (v) {
            normalizedHeaders[k.toLowerCase()] = Array.isArray(v) ? v.join(", ") : String(v);
          }
        }

        // Handle 3xx Redirects
        if (statusCode >= 300 && statusCode < 400 && normalizedHeaders["location"]) {
          resolved = true;
          req.destroy();

          const redirectLocation = normalizedHeaders["location"];
          const nextUrl = new URL(redirectLocation, targetUrl).toString();

          fetchWithRedirectGuard(nextUrl, currentRedirects + 1, maxRedirects)
            .then(resolve)
            .catch(reject);
          return;
        }

        resolved = true;
        res.resume(); // consume response stream
        resolve({
          statusCode,
          finalUrl: targetUrl,
          redirectCount: currentRedirects,
          headers: normalizedHeaders
        });
      }
    );

    req.on("error", (err) => {
      if (resolved) return;
      resolved = true;
      req.destroy();
      reject(err);
    });

    req.on("timeout", () => {
      if (resolved) return;
      resolved = true;
      req.destroy();
      reject(new Error("Network connection timed out after 10000ms"));
    });

    req.end();
  });
}
