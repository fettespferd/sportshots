import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/send";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/lib/email/templates";

// This cron job processes the email queue
export async function GET(request: Request) {
  try {
    console.log("[Email Queue Processor] Starting...");

    // Create admin client
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get pending emails (max 10 at a time)
    const { data: pendingEmails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lt("attempts", 3) // Max 3 attempts
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("[Email Queue Processor] Error fetching queue:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      console.log("[Email Queue Processor] No pending emails");
      return NextResponse.json({ message: "No pending emails", processed: 0 });
    }

    console.log(`[Email Queue Processor] Processing ${pendingEmails.length} emails`);

    let successCount = 0;
    let failedCount = 0;

    // Process each email
    for (const emailJob of pendingEmails) {
      try {
        console.log(`[Email Queue Processor] Processing email ${emailJob.id} for ${emailJob.recipient_email}`);

        let emailHtml = "";

        // Render template based on email type
        if (emailJob.email_type === "welcome") {
          const templateData = emailJob.template_data as any;
          emailHtml = await render(
            WelcomeEmail({
              userName: templateData.userName || "Fotograf",
              username: templateData.username || "",
              accountType: templateData.accountType || "individual",
            })
          );
        } else {
          throw new Error(`Unknown email type: ${emailJob.email_type}`);
        }

        // Send email
        const result = await sendEmail({
          to: emailJob.recipient_email,
          subject: emailJob.subject,
          html: emailHtml,
          replyTo: "julius.faubel@brainmotion.ai",
        });

        if (result.success) {
          // Mark as sent
          await supabase
            .from("email_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", emailJob.id);

          successCount++;
          console.log(`[Email Queue Processor] ✅ Email ${emailJob.id} sent successfully`);
        } else {
          throw new Error(result.error as string || "Unknown error");
        }
      } catch (error: any) {
        failedCount++;
        console.error(`[Email Queue Processor] ❌ Failed to send email ${emailJob.id}:`, error);

        // Update attempts and status
        const newAttempts = emailJob.attempts + 1;
        await supabase
          .from("email_queue")
          .update({
            status: newAttempts >= 3 ? "failed" : "pending",
            attempts: newAttempts,
            error_message: error.message || String(error),
          })
          .eq("id", emailJob.id);
      }

      // Rate limiting: wait 550ms between emails
      await new Promise(resolve => setTimeout(resolve, 550));
    }

    console.log(`[Email Queue Processor] Done. Success: ${successCount}, Failed: ${failedCount}`);

    return NextResponse.json({
      message: "Queue processed",
      processed: pendingEmails.length,
      success: successCount,
      failed: failedCount,
    });
  } catch (error: any) {
    console.error("[Email Queue Processor] Fatal error:", error);
    return NextResponse.json(
      { error: "Internal error", details: error.message },
      { status: 500 }
    );
  }
}

