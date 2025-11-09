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

    // Use authenticated user's email if available, otherwise use provided email
    const followerEmail = user?.email || email;

    // Delete follower
    const { error: deleteError } = await supabase
      .from("event_followers")
      .delete()
      .eq("event_id", eventId)
      .eq("email", followerEmail);

    if (deleteError) {
      console.error("Error deleting follower:", deleteError);
      return NextResponse.json(
        { error: "Fehler beim Entfolgen des Events" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Du folgst diesem Event nicht mehr",
    });
  } catch (error: any) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Entfolgen des Events" },
      { status: 500 }
    );
  }
}

// GET handler for unsubscribe link from email
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.redirect(
        new URL("/?error=invalid_email", request.url)
      );
    }

    // Verify token (simple check - in production use proper token verification)
    const expectedToken = Buffer.from(email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    if (token !== expectedToken) {
      return NextResponse.redirect(
        new URL("/?error=invalid_token", request.url)
      );
    }

    const supabase = await createClient();

    // Delete follower
    const { error: deleteError } = await supabase
      .from("event_followers")
      .delete()
      .eq("event_id", eventId)
      .eq("email", email);

    if (deleteError) {
      console.error("Error deleting follower:", deleteError);
      return NextResponse.redirect(
        new URL("/?error=unfollow_failed", request.url)
      );
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL("/?unfollowed=true", request.url)
    );
  } catch (error: any) {
    console.error("Unfollow GET error:", error);
    return NextResponse.redirect(
      new URL("/?error=unfollow_failed", request.url)
    );
  }
}

