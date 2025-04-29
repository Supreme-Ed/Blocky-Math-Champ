import { Animation, Mesh, AbstractMesh, Vector3, Scene } from '@babylonjs/core';

interface FlyToAvatarOptions {
  duration?: number;
}

/**
 * Animates a clone of the cube flying to the avatar, shrinking and spinning as it goes.
 * @param mesh - The original cube mesh
 * @param avatarPosition - The target position for the animation
 * @param options - Optional animation options (duration, etc)
 * @returns Promise that resolves when the animation is complete
 */
export async function playCubeFlyToAvatarEffect(
  mesh: AbstractMesh,
  avatarPosition: Vector3,
  options: FlyToAvatarOptions = {}
): Promise<void> {
  if (!mesh || !avatarPosition) return;
  const scene = mesh.getScene();
  if (!scene) return;

  // Clone the mesh (deep clone, keep appearance)
  const clone = mesh.clone(`${mesh.name}_flyToAvatar`, null, true);
  if (!clone) return;
  clone.position = mesh.getAbsolutePosition().clone();
  clone.scaling = mesh.scaling.clone();
  clone.rotation = mesh.rotation.clone();

  // Animation parameters
  const duration = options.duration || 32; // frames (Babylon.js default: 60fps)
  const startPos = clone.position.clone();
  const endPos = avatarPosition.clone();
  const startScale = clone.scaling.clone();
  const endScale = startScale.scale(0.2);

  // Position animation
  const posAnim = new Animation(
    'flyToAvatarPos',
    'position',
    60,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  posAnim.setKeys([
    { frame: 0, value: startPos },
    { frame: duration, value: endPos }
  ]);

  // Scale animation
  const scaleAnim = new Animation(
    'flyToAvatarScale',
    'scaling',
    60,
    Animation.ANIMATIONTYPE_VECTOR3,
    Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  scaleAnim.setKeys([
    { frame: 0, value: startScale },
    { frame: duration, value: endScale }
  ]);

  // Spin animation (Y axis)
  const rotAnim = new Animation(
    'flyToAvatarRot',
    'rotation.y',
    60,
    Animation.ANIMATIONTYPE_FLOAT,
    Animation.ANIMATIONLOOPMODE_CYCLE
  );
  rotAnim.setKeys([
    { frame: 0, value: clone.rotation.y },
    { frame: duration, value: clone.rotation.y + 4 * Math.PI }
  ]);

  clone.animations = [posAnim, scaleAnim, rotAnim];

  // Start animation, then dispose the clone
  return new Promise<void>((resolve) => {
    scene.beginAnimation(clone, 0, duration, false, 1, () => {
      clone.dispose();
      resolve();
    });
  });
}
