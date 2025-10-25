import exifr from "exifr";

export interface PhotoMetadata {
  takenAt?: Date;
  cameraMake?: string;
  cameraModel?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

/**
 * Extract EXIF metadata from an image file
 */
export async function extractExifData(file: File): Promise<PhotoMetadata> {
  try {
    const exif = await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      interop: false,
      ifd1: false,
    });

    if (!exif) {
      console.log("No EXIF data found in image");
      return {};
    }

    console.log("Raw EXIF data:", exif);

    const metadata: PhotoMetadata = {};

    // Date/Time
    if (exif.DateTimeOriginal) {
      metadata.takenAt = new Date(exif.DateTimeOriginal);
    } else if (exif.DateTime) {
      metadata.takenAt = new Date(exif.DateTime);
    }

    // Camera Info
    if (exif.Make) {
      metadata.cameraMake = exif.Make.trim();
    }
    if (exif.Model) {
      metadata.cameraModel = exif.Model.trim();
    }

    // Photo Settings
    if (exif.FocalLength) {
      metadata.focalLength = `${exif.FocalLength}mm`;
    }
    if (exif.FNumber) {
      metadata.aperture = `f/${exif.FNumber}`;
    }
    if (exif.ExposureTime) {
      // Convert to fraction if needed
      if (exif.ExposureTime < 1) {
        metadata.shutterSpeed = `1/${Math.round(1 / exif.ExposureTime)}`;
      } else {
        metadata.shutterSpeed = `${exif.ExposureTime}s`;
      }
    }
    if (exif.ISO) {
      metadata.iso = `ISO ${exif.ISO}`;
    }

    // GPS
    if (exif.latitude && exif.longitude) {
      metadata.gpsLatitude = exif.latitude;
      metadata.gpsLongitude = exif.longitude;
    }

    console.log("Extracted metadata:", metadata);
    return metadata;
  } catch (error) {
    console.error("Error extracting EXIF data:", error);
    return {};
  }
}

/**
 * Format metadata for database storage
 */
export function formatMetadataForDB(metadata: PhotoMetadata) {
  return {
    taken_at: metadata.takenAt?.toISOString() || null,
    camera_make: metadata.cameraMake || null,
    camera_model: metadata.cameraModel || null,
    focal_length: metadata.focalLength || null,
    aperture: metadata.aperture || null,
    shutter_speed: metadata.shutterSpeed || null,
    iso: metadata.iso || null,
    gps_latitude: metadata.gpsLatitude || null,
    gps_longitude: metadata.gpsLongitude || null,
  };
}

