import { DirectionalLight, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3 } from '@babylonjs/core';

/**
 * Sets up all scene lighting: ambient hemispheric, dramatic sun, and visible sun mesh.
 * @param {BABYLON.Scene} scene
 */
export function importSceneLighting(scene) {
  // Subtle ambient light (hemispheric, low intensity)
  const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.15;
  hemiLight.diffuse = new Color3(0.7, 0.8, 1.0);
  hemiLight.groundColor = new Color3(0.4, 0.4, 0.4);
  hemiLight.specular = new Color3(0, 0, 0);

  // Dramatic sun (directional light, westward and low)
  const sunDirection = new Vector3(-2, -1, 0).normalize();
  const sunLight = new DirectionalLight("sunLight", sunDirection, scene);
  sunLight.position = new Vector3(-150, 60, 0);
  sunLight.intensity = 2.2;
  sunLight.diffuse = new Color3(1, 0.95, 0.8);
  sunLight.specular = new Color3(1, 1, 0.9);
  sunLight.shadowMinZ = 1;
  sunLight.shadowMaxZ = 5000;
  sunLight.autoCalcShadowZBounds = true;

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

/**
 * Creates a default hemispheric light for basic scene illumination.
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} [options]
 * @param {string} [options.name='light'] - Light name
 * @param {BABYLON.Vector3} [options.direction=new Vector3(0,1,0)] - Light direction
 * @param {number} [options.intensity=1.0] - Light intensity
 * @returns {BABYLON.HemisphericLight}
 */
export function createDefaultLight(scene, options = {}) {
  const { name = 'light', direction = new Vector3(0, 1, 0), intensity = 1.0 } = options;
  const light = new HemisphericLight(name, direction, scene);
  light.intensity = intensity;
  return light;
}

/**
 * Creates a directional light for shadows.
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Object} [options]
 * @param {string} [options.name='dirLight'] - Light name
 * @param {BABYLON.Vector3} [options.direction=new Vector3(0,-1,0)] - Light direction
 * @param {BABYLON.Vector3} [options.position=new Vector3(5,15,5)] - Light position
 * @param {number} [options.intensity=1.0] - Light intensity
 * @returns {BABYLON.DirectionalLight}
 */
export function createShadowLight(scene, options = {}) {
  const { name = 'dirLight', direction = new Vector3(-1, -2, -1), position = new Vector3(5, 15, 5), intensity = 1.0 } = options;
  const light = new DirectionalLight(name, direction, scene);
  light.position = position;
  light.intensity = intensity;
  return light;
}
