/**
 * BlockTextureAnalyzer.ts
 * Utility for analyzing block textures and extracting color information
 */

// Cache for texture analysis results
interface TextureAnalysisResult {
  top: string;
  left: string;
  right: string;
  timestamp: number;
}

// Cache to avoid re-analyzing textures
const textureAnalysisCache: Record<string, TextureAnalysisResult> = {};

/**
 * Analyzes a block texture and extracts colors for isometric rendering
 * @param blockTypeId - The block type ID
 * @returns Promise with colors for each face
 */
export const analyzeBlockTexture = async (blockTypeId: string): Promise<{ top: string, left: string, right: string }> => {
  // Check if we have a cached result that's less than 5 minutes old
  const cachedResult = textureAnalysisCache[blockTypeId];
  const now = Date.now();
  if (cachedResult && (now - cachedResult.timestamp < 5 * 60 * 1000)) {
    return {
      top: cachedResult.top,
      left: cachedResult.left,
      right: cachedResult.right
    };
  }

  // Default colors in case texture loading fails
  const defaultColors = {
    top: '#A0A0A0',
    left: '#808080',
    right: '#909090'
  };

  try {
    // Attempt to load the texture
    const texturePath = `/textures/block_textures/${blockTypeId}.png`;

    // Create an image element to load the texture
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Enable CORS for the image

    // Wait for the image to load
    const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load texture: ${texturePath}`));
      img.src = texturePath;
    });

    // Wait for the image to load
    const loadedImg = await imageLoadPromise;

    // Create a canvas to analyze the image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get 2D context for texture analysis');
      return defaultColors;
    }

    // Set canvas size to match image
    canvas.width = loadedImg.width;
    canvas.height = loadedImg.height;

    // Draw the image to the canvas
    ctx.drawImage(loadedImg, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // For Minecraft-style textures, we'll use the entire texture for all faces
    // and then apply appropriate shading to create the 3D effect

    // Get the dominant color from the entire texture
    const dominantColor = getAverageColor(data, canvas.width, 0, 0, canvas.width, canvas.height);

    // Create appropriate shades for each face to match the game's lighting
    const result = {
      top: dominantColor, // Top face is usually the brightest
      left: darkenColor(dominantColor, 25), // Left face is the darkest
      right: darkenColor(dominantColor, 15)  // Right face is medium darkness
    };

    // Cache the result
    textureAnalysisCache[blockTypeId] = {
      ...result,
      timestamp: now
    };

    return result;
  } catch (error) {
    console.warn(`Error analyzing texture for ${blockTypeId}:`, error);
    return defaultColors;
  }
};

/**
 * Gets the average color from a region of image data
 */
function getAverageColor(
  data: Uint8ClampedArray,
  width: number,
  startX: number,
  startY: number,
  regionWidth: number,
  regionHeight: number
): string {
  let r = 0, g = 0, b = 0;
  let pixelCount = 0;

  for (let y = startY; y < startY + regionHeight; y++) {
    for (let x = startX; x < startX + regionWidth; x++) {
      const i = (y * width + x) * 4;

      // Skip transparent pixels
      if (data[i + 3] < 128) continue;

      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      pixelCount++;
    }
  }

  if (pixelCount === 0) return '#A0A0A0'; // Default if all pixels are transparent

  // Calculate average
  r = Math.floor(r / pixelCount);
  g = Math.floor(g / pixelCount);
  b = Math.floor(b / pixelCount);

  // Convert to hex
  return rgbToHex(r, g, b);
}

/**
 * Converts RGB values to a hex color string
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Darkens a color by a percentage
 */
function darkenColor(color: string, percent: number): string {
  const { r, g, b } = hexToRgb(color);
  const amount = Math.floor(255 * (percent / 100));

  return rgbToHex(
    Math.max(r - amount, 0),
    Math.max(g - amount, 0),
    Math.max(b - amount, 0)
  );
}

/**
 * Converts a hex color to RGB values
 */
function hexToRgb(hex: string): { r: number, g: number, b: number } {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return { r, g, b };
}
