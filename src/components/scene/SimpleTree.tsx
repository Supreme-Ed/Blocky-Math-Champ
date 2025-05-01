import { useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
// Import the GLTF loader
import '@babylonjs/loaders/glTF';

interface SimpleTreeProps {
  scene: BABYLON.Scene | null;
}

/**
 * SimpleTree component for Babylon.js scene.
 * A direct approach to loading and placing a tree model.
 */
function SimpleTree({ scene }: SimpleTreeProps) {
  useEffect(() => {
    if (!scene) return;
    
    console.log("SimpleTree: Attempting to load tree model");
    
    // Create a simple box as a fallback/placeholder
    const box = BABYLON.MeshBuilder.CreateBox("treeBox", { size: 1 }, scene);
    box.position = new BABYLON.Vector3(0, 0.5, -5); // Place it in front of the camera
    
    const boxMaterial = new BABYLON.StandardMaterial("treeBoxMat", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0);
    box.material = boxMaterial;
    
    console.log("SimpleTree: Created placeholder box at position:", box.position);
    
    // Now try to load the actual tree model
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes) => {
        console.log("SimpleTree: Tree model loaded successfully, meshes:", meshes);
        
        if (meshes && meshes.length > 0) {
          // Position the tree
          const rootMesh = meshes[0];
          rootMesh.position = new BABYLON.Vector3(3, 0, -5);
          
          console.log("SimpleTree: Positioned tree at:", rootMesh.position);
          
          // Add to shadow casters if shadow generator exists
          if ((scene as any)._shadowGenerator) {
            meshes.forEach(mesh => {
              (scene as any)._shadowGenerator.addShadowCaster(mesh);
              console.log("SimpleTree: Added mesh to shadow casters:", mesh.name);
            });
          }
        }
      },
      (progressEvent) => {
        // Loading progress
        console.log("SimpleTree: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error handler
        console.error("SimpleTree: Error loading tree model:", message, exception);
      }
    );
    
    return () => {
      // Cleanup
      if (box) box.dispose();
    };
  }, [scene]);
  
  return null; // No React DOM output
}

export default SimpleTree;
