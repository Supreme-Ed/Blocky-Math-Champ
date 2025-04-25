// src/components/scene/Anisotropy.js
// Modular helper for applying anisotropic filtering to Babylon.js PBR materials
import * as BABYLON from '@babylonjs/core';

/**
 * Applies anisotropic filtering to a Babylon.js PBR material.
 * @param {BABYLON.PBRMaterial} material - The PBR material to modify
 * @param {object} [options]
 * @param {boolean} [options.enabled=true] - Whether to enable anisotropy
 * @param {number} [options.level=1] - Anisotropy level (1, 2, 4, 8, 16)
 * @param {BABYLON.Vector2} [options.direction] - Optional direction vector (default: (1, 0))
 * @param {BABYLON.Texture} [options.texture] - Optional anisotropy texture
 */
export function applyAnisotropy(material, options = {}) {
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
