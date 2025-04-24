import { useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraKeyboardMoveInput';
import '@babylonjs/procedural-textures'; // Ensure procedural textures are registered
// Modular ground system
import { createGround } from './scene/Ground.js';
import { createSkybox } from './scene/Skybox.js';

import useRowManager from '../hooks/useRowManager';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */

import { useBabylonAvatar } from './scene/useBabylonAvatar'; // Used for side effects only
import { useBabylonCamera } from './scene/useBabylonCamera';

export default function BabylonSceneContent({ scene, problemQueue, onAnswerSelected, selectedAvatar }) {
  // --- One-time scene setup: ground, camera, avatar ---
  // These refs persist for the component lifetime
  const groundRef = useRef(null);

  const avatarFile = selectedAvatar?.file;
  
  // Modular avatar loader
  const modelUrl = avatarFile ? `/models/avatars/${avatarFile}` : null;
  const avatarPosition = useMemo(() => new BABYLON.Vector3(0, 0.5, 3), []);
  useBabylonAvatar({
    scene,
    modelUrl,
    position: avatarPosition
  });
  

  // Ensure DebugPanel can access the live scene
  // This is required so the debug panel can update the skybox from outside this component.
  // The DebugPanel uses window.babylonScene to access the current Babylon.js scene instance.
  useEffect(() => {
    if (scene) {
      window.babylonScene = scene;
    }
  }, [scene]);

  // Modular ground setup
  useEffect(() => {
    if (!scene) return;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1);

    groundRef.current = createGround(scene, { width: 10, height: 10, y: 0 });
    // Create procedural skybox
    // Note: Due to Babylon.js CloudProceduralTexture quirk, skyColor is the color of the clouds and cloudColor is the background.
    // The debug panel swaps these for correct visual effect (blue sky, white clouds).
    let skybox = createSkybox(scene, {
      diameter: 1000,
      skyColor: new BABYLON.Color3(0.2, 0.35, 0.7), // deeper blue (for background)
      cloudColor: new BABYLON.Color3(0.95, 0.95, 0.95) // slightly off-white (for clouds)
    });
    // Expose for debug panel
    scene._skybox = skybox;
    return () => {
      if (groundRef.current) groundRef.current.dispose();
      if (skybox) skybox.dispose();
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
    attachControl: true // We'll manage input restrictions below
  });
  useEffect(() => {
    if (scene && camera) {
      scene.activeCamera = camera;
      const canvas = scene.getEngine().getRenderingCanvas();
      // Debug log before attach
      console.log('Babylon attachControl (before)', { camera, canvas, attached: camera.inputs?.attachedToElement });
      // Only attach if not already attached
      // Deep debug: log camera/canvas/cameras
      console.log('Active camera:', scene.activeCamera);
      console.log('All cameras:', scene.cameras);
      console.log('Engine canvas:', scene.getEngine().getRenderingCanvas());
      // Force re-add ArcRotateCamera input plugins
      if (camera && camera.inputs) {
        camera.inputs.clear();
        if (BABYLON.ArcRotateCameraPointersInput) {
          camera.inputs.add(new BABYLON.ArcRotateCameraPointersInput());
        }
        if (BABYLON.ArcRotateCameraKeyboardMoveInput) {
          camera.inputs.add(new BABYLON.ArcRotateCameraKeyboardMoveInput());
        }
        camera.panningSensibility = 1000;
        camera.angularSensibilityX = 1000;
        camera.angularSensibilityY = 1000;
        console.log('Camera inputs forcibly re-added:', camera.inputs.attached, camera.inputs.attachedToElement);
      }
      if (canvas && camera.inputs && !camera.inputs.attachedToElement) {
        camera.attachControl(canvas, true);
        // Log after attach (async)
        setTimeout(() => {
          console.log('Babylon attachControl (after)', { camera, canvas, attached: camera.inputs?.attachedToElement });
          if (camera.inputs) {
            console.log('Camera inputs after timeout:', camera.inputs.attached, camera.inputs.attachedToElement);
          }
        }, 100);
      }
    }
  }, [scene, camera]);

  useEffect(() => {
    const handleFreeSceneRotationToggle = () => {
      if (!camera || !scene) return;
      const canvas = scene.getEngine().getRenderingCanvas();
      if (window.enableFreeSceneRotation) {
        camera.upperBetaLimit = null;
        camera.lowerBetaLimit = null;
        camera.upperAlphaLimit = null;
        camera.lowerAlphaLimit = null;
      } else {
        camera.upperBetaLimit = Math.PI / 2;
        camera.lowerBetaLimit = -Math.PI / 2;
        camera.upperAlphaLimit = Math.PI / 2;
        camera.lowerAlphaLimit = -Math.PI / 2;
      }
    };

    window.addEventListener('freeSceneRotationToggled', handleFreeSceneRotationToggle);
    handleFreeSceneRotationToggle(); // Initialize camera restrictions

    return () => {
      window.removeEventListener('freeSceneRotationToggled', handleFreeSceneRotationToggle);
    };
  }, [camera]);

  // Manage multi-row answer rows
  useRowManager({
    scene,
    problemQueue,
    onAnswerSelected: ({ mesh, answer, blockTypeId }) => onAnswerSelected({ mesh, answer, blockTypeId })
  });

  // DEBUG: Log cloud texture time every frame
  useEffect(() => {
    if (!scene || !scene._skybox || !scene._skybox.material || !scene._skybox.material.emissiveTexture) return;
    const tex = scene._skybox.material.emissiveTexture;
    let running = true;
    function logCloudTime() {
      if (tex && running) {
        // Animation debug logging removed
        requestAnimationFrame(logCloudTime);
      }
    }
    requestAnimationFrame(logCloudTime);
    return () => { running = false; };
  }, [scene]);

  return null;
}

BabylonSceneContent.propTypes = {
  scene: PropTypes.object.isRequired,
  problemQueue: PropTypes.array.isRequired,
  onAnswerSelected: PropTypes.func.isRequired,
  selectedAvatar: PropTypes.shape({ file: PropTypes.string }),
};
