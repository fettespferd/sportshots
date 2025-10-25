import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
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
      .select("team_id, account_type")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "Profil nicht gefunden" },
        { status: 404 }
      );
    }

    // Team owners can't leave their own team
    if (profile.account_type === "team") {
      return NextResponse.json(
        { error: "Team-Besitzer können ihr eigenes Team nicht verlassen" },
        { status: 400 }
      );
    }

    // Check if user is in a team
    if (!profile.team_id) {
      return NextResponse.json(
        { error: "Du bist in keinem Team" },
        { status: 400 }
      );
    }

    // Leave team
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ team_id: null })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error leaving team:", updateError);
      return NextResponse.json(
        { error: "Fehler beim Verlassen des Teams" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Erfolgreich das Team verlassen",
    });
  } catch (error: any) {
    console.error("Error in leave API:", error);
    return NextResponse.json(
      { error: error.message || "Interner Serverfehler" },
      { status: 500 }
    );
  }
}

