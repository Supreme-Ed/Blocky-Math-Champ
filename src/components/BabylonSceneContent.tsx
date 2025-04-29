import React, { useEffect, useRef, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import { importSceneLighting } from './scene/Lighting';
import '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraKeyboardMoveInput';
import '@babylonjs/procedural-textures'; // Ensure procedural textures are registered
// Modular ground system
import { createGround } from './scene/Ground';
import { createSkybox } from './scene/Skybox';
import { addBlurESMShadows } from './scene/Shadows';

import useRowManager from '../hooks/useRowManager';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */

import { useBabylonAvatar } from './scene/useBabylonAvatar'; // Used for side effects only
import Inventory from './Inventory';
import { useBabylonCamera } from './scene/useBabylonCamera';
import VillagerNPC from './scene/VillagerNPC';
import { MathProblem, ExtendedMathProblem, Avatar } from '../types/game';

interface BabylonSceneContentProps {
  scene: BABYLON.Scene;
  problemQueue: ExtendedMathProblem[];
  onAnswerSelected: (params: { mesh: BABYLON.AbstractMesh, answer: number | string, blockTypeId: string }) => void;
  selectedAvatar?: Avatar | null;
  resetKey?: string | number;
}

interface VillagerTrigger {
  type: 'yes' | 'no' | null;
  key: number;
}

declare global {
  interface Window {
    babylonScene?: BABYLON.Scene;
    enableFreeSceneRotation?: boolean;
  }
}

export default function BabylonSceneContent({
  scene,
  problemQueue,
  onAnswerSelected,
  selectedAvatar,
  resetKey
}: BabylonSceneContentProps) {
  // --- Villager NPC animation trigger state ---
  const [villagerTrigger, setVillagerTrigger] = React.useState<VillagerTrigger>({ type: null, key: 0 });

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
  const groundRef = useRef<BABYLON.Mesh | null>(null);

  const avatarFile = selectedAvatar?.file;
  // Modular avatar loader
  const modelUrl = avatarFile ? `/models/avatars/${avatarFile}` : null;
  const avatarPosition = useMemo(() => new BABYLON.Vector3(0, 0, 4), []);
  useBabylonAvatar({
    scene,
    modelUrl: modelUrl || '',
    position: avatarPosition
  });

  // Ensure DebugPanel can access the live scene
  // This is required so the debug panel can update the skybox from outside this component.
  // The DebugPanel uses window.babylonScene to access the current Babylon.js scene instance.
  useEffect(() => {
    if (scene) {
      window.babylonScene = scene;
      // Remove the default hemispheric light (named 'light') if present
      scene.lights?.filter(l => l.name === 'light').forEach(l => l.dispose());
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

      // Create a simple flat ground for testing shadows
      const testGround = BABYLON.MeshBuilder.CreateGround("shadowTestGround", {
        width: 20,
        height: 20,
        subdivisions: 1
      }, scene);
      testGround.position.y = 0;

      // Create a simple material for the test ground
      const testGroundMat = new BABYLON.StandardMaterial("testGroundMat", scene);
      testGroundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
      testGroundMat.specularColor = new BABYLON.Color3(0, 0, 0);
      testGround.material = testGroundMat;

      // Enable shadows on the test ground
      testGround.receiveShadows = true;

      // Store the test ground
      groundRef.current = testGround;

      console.log("Created test ground for shadows:", testGround.name);

      // Also create the regular terrain ground
      const width = 2000;
      const height = 2000;
      const terrainGround = createGround(scene, {
        width,
        height,
        y: -0.1, // Slightly below the test ground
        amplitude: 50,      // More natural hills/valleys
        frequency: 0.010,    // More visible terrain features
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
    (scene as any)._skybox = skybox;

    // Add all scene lighting (ambient, sun, sun mesh)
    importSceneLighting(scene);

    // Create a simple shadow test directly in the scene

    // Create a flat plane for shadow testing
    const shadowPlane = BABYLON.MeshBuilder.CreateGround("shadowPlane", { width: 10, height: 10 }, scene);
    shadowPlane.position = new BABYLON.Vector3(0, 0.01, 0); // Slightly above ground to avoid z-fighting
    const planeMaterial = new BABYLON.StandardMaterial("planeMaterial", scene);
    planeMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); // Light gray
    planeMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
    shadowPlane.material = planeMaterial;
    shadowPlane.receiveShadows = true;

    // Create a red box for shadow casting
    const testCube = BABYLON.MeshBuilder.CreateBox("shadowBox", { size: 1 }, scene);
    testCube.position = new BABYLON.Vector3(0, 1, 0); // Position above the plane
    const testMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
    testMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Red color
    testMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
    testCube.material = testMaterial;

    // Create a directional light specifically for shadows
    const shadowLight = new BABYLON.DirectionalLight("shadowLight", new BABYLON.Vector3(0, -1, 0), scene);
    shadowLight.position = new BABYLON.Vector3(0, 10, 0);
    shadowLight.intensity = 0.7;

    // Create a basic shadow generator
    const shadowGen = new BABYLON.ShadowGenerator(1024, shadowLight);
    // Use standard shadow map (no filtering)
    shadowGen.useExponentialShadowMap = false; // Disable exponential shadow map
    shadowGen.useBlurExponentialShadowMap = false; // Disable blur
    shadowGen.useContactHardeningShadow = false; // Disable PCSS
    shadowGen.usePoissonSampling = false; // Disable Poisson sampling
    shadowGen.addShadowCaster(testCube);
    shadowGen.setDarkness(0.7);
    shadowGen.bias = 0.01;

    // Force shadow map to render every frame
    const shadowMap = shadowGen.getShadowMap();
    if (shadowMap) {
      shadowMap.refreshRate = 0; // Render every frame
    }

    // Log shadow setup
    console.log("Shadow test setup:", {
      plane: shadowPlane.name,
      box: testCube.name,
      light: shadowLight.name,
      receiveShadows: shadowPlane.receiveShadows
    });

    // Animate the test cube to verify shadow movement
    let startTime = Date.now();
    scene.registerBeforeRender(() => {
      const elapsedTime = (Date.now() - startTime) / 1000;

      if (testCube) {
        // Rotate the cube
        testCube.rotation.y += 0.01;

        // Also make it hover up and down
        testCube.position.y = 1 + Math.sin(elapsedTime) * 0.5;
      }
    });

    // Debug: We're not using the Babylon.js inspector in this version
    // Uncomment and add proper imports if you want to use the inspector
    /*
    if (BABYLON.Inspector) {
      scene.debugLayer.show({
        embedMode: true,
        overlay: true
      });
    }
    */

    // We're now using our dedicated shadow test objects instead of the sun light
    // Store the shadow generator on scene for later access
    (scene as any)._shadowGenerator = shadowGen;

    // Debug: Log when shadow generator is created
    console.log("Shadow generator created:", shadowGen);

    // Set up automatic shadow casting for new meshes
    scene.onNewMeshAddedObservable.add(mesh => {
      // Skip meshes that shouldn't cast shadows
      if (mesh.name === 'skybox' || mesh.name === 'ground' || mesh.name === 'sunMesh' ||
          mesh.name === 'shadowPlane') {
        return;
      }

      // Add mesh to shadow casters
      shadowGen.addShadowCaster(mesh, true);
      console.log(`Added mesh to shadow casters: ${mesh.name}`);
    });

    return () => {
      if (groundRef.current) groundRef.current.dispose();
      if (skybox) skybox.dispose();
      if ((scene as any)._shadowGenerator) {
        (scene as any)._shadowGenerator.dispose();
        (scene as any)._shadowGenerator = null;
      }
    };
  }, [scene]);

  // Modular camera setup
  // Memoize camera position and target to prevent infinite camera recreation
  const cameraPosition = useMemo(() => new BABYLON.Vector3(0, 0.5, 8), []);
  const cameraTarget = useMemo(() => new BABYLON.Vector3(0, 0.5, 0), []);
  const cameraPostProcesses = useMemo<BABYLON.PostProcess[]>(() => [], []); // Memoized, replace with actual post-processes if used
  const cameraType = 'ArcRotate'; // primitive, always stable
  const [freeSceneRotation, setFreeSceneRotation] = React.useState(!!window.enableFreeSceneRotation);
  React.useEffect(() => {
    function syncFromGlobal() {
      setFreeSceneRotation(!!window.enableFreeSceneRotation);
    }
    window.addEventListener('freeSceneRotationToggled', syncFromGlobal);
    return () => window.removeEventListener('freeSceneRotationToggled', syncFromGlobal);
  }, []);

  useBabylonCamera({
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
    onAnswerSelected: ({ mesh, answer, blockTypeId }) => onAnswerSelected({ mesh, answer, blockTypeId }),
    resetKey: resetKey as number
  });

  return (
    <>
      <VillagerNPC scene={scene} trigger={villagerTrigger} />
      {/* other Babylon scene logic is side effect only */}
      <Inventory />
    </>
  );
}
