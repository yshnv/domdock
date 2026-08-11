"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
// import { ThemeToggle } from "@/components/theme-toggle";

const repositoryUrl = "https://github.com/yshnv/domdock";

export function ArcHeader() {
  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border/30 bg-background/90 backdrop-blur-md transition-all duration-150 ease-out">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-90"
        >
          <div className="grid size-7 place-items-center rounded-[8px] bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(49,57,251,0.25)] transition-transform duration-100 ease-out group-hover:scale-95">
            <div className="size-2 rounded-full bg-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-base font-bold tracking-tight">
              DomDock
            </span>
            <span className="rounded-[4px] bg-[#fffadd] dark:bg-amber-900/40 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary border border-primary/20">
              v1.0
            </span>
          </div>
        </Link>

        {/* Navigation Links - Single line desktop nav */}
        <nav className="hidden items-center gap-6 text-xs font-semibold text-foreground/80 md:flex">
          <a
            href="#features"
            className="transition-colors duration-100 ease-out hover:text-foreground"
          >
            Features
          </a>
          <a
            href="#live-inspector"
            className="transition-colors duration-100 ease-out hover:text-foreground"
          >
            Live Monitor
          </a>
          <Link
            href="/about"
            className="transition-colors duration-100 ease-out hover:text-foreground"
          >
            About
          </Link>
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 transition-colors duration-100 ease-out hover:text-foreground"
          >
            GitHub <ArrowUpRight className="size-3 opacity-60" />
          </a>
        </nav>

        {/* Actions & CTA */}
        <div className="flex items-center gap-3">
          {/* <ThemeToggle /> */}
          <Link
            href="/auth/login"
            className="hidden text-xs font-semibold text-foreground hover:underline sm:inline-block"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-primary px-4 font-body text-xs font-semibold text-primary-foreground shadow-[0_2px_8px_rgba(49,57,251,0.2)] transition-all duration-100 ease-out hover:bg-primary/90 active:scale-[0.98]"
          >
            <ShieldCheck className="size-3.5" />
            <span>Start Tracking</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
