import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';

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
}) {
  const cameraRef = useRef(null);
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
        camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
      }
      // Attach post-processes if provided
      if (Array.isArray(postProcesses)) {
        postProcesses.forEach(pp => {
          camera.attachPostProcess(pp);
        });
      }
      cameraRef.current = camera;
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

  return { camera: cameraRef.current, loading, error };
}
