import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { ArcRotateCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import { ArcRotateCameraKeyboardMoveInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraKeyboardMoveInput';
import { ArcRotateCameraMouseWheelInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraMouseWheelInput';

/**
 * Modular React hook to manage a Babylon.js camera lifecycle.
 * Supports ArcRotate, Free, Universal, and can be extended.
 * @param {object} params
 * @param {BABYLON.Scene} params.scene - The Babylon.js scene.
 * @param {string} params.type - Camera type ('ArcRotate', 'Free', 'Universal', etc).
 * @param {BABYLON.Vector3} params.position - Camera position.
 * @param {BABYLON.Vector3} params.target - Camera target (if applicable).
 * @param {boolean} [params.attachControl] - Attach controls to canvas.
 * @param {Array} [params.postProcesses] - Optional post-processes to attach.
 * @returns {object} { camera, loading, error }
 */
export function useBabylonCamera({
  scene,
  type = 'ArcRotate',
  position = new BABYLON.Vector3(0, 0.5, 8),
  target = new BABYLON.Vector3(0, 0.5, 0),
  attachControl = true,
  postProcesses = [],
  freeSceneRotation = false,
}) {
  const cameraRef = useRef(null);
  const [camera, setCamera] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!scene) return;
    setLoading(true);
    setError(null);
    // Dispose previous camera
    if (cameraRef.current) {
      if (cameraRef.current.detachControl) {
        cameraRef.current.detachControl();
      }
      cameraRef.current.dispose();
      cameraRef.current = null;
    }
    let camera;
    try {
      switch (type) {
        case 'ArcRotate':
          camera = new BABYLON.ArcRotateCamera(
            'RunnerCamera',
            Math.PI / 2,
            Math.PI / 3,
            position.length(),
            target,
            scene
          );
          camera.setTarget(target);
          break;
        case 'Free':
          camera = new BABYLON.FreeCamera('FreeCamera', position, scene);
          camera.setTarget(target);
          break;
        case 'Universal':
          camera = new BABYLON.UniversalCamera('UniversalCamera', position, scene);
          camera.setTarget(target);
          break;
        default:
          throw new Error(`Unsupported camera type: ${type}`);
      }
      camera.position.copyFrom(position);
      if (attachControl && scene.getEngine && scene.getEngine().getRenderingCanvas) {
        // Set as active camera
        scene.activeCamera = camera;
        // Attach controls if not already attached
        const canvas = scene.getEngine().getRenderingCanvas();
        if (canvas && camera.inputs && !camera.inputs.attachedToElement) {
          camera.attachControl(canvas, true);
        }
      }
      // Attach post-processes if provided
      if (Array.isArray(postProcesses)) {
        postProcesses.forEach(pp => {
          camera.attachPostProcess(pp);
        });
      }
      if (cameraRef.current !== camera) {
        cameraRef.current = camera;
        setCamera(camera);
      }
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
    // Cleanup
    return () => {
      if (cameraRef.current) {
        if (cameraRef.current.detachControl) {
          cameraRef.current.detachControl();
        }
        cameraRef.current.dispose();
        cameraRef.current = null;
      }
    };
    // Only rerun if scene or camera config changes
  }, [scene, type, position, target, attachControl, postProcesses]);

  // Respond to freeSceneRotation changes for ArcRotateCamera
  useEffect(() => {
    if (!camera || !(camera instanceof BABYLON.ArcRotateCamera)) return;

    // Remove all existing input plugins
    if (camera.inputs && camera.inputs.attached) {
      Object.keys(camera.inputs.attached).forEach(key => {
        camera.inputs.attached[key].detachControl();
      });
      camera.inputs.clear();
    }
    // Re-add default ArcRotateCamera input plugins (Babylon.js v5+)
    camera.inputs.add(new ArcRotateCameraPointersInput());
    camera.inputs.add(new ArcRotateCameraKeyboardMoveInput());
    camera.inputs.add(new ArcRotateCameraMouseWheelInput());
    // Re-attach controls to canvas and set as active camera
    if (camera.getEngine && camera.getEngine().getRenderingCanvas && camera.getScene) {
      const canvas = camera.getEngine().getRenderingCanvas();
      const scene = camera.getScene();
      if (scene) scene.activeCamera = camera;
      if (canvas && camera.inputs && !camera.inputs.attachedToElement) {
        camera.attachControl(canvas, true);
      }
    }
    // Set or clear camera limits
    if (freeSceneRotation) {
      camera.upperBetaLimit = null;
      camera.lowerBetaLimit = null;
      camera.upperAlphaLimit = null;
      camera.lowerAlphaLimit = null;
    } else {
      camera.upperBetaLimit = Math.PI / 3;
      camera.lowerBetaLimit = -0.01;
      camera.upperAlphaLimit = Math.PI;
      camera.lowerAlphaLimit = -Math.PI/5;
    }
  }, [freeSceneRotation, camera]);

  return { camera, loading, error };
}
