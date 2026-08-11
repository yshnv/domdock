/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  LogOut,
  Plus,
  RefreshCw,
  X,
  Trash2,
  Globe,
  Lightbulb
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DomDockLogo } from "@/components/domdock-logo";
import { CheckProgressModal } from "@/components/check-progress-modal";
import { FeatureRequestModal } from "@/components/feature-request-modal";

type DnsRecords = {
  a: string[];
  aaaa: string[];
  mx: Array<{ exchange: string; priority: number }>;
  ns: string[];
  txt: string[];
};

type Domain = {
  id: string;
  name: string;
  expires_at: string | null;
  health: "healthy" | "warning" | "offline" | "pending";
  last_checked_at: string | null;
  status_code?: number | null;
  response_time_ms?: number | null;
  dns_records?: DnsRecords | null;
};

const daysUntil = (date: string | null) => {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  if (isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86400000);
};

function DomainFavicon({ name }: { name: string }) {
  const [imgError, setImgError] = useState(false);
  const faviconUrl = `https://favicone.com/${encodeURIComponent(name)}?s=64`;

  return (
    <div className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-[#3139fb]/15 bg-[#3139fb]/5 shadow-sm">
      {!imgError ? (
        <img
          src={faviconUrl}
          alt={`${name} favicon`}
          className="size-4.5 object-contain"
          onError={() => setImgError(true)}
        />
      ) : (
        <Globe className="size-4.5 text-[#3139fb]" />
      )}
    </div>
  );
}

export default function DashboardClient({
  initialDomains,
  email
}: {
  initialDomains: Domain[];
  email: string;
}) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [showAdd, setShowAdd] = useState(false);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    domainName: string;
    step: number;
    error: string | null;
  }>({
    isOpen: false,
    domainName: "",
    step: 0,
    error: null
  });
  const supabase = createClient();
  const router = useRouter();

  // Strip www. prefix for consistent monitoring (www-redirecting domains still resolve correctly)
  const normalizeDomain = (name: string) => name.replace(/^www\./i, "");

  const runCheckNow = async (domainId: string, domainName: string) => {
    setModalState({
      isOpen: true,
      domainName,
      step: 0,
      error: null
    });

    const interval = setInterval(() => {
      setModalState((prev) => ({
        ...prev,
        step: Math.min(prev.step + 1, 5)
      }));
    }, 600);

    try {
      const res = await fetch(`/api/domains/${domainId}/check`, {
        method: "POST"
      });
      clearInterval(interval);

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to check domain");
      }

      setModalState((prev) => ({ ...prev, step: 6 }));

      // Refresh list
      const { data: updatedDomains } = await supabase
        .from("domains")
        .select("*")
        .order("name", { ascending: true });

      if (updatedDomains) setDomains(updatedDomains);

      setTimeout(() => {
        setModalState({ isOpen: false, domainName: "", step: 0, error: null });
      }, 800);
    } catch (err: unknown) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Error checking domain";
      setModalState((prev) => ({ ...prev, error: msg }));
    }
  };

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from("domains")
        .select("*")
        .order("name", { ascending: true });

      if (data && data.length > 0) {
        const updatedDomains = await Promise.all(
          data.map(async (domain: Domain) => {
            const checkName = normalizeDomain(domain.name);
            try {
              const res = await fetch(
                `/api/check-domain?domain=${encodeURIComponent(checkName)}`
              );
              if (res.ok) {
                const info = await res.json();
                const newHealth = info.health || domain.health;
                const newExpiry = info.expiresAt || domain.expires_at;
                const checkedAt = info.checkedAt || new Date().toISOString();

                // Detect if site redirects to www — update stored name if needed
                let canonicalDomainName = domain.name;
                if (info.finalUrl) {
                  try {
                    const finalHostname = new URL(info.finalUrl).hostname.toLowerCase();
                    const rootName = domain.name.replace(/^www\./, "");
                    if (finalHostname === `www.${rootName}` && domain.name !== `www.${rootName}`) {
                      canonicalDomainName = `www.${rootName}`;
                    } else if (finalHostname === rootName && domain.name !== rootName) {
                      canonicalDomainName = rootName;
                    }
                  } catch { /* ignore */ }
                }

                await supabase
                  .from("domains")
                  .update({
                    name: canonicalDomainName,
                    health: newHealth,
                    expires_at: newExpiry,
                    last_checked_at: checkedAt,
                    status_code: info.statusCode ?? domain.status_code,
                    response_time_ms: info.responseTimeMs ?? domain.response_time_ms,
                    dns_records: info.dnsRecords ?? domain.dns_records
                  })
                  .eq("id", domain.id);

                return {
                  ...domain,
                  name: canonicalDomainName,
                  health: newHealth,
                  expires_at: newExpiry,
                  last_checked_at: checkedAt,
                  status_code: info.statusCode ?? domain.status_code,
                  response_time_ms: info.responseTimeMs ?? domain.response_time_ms,
                  dns_records: info.dnsRecords ?? domain.dns_records
                };
              }
            } catch (err) {
              console.error(`Error refreshing ${domain.name}:`, err);
            }
            return domain;
          })
        );
        setDomains(updatedDomains);
      } else if (data) {
        setDomains(data);
      }
    } finally {
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setDate(now.getDate() + 1);
    midnight.setHours(0, 0, 5, 0);
    const timer = window.setTimeout(() => {
      refresh();
    }, midnight.getTime() - now.getTime());
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const stats = useMemo(
    () => ({
      total: domains.length,
      healthy: domains.filter((d) => d.health === "healthy").length,
      issues: domains.filter((d) => d.health === "warning" || d.health === "offline").length,
      expiringSoon: domains.filter((d) => {
        const days = daysUntil(d.expires_at);
        return days !== null && days <= 30;
      }).length,
      avgResponseMs: (() => {
        const valid = domains.filter((d) => d.response_time_ms != null);
        if (!valid.length) return null;
        return Math.round(valid.reduce((s, d) => s + (d.response_time_ms ?? 0), 0) / valid.length);
      })()
    }),
    [domains]
  );

  const addDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy(true);

    let cleanName = name.trim().toLowerCase();

    // Ensure we can parse it as a URL
    if (!cleanName.startsWith("http://") && !cleanName.startsWith("https://")) {
      cleanName = "https://" + cleanName;
    }

    try {
      const url = new URL(cleanName);
      cleanName = url.hostname;
    } catch {
      cleanName = name
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .split("/")[0]
        .split("?")[0]
        .split("#")[0];
    }

    // Remove 'www.' prefix
    cleanName = cleanName.replace(/^www\./, "");

    // Basic domain validation
    const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
    if (!domainRegex.test(cleanName)) {
      alert("Please enter a valid domain name (e.g. example.com)");
      setBusy(false);
      return;
    }

    let fetchedExpiry: string | null = null;
    let fetchedHealth: "healthy" | "warning" | "offline" = "healthy";
    let canonicalName = cleanName; // may be updated to www.cleanName if redirect detected

    try {
      const res = await fetch(
        `/api/check-domain?domain=${encodeURIComponent(cleanName)}`
      );
      if (res.ok) {
        const info = await res.json();
        if (info.expiresAt) fetchedExpiry = info.expiresAt;
        if (info.health) fetchedHealth = info.health;

        // Detect www redirect: if finalUrl contains www.domain, store as www.domain
        if (info.finalUrl) {
          try {
            const finalHostname = new URL(info.finalUrl).hostname.toLowerCase();
            if (finalHostname === `www.${cleanName}`) {
              canonicalName = `www.${cleanName}`;
            }
          } catch { /* ignore malformed finalUrl */ }
        }
      }
    } catch (err) {
      console.error("Failed auto domain check:", err);
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from("domains")
        .insert({
          user_id: user.id,
          name: canonicalName,  // use www-detected canonical form
          expires_at: fetchedExpiry,
          health: fetchedHealth,
          last_checked_at: new Date().toISOString()
        })
        .select()
        .single();

      if (data) {
        setDomains((current) => [...current, data]);
        router.refresh(); // invalidate server cache so navigating away and back shows fresh data
      }
    }

    setName("");
    setBusy(false);
    setShowAdd(false);
  };

  const deleteDomain = async (id: string) => {
    const { error } = await supabase.from("domains").delete().eq("id", id);
    if (!error) {
      setDomains((current) => current.filter((d) => d.id !== id));
      router.refresh(); // invalidate server cache
    }
  };

  const logout = async () => {
    if (window.confirm("Are you sure you want to log out of DomDock?")) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-heading text-base font-bold text-foreground"
          >
            <div className="grid size-7 place-items-center rounded-[8px] bg-[#3139fb] text-white shadow-sm">
              <DomDockLogo className="size-4 text-white" />
            </div>
            DomDock Workspace
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#3139fb]">
            {/* <ThemeToggle /> */}
            <button
              onClick={() => setIsFeatureModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#3139fb]/20 bg-[#fffcec] px-3 py-1.5 text-xs font-semibold text-[#3139fb] hover:bg-[#fffadd] transition-colors"
            >
              <Lightbulb className="size-3.5 text-[#3139fb]" />
              <span className="hidden sm:inline">Request Feature</span>
            </button>
            <span className="hidden rounded-[6px] bg-[#fffcec] px-3 py-1 font-mono text-[11px] border border-[#3139fb]/20 sm:inline-block">
              {email}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#3139fb]/20 bg-white px-3 py-1.5 text-xs font-semibold text-[#3139fb] hover:bg-[#fffadd] transition-colors"
            >
              <LogOut className="size-3.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <FeatureRequestModal
        isOpen={isFeatureModalOpen}
        onClose={() => setIsFeatureModalOpen(false)}
      />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-12">
        {/* Page Banner */}
        <div className="mb-8 flex flex-col justify-between gap-6 border-b border-[#3139fb]/15 pb-8 sm:flex-row sm:items-end">
          <div>
            <span className="rounded-[4px] bg-[#fffadd] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#3139fb] border border-[#3139fb]/20">
              DAILY WATCH
            </span>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[#3139fb] sm:text-5xl">
              Monitored Domains
            </h1>
          </div>
          <div className="flex gap-2.5">
            <button
              disabled={refreshing}
              onClick={() => refresh()}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#3139fb]/20 bg-[#fffcec] px-4 text-xs font-semibold text-[#3139fb] hover:bg-[#fffadd] transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                className={`size-3.5 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh Status"}
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#3139fb] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#3139fb]/90 transition-all active:scale-95"
            >
              <Plus className="size-4" /> Add Domain
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Total Domains"
            value={stats.total}
            sub="Monitored"
            color="blue"
          />
          <StatCard
            label="Healthy"
            value={stats.healthy}
            sub="200 OK"
            color="green"
          />
          <StatCard
            label="Issues"
            value={stats.issues}
            sub="Warning / Offline"
            color={stats.issues > 0 ? "red" : "muted"}
          />
          <StatCard
            label="Expiring Soon"
            value={stats.expiringSoon}
            sub={stats.avgResponseMs !== null ? `Avg ${stats.avgResponseMs}ms` : "Within 30 days"}
            color={stats.expiringSoon > 0 ? "amber" : "muted"}
          />
        </div>

        {/* Domains Table */}
        <section className="rounded-[22px] border border-[#3139fb]/20 bg-[#fffcec] arc-shadow-elevated overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#3139fb]/15">
            <div>
              <h2 className="font-heading text-sm font-bold text-[#3139fb]">
                Tracked Domains
                <span className="ml-2 rounded-full bg-[#3139fb]/10 px-2 py-0.5 font-mono text-[10px]">{domains.length}</span>
              </h2>
              <p className="text-[11px] text-[#3139fb]/60 mt-0.5">WHOIS · HTTP health · DNS · SSL · SEO — auto-checked</p>
            </div>
            <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          {/* Column headers — visible on sm+ */}
          {domains.length > 0 && (
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2 border-b border-[#3139fb]/10 bg-[#3139fb]/5">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#3139fb]/50">Domain</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#3139fb]/50">Status</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#3139fb]/50">Expiry</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#3139fb]/50">Response</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#3139fb]/50">Checked</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#3139fb]/50">Actions</span>
            </div>
          )}

          {domains.length === 0 ? (
            <div className="rounded-b-[22px] border border-dashed border-[#3139fb]/30 bg-white m-4 p-10 text-center">
              <Globe className="mx-auto mb-3 size-8 text-[#3139fb]/30" />
              <p className="font-heading text-sm font-bold text-[#3139fb]">No domains yet.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-2 text-xs font-semibold text-[#3139fb] underline hover:opacity-80"
              >
                Add your first domain to monitor
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#3139fb]/10">
              {domains.map((domain) => {
                const days = daysUntil(domain.expires_at);
                const expiryUrgent = days !== null && days <= 14;
                const expirySoon = days !== null && days <= 30 && !expiryUrgent;
                return (
                  <article
                    key={domain.id}
                    className="group bg-white sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] sm:gap-3 sm:items-center px-5 py-4 transition-colors hover:bg-[#fffcec]"
                  >
                    {/* Domain + favicon */}
                    <div className="flex items-center gap-3 min-w-0 mb-3 sm:mb-0">
                      <DomainFavicon name={domain.name} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-sm font-bold text-[#3139fb] truncate max-w-[160px] sm:max-w-none">{domain.name}</h3>
                          <a href={`https://${domain.name}`} target="_blank" rel="noreferrer"
                            className="shrink-0 text-[#3139fb]/30 hover:text-[#3139fb] transition-colors" title="Open site">
                            <ArrowUpRight className="size-3.5" />
                          </a>
                        </div>
                        {/* Mobile: show key data inline */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 sm:hidden">
                          <HealthPill health={domain.health} statusCode={domain.status_code} />
                          {days !== null && (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${
                              expiryUrgent ? "bg-red-100 text-red-700" :
                              expirySoon ? "bg-amber-100 text-amber-700" :
                              "bg-[#3139fb]/10 text-[#3139fb]"
                            }`}>{days}d expiry</span>
                          )}
                          {domain.response_time_ms != null && (
                            <span className="font-mono text-[10px] text-[#3139fb]/60">{domain.response_time_ms}ms</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status — desktop */}
                    <div className="hidden sm:block">
                      <HealthPill health={domain.health} statusCode={domain.status_code} />
                    </div>

                    {/* Expiry — desktop */}
                    <div className="hidden sm:block">
                      {days !== null ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${
                          expiryUrgent ? "bg-red-100 text-red-700" :
                          expirySoon ? "bg-amber-100 text-amber-700" :
                          "bg-[#3139fb]/10 text-[#3139fb]"
                        }`}>
                          {expiryUrgent && "⚠ "}{days}d left
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#3139fb]/40">—</span>
                      )}
                    </div>

                    {/* Response time — desktop */}
                    <div className="hidden sm:block">
                      {domain.response_time_ms != null ? (
                        <span className={`font-mono text-xs font-bold ${
                          domain.response_time_ms < 500 ? "text-emerald-600" :
                          domain.response_time_ms < 1500 ? "text-amber-600" :
                          "text-red-600"
                        }`}>
                          {domain.response_time_ms}ms
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-[#3139fb]/40">—</span>
                      )}
                    </div>

                    {/* Last checked — desktop */}
                    <div className="hidden sm:block">
                      <span className="font-mono text-[10px] text-[#3139fb]/50">
                        {domain.last_checked_at
                          ? new Date(domain.last_checked_at).toLocaleString([], {
                              month: "short", day: "numeric",
                              hour: "2-digit", minute: "2-digit"
                            })
                          : "Pending"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => runCheckNow(domain.id, domain.name)}
                        className="rounded-[6px] p-1.5 text-[#3139fb]/50 hover:bg-[#3139fb]/10 hover:text-[#3139fb] transition-colors"
                        title="Check Now"
                      >
                        <RefreshCw className="size-3.5" />
                      </button>
                      <Link
                        href={`/dashboard/domain/${domain.id}`}
                        className="inline-flex items-center gap-1 rounded-[6px] border border-[#3139fb]/20 bg-[#3139fb]/5 px-2.5 py-1.5 text-[11px] font-semibold text-[#3139fb] transition-all hover:bg-[#3139fb] hover:text-white"
                      >
                        Details
                        <ArrowUpRight className="size-3" />
                      </Link>
                      <button
                        onClick={() => deleteDomain(domain.id)}
                        className="rounded-[6px] p-1.5 text-[#3139fb]/30 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Add Domain Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#3139fb]/30 backdrop-blur-sm p-4">
          <form
            onSubmit={addDomain}
            className="w-full max-w-md rounded-[22px] border border-[#3139fb]/25 bg-white p-7 arc-shadow-elevated"
          >
            <div className="mb-6 flex items-start justify-between">
              <div>
                <span className="rounded-[4px] bg-[#fffadd] px-2 py-0.5 font-mono text-[10px] font-bold text-[#3139fb] border border-[#3139fb]/20">
                  NEW RECORD
                </span>
                <h2 className="mt-2 font-heading text-2xl font-bold text-[#3139fb]">
                  Add Domain to Watch
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="rounded-[6px] p-1 text-[#3139fb]/60 hover:text-[#3139fb]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#3139fb]">
                Domain Name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="example.com"
                  className="mt-1.5 w-full rounded-[8px] border border-[#3139fb]/20 bg-[#fffcec] px-3.5 py-2.5 text-sm font-medium text-[#3139fb] placeholder-[#3139fb]/40 outline-none focus:border-[#3139fb] focus:ring-1 focus:ring-[#3139fb]"
                />
              </label>
              <p className="text-xs text-[#3139fb]/70">
                WHOIS expiration and HTTP health will be fetched automatically.
              </p>
            </div>

            <button
              disabled={busy}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#3139fb] py-3 text-xs font-bold text-white shadow-md hover:bg-[#3139fb]/90 transition-all disabled:opacity-50"
            >
              {busy ? "Checking & Saving..." : "Save Domain"}
              <ArrowUpRight className="size-4" />
            </button>
          </form>
        </div>
      )}

      {/* Check Progress Modal */}
      <CheckProgressModal
        isOpen={modalState.isOpen}
        domainName={modalState.domainName}
        currentStep={modalState.step}
        error={modalState.error}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  color
}: {
  label: string;
  value: number;
  sub: string;
  color: "blue" | "green" | "red" | "amber" | "muted";
}) {
  const colors = {
    blue: "border-[#3139fb]/20 bg-[#3139fb]/5 text-[#3139fb]",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    muted: "border-border bg-card text-muted-foreground",
  };
  const numColors = {
    blue: "text-[#3139fb]",
    green: "text-emerald-600",
    red: "text-red-600",
    amber: "text-amber-600",
    muted: "text-foreground/50",
  };
  return (
    <div className={`rounded-[14px] border p-4 ${colors[color]}`}>
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-70">{label}</p>
      <p className={`mt-1 font-display text-3xl font-black ${numColors[color]}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-medium opacity-70">{sub}</p>
    </div>
  );
}

function HealthPill({
  health,
  statusCode
}: {
  health: "healthy" | "warning" | "offline" | "pending";
  statusCode?: number | null;
}) {
  const cfg = {
    healthy: { dot: "bg-emerald-500", bg: "bg-emerald-100 text-emerald-700", label: statusCode ? `${statusCode} OK` : "Online" },
    warning: { dot: "bg-amber-500", bg: "bg-amber-100 text-amber-700", label: statusCode ? `${statusCode}` : "Warning" },
    offline: { dot: "bg-red-500", bg: "bg-red-100 text-red-700", label: statusCode ? `${statusCode}` : "Offline" },
    pending: { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-500", label: "Pending" },
  }[health] ?? { dot: "bg-gray-400", bg: "bg-gray-100 text-gray-500", label: health };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold ${cfg.bg}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
