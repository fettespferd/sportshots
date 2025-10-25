import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  RekognitionClient,
  SearchFacesByImageCommand,
  IndexFacesCommand,
} from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION || "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const COLLECTION_ID = "sportshots-faces";

export async function POST(request: NextRequest) {
  try {
    const { selfieUrl } = await request.json();

    if (!selfieUrl) {
      return NextResponse.json(
        { error: "Selfie URL erforderlich" },
        { status: 400 }
      );
    }

    // Download selfie image
    const imageResponse = await fetch(selfieUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Search for similar faces in the collection
    const searchCommand = new SearchFacesByImageCommand({
      CollectionId: COLLECTION_ID,
      Image: {
        Bytes: Buffer.from(imageBuffer),
      },
      MaxFaces: 50,
      FaceMatchThreshold: 70,
    });

    const searchResult = await rekognition.send(searchCommand);

    if (!searchResult.FaceMatches || searchResult.FaceMatches.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Get photo IDs from face matches
    const photoIds = searchResult.FaceMatches.map(
      (match) => match.Face?.ExternalImageId
    ).filter((id): id is string => !!id);

    if (photoIds.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Fetch matching photos with event details
    const supabase = await createClient();
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
          slug
        )
      `
      )
      .in("id", photoIds);

    if (error) throw error;

    // Format results
    const matches = photos?.map((photo: any) => ({
      id: photo.id,
      watermark_url: photo.watermark_url,
      bib_number: photo.bib_number,
      price: photo.price,
      event_id: photo.event_id,
      event_title: photo.events?.title || "Unknown Event",
      event_slug: photo.events?.slug || "",
    })) || [];

    return NextResponse.json({ matches });
  } catch (error: any) {
    console.error("Face search error:", error);
    
    // If collection doesn't exist, return empty results
    if (error.name === "ResourceNotFoundException") {
      return NextResponse.json({ matches: [] });
    }
    
    return NextResponse.json(
      { error: error.message || "Gesichtssuche fehlgeschlagen" },
      { status: 500 }
    );
  }
}

