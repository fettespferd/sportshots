import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEventFollowConfirmationEmail } from "@/lib/email/send";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    console.log(`[FOLLOW] Starting follow request for event: ${eventId}`);
    const supabase = await createClient();
    
    // Get user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { email } = body;
    console.log(`[FOLLOW] Email provided: ${email}, User authenticated: ${!!user}`);

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      console.error(`[FOLLOW] Invalid email: ${email}`);
      return NextResponse.json(
        { error: "Bitte gib eine gültige E-Mail-Adresse ein" },
        { status: 400 }
      );
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, slug")
      .eq("id", eventId)
      .eq("is_published", true)
      .single();

    if (eventError || !event) {
      console.error(`[FOLLOW] Event not found: ${eventId}`, eventError);
      return NextResponse.json(
        { error: "Event nicht gefunden" },
        { status: 404 }
      );
    }

    console.log(`[FOLLOW] Event found: ${event.title}`);

    // Use authenticated user's email if available, otherwise use provided email
    const followerEmail = user?.email || email;
    const userId = user?.id || null;
    console.log(`[FOLLOW] Using email: ${followerEmail}, userId: ${userId}`);

    // Check if already following
    const { data: existing } = await supabase
      .from("event_followers")
      .select("id")
      .eq("event_id", eventId)
      .eq("email", followerEmail)
      .single();

    if (existing) {
      console.log(`[FOLLOW] Already following: ${followerEmail}`);
      return NextResponse.json({
        success: true,
        message: "Du folgst diesem Event bereits",
        alreadyFollowing: true,
      });
    }

    // Insert follower
    console.log(`[FOLLOW] Inserting follower: ${followerEmail} for event: ${eventId}`);
    const { data: insertData, error: insertError } = await supabase
      .from("event_followers")
      .insert({
        event_id: eventId,
        email: followerEmail,
        user_id: userId,
      })
      .select();

    if (insertError) {
      console.error(`[FOLLOW] Error inserting follower:`, insertError);
      return NextResponse.json(
        { error: "Fehler beim Folgen des Events" },
        { status: 500 }
      );
    }

    console.log(`[FOLLOW] ✅ Successfully added follower: ${followerEmail}`, insertData);

    // Send confirmation email
    try {
      console.log(`[FOLLOW] Sending confirmation email to ${followerEmail}...`);
      const unsubscribeToken = Buffer.from(followerEmail).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
      
      const emailResult = await sendEventFollowConfirmationEmail(
        followerEmail,
        followerEmail.split("@")[0],
        event.title,
        event.slug,
        unsubscribeToken,
        eventId,
        followerEmail
      );

      if (emailResult.success) {
        console.log(`[FOLLOW] ✅ Confirmation email sent successfully to ${followerEmail}`);
      } else {
        console.error(`[FOLLOW] ❌ Failed to send confirmation email to ${followerEmail}:`, emailResult.error);
        // Don't fail the follow request if email fails
      }
    } catch (emailError: any) {
      console.error(`[FOLLOW] ❌ Error sending confirmation email:`, emailError);
      // Don't fail the follow request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Du folgst diesem Event jetzt! Du erhältst eine E-Mail, wenn neue Fotos hochgeladen werden.",
    });
  } catch (error: any) {
    console.error("[FOLLOW] Fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Folgen des Events" },
      { status: 500 }
    );
  }
}

