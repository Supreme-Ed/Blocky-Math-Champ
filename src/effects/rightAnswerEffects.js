// src/effects/rightAnswerEffects.js
// Modular right answer feedback effects for cubes (glow, particles, animation, etc)
import { Color3 } from '@babylonjs/core';

/**
 * Plays the right answer effect (e.g., green glow) on the given mesh.
 * Future: extend with particles, animation, etc.
 * @param {BABYLON.Mesh} mesh - The Babylon.js mesh to animate
 * @param {object} [options] - Optional effect options
 * @returns {Promise<void>}
 */
export async function playRightAnswerEffect(mesh, options = {}) {
  if (!mesh || !mesh.material) return;

  // Handle MultiMaterial (used for cubes)
  let targetMat = mesh.material;
  if (targetMat && targetMat.subMaterials && Array.isArray(targetMat.subMaterials) && targetMat.subMaterials[0]) {
    targetMat = targetMat.subMaterials[0]; // answer face
  }
  if (!targetMat.emissiveColor) return;

  // Save original emissive color
  const originalEmissive = targetMat.emissiveColor.clone();
  targetMat.emissiveColor = Color3.Green();

  // Flash for 400ms, then restore
  setTimeout(() => {
    targetMat.emissiveColor = originalEmissive;
  }, options.duration || 400);
}

