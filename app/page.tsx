import Link from "next/link";
import {
  ArrowRight,
  Github,
  Globe,
  ShieldCheck,
  Lock,
  Search,
  Mail,
  Network,
  BarChart3,
  RefreshCw,
  Server,
  Clock,
  Check,
  AlertTriangle
} from "lucide-react";
import { ArcHeader } from "@/components/arc-header";
import { DomainHealthWidget } from "@/components/domain-health-widget";
import { DomDockLogo } from "@/components/domdock-logo";
import { Analytics } from "@vercel/analytics/next";
import packageJson from "@/package.json";

const repositoryUrl = "https://github.com/yshnv/domdock";

export const metadata = {
  title: "DomDock — Domain Monitoring Dashboard",
  description:
    "Monitor all your domains in one place. Track WHOIS expiry, SSL certificates, DNS records, email health, SEO signals, and website availability."
};

export default function Home() {
  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <ArcHeader />

        <main className="mx-auto max-w-[1280px] px-4 sm:px-6">
          {/* ── Hero ── */}
          <section className="pb-12 pt-10 md:pb-16 md:pt-14">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-[#fffadd] px-3 py-1 font-mono text-[11px] font-bold text-[#3139fb] border border-[#3139fb]/20">
                <span className="size-1.5 rounded-full bg-[#3139fb] animate-pulse" />
                <span>DOMAIN MONITORING · FREE &amp; OPEN SOURCE</span>
              </div>

              <h1 className="font-display text-4xl font-bold tracking-tight text-[#3139fb] sm:text-5xl md:text-6xl">
                One place for all your domain health.
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm font-semibold leading-relaxed text-[#3139fb]/70 sm:text-base">
                Track WHOIS expiry, SSL, DNS, email authentication, SEO signals,
                and website uptime — all from a single calm dashboard.
              </p>

              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#3139fb] px-6 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#3139fb]/90 active:scale-[0.98]"
                >
                  <ShieldCheck className="size-4" />
                  <span>Start Monitoring Free</span>
                  <ArrowRight className="size-3.5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#3139fb]/25 bg-[#fffcec] px-5 text-xs font-semibold text-[#3139fb] transition-all hover:bg-[#fffadd] active:scale-[0.98]"
                >
                  <span>See what&apos;s checked</span>
                </a>
              </div>
            </div>

            {/* Live Inspector Widget */}
            <div className="mt-10 md:mt-12">
              <DomainHealthWidget />
            </div>
          </section>

          {/* ── What DomDock Checks ── */}
          <section id="features" className="py-12 md:py-16 border-t border-[#3139fb]/10">
            <div className="mb-10 max-w-xl">
              <span className="rounded-[4px] bg-[#fffadd] px-2.5 py-1 font-mono text-[10px] font-bold text-[#3139fb] border border-[#3139fb]/20">
                WHAT GETS CHECKED
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold text-[#3139fb] sm:text-4xl">
                Everything about a domain, in one check.
              </h2>
              <p className="mt-2 text-sm text-[#3139fb]/70">
                Hit &ldquo;Check Now&rdquo; on any domain and DomDock runs all of these automatically.
              </p>
            </div>

            {/* 6-check bento grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <BentoCard
                icon={<Globe className="size-5" />}
                badge="WHOIS · RDAP"
                title="Domain & Expiry"
                desc="Fetches the exact expiration date, registrar name, IANA ID, and registrar URL directly from authoritative RDAP registries."
                preview={
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <Row label="Registrar" value="Namecheap, Inc." />
                    <Row label="Expires" value="2026-03-14" ok />
                    <Row label="Days Left" value="215 days" ok />
                  </div>
                }
              />

              <BentoCard
                icon={<Lock className="size-5" />}
                badge="TLS · PORT 443"
                title="SSL Certificate"
                desc="Validates the TLS certificate — checks issuer, subject, hostname match, days remaining, and whether HTTPS is available."
                preview={
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <Row label="Status" value="Valid" ok />
                    <Row label="Issuer" value="Let's Encrypt" ok />
                    <Row label="Expires In" value="84 days" ok />
                  </div>
                }
              />

              <BentoCard
                icon={<Network className="size-5" />}
                badge="DNS · A · MX · TXT · NS"
                title="DNS Records"
                desc="Resolves A, AAAA, MX, NS, TXT, and CNAME records. Detects the DNS provider and authoritative nameservers."
                preview={
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <Row label="DNS Provider" value="Cloudflare" ok />
                    <Row label="A Records" value="2 found" ok />
                    <Row label="NS Records" value="4 found" ok />
                  </div>
                }
              />

              <BentoCard
                icon={<ShieldCheck className="size-5" />}
                badge="HTTP · UPTIME"
                title="Website Availability"
                desc="Checks if the website responds with a healthy HTTP status, measures response time, follows redirects, and detects hosting provider."
                preview={
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <Row label="Status" value="200 OK" ok />
                    <Row label="Response" value="312 ms" ok />
                    <Row label="Hosting" value="Vercel" ok />
                  </div>
                }
              />

              <BentoCard
                icon={<Mail className="size-5" />}
                badge="MX · SPF · DKIM · DMARC"
                title="Email Health"
                desc="Checks mail exchange records, validates SPF policy, detects DMARC configuration, and probes common DKIM selectors."
                preview={
                  <div className="grid grid-cols-2 gap-1.5">
                    {["MX", "SPF", "DMARC", "DKIM"].map((r) => (
                      <div key={r} className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 font-mono text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <Check className="size-3 text-emerald-500" /> {r}
                      </div>
                    ))}
                  </div>
                }
              />

              <BentoCard
                icon={<Search className="size-5" />}
                badge="11 CHECKS"
                title="SEO Health"
                desc="Analyzes title, meta description, canonical, robots meta, robots.txt, sitemap, HTTPS, www canonicalization, Open Graph, Twitter Card, and indexability."
                preview={
                  <div className="space-y-1.5">
                    <SeoRow label="Title Tag" status="pass" />
                    <SeoRow label="Canonical URL" status="pass" />
                    <SeoRow label="Open Graph" status="warn" />
                    <SeoRow label="Sitemap" status="pass" />
                  </div>
                }
              />
            </div>

            {/* Additional capability chips */}
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { icon: <Server className="size-3" />, label: "Hosting Provider Detection" },
                { icon: <BarChart3 className="size-3" />, label: "Health Score (0–100)" },
                { icon: <RefreshCw className="size-3" />, label: "Change History Timeline" },
                { icon: <Clock className="size-3" />, label: "On-demand & Scheduled Checks" },
                { icon: <Globe className="size-3" />, label: "www Redirect Detection" },
                { icon: <Lock className="size-3" />, label: "SSRF-protected Infrastructure" },
              ].map(({ icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#3139fb]/20 bg-[#fffcec] px-3 py-1.5 font-mono text-[10px] font-semibold text-[#3139fb]"
                >
                  {icon} {label}
                </span>
              ))}
            </div>
          </section>

          {/* ── How it works ── */}
          <section className="py-12 md:py-16 border-t border-[#3139fb]/10">
            <div className="text-center mb-10">
              <span className="rounded-[4px] bg-[#fffadd] px-2.5 py-1 font-mono text-[10px] font-bold text-[#3139fb] border border-[#3139fb]/20">
                HOW IT WORKS
              </span>
              <h2 className="mt-3 font-heading text-3xl font-bold text-[#3139fb]">Simple as 1 — 2 — 3</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Add your domain",
                  desc: "Type or paste any domain name. DomDock strips protocols, paths, and auto-detects www redirects."
                },
                {
                  step: "02",
                  title: "Instant full check",
                  desc: "On the first add, DomDock runs WHOIS, SSL, DNS, HTTP, Email, and SEO checks simultaneously."
                },
                {
                  step: "03",
                  title: "Monitor & review",
                  desc: "Your dashboard shows live health scores, expiry countdowns, and a full change history timeline."
                }
              ].map(({ step, title, desc }) => (
                <div key={step} className="rounded-[18px] border border-[#3139fb]/20 bg-[#fffcec] p-6">
                  <span className="font-display text-4xl font-black text-[#3139fb]/15">{step}</span>
                  <h3 className="mt-2 font-heading text-base font-bold text-[#3139fb]">{title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#3139fb]/70">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="pb-12 md:pb-16">
            <div className="rounded-[22px] bg-[#3139fb] p-8 text-center text-white md:p-12">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Start monitoring your domains today.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-white/70">
                Free, open-source, and takes less than 30 seconds to set up. No credit card required.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-white px-6 text-xs font-bold text-[#3139fb] shadow-md transition-all hover:bg-[#fffadd] active:scale-[0.98]"
                >
                  <ShieldCheck className="size-4" />
                  Get Started Free
                  <ArrowRight className="size-3.5" />
                </Link>
                <a
                  href={repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-white/30 bg-white/10 px-5 text-xs font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
                >
                  <Github className="size-4" />
                  View Source
                </a>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="border-t border-[#3139fb]/15 bg-[#fffcec] py-5">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between text-xs text-[#3139fb]">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-heading font-bold">
                <span className="grid size-5 place-items-center rounded-[4px] bg-[#3139fb] text-white">
                  <DomDockLogo className="size-3 text-white" />
                </span>
                DomDock
                <span className="rounded-[4px] bg-[#fffadd] px-1.5 py-0.5 font-mono text-[10px] font-bold border border-[#3139fb]/20">
                  v{packageJson.version}
                </span>
              </div>
              <span className="text-[#3139fb]/30">·</span>
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#3139fb]/70">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Operational
              </span>
            </div>
            <div className="flex items-center gap-5 font-semibold text-[#3139fb]/70">
              <Link href="/auth/login" className="hover:text-[#3139fb]">Sign In</Link>
              <Link href="/auth/sign-up" className="hover:text-[#3139fb]">Sign Up</Link>
              <a href={repositoryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#3139fb]">
                <Github className="size-3.5" /> GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
      <Analytics />
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BentoCard({
  icon, badge, title, desc, preview
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  desc: string;
  preview: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between rounded-[20px] border border-[#3139fb]/20 bg-[#fffcec] p-5 transition-all hover:border-[#3139fb] hover:shadow-sm">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="grid size-9 place-items-center rounded-[8px] bg-[#3139fb] text-white shadow-sm">
            {icon}
          </div>
          <span className="rounded-full bg-[#fffadd] px-2.5 py-1 font-mono text-[9px] font-bold text-[#3139fb] border border-[#3139fb]/20">
            {badge}
          </span>
        </div>
        <h3 className="font-heading text-base font-bold text-[#3139fb]">{title}</h3>
        <p className="mt-1.5 text-[11px] leading-relaxed text-[#3139fb]/70">{desc}</p>
      </div>
      {/* Preview mockup */}
      <div className="mt-4 rounded-[10px] border border-[#3139fb]/15 bg-white p-3">
        {preview}
      </div>
    </div>
  );
}

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#3139fb]/50">{label}</span>
      <span className={ok ? "text-emerald-600 font-bold" : "text-[#3139fb] font-bold"}>{value}</span>
    </div>
  );
}

function SeoRow({ label, status }: { label: string; status: "pass" | "fail" | "warn" }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {status === "pass" && <Check className="size-3 text-emerald-500 shrink-0" />}
      {status === "warn" && <AlertTriangle className="size-3 text-amber-500 shrink-0" />}
      {status === "fail" && <AlertTriangle className="size-3 text-red-500 shrink-0" />}
      <span className={status === "pass" ? "text-emerald-700 font-semibold" : status === "warn" ? "text-amber-700 font-semibold" : "text-red-700 font-semibold"}>{label}</span>
    </div>
  );
}
