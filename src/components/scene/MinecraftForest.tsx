import { useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import MinecraftTree from './MinecraftTree';

interface MinecraftForestProps {
  scene: BABYLON.Scene | null;
  count?: number;
}

/**
 * MinecraftForest component for Babylon.js scene.
 * Places multiple Minecraft-style trees throughout the scene.
 *
 * @param props - Component props
 * @param props.scene - Babylon.js scene instance
 * @param props.count - Number of trees to place (default: 10)
 * @returns React component with multiple MinecraftTree components
 */
function MinecraftForest({ scene, count = 10 }: MinecraftForestProps) {
  // Function to get a random position
  const getRandomPosition = () => {
    // Random position within a 100x100 area, avoiding the center 20x20
    let x, z;
    do {
      x = (Math.random() * 100 - 50);
      z = (Math.random() * 100 - 50);
    } while (Math.abs(x) < 10 && Math.abs(z) < 10); // Avoid center
    
    return new BABYLON.Vector3(x, 0, z);
  };
  
  // Function to get a random scale
  const getRandomScale = () => {
    return 8.0 + Math.random() * 4.0; // 8.0 to 12.0
  };
  
  // Function to get a random rotation
  const getRandomRotation = () => {
    return Math.random() * Math.PI * 2; // 0 to 2π
  };
  
  // Generate tree data
  const treeData = Array.from({ length: count }, () => ({
    position: getRandomPosition(),
    scale: getRandomScale(),
    rotation: getRandomRotation(),
    key: Math.random().toString(36).substring(2, 11) // Random key for React
  }));
  
  return (
    <>
      {treeData.map((tree) => (
        <MinecraftTree
          key={tree.key}
          scene={scene}
          position={tree.position}
          scale={tree.scale}
          rotation={tree.rotation}
        />
      ))}
    </>
  );
}

export default MinecraftForest;
