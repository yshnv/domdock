"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Zap
} from "lucide-react";

type DemoDomain = {
  id: string;
  name: string;
  registrar: string;
  expiresInDays: number;
  expiryDate: string;
  status: "healthy" | "warning" | "offline";
  sslStatus: "Valid (TLS 1.3)" | "Expiring Soon" | "Expired";
  dnsLatency: string;
  autoRenew: boolean;
};

const initialDomains: DemoDomain[] = [
  {
    id: "1",
    name: "studio.dev",
    registrar: "Namecheap",
    expiresInDays: 8,
    expiryDate: "Aug 19, 2026",
    status: "warning",
    sslStatus: "Expiring Soon",
    dnsLatency: "14ms",
    autoRenew: false
  },
  {
    id: "2",
    name: "arc.net",
    registrar: "Cloudflare Inc.",
    expiresInDays: 312,
    expiryDate: "Jun 20, 2027",
    status: "healthy",
    sslStatus: "Valid (TLS 1.3)",
    dnsLatency: "9ms",
    autoRenew: true
  },
  {
    id: "3",
    name: "api.ship.io",
    registrar: "Gandi SAS",
    expiresInDays: 44,
    expiryDate: "Sep 24, 2026",
    status: "healthy",
    sslStatus: "Valid (TLS 1.3)",
    dnsLatency: "18ms",
    autoRenew: true
  },
  {
    id: "4",
    name: "domdock.io",
    registrar: "Porkbun LLC",
    expiresInDays: 180,
    expiryDate: "Feb 07, 2027",
    status: "healthy",
    sslStatus: "Valid (TLS 1.3)",
    dnsLatency: "11ms",
    autoRenew: true
  }
];

