// src/components/scene/Shadows.js
// Babylon.js shadow generator setup (Blur ESM style)
import { ShadowGenerator } from '@babylonjs/core';

/**
 * Adds Blur Exponential Shadow Map (Blur ESM) shadows to the scene.
 * @param {BABYLON.Scene} scene - Babylon.js scene
 * @param {BABYLON.DirectionalLight|BABYLON.SpotLight} light - The light to cast shadows
 * @param {BABYLON.Mesh[]} shadowCasters - Meshes that should cast shadows (e.g. cubes)
 * @param {BABYLON.Mesh} groundMesh - The ground mesh to receive shadows
 * @param {Object} [options]
 * @param {number} [options.mapSize=2048] - Shadow map resolution
 * @param {number} [options.blurKernel=32] - Blur kernel size for softness
 * @returns {BABYLON.ShadowGenerator}
 */
export function addBlurESMShadows(scene, light, shadowCasters, groundMesh, options = {}) {
  const { mapSize = 2048, blurKernel = 32 } = options;

  // Create the shadow generator
  const shadowGenerator = new ShadowGenerator(mapSize, light);
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.useKernelBlur = true;
  shadowGenerator.blurKernel = blurKernel;
  shadowGenerator.bias = 0.0005; // Matches minimal demo

  // Only the ground receives shadows
  if (groundMesh) groundMesh.receiveShadows = true;

  return shadowGenerator;
}
