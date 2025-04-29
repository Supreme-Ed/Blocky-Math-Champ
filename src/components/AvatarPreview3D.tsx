// AvatarPreview3D.tsx
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
import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

interface AvatarPreview3DProps {
  modelUrl: string;
  selected?: boolean;
  onClick?: () => void;
}

const AvatarPreview3D: React.FC<AvatarPreview3DProps> = ({ modelUrl, selected, onClick }) => {
  const [debugInfo, setDebugInfo] = React.useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);

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
        if (!mesh.material) return;
        
        // For StandardMaterial (OBJ)
        if ((mesh.material as BABYLON.StandardMaterial).diffuseTexture) {
          const material = mesh.material as BABYLON.StandardMaterial;
          if (material.diffuseTexture) {
            material.diffuseTexture.hasAlpha = true;
            material.needAlphaTesting = () => true;
            material.alphaCutOff = 0.1;
            material.useAlphaFromDiffuseTexture = true;
            material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            if (material.diffuseTexture.onLoadObservable) {
              material.diffuseTexture.onLoadObservable.addOnce(() => {
                if (material.diffuseTexture) {
                  material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                  material.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                  material.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                }
              });
            }
          }
        }
        
        // For PBRMaterial (GLTF)
        if ((mesh.material as BABYLON.PBRMaterial).albedoTexture) {
          const material = mesh.material as BABYLON.PBRMaterial;
          if (material.albedoTexture) {
            material.albedoTexture.hasAlpha = true;
            material.needAlphaTesting = () => true;
            material.alphaCutOff = 0.1;
            material.useAlphaFromAlbedoTexture = true;
            material.albedoTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
            material.albedoTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            material.albedoTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            if (material.albedoTexture.onLoadObservable) {
              material.albedoTexture.onLoadObservable.addOnce(() => {
                if (material.albedoTexture) {
                  material.albedoTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                  material.albedoTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                  material.albedoTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
                }
              });
            }
            
            const activeTextures = material.getActiveTextures?.();
            if (activeTextures) {
              activeTextures.forEach(tex => {
                tex.updateSamplingMode?.(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                tex.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                tex.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              });
            }
          }
        }
        
        // Fallback for materials without textures
        const standardMat = mesh.material as BABYLON.StandardMaterial;
        const pbrMat = mesh.material as BABYLON.PBRMaterial;
        
        if ((!standardMat.diffuseTexture && 'diffuseColor' in mesh.material) || 
            (!pbrMat.albedoTexture && 'albedoColor' in mesh.material)) {
          // Fallback: set a visible color if texture is missing
          if ('diffuseColor' in mesh.material) {
            standardMat.diffuseColor = new BABYLON.Color3(1, 0, 1); // magenta for missing texture
          }
          if ('albedoColor' in mesh.material) {
            pbrMat.albedoColor = new BABYLON.Color3(1, 0, 1); // magenta for missing texture
          }
        }
      });
      
      // Frame and light the mesh after load
      scene.createDefaultCameraOrLight(true, true, true);
      if (scene.activeCamera) {
        scene.activeCamera.attachControl(canvas, true);
      }
    };

    meshTask.onError = function(task, message, exception) {
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
        style={{ background: 'transparent', borderRadius: 10, imageRendering: 'pixelated' }}
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

export default AvatarPreview3D;
