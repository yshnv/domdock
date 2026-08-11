"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, ShieldCheck, User } from "lucide-react";
import { DomDockLogo } from "@/components/domdock-logo";
import { createClient } from "@/lib/supabase/client";

const repositoryUrl = "https://github.com/yshnv/domdock";

export function ArcHeader() {
  const [user, setUser] = useState<unknown>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-border/30 bg-background/90 backdrop-blur-md transition-all duration-150 ease-out">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 sm:px-6">
        {/* Brand Logo & Name */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-90"
        >
          <div className="grid size-7 place-items-center rounded-[8px] bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(49,57,251,0.25)] transition-transform duration-100 ease-out group-hover:scale-95">
            <DomDockLogo className="size-4 text-white" />
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
            href="/dashboard"
            className="text-primary font-bold transition-colors duration-100 ease-out hover:text-primary/80"
          >
            Dashboard
          </Link>
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
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-primary px-4 font-body text-xs font-semibold text-primary-foreground shadow-[0_2px_8px_rgba(49,57,251,0.2)] transition-all duration-100 ease-out hover:bg-primary/90 active:scale-[0.98]"
            >
              <LayoutDashboard className="size-3.5" />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex h-9 items-center justify-center gap-1 rounded-[8px] border border-primary/20 bg-card px-3.5 text-xs font-semibold text-primary shadow-sm hover:bg-accent transition-all duration-100 active:scale-[0.98]"
              >
                <User className="size-3.5" />
                <span>Sign in</span>
              </Link>
              <Link
                href="/auth/sign-up"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-primary px-4 font-body text-xs font-semibold text-primary-foreground shadow-[0_2px_8px_rgba(49,57,251,0.2)] transition-all duration-100 ease-out hover:bg-primary/90 active:scale-[0.98]"
              >
                <ShieldCheck className="size-3.5" />
                <span>Start Tracking</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
