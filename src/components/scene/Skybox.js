// src/components/scene/Skybox.js
// Modular Babylon.js procedural skybox (dynamic clouds) for the scene
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/procedural-textures';
import { CloudProceduralTexture } from '../../procedural/CloudProceduralTexture';

/**
 * Creates and configures a procedural cloud skybox (skydome) for the scene.
 * Returns a reference to the created mesh. Cleans up previous mesh if present.
 *
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {object} [options]
 * @param {number} [options.diameter=1000] - Diameter of the skydome
 * @param {BABYLON.Color3} [options.skyColor] - Cloud color (default: white, controls the color of the clouds)
 * @param {BABYLON.Color3} [options.cloudColor] - Sky/background color (default: light blue, controls the background)
 * @returns {BABYLON.Mesh} The created skydome mesh
 *
 * Note: Babylon.js CloudProceduralTexture uses 'cloudColor' as the background and 'skyColor' as the color for the cloud shapes. The debug panel swaps these for correct visual effect (blue sky, white clouds).
 */
export function createSkybox(scene, options = {}) {
  if (!scene) throw new Error('Scene is required for skybox creation');
  const {
    diameter = 1000,
    skyColor = new BABYLON.Color3(0.8, 0.9, 1.0),
    cloudColor = new BABYLON.Color3(1.0, 1.0, 1.0)
  } = options;

  // Create skydome mesh
  const skydome = BABYLON.MeshBuilder.CreateSphere('skybox_sphere', { segments: 100, diameter }, scene);

  // Procedural cloud texture
  const cloudProcTexture = new CloudProceduralTexture('cloudTex', 1024, scene);
  cloudProcTexture.refreshRate = 1; // update every frame for animation
  cloudProcTexture.numOctaves = 12; // Set max cloud detail by default
  // DEBUG: Confirm type and animationSpeed property
  // eslint-disable-next-line no-console
  // console.warn('Created skybox texture:', cloudProcTexture, 'Is CloudProceduralTexture:', cloudProcTexture instanceof CloudProceduralTexture, 'animationSpeed:', cloudProcTexture.animationSpeed);
  // Babylon.js quirk: cloudColor is the background, skyColor is the cloud shapes
  cloudProcTexture.cloudColor = skyColor; // blue background
  cloudProcTexture.skyColor = cloudColor; // white clouds

  // Material
  const skyMat = new BABYLON.StandardMaterial('skyboxMaterial', scene);
  skyMat.emissiveTexture = cloudProcTexture;
  skyMat.backFaceCulling = false;
  skyMat.emissiveTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyMat.disableLighting = true;
  skydome.material = skyMat;
  skydome.isPickable = false;
  skydome.position = new BABYLON.Vector3(0, 0, 0);

  // Optionally set as always on background
  skydome.alwaysSelectAsActiveMesh = true;
  skydome.layerMask = 0x0FFFFFFF;

  return skydome;
}
