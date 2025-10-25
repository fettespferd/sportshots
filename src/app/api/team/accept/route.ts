import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { invitationId } = await request.json();

    if (!invitationId) {
      return NextResponse.json(
        { error: "Einladungs-ID erforderlich" },
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

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, team_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden" },
        { status: 404 }
      );
    }

    // Check if already in a team
    if (profile.team_id) {
      return NextResponse.json(
        { error: "Du bist bereits in einem Team" },
        { status: 400 }
      );
    }

    // Get invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .select("*")
      .eq("id", invitationId)
      .eq("invited_email", profile.email)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: "Einladung nicht gefunden oder bereits bearbeitet" },
        { status: 404 }
      );
    }

    // Update profile with team_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ team_id: invitation.team_id })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Beitreten zum Team" },
        { status: 500 }
      );
    }

    // Update invitation status
    const { error: statusError } = await supabase
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitationId);

    if (statusError) {
      console.error("Error updating invitation status:", statusError);
    }

    return NextResponse.json({
      success: true,
      message: "Erfolgreich dem Team beigetreten",
    });
  } catch (error: any) {
    console.error("Error in accept API:", error);
    return NextResponse.json(
      { error: error.message || "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

