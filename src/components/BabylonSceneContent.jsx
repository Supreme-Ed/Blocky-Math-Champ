import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/procedural-textures'; // Ensure procedural textures are registered
// Modular ground system
import { createGround } from './scene/Ground.js';
import { createCubePlatform } from '../components/CubePlatform.js';
import useRowManager from '../hooks/useRowManager';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */
import { loadAvatar } from './AvatarRunner3D';

export default function BabylonSceneContent({ scene, problemQueue, onAnswerSelected, selectedAvatar }) {
  // --- One-time scene setup: ground, camera, avatar ---
  // These refs persist for the component lifetime
  const groundRef = useRef(null);
  const cameraRef = useRef(null);
  const avatarCleanupRef = useRef(null);
  const avatarFile = selectedAvatar?.file;

  // One-time setup effect (ground, camera, avatar)
  useEffect(() => {
    if (!scene) return;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1);
    console.log('BabylonSceneContent: scene ready', scene);

    // Modular Ground
    groundRef.current = createGround(scene, { width: 10, height: 10, y: 0 });

    // Camera
    while (scene.cameras.length) {
      scene.cameras[0].dispose();
      scene.cameras.splice(0, 1);
    }
    cameraRef.current = new BABYLON.ArcRotateCamera(
      'RunnerCamera',
      Math.PI / 2,
      Math.PI / 3,
      8,
      new BABYLON.Vector3(0, 0.5, 0),
      scene
    );
    cameraRef.current.setTarget(new BABYLON.Vector3(0, 0.5, 0));
    cameraRef.current.attachControl(scene.getEngine().getRenderingCanvas(), true);
    scene.activeCamera = cameraRef.current;

    // Avatar loader
    let avatarMeshes = [];
    avatarCleanupRef.current = () => avatarMeshes.forEach(mesh => mesh.dispose());
    (async () => {
      if (avatarFile) {
        const modelUrl = `/models/avatars/${avatarFile}`;
        try {
          const { meshes } = await loadAvatar({
            scene,
            modelUrl,
            position: new BABYLON.Vector3(0, 0.5, 3),
          });
          meshes.forEach(mesh => {
            if (mesh.material && mesh.material.diffuseTexture) {
              mesh.material.diffuseTexture.hasAlpha = true;
              mesh.material.needAlphaTesting = () => true;
              mesh.material.alphaCutOff = 0.5;
            }
          });
          avatarMeshes = meshes;
        } catch (err) {
          console.error('Failed to load avatar:', err);
        }
      } else {
        console.warn('BabylonSceneContent: No selectedAvatar or file provided.');
      }
    })();

    // Cleanup on unmount or avatar change
    return () => {
      if (avatarCleanupRef.current) avatarCleanupRef.current();
      if (groundRef.current) groundRef.current.dispose();
      if (cameraRef.current) cameraRef.current.dispose();
    };
  }, [scene, avatarFile]);

  // Manage multi-row answer rows
  useRowManager({ scene, problemQueue, onAnswerSelected });

  return null;
}

BabylonSceneContent.propTypes = {
  scene: PropTypes.object.isRequired,
  problemQueue: PropTypes.array.isRequired,
  onAnswerSelected: PropTypes.func.isRequired,
  selectedAvatar: PropTypes.shape({ file: PropTypes.string }),
};
