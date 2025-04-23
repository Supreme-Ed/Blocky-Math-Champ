// src/components/scene/Ground.js
// Modular Babylon.js ground mesh and procedural sand texture
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/procedural-textures';
import { PerlinNoiseProceduralTexture } from '@babylonjs/procedural-textures';

/**
 * Creates and configures the ground mesh with a procedural sand texture.
 * Returns a reference to the created mesh. Cleans up previous mesh if present.
 *
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {object} [options]
 * @param {number} [options.width=10]
 * @param {number} [options.height=10]
 * @param {number} [options.y=0]
 * @returns {BABYLON.Mesh} The created ground mesh
 */
export function createGround(scene, options = {}) {
  if (!scene) throw new Error('Scene is required for ground creation');
  const { width = 10, height = 10, y = 0 } = options;

  // Create ground mesh
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width, height }, scene);
  ground.position.y = y;

  // Procedural sand texture
  const sandTexture = new PerlinNoiseProceduralTexture('sandNoise', 256, scene);
  sandTexture.octaves = 6;
  sandTexture.persistence = 0.8;
  sandTexture.brightness = 0.3;
  sandTexture.uScale = 10;
  sandTexture.vScale = 10;

  // Material
  const groundMat = new BABYLON.StandardMaterial('groundMaterial', scene);
  groundMat.diffuseTexture = sandTexture;
  groundMat.diffuseColor = new BABYLON.Color3(0.93, 0.84, 0.69);
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
  ground.material = groundMat;

  return ground;
}
