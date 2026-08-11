export const instant = false;

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArcHeader } from "@/components/arc-header";
import { SignUpForm } from "@/components/sign-up-form";

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
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </main>
    </div>
  );
}

