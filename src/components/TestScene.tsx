import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
// Import the GLTF loader
import '@babylonjs/loaders/glTF';

/**
 * A simple test scene component to verify basic Babylon.js functionality
 */
function TestScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create the Babylon.js engine and scene
  useEffect(() => {
    if (!canvasRef.current) return;

    console.log("TestScene: Creating engine and scene");

    // Create engine
    const engine = new BABYLON.Engine(canvasRef.current, true);

    // Create scene
    const scene = new BABYLON.Scene(engine);

    // Create camera
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 3,
      10,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);

    console.log("TestScene: Created camera");

    // Create a simple test box
    const box = BABYLON.MeshBuilder.CreateBox("testBox", { size: 1 }, scene);
    box.position = new BABYLON.Vector3(0, 0.5, 0);

    const boxMaterial = new BABYLON.StandardMaterial("testBoxMat", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red
    box.material = boxMaterial;

    // Start render loop
    engine.runRenderLoop(() => {
      scene.render();
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
    </div>
  );
}

export default TestScene;
