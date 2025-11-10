import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findPhotosWithFace } from "@/lib/aws/rekognition";

export async function POST(request: NextRequest) {
  try {
    const { selfieUrl } = await request.json();

    if (!selfieUrl) {
      return NextResponse.json(
        { error: "Selfie URL erforderlich" },
        { status: 400 }
      );
    }

    // Get all photos from all published events
    const supabase = await createClient();
    
    // First, get all published event IDs
    const { data: publishedEvents, error: eventsError } = await supabase
      .from("events")
      .select("id")
      .eq("is_published", true);

    if (eventsError) {
      console.error("Error fetching published events:", eventsError);
      throw eventsError;
    }

    if (!publishedEvents || publishedEvents.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const publishedEventIds = publishedEvents.map((e) => e.id);

    // Get all photos from published events
    const { data: photos, error } = await supabase
      .from("photos")
      .select(
        `
        id,
        watermark_url,
        bib_number,
        price,
        event_id,
        events (
          title,
          slug,
          is_published
        )
      `
      )
      .in("event_id", publishedEventIds);

    if (error) {
      console.error("Error fetching photos:", error);
      throw error;
    }

    if (!photos || photos.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Filter only published events (double check)
    const publishedPhotos = photos.filter((photo: any) => photo.events?.is_published);

    if (publishedPhotos.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Prepare photo URLs for comparison (same format as event-specific search)
    const photoUrls = publishedPhotos.map((photo: any) => ({
      id: photo.id,
      url: photo.watermark_url,
    }));

    // Use the same face comparison logic as event-specific search
    const matches = await findPhotosWithFace(selfieUrl, photoUrls);

    if (matches.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Get full photo details for matched photos
    const matchedPhotoIds = matches.map((m) => m.photoId);
    const matchedPhotos = publishedPhotos.filter((photo: any) =>
      matchedPhotoIds.includes(photo.id)
    );

    // Format results with similarity scores
    const formattedMatches = matchedPhotos.map((photo: any) => {
      const match = matches.find((m) => m.photoId === photo.id);
      return {
        id: photo.id,
        watermark_url: photo.watermark_url,
        bib_number: photo.bib_number,
        price: photo.price,
        event_id: photo.event_id,
        event_title: photo.events?.title || "Unknown Event",
        event_slug: photo.events?.slug || "",
        similarity: match ? Math.round(match.similarity) : 0,
      };
    });

    // Sort by similarity (highest first)
    formattedMatches.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({ 
      matches: formattedMatches,
      totalScanned: publishedPhotos.length,
    });
  } catch (error: any) {
    console.error("Face search error:", error);
    return NextResponse.json(
      { error: error.message || "Gesichtssuche fehlgeschlagen" },
      { status: 500 }
    );
  }
}

