import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { addWatermark, createThumbnail } from "@/lib/image/watermark";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const eventId = formData.get("eventId") as string;
    const eventName = formData.get("eventName") as string;

    if (!file || !eventId) {
      return NextResponse.json(
        { error: "File and event ID required" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Generate watermark version
    const watermarkText = eventName
      ? `SportShots.app · ${eventName}`
      : "SportShots.app";

    const watermarkedBuffer = await addWatermark(imageBuffer, {
      text: watermarkText,
      opacity: 0.35,
      maxWidth: 1200,
      position: "diagonal",
    });

    // Generate thumbnail
    const thumbnailBuffer = await createThumbnail(watermarkedBuffer, 400);

    // Upload watermark version to storage
    const watermarkFileName = `watermarks/${eventId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.jpg`;

    const { data: watermarkUpload, error: watermarkError } = await supabase.storage
      .from("photos")
      .upload(watermarkFileName, watermarkedBuffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (watermarkError) {
      console.error("Watermark upload error:", {
        error: watermarkError,
        fileName: watermarkFileName,
        message: watermarkError.message,
      });
      throw new Error(`Failed to upload watermark: ${watermarkError.message || JSON.stringify(watermarkError)}`);
    }

    // Upload thumbnail
    const thumbnailFileName = `thumbnails/${eventId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.jpg`;

    const { data: thumbnailUpload, error: thumbnailError } = await supabase.storage
      .from("photos")
      .upload(thumbnailFileName, thumbnailBuffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (thumbnailError) {
      console.error("Thumbnail upload error:", {
        error: thumbnailError,
        fileName: thumbnailFileName,
        message: thumbnailError.message,
      });
      // Don't throw, just log - we can continue without thumbnail
    }

    // Get public URLs
    const {
      data: { publicUrl: watermarkUrl },
    } = supabase.storage.from("photos").getPublicUrl(watermarkFileName);

    const {
      data: { publicUrl: thumbnailUrl },
    } = supabase.storage.from("photos").getPublicUrl(
      thumbnailFileName || watermarkFileName
    );

    return NextResponse.json({
      watermarkUrl,
      thumbnailUrl,
    });
  } catch (error: any) {
    console.error("Watermark generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate watermark" },
      { status: 500 }
    );
  }
}

