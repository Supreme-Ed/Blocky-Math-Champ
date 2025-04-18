import React, { useRef, useEffect } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import soundManager from '../game/soundManager.js';

export default function MainGame() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      engineRef.current = engine;

      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Preload sounds and ensure audio engine is ready before proceeding
      await soundManager.preload(scene);
      console.log('[MainGame] Audio engine and sounds ready');

      // Example: add a simple camera and light
      const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2, 8, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true);
      const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene);

      engine.runRenderLoop(() => {
        if (scene) scene.render();
      });

      // Cleanup
      return () => {
        engine.stopRenderLoop();
        scene.dispose();
        engine.dispose();
      };
    };
    run();
    // No dependencies: run once on mount
  }, []);

  return (
    <>
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
      <button
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          padding: '12px 24px',
          fontSize: '1.2rem',
          background: '#4caf50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}
        onClick={() => {
          const s = window.soundManager.getSound('correct');
          if (s) {
            s.play();
          } else {
            alert('Sound not found!');
          }
        }}
      >
        Play 'Correct' Sound
      </button>
    </>
  );
}
