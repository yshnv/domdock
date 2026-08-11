import Link from "next/link";
import { ArrowRight, Github, ShieldCheck, Sparkles } from "lucide-react";
import { ArcCtaSection } from "@/components/arc-cta-section";
import { ArcFeatureBento } from "@/components/arc-feature-bento";
import { ArcHeader } from "@/components/arc-header";
import { ArcLogoWall } from "@/components/arc-logo-wall";
import { DomainHealthWidget } from "@/components/domain-health-widget";
import { DomDockLogo } from "@/components/domdock-logo";

const repositoryUrl = "https://github.com/yshnv/domdock";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Arc Desktop Navigation Header */}
      <ArcHeader />

      <main className="mx-auto max-w-[1280px] px-4 sm:px-6">
        {/* 2. Hero Section — Viewport Constrained & Calm */}
        <section className="pb-12 pt-10 md:pb-16 md:pt-14">
          <div className="mx-auto max-w-3xl text-center">
            {/* Eyebrow — Section 1 eyebrow (hero) */}
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-[6px] bg-[#fffadd] px-3 py-1 font-mono text-[11px] font-bold text-[#3139fb] border border-[#3139fb]/20">
              <Sparkles className="size-3 text-[#3139fb]" />
              <span>CALM DOMAIN MONITORING</span>
            </div>

            {/* Display Headline — max 2 lines desktop */}
            <h1 className="font-display text-4xl font-bold tracking-tight text-[#3139fb] sm:text-5xl md:text-6xl lg:text-7xl">
              Experience calmer domain tracking.
            </h1>

            {/* Subtext — max 18 words */}
            <p className="mx-auto mt-4 max-w-xl text-balance text-sm font-semibold leading-relaxed text-[#3139fb]/80 sm:text-base">
              See every domain, registrar expiration date, and health status in
              one clear, quiet workspace.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#3139fb] px-6 font-body text-xs font-semibold text-white shadow-[0_2px_8px_rgba(49,57,251,0.25)] transition-all duration-100 ease-out hover:bg-[#3139fb]/90 active:scale-[0.98]"
              >
                <ShieldCheck className="size-4" />
                <span>Start Tracking Free</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <a
                href="#live-inspector"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#3139fb]/25 bg-[#fffcec] px-5 font-body text-xs font-semibold text-[#3139fb] transition-all duration-100 ease-out hover:bg-[#fffadd] active:scale-[0.98]"
              >
                <span>Explore Live Demo</span>
              </a>
            </div>
          </div>

          {/* Interactive Live Inspector Showcase */}
          <div id="live-inspector" className="mt-10 md:mt-12">
            <DomainHealthWidget />
          </div>
        </section>

        {/* 3. Logo Wall — Trusted by Modern Web Creators */}
        <section className="border-t border-[#3139fb]/15 py-8">
          <ArcLogoWall />
        </section>

        {/* 4. Asymmetric Bento Grid Section */}
        <section id="features" className="py-12 md:py-16">
          <div className="mb-8 max-w-xl">
            <h2 className="font-heading text-3xl font-bold text-[#3139fb] sm:text-4xl">
              Thoughtful features for people who ship on the web.
            </h2>
            <p className="mt-2 text-xs text-[#3139fb]/70">
              Designed around clarity and speed, with no clutter or complicated
              workflows.
            </p>
          </div>

          <ArcFeatureBento />
        </section>

        {/* 5. Poster Call To Action Section */}
        <section className="py-12 md:py-16">
          <ArcCtaSection />
        </section>
      </main>

      {/* 6. Single-line Crisp Footer */}
      <footer className="border-t border-[#3139fb]/15 bg-[#fffcec] py-6">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 sm:px-6 sm:flex-row sm:items-center sm:justify-between text-xs text-[#3139fb]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-heading font-bold">
              <span className="grid size-5 place-items-center rounded-[4px] bg-[#3139fb] text-white">
                <DomDockLogo className="size-3 text-white" />
              </span>
              DomDock
            </div>
            <span className="text-[#3139fb]/40">•</span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#3139fb]/80">
              <span className="size-2 rounded-full bg-emerald-500" /> System
              Operational
            </span>
          </div>

          <div className="flex items-center gap-6 font-semibold text-[#3139fb]/80">
            <Link href="/about" className="hover:text-[#3139fb]">
              About
            </Link>
            <a
              href={repositoryUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-[#3139fb]"
            >
              <Github className="size-3.5" />
              <span>yshnv/domdock</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
