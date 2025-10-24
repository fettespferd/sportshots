import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPhotographerApprovedEmail } from "@/lib/email/send";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    const { requestId, action } = await request.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "Request ID and action required" },
        { status: 400 }
      );
    }

    // Get request details
    const { data: photographerRequest } = await supabase
      .from("photographer_requests")
      .select("user_id, full_name, email")
      .eq("id", requestId)
      .single();

    if (!photographerRequest) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Update request status
    const { error: requestError } = await supabase
      .from("photographer_requests")
      .update({
        status: action,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (requestError) throw requestError;

    if (action === "approved") {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          role: "photographer",
          photographer_status: "approved",
        })
        .eq("id", photographerRequest.user_id);

      if (profileError) throw profileError;

      // Send approval email
      try {
        await sendPhotographerApprovedEmail(
          photographerRequest.email,
          photographerRequest.full_name
        );
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the request if email fails
      }
    } else if (action === "rejected") {
      // Update profile status
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          photographer_status: "rejected",
        })
        .eq("id", photographerRequest.user_id);

      if (profileError) throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Approve photographer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process request" },
      { status: 500 }
    );
  }
}

