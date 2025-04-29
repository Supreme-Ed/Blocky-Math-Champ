// Modular AvatarRunner3D: Loads and displays an avatar (OBJ or GLTF), positions it, and exposes animation control (if available)
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export interface AvatarLoadOptions {
  scene: BABYLON.Scene;
  modelUrl: string;
  position?: BABYLON.Vector3;
  onLoaded?: (result: AvatarLoadResult) => void;
}

export interface AvatarLoadResult {
  meshes: BABYLON.AbstractMesh[];
  root: BABYLON.AbstractMesh;
  rootNode: BABYLON.TransformNode | null;
  animationGroups: BABYLON.AnimationGroup[];
}

/**
 * Loads and displays the avatar in the given Babylon.js scene.
 * Supports OBJ and GLTF/GLB. Animation support for GLTF/GLB; OBJ animation must be handled by morph targets or manual keyframes.
 * @param opts - Options for loading the avatar
 * @param opts.scene - Babylon.js scene
 * @param opts.modelUrl - URL to avatar model (OBJ or GLTF)
 * @param opts.position - Where to place the avatar (default: (0,0,0))
 * @param opts.onLoaded - Callback after avatar is loaded
 * @returns Promise resolving to the loaded avatar data
 */
export async function loadAvatar({
  scene,
  modelUrl,
  position = new BABYLON.Vector3(0, 0, 0),
  onLoaded
}: AvatarLoadOptions): Promise<AvatarLoadResult> {
  // Modular Asset Manager approach for loading avatar models
  return new Promise((resolve, reject) => {
    const assetsManager = new BABYLON.AssetsManager(scene);
    const meshTask = assetsManager.addMeshTask(
      "avatarTask",
      "", // all meshes
      "", // rootUrl (empty string)
      modelUrl // full relative path to model
    );

    meshTask.onSuccess = function(task) {
      const meshes = task.loadedMeshes;
      let root = meshes[0];

      // Center at origin and place on ground
      let minY = Number.POSITIVE_INFINITY;
      meshes.forEach(mesh => {
        const bounding = mesh.getBoundingInfo().boundingBox;
        minY = Math.min(minY, bounding.minimumWorld.y);
      });

      // For OBJ files, we need to handle positioning differently than GLTF
      // Check if this is likely an OBJ file (no parent-child relationships)
      const isObjFile = meshes.every(mesh => !mesh.parent);

      if (isObjFile) {
        console.log("Handling OBJ file avatar positioning");
        // For OBJ files, we need to move each mesh individually
        meshes.forEach(mesh => {
          // First adjust Y to bring feet to ground
          const originalY = mesh.position.y;
          mesh.position.y = originalY - minY;

          // Then add the desired position
          mesh.position.x += position.x;
          mesh.position.z += position.z;
        });
      } else {
        console.log("Handling GLTF file avatar positioning");
        // For GLTF files with hierarchy, create a root node
        const rootNode = new BABYLON.TransformNode("avatarRoot", scene);

        // Find the root mesh (usually has no parent)
        const rootMesh = meshes.find(mesh => !mesh.parent) || meshes[0];

        // Set the root node position
        rootNode.position = new BABYLON.Vector3(
          position.x,
          position.y - minY, // Adjust to bring feet to ground
          position.z
        );

        // Make the root mesh a child of our root node
        rootMesh.parent = rootNode;
      }

      // Enable shadow casting for avatar meshes
      // Note: The shadow generator will pick these up automatically via onNewMeshAddedObservable

      // Robust transparency fix for Minecraft-style and GLTF avatars
      meshes.forEach(mesh => {
        if (mesh.material) {
          // StandardMaterial: Minecraft-style skins
          const standardMaterial = mesh.material as BABYLON.StandardMaterial;
          if (standardMaterial.diffuseTexture) {
            standardMaterial.diffuseTexture.hasAlpha = true;
            standardMaterial.needAlphaTesting = () => true;
            standardMaterial.alphaCutOff = 0.1;
            standardMaterial.useAlphaFromDiffuseTexture = true;
            standardMaterial.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            standardMaterial.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            standardMaterial.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

            // Only enforce NEAREST_SAMPLINGMODE and CLAMP_ADDRESSMODE; do NOT replace the texture object to preserve OBJ/MTL mapping
            standardMaterial.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            standardMaterial.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            standardMaterial.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;

            // Robust: enforce texture settings
            if (standardMaterial.diffuseTexture) {
              standardMaterial.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
              standardMaterial.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
              standardMaterial.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            }

            // Optionally: enforce on all active textures
            const getActiveTextures = standardMaterial.getActiveTextures;
            if (typeof getActiveTextures === 'function') {
              getActiveTextures().forEach(tex => {
                if (typeof tex.updateSamplingMode === 'function') {
                  tex.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                }
                tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              });
            }
          }

          // Also enforce for PBRMaterial (GLTF/GLB)
          const pbrMaterial = mesh.material as BABYLON.PBRMaterial;
          if (pbrMaterial.albedoTexture) {
            pbrMaterial.albedoTexture.hasAlpha = true;
            pbrMaterial.needAlphaTesting = () => true;
            pbrMaterial.alphaCutOff = 0.1;
            pbrMaterial.albedoTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            pbrMaterial.albedoTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            pbrMaterial.albedoTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
          }

          // PBRMaterial: GLTF avatars
          if (pbrMaterial.albedoTexture) {
            pbrMaterial.albedoTexture.hasAlpha = true;
            pbrMaterial.needAlphaTesting = () => true;
            pbrMaterial.alphaCutOff = 0.5;
          }
        }
      });

      const animationGroups = task.loadedAnimationGroups;
      // For OBJ files, there's no rootNode
      // We already have isObjFile defined above, so reuse it
      const rootNode = isObjFile ? null : scene.getTransformNodeByName("avatarRoot");
      const result = { meshes, root, rootNode, animationGroups };

      if (onLoaded) onLoaded(result);
      resolve(result);
    };

    meshTask.onError = function(task, message) {
      reject(new Error(`AssetsManager: Mesh load failed: ${message}`));
    };

    assetsManager.load();
  });
}

/**
 * Play a named animation (GLTF/GLB only)
 * @param animationGroups - The animation groups from the loaded avatar
 * @param name - The name of the animation to play
 */
export function playAvatarAnimation(
  animationGroups: BABYLON.AnimationGroup[] | undefined,
  name: string
): void {
  if (!animationGroups) return;
  animationGroups.forEach(group => {
    if (group.name === name) {
      group.start(true);
    } else {
      group.stop();
    }
  });
}

/**
 * Stop all avatar animations
 * @param animationGroups - The animation groups from the loaded avatar
 */
export function stopAllAvatarAnimations(
  animationGroups: BABYLON.AnimationGroup[] | undefined
): void {
  if (!animationGroups) return;
  animationGroups.forEach(group => group.stop());
}
