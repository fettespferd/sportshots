/**
 * Client-side image compression utility
 * Compresses images before upload to reduce file size
 */

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSizeMB?: number; // Target max size in MB
}

/**
 * Compress an image file using Canvas API
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 4000,
    maxHeight = 4000,
    quality = 0.92,
    maxSizeMB = 10,
  } = options;

  // If file is already small enough, return as-is
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= maxSizeMB) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        // Create canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        // Draw image to canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // If still too large, reduce quality further
            const compressedSizeMB = blob.size / (1024 * 1024);
            if (compressedSizeMB > maxSizeMB && quality > 0.5) {
              // Recursively compress with lower quality
              const newFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              compressImage(newFile, {
                ...options,
                quality: quality * 0.9,
              })
                .then(resolve)
                .catch(reject);
            } else {
              // Create new file with compressed data
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Check if file needs compression
 * RAW files are never compressed to preserve original quality
 */
export function needsCompression(file: File, maxSizeMB: number = 10): boolean {
  // RAW file extensions that should never be compressed
  const rawExtensions = ['.cr2', '.nef', '.arw', '.orf', '.raf', '.rw2', '.dng', '.cr3', '.srw', '.3fr', '.mef', '.mos', '.pef', '.x3f'];
  
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  
  // Never compress RAW files
  if (rawExtensions.includes(fileExtension)) {
    return false;
  }
  
  const fileSizeMB = file.size / (1024 * 1024);
  return fileSizeMB > maxSizeMB;
}


