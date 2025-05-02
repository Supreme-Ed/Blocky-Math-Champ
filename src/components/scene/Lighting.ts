import { DirectionalLight, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, Scene } from '@babylonjs/core';

/**
 * Sets up all scene lighting: ambient hemispheric, dramatic sun, and visible sun mesh.
 * @param scene - Babylon.js scene
 */
export function importSceneLighting(scene: Scene): void {
  // Subtle ambient light (hemispheric, low intensity)
  const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  (scene as any)._hemiLight = hemiLight;
  hemiLight.intensity = 0.30; // Reduced to make shadows more visible
  hemiLight.diffuse = new Color3(1, 1, 1);
  hemiLight.groundColor = new Color3(0, 0, 0);
  hemiLight.specular = new Color3(0, 0, 0);

  // Directional light at a steeper angle for better shadow definition
  const sunDirection = new Vector3(-0.5, -2.5, -0.3).normalize(); // Steeper angle for better shape projection
  const sunLight = new DirectionalLight("sunLight", sunDirection, scene);
  (scene as any)._sunLight = sunLight;

  // Position the light higher for better shadow projection
  sunLight.position = new Vector3(5, 20, 3);
  sunLight.intensity = 1.5; // Increased for better contrast in shadows
  sunLight.diffuse = new Color3(1, 1, 1); // Pure white light for clearer shadows
  sunLight.specular = new Color3(0.1, 0.1, 0.1); // Minimal specular to avoid washing out shadows

  // Optimized shadow settings for shape detail
  sunLight.shadowMinZ = 0;
  sunLight.shadowMaxZ = 40; // Extended to ensure full coverage
  sunLight.autoCalcShadowZBounds = false; // Manual control for precise shadow bounds
  sunLight.autoUpdateExtends = false; // Manual control for consistent shadow shapes

  // Tightly controlled shadow frustum for better detail
  sunLight.shadowOrthoScale = 0.05; // Tighter shadow area for better detail
  sunLight.shadowFrustumSize = 20; // Focused area for better resolution

  // Debug: Log light setup
  console.log("Sun light setup:", {
    direction: sunLight.direction,
    position: sunLight.position,
    intensity: sunLight.intensity,
    shadowMinZ: sunLight.shadowMinZ,
    shadowMaxZ: sunLight.shadowMaxZ,
    shadowOrthoScale: sunLight.shadowOrthoScale,
    shadowFrustumSize: sunLight.shadowFrustumSize
  });

  // Visible sun mesh in the sky
  const sunMesh = MeshBuilder.CreateSphere("sunMesh", { diameter: 12 }, scene);
  sunMesh.position = sunLight.position;
  const sunMat = new StandardMaterial("sunMat", scene);
  sunMat.emissiveColor = new Color3(1, 0.95, 0.6);
  sunMat.diffuseColor = new Color3(1, 1, 0.6);
  sunMat.specularColor = new Color3(0, 0, 0);
  sunMat.disableLighting = true;
  sunMesh.material = sunMat;
  sunMesh.isPickable = false;
  sunMesh.alwaysSelectAsActiveMesh = true;
}

interface DefaultLightOptions {
  name?: string;
  direction?: Vector3;
  intensity?: number;
}

/**
 * Creates a default hemispheric light for basic scene illumination.
 * @param scene - The Babylon.js scene
 * @param options - Light configuration options
 * @param options.name - Light name (default: 'light')
 * @param options.direction - Light direction (default: up)
 * @param options.intensity - Light intensity (default: 1.0)
 * @returns The created hemispheric light
 */
export function createDefaultLight(scene: Scene, options: DefaultLightOptions = {}): HemisphericLight {
  const { name = 'light', direction = new Vector3(0, 1, 0), intensity = 1.0 } = options;
  const light = new HemisphericLight(name, direction, scene);
  light.intensity = intensity;
  return light;
}

interface ShadowLightOptions {
  name?: string;
  direction?: Vector3;
  position?: Vector3;
  intensity?: number;
}

/**
 * Creates a directional light for shadows.
 * @param scene - The Babylon.js scene
 * @param options - Light configuration options
 * @param options.name - Light name (default: 'dirLight')
 * @param options.direction - Light direction (default: down-left)
 * @param options.position - Light position (default: above scene)
 * @param options.intensity - Light intensity (default: 1.0)
 * @returns The created directional light
 */
export function createShadowLight(scene: Scene, options: ShadowLightOptions = {}): DirectionalLight {
  const {
    name = 'dirLight',
    direction = new Vector3(-1, -2, -1),
    position = new Vector3(5, 15, 5),
    intensity = 1.0
  } = options;

  const light = new DirectionalLight(name, direction, scene);
  light.position = position;
  light.intensity = intensity;
  return light;
}
