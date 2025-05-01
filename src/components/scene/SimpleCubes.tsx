import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface SimpleCubesProps {
  scene: BABYLON.Scene | null;
  count?: number;
}

/**
 * SimpleCubes component for Babylon.js scene.
 * Creates simple cubes as tree placeholders.
 */
function SimpleCubes({ scene, count = 10 }: SimpleCubesProps) {
  const cubesRef = useRef<BABYLON.Mesh[]>([]);
  
  useEffect(() => {
    if (!scene) return;
    
    console.log("SimpleCubes: Creating cubes as tree placeholders");
    
    const cubes: BABYLON.Mesh[] = [];
    
    // Function to get a random position
    const getRandomPosition = () => {
      // Random position within a 30x30 area, avoiding the center 10x10
      let x, z;
      do {
        x = (Math.random() * 60 - 30);
        z = (Math.random() * 60 - 30);
      } while (Math.abs(x) < 5 && Math.abs(z) < 5); // Avoid center
      
      return new BABYLON.Vector3(x, 0, z);
    };
    
    // Create multiple cubes
    for (let i = 0; i < count; i++) {
      // Create a cube
      const cube = BABYLON.MeshBuilder.CreateBox(`treeCube_${i}`, { 
        width: 1,
        height: 3, // Taller to look more like a tree
        depth: 1
      }, scene);
      
      // Position the cube
      cube.position = getRandomPosition();
      cube.position.y = 1.5; // Half the height
      
      // Create a green material
      const material = new BABYLON.StandardMaterial(`treeCubeMat_${i}`, scene);
      material.diffuseColor = new BABYLON.Color3(0, 0.7, 0);
      cube.material = material;
      
      // Add to array
      cubes.push(cube);
      
      console.log(`SimpleCubes: Created cube ${i} at position:`, cube.position);
      
      // Add to shadow casters if shadow generator exists
      if ((scene as any)._shadowGenerator) {
        (scene as any)._shadowGenerator.addShadowCaster(cube);
        console.log(`SimpleCubes: Added cube to shadow casters:`, cube.name);
      }
    }
    
    cubesRef.current = cubes;
    
    return () => {
      // Cleanup
      cubes.forEach(cube => {
        if (cube) cube.dispose();
      });
      cubesRef.current = [];
    };
  }, [scene, count]);
  
  return null;
}

export default SimpleCubes;
