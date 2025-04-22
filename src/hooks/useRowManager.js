import { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createCubePlatform } from '../components/CubePlatform';

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
  async function createRow(problem, zOffset) {
    const cubes = [];
    const blockTypes = ['grass', 'stone', 'wood', 'sand'];
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

  // Initial row setup: run once when problemQueue first becomes available
  useEffect(() => {
    if (!scene || !Array.isArray(problemQueue) || prevQueueRef.current !== null) return;
    // Clear existing rows
    rowsRef.current.forEach(row => row.cubes.forEach(m => m.dispose()));
    rowsRef.current = [];
    // Sequentially create initial rows to preserve front-row order
    (async () => {
      for (let i = 0; i < rowCount; i++) {
        const prob = problemQueue[i];
        if (!prob) break;
        const cubes = await createRow(prob, -i * spacingZ);
        rowsRef.current.push({ cubes });
      }
      prevQueueRef.current = problemQueue.slice(0, rowCount);
    })();
  }, [scene, problemQueue, spacingZ, rowCount]);

  // Pointer handling: only first row responds
  useEffect(() => {
    if (!scene) return;
    const observer = scene.onPointerObservable.add(pi => {
      if (pi.type === BABYLON.PointerEventTypes.POINTERPICK) {
        const mesh = pi.pickInfo?.pickedMesh;
        if (mesh && rowsRef.current[0]?.cubes?.includes(mesh)) {
          onAnswerSelected(mesh.metadata.answer);
        }
      }
    });
    return () => scene.onPointerObservable.remove(observer);
  }, [scene, onAnswerSelected]);

  // Handle row transition when the leading problem changes
  useEffect(() => {
    if (!scene) return;
    const curr = problemQueue.slice(0, rowCount);
    // Initialize previous queue on first run
    if (!prevQueueRef.current) {
      prevQueueRef.current = curr;
      return;
    }
    const prev = prevQueueRef.current;
    // Proceed only if the first problem differs and a row exists
    if (prev[0] !== curr[0] && rowsRef.current[0]?.cubes) {
      const firstRow = rowsRef.current.shift();
      if (firstRow?.cubes) {
        // Explosion effect then slide and add next row
        Promise.all(firstRow.cubes.map(m => explosionEffect(m.position.clone())))
          .then(() => {
            firstRow.cubes.forEach(m => m.dispose());
            return Promise.all(
              rowsRef.current.flatMap(row =>
                row.cubes.map(mesh => animateZ(mesh, mesh.position.z + spacingZ))
              )
            );
          })
          .then(() => {
            const nextProb = problemQueue[rowCount - 1];
            if (nextProb) createRow(nextProb, -(rowCount - 1) * spacingZ).then(cubes => rowsRef.current.push({ cubes }));
          });
      }
    }
    prevQueueRef.current = curr;
  }, [scene, problemQueue, spacingZ, rowCount]);
}
