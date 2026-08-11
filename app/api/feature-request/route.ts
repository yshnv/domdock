import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, description, email } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user || null;
    } catch {
      // Safely ignore auth errors if user is not signed in
    }
    const { error: dbError } = await supabase.from("feature_requests").insert({
      user_id: user?.id || null,
      title: title.trim(),
      category: category || "General",
      description: description.trim(),
      contact_email: email ? email.trim() : user?.email || null
    });

    if (dbError) {
      console.error("[feature-request] DB insert error:", dbError);
      return NextResponse.json(
        { error: `Failed to save request: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Thank you! Your feature request has been submitted successfully."
    });
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
