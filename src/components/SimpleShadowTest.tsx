import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';

export default function SimpleShadowTest() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const [shadowInfo, setShadowInfo] = useState<string>('Initializing...');
  const [shadowVisible, setShadowVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create engine with NO additional options to match the minimal demo
    const engine = new BABYLON.Engine(canvas, true);
    engineRef.current = engine;

    // Create a fresh scene
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    // Set a clear background color
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.2, 1);

    // Camera - match the minimal demo exactly
    const camera = new BABYLON.ArcRotateCamera('camera', Math.PI/2, Math.PI/3, 10, new BABYLON.Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    // Light - match the minimal demo exactly
    const light = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
    light.position = new BABYLON.Vector3(5, 15, 5);
    light.intensity = 1.0;

    // Shadow Generator - match the minimal demo exactly
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.bias = 0.0005;

    // Try enabling transparent shadows
    shadowGenerator.transparencyShadow = true;

    // Ground - match the minimal demo exactly
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
    ground.position.y = 0;
    ground.receiveShadows = true;
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.6, 1, 0.6);
    ground.material = groundMat;

    // Box (shadow caster) - match the minimal demo exactly
    const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, scene);
    box.position = new BABYLON.Vector3(0, 1, 0);
    const boxMat = new BABYLON.StandardMaterial('boxMat', scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
    box.material = boxMat;
    shadowGenerator.addShadowCaster(box);

    // Add a sphere for additional testing
    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 1.5 }, scene);
    sphere.position = new BABYLON.Vector3(3, 1, 0);
    const sphereMat = new BABYLON.StandardMaterial('sphereMat', scene);
    sphereMat.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5);
    sphere.material = sphereMat;
    shadowGenerator.addShadowCaster(sphere);

    // Animate objects
    let time = 0;
    scene.registerBeforeRender(() => {
      time += engine.getDeltaTime() / 1000;
      box.rotation.y += 0.01;
      sphere.position.y = 1 + Math.sin(time) * 0.5;
    });

    // Explicitly run the render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Debug logging
    console.log("SimpleShadowTest initialized with:", {
      engine: engine,
      scene: scene,
      light: light,
      shadowGenerator: shadowGenerator,
      ground: {
        name: ground.name,
        receiveShadows: ground.receiveShadows
      }
    });

    // Check if shadows are visible by analyzing the shadow map
    setTimeout(() => {
      try {
        const shadowMap = shadowGenerator.getShadowMap();
        if (shadowMap && shadowMap.renderList && shadowMap.renderList.length > 0) {
          // Get WebGL capabilities
          const caps = engine.getCaps();

          // Update shadow info
          setShadowInfo(`
            Shadow Map Size: ${shadowGenerator.getShadowMap()?.getSize().width}x${shadowGenerator.getShadowMap()?.getSize().height}
            Shadow Casters: ${shadowGenerator.getShadowMap()?.renderList.length}
            WebGL Version: ${caps.webGLVersion}
            Max Texture Size: ${caps.maxTextureSize}
            Shadow Sampling Mode: ${shadowGenerator.useBlurExponentialShadowMap ? 'Blur ESM' : 'Standard'}
            Transparent Shadows: ${shadowGenerator.transparencyShadow ? 'Enabled' : 'Disabled'}
          `);

          // Try to determine if shadows are visible
          setShadowVisible(true);
        } else {
          setShadowInfo('Shadow map not properly initialized');
          setShadowVisible(false);
        }
      } catch (error) {
        setShadowInfo(`Error analyzing shadow map: ${error}`);
        setShadowVisible(false);
      }
    }, 1000);

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2>Simple Shadow Test</h2>
      <div style={{ marginBottom: '10px' }}>
        <div style={{
          padding: '5px',
          backgroundColor: shadowVisible === null ? '#ccc' : shadowVisible ? '#d4edda' : '#f8d7da',
          color: shadowVisible === null ? '#333' : shadowVisible ? '#155724' : '#721c24',
          borderRadius: '3px',
          marginBottom: '5px'
        }}>
          Shadow Status: {shadowVisible === null ? 'Checking...' : shadowVisible ? 'Should be visible' : 'Not visible'}
        </div>
        <pre style={{
          fontSize: '12px',
          backgroundColor: '#f5f5f5',
          padding: '10px',
          borderRadius: '3px',
          maxWidth: '800px',
          overflowX: 'auto'
        }}>
          {shadowInfo}
        </pre>
      </div>
      <canvas
        ref={canvasRef}
        style={{
          width: '800px',
          height: '600px',
          display: 'block',
          border: '2px solid #333',
          backgroundColor: '#eee'
        }}
      />
    </div>
  );
}
