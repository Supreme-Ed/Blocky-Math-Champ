// src/components/scene/Ground.js
// Modular Babylon.js ground mesh and procedural sand texture
import * as BABYLON from '@babylonjs/core';
import { Texture } from '@babylonjs/core';

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

  // Minecraft-style grass texture
  const grassTexture = new Texture('textures/terrain_textures/grass_carried.png', scene, false, false, Texture.NEAREST_NEAREST_MIPNEAREST);
  // Tile the texture so each tile is 1x1 block
  grassTexture.uScale = width;
  grassTexture.vScale = height;

  // Material
  const groundMat = new BABYLON.StandardMaterial('groundMaterial', scene);
  groundMat.diffuseTexture = grassTexture;
  groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
  ground.material = groundMat;

  return ground;
}
