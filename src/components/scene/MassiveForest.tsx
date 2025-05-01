import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface MassiveForestProps {
  scene: BABYLON.Scene | null;
  count?: number;
}

/**
 * MassiveForest component for Babylon.js scene.
 * Creates a forest of massive trees using the Tree.gltf model.
 */
function MassiveForest({ scene, count = 10 }: MassiveForestProps) {
  const treeNodesRef = useRef<BABYLON.TransformNode[]>([]);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("MassiveForest: Starting to create forest");
    
    const treeNodes: BABYLON.TransformNode[] = [];
    let disposed = false;
    
    // Create a parent node for all trees
    const forestParent = new BABYLON.TransformNode("massiveForestParent", scene);
    
    // Function to get a random position
    const getRandomPosition = () => {
      // Random position within a 60x60 area, avoiding the center 10x10
      let x, z;
      do {
        x = (Math.random() * 120 - 60);
        z = (Math.random() * 120 - 60);
      } while (Math.abs(x) < 5 && Math.abs(z) < 5); // Avoid center
      
      return new BABYLON.Vector3(x, 0, z);
    };
    
    // Function to get a random scale
    const getRandomScale = () => {
      return 10 + Math.random() * 10; // 10 to 20
    };
    
    // Function to get a random rotation
    const getRandomRotation = () => {
      return Math.random() * Math.PI * 2; // 0 to 2π
    };
    
    // Create a light specifically for the forest
    const forestLight = new BABYLON.HemisphericLight("forestLight", new BABYLON.Vector3(0, 1, 0), scene);
    forestLight.intensity = 1.0;
    forestLight.diffuse = new BABYLON.Color3(1, 1, 1);
    forestLight.specular = new BABYLON.Color3(1, 1, 1);
    forestLight.groundColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    
    // Load and place multiple trees
    for (let i = 0; i < count; i++) {
      // Create a transform node for this tree
      const treeNode = new BABYLON.TransformNode(`massiveTree_${i}`, scene);
      treeNode.parent = forestParent;
      
      // Set random position, rotation, and scale
      treeNode.position = getRandomPosition();
      treeNode.rotation.y = getRandomRotation();
      const scale = getRandomScale();
      treeNode.scaling = new BABYLON.Vector3(scale, scale, scale);
      
      // Store the node
      treeNodes.push(treeNode);
      
      console.log(`MassiveForest: Created tree node ${i} at position:`, treeNode.position);
      
      // Load the tree model
      BABYLON.SceneLoader.ImportMesh(
        "",
        "/models/trees/",
        "Tree.gltf",
        scene,
        (meshes, particleSystems, skeletons, animationGroups) => {
          if (disposed) return;
          
          console.log(`MassiveForest: Tree ${i} loaded successfully, meshes:`, meshes.length);
          
          // Parent all meshes to the tree node
          meshes.forEach(mesh => {
            if (mesh.id !== "__root__") {
              mesh.parent = treeNode;
              
              // Ensure the mesh is visible
              mesh.isVisible = true;
              
              // Add to shadow casters if shadow generator exists
              if ((scene as any)._shadowGenerator) {
                (scene as any)._shadowGenerator.addShadowCaster(mesh);
              }
            } else {
              mesh.dispose(); // Dispose the root mesh
            }
          });
          
          console.log(`MassiveForest: Tree ${i} positioned and scaled`);
        },
        (progressEvent) => {
          // Loading progress
          console.log(`MassiveForest: Tree ${i} loading progress:`, progressEvent.loaded / progressEvent.total);
        },
        (scene, message, exception) => {
          // Error handler
          console.error(`MassiveForest: Error loading tree ${i}:`, message, exception);
        }
      );
    }
    
    treeNodesRef.current = treeNodes;
    
    return () => {
      disposed = true;
      if (forestLight) forestLight.dispose();
      if (forestParent) forestParent.dispose();
      treeNodes.forEach(node => {
        if (node) node.dispose();
      });
      treeNodesRef.current = [];
    };
  }, [scene, count]);
  
  return null;
}

export default MassiveForest;
