"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Globe,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Server,
  Network,
  ExternalLink,
  Building,
  Mail,
  AlertTriangle,
  Lock,
  Search,
  X,
  Minus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { HealthScoreBadge } from "@/components/health-score-badge";
import { DomainTimeline, DomainEvent } from "@/components/domain-timeline";
import { CheckProgressModal } from "@/components/check-progress-modal";

type DnsRecords = {
  a: string[];
  aaaa: string[];
  mx: Array<{ exchange: string; priority: number }>;
  ns: string[];
  txt: string[];
  cname?: string[];
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

type SeoCheck = { label: string; status: "pass" | "fail" | "warn"; detail?: string };

type MonitoringDetail = {
  registrar_name: string | null;
  registrar_iana_id: string | null;
  registrar_url: string | null;
  dns_provider: string | null;
  nameservers: string[];
  hosting_provider: string | null;
  ssl_valid: boolean | null;
  ssl_issuer: string | null;
  ssl_subject: string | null;
  ssl_valid_from: string | null;
  ssl_valid_to: string | null;
  ssl_days_remaining: number | null;
  ssl_hostname_matches: boolean | null;
  ssl_serial_number: string | null;
  https_available: boolean | null;
  website_online: boolean | null;
  website_status_code: number | null;
  website_response_time_ms: number | null;
  website_final_url: string | null;
  website_redirect_count: number;
  health_score: number | null;
  email_has_mx: boolean | null;
  email_spf_record: string | null;
  email_dmarc_record: string | null;
  email_dkim_records: string[] | null;
  // SEO fields
  seo_score: number | null;
  seo_title: string | null;
  seo_meta_description: string | null;
  seo_canonical_url: string | null;
  seo_robots_meta: string | null;
  seo_is_indexable: boolean | null;
  seo_https_redirects: boolean | null;
  seo_www_canonical: string | null;
  seo_has_og: boolean | null;
  seo_og_title: string | null;
  seo_og_description: string | null;
  seo_og_image: string | null;
  seo_has_twitter_card: boolean | null;
  seo_twitter_card: string | null;
  seo_robots_txt_exists: boolean | null;
  seo_robots_txt_blocks_self: boolean | null;
  seo_sitemap_found: boolean | null;
  seo_sitemap_url: string | null;
  seo_checks: SeoCheck[] | null;
  last_checked_at: string | null;
};

const daysUntil = (date: string | null) => {
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  if (isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86400000);
};

type TabId = "overview" | "dns" | "ssl" | "email" | "seo" | "events";

export default function DomainDetailClient({
  initialDomain,
  userEmail
}: {
  initialDomain: DomainDetail;
  userEmail: string;
}) {
  const [domain, setDomain] = useState<DomainDetail>(initialDomain);
  const [monitoring, setMonitoring] = useState<MonitoringDetail | null>(null);
  const [events, setEvents] = useState<DomainEvent[]>([]);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    step: number;
    error: string | null;
  }>({ isOpen: false, step: 0, error: null });

  const router = useRouter();
  const supabase = createClient();

  const days = daysUntil(domain.expires_at);

  const fetchMonitoringAndEvents = useCallback(async () => {
    try {
      const [monRes, evtRes] = await Promise.all([
        fetch(`/api/domains/${domain.id}/monitoring`),
        fetch(`/api/domains/${domain.id}/events`)
      ]);
      if (monRes.ok) {
        const monJson = await monRes.json();
        if (monJson.monitoring) setMonitoring(monJson.monitoring);
      }
      if (evtRes.ok) {
        const evtJson = await evtRes.json();
        if (evtJson.events) setEvents(evtJson.events);
      }
    } catch (err) {
      console.warn("Failed fetching extra domain details:", err);
    }
  }, [domain.id]);

  useEffect(() => {
    fetchMonitoringAndEvents();
  }, [fetchMonitoringAndEvents]);

  const triggerOnDemandCheck = async () => {
    setModalState({ isOpen: true, step: 0, error: null });
    const interval = setInterval(() => {
      setModalState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 5) }));
    }, 600);
    try {
      const res = await fetch(`/api/domains/${domain.id}/check`, { method: "POST" });
      clearInterval(interval);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to complete check");
      }
      setModalState((prev) => ({ ...prev, step: 6 }));
      const { data: updatedDomain } = await supabase.from("domains").select("*").eq("id", domain.id).single();
      if (updatedDomain) setDomain(updatedDomain);
      await fetchMonitoringAndEvents();
      setTimeout(() => setModalState({ isOpen: false, step: 0, error: null }), 800);
    } catch (err: unknown) {
      clearInterval(interval);
      const msg = err instanceof Error ? err.message : "Error checking domain";
      setModalState((prev) => ({ ...prev, error: msg }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRecord(text);
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const deleteDomain = async () => {
    if (!confirm(`Are you sure you want to remove ${domain.name} from DomDock?`)) return;
    setDeleting(true);
    const { error } = await supabase.from("domains").delete().eq("id", domain.id);
    if (!error) router.push("/dashboard");
    else setDeleting(false);
  };

  const logout = async () => {
    if (window.confirm("Are you sure you want to log out of DomDock?")) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const dns = domain.dns_records || { a: [], aaaa: [], mx: [], ns: [], txt: [] };

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "dns", label: "DNS" },
    { id: "ssl", label: "SSL" },
    { id: "email", label: "Email" },
    { id: "seo", label: "SEO" },
    { id: "events", label: "History", badge: events.length },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 font-heading text-sm font-bold text-foreground shrink-0">
              <div className="grid size-6 place-items-center rounded-[6px] bg-[#3139fb] text-white shadow-sm">
                <div className="size-1.5 rounded-full bg-white" />
              </div>
              DomDock
            </Link>
            <span className="text-muted-foreground/40 shrink-0">/</span>
            <span className="font-mono text-xs font-semibold text-[#3139fb] truncate max-w-[120px] sm:max-w-none">
              {domain.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-[6px] bg-[#fffcec] px-2.5 py-1 font-mono text-[10px] border border-[#3139fb]/20 sm:inline-block text-[#3139fb]">
              {userEmail}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#3139fb]/20 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#3139fb] hover:bg-[#fffadd] transition-colors"
            >
              <LogOut className="size-3" /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        {/* Action bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={triggerOnDemandCheck}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#3139fb] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[#3139fb]/90 transition-all active:scale-95"
            >
              <RefreshCw className="size-3.5" /> Check Now
            </button>
            <button
              disabled={deleting}
              onClick={deleteDomain}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Domain hero card */}
        <div className="mb-6 rounded-2xl border border-[#3139fb]/20 bg-[#fffcec] p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#3139fb]/10">
                <Globe className="size-5 text-[#3139fb]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-[#3139fb] break-all">
                    {domain.name}
                  </h1>
                  <a
                    href={`https://${domain.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#3139fb]/60 hover:text-[#3139fb] shrink-0"
                  >
                    Visit <ExternalLink className="size-3" />
                  </a>
                </div>
                <p className="mt-0.5 font-mono text-[11px] text-[#3139fb]/60">
                  Last checked:{" "}
                  {domain.last_checked_at
                    ? new Date(domain.last_checked_at).toLocaleString()
                    : "Pending"}
                </p>
              </div>
            </div>

            {/* Quick status pills */}
            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <HealthScoreBadge score={monitoring?.health_score ?? (domain.health === "healthy" ? 95 : 60)} size="lg" />
              <StatusPill
                ok={domain.health === "healthy"}
                warn={domain.health === "warning"}
                label={domain.health === "healthy" ? "Online" : domain.health}
              />
              {days !== null && (
                <StatusPill
                  ok={days > 30}
                  warn={days <= 30 && days > 0}
                  label={`${days}d left`}
                />
              )}
              {monitoring?.ssl_valid !== null && monitoring?.ssl_valid !== undefined && (
                <StatusPill ok={monitoring.ssl_valid} label={monitoring.ssl_valid ? "SSL Valid" : "SSL Invalid"} />
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border pb-0 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "border-[#3139fb] text-[#3139fb]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="rounded-full bg-[#3139fb]/15 px-1.5 py-0.5 font-mono text-[10px] text-[#3139fb]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TAB: Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {/* 4-col stat grid */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <MiniCard
                icon={<Building className="size-4 text-[#3139fb]" />}
                label="Registrar"
                value={monitoring?.registrar_name || "—"}
                sub={monitoring?.registrar_iana_id ? `IANA ${monitoring.registrar_iana_id}` : "RDAP"}
              />
              <MiniCard
                icon={<Network className="size-4 text-purple-500" />}
                label="DNS Provider"
                value={monitoring?.dns_provider || "—"}
                sub={`${dns.ns?.length || 0} nameservers`}
              />
              <MiniCard
                icon={<Server className="size-4 text-amber-500" />}
                label="Hosting"
                value={monitoring?.hosting_provider || "—"}
                sub="CNAME + header"
              />
              <MiniCard
                icon={<Lock className="size-4 text-emerald-500" />}
                label="SSL Certificate"
                value={monitoring?.ssl_valid ? `${monitoring.ssl_days_remaining ?? "?"}d remaining` : "Invalid / None"}
                sub={monitoring?.ssl_issuer ? monitoring.ssl_issuer : "TLS Port 443"}
              />
            </div>

            {/* 2-col detail grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Registration */}
              <Section title="Domain Registration" icon={<Globe className="size-4 text-[#3139fb]" />}>
                <Row label="Domain" value={domain.name} mono />
                <Row label="Expires" value={domain.expires_at ? `${domain.expires_at} (${days !== null ? `${days}d` : "—"})` : "Unavailable"} />
                <Row label="Registrar" value={monitoring?.registrar_name || "Unavailable"} />
                <Row label="IANA ID" value={monitoring?.registrar_iana_id || "—"} />
                {monitoring?.registrar_url && (
                  <Row label="Registrar URL" value={
                    <a href={monitoring.registrar_url} target="_blank" rel="noreferrer" className="text-[#3139fb] hover:underline break-all">
                      {monitoring.registrar_url}
                    </a>
                  } />
                )}
              </Section>

              {/* Website */}
              <Section title="Website Availability" icon={<ShieldCheck className="size-4 text-emerald-500" />}>
                <Row label="Status" value={monitoring?.website_online ? `Online (HTTP ${monitoring.website_status_code || 200})` : "Offline / Unreachable"} />
                <Row label="Response Time" value={domain.response_time_ms ? `${domain.response_time_ms} ms` : monitoring?.website_response_time_ms ? `${monitoring.website_response_time_ms} ms` : "N/A"} />
                <Row label="Final URL" value={monitoring?.website_final_url || `https://${domain.name}`} mono />
                <Row label="Redirects" value={String(monitoring?.website_redirect_count ?? 0)} />
                <Row label="HTTPS" value={monitoring?.https_available ? "Available" : "Not Available"} />
              </Section>
            </div>
          </div>
        )}

        {/* ── TAB: DNS ── */}
        {activeTab === "dns" && (
          <div className="space-y-4">
            {/* Nameservers */}
            <Section title={`Nameservers (${dns.ns?.length || 0})`} icon={<Network className="size-4 text-purple-500" />}
              sub={`Provider: ${monitoring?.dns_provider || "Unknown"}`}>
              <div className="flex flex-wrap gap-2 pt-1">
                {dns.ns?.length > 0 ? dns.ns.map((ns) => (
                  <span key={ns} className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 font-mono text-xs text-purple-600">
                    {ns}
                  </span>
                )) : <p className="text-xs text-muted-foreground">No NS records</p>}
              </div>
            </Section>

            {/* DNS Record grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <DnsSection title="A — IPv4" items={dns.a} onCopy={copyToClipboard} copied={copiedRecord} color="blue" />
              <DnsSection title="AAAA — IPv6" items={dns.aaaa} onCopy={copyToClipboard} copied={copiedRecord} color="indigo" />
              <DnsSection title="MX — Mail" items={dns.mx?.map((m) => `${m.priority} ${m.exchange}`)} onCopy={copyToClipboard} copied={copiedRecord} color="amber" />
              <DnsSection title="TXT — Text Records" items={dns.txt} onCopy={copyToClipboard} copied={copiedRecord} color="green" />
            </div>
          </div>
        )}

        {/* ── TAB: SSL ── */}
        {activeTab === "ssl" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Section title="Certificate Details" icon={<Lock className="size-4 text-emerald-500" />}>
              <Row label="Status" value={monitoring?.ssl_valid ? "✅ Valid" : "❌ Invalid / Expired"} />
              <Row label="Days Remaining" value={monitoring?.ssl_days_remaining !== null ? `${monitoring?.ssl_days_remaining} days` : "—"} />
              <Row label="Issuer" value={monitoring?.ssl_issuer || "—"} />
              <Row label="Subject" value={monitoring?.ssl_subject || "—"} mono />
              <Row label="Hostname Match" value={monitoring?.ssl_hostname_matches ? "✅ Yes" : "❌ No"} />
            </Section>
            <Section title="Validity Period" icon={<ShieldCheck className="size-4 text-emerald-500" />}>
              <Row label="Valid From" value={monitoring?.ssl_valid_from ? new Date(monitoring.ssl_valid_from).toLocaleDateString() : "N/A"} />
              <Row label="Valid Until" value={monitoring?.ssl_valid_to ? new Date(monitoring.ssl_valid_to).toLocaleDateString() : "N/A"} />
              <Row label="Serial Number" value={monitoring?.ssl_serial_number || "N/A"} mono />
              <Row label="HTTPS Available" value={monitoring?.https_available ? "✅ Yes" : "❌ No"} />
            </Section>
          </div>
        )}

        {/* ── TAB: Email ── */}
        {activeTab === "email" && (
          <div className="space-y-4">
            {/* Quick status row */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <EmailPill label="MX" ok={!!monitoring?.email_has_mx} />
              <EmailPill label="SPF" ok={!!monitoring?.email_spf_record} />
              <EmailPill label="DMARC" ok={!!monitoring?.email_dmarc_record} />
              <EmailPill label="DKIM" ok={!!(monitoring?.email_dkim_records && monitoring.email_dkim_records.length > 0)} info="best effort" />
            </div>

            <Section title="Email Security Details" icon={<Mail className="size-4 text-[#3139fb]" />}
              sub="MX, SPF, DMARC, DKIM — checked from DNS records">
              <Row
                label="Mail Exchanger (MX)"
                value={monitoring?.email_has_mx
                  ? `✅ Configured (${dns.mx?.length || "?"} records)`
                  : "⚠️ Missing"}
              />
              {dns.mx?.length > 0 && (
                <div className="pb-3 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">MX Records</p>
                  <div className="space-y-1">
                    {dns.mx.map((m) => (
                      <div key={m.exchange} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2.5 py-1.5 font-mono text-xs">
                        <span className="text-muted-foreground w-8 shrink-0">P{m.priority}</span>
                        <span className="break-all text-foreground flex-1">{m.exchange}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Row label="SPF Record" value={monitoring?.email_spf_record ? "✅ Found" : "⚠️ Missing"} />
              {monitoring?.email_spf_record && (
                <RecordBox value={monitoring.email_spf_record} onCopy={copyToClipboard} copied={copiedRecord} />
              )}
              <Row label="DMARC Policy" value={monitoring?.email_dmarc_record ? "✅ Configured" : "⚠️ Missing"} />
              {monitoring?.email_dmarc_record && (
                <RecordBox value={monitoring.email_dmarc_record} onCopy={copyToClipboard} copied={copiedRecord} />
              )}
              <Row
                label="DKIM (common selectors)"
                value={monitoring?.email_dkim_records?.length ? `✅ Found (${monitoring.email_dkim_records.length} record${monitoring.email_dkim_records.length > 1 ? "s" : ""})` : "— Not found"}
              />
            </Section>
          </div>
        )}

        {/* ── TAB: SEO ── */}
        {activeTab === "seo" && (
          <div className="space-y-4">
            {/* SEO Score header */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#3139fb]/20 bg-[#fffcec] p-5">
              <div className={`grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-black ${
                (monitoring?.seo_score ?? 0) >= 80 ? "bg-emerald-100 text-emerald-700" :
                (monitoring?.seo_score ?? 0) >= 50 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700"
              }`}>
                {monitoring?.seo_score ?? "—"}
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3139fb]/60">SEO Health Score</p>
                <p className="font-heading text-lg font-bold text-[#3139fb]">
                  {monitoring?.seo_score !== null && monitoring?.seo_score !== undefined
                    ? monitoring.seo_score >= 80 ? "Great — Well Optimized"
                      : monitoring.seo_score >= 50 ? "Good — Some Improvements Needed"
                      : "Poor — Needs Attention"
                    : "Run 'Check Now' to analyze SEO"}
                </p>
                <p className="mt-0.5 text-xs text-[#3139fb]/60">Based on 11 checks across titles, meta, OG, Twitter, indexability, robots.txt & sitemap</p>
              </div>
            </div>

            {/* SEO checks list */}
            {monitoring?.seo_checks && monitoring.seo_checks.length > 0 && (
              <Section title="All SEO Checks" icon={<Search className="size-4 text-[#3139fb]" />}>
                <div className="divide-y divide-border/50">
                  {monitoring.seo_checks.map((check) => (
                    <div key={check.label} className="flex items-start justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SeoStatusIcon status={check.status} />
                        <span className="text-xs font-semibold text-foreground">{check.label}</span>
                      </div>
                      {check.detail && (
                        <span className="text-right text-[11px] text-muted-foreground break-all max-w-[55%]">{check.detail}</span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* SEO Details grid */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* On-page */}
              <Section title="On-Page SEO" icon={<Globe className="size-4 text-[#3139fb]" />}>
                <Row label="Title" value={monitoring?.seo_title || "—"} />
                <Row label="Title Length" value={monitoring?.seo_title ? `${monitoring.seo_title.length} chars` : "—"} />
                <Row label="Meta Description" value={monitoring?.seo_meta_description ? `${monitoring.seo_meta_description.length} chars` : "Missing"} />
                <Row label="Canonical URL" value={monitoring?.seo_canonical_url || "Not set"} mono />
                <Row label="Robots Meta" value={monitoring?.seo_robots_meta || "Not set (default: index,follow)"} />
                <Row label="Indexable" value={monitoring?.seo_is_indexable ? "✅ Yes" : "❌ No (noindex)"} />
              </Section>

              {/* Technical SEO */}
              <Section title="Technical SEO" icon={<ShieldCheck className="size-4 text-emerald-500" />}>
                <Row label="HTTPS" value={monitoring?.seo_https_redirects ? "✅ Served over HTTPS" : "❌ Not HTTPS"} />
                <Row label="www Canonical" value={monitoring?.seo_www_canonical || "—"} />
                <Row label="robots.txt" value={monitoring?.seo_robots_txt_exists ? (monitoring.seo_robots_txt_blocks_self ? "⚠️ Blocking all crawlers!" : "✅ Found") : "⚠️ Not found"} />
                <Row label="Sitemap" value={monitoring?.seo_sitemap_found ? "✅ Found" : "⚠️ Not found"} />
                {monitoring?.seo_sitemap_url && monitoring.seo_sitemap_found && (
                  <Row label="Sitemap URL" value={<a href={monitoring.seo_sitemap_url} target="_blank" rel="noreferrer" className="text-[#3139fb] hover:underline break-all text-[11px]">{monitoring.seo_sitemap_url}</a>} />
                )}
              </Section>

              {/* Open Graph */}
              <Section title="Open Graph / Social" icon={<ExternalLink className="size-4 text-blue-500" />}>
                <Row label="OG Tags Found" value={monitoring?.seo_has_og ? "✅ Yes" : "❌ No"} />
                <Row label="OG Title" value={monitoring?.seo_og_title || "—"} />
                <Row label="OG Description" value={monitoring?.seo_og_description ? `${monitoring.seo_og_description.substring(0, 80)}…` : "—"} />
                <Row label="OG Image" value={monitoring?.seo_og_image
                  ? <a href={monitoring.seo_og_image} target="_blank" rel="noreferrer" className="text-[#3139fb] hover:underline break-all text-[11px]">View Image</a>
                  : "—"} />
              </Section>

              {/* Twitter Card */}
              <Section title="Twitter / X Card" icon={<AlertTriangle className="size-4 text-sky-500" />}>
                <Row label="Card Found" value={monitoring?.seo_has_twitter_card ? "✅ Yes" : "⚠️ Not configured"} />
                <Row label="Card Type" value={monitoring?.seo_twitter_card || "—"} />
              </Section>
            </div>
          </div>
        )}

        {/* ── TAB: Events ── */}
        {activeTab === "events" && (
          <Section title="Change History Timeline" icon={<RefreshCw className="size-4 text-[#3139fb]" />}
            sub="Meaningful changes detected between on-demand checks">
            <DomainTimeline events={events} />
          </Section>
        )}
      </div>

      <CheckProgressModal
        isOpen={modalState.isOpen}
        domainName={domain.name}
        currentStep={modalState.step}
        error={modalState.error}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </main>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({
  title, icon, sub, children
}: {
  title: string; icon?: React.ReactNode; sub?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 font-heading text-sm font-bold text-foreground">
          {icon}{title}
        </h3>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4 border-b border-border/50 last:border-0">
      <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className={`text-right text-xs font-semibold text-foreground break-all ${mono ? "font-mono text-[11px]" : ""}`}>{value}</span>
    </div>
  );
}

function MiniCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
        {icon}
      </div>
      <p className="font-heading text-sm font-bold text-foreground truncate" title={value}>{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground truncate">{sub}</p>
    </div>
  );
}

function StatusPill({ ok, warn, label }: { ok: boolean; warn?: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
      ok ? "bg-emerald-100 text-emerald-700" :
      warn ? "bg-amber-100 text-amber-700" :
      "bg-red-100 text-red-700"
    }`}>
      <span className={`size-1.5 rounded-full ${ok ? "bg-emerald-500" : warn ? "bg-amber-500" : "bg-red-500"}`} />
      {label}
    </span>
  );
}

function EmailPill({ label, ok, info }: { label: string; ok: boolean; info?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 rounded-xl border p-3 text-center ${
      ok ? "border-emerald-500/30 bg-emerald-50 text-emerald-700" : "border-amber-500/30 bg-amber-50 text-amber-700"
    }`}>
      {ok ? <Check className="size-4" /> : <AlertTriangle className="size-4" />}
      <span className="font-mono text-xs font-black">{label}</span>
      {info && <span className="text-[9px] opacity-60">{info}</span>}
    </div>
  );
}

function SeoStatusIcon({ status }: { status: "pass" | "fail" | "warn" }) {
  if (status === "pass") return <Check className="size-3.5 shrink-0 text-emerald-500" />;
  if (status === "fail") return <X className="size-3.5 shrink-0 text-red-500" />;
  return <Minus className="size-3.5 shrink-0 text-amber-500" />;
}

function DnsSection({
  title, items, onCopy, copied, color
}: {
  title: string; items?: string[]; onCopy: (v: string) => void; copied: string | null;
  color: "blue" | "indigo" | "amber" | "green";
}) {
  const colors = {
    blue: "border-blue-500/20 bg-blue-500/5 text-blue-700",
    indigo: "border-indigo-500/20 bg-indigo-500/5 text-indigo-700",
    amber: "border-amber-500/20 bg-amber-500/5 text-amber-700",
    green: "border-green-500/20 bg-green-500/5 text-green-700",
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</h4>
      <div className="space-y-1.5">
        {items && items.length > 0 ? items.map((item) => (
          <div key={item} className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 font-mono text-xs ${colors[color]}`}>
            <span className="break-all flex-1 leading-relaxed">{item}</span>
            <button
              onClick={() => onCopy(item)}
              className="shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity"
              title="Copy"
            >
              {copied === item ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        )) : (
          <p className="text-xs text-muted-foreground">No records</p>
        )}
      </div>
    </div>
  );
}

function RecordBox({ value, onCopy, copied }: { value: string; onCopy: (v: string) => void; copied: string | null }) {
  return (
    <div className="mb-2 flex items-start gap-2 rounded-lg bg-muted/50 px-2.5 py-2">
      <span className="flex-1 break-all font-mono text-[10px] text-foreground leading-relaxed">{value}</span>
      <button onClick={() => onCopy(value)} className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground" title="Copy">
        {copied === value ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
      </button>
    </div>
  );
}
