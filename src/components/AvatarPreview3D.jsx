// AvatarPreview3D.jsx
// Shows a live Babylon.js 3D preview of a .glb model
import React, { useRef, useEffect } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';

export default function AvatarPreview3D({ modelUrl, selected, onClick }) {
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

    // Camera
    const camera = new BABYLON.ArcRotateCamera('cam', Math.PI / 2, Math.PI / 2.2, 2.2, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, false);
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 3;
    camera.wheelPrecision = 100;
    camera.panningSensibility = 0;
    camera.inputs.removeByType('ArcRotateCameraKeyboardMoveInput');

    // Light
    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);

    // Load model
    BABYLON.SceneLoader.ImportMeshAsync('', modelUrl.substring(0, modelUrl.lastIndexOf('/')+1), modelUrl.substring(modelUrl.lastIndexOf('/')+1), scene).then(result => {
      const { meshes, skeletons, animationGroups } = result;
      console.log('ImportMeshAsync result:', result);
      console.log('Loaded meshes:', meshes, 'for', modelUrl);
      console.log('Skeletons:', skeletons);
      console.log('AnimationGroups:', animationGroups);
      console.log('scene.meshes:', scene.meshes);
      console.log('scene.skeletons:', scene.skeletons);
      console.log('scene.animationGroups:', scene.animationGroups);
      meshes.forEach((mesh, i) => {
        const mat = mesh.material;
        let matInfo = null;
        if (mat) {
          matInfo = {
            name: mat.name,
            alpha: mat.alpha,
            transparencyMode: mat.transparencyMode,
            needAlphaBlending: mat.needAlphaBlending && mat.needAlphaBlending(),
            needAlphaTesting: mat.needAlphaTesting && mat.needAlphaTesting(),
          };
        }
        let bounding = null;
        let vertexCount = null;
        if (mesh.getBoundingInfo) {
          try {
            const b = mesh.getBoundingInfo().boundingBox;
            bounding = {
              min: { x: b.minimumWorld.x, y: b.minimumWorld.y, z: b.minimumWorld.z },
              max: { x: b.maximumWorld.x, y: b.maximumWorld.y, z: b.maximumWorld.z },
            };
          } catch (e) { bounding = 'N/A'; }
        }
        if (mesh.getTotalVertices) {
          try {
            vertexCount = mesh.getTotalVertices();
          } catch (e) { vertexCount = 'N/A'; }
        }
        // Only log mesh info for debugging
        console.log(`Mesh #${i}:`, {
          name: mesh.name,
          position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
          scaling: { x: mesh.scaling.x, y: mesh.scaling.y, z: mesh.scaling.z },
          visibility: mesh.visibility,
          matInfo,
          bounding,
          vertexCount,
        });
      });
      // Color tints for each duck
      const colorMap = {
        'Duck0.gltf': new BABYLON.Color3(1, 0.85, 0.1), // yellow
        'Duck1.gltf': new BABYLON.Color3(1, 0.2, 0.2),   // red
        'Duck2.gltf': new BABYLON.Color3(0.3, 1, 0.3),   // green
      };
      const modelFile = modelUrl.split('/').pop();
      const tint = colorMap[modelFile];
      if (tint) {
        meshes.forEach(mesh => {
          if (mesh.material) {
            if (mesh.material.albedoColor) mesh.material.albedoColor = tint;
            if (mesh.material.diffuseColor) mesh.material.diffuseColor = tint;
          }
        });
      }
      if (meshes && meshes.length > 0) {
        // Compute a bounding box that includes all meshes
        let min = meshes[0].getBoundingInfo().boundingBox.minimumWorld.clone();
        let max = meshes[0].getBoundingInfo().boundingBox.maximumWorld.clone();
        meshes.forEach(mesh => {
          const bounding = mesh.getBoundingInfo().boundingBox;
          min = BABYLON.Vector3.Minimize(min, bounding.minimumWorld);
          max = BABYLON.Vector3.Maximize(max, bounding.maximumWorld);
        });
        const center = min.add(max).scale(0.5);
        const size = max.subtract(min);
        // Scale all meshes so the largest extent fits nicely in the view
        const targetSize = 1.5; // fits in camera view
        const scale = targetSize / Math.max(size.x, size.y, size.z);
        meshes.forEach(mesh => {
          mesh.scaling = new BABYLON.Vector3(scale, scale, scale);
          mesh.position = mesh.position.subtract(center); // recenters
        });
        // Move camera to fit
        camera.target = BABYLON.Vector3.Zero();
        camera.radius = 2.5;
      }
    });

    engine.runRenderLoop(() => {
      if (scene) scene.render();
    });

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [modelUrl]);

  return (
    <div
      style={{
        border: selected ? '3px solid #4f8cff' : '3px solid transparent',
        borderRadius: 12,
        boxShadow: selected ? '0 0 8px #4f8cff' : '0 0 2px #ccc',
        background: '#fff',
        width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 8, cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <canvas ref={canvasRef} width={100} height={100} style={{ background: 'transparent', borderRadius: 10 }} />
    </div>
  );
}
