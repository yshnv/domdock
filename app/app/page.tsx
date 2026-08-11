import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";
import { Suspense } from "react";

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background font-mono text-xs uppercase tracking-[.14em]">
          Loading DomDock Workspace...
        </div>
      }
    >
      <AppContent />
    </Suspense>
  );
}

async function AppContent() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: domains } = await supabase
    .from("domains")
    .select("*")
    .order("expires_at", { ascending: true });

  return <DashboardClient initialDomains={domains ?? []} email={user.email ?? "Account"} />;
}
