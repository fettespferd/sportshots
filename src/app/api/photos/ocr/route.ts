import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectTextInImage } from "@/lib/aws/rekognition";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { photoId } = await request.json();

    if (!photoId) {
      return NextResponse.json(
        { error: "Photo ID required" },
        { status: 400 }
      );
    }

    // Get photo
    const { data: photo } = await supabase
      .from("photos")
      .select("*, event:event_id(photographer_id)")
      .eq("id", photoId)
      .single();

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Check permission (only photographer can run OCR on their photos)
    if (
      (photo.event as any)?.photographer_id !== user.id &&
      !(await isAdmin(supabase, user.id))
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Run OCR on the watermark version (faster, lower res)
    const detectedNumbers = await detectTextInImage(photo.watermark_url);

    // Try to find a bib number (usually 2-4 digits)
    const bibNumbers = detectedNumbers.filter(
      (num) => num.length >= 1 && num.length <= 4
    );

    const suggestedBibNumber = bibNumbers[0] || null;

    return NextResponse.json({
      detected: detectedNumbers,
      suggested: suggestedBibNumber,
    });
  } catch (error: any) {
    console.error("OCR error:", error);
    return NextResponse.json(
      { error: error.message || "OCR failed" },
      { status: 500 }
    );
  }
}

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role === "admin";
}

