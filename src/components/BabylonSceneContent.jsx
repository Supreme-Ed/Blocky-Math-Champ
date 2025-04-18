import { useEffect } from 'react';
import PropTypes from 'prop-types';
import * as BABYLON from 'babylonjs';

/**
 * BabylonSceneContent is the dedicated logic component for adding 3D content to the Babylon.js scene.
 * Place all mesh, avatar, animation, and effect logic here as your scene grows.
 * This keeps MainGame clean and makes 3D logic modular and maintainable.
 */
export default function BabylonSceneContent({ scene }) {
  useEffect(() => {
    if (!scene) return;
    // --- Example: Add a simple box to the scene ---
    const box = BABYLON.MeshBuilder.CreateBox('box', { size: 1 }, scene);
    box.position.y = 1;
    // TODO: Add more meshes, avatars, effects, etc. here as the game grows

    // --- Example: Add a basic animation ---
    // (You can expand this for more complex animation logic)

    return () => {
      // Clean up all meshes/effects added here
      box.dispose();
      // Dispose of any other resources you add in the future
    };
  }, [scene]);

  return null; // This is a logic-only component
}

BabylonSceneContent.propTypes = {
  scene: PropTypes.object,
};