export function DomainHealthWidget() {
  const [domains] = useState<DemoDomain[]>(initialDomains);
  const [filter, setFilter] = useState<"all" | "warning" | "healthy">("all");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "dns" | "activity">(
    "overview"
  );

  const filteredDomains = domains.filter((d) => {
    const matchesFilter =
      filter === "all"
        ? true
        : filter === "warning"
          ? d.expiresInDays <= 30 || d.status === "warning"
          : d.status === "healthy";
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.registrar.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const totalTracked = domains.length;
  const warningCount = domains.filter(
    (d) => d.expiresInDays <= 30 || d.status === "warning"
  ).length;
  const healthyCount = domains.filter((d) => d.status === "healthy").length;

  return (
    <div className="w-full overflow-hidden rounded-[22px] border border-[#3139fb]/25 bg-[#fffcec] p-4 sm:p-6 arc-shadow-elevated transition-all duration-200 ease-out">
      {/* Header bar */}
      <div className="flex flex-col gap-4 border-b border-[#3139fb]/15 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-[10px] bg-[#3139fb] text-white shadow-[0_2px_8px_rgba(49,57,251,0.25)]">
            <Globe className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-[#3139fb]">
                Domain Control Room
              </h3>
              <span className="rounded-[4px] bg-[#fffadd] px-2 py-0.5 font-mono text-[10px] font-bold text-[#3139fb] border border-[#3139fb]/20">
                LIVE DEMO
              </span>
            </div>
            <p className="text-xs text-[#3139fb]/70">
              Automated RDAP registry & website status tracking
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-[8px] border border-[#3139fb]/15 bg-white p-1">
          {(["overview", "dns", "activity"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-[6px] px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-100 ease-out ${
                activeTab === tab
                  ? "bg-[#3139fb] text-white shadow-sm"
                  : "text-[#3139fb]/70 hover:text-[#3139fb] hover:bg-[#fffcec]"
              }`}
            >
              {tab === "overview"
                ? "Overview"
                : tab === "dns"
                  ? "DNS & SSL"
                  : "Activity"}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="my-5 grid grid-cols-3 gap-3">
        <div className="rounded-[10px] border border-[#3139fb]/15 bg-white p-3.5 arc-shadow-card">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3139fb]/60">
            Total Monitored
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-2xl text-[#3139fb]">
              {totalTracked}
            </span>
            <span className="text-[11px] font-semibold text-[#3139fb]/70">
              Domains
            </span>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#3139fb]/15 bg-white p-3.5 arc-shadow-card">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3139fb]/60">
            Healthy Status
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-2xl text-[#3139fb]">
              {healthyCount}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 className="size-3" /> 100% UP
            </span>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#3139fb]/20 bg-[#fffadd] p-3.5 arc-shadow-card">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3139fb]">
            Action Needed
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-display text-2xl text-[#3139fb]">
              {warningCount}
            </span>
            <span className="text-[11px] font-bold text-[#3139fb]">
              {warningCount > 0 ? "Renew soon" : "All clear"}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#3139fb]/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domain or registrar..."
            className="w-full rounded-[8px] border border-[#3139fb]/20 bg-white py-2 pl-8 pr-3 text-xs font-medium text-[#3139fb] placeholder-[#3139fb]/40 outline-none focus:border-[#3139fb] focus:ring-1 focus:ring-[#3139fb]"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-[8px] border border-[#3139fb]/15 bg-white p-1">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-[6px] px-2.5 py-1 text-[11px] font-semibold transition-all ${
                filter === "all"
                  ? "bg-[#3139fb] text-white"
                  : "text-[#3139fb]/70 hover:text-[#3139fb]"
              }`}
            >
              All ({domains.length})
            </button>
            <button
              onClick={() => setFilter("warning")}
              className={`rounded-[6px] px-2.5 py-1 text-[11px] font-semibold transition-all ${
                filter === "warning"
                  ? "bg-[#3139fb] text-white"
                  : "text-[#3139fb]/70 hover:text-[#3139fb]"
              }`}
            >
              Expiring ({warningCount})
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#3139fb]/20 bg-white px-3 text-xs font-semibold text-[#3139fb] transition-all hover:bg-[#fffadd] active:scale-95 disabled:opacity-50"
          >
            <RefreshCw
              className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-2.5">
          {filteredDomains.map((domain) => {
            const isWarning = domain.expiresInDays <= 30;
            return (
              <div
                key={domain.id}
                className="group flex flex-col gap-3 rounded-[10px] border border-[#3139fb]/15 bg-white p-3.5 transition-all duration-150 ease-out hover:border-[#3139fb] hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Domain & Registrar info */}
                <div className="flex items-center gap-3">
                  <div
                    className={`grid size-8 place-items-center rounded-[8px] ${
                      isWarning
                        ? "bg-[#fffadd] text-[#3139fb]"
                        : "bg-[#3139fb]/10 text-[#3139fb]"
                    }`}
                  >
                    <Globe className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-bold text-[#3139fb]">
                        {domain.name}
                      </span>
                      <a
                        href={`https://${domain.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#3139fb]/40 hover:text-[#3139fb]"
                      >
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                    <p className="font-mono text-[11px] text-[#3139fb]/60">
                      {domain.registrar} • Auto-renew:{" "}
                      {domain.autoRenew ? "ON" : "OFF"}
                    </p>
                  </div>
                </div>

                {/* Expiry countdown & status */}
                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-[#3139fb]/60">
                      Expires {domain.expiryDate}
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="size-3 text-[#3139fb]/70" />
                      <span
                        className={`font-mono text-xs font-bold ${
                          isWarning ? "text-amber-600" : "text-[#3139fb]"
                        }`}
                      >
                        {domain.expiresInDays} days left
                      </span>
                    </div>
                  </div>

                  <div className="w-24">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#3139fb]/10">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isWarning ? "bg-amber-500" : "bg-[#3139fb]"
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(10, (domain.expiresInDays / 365) * 100))}%`
                        }}
                      />
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-[6px] px-2.5 py-1 text-[11px] font-bold ${
                      isWarning
                        ? "bg-[#fffadd] text-[#3139fb] border border-[#3139fb]/20"
                        : "bg-[#3139fb] text-white"
                    }`}
                  >
                    {isWarning ? "Review" : "Healthy"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "dns" && (
        <div className="space-y-2.5">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="flex items-center justify-between rounded-[10px] border border-[#3139fb]/15 bg-white p-3.5"
            >
              <div className="flex items-center gap-3">
                <Shield className="size-4 text-[#3139fb]" />
                <div>
                  <span className="font-heading text-sm font-bold text-[#3139fb]">
                    {domain.name}
                  </span>
                  <p className="font-mono text-[11px] text-[#3139fb]/60">
                    DNS latency: {domain.dnsLatency}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-[6px] bg-[#fffadd] px-2.5 py-1 font-mono text-[11px] font-bold text-[#3139fb]">
                  SSL: {domain.sslStatus}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-600">
                  <Zap className="size-3" /> Resolved
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "activity" && (
        <div className="space-y-3 rounded-[10px] border border-[#3139fb]/15 bg-white p-4">
          <div className="flex items-start gap-3 border-b border-[#3139fb]/10 pb-3">
            <Sparkles className="size-4 text-[#3139fb]" />
            <div>
              <p className="text-xs font-bold text-[#3139fb]">
                RDAP Health Check executed
              </p>
              <p className="font-mono text-[11px] text-[#3139fb]/60">
                studio.dev expiration synced. 8 days remaining. Warning flag
                set.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-[#3139fb]">
                Daily status check complete
              </p>
              <p className="font-mono text-[11px] text-[#3139fb]/60">
                4/4 domains online and responding under 20ms latency.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
