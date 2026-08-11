import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFullDomainCheck } from "@/lib/monitoring/domainService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch domain record ensuring user owns it
  const { data: domain, error } = await supabase
    .from("domains")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !domain) {
    return NextResponse.json({ error: "Domain not found or access denied" }, { status: 404 });
  }

  try {
    const result = await runFullDomainCheck(domain.id, domain.name, supabase);
    return NextResponse.json({ success: true, monitoring: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to run domain check";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
