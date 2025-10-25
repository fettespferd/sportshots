import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-Mail-Adresse erforderlich" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    // Verify user is team account
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("account_type, full_name")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden" },
        { status: 404 }
      );
    }

    if (profile.account_type !== "team") {
      return NextResponse.json(
        { error: "Nur Team-Accounts können Einladungen versenden" },
        { status: 403 }
      );
    }

    // Check if invited user exists
    const { data: invitedProfile } = await supabase
      .from("profiles")
      .select("id, team_id")
      .eq("email", email)
      .single();

    if (!invitedProfile) {
      return NextResponse.json(
        { error: "Kein Benutzer mit dieser E-Mail-Adresse gefunden" },
        { status: 404 }
      );
    }

    // Check if user is already in a team
    if (invitedProfile.team_id) {
      return NextResponse.json(
        { error: "Dieser Benutzer ist bereits in einem Team" },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from("team_invitations")
      .select("id")
      .eq("team_id", user.id)
      .eq("invited_email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        { error: "Eine Einladung wurde bereits an diese E-Mail-Adresse gesendet" },
        { status: 400 }
      );
    }

    // Create invitation
    const { error: insertError } = await supabase
      .from("team_invitations")
      .insert({
        team_id: user.id,
        invited_email: email,
        invited_by: user.id,
      });

    if (insertError) {
      console.error("Error creating invitation:", insertError);
      return NextResponse.json(
        { error: "Fehler beim Erstellen der Einladung" },
        { status: 500 }
      );
    }

    // TODO: Send email notification (via Supabase Function or Resend)
    // await sendInvitationEmail(email, profile.full_name);

    return NextResponse.json({
      success: true,
      message: "Einladung erfolgreich gesendet",
    });
  } catch (error: any) {
    console.error("Error in invite API:", error);
    return NextResponse.json(
      { error: error.message || "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

