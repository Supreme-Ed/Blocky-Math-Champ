import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/procedural-textures'; // Ensure procedural textures are registered
import { PerlinNoiseProceduralTexture } from '@babylonjs/procedural-textures';
import { createCubePlatform } from '../components/CubePlatform.js';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */
import { loadAvatar } from './AvatarRunner3D';

export default function BabylonSceneContent({ scene, currentProblem, onAnswerSelected, selectedAvatar }) {
  // --- One-time scene setup: ground, camera, avatar ---
  // These refs persist for the component lifetime
  const groundRef = useRef(null);
  const cameraRef = useRef(null);
  const avatarCleanupRef = useRef(null);
  const avatarFile = selectedAvatar?.file;

  // One-time setup effect (ground, camera, avatar)
  useEffect(() => {
    if (!scene) return;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1);
    console.log('BabylonSceneContent: scene ready', scene);

    // Ground
    groundRef.current = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
    groundRef.current.position.y = 0;

    // Apply sand-like procedural texture using Perlin noise
    const sandTexture = new PerlinNoiseProceduralTexture('sandNoise', 256, scene);
    sandTexture.octaves = 6;
    sandTexture.persistence = 0.8;
    sandTexture.brightness = 0.3;
    sandTexture.uScale = 10;
    sandTexture.vScale = 10;
    const groundMat = new BABYLON.StandardMaterial('groundMaterial', scene);
    groundMat.diffuseTexture = sandTexture;
    groundMat.diffuseColor = new BABYLON.Color3(0.93, 0.84, 0.69);
    groundMat.specularColor = new BABYLON.Color3(0, 0, 0);
    groundRef.current.material = groundMat;

    // Camera
    while (scene.cameras.length) {
      scene.cameras[0].dispose();
      scene.cameras.splice(0, 1);
    }
    cameraRef.current = new BABYLON.ArcRotateCamera(
      'RunnerCamera',
      Math.PI / 2,
      Math.PI / 3,
      8,
      new BABYLON.Vector3(0, 0.5, 0),
      scene
    );
    cameraRef.current.setTarget(new BABYLON.Vector3(0, 0.5, 0));
    cameraRef.current.attachControl(scene.getEngine().getRenderingCanvas(), true);
    scene.activeCamera = cameraRef.current;

    // Avatar loader
    let avatarMeshes = [];
    avatarCleanupRef.current = () => avatarMeshes.forEach(mesh => mesh.dispose());
    (async () => {
      if (avatarFile) {
        const modelUrl = `/models/avatars/${avatarFile}`;
        try {
          const { meshes } = await loadAvatar({
            scene,
            modelUrl,
            position: new BABYLON.Vector3(0, 0.5, 3),
          });
          meshes.forEach(mesh => {
            if (mesh.material && mesh.material.diffuseTexture) {
              mesh.material.diffuseTexture.hasAlpha = true;
              mesh.material.needAlphaTesting = () => true;
              mesh.material.alphaCutOff = 0.5;
            }
          });
          avatarMeshes = meshes;
        } catch (err) {
          console.error('Failed to load avatar:', err);
        }
      } else {
        console.warn('BabylonSceneContent: No selectedAvatar or file provided.');
      }
    })();

    // Cleanup on unmount or avatar change
    return () => {
      if (avatarCleanupRef.current) avatarCleanupRef.current();
      if (groundRef.current) groundRef.current.dispose();
      if (cameraRef.current) cameraRef.current.dispose();
    };
  }, [scene, avatarFile]);

  // --- Per-problem answer cube effect ---
  // Register pointer observer only once per scene
  useEffect(() => {
    if (!scene) return;
    const observer = scene.onPointerObservable.add((pointerInfo) => {
      console.warn('[BabylonSceneContent] onPointerObservable event:', pointerInfo);
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
        const pickInfo = pointerInfo.pickInfo;
        if (pickInfo?.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.metadata && pickInfo.pickedMesh.metadata.answer !== undefined) {
          onAnswerSelected?.(pickInfo.pickedMesh.metadata.answer);
        }
      }
    });
    return () => {
      if (scene && observer) {
        scene.onPointerObservable.remove(observer);
      }
    };
  }, [scene, onAnswerSelected]);

  useEffect(() => {
    if (!scene || !currentProblem || !Array.isArray(currentProblem.choices)) return;
    const prevCubes = window.demoCubes && Array.isArray(window.demoCubes) ? window.demoCubes : [];

    // Add granular logging to Babylon render loop to trace mesh presence per frame
    let lastMeshNames = '';
    const renderLoopLogger = () => {
      if (scene && scene.meshes) {
        const meshNames = scene.meshes.map(m => m.name || m.id).join(',');
        if (meshNames !== lastMeshNames) {
          console.debug('[BabylonSceneContent] [RenderLoop] Meshes:', scene.meshes.map(m => m.name || m.id));
          if (scene.meshes.length < 3) {
            console.warn('[BabylonSceneContent] [RenderLoop] WARNING: Mesh count dropped below 3:', scene.meshes.map(m => m.name || m.id));
          }
          lastMeshNames = meshNames;
        }
      }
    };
    scene.onAfterRenderObservable.add(renderLoopLogger);
    (async () => {
      // Modular helper for updating answer cubes
      // Modular helper for updating answer cubes without blanking the scene
      // Modular helper to update answer cubes without blanking, using readiness check
      async function updateAnswerCubesNoBlank({ scene, currentProblem, prevCubes }) {
        console.warn('[updateAnswerCubesNoBlank] Called. prevCubes length:', prevCubes?.length);
        const cubes = [];
        const blockTypes = ['grass', 'stone', 'wood', 'sand'];
        // 1. Create new cubes (do NOT touch old cubes yet)
        for (let i = 0; i < currentProblem.choices.length; i++) {
          try {
            const cube = await createCubePlatform({
              scene,
              blockTypeId: blockTypes[i % blockTypes.length],
              answer: currentProblem.choices[i],
              position: { x: i * 1.2 - (currentProblem.choices.length-1)*0.6, y: 0.5, z: 0 },
              size: 0.5,
            });
            cube.rotation = new BABYLON.Vector3(0, 0, Math.PI);
            cube.visibility = 0;
            cubes.push(cube);
          } catch (err) {
            console.error(`Failed to create cube ${i}:`, err);
          }
        }
        window.demoCubes = cubes;
        // Debug: log all mesh names after new cubes are added
        if (scene) {
          console.warn('[BabylonSceneContent] Meshes after adding new cubes:', scene.meshes.map(m => m.name || m.id));
        }
        // Debug: log cube visibility/material/texture after creation
        cubes.forEach(cube => {
          let texReady = cube.material && cube.material.diffuseTexture && cube.material.diffuseTexture.isReady ? cube.material.diffuseTexture.isReady() : 'n/a';
          console.warn('[BabylonSceneContent] Cube after creation:', {
            name: cube.name || cube.id,
            isVisible: cube.isVisible,
            hasMaterial: !!cube.material,
            textureReady: texReady
          });
        });
        // 2. Wait until all new cubes are ready/visible in the scene
        const allReady = () => cubes.every(cube => cube.isReady && (typeof cube.isReady === 'function' ? cube.isReady() : true));
        let waited = 0;
        while (!allReady() && waited < 500) { // Wait max 500ms
          await new Promise(res => setTimeout(res, 8));
          waited += 8;
        }
        // Debug: log all mesh names after readiness check
        if (scene) {
          console.warn('[BabylonSceneContent] Meshes after readiness check:', scene.meshes.map(m => m.name || m.id));
        }
        // Debug: log cube visibility/material/texture after readiness check
        cubes.forEach(cube => {
          let texReady = cube.material && cube.material.diffuseTexture && cube.material.diffuseTexture.isReady ? cube.material.diffuseTexture.isReady() : 'n/a';
          console.warn('[BabylonSceneContent] Cube after readiness check:', {
            name: cube.name || cube.id,
            isVisible: cube.isVisible,
            hasMaterial: !!cube.material,
            textureReady: texReady
          });
        });
        // 2.5. Wait for at least one Babylon render frame with both old and new cubes visible
        await new Promise(resolve => {
          if (!scene) return resolve();
          let rendered = false;
          const cb = () => {
            if (!rendered) {
              rendered = true;
              scene.onAfterRenderObservable.removeCallback(cb);
              resolve();
            }
          };
          scene.onAfterRenderObservable.add(cb);
        });
        // Helper: cross-fade mesh visibility
        function animateMeshVisibility(mesh, from, to, speed = 1) {
          return new Promise(resolve => {
            if (!mesh) return resolve();
            const anim = new BABYLON.Animation(`visAnim_${mesh.name}`, 'visibility', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
            anim.setKeys([{ frame: 0, value: from }, { frame: 60, value: to }]);
            mesh.animations = [anim];
            scene.beginAnimation(mesh, 0, 60, false, speed, () => resolve());
          });
        }
        // 3. Starting cross-fade new and old cubes
        console.warn('[updateAnswerCubesNoBlank] Starting cross-fade. New cubes:', cubes.length, 'Old cubes:', prevCubes?.length);
        const fadePromises = [];
        const animationSpeed = 1; // seconds
        cubes.forEach(cube => fadePromises.push(animateMeshVisibility(cube, 0, 1, animationSpeed)));
        if (prevCubes && prevCubes.length > 0) {
          prevCubes.forEach(oldCube => fadePromises.push(animateMeshVisibility(oldCube, 1, 0, animationSpeed)));
        }
        await Promise.all(fadePromises);
        console.warn('[updateAnswerCubesNoBlank] Cross-fade complete.');
        // 4. Dispose old cubes after fade-out
        if (prevCubes && prevCubes.length > 0) {
          prevCubes.forEach(cube => {
            try { cube.dispose(); } catch (err) { console.error('[BabylonSceneContent] Error disposing old cube:', err); }
          });
          console.warn('[BabylonSceneContent] Meshes after disposing old cubes:', scene.meshes.map(m => m.name || m.id));
        }
      }

      // Call the modular helper
      await updateAnswerCubesNoBlank({ scene, currentProblem, prevCubes });

    })();
  }, [scene, currentProblem]);

  return null;
}

BabylonSceneContent.propTypes = {
  scene: PropTypes.object,
  currentProblem: PropTypes.object,
  onAnswerSelected: PropTypes.func,
  selectedAvatar: PropTypes.shape({
    file: PropTypes.string
  })
};
