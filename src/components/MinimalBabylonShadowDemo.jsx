import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Materials/standardMaterial';

export default function MinimalBabylonShadowDemo() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = new BABYLON.Engine(canvas, true);
    engineRef.current = engine;
    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    // Camera
    const camera = new BABYLON.ArcRotateCamera('camera', Math.PI/2, Math.PI/3, 10, new BABYLON.Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    // Light
    const light = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
    light.position = new BABYLON.Vector3(5, 15, 5);
    light.intensity = 1.0;

    // Shadow Generator
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.useKernelBlur = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.bias = 0.0005;

    // Ground
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
    ground.position.y = 0;
    ground.receiveShadows = true;
    const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.6, 1, 0.6);
    ground.material = groundMat;

    // Box (shadow caster)
    const box = BABYLON.MeshBuilder.CreateBox('box', { size: 2 }, scene);
    box.position = new BABYLON.Vector3(0, 1, 0);
    const boxMat = new BABYLON.StandardMaterial('boxMat', scene);
    boxMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
    box.material = boxMat;
    shadowGenerator.addShadowCaster(box);

    // Animate box
    scene.registerBeforeRender(() => {
      box.rotation.y += 0.01;
    });

    engine.runRenderLoop(() => {
      scene.render();
    });
    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ width: '100vw', height: '60vh', display: 'block', border: '2px solid #333' }} />
  );
}
