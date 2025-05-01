import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface PrimitiveForestProps {
  scene: BABYLON.Scene | null;
  count?: number;
}

/**
 * PrimitiveForest component for Babylon.js scene.
 * Creates a forest of tree-like shapes using Babylon.js primitives.
 */
function PrimitiveForest({ scene, count = 20 }: PrimitiveForestProps) {
  const treesRef = useRef<BABYLON.Mesh[][]>([]);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("PrimitiveForest: Creating forest of primitive trees");
    
    const allTrees: BABYLON.Mesh[][] = [];
    
    // Function to get a random position
    const getRandomPosition = () => {
      // Random position within a 40x40 area, avoiding the center 10x10
      let x, z;
      do {
        x = (Math.random() * 80 - 40);
        z = (Math.random() * 80 - 40);
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
    
    // Function to create a tree-like shape
    const createTreeShape = (position: BABYLON.Vector3, index: number) => {
      const treeParts: BABYLON.Mesh[] = [];
      
      // Create the trunk (cylinder)
      const trunk = BABYLON.MeshBuilder.CreateCylinder(
        `treeTrunk_${index}`,
        {
          height: 4,
          diameter: 0.5
        },
        scene
      );
      trunk.position = new BABYLON.Vector3(position.x, 2, position.z);
      
      // Create a brown material for the trunk
      const trunkMaterial = new BABYLON.StandardMaterial(`trunkMat_${index}`, scene);
      trunkMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1); // Brown
      trunk.material = trunkMaterial;
      
      treeParts.push(trunk);
      
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
      foliage.position = new BABYLON.Vector3(position.x, 6, position.z);
      
      // Create a green material for the foliage
      const foliageMaterial = new BABYLON.StandardMaterial(`foliageMat_${index}`, scene);
      foliageMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1); // Green
      foliage.material = foliageMaterial;
      
      treeParts.push(foliage);
      
      // Apply random rotation
      const rotation = getRandomRotation();
      trunk.rotation.y = rotation;
      foliage.rotation.y = rotation;
      
      // Apply random scale
      const scale = getRandomScale();
      trunk.scaling = new BABYLON.Vector3(scale, scale, scale);
      foliage.scaling = new BABYLON.Vector3(scale, scale, scale);
      
      // Add to shadow casters if shadow generator exists
      if ((scene as any)._shadowGenerator) {
        treeParts.forEach(part => {
          (scene as any)._shadowGenerator.addShadowCaster(part);
          console.log(`PrimitiveForest: Added part to shadow casters:`, part.name);
        });
      }
      
      return treeParts;
    };
    
    // Create multiple trees
    for (let i = 0; i < count; i++) {
      const position = getRandomPosition();
      const treeParts = createTreeShape(position, i);
      allTrees.push(treeParts);
      
      console.log(`PrimitiveForest: Created tree ${i} at position:`, position);
    }
    
    treesRef.current = allTrees;
    
    return () => {
      // Cleanup
      allTrees.forEach(treeParts => {
        treeParts.forEach(part => {
          if (part) part.dispose();
        });
      });
      treesRef.current = [];
    };
  }, [scene, count]);
  
  return null;
}

export default PrimitiveForest;
