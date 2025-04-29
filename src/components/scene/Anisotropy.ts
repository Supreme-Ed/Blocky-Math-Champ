// src/components/scene/Anisotropy.ts
// Modular helper for applying anisotropic filtering to Babylon.js PBR materials
import * as BABYLON from '@babylonjs/core';

interface AnisotropyOptions {
  enabled?: boolean;
  level?: number;
  direction?: BABYLON.Vector2;
  texture?: BABYLON.Texture | null;
}

/**
 * Applies anisotropic filtering to a Babylon.js PBR material.
 * @param material - The PBR material to modify
 * @param options - Configuration options
 * @param options.enabled - Whether to enable anisotropy (default: true)
 * @param options.level - Anisotropy level (1, 2, 4, 8, 16) (default: 1)
 * @param options.direction - Optional direction vector (default: (1, 0))
 * @param options.texture - Optional anisotropy texture
 */
export function applyAnisotropy(material: BABYLON.PBRMaterial, options: AnisotropyOptions = {}): void {
  if (!material || !material.anisotropy) throw new Error('PBRMaterial with anisotropy required');
  
  const {
    enabled = true,
    level = 1,
    direction = new BABYLON.Vector2(1, 0),
    texture = null,
  } = options;

  material.anisotropy.isEnabled = !!enabled;
  if (material.anisotropy.isEnabled) {
    // Babylon.js uses level 1-16 for anisotropy
    material.anisotropy.intensity = Math.max(1, Math.min(level, 16));
    material.anisotropy.direction.copyFrom(direction);
    if (texture) {
      material.anisotropy.texture = texture;
    }
  }
}
