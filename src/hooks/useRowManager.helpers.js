import * as BABYLON from '@babylonjs/core';
import { createCubePlatform } from '../components/CubePlatform';
import { BLOCK_TYPES } from '../game/blockTypes.js';

// Helper: create a row of cubes for a problem at given Z offset
export async function createRow(scene, problem, zOffset, rowIndex = 0) {
  
  const cubes = [];
  const blockTypes = BLOCK_TYPES.map(type => type.id);
  const xSpacing = 1.0;
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
    if (cube.material && cube.material.diffuseTexture) {
      cube.material.diffuseTexture.hasAlpha = true;
      cube.material.needAlphaTesting = () => true;
      cube.material.alphaCutOff = 0.5;
    }
    cube.metadata.rowIndex = rowIndex;
    cubes.push(cube);
  }
  return cubes;
}

// Helper: simple explosion effect at mesh position
export function explosionEffect(scene, position) {
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

// Helper: animate mesh Z position
export function animateZ(scene, mesh, toZ, durationFrames = 30) {
  return new Promise(resolve => {
    const fromZ = mesh.position.z;
    const anim = new BABYLON.Animation(`anim_${mesh.name}`, 'position.z', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
    anim.setKeys([{ frame: 0, value: fromZ }, { frame: durationFrames, value: toZ }]);
    mesh.animations = mesh.animations.concat(anim);
    scene.beginAnimation(mesh, 0, durationFrames, false, 1, () => resolve());
  });
}
