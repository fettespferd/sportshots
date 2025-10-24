import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findPhotosWithFace } from "@/lib/aws/rekognition";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const formData = await request.formData();
    const selfieFile = formData.get("selfie") as File;
    const eventId = formData.get("eventId") as string;

    if (!selfieFile || !eventId) {
      return NextResponse.json(
        { error: "Selfie and event ID required" },
        { status: 400 }
      );
    }

    // Get all photos for this event
    const { data: photos } = await supabase
      .from("photos")
      .select("id, watermark_url")
      .eq("event_id", eventId);

    if (!photos || photos.length === 0) {
      return NextResponse.json(
        { error: "No photos found for this event" },
        { status: 404 }
      );
    }

    // Convert selfie File to base64 URL for AWS
    const arrayBuffer = await selfieFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const selfieDataUrl = `data:${selfieFile.type};base64,${base64}`;

    // Find matching photos
    const photoUrls = photos.map((photo) => ({
      id: photo.id,
      url: photo.watermark_url,
    }));

    const matches = await findPhotosWithFace(selfieDataUrl, photoUrls);

    return NextResponse.json({
      matches: matches.map((match) => ({
        photoId: match.photoId,
        similarity: Math.round(match.similarity),
      })),
      totalScanned: photos.length,
    });
  } catch (error: any) {
    console.error("Face search error:", error);
    return NextResponse.json(
      { error: error.message || "Face search failed" },
      { status: 500 }
    );
  }
}

