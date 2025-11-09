import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Get purchase by token (stripe_session_id)
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select(
        `
        *,
        purchase_photos (
          photo_id,
          photos (
            id,
            original_url,
            edited_url,
            rotation,
            event_id,
            events (
              title
            )
          )
        )
      `
      )
      .eq("stripe_session_id", token)
      .eq("status", "completed")
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json(
        { error: "Bestellung nicht gefunden" },
        { status: 404 }
      );
    }

    const photos = (purchase.purchase_photos as any[])
      .map((pp: any) => pp.photos)
      .filter(Boolean);

    if (photos.length === 0) {
      return NextResponse.json(
        { error: "Keine Fotos gefunden" },
        { status: 404 }
      );
    }

    // Create ZIP file
    const zip = new JSZip();
    const eventTitle = photos[0]?.events?.title || "Event";
    const sanitizedEventTitle = eventTitle
      .replace(/[^a-z0-9]/gi, "-")
      .toLowerCase()
      .substring(0, 50);

    // Download and add photos to ZIP
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const photoNumber = String(i + 1).padStart(3, "0");

      try {
        // Download original photo
        const originalResponse = await fetch(photo.original_url);
        if (originalResponse.ok) {
          const originalBuffer = await originalResponse.arrayBuffer();
          const originalExt = photo.original_url.split(".").pop()?.split("?")[0] || "jpg";
          zip.file(
            `${sanitizedEventTitle}_${photoNumber}_original.${originalExt}`,
            originalBuffer
          );
        }

        // Download edited photo if available
        if (photo.edited_url) {
          const editedResponse = await fetch(photo.edited_url);
          if (editedResponse.ok) {
            const editedBuffer = await editedResponse.arrayBuffer();
            const editedExt = photo.edited_url.split(".").pop()?.split("?")[0] || "jpg";
            zip.file(
              `${sanitizedEventTitle}_${photoNumber}_edited.${editedExt}`,
              editedBuffer
            );
          }
        }
      } catch (error) {
        console.error(`Error downloading photo ${i + 1}:`, error);
        // Continue with other photos
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Return ZIP file as download
    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${sanitizedEventTitle}_fotos.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("ZIP generation error:", error);
    return NextResponse.json(
      { error: error.message || "Fehler beim Erstellen der ZIP-Datei" },
      { status: 500 }
    );
  }
}

