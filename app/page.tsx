"use client";

import Link from "next/link";
import { ArrowRight, Check, Github } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const repositoryUrl = "https://github.com/yshnv/domdock";
const features = [
  ["One clear view", "See every domain, registrar, expiry date, and health status in one calm workspace."],
  ["Useful reminders", "Know what needs attention before a renewal becomes an emergency."],
  ["Open by default", "A focused, privacy-friendly tool for people who ship on the web."],
];

function Brand() {
  return <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight"><span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><span className="size-2 rounded-full bg-primary-foreground" /></span>DomDock</Link>;
}

export default function Home() {
  return <main className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"><a href="#features" className="transition-colors hover:text-foreground">Features</a><Link href="/about" className="transition-colors hover:text-foreground">About</Link><a href={repositoryUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">GitHub</a><Link href="/auth/login" className="text-foreground hover:underline">Sign in</Link><ThemeToggle /></nav>
        <div className="flex items-center gap-2 md:hidden"><ThemeToggle /><Button asChild size="sm"><Link href="/auth/sign-up">Get started</Link></Button></div>
      </div>
    </header>

    <section className="mx-auto max-w-6xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32">
      <div className="max-w-3xl"><Badge variant="secondary" className="mb-6">Open source domain monitoring</Badge><h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Keep your domains healthy and never miss an expiry.</h1><p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">DomDock gives you one simple place to track domain health, expiry dates, and the next action that matters.</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg"><Link href="/auth/sign-up">Start tracking for free <ArrowRight data-icon="inline-end" /></Link></Button><Button asChild variant="outline" size="lg"><a href="#features">See how it works</a></Button></div></div>
      <div className="mt-20 grid gap-4 md:grid-cols-3"><Card className="md:col-span-2"><CardHeader><div className="flex items-center justify-between"><CardTitle>Domain overview</CardTitle><Badge>Live</Badge></div></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3"><Metric label="Tracked" value="12" /><Metric label="Healthy" value="10" /><Metric label="Expiring soon" value="2" /></div><Separator className="my-6" /><div className="flex items-center justify-between border-b py-3 text-sm"><span className="font-medium">example.com</span><span className="text-muted-foreground">Renews in 42 days</span><Badge variant="outline">Healthy</Badge></div><div className="flex items-center justify-between py-3 text-sm"><span className="font-medium">studio.dev</span><span className="text-muted-foreground">Renews in 8 days</span><Badge variant="destructive">Review</Badge></div></CardContent></Card><Card><CardHeader><CardTitle>Stay ahead</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">A focused dashboard that tells you what needs attention without adding noise.</p><ul className="mt-6 flex flex-col gap-3 text-sm">{["Expiry visibility", "Health checks", "Daily refresh"].map((item) => <li key={item} className="flex items-center gap-2"><Check data-icon="inline-start" className="text-primary" />{item}</li>)}</ul></CardContent></Card></div>
    </section>

    <section id="features" className="border-y bg-muted/30"><div className="mx-auto max-w-6xl px-4 py-20 sm:px-6"><div className="max-w-xl"><p className="text-sm font-medium text-primary">Everything you need</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Simple by design.</h2><p className="mt-4 text-muted-foreground">No complicated registrar workflows. Just the useful information, available when you need it.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{features.map(([title, description]) => <Card key={title}><CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">{description}</p></CardContent></Card>)}</div></div></section>

    <section className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-center md:justify-between"><div><h2 className="text-3xl font-semibold tracking-tight">Ready to keep watch?</h2><p className="mt-2 text-muted-foreground">Create your free DomDock workspace today.</p></div><Button asChild size="lg"><Link href="/auth/sign-up">Create free account <ArrowRight data-icon="inline-end" /></Link></Button></section>
    <footer className="border-t"><div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-4"><Brand /><span>Free and open source</span></div><a href={repositoryUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-foreground"><Github data-icon="inline-start" /> yshnv/domdock</a></div></footer>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-lg border bg-muted/30 p-4"><p className="text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
