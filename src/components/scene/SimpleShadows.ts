// src/components/scene/SimpleShadows.ts
// A very simple shadow implementation using the most basic techniques

import * as BABYLON from '@babylonjs/core';

/**
 * Applies the simplest possible shadow setup to the scene.
 * This uses a basic shadow map with minimal settings for maximum compatibility.
 * 
 * @param scene - The Babylon.js scene
 * @param shadowCaster - The mesh that will cast shadows
 * @param shadowReceiver - The mesh that will receive shadows
 * @returns The created shadow generator
 */
export function applySimpleShadows(
  scene: BABYLON.Scene,
  shadowCaster: BABYLON.AbstractMesh,
  shadowReceiver: BABYLON.AbstractMesh
): BABYLON.ShadowGenerator {
  console.log("Setting up simple shadows with:", {
    caster: shadowCaster.name,
    receiver: shadowReceiver.name
  });

  // 1. Create a dedicated light for shadows
  const shadowLight = new BABYLON.DirectionalLight(
    "simpleShadowLight",
    new BABYLON.Vector3(0, -1, 0), // Pointing straight down
    scene
  );
  shadowLight.position = new BABYLON.Vector3(0, 10, 0); // 10 units above the scene
  shadowLight.intensity = 1.0; // Full intensity
  
  // 2. Create a shadow generator with minimal settings
  const shadowGenerator = new BABYLON.ShadowGenerator(512, shadowLight);
  
  // 3. Add the shadow caster
  shadowGenerator.addShadowCaster(shadowCaster);
  
  // 4. Set the receiver to receive shadows
  shadowReceiver.receiveShadows = true;
  
  // 5. Force shadow map to render every frame
  const shadowMap = shadowGenerator.getShadowMap();
  if (shadowMap) {
    shadowMap.refreshRate = 0; // Render every frame
  }
  
  return shadowGenerator;
}

/**
 * Creates a simple shadow test scene with a box and a ground.
 * 
 * @param scene - The Babylon.js scene
 * @returns Object containing the created meshes and shadow generator
 */
export function createSimpleShadowTest(scene: BABYLON.Scene): {
  box: BABYLON.Mesh;
  ground: BABYLON.Mesh;
  shadowGenerator: BABYLON.ShadowGenerator;
} {
  // Create a box
  const box = BABYLON.MeshBuilder.CreateBox("simpleShadowBox", { size: 2 }, scene);
  box.position = new BABYLON.Vector3(0, 3, 0);
  
  // Create a material for the box
  const boxMat = new BABYLON.StandardMaterial("boxMat", scene);
  boxMat.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
  box.material = boxMat;
  
  // Create a ground
  const ground = BABYLON.MeshBuilder.CreateGround("simpleShadowGround", {
    width: 20,
    height: 20
  }, scene);
  ground.position.y = 0;
  
  // Create a material for the ground
  const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); // Light gray
  groundMat.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
  ground.material = groundMat;
  
  // Apply shadows
  const shadowGenerator = applySimpleShadows(scene, box, ground);
  
  // Animate the box
  let time = 0;
  scene.registerBeforeRender(() => {
    time += scene.getEngine().getDeltaTime() / 1000;
    box.position.y = 3 + Math.sin(time) * 2; // Move up and down
    box.rotation.y += 0.01; // Rotate
  });
  
  return { box, ground, shadowGenerator };
}
