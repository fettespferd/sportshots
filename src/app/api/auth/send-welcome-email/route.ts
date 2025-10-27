import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/lib/email/templates";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user profile
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name, username, account_type")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Render email template
    const emailHtml = await render(
      WelcomeEmail({
        userName: profile.full_name || "Fotograf",
        username: profile.username || "",
        accountType: profile.account_type || "individual",
      })
    );

    // Send email
    const result = await sendEmail({
      to: profile.email,
      subject: "🎉 Willkommen bei SportShots!",
      html: emailHtml,
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Error sending welcome email:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Welcome email error:", error);
    return NextResponse.json(
      { error: "Failed to send welcome email" },
      { status: 500 }
    );
  }
}

