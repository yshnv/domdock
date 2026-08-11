"use client";

import { Activity, Bell, Code2, ShieldAlert, Sparkles, Terminal } from "lucide-react";

export function ArcFeatureBento() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Cell 1: Expiry Radar (Spans 2 columns on desktop) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-[#3139fb]/20 bg-[#fffcec] p-6 transition-all duration-200 ease-out hover:border-[#3139fb] arc-shadow-card md:col-span-2">
        <div className="flex items-start justify-between">
          <div className="grid size-10 place-items-center rounded-[10px] bg-[#3139fb] text-white shadow-sm">
            <Activity className="size-5" />
          </div>
          <span className="rounded-[6px] bg-[#fffadd] px-2.5 py-1 font-mono text-[11px] font-bold text-[#3139fb] border border-[#3139fb]/20">
            AUTOMATED RDAP
          </span>
        </div>

        <div className="my-6">
          <h3 className="font-heading text-xl font-bold text-[#3139fb]">
            Instant WHOIS & Expiry Radar
          </h3>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#3139fb]/70">
            Never guess when a domain renews. DomDock queries authoritative registries directly to give you accurate expiration dates and WHOIS records.
          </p>
        </div>

        {/* Mini interactive UI visual */}
        <div className="rounded-[12px] border border-[#3139fb]/15 bg-white p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#3139fb]">studio.dev</span>
            <span className="font-mono font-bold text-amber-600">8 Days Left</span>
          </div>
          <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[#3139fb]/10">
            <div className="h-full w-[25%] rounded-full bg-amber-500 transition-all duration-300" />
          </div>
        </div>
      </div>

      {/* Cell 2: Silent Reminders (Yellow accent tile) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-[#3139fb]/25 bg-[#fffadd] p-6 transition-all duration-200 ease-out hover:border-[#3139fb] arc-shadow-card">
        <div className="flex items-start justify-between">
          <div className="grid size-10 place-items-center rounded-[10px] bg-[#3139fb] text-white">
            <Bell className="size-5" />
          </div>
          <span className="font-mono text-[10px] font-bold text-[#3139fb]">NO SPAM</span>
        </div>

        <div className="my-6">
          <h3 className="font-heading text-xl font-bold text-[#3139fb]">
            Calm, Useful Alerts
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-[#3139fb]/80">
            Notifications arrive 30 days and 7 days before expiration. Only what matters, before it becomes an emergency.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-[8px] border border-[#3139fb]/20 bg-white p-2.5 text-xs text-[#3139fb]">
          <ShieldAlert className="size-4 text-[#3139fb]" />
          <span className="font-medium">Webhooks + Email ready</span>
        </div>
      </div>

      {/* Cell 3: Open Source & Self Hosted (Dark blue accent block) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] bg-[#3139fb] p-6 text-white transition-all duration-200 ease-out arc-shadow-elevated">
        <div className="flex items-start justify-between">
          <div className="grid size-10 place-items-center rounded-[10px] bg-white/20 backdrop-blur-sm text-white">
            <Code2 className="size-5" />
          </div>
          <span className="rounded-[6px] bg-white/20 px-2 py-0.5 font-mono text-[10px] font-bold text-white">
            OPEN SOURCE
          </span>
        </div>

        <div className="my-6">
          <h3 className="font-heading text-xl font-bold text-white">
            Open & Private by Default
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-white/80">
            Fork it, host it, run it anywhere. Pure Next.js and Supabase foundation with zero tracking or vendor lock-in.
          </p>
        </div>

        <div className="rounded-[10px] bg-white/10 p-3 font-mono text-[11px] text-white/90 backdrop-blur-sm">
          <code>git clone https://github.com/yshnv/domdock.git</code>
        </div>
      </div>

      {/* Cell 4: DNS & SSL Status Stream (Spans 2 columns on desktop) */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-[22px] border border-[#3139fb]/20 bg-[#fffcec] p-6 transition-all duration-200 ease-out hover:border-[#3139fb] arc-shadow-card md:col-span-2">
        <div className="flex items-start justify-between">
          <div className="grid size-10 place-items-center rounded-[10px] bg-[#3139fb] text-white">
            <Terminal className="size-5" />
          </div>
          <div className="flex items-center gap-1.5 rounded-[6px] bg-white px-2.5 py-1 font-mono text-[10px] font-bold text-[#3139fb] border border-[#3139fb]/20">
            <Sparkles className="size-3 text-[#3139fb]" /> REAL-TIME MONITORING
          </div>
        </div>

        <div className="my-6">
          <h3 className="font-heading text-xl font-bold text-[#3139fb]">
            DNS & SSL Health Telemetry
          </h3>
          <p className="mt-2 max-w-lg text-xs leading-relaxed text-[#3139fb]/70">
            Automatic background status checks continuously ping your domain HTTP responses, SSL certificates, and DNS records so downtime never surprises you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-[10px] border border-[#3139fb]/15 bg-white p-3">
            <span className="font-mono text-[10px] text-[#3139fb]/60">HTTP RESPONSE</span>
            <p className="mt-1 font-mono text-xs font-bold text-emerald-600">200 OK</p>
          </div>
          <div className="rounded-[10px] border border-[#3139fb]/15 bg-white p-3">
            <span className="font-mono text-[10px] text-[#3139fb]/60">TLS 1.3 CERT</span>
            <p className="mt-1 font-mono text-xs font-bold text-[#3139fb]">Valid (214d)</p>
          </div>
          <div className="col-span-2 rounded-[10px] border border-[#3139fb]/15 bg-white p-3 sm:col-span-1">
            <span className="font-mono text-[10px] text-[#3139fb]/60">DNS RESOLVE</span>
            <p className="mt-1 font-mono text-xs font-bold text-[#3139fb]">11ms Avg</p>
          </div>
        </div>
      </div>
    </div>
  );
}
