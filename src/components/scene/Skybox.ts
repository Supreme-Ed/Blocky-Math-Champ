// src/components/scene/Skybox.ts
// Modular Babylon.js procedural skybox (dynamic clouds) for the scene
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/procedural-textures';
import { CloudProceduralTexture } from '../../procedural/CloudProceduralTexture';
// Removed BackgroundMaterial import to fix build issues

interface SkyboxOptions {
  diameter?: number;
  skyColor?: BABYLON.Color3;
  cloudColor?: BABYLON.Color3;
}

/**
 * Creates and configures a procedural cloud skybox (skydome) for the scene using StandardMaterial.
 * Returns a reference to the created mesh. Cleans up previous mesh if present.
 *
 * @param scene - The Babylon.js scene
 * @param options - Configuration options
 * @param options.diameter - Diameter of the skydome (default: 1000)
 * @param options.skyColor - Cloud color (default: white, controls the color of the clouds)
 * @param options.cloudColor - Sky/background color (default: light blue, controls the background)
 * @returns The created skydome mesh
 *
 * Note: Babylon.js CloudProceduralTexture uses 'cloudColor' as the background and 'skyColor' as the color for the cloud shapes.
 * The debug panel swaps these for correct visual effect (blue sky, white clouds).
 */
export function createSkybox(scene: BABYLON.Scene, options: SkyboxOptions = {}): BABYLON.Mesh {
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

  // Babylon.js quirk: cloudColor is the background, skyColor is the cloud shapes
  cloudProcTexture.skyColor = new BABYLON.Color4(cloudColor.r, cloudColor.g, cloudColor.b, 1.0); // white clouds
  cloudProcTexture.cloudColor = new BABYLON.Color4(skyColor.r, skyColor.g, skyColor.b, 1.0); // blue background

  // Use StandardMaterial instead of BackgroundMaterial to fix build issues
  const skyMat = new BABYLON.StandardMaterial('skyboxMaterial', scene);
  skyMat.diffuseTexture = cloudProcTexture;
  skyMat.diffuseTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyMat.backFaceCulling = false; // Still need back face culling off for sphere
  skyMat.disableLighting = true; // Disable lighting for skybox
  skyMat.specularColor = new BABYLON.Color3(0, 0, 0); // No specular highlights
  skyMat.emissiveColor = new BABYLON.Color3(1, 1, 1); // Full emissive to make it bright

  // Explicitly disable depth writing for the skybox material
  skyMat.disableDepthWrite = true;

  skydome.material = skyMat;
  skydome.isPickable = false;
  skydome.position = new BABYLON.Vector3(0, 0, 0);

  // Explicitly set isShadowCaster to false
  skydome.isShadowCaster = false;
  skydome.receiveShadows = false; // Also don't receive shadows

  // Remove properties that were causing issues
  // skydome.alwaysSelectAsActiveMesh = true; // Not needed
  // skydome.layerMask = 0x10000000; // Not needed
  // skydome.renderingGroupId = -1; // Not needed

  return skydome;
}
