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

    const { photoId, imageUrl } = await request.json();

    // Support both modes: photoId (for already uploaded) and imageUrl (for pre-upload OCR)
    let urlToScan: string;

    if (imageUrl) {
      // Pre-upload mode: direct image URL
      urlToScan = imageUrl;
      console.log("OCR: Pre-upload mode, scanning imageUrl:", urlToScan);
    } else if (photoId) {
      // Post-upload mode: get photo from database
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

      urlToScan = photo.original_url; // Use original for better OCR results
      console.log("OCR: Post-upload mode, scanning photo:", photoId);
    } else {
      return NextResponse.json(
        { error: "Either photoId or imageUrl required" },
        { status: 400 }
      );
    }

    console.log("OCR: Calling AWS Rekognition for URL:", urlToScan);

    // Run OCR
    const detectedNumbers = await detectTextInImage(urlToScan);

    console.log("OCR: Detected text:", detectedNumbers);

    // Try to find a bib number (usually 2-4 digits)
    const bibNumbers = detectedNumbers.filter(
      (num) => num.length >= 1 && num.length <= 4 && /^\d+$/.test(num)
    );

    console.log("OCR: Filtered bib numbers:", bibNumbers);

    const bibNumber = bibNumbers[0] || null;

    console.log("OCR: Selected bib number:", bibNumber);

    return NextResponse.json({
      bibNumber,
      detected: detectedNumbers,
      allBibNumbers: bibNumbers,
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

