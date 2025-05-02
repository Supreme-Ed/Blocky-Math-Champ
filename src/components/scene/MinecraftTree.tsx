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

        // Log all meshes to understand the structure
        console.log("MinecraftTree: All meshes:", meshes.map(m => ({
          name: m.name,
          id: m.id,
          hasParent: !!m.parent,
          parentName: m.parent?.name || "none",
          hasMaterial: !!m.material,
          materialName: m.material?.name || "none",
          materialType: m.material ? m.material.getClassName() : "none",
          isVisible: m.isVisible
        })));

        // Get the root mesh
        const rootMesh = meshes[0];

        // Ensure all meshes are visible
        meshes.forEach(mesh => {
          mesh.isVisible = true;

          // Check if mesh has a material and ensure it's properly set up
          if (mesh.material) {
            // Log material details for debugging
            console.log(`Material for mesh ${mesh.name}:`, {
              materialName: mesh.material.name,
              materialType: mesh.material.getClassName(),
              hasTexture: !!(mesh.material as any).diffuseTexture,
              isVisible: mesh.isVisible
            });

            // Handle different material types
            if (mesh.material.getClassName() === 'StandardMaterial') {
              const material = mesh.material as BABYLON.StandardMaterial;
              if (material.diffuseTexture) {
                // Ensure textures use nearest neighbor filtering for pixelated look
                material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST);
                material.diffuseTexture.hasAlpha = true;
                material.useAlphaFromDiffuseTexture = true;
                material.backFaceCulling = false;
                material.needDepthPrePass = false;
              }
            } else if (mesh.material.getClassName() === 'PBRMaterial') {
              const material = mesh.material as BABYLON.PBRMaterial;
              if (material.albedoTexture) {
                // Ensure textures use nearest neighbor filtering for pixelated look
                material.albedoTexture.updateSamplingMode(BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST);
                material.albedoTexture.hasAlpha = true;
                material.useAlphaFromAlbedoTexture = true;
                material.backFaceCulling = false;
                material.transparencyMode = BABYLON.PBRMaterial.PBRMATERIAL_ALPHABLEND;
              }
            }
          }
        });

        // Set position, scale, and rotation for the root mesh
        rootMesh.position = position;
        rootMesh.rotation = new BABYLON.Vector3(0, rotation, 0);

        // Apply scale to ALL meshes in the tree to ensure leaves are properly scaled
        meshes.forEach(mesh => {
          mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
        });

        // Log the scale for debugging
        console.log(`MinecraftTree: Applied scale ${scale} to all tree meshes at position ${position}`);

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
