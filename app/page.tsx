"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Github, Menu, X } from "lucide-react";

const repositoryUrl = "https://github.com/yshnv/domdock";
const signInUrl = "/auth/login";
const signUpUrl = "/auth/sign-up";

function Mark() {
  return <span className="grid size-7 shrink-0 place-items-center bg-foreground text-background"><span className="size-2.5 bg-primary" /></span>;
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
    <div className="mx-auto grid h-20 max-w-[1600px] grid-cols-[1fr_auto] items-center px-5 md:grid-cols-12 md:px-8">
      <Link href="/" className="flex items-center gap-3 font-bold uppercase tracking-[-0.04em] md:col-span-3"><Mark /> DomDock</Link>
      <div className="hidden text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground md:col-span-6 md:block">Domain expiry intelligence / 2026</div>
      <nav className="hidden items-center justify-end gap-7 text-sm font-semibold md:col-span-3 md:flex" aria-label="Main navigation"><a href="#system" className="hover:text-primary">System</a><a href={repositoryUrl} target="_blank" rel="noreferrer" className="hover:text-primary">GitHub</a><Link href={signInUrl} className="hover:text-primary">Sign in</Link></nav>
      <button className="md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>{open ? <X /> : <Menu />}</button>
    </div>
    {open && <nav className="flex flex-col gap-5 border-t border-border px-5 py-6 text-sm font-semibold md:hidden" aria-label="Mobile navigation"><a href="#system" onClick={() => setOpen(false)}>System</a><a href={repositoryUrl} target="_blank" rel="noreferrer">GitHub</a><Link href={signInUrl}>Sign in</Link><Link href={signUpUrl} className="bg-primary px-4 py-3 text-center text-primary-foreground">Start tracking</Link></nav>}
  </header>;
}

function Label({ children }: { children: React.ReactNode }) { return <div className="section-label">{children}</div>; }

const systems = [
  ["01", "See the truth", "A clear view of every domain, its expiry date, and the days you have left."],
  ["02", "Stay ahead", "Get a direct reminder before a renewal becomes an emergency."],
  ["03", "Own the stack", "Open source, privacy focused, and built without registrar passwords."],
];

const differences = ["No more scattered registrar accounts", "No more surprise renewal failures", "No more forgotten domains in the dark", "No more premium tier for the basics"];

export default function Home() {
  return <main>
    <Header />
    <section className="poster-grid min-h-[calc(100vh-5rem)] pt-20">
      <div className="poster-aside"><Label>Manifesto</Label><span className="mt-auto hidden size-4 bg-foreground sm:block" /></div>
      <div className="col-span-12 flex flex-col justify-between px-5 py-16 md:col-span-9 md:px-12 md:py-20 lg:px-20">
        <div><p className="mb-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">A domain expiry tracker for people who ship</p><h1 className="max-w-6xl text-[clamp(3.75rem,10vw,10rem)] font-black uppercase leading-[.82] tracking-[-0.075em]">Never let a domain <span className="text-primary">expire.</span></h1></div>
        <div className="mt-16 grid max-w-3xl gap-10 sm:grid-cols-2 sm:items-end"><p className="max-w-sm text-lg leading-7 text-secondary-foreground">DomDock keeps your domains visible, your renewal dates clear, and your next move obvious.</p><div className="flex flex-col items-start gap-5"><Link href={signUpUrl} className="poster-button bg-primary text-primary-foreground hover:bg-foreground">Start tracking for free <ArrowUpRight className="size-4" /></Link><a href="#system" className="border-b border-foreground pb-1 text-sm font-semibold">Explore the system</a></div></div>
      </div>
    </section>

    <section id="system" className="poster-grid border-t border-border"><div className="poster-aside"><Label>System</Label></div><div className="col-span-12 px-5 py-16 md:col-span-9 md:px-12 md:py-24 lg:px-20"><h2 className="max-w-4xl text-[clamp(3rem,7vw,7rem)] font-bold uppercase leading-[.86] tracking-[-0.065em]">A better way to keep watch.</h2><div className="mt-16 grid border-l border-t border-border sm:grid-cols-3">{systems.map(([number, title, description]) => <article key={number} className="border-b border-r border-border p-6 transition-colors hover:bg-card sm:min-h-64"><span className="font-mono text-xs text-muted-foreground">{number}</span><h3 className="mt-16 text-xl font-bold uppercase tracking-tight">{title}</h3><p className="mt-4 text-sm leading-6 text-secondary-foreground">{description}</p></article>)}</div></div></section>

    <section className="poster-grid border-t border-border"><div className="poster-aside"><Label>Why different</Label></div><div className="col-span-12 px-5 py-12 md:col-span-9 md:px-12 md:py-20 lg:px-20">{differences.map((item, i) => <div key={item} className="group flex items-start gap-5 border-t border-border py-8 md:items-center md:py-10"><span className="font-mono text-xs text-muted-foreground">0{i + 1}</span><h3 className="text-[clamp(1.8rem,4vw,4.5rem)] font-bold leading-none tracking-[-0.055em] transition-colors group-hover:text-primary">{item}</h3></div>)}</div></section>

    <section className="poster-grid border-t border-border"><div className="poster-aside"><Label>Reality check</Label></div><div className="col-span-12 px-5 py-16 md:col-span-9 md:px-12 md:py-24 lg:px-20"><div className="grid gap-12 md:grid-cols-2 md:gap-20"><div><h2 className="text-[clamp(3rem,7vw,7rem)] font-bold uppercase leading-[.86] tracking-[-0.065em]">Domains are easy to forget.</h2></div><div className="flex flex-col justify-end"><p className="max-w-md text-lg leading-7 text-secondary-foreground">You buy a domain, build something on it, and months later you are trying to remember when it renews. DomDock steps in before the last step.</p><div className="mt-12 border-t border-border pt-5 font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">Buy / Build / Forget / Recover</div></div></div></div></section>

    <section className="poster-grid border-t border-border"><div className="poster-aside"><Label>Access</Label></div><div className="col-span-12 flex min-h-[55vh] flex-col justify-between px-5 py-16 md:col-span-9 md:px-12 md:py-24 lg:px-20"><div><p className="mb-8 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">Free forever / open source</p><h2 className="max-w-5xl text-[clamp(4rem,10vw,10rem)] font-black uppercase leading-[.8] tracking-[-0.08em]">Start<br /><span className="text-primary">exploring.</span></h2></div><div className="flex flex-col justify-between gap-10 sm:flex-row sm:items-end"><p className="max-w-sm text-lg leading-7 text-secondary-foreground">Add your domains once. Let DomDock keep the future visible.</p><div className="flex flex-col items-start gap-5"><Link href={signUpUrl} className="poster-button bg-foreground text-background hover:bg-primary">Create your account <ArrowUpRight className="size-4" /></Link><a href={repositoryUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold hover:text-primary"><Github className="size-4" /> Read the source</a></div></div></div></section>

    <footer className="border-t border-border px-5 py-8 md:px-8"><div className="mx-auto flex max-w-[1600px] flex-col gap-6 text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span className="font-bold tracking-tight text-foreground">DomDock / 2026</span><span>Free and open source</span><a href={repositoryUrl} target="_blank" rel="noreferrer" className="hover:text-primary">github.com/yshnv/domdock</a></div></footer>
  </main>;
}
