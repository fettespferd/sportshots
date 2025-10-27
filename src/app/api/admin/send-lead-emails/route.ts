import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { leadIds, templateName } = await request.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: "No leads selected" }, { status: 400 });
    }

    // Get the email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("name", templateName)
      .single();

    if (templateError || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Get the leads
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .in("id", leadIds);

    if (leadsError || !leads) {
      return NextResponse.json({ error: "Leads not found" }, { status: 404 });
    }

    // Helper function to delay execution
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Send emails with rate limiting (2 per second for Resend)
    const results = [];
    const RATE_LIMIT_DELAY = 550; // 550ms between emails = ~1.8 emails/second (safe buffer)

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      try {
        // Replace placeholders in template
        const personalizedBody = template.body
          .replace(/\{\{name\}\}/g, lead.name)
          .replace(/\{\{email\}\}/g, lead.email)
          .replace(/\{\{location\}\}/g, lead.location || "")
          .replace(/\{\{company_name\}\}/g, lead.name);

        const personalizedSubject = template.subject
          .replace(/\{\{name\}\}/g, lead.name)
          .replace(/\{\{company_name\}\}/g, lead.name);

        // Send the email
        const emailResult = await sendEmail({
          to: lead.email,
          subject: personalizedSubject,
          html: personalizedBody.replace(/\n/g, "<br>"),
          replyTo: "julius.faubel@brainmotion.ai",
        });

        // Check if email was sent successfully
        if (emailResult.success) {
          // Log successful email in database
          await supabase.from("lead_emails").insert({
            lead_id: lead.id,
            template_name: templateName,
            subject: personalizedSubject,
            created_by: user.id,
            status: "sent",
          });

          // Update lead status and last_contacted_at
          await supabase
            .from("leads")
            .update({
              status: lead.status === "new" ? "contacted" : lead.status,
              last_contacted_at: new Date().toISOString(),
            })
            .eq("id", lead.id);

          results.push({ success: true, leadId: lead.id, email: lead.email });
        } else {
          throw new Error(emailResult.error as string || "Unknown error");
        }

        // Rate limiting: wait between emails (except for the last one)
        if (i < leads.length - 1) {
          await delay(RATE_LIMIT_DELAY);
        }
      } catch (error: any) {
        console.error(`Failed to send email to ${lead.email}:`, error);
        
        // Determine error status
        const errorStatus = error.message?.includes("rate") || error.statusCode === 429 
          ? "rate_limited" 
          : "failed";
        
        // Log failed email
        await supabase.from("lead_emails").insert({
          lead_id: lead.id,
          template_name: templateName,
          subject: template.subject,
          created_by: user.id,
          status: errorStatus,
        });

        results.push({ 
          success: false, 
          leadId: lead.id, 
          email: lead.email,
          error: error.message || String(error),
          status: errorStatus
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successful} emails successfully${failed > 0 ? `, ${failed} failed` : ""}`,
      results,
    });
  } catch (error) {
    console.error("Error sending lead emails:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}

