import { useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
// Import the GLTF loader
import '@babylonjs/loaders/glTF';

interface DirectTestProps {
  scene: BABYLON.Scene | null;
}

/**
 * DirectTest component for Babylon.js scene.
 * A direct approach to testing basic rendering and model loading.
 */
function DirectTest({ scene }: DirectTestProps) {
  useEffect(() => {
    if (!scene) return;
    
    console.log("DirectTest: Starting direct test");
    
    // Create a simple box
    const box = BABYLON.MeshBuilder.CreateBox("testBox", { size: 1 }, scene);
    box.position = new BABYLON.Vector3(0, 0.5, -3); // Place it in front of the camera
    
    const boxMaterial = new BABYLON.StandardMaterial("testBoxMat", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
    box.material = boxMaterial;
    
    console.log("DirectTest: Created test box at position:", box.position);
    
    // Create a ground
    const ground = BABYLON.MeshBuilder.CreateGround("testGround", { width: 10, height: 10 }, scene);
    ground.position.y = 0;
    
    const groundMaterial = new BABYLON.StandardMaterial("testGroundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5); // Gray
    ground.material = groundMaterial;
    
    console.log("DirectTest: Created test ground");
    
    // Create a light
    const light = new BABYLON.HemisphericLight("testLight", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.7;
    
    console.log("DirectTest: Created test light");
    
    // Try to load the tree model
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes) => {
        console.log("DirectTest: Tree model loaded successfully, meshes:", meshes);
        
        if (meshes && meshes.length > 0) {
          // Position the tree
          const rootMesh = meshes[0];
          rootMesh.position = new BABYLON.Vector3(2, 0, -3);
          
          console.log("DirectTest: Positioned tree at:", rootMesh.position);
        }
      },
      (progressEvent) => {
        // Loading progress
        console.log("DirectTest: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error handler
        console.error("DirectTest: Error loading tree model:", message, exception);
      }
    );
    
    return () => {
      // Cleanup
      if (box) box.dispose();
      if (ground) ground.dispose();
      if (light) light.dispose();
    };
  }, [scene]);
  
  return null; // No React DOM output
}

export default DirectTest;
