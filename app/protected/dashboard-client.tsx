"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  LogOut,
  Plus,
  RefreshCw,
  X,
  Trash2,
  Globe
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
// import { ThemeToggle } from "@/components/theme-toggle";

type Domain = {
  id: string;
  name: string;
  expires_at: string | null;
  health: "healthy" | "warning" | "offline" | "pending";
  last_checked_at: string | null;
};

const daysUntil = (date: string | null) => {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  if (isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86400000);
};

export default function DashboardClient({
  initialDomains,
  email
}: {
  initialDomains: Domain[];
  email: string;
}) {
  const [domains, setDomains] = useState<Domain[]>(initialDomains);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const supabase = createClient();

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data } = await supabase
        .from("domains")
        .select("*")
        .order("name", { ascending: true });

      if (data && data.length > 0) {
        // Check website health and RDAP expiry for all domains
        const updatedDomains = await Promise.all(
          data.map(async (domain: Domain) => {
            try {
              const res = await fetch(
                `/api/check-domain?domain=${encodeURIComponent(domain.name)}`
              );
              if (res.ok) {
                const info = await res.json();
                const newHealth = info.health || domain.health;
                const newExpiry = info.expiresAt || domain.expires_at;
                const checkedAt = info.checkedAt || new Date().toISOString();

                await supabase
                  .from("domains")
                  .update({
                    health: newHealth,
                    expires_at: newExpiry,
                    last_checked_at: checkedAt
                  })
                  .eq("id", domain.id);

                return {
                  ...domain,
                  health: newHealth,
                  expires_at: newExpiry,
                  last_checked_at: checkedAt
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
  }, [supabase]);

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
      soon: domains.filter((d) => {
        const days = daysUntil(d.expires_at);
        return days !== null && days <= 30;
      }).length
    }),
    [domains]
  );

  const addDomain = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    const cleanName = name
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");

    let fetchedExpiry: string | null = null;
    let fetchedHealth: "healthy" | "warning" | "offline" = "healthy";

    try {
      const res = await fetch(
        `/api/check-domain?domain=${encodeURIComponent(cleanName)}`
      );
      if (res.ok) {
        const info = await res.json();
        if (info.expiresAt) fetchedExpiry = info.expiresAt;
        if (info.health) fetchedHealth = info.health;
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
          name: cleanName,
          expires_at: fetchedExpiry,
          health: fetchedHealth,
          last_checked_at: new Date().toISOString()
        })
        .select()
        .single();

      if (data) {
        setDomains((current) => [...current, data]);
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
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
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
              <div className="size-2 rounded-full bg-white" />
            </div>
            DomDock Workspace
          </Link>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#3139fb]">
            {/* <ThemeToggle /> */}
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
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Total Monitored"
            value={stats.total}
            detail="Active domain records"
          />
          <Stat
            label="Healthy / Response 200"
            value={stats.healthy}
            detail="Live website status"
          />
          <Stat
            label="Expiring Soon"
            value={stats.soon}
            detail="Needs renewal within 30d"
            alert={stats.soon > 0}
          />
        </div>

        {/* Domains List */}
        <section className="rounded-[22px] border border-[#3139fb]/20 bg-[#fffcec] p-6 arc-shadow-elevated">
          <div className="mb-6 flex items-center justify-between border-b border-[#3139fb]/15 pb-4">
            <div>
              <h2 className="font-heading text-lg font-bold text-[#3139fb]">
                Tracked Domains ({domains.length})
              </h2>
              <p className="text-xs text-[#3139fb]/70">
                Automated WHOIS RDAP expiry and HTTP status checks
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-[#3139fb]/60">
              Live Sync
            </span>
          </div>

          {domains.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#3139fb]/30 bg-white p-12 text-center">
              <p className="font-heading text-base font-bold text-[#3139fb]">
                No domains in workspace yet.
              </p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-3 text-xs font-semibold text-[#3139fb] underline hover:opacity-80"
              >
                Add your first domain to monitor
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {domains.map((domain) => {
                const days = daysUntil(domain.expires_at);
                const soon = days !== null && days <= 30;
                return (
                  <article
                    key={domain.id}
                    className="flex flex-col gap-4 rounded-[12px] border border-[#3139fb]/15 bg-white p-4 transition-all hover:border-[#3139fb] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-[8px] bg-[#3139fb]/10 text-[#3139fb]">
                        <Globe className="size-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-heading text-base font-bold text-[#3139fb]">
                            {domain.name}
                          </h3>
                          <a
                            href={`https://${domain.name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3139fb]/40 hover:text-[#3139fb]"
                            title="Open website"
                          >
                            <Globe className="size-3.5" />
                          </a>
                        </div>
                        <p className="font-mono text-[11px] text-[#3139fb]/60">
                          Last checked:{" "}
                          {domain.last_checked_at
                            ? new Date(
                                domain.last_checked_at
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : "Pending"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6 sm:justify-end">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#3139fb]/60">
                          STATUS
                        </span>
                        <p className="flex items-center gap-1.5 text-xs font-bold text-[#3139fb]">
                          <span
                            className={`size-2.5 rounded-full ${
                              domain.health === "healthy"
                                ? "bg-emerald-500"
                                : domain.health === "warning"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                          />
                          {domain.health === "healthy"
                            ? "Online (200 OK)"
                            : domain.health}
                        </p>
                      </div>

                      <div>
                        <span className="font-mono text-[10px] font-bold text-[#3139fb]/60">
                          EXPIRY DATE
                        </span>
                        <p className="font-mono text-xs font-bold text-[#3139fb]">
                          {domain.expires_at
                            ? new Date(
                                `${domain.expires_at}T00:00:00`
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric"
                              })
                            : "Auto-fetching..."}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-flex items-center rounded-[6px] px-2.5 py-1 font-mono text-[11px] font-bold ${
                            soon
                              ? "bg-[#fffadd] text-[#3139fb] border border-[#3139fb]/20"
                              : "bg-[#3139fb] text-white"
                          }`}
                        >
                          {days !== null ? `${days}d left` : "Pending"}
                        </span>
                      </div>

                      <button
                        onClick={() => deleteDomain(domain.id)}
                        className="rounded-[6px] p-2 text-[#3139fb]/40 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete domain"
                      >
                        <Trash2 className="size-4" />
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
    </main>
  );
}

function Stat({
  label,
  value,
  detail,
  alert
}: {
  label: string;
  value: number;
  detail: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-[16px] border p-5 arc-shadow-card transition-all ${
        alert
          ? "border-[#3139fb] bg-[#fffadd]"
          : "border-[#3139fb]/15 bg-[#fffcec]"
      }`}
    >
      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3139fb]/70">
        {label}
      </span>
      <p className="mt-1 font-display text-3xl font-bold text-[#3139fb]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[#3139fb]/70">{detail}</p>
    </div>
  );
}
