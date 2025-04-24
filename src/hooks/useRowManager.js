import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createCubePlatform } from '../components/CubePlatform';
import { BLOCK_TYPES } from '../game/blockTypes.js';

/**
 * Hook to manage multiple rows of answer cubes in a Babylon.js scene.
 * @param {Object} params
 * @param {BABYLON.Scene} params.scene - Babylon.js scene
 * @param {Array} params.problemQueue - Array of problem objects with .choices[]
 * @param {Function} params.onAnswerSelected - Callback(answer) when user selects an answer
 * @param {number} [params.spacingZ=2] - Spacing between rows on Z axis
 * @param {number} [params.rowCount=3] - Number of rows to display
 */
export default function useRowManager({ scene, problemQueue, onAnswerSelected, spacingZ = 2, rowCount = 3 }) {
  const rowsRef = useRef([]);
  const prevQueueRef = useRef(null);

  // Helper: create a row of cubes for a problem at given Z offset
  async function createRow(problem, zOffset, rowIndex = 0) {
    const cubes = [];
    // Use the modular BLOCK_TYPES array for block type assignment
  const blockTypes = BLOCK_TYPES.map(type => type.id);
    const xSpacing = 1.2;
    const len = problem.choices.length;
    for (let i = 0; i < len; i++) {
      const cube = await createCubePlatform({
        scene,
        blockTypeId: blockTypes[i % blockTypes.length],
        answer: problem.choices[i],
        position: { x: i * xSpacing - (len - 1) * xSpacing * 0.5, y: 0.5, z: zOffset },
        size: 0.5,
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
  function explosionEffect(position) {
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
  function animateZ(mesh, toZ, durationFrames = 30) {
    return new Promise(resolve => {
      const fromZ = mesh.position.z;
      const anim = new BABYLON.Animation(`anim_${mesh.name}`, 'position.z', 60, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
      anim.setKeys([{ frame: 0, value: fromZ }, { frame: durationFrames, value: toZ }]);
      mesh.animations = mesh.animations.concat(anim);
      scene.beginAnimation(mesh, 0, durationFrames, false, 1, () => resolve());
    });
  }

  // Animate rows on problemQueue change: dissolve front, slide others, add new
  useEffect(() => {
    if (!scene || !Array.isArray(problemQueue)) return;
    (async () => {
      const newProblems = problemQueue.slice(0, rowCount);
      if (!prevQueueRef.current) {
        // First render: clear and build
        rowsRef.current.forEach(r => r.cubes.forEach(m => m.dispose()));
        rowsRef.current = [];
        for (let i = 0; i < newProblems.length; i++) {
          const cubes = await createRow(newProblems[i], -i * spacingZ, i);
          rowsRef.current.push({ cubes });
        }
      } else {
        // Dissolve front row
        const front = rowsRef.current.shift();
        if (front) {
          await Promise.all(front.cubes.map(c => explosionEffect(c.position)));
          front.cubes.forEach(c => c.dispose());
        }
        // Slide remaining rows forward
        await Promise.all(
          rowsRef.current.flatMap((row, idx) =>
            row.cubes.map(cube => animateZ(cube, -idx * spacingZ))
          )
        );
        // Add new back row
        const newIdx = newProblems.length - 1;
        const newCubes = await createRow(newProblems[newIdx], -newIdx * spacingZ, newIdx);
        rowsRef.current.push({ cubes: newCubes });
      }
      prevQueueRef.current = JSON.stringify(newProblems);
    })();
  }, [scene, problemQueue, spacingZ, rowCount]);

  // Pointer handling: only cubes in the current front row respond
  useEffect(() => {
    if (!scene) return;
    const observer = scene.onPointerObservable.add(pi => {
      if (pi.type === BABYLON.PointerEventTypes.POINTERPICK) {
        const mesh = pi.pickInfo?.pickedMesh;
        const frontRow = rowsRef.current[0]?.cubes;
        if (mesh && frontRow?.includes(mesh)) {
          onAnswerSelected({ mesh, answer: mesh.metadata.answer, blockTypeId: mesh.metadata.blockTypeId });
        }
      }
    });
    return () => scene.onPointerObservable.remove(observer);
  }, [scene, onAnswerSelected]);
}
