import React, { useEffect, useRef, useMemo } from 'react'; // Ensure React is imported
import * as BABYLON from '@babylonjs/core';
// Import the inspector
import '@babylonjs/inspector';
// Import shadow generator types if needed (though usually included in core)
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
// import { importSceneLighting } from './scene/Lighting'; // Removed
import '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraKeyboardMoveInput';
// import '@babylonjs/procedural-textures'; // Removed to fix build issue
// Modular ground system
import { createGround } from './scene/Ground'; // Added back
import { createSkybox } from './scene/Skybox'; // Added back
import { createMinimalDemoShadows } from './scene/Shadows';
import useRowManager from '../hooks/useRowManager';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */

import { useBabylonAvatar } from './scene/useBabylonAvatar'; // Added back
import Inventory from './Inventory';
import { useBabylonCamera } from './scene/useBabylonCamera';
import VillagerNPC from './scene/VillagerNPC';
// Unused Tree Components:
// import TreesComponent from './scene/TreesComponent';
// import SingleTree from './scene/SingleTree';
// import SimpleCubes from './scene/SimpleCubes';
// import LargeTree from './scene/LargeTree';
// import TreeDebugger from './scene/TreeDebugger';
// import PrimitiveForest from './scene/PrimitiveForest';
// import GiantTree from './scene/GiantTree';
// import MassiveTree from './scene/MassiveTree';
// import MassiveForest from './scene/MassiveForest';
// import HybridForest from './scene/HybridForest';
// Import the GLTF loader
import '@babylonjs/loaders/glTF';
import type { /* MathProblem, */ ExtendedMathProblem, Avatar } from '../types/game'; // MathProblem unused

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
    shadowGenerator?: BABYLON.ShadowGenerator; // Add shadowGenerator to window for debugging
  }
}

export default function BabylonSceneContent({
  scene,
  problemQueue,
  onAnswerSelected,
  selectedAvatar,
  resetKey
}: BabylonSceneContentProps): React.ReactElement | null { // Changed return type
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
  // const groundRef = useRef<BABYLON.Mesh | null>(null); // No longer storing ref

  const avatarFile = selectedAvatar?.file; // Used
  // Modular avatar loader
  const modelUrl = avatarFile ? `/models/avatars/${avatarFile}` : null; // Used
  const avatarPosition = useMemo(() => new BABYLON.Vector3(0, 0, 4), []); // Used
  // --- Re-enable avatar ---
  useBabylonAvatar({
    scene,
    modelUrl: modelUrl || '',
    position: avatarPosition
  });


  // Ensure DebugPanel can access the live scene
  useEffect(() => {
    if (scene) {
      window.babylonScene = scene;
      // Remove the default hemispheric light (named 'light') if present
      scene.lights?.filter(l => l.name === 'light').forEach(l => l.dispose());
    }
  }, [scene]);


  // --- Scene Setup Effect ---
  useEffect(() => {
    if (!scene) return;
    // const engine = scene.getEngine(); // No longer needed for observer
    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1);

    // Removed engine depth function setting

    // --- Ground Setup (Textured Standard Material) ---
    // Use the modular createGround function
    const ground = createGround(scene);
    ground.receiveShadows = true; // Make the main ground receive shadows
    console.log("Created main ground with TEXTURED StandardMaterial (Nearest Neighbor, No Mipmaps):", ground.name);


    // --- Skybox Setup ---
    const skybox = createSkybox(scene); // Re-enabled skybox



    // --- Shadow Setup (Using Modular Minimal Demo Implementation) ---
    // Create shadows using the modular function from Shadows.ts
    const { shadowLight, shadowGenerator } = createMinimalDemoShadows(
      scene,
      ground,
      [ground.name, "skybox_sphere"] // Removed "villager" to allow it to cast shadows
    );

    // Add shadowGenerator to window for debugging
    window.shadowGenerator = shadowGenerator;

    // --- Add New Mesh Observer ---
    // This observable is triggered when a new mesh is added to the scene
    const onNewMeshObserver = scene.onNewMeshAddedObservable.add((mesh) => {
      // Exclude the ground and skybox from shadow casting
      if (mesh.name !== ground.name && mesh.name !== "skybox_sphere") {
        if (shadowGenerator) {
          try {
            shadowGenerator.addShadowCaster(mesh);
            console.log(`Automatically added mesh to shadow casters: ${mesh.name}`);
          } catch (error) {
            console.error(`Error adding mesh ${mesh.name} to shadow casters:`, error);
          }
        }
      }
    });


    // Removed attempt to force shadow map effect recompile
    // Removed temporary hide/show observers


    // --- Enable Inspector ---
    if (scene.debugLayer) {
      // Handle potential promise from show()
      void scene.debugLayer.show({ // Added void
        embedMode: true,
        overlay: true
      });
    }

    // --- Cleanup ---
    return () => {
      console.log("Cleaning up scene content...");
      // Remove the observers
      if (onNewMeshObserver) {
        scene.onNewMeshAddedObservable.remove(onNewMeshObserver);
        console.log("Removed onNewMeshAddedObservable observer.");
      }
      // Remove shadow map render observers (removed as part of reordering)
      // if (shadowGenerator) {
      //     shadowGenerator.onBeforeShadowMapRenderObservable.remove(beforeShadowObserver);
      //     shadowGenerator.onAfterShadowMapRenderObservable.remove(afterShadowObserver);
      //     console.log("Removed shadow map render observers.");
      // }

      shadowGenerator?.dispose();
      shadowLight?.dispose();

      // Dispose the hemispheric light if it exists
      if ((scene as any)._hemiLight) {
        ((scene as any)._hemiLight as BABYLON.Light).dispose();
      }

      // Dispose the sun mesh if it exists
      const sunMesh = scene.getMeshByName("sunMesh");
      if (sunMesh) {
        sunMesh.dispose();
      }

      ground?.dispose(); // Dispose the main ground
      skybox?.dispose(); // Added skybox dispose
      if (scene?.debugLayer?.isVisible()) {
        scene.debugLayer.hide();
      }
      window.shadowGenerator = undefined; // Clean up window reference
    };
  }, [scene]); // Re-run setup if scene changes

  // Modular camera setup (remains the same)
  const cameraPosition = useMemo(() => new BABYLON.Vector3(0, 0.5, 8), []);
  const cameraTarget = useMemo(() => new BABYLON.Vector3(0, 0.5, 0), []);
  const cameraPostProcesses = useMemo<BABYLON.PostProcess[]>(() => [], []);
  const cameraType = 'ArcRotate';
  const [freeSceneRotation, setFreeSceneRotation] = React.useState(!!window.enableFreeSceneRotation);
  React.useEffect(() => {
    function syncFromGlobal() {
      setFreeSceneRotation(!!window.enableFreeSceneRotation); // Corrected variable name
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

  // Manage multi-row answer rows (remains the same)
  useRowManager({
    scene,
    problemQueue,
    onAnswerSelected: ({ mesh, answer, blockTypeId }) => onAnswerSelected({ mesh, answer, blockTypeId }),
    resetKey: resetKey as number
  });

  return (
    <>
      <VillagerNPC scene={scene} trigger={villagerTrigger} />
      {/* <HybridForest scene={scene} count={20} /> */} {/* Keep forest disabled */}
      {/* other Babylon scene logic is side effect only */}
      <Inventory />
    </>
  );
}
