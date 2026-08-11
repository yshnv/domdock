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
  Lock,
  ExternalLink,
  Building
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
  last_checked_at: string | null;
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
  const [monitoring, setMonitoring] = useState<MonitoringDetail | null>(null);
  const [events, setEvents] = useState<DomainEvent[]>([]);
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "dns" | "ssl" | "events">("overview");

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    step: number;
    error: string | null;
  }>({
    isOpen: false,
    step: 0,
    error: null
  });

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
        if (monJson.monitoring) {
          setMonitoring(monJson.monitoring);
        }
      }

      if (evtRes.ok) {
        const evtJson = await evtRes.json();
        if (evtJson.events) {
          setEvents(evtJson.events);
        }
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
      setModalState((prev) => ({
        ...prev,
        step: Math.min(prev.step + 1, 5)
      }));
    }, 600);

    try {
      const res = await fetch(`/api/domains/${domain.id}/check`, { method: "POST" });
      clearInterval(interval);

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to complete check");
      }

      setModalState((prev) => ({ ...prev, step: 6 }));

      // Refresh domain data
      const { data: updatedDomain } = await supabase
        .from("domains")
        .select("*")
        .eq("id", domain.id)
        .single();

      if (updatedDomain) setDomain(updatedDomain);
      await fetchMonitoringAndEvents();

      setTimeout(() => {
        setModalState({ isOpen: false, step: 0, error: null });
      }, 800);
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
    if (!error) {
      router.push("/dashboard");
    } else {
      setDeleting(false);
    }
  };

  const logout = async () => {
    if (window.confirm("Are you sure you want to log out of DomDock?")) {
      await supabase.auth.signOut();
      window.location.href = "/";
    }
  };

  const dns = domain.dns_records || { a: [], aaaa: [], mx: [], ns: [], txt: [] };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/30 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-heading text-base font-bold text-foreground"
            >
              <div className="grid size-7 place-items-center rounded-[8px] bg-[#3139fb] text-white shadow-sm">
                <div className="size-2 rounded-full bg-white" />
              </div>
              DomDock
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-mono text-xs font-semibold text-[#3139fb]">
              {domain.name}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#3139fb]">
            <span className="hidden rounded-[6px] bg-[#fffcec] px-3 py-1 font-mono text-[11px] border border-[#3139fb]/20 sm:inline-block">
              {userEmail}
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
        {/* Top Back Navigation & Action Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to Dashboard
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={triggerOnDemandCheck}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#3139fb] px-4 text-xs font-semibold text-white shadow-md hover:bg-[#3139fb]/90 transition-all active:scale-95"
            >
              <RefreshCw className="size-3.5" /> Check Now
            </button>

            <button
              disabled={deleting}
              onClick={deleteDomain}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 text-xs font-semibold text-red-600 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* Domain Title & Header Status */}
        <div className="mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-xl bg-[#3139fb]/10 text-[#3139fb]">
                <Globe className="size-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                    {domain.name}
                  </h1>
                  <a
                    href={`https://${domain.name}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#3139fb] hover:underline"
                  >
                    Visit <ExternalLink className="size-3" />
                  </a>
                </div>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  Last checked:{" "}
                  {domain.last_checked_at
                    ? new Date(domain.last_checked_at).toLocaleString()
                    : "Pending"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <HealthScoreBadge score={monitoring?.health_score ?? (domain.health === "healthy" ? 95 : 60)} size="lg" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 flex border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "overview"
                ? "border-[#3139fb] text-[#3139fb]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview & Intelligence
          </button>
          <button
            onClick={() => setActiveTab("dns")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "dns"
                ? "border-[#3139fb] text-[#3139fb]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            DNS Records
          </button>
          <button
            onClick={() => setActiveTab("ssl")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "ssl"
                ? "border-[#3139fb] text-[#3139fb]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            SSL & Security
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "events"
                ? "border-[#3139fb] text-[#3139fb]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Change History ({events.length})
          </button>
        </div>

        {/* Tab 1: Overview & Intelligence */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* 4 Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <OverviewCard
                icon={<Building className="size-5 text-[#3139fb]" />}
                label="REGISTRAR"
                value={monitoring?.registrar_name || "Registrar unavailable"}
                subtext={monitoring?.registrar_iana_id ? `IANA ID: ${monitoring.registrar_iana_id}` : "RDAP lookup"}
              />

              <OverviewCard
                icon={<Network className="size-5 text-purple-500" />}
                label="DNS PROVIDER"
                value={monitoring?.dns_provider || "DNS provider unknown"}
                subtext={`${dns.ns?.length || 0} nameservers resolved`}
              />

              <OverviewCard
                icon={<Server className="size-5 text-amber-500" />}
                label="HOSTING PROVIDER"
                value={monitoring?.hosting_provider || "Unknown"}
                subtext="CNAME & Header inspection"
              />

              <OverviewCard
                icon={<Lock className="size-5 text-emerald-500" />}
                label="SSL CERTIFICATE"
                value={
                  monitoring?.ssl_valid
                    ? `${monitoring.ssl_days_remaining ?? 0} days remaining`
                    : "SSL Invalid / Unreachable"
                }
                subtext={monitoring?.ssl_issuer ? `Issuer: ${monitoring.ssl_issuer}` : "TLS Port 443"}
              />
            </div>

            {/* Detailed Intelligence Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Domain & RDAP Details */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
                  <Globe className="size-4 text-[#3139fb]" /> Domain & Registration Info
                </h3>
                <div className="mt-4 divide-y divide-border/60 text-xs">
                  <DetailRow label="Domain Name" value={domain.name} />
                  <DetailRow
                    label="Expiration Date"
                    value={
                      domain.expires_at
                        ? `${domain.expires_at} (${days !== null ? `${days} days left` : ""})`
                        : "Unavailable"
                    }
                  />
                  <DetailRow label="Registrar Name" value={monitoring?.registrar_name || "Unavailable"} />
                  <DetailRow label="Registrar IANA ID" value={monitoring?.registrar_iana_id || "Unavailable"} />
                  {monitoring?.registrar_url && (
                    <DetailRow
                      label="Registrar URL"
                      value={
                        <a
                          href={monitoring.registrar_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#3139fb] hover:underline"
                        >
                          {monitoring.registrar_url}
                        </a>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Website Status & Latency */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
                  <ShieldCheck className="size-4 text-emerald-500" /> Website HTTPS Availability
                </h3>
                <div className="mt-4 divide-y divide-border/60 text-xs">
                  <DetailRow
                    label="Website Status"
                    value={
                      monitoring?.website_online
                        ? `Online (HTTP ${monitoring.website_status_code || 200})`
                        : "Offline / Unreachable"
                    }
                  />
                  <DetailRow
                    label="Response Time"
                    value={
                      domain.response_time_ms
                        ? `${domain.response_time_ms} ms`
                        : monitoring?.website_response_time_ms
                        ? `${monitoring.website_response_time_ms} ms`
                        : "N/A"
                    }
                  />
                  <DetailRow label="Final Redirect URL" value={monitoring?.website_final_url || `https://${domain.name}`} />
                  <DetailRow label="Redirect Count" value={String(monitoring?.website_redirect_count ?? 0)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: DNS Records */}
        {activeTab === "dns" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-heading text-base font-bold text-foreground">Authoritative Nameservers</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Authoritative DNS Provider:{" "}
                <span className="font-bold text-foreground">{monitoring?.dns_provider || "Unknown"}</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {dns.ns?.length > 0 ? (
                  dns.ns.map((nsHost) => (
                    <span
                      key={nsHost}
                      className="rounded-lg border border-purple-500/20 bg-purple-500/10 px-3 py-1.5 font-mono text-xs font-medium text-purple-600 dark:text-purple-400"
                    >
                      {nsHost}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">No NS records returned</p>
                )}
              </div>
            </div>

            {/* A, AAAA, MX, TXT Records */}
            <div className="grid gap-6 md:grid-cols-2">
              <DnsRecordSection title="A Records (IPv4)" items={dns.a} onCopy={copyToClipboard} copied={copiedRecord} />
              <DnsRecordSection title="AAAA Records (IPv6)" items={dns.aaaa} onCopy={copyToClipboard} copied={copiedRecord} />
              <DnsRecordSection
                title="MX Records (Mail)"
                items={dns.mx?.map((m) => `${m.priority} ${m.exchange}`)}
                onCopy={copyToClipboard}
                copied={copiedRecord}
              />
              <DnsRecordSection title="TXT Records" items={dns.txt} onCopy={copyToClipboard} copied={copiedRecord} />
            </div>
          </div>
        )}

        {/* Tab 3: SSL & Security */}
        {activeTab === "ssl" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="flex items-center gap-2 font-heading text-base font-bold text-foreground">
              <Lock className="size-4 text-emerald-500" /> TLS / SSL Certificate Details
            </h3>
            <div className="mt-4 divide-y divide-border/60 text-xs">
              <DetailRow
                label="Certificate Status"
                value={monitoring?.ssl_valid ? "Valid TLS Certificate" : "Invalid / Expired / Unreachable"}
              />
              <DetailRow label="Days Remaining" value={monitoring?.ssl_days_remaining !== null ? `${monitoring?.ssl_days_remaining} days` : "Unknown"} />
              <DetailRow label="Issuer" value={monitoring?.ssl_issuer || "Unavailable"} />
              <DetailRow label="Subject / Common Name" value={monitoring?.ssl_subject || "Unavailable"} />
              <DetailRow label="Hostname Matches Domain" value={monitoring?.ssl_hostname_matches ? "Yes" : "No"} />
              <DetailRow label="Valid From" value={monitoring?.ssl_valid_from ? new Date(monitoring.ssl_valid_from).toLocaleDateString() : "N/A"} />
              <DetailRow label="Valid Until" value={monitoring?.ssl_valid_to ? new Date(monitoring.ssl_valid_to).toLocaleDateString() : "N/A"} />
              <DetailRow label="Serial Number" value={monitoring?.ssl_serial_number || "N/A"} />
            </div>
          </div>
        )}

        {/* Tab 4: Change History */}
        {activeTab === "events" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-heading text-base font-bold text-foreground">Domain Change History Timeline</h3>
            <p className="mt-1 mb-6 text-xs text-muted-foreground">
              Records meaningful changes detected between on-demand domain checks.
            </p>
            <DomainTimeline events={events} />
          </div>
        )}
      </div>

      {/* Progress Modal */}
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

function OverviewCard({
  icon,
  label,
  value,
  subtext
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-2 font-heading text-base font-bold text-foreground truncate">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground truncate">{subtext}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="font-medium text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground text-right">{value}</span>
    </div>
  );
}

function DnsRecordSection({
  title,
  items,
  onCopy,
  copied
}: {
  title: string;
  items?: string[];
  onCopy: (val: string) => void;
  copied: string | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</h4>
      <div className="mt-3 space-y-2">
        {items && items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-xs font-mono">
              <span className="truncate text-foreground">{item}</span>
              <button
                onClick={() => onCopy(item)}
                className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                title="Copy to clipboard"
              >
                {copied === item ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No records</p>
        )}
      </div>
    </div>
  );
}
