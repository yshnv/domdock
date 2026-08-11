import Link from "next/link";
import { ArrowRight, ArrowLeft, Github, ShieldCheck } from "lucide-react";
import { ArcHeader } from "@/components/arc-header";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ArcHeader />

      <main className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-6 inline-flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3139fb]/70 hover:text-[#3139fb]"
          >
            <ArrowLeft className="size-3.5" /> Back to Home
          </Link>
        </div>

        <div className="overflow-hidden rounded-[22px] border border-[#3139fb]/20 bg-[#fffcec] p-8 arc-shadow-elevated md:p-14">
          <div className="max-w-3xl">
            <span className="rounded-[4px] bg-[#fffadd] px-2.5 py-1 font-mono text-[11px] font-bold text-[#3139fb] border border-[#3139fb]/20">
              MANIFESTO & ABOUT
            </span>

            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-[#3139fb] sm:text-5xl md:text-6xl">
              Visibility for the web assets you ship.
            </h1>

            <div className="mt-8 space-y-6 text-sm font-semibold leading-relaxed text-[#3139fb]/80">
              <p>
                DomDock is a focused, open-source tool built for developers, creators, and modern product teams who need clarity on their domain portfolio.
              </p>
              <p>
                We believe core developer utility tools should be calm, distraction-free, and straightforward: add a domain name, monitor health status, and know exactly when renewal actions are needed.
              </p>
              <p>
                No dark patterns, no registrar up-selling, and no noise. Just authoritative registry queries and instant notifications.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/auth/sign-up"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] bg-[#3139fb] px-6 font-body text-xs font-semibold text-white shadow-md transition-all hover:bg-[#3139fb]/90 active:scale-95"
              >
                <ShieldCheck className="size-4" />
                <span>Start Tracking Free</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <a
                href="https://github.com/yshnv/domdock"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[8px] border border-[#3139fb]/25 bg-white px-5 font-body text-xs font-semibold text-[#3139fb] transition-all hover:bg-[#fffadd] active:scale-95"
              >
                <Github className="size-4" />
                <span>View Source Code</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
