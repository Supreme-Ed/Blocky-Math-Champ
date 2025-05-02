import { useEffect, useRef, RefObject } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

interface SceneReadyCallback {
  engine: BABYLON.Engine;
  scene: BABYLON.Scene;
  camera: BABYLON.Camera;
  light: BABYLON.Light;
}

interface SceneDisposeCallback {
  engine: BABYLON.Engine | null;
  scene: BABYLON.Scene | null;
}

/**
 * Custom hook for setting up and managing a Babylon.js scene and engine.
 * Handles engine, scene, camera, and light creation, and returns refs for use in components.
 * @param canvasRef - Ref to the canvas element
 * @param onSceneReady - Optional callback after scene setup
 * @param onSceneDispose - Optional cleanup callback
 * @param existingSceneRef - Optional ref to an existing scene
 * @returns Object containing engine and scene refs
 */
export default function useBabylonScene(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onSceneReady?: (params: SceneReadyCallback) => Promise<void> | void,
  onSceneDispose?: (params: SceneDisposeCallback) => void,
  existingSceneRef?: RefObject<BABYLON.Scene | null>
) {
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);

  useEffect(() => {
    let engine: BABYLON.Engine;
    let scene: BABYLON.Scene;

    const run = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Use the same engine options as the working minimal demo
      // This is important for shadow rendering
      // Explicitly set preserveDrawingBuffer and stencil to false
      engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: false });
      engineRef.current = engine;

      console.log("Created Babylon.js engine with minimal options for better shadow compatibility");

      // Use existing scene if provided, otherwise create a new one
      if (existingSceneRef && existingSceneRef.current) {
        scene = existingSceneRef.current;
      } else {
        scene = new BABYLON.Scene(engine);
      }
      sceneRef.current = scene;

      // Example: add a simple camera and light
      const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2, 8, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true);
      const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

      if (typeof onSceneReady === 'function') {
        await onSceneReady({ engine, scene, camera, light });
      }

      let lastCanvasWidth = canvas.width;
      let lastCanvasHeight = canvas.height;
      let lastMeshCount = scene.meshes.length;
      let lastLightCount = scene.lights.length;

      engine.runRenderLoop(() => {
        const meshCount = scene.meshes.length;
        const lightCount = scene.lights.length;

        // Only log if mesh/light count changes, or either drops to zero
        if (meshCount !== lastMeshCount || lightCount !== lastLightCount || meshCount === 0 || lightCount === 0) {
          lastMeshCount = meshCount;
          lastLightCount = lightCount;
        }

        // Detect canvas resize
        if (canvas.width !== lastCanvasWidth || canvas.height !== lastCanvasHeight) {
          lastCanvasWidth = canvas.width;
          lastCanvasHeight = canvas.height;
        }

        if (scene) scene.render();
      });
    };

    run();

    // Add window resize handler to keep engine/canvas in sync
    function handleResize() {
      if (engineRef.current) engineRef.current.resize();
    }
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (typeof onSceneDispose === 'function') {
        onSceneDispose({ engine: engineRef.current, scene: sceneRef.current });
      }
      if (engineRef.current) {
        engineRef.current.stopRenderLoop();
        if (sceneRef.current && !existingSceneRef) sceneRef.current.dispose();
        engineRef.current.dispose();
      }
      engineRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { engineRef, sceneRef };
}
