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
      {/* Sound Test Panel */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #ccc',
          borderRadius: 12,
          padding: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: 320
        }}
      >
        <h3 style={{marginTop:0}}>Sound Test Panel</h3>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <button onClick={() => soundManager.play('correct')}>Play Default</button>
          <button onClick={() => soundManager.stop('correct')}>Stop</button>
          <button onClick={() => soundManager.mute('correct')}>Mute</button>
          <button onClick={() => soundManager.unmute('correct')}>Unmute</button>
        </div>
        <form style={{display:'flex',flexDirection:'column',gap:4}} onSubmit={e => {e.preventDefault();}}>
          <label style={{fontWeight:'bold'}}>Advanced Play Options:</label>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span>Offset</span>
            <input id="offset" type="number" step={0.1} min="0" style={{width:48}} defaultValue={0} />
            <small style={{color: 'gray'}}>Note: Babylon.js has a limitation where offset values between 0 and 0.1 are not supported.</small>
            <span>Length</span>
            <input id="length" type="number" step={0.1} min="0" style={{width:48}} defaultValue={0} />
            <span>Volume</span>
            <input id="volume" type="number" step={0.1} min="0" max="1" style={{width:48}} defaultValue={1} />
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>

          </div>
          <button style={{marginTop:8}} onClick={() => {
            const offset = parseFloat(document.getElementById('offset').value) || 0;
            const duration = parseFloat(document.getElementById('length').value) || 0;
            const volume = parseFloat(document.getElementById('volume').value);
            soundManager.play('correct', {
              offset,
              duration,
              volume: isNaN(volume) ? undefined : volume
            });
          }}>Play With Options</button>
        </form>
      </div>
    </>
  );
}
