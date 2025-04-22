import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

/**
 * Custom hook for setting up and managing a Babylon.js scene and engine.
 * Handles engine, scene, camera, and light creation, and returns refs for use in components.
 * @param {React.RefObject} canvasRef - Ref to the canvas element
 * @param {Function} [onSceneReady] - Optional callback after scene setup
 * @param {Function} [onSceneDispose] - Optional cleanup callback
 * @returns {{ engineRef, sceneRef }}
 */
export default function useBabylonScene(canvasRef, onSceneReady, onSceneDispose) {
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    let engine, scene;
    const run = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      engineRef.current = engine;

      scene = new BABYLON.Scene(engine);
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
          console.warn('[BabylonScene] Mesh/Light count changed', {
            meshCount,
            lightCount,
            autoClear: scene.autoClear,
            clearColor: scene.clearColor,
            canvasSize: { width: canvas.width, height: canvas.height }
          });
          lastMeshCount = meshCount;
          lastLightCount = lightCount;
        }
        // Detect canvas resize
        if (canvas.width !== lastCanvasWidth || canvas.height !== lastCanvasHeight) {
          console.warn('[BabylonScene] Canvas resized', { width: canvas.width, height: canvas.height });
          lastCanvasWidth = canvas.width;
          lastCanvasHeight = canvas.height;
        }
        if (scene) scene.render();
      });
    };
    run();

    // Cleanup
    return () => {
      if (typeof onSceneDispose === 'function') {
        onSceneDispose({ engine: engineRef.current, scene: sceneRef.current });
      }
      if (engineRef.current) {
        engineRef.current.stopRenderLoop();
        if (sceneRef.current) sceneRef.current.dispose();
        engineRef.current.dispose();
      }
      engineRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { engineRef, sceneRef };
}
