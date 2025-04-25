import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from '@babylonjs/core';

/**
 * VillagerNPC component for Babylon.js scene.
 * Loads and manages the villager.gltf as an NPC, positioned to the left of the blocks.
 * Exposes animation controls for 'yes' and 'no' responses.
 *
 * Usage:
 *   <VillagerNPC scene={scene} trigger={trigger} />
 *
 * Props:
 *   - scene: Babylon.js scene instance (required)
 *   - trigger: { type: 'yes' | 'no' | null, key: any } (optional)
 *     When trigger.type changes to 'yes' or 'no', the corresponding animation plays.
 */
function VillagerNPC({ scene, trigger }) {
  const villagerMeshRef = useRef(null);
  const villagerAnimGroupsRef = useRef(null);
  const lastTriggerKey = useRef(null);

  // Helper to play villager animation by name (case-insensitive, partial match)
  const playVillagerAnimation = (name) => {
    if (villagerAnimGroupsRef.current) {
      villagerAnimGroupsRef.current.forEach(group => group.stop());
      const group = villagerAnimGroupsRef.current.find(g => g.name.toLowerCase().includes(name.toLowerCase()));
      if (group) group.start(false /* do not loop */);
    }
  };

  // Load villager model as NPC
  useEffect(() => {
    if (!scene) return;
    let villagerMeshes = [];
    let villagerAnimGroups = [];
    let villagerRoot = null;
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
        // Debug: log all animation group names
        if (animationGroups.length > 0) {
          console.log('[VillagerNPC] Animation groups:', animationGroups.map(g => g.name));
        }
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

VillagerNPC.propTypes = {
  scene: PropTypes.object.isRequired,
  trigger: PropTypes.shape({
    type: PropTypes.oneOf(['yes', 'no', null]),
    key: PropTypes.number
  })
};

export default VillagerNPC;
