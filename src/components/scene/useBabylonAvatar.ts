import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { loadAvatar, AvatarLoadResult } from '../AvatarRunner3D';

interface UseBabylonAvatarParams {
  scene: BABYLON.Scene | null;
  modelUrl: string;
  position?: BABYLON.Vector3;
}

interface UseBabylonAvatarResult {
  meshes: BABYLON.AbstractMesh[] | null;
  loading: boolean;
  error: Error | null;
}

/**
 * React hook to load, manage, and clean up a Babylon.js avatar mesh.
 * @param params - Parameters for the avatar
 * @param params.scene - The Babylon.js scene
 * @param params.modelUrl - The URL to the avatar model (OBJ/GLTF/GLB)
 * @param params.position - The position for the avatar
 * @returns Object containing meshes reference, loading state, and error state
 */
export function useBabylonAvatar({ 
  scene, 
  modelUrl, 
  position = new BABYLON.Vector3(0, 0.5, 3) 
}: UseBabylonAvatarParams): UseBabylonAvatarResult {
  const meshesRef = useRef<BABYLON.AbstractMesh[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
          if (mesh && typeof mesh.getScene === 'function' && mesh.getScene().meshes.includes(mesh)) {
            mesh.getScene().removeMesh(mesh);
          }
          if (mesh && typeof mesh.dispose === 'function') mesh.dispose();
        });
      }
      
      try {
        const { meshes } = await loadAvatar({ scene, modelUrl, position });
        if (!disposed) {
          meshesRef.current = meshes;
        }
      } catch (err) {
        if (!disposed) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    
    loadAndSetAvatar();
    
    return () => {
      disposed = true;
      if (meshesRef.current) {
        meshesRef.current.forEach(mesh => {
          if (mesh && typeof mesh.getScene === 'function' && mesh.getScene().meshes.includes(mesh)) {
            mesh.getScene().removeMesh(mesh);
          }
          if (mesh && typeof mesh.dispose === 'function') mesh.dispose();
        });
        meshesRef.current = null;
      }
    };
  }, [scene, modelUrl, position]);

  return { meshes: meshesRef.current, loading, error };
}
