// src/components/scene/FixedShadows.ts
// Improved shadow implementation based on the working minimal demo

import * as BABYLON from '@babylonjs/core';

interface ShadowOptions {
  mapSize?: number;
  blurKernel?: number;
  darkness?: number;
  bias?: number;
  useContactHardening?: boolean;
}

/**
 * Creates a shadow generator with settings that match the working minimal demo.
 * This implementation is designed to be more reliable than the existing shadow setup.
 * 
 * @param scene - Babylon.js scene
 * @param light - The light to cast shadows
 * @param shadowCasters - Meshes that should cast shadows
 * @param groundMesh - The ground mesh to receive shadows
 * @param options - Shadow configuration options
 * @returns The created shadow generator
 */
export function createReliableShadows(
  scene: BABYLON.Scene,
  light: BABYLON.DirectionalLight | BABYLON.SpotLight,
  shadowCasters: BABYLON.AbstractMesh[] = [],
  groundMesh?: BABYLON.AbstractMesh,
  options: ShadowOptions = {}
): BABYLON.ShadowGenerator {
  if (!scene) throw new Error('Scene is required for shadow creation');
  if (!light) throw new Error('Light is required for shadow creation');

  // Extract options with defaults that match the working minimal demo
  const {
    mapSize = 1024,
    blurKernel = 32,
    darkness = 0.2,
    bias = 0.0005,
    useContactHardening = false
  } = options;

  // Log the shadow creation parameters
  console.log('Creating reliable shadows with:', {
    light: light.name,
    lightDirection: light.direction,
    lightPosition: light.position,
    mapSize,
    blurKernel,
    darkness,
    bias,
    useContactHardening,
    shadowCasters: shadowCasters.map(mesh => mesh.name),
    groundMesh: groundMesh?.name
  });

  // Create the shadow generator with minimal demo settings
  const shadowGenerator = new BABYLON.ShadowGenerator(mapSize, light);
  
  // Use the same shadow technique as the minimal demo
  shadowGenerator.useBlurExponentialShadowMap = true;
  shadowGenerator.useKernelBlur = true;
  shadowGenerator.blurKernel = blurKernel;
  shadowGenerator.bias = bias;
  
  // Enable transparent shadows (helps with some edge cases)
  shadowGenerator.transparencyShadow = true;
  
  // Set darkness
  shadowGenerator.setDarkness(darkness);
  
  // Force shadow map to render every frame for debugging
  const shadowMap = shadowGenerator.getShadowMap();
  if (shadowMap) {
    shadowMap.refreshRate = 0; // Render every frame
  }

  // Add initial shadow casters if provided
  if (Array.isArray(shadowCasters) && shadowCasters.length > 0) {
    shadowCasters.forEach(mesh => {
      if (mesh) {
        shadowGenerator.addShadowCaster(mesh, true); // Include descendants
        console.log(`Added shadow caster: ${mesh.name}`);
      }
    });
  }

  // Set ground to receive shadows if provided
  if (groundMesh) {
    groundMesh.receiveShadows = true;
    console.log(`Set ${groundMesh.name} to receive shadows`);
  }

  // Set up automatic shadow casting for new meshes
  scene.onNewMeshAddedObservable.add(mesh => {
    // Skip meshes that shouldn't cast shadows (skybox, ground, etc.)
    if (mesh.name === 'skybox' || mesh.name === 'ground' || mesh.name === 'sunMesh') {
      return;
    }

    // Add mesh to shadow casters
    shadowGenerator.addShadowCaster(mesh, true);
    console.log(`Added new mesh to shadow casters: ${mesh.name}`);
  });

  return shadowGenerator;
}

/**
 * Creates a simple test scene with a box casting a shadow on a ground plane.
 * This is useful for testing shadow rendering in isolation.
 * 
 * @param scene - Babylon.js scene
 * @returns Object containing the created meshes and shadow generator
 */
export function createShadowTestScene(scene: BABYLON.Scene) {
  if (!scene) throw new Error('Scene is required for shadow test scene');

  // Create a light specifically for shadows
  const light = new BABYLON.DirectionalLight('shadowTestLight', new BABYLON.Vector3(-1, -2, -1), scene);
  light.position = new BABYLON.Vector3(5, 15, 5);
  light.intensity = 1.0;

  // Create a ground plane
  const ground = BABYLON.MeshBuilder.CreateGround('shadowTestGround', { width: 10, height: 10 }, scene);
  ground.position.y = 0;
  const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.6, 1, 0.6); // Green color like minimal demo
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
  ground.material = groundMat;
  ground.receiveShadows = true;

  // Create a box for shadow casting
  const box = BABYLON.MeshBuilder.CreateBox('shadowTestBox', { size: 2 }, scene);
  box.position.y = 1;
  const boxMat = new BABYLON.StandardMaterial('boxMat', scene);
  boxMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1); // Blue color like minimal demo
  box.material = boxMat;

  // Create shadow generator
  const shadowGenerator = createReliableShadows(scene, light, [box], ground);

  // Animate the box
  scene.registerBeforeRender(() => {
    box.rotation.y += 0.01;
  });

  return {
    light,
    ground,
    box,
    shadowGenerator
  };
}
