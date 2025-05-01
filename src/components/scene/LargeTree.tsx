import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface LargeTreeProps {
  scene: BABYLON.Scene | null;
}

/**
 * LargeTree component for Babylon.js scene.
 * Loads a single tree model with a very large scale and ensures all materials are visible.
 */
function LargeTree({ scene }: LargeTreeProps) {
  const treeMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("LargeTree: Starting to load tree");
    
    // Create a reference box to show the intended position and scale
    const refBox = BABYLON.MeshBuilder.CreateBox("treeRefBox", { 
      width: 5,
      height: 10,
      depth: 5
    }, scene);
    refBox.position = new BABYLON.Vector3(0, 5, -10);
    
    const refBoxMaterial = new BABYLON.StandardMaterial("refBoxMat", scene);
    refBoxMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0);
    refBoxMaterial.alpha = 0.3; // Make it semi-transparent
    refBox.material = refBoxMaterial;
    
    console.log("LargeTree: Created reference box at position:", refBox.position);
    
    // Load the tree model
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        console.log("LargeTree: Tree loaded successfully, meshes:", meshes.map(m => m.name));
        
        if (meshes && meshes.length > 0) {
          // Store the meshes
          treeMeshesRef.current = meshes;
          
          // Get the root mesh
          const rootMesh = meshes[0];
          
          // Position and scale the tree
          rootMesh.position = new BABYLON.Vector3(0, 0, -10);
          
          // Apply a very large scale
          const scale = 10.0; // Much larger than before
          rootMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
          
          console.log("LargeTree: Positioned and scaled tree at:", rootMesh.position);
          
          // Ensure all materials are visible
          meshes.forEach(mesh => {
            if (mesh.material) {
              // Make sure the material is not transparent
              const material = mesh.material as BABYLON.StandardMaterial;
              if (material.alpha < 1.0) {
                material.alpha = 1.0;
              }
              
              // Make sure the material has a diffuse color
              if (material.diffuseColor) {
                // Brighten the diffuse color
                material.diffuseColor = new BABYLON.Color3(
                  Math.min(material.diffuseColor.r + 0.2, 1.0),
                  Math.min(material.diffuseColor.g + 0.2, 1.0),
                  Math.min(material.diffuseColor.b + 0.2, 1.0)
                );
              }
              
              // Make sure the material has some ambient color
              if (material.ambientColor) {
                material.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5);
              }
              
              console.log(`LargeTree: Adjusted material for mesh ${mesh.name}`);
            }
          });
          
          // Add to shadow casters if shadow generator exists
          if ((scene as any)._shadowGenerator) {
            meshes.forEach(mesh => {
              (scene as any)._shadowGenerator.addShadowCaster(mesh);
              console.log(`LargeTree: Added mesh to shadow casters:`, mesh.name);
            });
          }
        }
      },
      (progressEvent) => {
        // Loading progress
        console.log("LargeTree: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error handler
        console.error("LargeTree: Error loading tree:", message, exception);
      }
    );
    
    return () => {
      // Cleanup
      if (refBox) refBox.dispose();
      treeMeshesRef.current.forEach(mesh => {
        if (mesh) mesh.dispose();
      });
    };
  }, [scene]);
  
  return null;
}

export default LargeTree;
