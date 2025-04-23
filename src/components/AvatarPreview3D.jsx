// AvatarPreview3D.jsx
//
// Modular 3D Avatar Preview using Babylon.js Asset Manager
// ------------------------------------------------------
// This component renders a live Babylon.js 3D preview of an avatar model (GLTF, OBJ, etc.).
//
// Asset loading is handled using Babylon.js's AssetsManager for maximum modularity:
//   - Each avatar is loaded via a mesh task, which is independent and swappable.
//   - The Asset Manager approach enables progress tracking, error handling, and batching.
//   - This method is robust to future Babylon.js deprecations (SceneLoader) and is recommended for all new modular code.
//   - The asset path is passed as a single relative path (modelUrl) for simplicity and compatibility with Vite/public asset serving.
//
// Benefits:
//   - Models, textures, and other assets can be loaded, swapped, or extended independently.
//   - The code is easy to maintain, test, and extend for additional asset types or loading strategies.
//   - Fully compatible with the project's strict modularity requirements.
//
// Usage:
//   <AvatarPreview3D modelUrl="models/avatars/voxel-characters/Small_Human_1/small_human.obj" />
//   <AvatarPreview3D modelUrl="models/avatars/voxel-characters/Small_Human_1/Small_Human_1.gltf" />
//
// See the component code below for details on the modular Asset Manager implementation.

import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

const AvatarPreview3D = ({ modelUrl, selected, onClick }) => {
  const [debugInfo, setDebugInfo] = React.useState('');

  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;

    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    sceneRef.current = scene;


    // Only use Babylon's default helpers for modularity
    // Camera and lights will be created after model loads

    // Load model using Babylon.js AssetsManager (modular approach)
    const assetsManager = new BABYLON.AssetsManager(scene);
    const meshTask = assetsManager.addMeshTask(
      "avatarTask",
      "", // all meshes
      "", // rootUrl (empty string)
      modelUrl // full relative path to model
    );

    meshTask.onSuccess = function(task) {
      
      setDebugInfo(`meshes: ${task.loadedMeshes.length}`);
      // Enable Minecraft-style transparency: alpha for all avatar materials
      task.loadedMeshes.forEach(mesh => {
        if (mesh.material && mesh.material.diffuseTexture) {
          mesh.material.diffuseTexture.hasAlpha = true;
          mesh.material.needAlphaTesting = () => true;
          mesh.material.alphaCutOff = 0.5; // tweak as needed
        }
      });
      // Frame and light the mesh after load
      scene.createDefaultCameraOrLight(true, true, true);
      if (scene.activeCamera) {
        scene.activeCamera.attachControl(canvas, true);
      }
    };

    meshTask.onError = function(task, message, exception) {
      console.error('AssetsManager: Mesh load failed', message, exception);
      setDebugInfo('Mesh load failed');
    };

    assetsManager.load();

    engine.runRenderLoop(() => {
      if (scene && scene.activeCamera) scene.render();
    });

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [modelUrl]);

  return (
    <div
      onClick={onClick}
      style={{
        width: 100,
        height: 100,
        background: selected ? '#ffe' : 'transparent',
        borderRadius: 10,
        border: selected ? '2px solid #f90' : '1px solid #ccc',
        boxShadow: selected ? '0 0 8px #f90' : 'none',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        style={{ background: 'transparent', borderRadius: 10 }}
      />
      {debugInfo && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          fontSize: 10,
          background: 'rgba(255,255,200,0.8)',
          color: '#222',
          padding: '0 2px',
          textAlign: 'center',
        }}>{debugInfo}</div>
      )}
    </div>
  );
}

AvatarPreview3D.propTypes = {
  modelUrl: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  onClick: PropTypes.func,
};

export default AvatarPreview3D;