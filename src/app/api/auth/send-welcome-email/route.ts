import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/lib/email/templates";

// Helper function to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry fetching profile
async function fetchProfileWithRetry(supabase: any, userId: string, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("email, full_name, username, account_type")
      .eq("id", userId)
      .single();

    if (profile && !error) {
      console.log(`Profile found on attempt ${i + 1}`);
      return { profile, error: null };
    }

    console.log(`Profile not found, retry ${i + 1}/${maxRetries}`);
    if (i < maxRetries - 1) {
      await delay(1000); // Wait 1 second before retry
    }
  }

  return { profile: null, error: "Profile not found after retries" };
}

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

    // Get user profile with retry logic
    const supabase = await createClient();
    const { profile, error: profileError } = await fetchProfileWithRetry(supabase, userId);

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

