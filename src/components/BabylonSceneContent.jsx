import { useEffect } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/procedural-textures'; // Ensure procedural textures are registered
import { createCubePlatform } from '../components/CubePlatform.js';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */
import { loadAvatar } from './AvatarRunner3D';

export default function BabylonSceneContent({ scene, currentProblem, onAnswerSelected, selectedAvatar }) {
  useEffect(() => {
    if (!scene) return;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1); // Blue background for debug
    console.log('BabylonSceneContent: scene ready', scene);

    // Dispose old cubes before creating new ones (modular cleanup)
    if (window.demoCubes && Array.isArray(window.demoCubes)) {
      window.demoCubes.forEach(cube => {
        try { cube.dispose(); } catch (e) { /* ignore */ }
      });
      window.demoCubes = [];
    }

    // Add ground plane
    const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene);
    ground.position.y = 0; // y=0 is ground level
    console.log('Ground created', ground);

    // Set up runner-style camera
    // Remove any existing cameras
    while (scene.cameras.length) {
      scene.cameras[0].dispose();
      scene.cameras.splice(0, 1);
    }
    // Create ArcRotateCamera from above and behind, angled down
    const camera = new BABYLON.ArcRotateCamera(
      'RunnerCamera',
      Math.PI / 2, // alpha (left/right)
      Math.PI / 3, // beta (vertical angle, < PI/2 looks down)
      8, // radius (distance from center)
      new BABYLON.Vector3(0, 0.5, 0), // target (center of ground)
      scene
    );
    camera.setTarget(new BABYLON.Vector3(0, 0.5, 0));
    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);
    scene.activeCamera = camera;

    // --- Modular Avatar Loading ---
    let avatarMeshes = [];
    let avatarCleanup = null;
    console.log('BabylonSceneContent: selectedAvatar', selectedAvatar);
    (async () => {
      if (selectedAvatar && selectedAvatar.file) {
        const modelUrl = `/models/avatars/${selectedAvatar.file}`;
        console.log('BabylonSceneContent: Attempting to load model', modelUrl);
        try {
          const { meshes } = await loadAvatar({
            scene,
            modelUrl,
            position: new BABYLON.Vector3(0, 0.5, 3), // Place at bottom center, closer to camera, positive Z for foreground
          });
          // The new loadAvatar now uses the Asset Manager for modularity
          console.log('BabylonSceneContent: Avatar loaded', meshes);
          avatarMeshes = meshes;
          avatarCleanup = () => {
            avatarMeshes.forEach(mesh => { try { mesh.dispose(); } catch (e) {} });
            avatarMeshes = [];
          };
        } catch (err) {
          console.error('Failed to load avatar:', err);
          // Add a placeholder mesh for debugging
          const placeholder = BABYLON.MeshBuilder.CreateBox('avatarPlaceholder', { size: 1 }, scene);
          placeholder.position = new BABYLON.Vector3(0, 0.5, -3);
          avatarMeshes = [placeholder];
          avatarCleanup = () => {
            avatarMeshes.forEach(mesh => { try { mesh.dispose(); } catch (e) {} });
            avatarMeshes = [];
          };
        }
      } else {
        console.warn('BabylonSceneContent: No selectedAvatar or file provided.');
      }
    })();

    // Render cubes for currentProblem.choices (if available)
    let pointerObserver = null;
    (async () => {
      try {
        if (!currentProblem || !Array.isArray(currentProblem.choices)) return;
        const cubes = [];
        // If you want to vary block types per problem, you can map them here; for now, cycle through available block types
        const blockTypes = ['grass', 'stone', 'wood', 'sand'];
        for (let i = 0; i < currentProblem.choices.length; i++) {
          try {
            const cube = await createCubePlatform({
              scene,
              blockTypeId: blockTypes[i % blockTypes.length],
              answer: currentProblem.choices[i],
              position: { x: i * 1.2 - (currentProblem.choices.length-1)*0.6, y: 0.5, z: 0 },
              size: 0.5,
            });
            // Rotate the cube so the right face (face 0, with the answer) is facing the camera and upright
            // Try rotation around z-axis by Math.PI to flip the text upright if needed
            cube.rotation = new BABYLON.Vector3(0, 0, Math.PI);
            cubes.push(cube);
          } catch (err) {
            console.error(`Failed to create cube ${i}:`, err);
          }
        }
        window.demoCubes = cubes;

        // Register pointer event for picking cubes
        if (pointerObserver) {
          scene.onPointerObservable.remove(pointerObserver);
        }
        pointerObserver = scene.onPointerObservable.add((pointerInfo) => {
          if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
            const pickInfo = pointerInfo.pickInfo;
            if (pickInfo?.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.metadata && pickInfo.pickedMesh.metadata.answer !== undefined) {
              const answer = pickInfo.pickedMesh.metadata.answer;
              if (typeof onAnswerSelected === 'function') {
                onAnswerSelected(answer);
              }
            }
          }
        }, BABYLON.PointerEventTypes.POINTERPICK);

      } catch (err) {
        console.error('Error creating cubes:', err);
      }
    })();

    return () => {
      // Modular cleanup: Dispose cubes, avatar, and ground
      if (window.demoCubes && Array.isArray(window.demoCubes)) {
        window.demoCubes.forEach(cube => {
          try { cube.dispose(); } catch (e) { /* ignore */ }
        });
        window.demoCubes = [];
      }
      if (avatarCleanup) avatarCleanup();
      if (pointerObserver) {
        scene.onPointerObservable.remove(pointerObserver);
      }
      ground.dispose();
    };

  }, [scene, currentProblem, onAnswerSelected]); // <-- add currentProblem for updates

  return null; // This is a logic-only component
}

BabylonSceneContent.propTypes = {
  scene: PropTypes.object,
  currentProblem: PropTypes.object,
  onAnswerSelected: PropTypes.func,
};
