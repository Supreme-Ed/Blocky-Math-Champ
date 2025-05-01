import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import './ShadowTest.css';

/**
 * A minimal component to test shadows in Babylon.js
 * This creates a completely isolated scene with just a ground, a box, and a light
 */
export default function ShadowTest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine and scene
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.5, 0.5, 0.5, 1);

    // Create a camera
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvasRef.current, true);

    // Create a light
    const light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -1, 0), scene);
    light.position = new BABYLON.Vector3(0, 5, 0);
    light.intensity = 0.8;

    // Create a ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    ground.receiveShadows = true;
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ground.material = groundMaterial;

    // Create a box
    const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
    box.position.y = 1;
    const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
    boxMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    boxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    box.material = boxMaterial;

    // Create shadow generator with the most basic settings
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);

    // Try PCF shadows (Percentage Closer Filtering)
    shadowGenerator.usePoissonSampling = false;
    shadowGenerator.useExponentialShadowMap = false;
    shadowGenerator.useBlurExponentialShadowMap = false;
    shadowGenerator.usePercentageCloserFiltering = true; // Try PCF instead

    // Enable transparent shadows
    shadowGenerator.transparencyShadow = true;

    // Add the box as shadow caster
    shadowGenerator.addShadowCaster(box);

    // Increase darkness for better visibility
    shadowGenerator.setDarkness(0.8);

    // Adjust bias to prevent shadow acne
    shadowGenerator.bias = 0.01;

    // Force shadow map to render every frame
    const shadowMap = shadowGenerator.getShadowMap();
    if (shadowMap) {
      shadowMap.refreshRate = 0;
    }

    // Log WebGL capabilities
    console.log("WebGL Capabilities:", engine.getCaps());

    // Log shadow setup
    console.log("Shadow Test Setup:", {
      shadowGenerator: shadowGenerator,
      ground: {
        name: ground.name,
        receiveShadows: ground.receiveShadows
      },
      box: box.name,
      light: {
        name: light.name,
        direction: light.direction,
        position: light.position
      }
    });

    // Animate the box
    let time = 0;
    scene.registerBeforeRender(() => {
      time += engine.getDeltaTime() / 1000;
      box.position.y = 1 + Math.sin(time) * 0.5;
      box.rotation.y += 0.01;
    });

    // Start the render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      engine.resize();
    });

    // Cleanup
    return () => {
      engine.dispose();
      scene.dispose();
    };
  }, []);

  return (
    <div className="shadow-test-container">
      <canvas ref={canvasRef} className="shadow-test-canvas" />
    </div>
  );
}
