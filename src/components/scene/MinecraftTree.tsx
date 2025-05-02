import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

interface MinecraftTreeProps {
  scene: BABYLON.Scene | null;
  position?: BABYLON.Vector3;
  scale?: number;
  rotation?: number;
}

/**
 * MinecraftTree component for Babylon.js scene.
 * Loads and places a tree model from the GLTF file.
 *
 * @param props - Component props
 * @param props.scene - Babylon.js scene instance
 * @param props.position - Position of the tree (default: origin)
 * @param props.scale - Scale of the tree (default: 1.0)
 * @param props.rotation - Y-axis rotation in radians (default: 0)
 * @returns null (no React DOM output, purely Babylon.js side effect)
 */
function MinecraftTree({
  scene,
  position = new BABYLON.Vector3(0, 0, 0),
  scale = 1.0,
  rotation = 0
}: MinecraftTreeProps) {
  const treeMeshesRef = useRef<BABYLON.AbstractMesh[]>([]);

  useEffect(() => {
    if (!scene) return;

    console.log("MinecraftTree: Loading tree at position:", position);

    let disposed = false;

    // Load the tree model using the same approach as VillagerNPC
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        if (disposed) return;

        // Store the meshes
        treeMeshesRef.current = meshes;

        // Get the root mesh
        const rootMesh = meshes[0];

        // Set position, scale, and rotation
        rootMesh.position = position;

        // Apply a larger scale to make the tree more visible
        rootMesh.scaling = new BABYLON.Vector3(scale, scale, scale);

        // Log the scale for debugging
        console.log(`MinecraftTree: Applied scale ${scale} to tree at position ${position}`);

        rootMesh.rotation = new BABYLON.Vector3(0, rotation, 0);

        console.log("MinecraftTree: Tree loaded and positioned at:", position);

        // Add to shadow casters if shadow generator exists
        if (window.shadowGenerator) {
          meshes.forEach(mesh => {
            window.shadowGenerator?.addShadowCaster(mesh);
            console.log(`MinecraftTree: Added mesh to shadow casters: ${mesh.name}`);
          });
        }
      },
      (progressEvent) => {
        // Loading progress
        console.log("MinecraftTree: Loading progress:", progressEvent.loaded / progressEvent.total);
      },
      (scene, message, exception) => {
        // Error handler
        console.error("MinecraftTree: Error loading tree:", message, exception);
      }
    );

    return () => {
      disposed = true;
      // Clean up all tree meshes
      treeMeshesRef.current.forEach(mesh => {
        if (mesh) mesh.dispose();
      });
      treeMeshesRef.current = [];
    };
  }, [scene, position, scale, rotation]);

  return null; // No React DOM output, purely Babylon.js side effect
}

export default MinecraftTree;
