import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    console.log("Welcome email API called");
    const { userId } = await request.json();
    console.log("User ID:", userId);

    if (!userId) {
      console.error("No user ID provided");
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

    console.log("Profile fetched:", profile ? "success" : "failed", profileError);

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Profile not found", details: profileError },
        { status: 404 }
      );
    }

    // Render email template
    console.log("Rendering email template...");
    const emailHtml = await render(
      WelcomeEmail({
        userName: profile.full_name || "Fotograf",
        username: profile.username || "",
        accountType: profile.account_type || "individual",
      })
    );
    console.log("Email template rendered, length:", emailHtml.length);

    // Send email
    console.log("Sending email to:", profile.email);
    const result = await sendEmail({
      to: profile.email,
      subject: "🎉 Willkommen bei SportShots!",
      html: emailHtml,
      replyTo: "julius.faubel@brainmotion.ai",
    });

    console.log("Email send result:", result);

    if (result.success) {
      return NextResponse.json({ success: true, message: "Welcome email sent" });
    } else {
      console.error("Error sending welcome email:", result.error);
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Welcome email error:", error);
    return NextResponse.json(
      { error: "Failed to send welcome email", details: error.message },
      { status: 500 }
    );
  }
}

