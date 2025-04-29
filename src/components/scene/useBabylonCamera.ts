import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { ArcRotateCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import { ArcRotateCameraKeyboardMoveInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraKeyboardMoveInput';
import { ArcRotateCameraMouseWheelInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraMouseWheelInput';

type CameraType = 'ArcRotate' | 'Free' | 'Universal';

interface UseBabylonCameraParams {
  scene: BABYLON.Scene | null;
  type?: CameraType;
  position?: BABYLON.Vector3;
  target?: BABYLON.Vector3;
  attachControl?: boolean;
  postProcesses?: BABYLON.PostProcess[];
  freeSceneRotation?: boolean;
}

interface UseBabylonCameraResult {
  camera: BABYLON.Camera | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Modular React hook to manage a Babylon.js camera lifecycle.
 * Supports ArcRotate, Free, Universal, and can be extended.
 * @param params - Configuration parameters for the camera
 * @param params.scene - The Babylon.js scene
 * @param params.type - Camera type ('ArcRotate', 'Free', 'Universal', etc)
 * @param params.position - Camera position
 * @param params.target - Camera target (if applicable)
 * @param params.attachControl - Attach controls to canvas
 * @param params.postProcesses - Optional post-processes to attach
 * @param params.freeSceneRotation - Allow free rotation of the camera
 * @returns Object containing camera, loading state, and error state
 */
export function useBabylonCamera({
  scene,
  type = 'ArcRotate',
  position = new BABYLON.Vector3(0, 0.5, 8),
  target = new BABYLON.Vector3(0, 0.5, 0),
  attachControl = true,
  postProcesses = [],
  freeSceneRotation = false,
}: UseBabylonCameraParams): UseBabylonCameraResult {
  const cameraRef = useRef<BABYLON.Camera | null>(null);
  const [camera, setCamera] = useState<BABYLON.Camera | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!scene) return;
    setLoading(true);
    setError(null);
    
    // Dispose previous camera
    if (cameraRef.current) {
      if ('detachControl' in cameraRef.current && typeof cameraRef.current.detachControl === 'function') {
        cameraRef.current.detachControl();
      }
      cameraRef.current.dispose();
      cameraRef.current = null;
    }
    
    let newCamera: BABYLON.Camera;
    
    try {
      switch (type) {
        case 'ArcRotate':
          newCamera = new BABYLON.ArcRotateCamera(
            'RunnerCamera',
            Math.PI / 2,
            Math.PI / 3,
            position.length(),
            target,
            scene
          );
          (newCamera as BABYLON.ArcRotateCamera).setTarget(target);
          break;
        case 'Free':
          newCamera = new BABYLON.FreeCamera('FreeCamera', position, scene);
          (newCamera as BABYLON.FreeCamera).setTarget(target);
          break;
        case 'Universal':
          newCamera = new BABYLON.UniversalCamera('UniversalCamera', position, scene);
          (newCamera as BABYLON.UniversalCamera).setTarget(target);
          break;
        default:
          throw new Error(`Unsupported camera type: ${type}`);
      }
      
      newCamera.position.copyFrom(position);
      
      if (attachControl && scene.getEngine && scene.getEngine().getRenderingCanvas) {
        // Set as active camera
        scene.activeCamera = newCamera;
        // Attach controls if not already attached
        const canvas = scene.getEngine().getRenderingCanvas();
        if (canvas && 'inputs' in newCamera && newCamera.inputs && !newCamera.inputs.attachedToElement) {
          newCamera.attachControl(canvas, true);
        }
      }
      
      // Attach post-processes if provided
      if (Array.isArray(postProcesses)) {
        postProcesses.forEach(pp => {
          if ('attachPostProcess' in newCamera && typeof newCamera.attachPostProcess === 'function') {
            newCamera.attachPostProcess(pp);
          }
        });
      }
      
      if (cameraRef.current !== newCamera) {
        cameraRef.current = newCamera;
        setCamera(newCamera);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
    
    // Cleanup
    return () => {
      if (cameraRef.current) {
        if ('detachControl' in cameraRef.current && typeof cameraRef.current.detachControl === 'function') {
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
        const input = camera.inputs.attached[key];
        if (input && typeof input.detachControl === 'function') {
          input.detachControl();
        }
      });
      camera.inputs.clear();
    }
    
    // Re-add default ArcRotateCamera input plugins (Babylon.js v5+)
    camera.inputs.add(new ArcRotateCameraPointersInput());
    camera.inputs.add(new ArcRotateCameraKeyboardMoveInput());
    camera.inputs.add(new ArcRotateCameraMouseWheelInput());
    
    // Re-attach controls to canvas and set as active camera
    if (typeof camera.getEngine === 'function' && typeof camera.getScene === 'function') {
      const engine = camera.getEngine();
      const scene = camera.getScene();
      
      if (engine && typeof engine.getRenderingCanvas === 'function') {
        const canvas = engine.getRenderingCanvas();
        
        if (scene) scene.activeCamera = camera;
        if (canvas && camera.inputs && !camera.inputs.attachedToElement) {
          camera.attachControl(canvas, true);
        }
      }
    }
    
    // Set or clear camera limits
    if (freeSceneRotation) {
      camera.upperBetaLimit = null;
      camera.lowerBetaLimit = null;
      camera.upperAlphaLimit = null;
      camera.lowerAlphaLimit = null;
      camera.lowerRadiusLimit = null;
      camera.upperRadiusLimit = null;
    } else {
      camera.upperBetaLimit = Math.PI / 2.5;
      camera.lowerBetaLimit = -0.01;
      camera.upperAlphaLimit = Math.PI;
      camera.lowerAlphaLimit = -Math.PI/5;
      camera.lowerRadiusLimit = 6; // Prevent zooming in too close
      camera.upperRadiusLimit = 30; // Prevent zooming out too far
    }
  }, [freeSceneRotation, camera]);

  return { camera, loading, error };
}
