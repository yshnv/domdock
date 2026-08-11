import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DomainDetailClient from "./domain-detail-client";
import { Suspense } from "react";

export default function DomainDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-background font-mono text-xs uppercase tracking-[.14em]">
          Loading domain details...
        </div>
      }
    >
      <DomainDetailContent params={params} />
    </Suspense>
  );
}

async function DomainDetailContent({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: domain } = await supabase
    .from("domains")
    .select("*")
    .eq("id", id)
    .single();

  if (!domain) {
    redirect("/dashboard");
  }

  return <DomainDetailClient initialDomain={domain} userEmail={user.email ?? "Account"} />;
}
