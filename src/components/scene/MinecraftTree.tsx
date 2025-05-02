import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

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
    let disposed = false;

    // Load the tree model using the same approach as VillagerNPC
    console.log("Loading tree model from /models/trees/Tree.gltf");
    BABYLON.SceneLoader.ImportMesh(
      "",
      "/models/trees/",
      "Tree.gltf",
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        if (disposed) return;

        // Store meshes for cleanup
        treeMeshesRef.current = meshes;

        // Get the root mesh
        const rootMesh = meshes[0];

        // Set position, rotation, and scale
        rootMesh.position = position;
        rootMesh.rotation = new BABYLON.Vector3(0, rotation, 0);

        // Apply scale to the root mesh
        rootMesh.scaling = new BABYLON.Vector3(scale, scale, scale);

        console.log(`Tree loaded at position ${position} with scale ${scale}`);

        // Apply nearest neighbor filtering to all tree textures for Minecraft-like appearance
        // This is the exact same code as in VillagerNPC.tsx
        meshes.forEach(mesh => {
          if (mesh.material) {
            // For PBRMaterial (GLTF)
            const pbrMaterial = mesh.material as BABYLON.PBRMaterial;
            if (pbrMaterial.albedoTexture) {
              pbrMaterial.albedoTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
              pbrMaterial.albedoTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
              pbrMaterial.albedoTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              console.log(`Applied nearest neighbor filtering to ${mesh.name} albedo texture`);
            }

            // For StandardMaterial (if any)
            const standardMaterial = mesh.material as BABYLON.StandardMaterial;
            if (standardMaterial.diffuseTexture) {
              standardMaterial.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
              standardMaterial.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
              standardMaterial.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              console.log(`Applied nearest neighbor filtering to ${mesh.name} diffuse texture`);
            }

            // Apply to all textures in the material
            if (mesh.material.getActiveTextures) {
              mesh.material.getActiveTextures().forEach(texture => {
                texture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              });
            }
          }
        });

        // Do NOT manually add meshes to shadow generator
        // This is already handled by the onNewMeshObservable in BabylonSceneContent.tsx
        console.log("Tree meshes loaded - shadow casting will be handled by BabylonSceneContent.tsx");
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
