import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNewPhotosEmail } from "@/lib/email/send";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    console.log(`[NOTIFY-FOLLOWERS] Starting notification for event: ${eventId}`);
    const supabase = await createClient();

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, slug")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error(`[NOTIFY-FOLLOWERS] Event not found: ${eventId}`, eventError);
      return NextResponse.json(
        { error: "Event nicht gefunden" },
        { status: 404 }
      );
    }

    console.log(`[NOTIFY-FOLLOWERS] Event found: ${event.title} (${event.slug})`);

    // Get all followers for this event
    const { data: followers, error: followersError } = await supabase
      .from("event_followers")
      .select("email, user_id")
      .eq("event_id", eventId);

    if (followersError) {
      console.error("[NOTIFY-FOLLOWERS] Error fetching followers:", followersError);
      return NextResponse.json(
        { error: "Fehler beim Abrufen der Follower" },
        { status: 500 }
      );
    }

    console.log(`[NOTIFY-FOLLOWERS] Found ${followers?.length || 0} followers`);

    if (!followers || followers.length === 0) {
      console.log("[NOTIFY-FOLLOWERS] No followers found, returning early");
      return NextResponse.json({
        success: true,
        message: "Keine Follower gefunden",
        notified: 0,
      });
    }

    const body = await request.json();
    const { photoCount = 1 } = body;
    console.log(`[NOTIFY-FOLLOWERS] Photo count: ${photoCount}`);

    // Send email to each follower
    let notified = 0;
    const errors: string[] = [];

    for (const follower of followers) {
      try {
        console.log(`[NOTIFY-FOLLOWERS] Processing follower: ${follower.email}`);
        // Get user name if user_id exists
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

        // Generate simple unsubscribe token (email hash for security)
        const unsubscribeToken = Buffer.from(follower.email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
        
        console.log(`[NOTIFY-FOLLOWERS] Sending email to ${follower.email}...`);
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
          console.log(`[NOTIFY-FOLLOWERS] ✅ Email sent successfully to ${follower.email}`);
          notified++;
        } else {
          console.error(`[NOTIFY-FOLLOWERS] ❌ Failed to send email to ${follower.email}:`, emailResult.error);
          errors.push(follower.email);
        }
      } catch (error: any) {
        console.error(`[NOTIFY-FOLLOWERS] ❌ Error sending email to ${follower.email}:`, error);
        errors.push(follower.email);
      }
    }

    console.log(`[NOTIFY-FOLLOWERS] Completed: ${notified} notified, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: `${notified} Follower benachrichtigt`,
      notified,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[NOTIFY-FOLLOWERS] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Benachrichtigen der Follower" },
      { status: 500 }
    );
  }
}

