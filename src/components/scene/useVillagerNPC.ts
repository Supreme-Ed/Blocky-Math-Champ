import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface UseVillagerNPCResult {
  villagerMeshRef: React.RefObject<BABYLON.AbstractMesh | null>;
  villagerAnimGroupsRef: React.RefObject<BABYLON.AnimationGroup[] | null>;
  playVillagerAnimation: (name: string) => void;
}

/**
 * Custom hook to load and manage the Villager NPC in a Babylon.js scene.
 * Returns refs for controlling the villager and its animation groups.
 *
 * @param scene - Babylon.js scene
 * @returns Object containing refs and animation control function
 */
export function useVillagerNPC(scene: BABYLON.Scene | null): UseVillagerNPCResult {
  const villagerMeshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const villagerAnimGroupsRef = useRef<BABYLON.AnimationGroup[] | null>(null);

  // Helper to play villager animation by name (case-insensitive, partial match)
  const playVillagerAnimation = (name: string) => {
    if (villagerAnimGroupsRef.current) {
      villagerAnimGroupsRef.current.forEach(group => group.stop());
      const group = villagerAnimGroupsRef.current.find(g => g.name.toLowerCase().includes(name.toLowerCase()));
      if (group) group.start(false);
    }
  };

  useEffect(() => {
    if (!scene) return;
    let villagerMeshes: BABYLON.AbstractMesh[] = [];
    let villagerAnimGroups: BABYLON.AnimationGroup[] = [];
    let villagerRoot: BABYLON.AbstractMesh | null = null;
    let disposed = false;
    
    BABYLON.SceneLoader.ImportMesh(
      null,
      '/models/avatars/voxel-characters/Villager/',
      'villager.gltf',
      scene,
      (meshes, particleSystems, skeletons, animationGroups) => {
        if (disposed) return;
        villagerMeshes = meshes;
        villagerAnimGroups = animationGroups;
        villagerAnimGroupsRef.current = animationGroups;
        villagerRoot = meshes[0];
        villagerRoot.position = new BABYLON.Vector3(-4, 0, 0);
        villagerRoot.rotation = new BABYLON.Vector3(0, Math.PI / 2, 0);
        villagerMeshRef.current = villagerRoot;
        if (animationGroups.length > 0) {
          animationGroups[0].start(true);
        }
      }
    );
    
    return () => {
      disposed = true;
      if (villagerAnimGroups.length) villagerAnimGroups.forEach(g => g.stop());
      if (villagerMeshes.length) villagerMeshes.forEach(m => m.dispose());
      villagerAnimGroupsRef.current = null;
      villagerMeshRef.current = null;
    };
  }, [scene]);

  return { villagerMeshRef, villagerAnimGroupsRef, playVillagerAnimation };
}
