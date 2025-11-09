import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const supabase = await createClient();
    
    // Get user if authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { email } = body;

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
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
      return NextResponse.json(
        { error: "Event nicht gefunden" },
        { status: 404 }
      );
    }

    // Use authenticated user's email if available, otherwise use provided email
    const followerEmail = user?.email || email;
    const userId = user?.id || null;

    // Check if already following
    const { data: existing } = await supabase
      .from("event_followers")
      .select("id")
      .eq("event_id", eventId)
      .eq("email", followerEmail)
      .single();

    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Du folgst diesem Event bereits",
        alreadyFollowing: true,
      });
    }

    // Insert follower
    const { error: insertError } = await supabase
      .from("event_followers")
      .insert({
        event_id: eventId,
        email: followerEmail,
        user_id: userId,
      });

    if (insertError) {
      console.error("Error inserting follower:", insertError);
      return NextResponse.json(
        { error: "Fehler beim Folgen des Events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Du folgst diesem Event jetzt! Du erhältst eine E-Mail, wenn neue Fotos hochgeladen werden.",
    });
  } catch (error: any) {
    console.error("Follow error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Folgen des Events" },
      { status: 500 }
    );
  }
}

