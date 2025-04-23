import { useEffect, useRef, useMemo } from 'react';
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
import { useBabylonAvatar } from './scene/useBabylonAvatar';
import { useBabylonCamera } from './scene/useBabylonCamera';

export default function BabylonSceneContent({ scene, problemQueue, onAnswerSelected, selectedAvatar }) {
  // --- One-time scene setup: ground, camera, avatar ---
  // These refs persist for the component lifetime
  const groundRef = useRef(null);

  const avatarFile = selectedAvatar?.file;
  
  // Modular avatar loader
  const modelUrl = avatarFile ? `/models/avatars/${avatarFile}` : null;
  const avatarPosition = useMemo(() => new BABYLON.Vector3(0, 0.5, 3), []);
  const { meshes: avatarMeshes, loading: avatarLoading, error: avatarError } = useBabylonAvatar({
    scene,
    modelUrl,
    position: avatarPosition
  });
  console.log('[BabylonSceneContent] Avatar loader called with:', { scene, modelUrl, position: avatarPosition });

  // Modular ground setup
  useEffect(() => {
    if (!scene) return;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1);
    console.log('BabylonSceneContent: scene ready', scene);
    groundRef.current = createGround(scene, { width: 10, height: 10, y: 0 });
    return () => {
      if (groundRef.current) groundRef.current.dispose();
    };
  }, [scene]);

  // Modular camera setup
  const cameraPosition = useMemo(() => new BABYLON.Vector3(0, 0.5, 8), []);
  const cameraTarget = useMemo(() => new BABYLON.Vector3(0, 0.5, 0), []);
  const { camera } = useBabylonCamera({
    scene,
    type: 'ArcRotate',
    position: cameraPosition,
    target: cameraTarget,
    attachControl: true
  });
  useEffect(() => {
    if (scene && camera) scene.activeCamera = camera;
  }, [scene, camera]);


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
