import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendNewPhotosEmail } from "@/lib/email/send";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
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
      console.error("Error fetching followers:", followersError);
      return NextResponse.json(
        { error: "Fehler beim Abrufen der Follower" },
        { status: 500 }
      );
    }

    if (!followers || followers.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Keine Follower gefunden",
        notified: 0,
      });
    }

    const body = await request.json();
    const { photoCount = 1 } = body;

    // Send email to each follower
    let notified = 0;
    const errors: string[] = [];

    for (const follower of followers) {
      try {
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
        
        await sendNewPhotosEmail(
          follower.email,
          userName,
          event.title,
          event.slug,
          photoCount,
          unsubscribeToken,
          eventId,
          follower.email
        );
        notified++;
      } catch (error: any) {
        console.error(`Error sending email to ${follower.email}:`, error);
        errors.push(follower.email);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${notified} Follower benachrichtigt`,
      notified,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Notify followers error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Benachrichtigen der Follower" },
      { status: 500 }
    );
  }
}

