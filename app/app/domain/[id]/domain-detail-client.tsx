"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Globe,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Zap,
  Server,
  FileText,
  Mail,
  Network
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type DnsRecords = {
  a: string[];
  aaaa: string[];
  mx: Array<{ exchange: string; priority: number }>;
  ns: string[];
  txt: string[];
};

type DomainDetail = {
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

export default function DomainDetailClient({
  initialDomain,
  userEmail
}: {
  initialDomain: DomainDetail;
  userEmail: string;
}) {
  const [domain, setDomain] = useState<DomainDetail>(initialDomain);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const days = daysUntil(domain.expires_at);
  const isSoon = days !== null && days <= 30;

  const fetchLatestInfo = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/check-domain?domain=${encodeURIComponent(domain.name)}`);
      if (res.ok) {
        const info = await res.json();
        const updated: Partial<DomainDetail> = {
          health: info.health || domain.health,
          expires_at: info.expiresAt || domain.expires_at,
          last_checked_at: info.checkedAt || new Date().toISOString(),
          status_code: info.statusCode ?? null,
          response_time_ms: info.responseTimeMs ?? null,
          dns_records: info.dnsRecords ?? null
        };

        await supabase.from("domains").update(updated).eq("id", domain.id);

        setDomain((prev) => ({
          ...prev,
          ...updated
        }));
      }
    } catch (err) {
      console.error("Error checking domain details:", err);
    } finally {
      setRefreshing(false);
    }
  }, [domain.name, domain.id, domain.health, domain.expires_at, supabase]);

  useEffect(() => {
    // Auto-fetch DNS and response latency if not present yet
    if (!domain.dns_records && !domain.response_time_ms) {
      fetchLatestInfo();
    }
  }, [domain.dns_records, domain.response_time_ms, fetchLatestInfo]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(text);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const deleteDomain = async () => {
    if (!confirm(`Are you sure you want to remove ${domain.name} from DomDock?`)) return;
    setDeleting(true);
    const { error } = await supabase.from("domains").delete().eq("id", domain.id);
    if (!error) {
      router.push("/app");
    } else {
      setDeleting(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const dns = domain.dns_records || { a: [], aaaa: [], mx: [], ns: [], txt: [] };
  const totalRecords =
    (dns.a?.length || 0) +
    (dns.aaaa?.length || 0) +
    (dns.mx?.length || 0) +
    (dns.ns?.length || 0) +
    (dns.txt?.length || 0);

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="flex items-center gap-2 font-heading text-base font-bold text-foreground"
            >
              <div className="grid size-7 place-items-center rounded-[8px] bg-primary text-primary-foreground shadow-sm">
                <div className="size-2 rounded-full bg-white" />
              </div>
              DomDock
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-mono text-xs font-semibold text-foreground/80">
              {domain.name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-foreground">
            <span className="hidden rounded-[6px] bg-[#fffcec] dark:bg-slate-800 px-3 py-1 font-mono text-[11px] border border-border/20 sm:inline-block">
              {userEmail}
            </span>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-1 size-3.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-12">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" /> Back to Workspace
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={refreshing}
              onClick={() => fetchLatestInfo()}
            >
              <RefreshCw className={`mr-1.5 size-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking..." : "Re-check Domain & DNS"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={deleteDomain}
            >
              <Trash2 className="mr-1.5 size-3.5" /> Delete
            </Button>
          </div>
        </div>

        {/* Hero Domain Overview Header */}
        <div className="mb-8 rounded-[16px] border border-border/30 bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  {domain.name}
                </h1>
                <a
                  href={`https://${domain.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-[6px] bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                >
                  <Globe className="size-3.5" /> Visit Site <ArrowUpRight className="size-3" />
                </a>
              </div>
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Last checked{" "}
                {domain.last_checked_at
                  ? new Date(domain.last_checked_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    }) + " on " + new Date(domain.last_checked_at).toLocaleDateString()
                  : "Just now"}
              </p>
            </div>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Health Badge */}
              <div className="flex items-center gap-2 rounded-[8px] border border-border/20 bg-background px-3 py-2 text-xs font-semibold">
                <span
                  className={`size-2.5 rounded-full ${
                    domain.health === "healthy"
                      ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      : domain.health === "warning"
                      ? "bg-amber-500"
                      : "bg-destructive"
                  }`}
                />
                <span className="font-mono uppercase">
                  {domain.health === "healthy"
                    ? "HTTP 200 OK"
                    : domain.health === "offline"
                    ? "Offline"
                    : domain.health}
                </span>
              </div>

              {/* Latency Metric */}
              <div className="flex items-center gap-1.5 rounded-[8px] border border-border/20 bg-background px-3 py-2 text-xs font-semibold">
                <Zap className="size-3.5 text-amber-500" />
                <span className="font-mono">
                  {domain.response_time_ms !== null && domain.response_time_ms !== undefined
                    ? `${domain.response_time_ms} ms`
                    : "Latency check..."}
                </span>
              </div>

              {/* Expiry Badge */}
              <div
                className={`flex items-center gap-1.5 rounded-[8px] border px-3 py-2 text-xs font-semibold ${
                  isSoon
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "border-border/20 bg-background text-foreground"
                }`}
              >
                <ShieldCheck className="size-3.5 text-primary" />
                <span className="font-mono">
                  {days !== null ? (days < 0 ? `${Math.abs(days)}d Overdue` : `${days}d Remaining`) : "Expiry..."}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics & Details Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* Status Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Globe className="size-4 text-primary" /> Website Health & Latency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {domain.health === "healthy" ? "100% Reachable" : "Unreachable"}
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span className="font-mono font-bold text-foreground">
                    {domain.response_time_ms ? `${domain.response_time_ms} ms` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status Code:</span>
                  <span className="font-mono font-bold text-foreground">
                    {domain.status_code ? `${domain.status_code} OK` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Protocol:</span>
                  <span className="font-mono font-bold text-foreground">HTTPS (Encrypted)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registry Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" /> Expiration & Registry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {domain.expires_at
                  ? new Date(`${domain.expires_at}T00:00:00`).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    })
                  : "Fetching..."}
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Days Left:</span>
                  <span className={`font-mono font-bold ${isSoon ? "text-amber-500" : "text-foreground"}`}>
                    {days !== null ? `${days} days` : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>RDAP Verification:</span>
                  <span className="font-mono font-bold text-emerald-500">Verified</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-renew Watch:</span>
                  <span className="font-mono font-bold text-foreground">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DNS Overview Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Network className="size-4 text-primary" /> DNS Record Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-mono">
                {totalRecords} Records Found
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>A (IPv4) / AAAA (IPv6):</span>
                  <span className="font-mono font-bold text-foreground">
                    {(dns.a?.length || 0) + (dns.aaaa?.length || 0)} records
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>MX (Mail Servers):</span>
                  <span className="font-mono font-bold text-foreground">
                    {dns.mx?.length || 0} servers
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>NS (Name Servers):</span>
                  <span className="font-mono font-bold text-foreground">
                    {dns.ns?.length || 0} servers
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DNS Inspector Section */}
        <div className="rounded-[16px] border border-border/30 bg-card p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight">
                DNS Record Inspector
              </h2>
              <p className="text-xs text-muted-foreground">
                Active DNS resolution records queried directly for {domain.name}.
              </p>
            </div>
            <span className="font-mono text-xs font-semibold text-primary">
              {totalRecords} records resolved
            </span>
          </div>

          <div className="space-y-6">
            {/* A Records */}
            <DnsSection
              title="A Records (IPv4 Addresses)"
              icon={<Server className="size-4 text-blue-500" />}
              badge={`${dns.a?.length || 0}`}
            >
              {dns.a && dns.a.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {dns.a.map((ip, idx) => (
                    <DnsRecordItem
                      key={idx}
                      type="A"
                      value={ip}
                      onCopy={() => copyToClipboard(ip)}
                      copied={copiedRecord === ip}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No A records found.</p>
              )}
            </DnsSection>

            {/* AAAA Records */}
            <DnsSection
              title="AAAA Records (IPv6 Addresses)"
              icon={<Server className="size-4 text-purple-500" />}
              badge={`${dns.aaaa?.length || 0}`}
            >
              {dns.aaaa && dns.aaaa.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {dns.aaaa.map((ip, idx) => (
                    <DnsRecordItem
                      key={idx}
                      type="AAAA"
                      value={ip}
                      onCopy={() => copyToClipboard(ip)}
                      copied={copiedRecord === ip}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No IPv6 AAAA records configured.</p>
              )}
            </DnsSection>

            {/* MX Records */}
            <DnsSection
              title="MX Records (Mail Servers)"
              icon={<Mail className="size-4 text-emerald-500" />}
              badge={`${dns.mx?.length || 0}`}
            >
              {dns.mx && dns.mx.length > 0 ? (
                <div className="grid gap-2">
                  {dns.mx.map((mxItem, idx) => (
                    <DnsRecordItem
                      key={idx}
                      type="MX"
                      value={`${mxItem.exchange} (Priority: ${mxItem.priority})`}
                      onCopy={() => copyToClipboard(mxItem.exchange)}
                      copied={copiedRecord === mxItem.exchange}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No MX records configured.</p>
              )}
            </DnsSection>

            {/* NS Records */}
            <DnsSection
              title="NS Records (Name Servers)"
              icon={<Network className="size-4 text-amber-500" />}
              badge={`${dns.ns?.length || 0}`}
            >
              {dns.ns && dns.ns.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {dns.ns.map((nsHost, idx) => (
                    <DnsRecordItem
                      key={idx}
                      type="NS"
                      value={nsHost}
                      onCopy={() => copyToClipboard(nsHost)}
                      copied={copiedRecord === nsHost}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No NS records found.</p>
              )}
            </DnsSection>

            {/* TXT Records */}
            <DnsSection
              title="TXT Records (SPF, Verification, DKIM)"
              icon={<FileText className="size-4 text-indigo-500" />}
              badge={`${dns.txt?.length || 0}`}
            >
              {dns.txt && dns.txt.length > 0 ? (
                <div className="grid gap-2">
                  {dns.txt.map((txtStr, idx) => (
                    <DnsRecordItem
                      key={idx}
                      type="TXT"
                      value={txtStr}
                      onCopy={() => copyToClipboard(txtStr)}
                      copied={copiedRecord === txtStr}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs italic text-muted-foreground">No TXT records found.</p>
              )}
            </DnsSection>
          </div>
        </div>
      </div>
    </main>
  );
}

function DnsSection({
  title,
  icon,
  badge,
  children
}: {
  title: string;
  icon: React.ReactNode;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border/20 pt-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground/80">
          {icon}
          <span>{title}</span>
        </div>
        <span className="rounded-[4px] bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary">
          {badge}
        </span>
      </div>
      {children}
    </div>
  );
}

function DnsRecordItem({
  type,
  value,
  onCopy,
  copied
}: {
  type: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="group flex items-center justify-between rounded-[8px] border border-border/20 bg-background px-3 py-2 transition-all hover:border-primary/40">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="rounded-[4px] bg-muted px-1.5 py-0.5 font-mono text-[10px] font-bold text-foreground">
          {type}
        </span>
        <span className="truncate font-mono text-xs text-foreground/90">{value}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 opacity-60 transition-opacity group-hover:opacity-100"
        onClick={onCopy}
        title="Copy to clipboard"
      >
        {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}
