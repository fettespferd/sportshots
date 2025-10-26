import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${origin}/signin?error=auth_error`);
    }

    // Check if this is a password recovery flow
    const { data: { session } } = await supabase.auth.getSession();
    
    // If the user accessed this via password recovery email, redirect to reset password page
    if (session && requestUrl.searchParams.get("type") === "recovery") {
      return NextResponse.redirect(`${origin}/reset-password#access_token=${session.access_token}&refresh_token=${session.refresh_token}&type=recovery`);
    }
  }

  // Redirect to home or specified next page
  return NextResponse.redirect(`${origin}${next}`);
}


