// src/components/scene/DirectShadows.ts
// Direct shadow implementation that bypasses all the complexity

import * as BABYLON from '@babylonjs/core';

/**
 * Applies shadows directly to the scene with minimal configuration.
 * This is a simplified approach that should work in most cases.
 *
 * @param scene - The Babylon.js scene
 * @param meshesToCastShadows - Array of meshes that should cast shadows
 * @param meshesToReceiveShadows - Array of meshes that should receive shadows
 * @returns The created shadow generator
 */
export function applyDirectShadows(
  scene: BABYLON.Scene,
  meshesToCastShadows: BABYLON.AbstractMesh[] = [],
  meshesToReceiveShadows: BABYLON.AbstractMesh[] = []
): BABYLON.ShadowGenerator {
  // 1. Create a dedicated light for shadows - using a SpotLight instead of DirectionalLight
  const shadowLight = new BABYLON.SpotLight(
    "shadowSpotLight",
    new BABYLON.Vector3(0, 10, 0), // Position above the scene
    new BABYLON.Vector3(0, -1, 0), // Pointing straight down
    Math.PI / 2, // Cone angle (90 degrees)
    1, // Exponent
    scene
  );
  shadowLight.intensity = 1.0; // Full intensity

  console.log("Created shadow light:", {
    name: shadowLight.name,
    direction: shadowLight.direction,
    position: shadowLight.position
  });

  // 2. Create a shadow generator with basic settings - no fancy techniques
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, shadowLight);

  // Use the most basic shadow map technique
  shadowGenerator.useBlurExponentialShadowMap = false;
  shadowGenerator.useExponentialShadowMap = false;
  shadowGenerator.useKernelBlur = false;
  shadowGenerator.usePoissonSampling = false;
  shadowGenerator.useContactHardeningShadow = false;
  shadowGenerator.usePercentageCloserFiltering = false;

  // Make shadows very dark and obvious
  shadowGenerator.setDarkness(1.0);

  // Use a larger bias to avoid shadow acne
  shadowGenerator.bias = 0.01;

  // Force shadows to be visible
  shadowGenerator.forceBackFacesOnly = false;

  // Enable transparent shadows
  shadowGenerator.transparencyShadow = true;

  // Set shadow quality to low for better compatibility
  shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_LOW;

  // 3. Add shadow casters
  if (meshesToCastShadows.length > 0) {
    meshesToCastShadows.forEach(mesh => {
      if (mesh) {
        shadowGenerator.addShadowCaster(mesh, true);
        console.log(`Added shadow caster: ${mesh.name}`);
      }
    });
  }

  // 4. Set meshes to receive shadows
  if (meshesToReceiveShadows.length > 0) {
    meshesToReceiveShadows.forEach(mesh => {
      if (mesh) {
        mesh.receiveShadows = true;
        console.log(`Set ${mesh.name} to receive shadows`);
      }
    });
  }

  // 5. Force shadow map to render every frame
  const shadowMap = shadowGenerator.getShadowMap();
  if (shadowMap) {
    shadowMap.refreshRate = 0; // Render every frame
  }

  // 6. Set up automatic shadow casting for new meshes
  scene.onNewMeshAddedObservable.add(mesh => {
    // Skip meshes that shouldn't cast shadows
    if (mesh.name === 'skybox' || mesh.name.includes('ground') || mesh.name === 'sunMesh') {
      return;
    }

    // Add mesh to shadow casters
    shadowGenerator.addShadowCaster(mesh, true);
    console.log(`Added new mesh to shadow casters: ${mesh.name}`);
  });

  return shadowGenerator;
}

/**
 * Creates a simple test box that casts shadows.
 * Useful for testing if shadows are working.
 *
 * @param scene - The Babylon.js scene
 * @param position - Position of the test box
 * @returns The created box mesh
 */
export function createShadowTestBox(
  scene: BABYLON.Scene,
  position: BABYLON.Vector3 = new BABYLON.Vector3(0, 1, 0)
): BABYLON.Mesh {
  // Create a larger box
  const box = BABYLON.MeshBuilder.CreateBox("shadowTestBox", { size: 2 }, scene);
  box.position = position;

  // Create a material with bright color
  const boxMat = new BABYLON.StandardMaterial("boxMat", scene);
  boxMat.diffuseColor = new BABYLON.Color3(1, 0, 0); // Bright red
  boxMat.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
  boxMat.emissiveColor = new BABYLON.Color3(0.2, 0, 0); // Slight glow
  box.material = boxMat;

  // Animate the box with more dramatic movement
  let time = 0;
  scene.registerBeforeRender(() => {
    time += scene.getEngine().getDeltaTime() / 1000;
    box.rotation.y += 0.02;
    box.position.y = position.y + Math.sin(time) * 1.5; // More dramatic height change

    // Also move in X and Z for more dynamic shadows
    box.position.x = position.x + Math.sin(time * 0.7) * 2;
    box.position.z = position.z + Math.cos(time * 0.5) * 2;
  });

  return box;
}

/**
 * Creates a debug shadow plane that makes shadows more visible.
 * This is useful for debugging shadow issues.
 *
 * @param scene - The Babylon.js scene
 * @returns The created plane mesh
 */
export function createDebugShadowPlane(scene: BABYLON.Scene): BABYLON.Mesh {
  // Create a large ground for shadow visualization instead of a plane
  const plane = BABYLON.MeshBuilder.CreateGround(
    "debugShadowGround",
    {
      width: 20,
      height: 20,
      subdivisions: 1
    },
    scene
  );

  // Position it at y=0
  plane.position.y = 0.05; // Slightly above ground to avoid z-fighting

  // Create a material that will show shadows clearly
  const planeMat = new BABYLON.StandardMaterial("debugShadowPlaneMat", scene);
  planeMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.9); // Almost white
  planeMat.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
  planeMat.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3); // Add ambient

  // Make it fully opaque
  planeMat.alpha = 1.0;

  plane.material = planeMat;

  // Make sure it receives shadows
  plane.receiveShadows = true;

  return plane;
}
