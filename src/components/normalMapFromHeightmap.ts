// Modular utility: Convert a heightmap (grayscale image or DynamicTexture) to a normal map (ImageData)
// Returns a new canvas with the normal map data
// Usage: const normalMapCanvas = normalMapFromHeightmap(heightmapCanvas, strength)

/**
 * Converts a heightmap (grayscale image) to a normal map
 * @param heightmapCanvas - Canvas containing the heightmap data
 * @param strength - Strength of the normal map effect (default: 2.0)
 * @returns A new canvas with the normal map data
 */
export function normalMapFromHeightmap(heightmapCanvas: HTMLCanvasElement, strength: number = 2.0): HTMLCanvasElement {
  const w = heightmapCanvas.width;
  const h = heightmapCanvas.height;
  const ctx = heightmapCanvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get 2D context from heightmap canvas');
  }
  
  const src = ctx.getImageData(0, 0, w, h);
  const dst = ctx.createImageData(w, h);
  
  const getGray = (x: number, y: number): number => {
    x = Math.max(0, Math.min(w - 1, x));
    y = Math.max(0, Math.min(h - 1, y));
    const i = (y * w + x) * 4;
    // Use red channel (assuming grayscale)
    return src.data[i] / 255.0;
  };
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Sobel operator for normal
      const dx = getGray(x + 1, y) - getGray(x - 1, y);
      const dy = getGray(x, y + 1) - getGray(x, y - 1);
      
      // Normal vector
      let nx = -dx * strength;
      let ny = -dy * strength;
      let nz = 1.0;
      
      // Normalize
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      nx /= len; 
      ny /= len; 
      nz /= len;
      
      // Encode to RGB
      const r = Math.floor((nx * 0.5 + 0.5) * 255);
      const g = Math.floor((ny * 0.5 + 0.5) * 255);
      const b = Math.floor((nz * 0.5 + 0.5) * 255);
      const i = (y * w + x) * 4;
      
      dst.data[i] = r;
      dst.data[i + 1] = g;
      dst.data[i + 2] = b;
      dst.data[i + 3] = 255;
    }
  }
  
  // Write to a new canvas
  const normalCanvas = document.createElement('canvas');
  normalCanvas.width = w;
  normalCanvas.height = h;
  
  const normalCtx = normalCanvas.getContext('2d');
  if (normalCtx) {
    normalCtx.putImageData(dst, 0, 0);
  }
  
  return normalCanvas;
}
