import React, { useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraKeyboardMoveInput';
import '@babylonjs/procedural-textures'; // Ensure procedural textures are registered
// Modular ground system
import { createGround } from './scene/Ground.js';
import { createSkybox } from './scene/Skybox.js';

import useRowManager from '../hooks/useRowManager';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */

import { useBabylonAvatar } from './scene/useBabylonAvatar'; // Used for side effects only
import { useBabylonCamera } from './scene/useBabylonCamera';
import VillagerNPC from './scene/VillagerNPC';

export default function BabylonSceneContent({ scene, problemQueue, onAnswerSelected, selectedAvatar }) {
 
  // --- Villager NPC animation trigger state ---
  const [villagerTrigger, setVillagerTrigger] = React.useState({ type: null, key: 0 });

  // Listen to feedback events and trigger villager animation
  useEffect(() => {
    function handleCorrect() {
      setVillagerTrigger(t => ({ type: 'yes', key: t.key + 1 }));
    }
    function handleWrong() {
      setVillagerTrigger(t => ({ type: 'no', key: t.key + 1 }));
    }
    window.addEventListener('showCorrectFeedback', handleCorrect);
    window.addEventListener('showWrongFeedback', handleWrong);
    return () => {
      window.removeEventListener('showCorrectFeedback', handleCorrect);
      window.removeEventListener('showWrongFeedback', handleWrong);
    };
  }, []);
  
  
  
  // --- One-time scene setup: ground, camera, avatar ---
  // These refs persist for the component lifetime
  const groundRef = useRef(null);

  const avatarFile = selectedAvatar?.file;
  
  // Modular avatar loader
  const modelUrl = avatarFile ? `/models/avatars/${avatarFile}` : null;
  const avatarPosition = useMemo(() => new BABYLON.Vector3(0, 0,4), []);
  useBabylonAvatar({
    scene,
    modelUrl,
    position: avatarPosition
  });
  

  // Ensure DebugPanel can access the live scene
  // This is required so the debug panel can update the skybox from outside this component.
  // The DebugPanel uses window.babylonScene to access the current Babylon.js scene instance.
  useEffect(() => {
    if (scene) {
      window.babylonScene = scene;
    }
  }, [scene]);

  // Modular ground setup
  useEffect(() => {
    if (!scene) return;
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1);


    // Create or update ground mesh to fill screen width
    const updateGround = () => {
      if (groundRef.current) {
        groundRef.current.dispose();
      }
      // Use large ground for infinite illusion
      const width = 2000;
      const height = 2000;
      groundRef.current = createGround(scene, {
        width,
        height,
        y: 0,
        amplitude: 100,      // More natural hills/valleys
        frequency: 0.005,    // More visible terrain features
        subdivisions: 350    // more vertices for detail
      });
    };

    updateGround();

    // Create procedural skybox
    // Note: Due to Babylon.js CloudProceduralTexture quirk, skyColor is the color of the clouds and cloudColor is the background.
    // The debug panel swaps these for correct visual effect (blue sky, white clouds).
    let skybox = createSkybox(scene, {
      diameter: 1000,
      skyColor: new BABYLON.Color3(0.2, 0.35, 0.7), // deeper blue (for background)
      cloudColor: new BABYLON.Color3(0.95, 0.95, 0.95) // slightly off-white (for clouds)
    });
    // Expose for debug panel
    scene._skybox = skybox;

    // --- Add a visible sun (directional light) ---
    // Add subtle ambient light (hemispheric, low intensity)
    const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemiLight.intensity = 0.15; // much lower ambient fill
    hemiLight.diffuse = new BABYLON.Color3(0.7, 0.8, 1.0);
    hemiLight.groundColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    hemiLight.specular = new BABYLON.Color3(0, 0, 0);

    // Move sun more to the west and lower in the sky
    const sunDirection = new BABYLON.Vector3(-2, -1, 0).normalize();
    const sunLight = new BABYLON.DirectionalLight("sunLight", sunDirection, scene);
    sunLight.position = new BABYLON.Vector3(-150, 60, 0); // westward, not overhead
    sunLight.intensity = 2.2;
    sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.8); // warm sunlight
    sunLight.specular = new BABYLON.Color3(1, 1, 0.9);
    sunLight.shadowMinZ = 1;
    sunLight.shadowMaxZ = 5000;
    sunLight.autoCalcShadowZBounds = true;

    // Create a visible sun sphere
    const sunMesh = BABYLON.MeshBuilder.CreateSphere("sunMesh", {diameter: 12}, scene);
    sunMesh.position = sunLight.position;
    const sunMat = new BABYLON.StandardMaterial("sunMat", scene);
    sunMat.emissiveColor = new BABYLON.Color3(1, 0.95, 0.6);
    sunMat.diffuseColor = new BABYLON.Color3(1, 1, 0.6);
    sunMat.specularColor = new BABYLON.Color3(0, 0, 0);
    sunMat.disableLighting = true;
    sunMesh.material = sunMat;
    sunMesh.isPickable = false;
    sunMesh.alwaysSelectAsActiveMesh = true;

    return () => {
      if (groundRef.current) groundRef.current.dispose();
      if (skybox) skybox.dispose();
    };
  }, [scene]);

  // Modular camera setup
  // Memoize camera position and target to prevent infinite camera recreation
  const cameraPosition = useMemo(() => new BABYLON.Vector3(0, 0.5, 8), []);
  const cameraTarget = useMemo(() => new BABYLON.Vector3(0, 0.5, 0), []);
  const cameraPostProcesses = useMemo(() => [], []); // Memoized, replace with actual post-processes if used
  const cameraType = 'ArcRotate'; // primitive, always stable
  const [freeSceneRotation, setFreeSceneRotation] = React.useState(!!window.enableFreeSceneRotation);
  React.useEffect(() => {
    function syncFromGlobal() {
      setFreeSceneRotation(!!window.enableFreeSceneRotation);
    }
    window.addEventListener('freeSceneRotationToggled', syncFromGlobal);
    return () => window.removeEventListener('freeSceneRotationToggled', syncFromGlobal);
  }, []);

  const { camera } = useBabylonCamera({
    scene,
    type: cameraType,
    position: cameraPosition,
    target: cameraTarget,
    attachControl: true,
    postProcesses: cameraPostProcesses,
    freeSceneRotation
  });

  // Manage multi-row answer rows
  useRowManager({
    scene,
    problemQueue,
    onAnswerSelected: ({ mesh, answer, blockTypeId }) => onAnswerSelected({ mesh, answer, blockTypeId })
  });

  return (
    <>
      <VillagerNPC scene={scene} trigger={villagerTrigger} />
      {/* other Babylon scene logic is side effect only */}
    </>
  );
}

BabylonSceneContent.propTypes = {
  scene: PropTypes.object.isRequired,
  problemQueue: PropTypes.array.isRequired,
  onAnswerSelected: PropTypes.func.isRequired,
  selectedAvatar: PropTypes.shape({ file: PropTypes.string }),
};
