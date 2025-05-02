import React, { useEffect, useMemo } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/inspector';
import '@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent';
import '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import '@babylonjs/core/Cameras/Inputs/arcRotateCameraKeyboardMoveInput';
import '@babylonjs/loaders/glTF';

// Modular scene components
import { createGround } from './scene/Ground';
import { createSkybox } from './scene/Skybox';
import { createMinimalDemoShadows } from './scene/Shadows';
import { useBabylonAvatar } from './scene/useBabylonAvatar';
import { useBabylonCamera } from './scene/useBabylonCamera';
import useRowManager from '../hooks/useRowManager';

// UI Components
import Inventory from './Inventory';
import VillagerNPC from './scene/VillagerNPC';

// Types
import type { ExtendedMathProblem, Avatar } from '../types/game';

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
}: BabylonSceneContentProps): React.ReactElement | null {
  // Villager NPC animation trigger state
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

  // Avatar setup
  const avatarFile = selectedAvatar?.file;
  const modelUrl = avatarFile ? `/models/avatars/${avatarFile}` : null;
  const avatarPosition = useMemo(() => new BABYLON.Vector3(0, 0, 4), []);

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


  // Scene Setup Effect
  useEffect(() => {
    if (!scene) return;

    scene.clearColor = new BABYLON.Color4(0.2, 0.2, 1, 1);

    // Create ground
    const ground = createGround(scene);

    // Create skybox
    const skybox = createSkybox(scene);

    // Create shadows
    const { shadowLight, shadowGenerator } = createMinimalDemoShadows(
      scene,
      ground,
      [ground.name, "skybox_sphere", "villager"]
    );

    // Add shadowGenerator to window for debugging
    window.shadowGenerator = shadowGenerator;

    // Add new meshes to shadow caster list
    const onNewMeshObserver = scene.onNewMeshAddedObservable.add((mesh) => {
      if (mesh.name !== ground.name && mesh.name !== "skybox_sphere" && mesh.name !== "villager") {
        if (shadowGenerator) {
          try {
            shadowGenerator.addShadowCaster(mesh);
          } catch (error) {
            console.error(`Error adding mesh ${mesh.name} to shadow casters:`, error);
          }
        }
      }
    });

    // Enable Inspector
    if (scene.debugLayer) {
      void scene.debugLayer.show({
        embedMode: true,
        overlay: true
      });
    }

    // Cleanup
    return () => {
      // Remove observers
      if (onNewMeshObserver) {
        scene.onNewMeshAddedObservable.remove(onNewMeshObserver);
      }

      // Dispose shadow resources
      shadowGenerator?.dispose();
      shadowLight?.dispose();

      // Dispose the hemispheric light
      if ((scene as any)._hemiLight) {
        ((scene as any)._hemiLight as BABYLON.Light).dispose();
      }

      // Dispose the sun mesh
      const sunMesh = scene.getMeshByName("sunMesh");
      if (sunMesh) {
        sunMesh.dispose();
      }

      // Dispose other resources
      ground?.dispose();
      skybox?.dispose();

      // Hide debug layer
      if (scene?.debugLayer?.isVisible()) {
        scene.debugLayer.hide();
      }

      // Clean up window reference
      window.shadowGenerator = undefined;
    };
  }, [scene]);

  // Camera setup
  const cameraPosition = useMemo(() => new BABYLON.Vector3(0, 0.5, 8), []);
  const cameraTarget = useMemo(() => new BABYLON.Vector3(0, 0.5, 0), []);
  const cameraPostProcesses = useMemo<BABYLON.PostProcess[]>(() => [], []);
  const cameraType = 'ArcRotate';

  // Free rotation toggle
  const [freeSceneRotation, setFreeSceneRotation] = React.useState(!!window.enableFreeSceneRotation);
  React.useEffect(() => {
    function syncFromGlobal() {
      setFreeSceneRotation(!!window.enableFreeSceneRotation);
    }
    window.addEventListener('freeSceneRotationToggled', syncFromGlobal);
    return () => window.removeEventListener('freeSceneRotationToggled', syncFromGlobal);
  }, []);

  // Initialize camera
  useBabylonCamera({
    scene,
    type: cameraType,
    position: cameraPosition,
    target: cameraTarget,
    attachControl: true,
    postProcesses: cameraPostProcesses,
    freeSceneRotation
  });

  // Initialize answer blocks
  useRowManager({
    scene,
    problemQueue,
    onAnswerSelected: ({ mesh, answer, blockTypeId }) => onAnswerSelected({ mesh, answer, blockTypeId }),
    resetKey: resetKey as number
  });

  return (
    <>
      <VillagerNPC scene={scene} trigger={villagerTrigger} />
      <Inventory />
    </>
  );
}
