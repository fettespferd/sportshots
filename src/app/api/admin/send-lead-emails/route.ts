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

    // Send emails to all leads
    const results = await Promise.all(
      leads.map(async (lead) => {
        try {
          // Replace placeholders in template
          const personalizedBody = template.body
            .replace(/\{\{name\}\}/g, lead.name)
            .replace(/\{\{email\}\}/g, lead.email)
            .replace(/\{\{location\}\}/g, lead.location || "");

          const personalizedSubject = template.subject
            .replace(/\{\{name\}\}/g, lead.name);

          // Send the email
          await sendEmail({
            to: lead.email,
            subject: personalizedSubject,
            html: personalizedBody.replace(/\n/g, "<br>"),
            replyTo: "julius.faubel@brainmotion.ai",
          });

          // Log the email in database
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

          return { success: true, leadId: lead.id };
        } catch (error) {
          console.error(`Failed to send email to ${lead.email}:`, error);
          
          // Log failed email
          await supabase.from("lead_emails").insert({
            lead_id: lead.id,
            template_name: templateName,
            subject: template.subject,
            created_by: user.id,
            status: "failed",
          });

          return { success: false, leadId: lead.id, error: String(error) };
        }
      })
    );

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

