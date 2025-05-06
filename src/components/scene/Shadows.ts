// src/components/scene/Shadows.ts
// Babylon.js shadow generator setup (Blur ESM style)
import * as BABYLON from '@babylonjs/core';
import { ShadowGenerator, Scene, DirectionalLight, SpotLight, Mesh, AbstractMesh, Vector3 } from '@babylonjs/core';

interface ShadowOptions {
  mapSize?: number;
  blurKernel?: number;
  darkness?: number;
  bias?: number;
  useContactHardening?: boolean;
}

/**
 * Creates a shadow light and generator using the exact settings from the working minimal demo.
 * This is the implementation that was proven to work reliably after extensive debugging.
 *
 * @param scene - Babylon.js scene
 * @param ground - The ground mesh that will receive shadows
 * @param excludedMeshNames - Names of meshes that should not cast shadows (e.g., ground, skybox)
 * @returns An object containing the created light and shadow generator
 */
export function createMinimalDemoShadows(
  scene: Scene,
  ground: Mesh,
  excludedMeshNames: string[] = []
): { shadowLight: DirectionalLight; shadowGenerator: ShadowGenerator } {
  // --- Lighting Setup (Replicating Minimal Demo) ---
  const shadowLight = new BABYLON.DirectionalLight(
    "sunLight", // Use "sunLight" to match what LightingControls expects
    new BABYLON.Vector3(-1, -2, -1).normalize(),
    scene
  );
  shadowLight.position = new BABYLON.Vector3(5, 15, 5); // Match minimal demo position
  shadowLight.intensity = 1.0; // Full intensity
  shadowLight.shadowMinZ = 1; // Match minimal demo
  shadowLight.shadowMaxZ = 50; // Match minimal demo

  // Store the light in scene._sunLight for the debug panel to find
  (scene as any)._sunLight = shadowLight;

  // Create a hemispheric light for ambient lighting
  const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.3; // Low intensity to not wash out shadows
  hemiLight.diffuse = new BABYLON.Color3(0.7, 0.8, 1.0); // Slightly blue sky color
  hemiLight.groundColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Dark ground reflection
  hemiLight.specular = new BABYLON.Color3(0, 0, 0); // No specular

  // Store the hemispheric light in scene._hemiLight for the debug panel to find
  (scene as any)._hemiLight = hemiLight;

  // Create a visible sun mesh in the sky (for visual reference and to match what LightingControls expects)
  const sunMesh = BABYLON.MeshBuilder.CreateSphere("sunMesh", { diameter: 12 }, scene);
  sunMesh.position = shadowLight.position.clone();
  const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
  sunMat.emissiveColor = new BABYLON.Color3(1, 0.95, 0.6); // Yellowish glow
  sunMat.diffuseColor = new BABYLON.Color3(1, 1, 0.6); // Yellow-white
  sunMat.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
  sunMat.disableLighting = true; // Self-illuminated
  sunMesh.material = sunMat;
  sunMesh.isPickable = false;
  sunMesh.receiveShadows = false;
  // sunMesh.isShadowCaster = false; // This property doesn't exist on Mesh directly. Shadow casting is managed by adding to ShadowGenerator.

  // // console.log("Created DirectionalLight (Minimal Demo Style):", shadowLight.name);
  // // console.log("Light Direction:", shadowLight.direction);
  // // console.log("Light Position:", shadowLight.position);
  // // console.log("Light Frustum:", shadowLight.shadowMinZ, "-", shadowLight.shadowMaxZ);

  // --- Shadow Generator Setup (Enhanced Shape Detail) ---
  const shadowGenerator = new BABYLON.ShadowGenerator(4096, shadowLight); // Higher resolution for better shape detail

  // Use PCF shadows for better shape definition
  shadowGenerator.usePercentageCloserFiltering = true;

  // Minimal blur to preserve shadow shape details
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.useKernelBlur = true;
  shadowGenerator.blurKernel = 16; // Reduced for sharper shadow edges that better match mesh shapes

  // Fine-tuned shadow parameters for shape preservation
  shadowGenerator.bias = 0.00005; // Very small bias to prevent shadow acne while maintaining detail
  shadowGenerator.normalBias = 0.005; // Reduced to preserve shape details
  shadowGenerator.transparencyShadow = true; // Enable transparency
  shadowGenerator.setDarkness(0.6); // Darker shadows for better visibility of shape
  shadowGenerator.frustumEdgeFalloff = 0.05; // Minimal falloff to preserve shadow edges

  // Set highest quality filtering
  shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;

  // Enable cascaded shadow maps for better detail at different distances
  shadowGenerator.usePoissonSampling = false; // Disable Poisson sampling to preserve shape

  // Force shadow map to render every frame for consistent quality
  const shadowMap = shadowGenerator.getShadowMap();
  if (shadowMap) {
    shadowMap.refreshRate = 0; // Render every frame
  }

  // // console.log("Using Enhanced Shadow Generator (PCSS with fallbacks)");

  // Force ground to receive shadows
  if (ground) {
    ground.receiveShadows = true;
    // // console.log("Ground receiveShadows set to:", ground.receiveShadows);
  }

  /*
  // console.log("Created shadow generator (Minimal Demo Style):", {
    bias: shadowGenerator.bias,
    darkness: shadowGenerator.getDarkness(),
    filter: 'BlurExponentialShadowMap',
    blurKernel: shadowGenerator.blurKernel,
    transparencyShadow: shadowGenerator.transparencyShadow
  });
  */

  // Add existing meshes to shadow caster list (excluding specified meshes)
  scene.meshes.forEach(mesh => {
    // Skip excluded meshes
    if (!excludedMeshNames.includes(mesh.name) && mesh !== sunMesh) { // Also ensure sunMesh is not added
      try {
        shadowGenerator.addShadowCaster(mesh);
        // // console.log(`Added existing mesh to shadow casters: ${mesh.name}`);
      } catch (error) {
        console.error(`Error adding existing mesh ${mesh.name} to shadow casters:`, error);
      }
    }
  });

  return { shadowLight, shadowGenerator };
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
  /*
  // console.log("Shadow settings:", {
    mapSize,
    blurKernel,
    darkness,
    bias,
    useContactHardening,
    light: light.name,
    direction: light.direction,
    position: light.position,
    usePercentageCloserFiltering: shadowGenerator.usePercentageCloserFiltering,
    useBlurExponentialShadowMap: shadowGenerator.useBlurExponentialShadowMap,
    useKernelBlur: shadowGenerator.useKernelBlur,
    transparencyShadow: shadowGenerator.transparencyShadow
  });
  */

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
    // // console.log(`Setting ground mesh ${groundMesh.name} to receive shadows`);
    // // console.log(`Ground mesh material: ${groundMesh.material?.name || 'none'}`);
    // // console.log(`Ground mesh receiveShadows before: ${groundMesh.receiveShadows}`);

    groundMesh.receiveShadows = true;

    // // console.log(`Ground mesh receiveShadows after: ${groundMesh.receiveShadows}`);
  } else {
    // console.warn("No ground mesh provided to receive shadows!");
  }

  return shadowGenerator;
}
