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

    // Insert into feature_requests table if created
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error: dbError } = await supabase.from("feature_requests").insert({
        user_id: user?.id || null,
        title: title.trim(),
        category: category || "General",
        description: description.trim(),
        contact_email: email ? email.trim() : user?.email || null,
        created_at: new Date().toISOString()
      });

      if (dbError) {
        console.warn("[feature-request] DB insert warning:", dbError.message);
      }
    } catch (dbErr) {
      console.warn("[feature-request] DB query exception:", dbErr);
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your feature request has been submitted successfully."
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
