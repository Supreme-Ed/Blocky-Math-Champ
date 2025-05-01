import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface ForestTreesProps {
  scene: BABYLON.Scene | null;
  count?: number; // Number of trees to place
  area?: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}

/**
 * ForestTrees component for Babylon.js scene.
 * Loads and places tree models randomly throughout the landscape.
 *
 * @param props - Component props
 * @param props.scene - Babylon.js scene instance
 * @param props.count - Number of trees to place (default: 10)
 * @param props.area - Area boundaries for tree placement (default: large area around origin)
 * @returns null (no React DOM output, purely Babylon.js side effect)
 */
function ForestTrees({
  scene,
  count = 10,
  area = { minX: -20, maxX: 20, minZ: -20, maxZ: 20 }
}: ForestTreesProps) {
  const treeRootNodesRef = useRef<BABYLON.TransformNode[]>([]);

  // Helper to get a random position within the specified area
  const getRandomPosition = () => {
    const x = Math.random() * (area.maxX - area.minX) + area.minX;
    const z = Math.random() * (area.maxZ - area.minZ) + area.minZ;

    // Avoid placing trees in the center area where gameplay happens
    // Create a "no-tree zone" in the center
    const centerRadius = 5;
    const distanceFromCenter = Math.sqrt(x * x + z * z);

    if (distanceFromCenter < centerRadius) {
      // If too close to center, move it outward
      const angle = Math.atan2(z, x);
      const newX = Math.cos(angle) * centerRadius * 1.2;
      const newZ = Math.sin(angle) * centerRadius * 1.2;
      return new BABYLON.Vector3(newX, 0, newZ);
    }

    return new BABYLON.Vector3(x, 0, z); // Y is 0 to place on ground
  };

  // Helper to get a random scale for variety
  const getRandomScale = () => {
    // Random scale between 0.5 and 1.0 for trees
    const scale = 0.5 + Math.random() * 0.5;
    return new BABYLON.Vector3(scale, scale, scale);
  };

  // Helper to find the ground height at a given position
  const findGroundHeight = (position: BABYLON.Vector3): number => {
    // Default to 0 if no ground is found
    let groundHeight = 0;

    // Cast a ray from above the position down to find the ground
    if (scene) {
      const ray = new BABYLON.Ray(
        new BABYLON.Vector3(position.x, 10, position.z), // Start from above
        new BABYLON.Vector3(0, -1, 0), // Direction down
        20 // Length of ray
      );

      const hit = scene.pickWithRay(ray, (mesh) => {
        // Only consider meshes that could be ground
        return mesh.name.includes('ground') || mesh.name.includes('Ground');
      });

      if (hit && hit.hit) {
        groundHeight = hit.pickedPoint?.y || 0;
      }
    }

    return groundHeight;
  };

  // Helper to get a random rotation around Y axis
  const getRandomRotation = () => {
    // Random rotation around Y axis (0 to 2π)
    return new BABYLON.Vector3(0, Math.random() * Math.PI * 2, 0);
  };

  // Load and place trees
  useEffect(() => {
    if (!scene) return;

    const treeRootNodes: BABYLON.TransformNode[] = [];
    const treePositions: BABYLON.Vector3[] = []; // Track positions to avoid overlap
    let disposed = false;

    // Create a parent transform node for all trees
    const forestParent = new BABYLON.TransformNode("forestParent", scene);

    // Check if a position is too close to existing trees
    const isTooCloseToOtherTrees = (position: BABYLON.Vector3): boolean => {
      const minDistance = 3; // Minimum distance between trees

      for (const existingPosition of treePositions) {
        const distance = BABYLON.Vector3.Distance(position, existingPosition);
        if (distance < minDistance) {
          return true; // Too close
        }
      }

      return false; // Not too close
    };

    // Function to load and place a single tree
    const loadAndPlaceTree = (index: number) => {
      BABYLON.SceneLoader.ImportMesh(
        null,
        '/models/trees/',
        'Tree.gltf',
        scene,
        (meshes, particleSystems, skeletons) => {
          if (disposed) return;

          // Create a transform node for this tree instance
          const treeRoot = new BABYLON.TransformNode(`tree_${index}`, scene);
          treeRoot.parent = forestParent;

          // Get random position and ensure it's not too close to other trees
          let randomPosition: BABYLON.Vector3;
          let attempts = 0;
          const maxAttempts = 10;

          do {
            randomPosition = getRandomPosition();
            attempts++;
          } while (isTooCloseToOtherTrees(randomPosition) && attempts < maxAttempts);

          // Find the ground height at this position
          const groundHeight = findGroundHeight(randomPosition);

          // Set position, rotation, and scale
          randomPosition.y = groundHeight; // Place on ground
          treeRoot.position = randomPosition;
          treeRoot.rotation = getRandomRotation();
          treeRoot.scaling = getRandomScale();

          // Remember this position to avoid placing trees too close
          treePositions.push(randomPosition);

          // Parent all meshes to the tree root
          meshes.forEach(mesh => {
            if (mesh.id !== "__root__") {
              mesh.parent = treeRoot;

              // Enable shadows for the tree
              if (scene && (scene as any)._shadowGenerator) {
                (scene as any)._shadowGenerator.addShadowCaster(mesh, true);
                console.log(`Added tree mesh to shadow casters: ${mesh.name}`);
              }
            } else {
              mesh.dispose(); // Dispose the root mesh as we're using our own transform node
            }
          });

          treeRootNodes.push(treeRoot);
        }
      );
    };

    // Load and place multiple trees
    for (let i = 0; i < count; i++) {
      loadAndPlaceTree(i);
    }

    treeRootNodesRef.current = treeRootNodes;

    return () => {
      disposed = true;
      treeRootNodes.forEach(node => {
        if (node) node.dispose();
      });
      if (forestParent) forestParent.dispose();
      treeRootNodesRef.current = [];
    };
  }, [scene, count, area]);

  return null; // No React DOM output, purely Babylon.js side effect
}

export default ForestTrees;
