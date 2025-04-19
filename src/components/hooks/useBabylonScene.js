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

      engine.runRenderLoop(() => {
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
