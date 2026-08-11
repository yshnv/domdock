import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArcHeader } from "@/components/arc-header";
import { LoginForm } from "@/components/login-form";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ArcHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-[#3139fb]">Welcome back</h1>
            <p className="mt-2 text-xs font-medium text-[#3139fb]/70">Sign in to manage your domains.</p>
          </div>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}

