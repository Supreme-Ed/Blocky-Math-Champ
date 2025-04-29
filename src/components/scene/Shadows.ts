// src/components/scene/Shadows.ts
// Babylon.js shadow generator setup (Blur ESM style)
import { ShadowGenerator, Scene, DirectionalLight, SpotLight, Mesh, AbstractMesh } from '@babylonjs/core';

interface ShadowOptions {
  mapSize?: number;
  blurKernel?: number;
  darkness?: number;
  bias?: number;
  useContactHardening?: boolean;
}

/**
 * Adds Blur Exponential Shadow Map (Blur ESM) shadows to the scene.
 * @param scene - Babylon.js scene
 * @param light - The light to cast shadows
 * @param shadowCasters - Meshes that should cast shadows (e.g. cubes)
 * @param groundMesh - The ground mesh to receive shadows
 * @param options - Shadow configuration options
 * @param options.mapSize - Shadow map resolution (default: 2048)
 * @param options.blurKernel - Blur kernel size for softness (default: 32)
 * @param options.darkness - Shadow darkness (0 to 1) (default: 0.2)
 * @param options.bias - Shadow bias to prevent shadow acne (default: 0.0005)
 * @param options.useContactHardening - Use PCSS (contact hardening shadows) (default: false)
 * @returns The created shadow generator
 */
export function addBlurESMShadows(
  scene: Scene,
  light: DirectionalLight | SpotLight,
  shadowCasters: AbstractMesh[],
  groundMesh: Mesh | null,
  options: ShadowOptions = {}
): ShadowGenerator {
  const {
    mapSize = 2048,
    blurKernel = 32,
    darkness = 0.2,
    bias = 0.0005,
    useContactHardening = false
  } = options;

  // Create the shadow generator
  const shadowGenerator = new ShadowGenerator(mapSize, light);

  // Configure shadow type
  if (useContactHardening) {
    // PCSS shadows (more realistic but more expensive)
    shadowGenerator.useContactHardeningShadow = true;
    shadowGenerator.contactHardeningLightSizeUVRatio = 0.05;
  } else {
    // Try PCF shadows (better quality than ESM in some cases)
    shadowGenerator.usePercentageCloserFiltering = true;

    // Fallback to Blur ESM shadows if PCF not supported
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.blurKernel = blurKernel;
  }

  // Common shadow settings
  shadowGenerator.bias = bias;
  shadowGenerator.setDarkness(darkness);
  shadowGenerator.filteringQuality = ShadowGenerator.QUALITY_HIGH;

  // Debug: Force shadow map to render every frame
  const shadowMap = shadowGenerator.getShadowMap();
  if (shadowMap) {
    shadowMap.refreshRate = 0; // Render every frame
  }

  // Debug: Log shadow settings
  console.log("Shadow settings:", {
    mapSize,
    blurKernel,
    darkness,
    bias,
    useContactHardening,
    light: light.name,
    direction: light.direction,
    position: light.position
  });

  // Add initial shadow casters if provided
  if (Array.isArray(shadowCasters) && shadowCasters.length > 0) {
    shadowCasters.forEach(mesh => {
      if (mesh) {
        shadowGenerator.addShadowCaster(mesh, true); // Include descendants
      }
    });
  }

  // Set ground to receive shadows
  if (groundMesh) {
    groundMesh.receiveShadows = true;
  }

  return shadowGenerator;
}
