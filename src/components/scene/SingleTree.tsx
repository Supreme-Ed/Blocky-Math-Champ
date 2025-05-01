import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface SingleTreeProps {
  scene: BABYLON.Scene | null;
}

/**
 * SingleTree component for Babylon.js scene.
 * Loads a single tree model using a different approach.
 */
function SingleTree({ scene }: SingleTreeProps) {
  const treeMeshRef = useRef<BABYLON.AbstractMesh | null>(null);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("SingleTree: Starting to load tree");
    
    // Create a simple box as a placeholder
    const box = BABYLON.MeshBuilder.CreateBox("treePlaceholder", { size: 1 }, scene);
    box.position = new BABYLON.Vector3(0, 0.5, -5);
    
    const boxMaterial = new BABYLON.StandardMaterial("boxMat", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    box.material = boxMaterial;
    
    console.log("SingleTree: Created placeholder box");
    
    // Try to load the tree using SceneLoader.Append instead of ImportMesh
    BABYLON.SceneLoader.Append(
      "/models/trees/",
      "Tree.gltf",
      scene,
      (scene) => {
        // Success callback
        console.log("SingleTree: Tree loaded successfully");
        
        // Find the loaded tree meshes (they should be the most recently added meshes)
        const treeMeshes = scene.meshes.filter(mesh => 
          mesh.name.includes("Tree") || 
          mesh.name.includes("tree") || 
          mesh.name.includes("__root__")
        );
        
        console.log("SingleTree: Found tree meshes:", treeMeshes.map(m => m.name));
        
        if (treeMeshes.length > 0) {
          // Position the tree
          treeMeshes.forEach(mesh => {
            mesh.position = new BABYLON.Vector3(3, 0, -5);
            mesh.scaling = new BABYLON.Vector3(2, 2, 2); // Make it larger
          });
          
          // Store the main mesh
          treeMeshRef.current = treeMeshes[0];
          
          // Remove the placeholder box
          box.dispose();
          
          console.log("SingleTree: Positioned tree and removed placeholder");
        }
      },
      (progressEvent) => {
        // Progress callback
        console.log("SingleTree: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error callback
        console.error("SingleTree: Error loading tree:", message, exception);
      }
    );
    
    return () => {
      // Cleanup
      if (box) box.dispose();
      if (treeMeshRef.current) treeMeshRef.current.dispose();
    };
  }, [scene]);
  
  return null;
}

export default SingleTree;
