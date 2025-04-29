// src/effects/wrongAnswerEffects.ts
// Modular wrong answer feedback effects for cubes (glow, particles, animation, etc)
import { Color3, Mesh, AbstractMesh, Material, MultiMaterial } from '@babylonjs/core';

interface WrongAnswerEffectOptions {
  duration?: number;
}

/**
 * Plays the wrong answer effect (e.g., red glow) on the given mesh.
 * Future: extend with particles, animation, etc.
 * @param mesh - The Babylon.js mesh to animate
 * @param options - Optional effect options
 * @returns Promise that resolves when the effect is complete
 */
export async function playWrongAnswerEffect(mesh: AbstractMesh, options: WrongAnswerEffectOptions = {}): Promise<void> {
  if (!mesh || !mesh.material) return;

  // Handle MultiMaterial (used for cubes)
  let targetMat: Material = mesh.material;
  if (targetMat instanceof MultiMaterial && targetMat.subMaterials && Array.isArray(targetMat.subMaterials) && targetMat.subMaterials[0]) {
    targetMat = targetMat.subMaterials[0]; // answer face
  }

  // Check if the material has emissiveColor property
  if (!('emissiveColor' in targetMat)) return;

  // Save original emissive color
  const originalEmissive = (targetMat as any).emissiveColor.clone();
  (targetMat as any).emissiveColor = Color3.Red();

  // Flash for 400ms, then restore
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      (targetMat as any).emissiveColor = originalEmissive;
      resolve();
    }, options.duration || 400);
  });
}
