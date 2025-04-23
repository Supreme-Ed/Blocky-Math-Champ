import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { loadAvatar } from '../AvatarRunner3D';

/**
 * React hook to load, manage, and clean up a Babylon.js avatar mesh.
 * @param {object} params
 * @param {BABYLON.Scene} params.scene - The Babylon.js scene.
 * @param {string} params.modelUrl - The URL to the avatar model (OBJ/GLTF/GLB).
 * @param {BABYLON.Vector3} [params.position] - The position for the avatar.
 * @returns {object} { meshes: ref to loaded meshes, loading, error }
 */
export function useBabylonAvatar({ scene, modelUrl, position = new BABYLON.Vector3(0, 0.5, 3) }) {
  const meshesRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    
    let disposed = false;
    async function loadAndSetAvatar() {
      if (!scene || !modelUrl) return;
      
      setLoading(true);
      setError(null);
      // Dispose previous
      if (meshesRef.current) {
        console.log('[useBabylonAvatar] Disposing previous meshes:', meshesRef.current);
        meshesRef.current.forEach(mesh => {
          if (mesh && mesh.getScene && mesh.getScene().meshes.includes(mesh)) {
            mesh.getScene().removeMesh(mesh);
          }
          if (mesh && mesh.dispose) mesh.dispose();
        });
      }
      try {
        const { meshes } = await loadAvatar({ scene, modelUrl, position });
        if (!disposed) {
          meshesRef.current = meshes;
        }
      } catch (err) {
        if (!disposed) setError(err);
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    loadAndSetAvatar();
    return () => {
      disposed = true;
      if (meshesRef.current) {

        meshesRef.current.forEach(mesh => {
          if (mesh && mesh.getScene && mesh.getScene().meshes.includes(mesh)) {
            mesh.getScene().removeMesh(mesh);
          }
          if (mesh && mesh.dispose) mesh.dispose();
        });
        meshesRef.current = null;
      }
    };
  }, [scene, modelUrl, position]);

  return { meshes: meshesRef.current, loading, error };
}
