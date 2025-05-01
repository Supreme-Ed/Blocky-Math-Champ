import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface HybridForestProps {
  scene: BABYLON.Scene | null;
  count?: number;
}

/**
 * HybridForest component for Babylon.js scene.
 * Creates a forest using both primitive trees and GLTF trees.
 */
function HybridForest({ scene, count = 20 }: HybridForestProps) {
  const meshesRef = useRef<BABYLON.AbstractMesh[]>([]);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("HybridForest: Starting to create forest");
    
    const allMeshes: BABYLON.AbstractMesh[] = [];
    let disposed = false;
    
    // Create a parent node for all trees
    const forestParent = new BABYLON.TransformNode("hybridForestParent", scene);
    
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
      return 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    };
    
    // Function to get a random rotation
    const getRandomRotation = () => {
      return Math.random() * Math.PI * 2; // 0 to 2π
    };
    
    // Function to create a primitive tree
    const createPrimitiveTree = (position: BABYLON.Vector3, index: number) => {
      // Create a transform node for this tree
      const treeNode = new BABYLON.TransformNode(`primitiveTree_${index}`, scene);
      treeNode.parent = forestParent;
      treeNode.position = position;
      treeNode.rotation.y = getRandomRotation();
      const scale = getRandomScale() * 2; // Make primitive trees larger
      treeNode.scaling = new BABYLON.Vector3(scale, scale, scale);
      
      // Create the trunk (cylinder)
      const trunk = BABYLON.MeshBuilder.CreateCylinder(
        `treeTrunk_${index}`,
        {
          height: 4,
          diameter: 0.5
        },
        scene
      );
      trunk.parent = treeNode;
      trunk.position.y = 2;
      
      // Create a brown material for the trunk
      const trunkMaterial = new BABYLON.StandardMaterial(`trunkMat_${index}`, scene);
      trunkMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1); // Brown
      trunk.material = trunkMaterial;
      
      allMeshes.push(trunk);
      
      // Create the foliage (cone)
      const foliage = BABYLON.MeshBuilder.CreateCylinder(
        `treeFoliage_${index}`,
        {
          height: 6,
          diameterTop: 0,
          diameterBottom: 4
        },
        scene
      );
      foliage.parent = treeNode;
      foliage.position.y = 6;
      
      // Create a green material for the foliage
      const foliageMaterial = new BABYLON.StandardMaterial(`foliageMat_${index}`, scene);
      foliageMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1); // Green
      foliage.material = foliageMaterial;
      
      allMeshes.push(foliage);
      
      // Add to shadow casters if shadow generator exists
      if ((scene as any)._shadowGenerator) {
        (scene as any)._shadowGenerator.addShadowCaster(trunk);
        (scene as any)._shadowGenerator.addShadowCaster(foliage);
      }
      
      console.log(`HybridForest: Created primitive tree ${index} at position:`, position);
      
      return treeNode;
    };
    
    // Function to create a GLTF tree
    const createGltfTree = (position: BABYLON.Vector3, index: number) => {
      // Create a transform node for this tree
      const treeNode = new BABYLON.TransformNode(`gltfTree_${index}`, scene);
      treeNode.parent = forestParent;
      treeNode.position = position;
      treeNode.rotation.y = getRandomRotation();
      const scale = 15 + Math.random() * 5; // 15 to 20 (very large)
      treeNode.scaling = new BABYLON.Vector3(scale, scale, scale);
      
      // Load the tree model
      BABYLON.SceneLoader.ImportMesh(
        "",
        "/models/trees/",
        "Tree.gltf",
        scene,
        (meshes, particleSystems, skeletons, animationGroups) => {
          if (disposed) return;
          
          // Parent all meshes to the tree node
          meshes.forEach(mesh => {
            if (mesh.id !== "__root__") {
              mesh.parent = treeNode;
              
              // Ensure the mesh is visible
              mesh.isVisible = true;
              
              allMeshes.push(mesh);
              
              // Add to shadow casters if shadow generator exists
              if ((scene as any)._shadowGenerator) {
                (scene as any)._shadowGenerator.addShadowCaster(mesh);
              }
            } else {
              mesh.dispose(); // Dispose the root mesh
            }
          });
          
          console.log(`HybridForest: GLTF tree ${index} loaded and positioned`);
        },
        null,
        (scene, message, exception) => {
          // Error handler
          console.error(`HybridForest: Error loading GLTF tree ${index}:`, message, exception);
        }
      );
      
      console.log(`HybridForest: Created GLTF tree node ${index} at position:`, position);
      
      return treeNode;
    };
    
    // Create trees
    for (let i = 0; i < count; i++) {
      const position = getRandomPosition();
      
      // Alternate between primitive and GLTF trees
      if (i % 2 === 0) {
        createPrimitiveTree(position, i);
      } else {
        createGltfTree(position, i);
      }
    }
    
    meshesRef.current = allMeshes;
    
    return () => {
      disposed = true;
      if (forestParent) forestParent.dispose();
      allMeshes.forEach(mesh => {
        if (mesh) mesh.dispose();
      });
      meshesRef.current = [];
    };
  }, [scene, count]);
  
  return null;
}

export default HybridForest;
