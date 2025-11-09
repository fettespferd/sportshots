import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { addWatermark, createThumbnail } from "@/lib/image/watermark";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json();
    const { imageUrl, eventId, eventName, photoId } = body;

    if (!imageUrl || !eventId) {
      return NextResponse.json(
        { error: "Image URL and event ID required" },
        { status: 400 }
      );
    }

    // Allow public access if photoId is provided (for generating watermarks for existing photos)
    // Otherwise require authentication (for new uploads)
    if (!photoId && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client for storage operations if no user (public access for existing photos)
    const storageClient = photoId && !user
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    // Download image from URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image");
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Generate watermark version
    const watermarkText = eventName
      ? `SportShots.app · ${eventName}`
      : "SportShots.app";

    const watermarkedBuffer = await addWatermark(imageBuffer, {
      text: watermarkText,
      opacity: 0.4, // Balanced opacity for good visibility and protection
      maxWidth: 1200,
      position: "diagonal",
    });

    // Generate thumbnail
    const thumbnailBuffer = await createThumbnail(watermarkedBuffer, 400);

    // Upload watermark version to storage
    const watermarkFileName = `watermarks/${eventId}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.jpg`;

    const { data: watermarkUpload, error: watermarkError } = await storageClient.storage
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

    const { data: thumbnailUpload, error: thumbnailError } = await storageClient.storage
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
    } = storageClient.storage.from("photos").getPublicUrl(watermarkFileName);

    const {
      data: { publicUrl: thumbnailUrl },
    } = storageClient.storage.from("photos").getPublicUrl(
      thumbnailFileName || watermarkFileName
    );

    // If photoId is provided, update the database with watermark_edited_url
    // Use service role client for database update if no user
    const dbClient = photoId && !user
      ? createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      : supabase;

    if (photoId) {
      const { error: updateError } = await dbClient
        .from("photos")
        .update({ watermark_edited_url: watermarkUrl })
        .eq("id", photoId);

      if (updateError) {
        console.warn("Failed to update photo with watermark_edited_url:", updateError);
        // Don't fail the request, just log the warning
      }
    }

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

