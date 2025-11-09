import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNewPhotosEmail } from "@/lib/email/send";

// Test endpoint to manually trigger email notifications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get("email");
    
    console.log(`[NOTIFY-FOLLOWERS-TEST] Testing notification for event: ${eventId}`);
    const supabase = await createClient();

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, slug")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event nicht gefunden" },
        { status: 404 }
      );
    }

    // Get all followers for this event
    const { data: followers, error: followersError } = await supabase
      .from("event_followers")
      .select("email, user_id")
      .eq("event_id", eventId);

    if (followersError) {
      return NextResponse.json(
        { error: "Fehler beim Abrufen der Follower" },
        { status: 500 }
      );
    }

    // If test email provided, use it instead
    const emailsToNotify = testEmail 
      ? [{ email: testEmail, user_id: null }]
      : followers || [];

    if (emailsToNotify.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine Follower gefunden",
        notified: 0,
        followers: [],
      });
    }

    const photoCount = parseInt(searchParams.get("photoCount") || "1");

    // Send email to each follower
    let notified = 0;
    const errors: string[] = [];
    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const follower of emailsToNotify) {
      try {
        let userName = follower.email.split("@")[0];
        if (follower.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", follower.user_id)
            .single();
          if (profile?.full_name) {
            userName = profile.full_name;
          }
        }

        const unsubscribeToken = Buffer.from(follower.email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
        
        const emailResult = await sendNewPhotosEmail(
          follower.email,
          userName,
          event.title,
          event.slug,
          photoCount,
          unsubscribeToken,
          eventId,
          follower.email
        );
        
        if (emailResult.success) {
          notified++;
          results.push({ email: follower.email, success: true });
        } else {
          errors.push(follower.email);
          results.push({ email: follower.email, success: false, error: emailResult.error });
        }
      } catch (error: any) {
        errors.push(follower.email);
        results.push({ email: follower.email, success: false, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `${notified} E-Mails versendet`,
      notified,
      errors: errors.length > 0 ? errors : undefined,
      results,
      event: {
        id: event.id,
        title: event.title,
        slug: event.slug,
      },
    });
  } catch (error: any) {
    console.error("[NOTIFY-FOLLOWERS-TEST] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Testen der Benachrichtigungen" },
      { status: 500 }
    );
  }
}

