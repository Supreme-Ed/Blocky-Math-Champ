import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

interface VillagerNPCProps {
  scene: BABYLON.Scene | null;
  trigger?: {
    type: 'yes' | 'no' | null;
    key?: number;
  };
}

/**
 * VillagerNPC component for Babylon.js scene.
 * Loads and manages the villager.gltf as an NPC, positioned to the left of the blocks.
 * Exposes animation controls for 'yes' and 'no' responses.
 *
 * @param props - Component props
 * @param props.scene - Babylon.js scene instance
 * @param props.trigger - Animation trigger object
 * @returns null (no React DOM output, purely Babylon.js side effect)
 */
function VillagerNPC({ scene, trigger }: VillagerNPCProps) {
  const villagerMeshRef = useRef<BABYLON.AbstractMesh | null>(null);
  const villagerAnimGroupsRef = useRef<BABYLON.AnimationGroup[] | null>(null);
  const lastTriggerKey = useRef<number | undefined>(undefined);

  // Helper to play villager animation by name (case-insensitive, partial match)
  const playVillagerAnimation = (name: string) => {
    if (villagerAnimGroupsRef.current) {
      villagerAnimGroupsRef.current.forEach(group => group.stop());
      const group = villagerAnimGroupsRef.current.find(g => g.name.toLowerCase().includes(name.toLowerCase()));
      if (group) group.start(false /* do not loop */);
    }
  };

  // Load villager model as NPC
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

        // Place villager far left and facing the user
        villagerRoot.position = new BABYLON.Vector3(3, 0, 0);
        villagerRoot.rotation = new BABYLON.Vector3(0, 0, 0);
        villagerMeshRef.current = villagerRoot;

        // Apply nearest neighbor filtering to all villager textures for Minecraft-like appearance
        meshes.forEach(mesh => {
          if (mesh.material) {
            // For PBRMaterial (GLTF)
            const pbrMaterial = mesh.material as BABYLON.PBRMaterial;
            if (pbrMaterial.albedoTexture) {
              pbrMaterial.albedoTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
              pbrMaterial.albedoTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
              pbrMaterial.albedoTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              // console.log(`Applied nearest neighbor filtering to ${mesh.name} albedo texture`);
            }

            // For StandardMaterial (if any)
            const standardMaterial = mesh.material as BABYLON.StandardMaterial;
            if (standardMaterial.diffuseTexture) {
              standardMaterial.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
              standardMaterial.diffuseTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
              standardMaterial.diffuseTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              // console.log(`Applied nearest neighbor filtering to ${mesh.name} diffuse texture`);
            }

            // Apply to all textures in the material
            if (mesh.material.getActiveTextures) {
              mesh.material.getActiveTextures().forEach(texture => {
                texture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
                texture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
                texture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
              });
            }
          }
        });

        // Only play idle animation if present, else stop all
        const idleAnim = animationGroups.find(g => g.name.toLowerCase().includes('idle'));
        if (idleAnim) {
          idleAnim.start(true);
        } else {
          animationGroups.forEach(g => g.stop());
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

  // Respond to trigger prop to play 'yes' or 'no' animation
  useEffect(() => {
    if (trigger && trigger.type && trigger.key !== lastTriggerKey.current) {
      if (trigger.type === 'yes') playVillagerAnimation('yes');
      if (trigger.type === 'no') playVillagerAnimation('no');
      lastTriggerKey.current = trigger.key;
    }
  }, [trigger]);

  return null; // No React DOM output, purely Babylon.js side effect
}

export default VillagerNPC;
