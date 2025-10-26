import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeImageOrientation } from "@/lib/image/watermark";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { imageUrl, storagePath } = body;

    if (!imageUrl || !storagePath) {
      return NextResponse.json(
        { error: "Image URL and storage path required" },
        { status: 400 }
      );
    }

    // Download image from URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image");
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Normalize EXIF orientation
    const normalizedBuffer = await normalizeImageOrientation(imageBuffer);

    // Re-upload the normalized version to replace the original
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .update(storagePath, normalizedBuffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload normalized image: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("photos").getPublicUrl(storagePath);

    return NextResponse.json({
      normalizedUrl: publicUrl,
      success: true,
    });
  } catch (error: any) {
    console.error("Image normalization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to normalize image" },
      { status: 500 }
    );
  }
}

