import * as BABYLON from '@babylonjs/core';
import { createCubePlatform } from '../components/CubePlatform';
import { BLOCK_TYPES } from '../game/blockTypes';
import { ExtendedMathProblem } from '../types/game';

/**
 * Create a row of cubes for a problem at given Z offset
 * @param scene - Babylon.js scene
 * @param problem - Math problem to display
 * @param zOffset - Z position offset for the row
 * @param rowIndex - Index of the row (0 = front row)
 * @returns Promise resolving to an array of cube meshes
 */
export async function createRow(
  scene: BABYLON.Scene,
  problem: ExtendedMathProblem,
  zOffset: number,
  rowIndex: number = 0
): Promise<BABYLON.Mesh[]> {
  const cubes: BABYLON.Mesh[] = [];
  const blockTypes = BLOCK_TYPES.map(type => type.id);
  const xSpacing = 1.0;

  if (!problem.choices || !Array.isArray(problem.choices)) {
    console.error('Problem has no choices array:', problem);
    return cubes;
  }

  const len = problem.choices.length;
  for (let i = 0; i < len; i++) {
    const randomIdx = Math.floor(Math.random() * blockTypes.length);
    const blockTypeId = blockTypes[randomIdx];
    const cube = await createCubePlatform({
      scene,
      blockTypeId,
      answer: problem.choices[i],
      position: { x: i * xSpacing - (len - 1) * xSpacing * 0.5, y: 0.5, z: zOffset },
      size: 1.0,
    });

    // Set up material properties
    if (cube.material) {
      const material = cube.material as BABYLON.StandardMaterial;
      if (material.diffuseTexture) {
        material.diffuseTexture.hasAlpha = true;
        material.needAlphaTesting = () => true;
        material.alphaCutOff = 0.5;
      }
    }

    // Set metadata
    cube.metadata = cube.metadata || {};
    cube.metadata.rowIndex = rowIndex;
    cubes.push(cube);
  }
  return cubes;
}

/**
 * Create a simple explosion particle effect at the given position
 * @param scene - Babylon.js scene
 * @param position - Position for the explosion
 * @returns Promise that resolves when the effect is complete
 */
export function explosionEffect(scene: BABYLON.Scene, position: BABYLON.Vector3): Promise<void> {
  return new Promise(resolve => {
    const ps = new BABYLON.ParticleSystem('explosion', 200, scene);
    ps.particleTexture = new BABYLON.Texture('textures/flare.png', scene);
    ps.emitter = position;
    ps.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    ps.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    ps.color1 = new BABYLON.Color4(1, 0, 0, 1);
    ps.color2 = new BABYLON.Color4(1, 1, 0, 1);
    ps.colorDead = new BABYLON.Color4(0, 0, 0, 0);
    ps.minSize = 0.1;
    ps.maxSize = 0.3;
    ps.minLifeTime = 0.2;
    ps.maxLifeTime = 0.5;
    ps.emitRate = 200;
    ps.direction1 = new BABYLON.Vector3(-1, -1, -1);
    ps.direction2 = new BABYLON.Vector3(1, 1, 1);
    ps.gravity = new BABYLON.Vector3(0, -9.81, 0);
    ps.disposeOnStop = true;
    ps.start();
    setTimeout(() => {
      ps.stop();
      resolve();
    }, 500);
  });
}

/**
 * Animate a mesh's Z position
 * @param scene - Babylon.js scene
 * @param mesh - Mesh to animate
 * @param toZ - Target Z position
 * @param durationFrames - Animation duration in frames
 * @returns Promise that resolves when the animation is complete
 */
export function animateZ(
  scene: BABYLON.Scene,
  mesh: BABYLON.Mesh,
  toZ: number,
  durationFrames: number = 30
): Promise<void> {
  return new Promise(resolve => {
    const fromZ = mesh.position.z;
    const anim = new BABYLON.Animation(
      `anim_${mesh.name}`,
      'position.z',
      60,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT
    );
    anim.setKeys([
      { frame: 0, value: fromZ },
      { frame: durationFrames, value: toZ }
    ]);

    // Ensure mesh.animations is an array
    if (!mesh.animations) {
      mesh.animations = [];
    }

    mesh.animations = mesh.animations.concat(anim);
    scene.beginAnimation(mesh, 0, durationFrames, false, 1, () => resolve());
  });
}
