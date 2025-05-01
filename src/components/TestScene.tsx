import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import DirectTest from './scene/DirectTest';
// Import the GLTF loader
import '@babylonjs/loaders/glTF';

/**
 * A simple test scene component to verify basic Babylon.js functionality
 */
function TestScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = React.useState<BABYLON.Scene | null>(null);
  
  // Create the Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) return;
    
    console.log("TestScene: Creating engine and scene");
    
    // Create engine
    const engine = new BABYLON.Engine(canvasRef.current, true);
    
    // Create scene
    const newScene = new BABYLON.Scene(engine);
    
    // Create camera
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      newScene
    );
    camera.attachControl(canvasRef.current, true);
    
    console.log("TestScene: Created camera");
    
    // Set scene
    setScene(newScene);
    
    // Start render loop
    engine.runRenderLoop(() => {
      newScene.render();
    });
    
    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      engine.dispose();
    };
  }, []);
  
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {scene && <DirectTest scene={scene} />}
    </div>
  );
}

export default TestScene;
