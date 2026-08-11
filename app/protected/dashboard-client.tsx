"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, LogOut, Plus, RefreshCw, X, Trash2, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              const res = await fetch(`/api/check-domain?domain=${encodeURIComponent(domain.name)}`);
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
      const res = await fetch(`/api/check-domain?domain=${encodeURIComponent(cleanName)}`);
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
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-5 py-5 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm font-black uppercase tracking-tight"
          >
            <span className="grid size-7 place-items-center bg-foreground">
              <span className="size-2.5 bg-primary" />
            </span>
            DomDock
          </Link>
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-[.14em] text-muted-foreground">
            <ThemeToggle />
            <span className="hidden sm:inline">{email}</span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut data-icon="inline-start" /> Logout
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
        <div className="mb-12 flex flex-col justify-between gap-8 border-b border-border pb-10 md:flex-row md:items-end">
          <div>
            <p className="section-label mb-5">Control room / daily watch</p>
            <h1 className="text-5xl font-black uppercase leading-[.85] tracking-[-.07em] md:text-8xl">
              Your domains.
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" disabled={refreshing} onClick={() => refresh()}>
              <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />{" "}
              {refreshing ? "Checking..." : "Refresh"}
            </Button>
            <Button onClick={() => setShowAdd(true)}>
              <Plus data-icon="inline-start" /> Add domain
            </Button>
          </div>
        </div>
        <div className="mb-14 grid gap-4 sm:grid-cols-3">
          <Stat
            label="Domains tracked"
            value={stats.total}
            detail="Across your stack"
          />
          <Stat
            label="Healthy / Online"
            value={stats.healthy}
            detail="Active status checks"
          />
          <Stat
            label="Expiring soon"
            value={stats.soon}
            detail="Within 30 days"
            alert={stats.soon > 0}
          />
        </div>
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-label">Domain list</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Website status and registry expiry checked automatically.
              </p>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {domains.length} records
            </span>
          </div>
          {domains.length === 0 ? (
            <div className="border border-dashed border-border px-6 py-20 text-center">
              <p className="font-bold uppercase">No domains tracked yet.</p>
              <button
                onClick={() => setShowAdd(true)}
                className="mt-5 text-sm font-semibold text-primary underline"
              >
                Add your first domain
              </button>
            </div>
          ) : (
            <div className="border-t border-border">
              {domains.map((domain) => {
                const days = daysUntil(domain.expires_at);
                const soon = days !== null && days <= 30;
                return (
                  <article
                    key={domain.id}
                    className="grid gap-5 border-b border-border py-6 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">
                          {domain.name}
                        </h2>
                        <a
                          href={`https://${domain.name}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          title="Open website"
                        >
                          <Globe className="size-4" />
                        </a>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        Last checked{" "}
                        {domain.last_checked_at
                          ? new Date(domain.last_checked_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit"
                            }) + " on " + new Date(domain.last_checked_at).toLocaleDateString()
                          : "pending"}
                      </p>
                    </div>
                    <div>
                      <p className="section-label">Website status</p>
                      <p className="mt-2 flex items-center gap-2 text-sm font-bold uppercase">
                        <span
                          className={`size-2.5 rounded-full ${
                            domain.health === "healthy"
                              ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                              : domain.health === "warning"
                              ? "bg-amber-500"
                              : "bg-destructive"
                          }`}
                        />{" "}
                        <span
                          className={
                            domain.health === "healthy"
                              ? "text-emerald-500 font-bold"
                              : "text-foreground font-bold"
                          }
                        >
                          {domain.health === "healthy"
                            ? "Online"
                            : domain.health === "offline"
                            ? "Offline"
                            : domain.health}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="section-label">Registry Expiry</p>
                      <p
                        className={
                          soon
                            ? "mt-2 font-bold text-primary"
                            : "mt-2 font-semibold"
                        }
                      >
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
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-xs uppercase text-muted-foreground">
                        {days !== null ? (
                          days < 0 ? (
                            <span className="font-bold text-destructive">
                              {Math.abs(days)}d overdue
                            </span>
                          ) : (
                            <span className={soon ? "font-bold text-amber-500" : ""}>
                              {days}d left
                            </span>
                          )
                        ) : (
                          "Pending"
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDomain(domain.id)}
                        title="Delete domain"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-5">
          <form
            onSubmit={addDomain}
            className="w-full max-w-lg border border-border bg-background p-7"
          >
            <div className="mb-8 flex items-start justify-between">
              <div>
                <p className="section-label">New record</p>
                <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">
                  Add domain
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                aria-label="Close"
              >
                <X />
              </button>
            </div>
            <div className="grid gap-5">
              <label className="grid gap-2 text-xs font-bold uppercase tracking-wider">
                Domain name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="example.com"
                  className="border border-border bg-transparent px-4 py-3 text-base font-normal normal-case outline-none focus:border-primary"
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Domain expiry date and website health status will be fetched automatically.
              </p>
            </div>
            <button
              disabled={busy}
              className="poster-button mt-8 w-full justify-center bg-primary text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Checking & Saving..." : "Save domain"}{" "}
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
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle className="section-label">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={`text-5xl font-black tracking-[-.08em] ${alert ? "text-primary" : ""}`}
        >
          {value}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
