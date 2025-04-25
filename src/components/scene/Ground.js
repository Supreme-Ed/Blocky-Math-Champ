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
    subdivisions,
    updatable: true
  }, scene);
  ground.position.y = y;

  // Apply procedural Perlin noise for hills/valleys
  function updateTerrain({ amplitude: newAmplitude, frequency: newFrequency }) {
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const perlinVal = perlin(x * newFrequency, z * newFrequency);
      // Distance from platform edge (0 inside platform, grows outside)
      const dx = Math.max(Math.abs(x) - platformWidth/2, 0);
      const dz = Math.max(Math.abs(z) - platformDepth/2, 0);
      const dist = Math.sqrt(dx*dx + dz*dz);
      let blend = Math.min(1, dist / blendRadius);
      blend = blend * blend * (3 - 2 * blend);
      const height = (1 - blend) * 0 + blend * (perlinVal * newAmplitude);
      positions[i + 1] = height;
      minY = Math.min(minY, positions[i + 1]);
      maxY = Math.max(maxY, positions[i + 1]);
    }
    ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    const indices = ground.getIndices();
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    ground.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
  }

  // Initial terrain setup
  const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  // Flat platform region (centered at origin)
  const platformWidth = 20;   // width of flat area (x axis)
  const platformDepth = 20;   // depth of flat area (z axis)
  const blendRadius = 8;      // distance over which to blend from flat to hilly
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const z = positions[i + 2];
    const perlinVal = perlin(x * frequency, z * frequency);
    // Distance from platform edge (0 inside platform, grows outside)
    const dx = Math.max(Math.abs(x) - platformWidth/2, 0);
    const dz = Math.max(Math.abs(z) - platformDepth/2, 0);
    const dist = Math.sqrt(dx*dx + dz*dz);
    let blend = Math.min(1, dist / blendRadius);
    blend = blend * blend * (3 - 2 * blend);
    const height = (1 - blend) * 0 + blend * (perlinVal * amplitude);
    if (i < 30) {
      console.log(`Perlin(${x * frequency}, ${z * frequency}) = ${perlinVal}, blend=${blend}, height=${height}`);
    }
    positions[i + 1] = height;
    minY = Math.min(minY, positions[i + 1]);
    maxY = Math.max(maxY, positions[i + 1]);
  }
  ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
  const updatedPositions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  console.log('Sample updated Y values:', updatedPositions[1], updatedPositions[4], updatedPositions[7]);
  console.log('Ground Y range:', minY, maxY);

  // Recompute normals for correct shading
  const indices = ground.getIndices();
  const normals = [];
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);
  ground.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

  // Expose terrain update on mesh metadata
  ground.metadata = ground.metadata || {};
  ground.metadata.updateTerrain = updateTerrain;


  // Minecraft-style grass texture (optional, or use as albedo)
  const grassTexture = new Texture('textures/terrain_textures/grass_carried.png', scene, false, false, Texture.NEAREST_NEAREST_MIPNEAREST);
  grassTexture.uScale = width;
  grassTexture.vScale = height;

  // Realistic PBR material
  const groundMat = new BABYLON.PBRMaterial('groundPBR', scene);
  groundMat.albedoTexture = grassTexture;
  groundMat.albedoColor = new BABYLON.Color3(0.4, 0.7, 0.2); // greenish tint
  groundMat.metallic = 0.1;
  groundMat.roughness = 0.7; // moderately rough for terrain
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

