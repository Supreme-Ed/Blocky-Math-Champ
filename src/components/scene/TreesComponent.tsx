import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface TreesComponentProps {
  scene: BABYLON.Scene | null;
  count?: number;
}

/**
 * TreesComponent for Babylon.js scene.
 * Loads and places tree models throughout the scene.
 * Uses the exact same approach as VillagerNPC which is known to work.
 *
 * @param props - Component props
 * @param props.scene - Babylon.js scene instance
 * @param props.count - Number of trees to place (default: 10)
 * @returns null (no React DOM output, purely Babylon.js side effect)
 */
function TreesComponent({ scene, count = 10 }: TreesComponentProps) {
  const treeMeshesRef = useRef<BABYLON.AbstractMesh[][]>([]);

  // Load and place trees
  useEffect(() => {
    if (!scene) return;

    console.log("TreesComponent: Starting to load trees");

    const allTreeMeshes: BABYLON.AbstractMesh[][] = [];
    let disposed = false;

    // Log scene information
    console.log("TreesComponent: Scene information:", {
      name: scene.name,
      meshesCount: scene.meshes.length,
      lightsCount: scene.lights.length,
      camerasCount: scene.cameras.length,
      materialsCount: scene.materials.length
    });

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

    // Function to get a random scale (larger than before)
    const getRandomScale = () => {
      const scale = 1.0 + Math.random() * 0.5; // 1.0 to 1.5
      return scale;
    };

    // Function to get a random rotation
    const getRandomRotation = () => {
      return Math.random() * Math.PI * 2; // 0 to 2π
    };

    // Log that we're about to load trees
    console.log(`TreesComponent: About to load ${count} trees`);

    // Load and place multiple trees
    for (let i = 0; i < count; i++) {
      console.log(`TreesComponent: Starting to load tree ${i}`);

      // Using the exact same approach as VillagerNPC
      BABYLON.SceneLoader.ImportMesh(
        null,
        '/models/trees/',
        'Tree.gltf',
        scene,
        (meshes, particleSystems, skeletons, animationGroups) => {
          if (disposed) return;

          // Store the meshes
          allTreeMeshes.push(meshes);

          // Get the root mesh
          const treeRoot = meshes[0];

          // Set random position, scale, and rotation
          const position = getRandomPosition();
          const scale = getRandomScale();
          const rotation = getRandomRotation();

          treeRoot.position = position;
          treeRoot.scaling = new BABYLON.Vector3(scale, scale, scale);
          treeRoot.rotation = new BABYLON.Vector3(0, rotation, 0);

          console.log(`Tree ${i} loaded and positioned at:`, position);

          // Add to shadow casters if shadow generator exists
          if ((scene as any)._shadowGenerator) {
            meshes.forEach(mesh => {
              (scene as any)._shadowGenerator.addShadowCaster(mesh);
              console.log(`Added tree mesh to shadow casters:`, mesh.name);
            });
          }
        },
        (progressEvent) => {
          // Loading progress
          console.log(`Tree ${i} loading progress:`, progressEvent.loaded / progressEvent.total);
        },
        (scene, message, exception) => {
          // Error handler
          console.error(`Error loading tree ${i}:`, message, exception);
        }
      );
    }

    treeMeshesRef.current = allTreeMeshes;

    return () => {
      disposed = true;
      // Clean up all tree meshes
      allTreeMeshes.forEach(meshes => {
        meshes.forEach(mesh => {
          if (mesh) mesh.dispose();
        });
      });
      treeMeshesRef.current = [];
    };
  }, [scene, count]);

  return null; // No React DOM output, purely Babylon.js side effect
}

export default TreesComponent;
