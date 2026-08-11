import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Page() {
  return <main className="min-h-screen bg-muted/30"><header className="border-b bg-background"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6"><Link href="/" className="font-semibold tracking-tight">DomDock</Link><ThemeToggle /></div></header><section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12"><div className="w-full max-w-md"><div className="mb-8 text-center"><h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1><p className="mt-2 text-sm text-muted-foreground">Sign in to manage your domains.</p></div><LoginForm /></div></section></main>;
}
