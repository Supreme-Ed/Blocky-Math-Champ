// src/components/scene/Ground.ts
// Modular Babylon.js ground mesh and procedural sand texture
import * as BABYLON from '@babylonjs/core';
import { Texture } from '@babylonjs/core';
import { perlin } from './perlin';

interface GroundOptions {
  width?: number;
  height?: number;
  y?: number;
  amplitude?: number;
  frequency?: number;
  subdivisions?: number;
}

interface TerrainUpdateParams {
  amplitude: number;
  frequency: number;
}

/**
 * Creates a procedural ground mesh with Perlin noise terrain
 * @param scene - Babylon.js scene
 * @param options - Ground creation options
 * @returns The created ground mesh
 */
export function createGround(scene: BABYLON.Scene, options: GroundOptions = {}): BABYLON.Mesh {
  if (!scene) throw new Error('Scene is required for ground creation');

  // Large size for "infinite" illusion
  const {
    width = 2000,
    height = 2000,
    y = 0,
    amplitude = 2,
    frequency = 0.008,
    subdivisions = 200
  } = options;

  // Create large subdivided ground mesh
  const ground = BABYLON.MeshBuilder.CreateGround('ground', {
    width,
    height,
    subdivisions,
    updatable: true
  }, scene);
  ground.position.y = y;

  // Flat platform region (centered at origin)
  const platformWidth = 200;   // width of flat area (x axis)
  const platformDepth = 200;   // depth of flat area (z axis)
  const blendRadius = 80;      // distance over which to blend from flat to hilly

  /**
   * Updates the terrain with new amplitude and frequency
   * @param params - Parameters for terrain update
   */
  function updateTerrain({ amplitude: newAmplitude, frequency: newFrequency }: TerrainUpdateParams): void {
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    if (!positions) return;

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
    if (!indices) return;

    const normals: number[] = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    ground.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
  }

  // Initial terrain setup
  const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
  if (!positions) throw new Error('Failed to get position data from ground mesh');

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
    positions[i + 1] = height;
    minY = Math.min(minY, positions[i + 1]);
    maxY = Math.max(maxY, positions[i + 1]);
  }

  ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);

  // Recompute normals for correct shading
  const indices = ground.getIndices();
  if (!indices) throw new Error('Failed to get indices from ground mesh');

  const normals: number[] = [];
  BABYLON.VertexData.ComputeNormals(positions, indices, normals);
  ground.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);

  // Expose terrain update on mesh metadata
  ground.metadata = ground.metadata || {};
  ground.metadata.updateTerrain = updateTerrain;

  // Minecraft-style grass texture (optional, or use as albedo)
  const grassTexture = new Texture('textures/terrain_textures/grass.png', scene, false, false, Texture.NEAREST_NEAREST_MIPNEAREST);
  grassTexture.uScale = width;
  grassTexture.vScale = height;

  // Use StandardMaterial instead of PBR for better shadow reception
  const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
  groundMat.diffuseTexture = grassTexture;
  groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.7, 0.2); // greenish tint
  groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Reduce specular reflection

  // Critical: Enable shadows on the ground
  ground.receiveShadows = true;

  // Set material properties for better shadow reception
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0); // No specular

  // Debug: Log shadow settings
  console.log("Ground set to receive shadows:", {
    name: ground.name,
    receiveShadows: ground.receiveShadows,
    material: groundMat.name,
    materialType: "StandardMaterial"
  });

  ground.material = groundMat;
  ground.isPickable = false;

  return ground;
}
