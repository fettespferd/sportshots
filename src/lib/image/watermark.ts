import sharp from "sharp";

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  maxWidth?: number;
  position?: "diagonal" | "center" | "bottom-right";
}

/**
 * Add watermark to an image
 * @param imageBuffer - Original image as Buffer
 * @param options - Watermark configuration
 * @returns Watermarked image as Buffer
 */
export async function addWatermark(
  imageBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    text = "SportShots.app",
    opacity = 0.3,
    maxWidth = 1200,
    position = "diagonal",
  } = options;

  // Get image metadata
  const metadata = await sharp(imageBuffer).metadata();
  const originalWidth = metadata.width || 1920;
  const originalHeight = metadata.height || 1080;

  // Resize image if too large (for watermark preview)
  let processedImage = sharp(imageBuffer);
  let width = originalWidth;
  let height = originalHeight;
  
  if (originalWidth > maxWidth) {
    // Calculate new dimensions maintaining aspect ratio
    const aspectRatio = originalHeight / originalWidth;
    width = maxWidth;
    height = Math.round(maxWidth * aspectRatio);
    
    processedImage = processedImage.resize(width, height, {
      withoutEnlargement: true,
      fit: "inside",
    });
  }

  // Convert to buffer to get exact dimensions
  const resizedBuffer = await processedImage.toBuffer();
  const resizedMetadata = await sharp(resizedBuffer).metadata();
  width = resizedMetadata.width || width;
  height = resizedMetadata.height || height;
  
  // Start fresh with the resized buffer
  processedImage = sharp(resizedBuffer);

  // Create watermark text SVG
  const fontSize = Math.max(24, Math.floor(width / 20));
  const textLength = text.length * fontSize * 0.6;

  let watermarkSvg: string;

  if (position === "diagonal") {
    // Diagonal repeating pattern
    const rows = 8;
    const cols = 8;
    let textElements = "";

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col * width) / cols + width / (cols * 2);
        const y = (row * height) / rows + height / (rows * 2);
        
        textElements += `
          <text
            x="${x}"
            y="${y}"
            font-family="Arial, sans-serif"
            font-size="${fontSize}"
            fill="white"
            opacity="${opacity}"
            transform="rotate(-45 ${x} ${y})"
            text-anchor="middle"
          >${text}</text>
        `;
      }
    }

    watermarkSvg = `
      <svg width="${width}" height="${height}">
        ${textElements}
      </svg>
    `;
  } else if (position === "center") {
    // Large centered watermark
    const centerX = width / 2;
    const centerY = height / 2;
    const largeFontSize = Math.floor(width / 15);

    watermarkSvg = `
      <svg width="${width}" height="${height}">
        <text
          x="${centerX}"
          y="${centerY}"
          font-family="Arial, sans-serif"
          font-size="${largeFontSize}"
          font-weight="bold"
          fill="white"
          opacity="${opacity}"
          text-anchor="middle"
          dominant-baseline="middle"
        >${text}</text>
      </svg>
    `;
  } else {
    // Bottom-right corner
    const padding = 20;
    const x = width - padding;
    const y = height - padding;

    watermarkSvg = `
      <svg width="${width}" height="${height}">
        <rect
          x="${x - textLength - 10}"
          y="${y - fontSize - 5}"
          width="${textLength + 20}"
          height="${fontSize + 10}"
          fill="black"
          opacity="${opacity * 0.7}"
          rx="5"
        />
        <text
          x="${x}"
          y="${y}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="white"
          opacity="${opacity + 0.4}"
          text-anchor="end"
        >${text}</text>
      </svg>
    `;
  }

  // Convert SVG to buffer
  const watermarkBuffer = Buffer.from(watermarkSvg);

  // Composite watermark onto image
  const watermarkedImage = await processedImage
    .composite([
      {
        input: watermarkBuffer,
        blend: "over",
      },
    ])
    .jpeg({ quality: 85 })
    .toBuffer();

  return watermarkedImage;
}

/**
 * Process and watermark an image from URL
 */
export async function watermarkImageFromUrl(
  imageUrl: string,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  // Fetch image
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(arrayBuffer);

  // Add watermark
  return addWatermark(imageBuffer, options);
}

/**
 * Create thumbnail version of an image
 */
export async function createThumbnail(
  imageBuffer: Buffer,
  width: number = 400
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(width, null, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

