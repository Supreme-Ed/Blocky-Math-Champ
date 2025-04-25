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
import { perlin } from './perlin';

export function createGround(scene, options = {}) {
  if (!scene) throw new Error('Scene is required for ground creation');
  // Large size for "infinite" illusion
  const { width = 2000, height = 2000, y = 0, amplitude = 20, frequency = 0.008, subdivisions = 200 } = options;

  // Create large subdivided ground mesh
  const ground = BABYLON.MeshBuilder.CreateGround('ground', {
    width,
    height,
    subdivisions
  }, scene);
  ground.position.y = y;

  // Apply procedural Perlin noise for hills/valleys
  const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    // Perlin noise for smooth hills
    positions[i + 1] = perlin(x * frequency, z * frequency) * amplitude;
  }
  ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

  // Minecraft-style grass texture
  const grassTexture = new Texture('textures/terrain_textures/grass_carried.png', scene, false, false, Texture.NEAREST_NEAREST_MIPNEAREST);
  grassTexture.uScale = width;
  grassTexture.vScale = height;

  // Material
  const groundMat = new BABYLON.StandardMaterial('groundMaterial', scene);
  groundMat.diffuseTexture = grassTexture;
  groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
  ground.material = groundMat;
  ground.isPickable = false;

  /**
   * Optional: Set up fog in your scene for a seamless infinite look
   * scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
   * scene.fogDensity = 0.003;
   * scene.fogColor = new BABYLON.Color3(0.8, 0.9, 1.0);
   */

  return ground;
}

