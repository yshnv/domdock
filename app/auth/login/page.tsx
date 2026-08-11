import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function Page() {
  return <main className="min-h-screen bg-background"><div className="mx-auto grid min-h-screen max-w-[1600px] md:grid-cols-12"><aside className="hidden border-r border-border p-10 md:col-span-3 md:flex md:flex-col md:justify-between"><Link href="/" className="flex items-center gap-3 text-sm font-black uppercase"><span className="grid size-7 place-items-center bg-foreground"><span className="size-2.5 bg-primary" /></span>DomDock</Link><p className="section-label">Account / 01</p></aside><section className="col-span-12 flex items-center px-5 py-16 md:col-span-9 md:px-16 lg:px-28"><div className="w-full max-w-xl"><p className="section-label mb-6">Welcome back</p><h1 className="mb-10 text-6xl font-black uppercase leading-[.84] tracking-[-.08em] md:text-8xl">Keep watch.</h1><LoginForm /></div></section></div></main>;
}
