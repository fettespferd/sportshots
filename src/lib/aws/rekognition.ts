import {
  RekognitionClient,
  DetectTextCommand,
  DetectFacesCommand,
  CompareFacesCommand,
  IndexFacesCommand,
  SearchFacesByImageCommand,
} from "@aws-sdk/client-rekognition";

// Initialize Rekognition client
const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION || "eu-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * OCR: Detect text in image (for bib numbers)
 */
export async function detectTextInImage(imageUrl: string): Promise<string[]> {
  try {
    // Check if AWS credentials are configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("❌ AWS Credentials not configured!");
      console.error("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local");
      throw new Error("AWS Credentials not configured. Please check your .env.local file.");
    }

    console.log("🔍 OCR: Downloading image from:", imageUrl);
    
    // Download image and convert to buffer
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);
    
    console.log(`📸 OCR: Image downloaded, size: ${imageBytes.length} bytes`);

    const command = new DetectTextCommand({
      Image: {
        Bytes: imageBytes,
      },
    });

    console.log("☁️ OCR: Calling AWS Rekognition...");
    const result = await rekognitionClient.send(command);
    
    console.log(`✅ OCR: AWS responded with ${result.TextDetections?.length || 0} text detections`);

    // Extract ALL detected text for debugging
    const allDetectedText = result.TextDetections?.map(detection => ({
      text: detection.DetectedText,
      type: detection.Type,
      confidence: detection.Confidence
    })) || [];
    
    console.log("📝 OCR: All detected text:", JSON.stringify(allDetectedText, null, 2));

    // Extract detected text (LINE type for complete text lines)
    const detectedText =
      result.TextDetections?.filter((detection) => detection.Type === "LINE")
        .map((detection) => detection.DetectedText || "")
        .filter((text) => text.length > 0) || [];

    console.log("📄 OCR: Detected lines:", detectedText);

    // Filter for numbers (likely bib numbers)
    const numbers = detectedText.filter((text) => /^\d+$/.test(text));
    
    console.log("🔢 OCR: Filtered numbers (pure digits):", numbers);

    return numbers;
  } catch (error: any) {
    console.error("❌ Error detecting text:", error);
    console.error("Error details:", {
      message: error.message,
      name: error.name,
      code: error.$metadata?.httpStatusCode
    });
    throw error; // Re-throw to let the API handle it
  }
}

/**
 * Detect faces in an image and return face details
 */
export async function detectFacesInImage(imageUrl: string) {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const imageBytes = new Uint8Array(arrayBuffer);

    const command = new DetectFacesCommand({
      Image: {
        Bytes: imageBytes,
      },
      Attributes: ["ALL"],
    });

    const result = await rekognitionClient.send(command);

    return {
      faceCount: result.FaceDetails?.length || 0,
      faces: result.FaceDetails || [],
    };
  } catch (error) {
    console.error("Error detecting faces:", error);
    return { faceCount: 0, faces: [] };
  }
}

/**
 * Compare a selfie with event photos to find matches
 */
export async function compareFaces(
  selfieImageUrl: string,
  targetImageUrl: string
): Promise<number> {
  try {
    // Download both images
    const [selfieResponse, targetResponse] = await Promise.all([
      fetch(selfieImageUrl),
      fetch(targetImageUrl),
    ]);

    const [selfieBuffer, targetBuffer] = await Promise.all([
      selfieResponse.arrayBuffer(),
      targetResponse.arrayBuffer(),
    ]);

    const command = new CompareFacesCommand({
      SourceImage: {
        Bytes: new Uint8Array(selfieBuffer),
      },
      TargetImage: {
        Bytes: new Uint8Array(targetBuffer),
      },
      SimilarityThreshold: 80, // 80% similarity threshold
    });

    const result = await rekognitionClient.send(command);

    // Return highest similarity score
    const matches = result.FaceMatches || [];
    if (matches.length === 0) return 0;

    const highestSimilarity = Math.max(
      ...matches.map((match) => match.Similarity || 0)
    );

    return highestSimilarity;
  } catch (error) {
    console.error("Error comparing faces:", error);
    return 0;
  }
}

/**
 * Find photos containing a specific face (from selfie)
 * Returns array of photo IDs with similarity scores
 */
export async function findPhotosWithFace(
  selfieImageUrl: string,
  eventPhotoUrls: Array<{ id: string; url: string }>
): Promise<Array<{ photoId: string; similarity: number }>> {
  const results: Array<{ photoId: string; similarity: number }> = [];

  // Compare selfie with each photo in parallel (in batches to avoid rate limits)
  const batchSize = 5;
  for (let i = 0; i < eventPhotoUrls.length; i += batchSize) {
    const batch = eventPhotoUrls.slice(i, i + batchSize);

    const comparisons = await Promise.all(
      batch.map(async (photo) => {
        const similarity = await compareFaces(selfieImageUrl, photo.url);
        return { photoId: photo.id, similarity };
      })
    );

    results.push(...comparisons);
  }

  // Filter and sort by similarity
  return results
    .filter((result) => result.similarity > 80) // Only return good matches
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Extract face embedding for storage (for faster future comparisons)
 * This would require a Rekognition Collection - optional advanced feature
 */
export async function extractFaceEmbedding(imageUrl: string) {
  // This is a placeholder for future implementation
  // Would use IndexFaces to store face vectors in a collection
  return null;
}

