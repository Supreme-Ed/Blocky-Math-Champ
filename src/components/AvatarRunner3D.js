// Modular AvatarRunner3D: Loads and displays an avatar (OBJ or GLTF), positions it, and exposes animation control (if available)
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

/**
 * Loads and displays the avatar in the given Babylon.js scene.
 * Supports OBJ and GLTF/GLB. Animation support for GLTF/GLB; OBJ animation must be handled by morph targets or manual keyframes.
 * @param {Object} opts
 * @param {BABYLON.Scene} opts.scene - Babylon.js scene
 * @param {string} opts.modelUrl - URL to avatar model (OBJ or GLTF)
 * @param {BABYLON.Vector3} [opts.position] - Where to place the avatar (default: (0,0,0))
 * @param {Function} [opts.onLoaded] - Callback({meshes, root, animationGroups}) after avatar is loaded
 * @returns {Promise<{meshes, root, animationGroups}>}
 */
export async function loadAvatar({ scene, modelUrl, position = new BABYLON.Vector3(0,0,0), onLoaded }) {
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
      meshes.forEach(mesh => {
        mesh.position.y -= minY; // bring feet to y=0
        mesh.position.x = position.x;
        mesh.position.z = position.z;
        // Robust transparency fix for Minecraft-style and GLTF avatars
        if (mesh.material) {
          // StandardMaterial: Minecraft-style skins
          if (mesh.material.diffuseTexture) {
            mesh.material.diffuseTexture.hasAlpha = true;
            mesh.material.needAlphaTesting = () => true;
            mesh.material.alphaCutOff = 0.1;
            mesh.material.useAlphaFromDiffuseTexture = true;
            mesh.material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            mesh.material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            mesh.material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            // Only enforce NEAREST_SAMPLINGMODE and CLAMP_ADDRESSMODE; do NOT replace the texture object to preserve OBJ/MTL mapping
            mesh.material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            mesh.material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            mesh.material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            // Robust: also enforce on texture load (async)
            if (mesh.material.diffuseTexture.onLoadObservable) {
              mesh.material.diffuseTexture.onLoadObservable.addOnce(() => {
                mesh.material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                mesh.material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                mesh.material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              });
            }
            // Optionally: enforce on all active textures
            mesh.material.getActiveTextures?.().forEach(tex => {
              tex.updateSamplingMode?.(BABYLON.Texture.NEAREST_SAMPLINGMODE);
              tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
              tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            });
          }
          // Also enforce for PBRMaterial (GLTF/GLB)
          if (mesh.material.albedoTexture) {
            mesh.material.albedoTexture.hasAlpha = true;
            mesh.material.needAlphaTesting = () => true;
            mesh.material.alphaCutOff = 0.1;
            mesh.material.albedoTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            mesh.material.albedoTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            mesh.material.albedoTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
          }
          // PBRMaterial: GLTF avatars
          if (mesh.material.albedoTexture) {
            mesh.material.albedoTexture.hasAlpha = true;
            mesh.material.needAlphaTesting = () => true;
            mesh.material.alphaCutOff = 0.5;
          }
        }
      });
      const animationGroups = task.loadedAnimationGroups;
      if (onLoaded) onLoaded({ meshes, root, animationGroups });
      resolve({ meshes, root, animationGroups });
    };
    meshTask.onError = function(task, message) {
      reject(new Error(`AssetsManager: Mesh load failed: ${message}`));
    };
    assetsManager.load();
  });
}

/**
 * Play a named animation (GLTF/GLB only)
 * @param {BABYLON.AnimationGroup[]} animationGroups
 * @param {string} name
 */
export function playAvatarAnimation(animationGroups, name) {
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
 * @param {BABYLON.AnimationGroup[]} animationGroups
 */
export function stopAllAvatarAnimations(animationGroups) {
  if (!animationGroups) return;
  animationGroups.forEach(group => group.stop());
}
