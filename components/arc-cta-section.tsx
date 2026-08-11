"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";

export function ArcCtaSection() {
  return (
    <section className="relative overflow-hidden rounded-[22px] bg-[#3139fb] p-8 text-white arc-shadow-elevated md:p-12">
      {/* Background soft glow decoration */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-[6px] bg-white/15 px-3 py-1 font-mono text-[11px] font-bold text-white border border-white/20">
            <Zap className="size-3 text-[#fffadd]" />
            <span>FREE & OPEN SOURCE</span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Experience calmer domain tracking today.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/80">
            Join developers, creators, and teams who monitor their web assets with clarity and focus. No clutter, no unexpected expirations.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-white px-6 font-body text-xs font-bold text-[#3139fb] shadow-md transition-all duration-100 ease-out hover:bg-[#fffcec] active:scale-[0.98]"
          >
            <ShieldCheck className="size-4" />
            <span>Create Free Workspace</span>
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="https://github.com/yshnv/domdock"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] border border-white/30 bg-white/10 px-6 font-body text-xs font-bold text-white backdrop-blur-sm transition-all duration-100 ease-out hover:bg-white/20 active:scale-[0.98]"
          >
            <span>Star on GitHub</span>
          </a>
        </div>
      </div>
    </section>
  );
}
