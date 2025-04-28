import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createRow, animateZ, explosionEffect } from './useRowManager.helpers.js';

/**
 * Hook to manage multiple rows of answer cubes in a Babylon.js scene.
 * @param {Object} params
 * @param {BABYLON.Scene} params.scene - Babylon.js scene
 * @param {Array} params.problemQueue - Array of problem objects with .choices[]
 * @param {Function} params.onAnswerSelected - Callback(answer) when user selects an answer
 * @param {number} [params.spacingZ=2] - Spacing between rows on Z axis
 * @param {number} [params.rowCount=3] - Number of rows to display
 */
export default function useRowManager({ scene, problemQueue, onAnswerSelected, spacingZ = 2, rowCount = 3, resetKey }) {
  const rowsRef = useRef([]);
  const prevQueueRef = useRef(null);
  const [rowsReady, setRowsReady] = useState(false);

  // Initial row setup: run once when problemQueue first becomes available
  useEffect(() => {
    if (!scene) return;
    if (!Array.isArray(problemQueue)) return;
    // Only run setup effect on initial mount or when resetKey changes
    rowsRef.current.forEach(row => row.cubes.forEach(m => m.dispose()));
    rowsRef.current = [];
    setRowsReady(false);
    prevQueueRef.current = null;
    (async () => {
      for (let i = 0; i < rowCount; i++) {
        const prob = problemQueue[i];
        if (!prob) break;
        const cubes = await createRow(scene, prob, -i * spacingZ, i);
        const blockTypes = cubes.map(cube => cube.metadata?.blockTypeId || cube.blockTypeId || cube.blockType || null);
        rowsRef.current.push({ cubes, blockTypes, problemId: prob.id });
      }
      prevQueueRef.current = { queue: problemQueue.slice(0, rowCount), __resetKey: resetKey };
      setRowsReady(true);
      // Debug: Log after initial row setup
      console.log('[BlockyMath Debug] useRowManager initial rows', {
        rows: rowsRef.current,
        problemQueue
      });
    })();
  }, [scene, spacingZ, rowCount, resetKey]);

  // Handle row transition when the leading problem changes
  useEffect(() => {
    if (!scene) return;
    if (!rowsReady) return; // Ensure row transition effect only runs after rows are ready
    if (!rowsRef.current[0]?.cubes) return;
    const curr = problemQueue.slice(0, rowCount);
    // Initialize previous queue on first run
    if (!prevQueueRef.current || !prevQueueRef.current.queue) {
      prevQueueRef.current = { queue: curr, __resetKey: resetKey };
      return;
    }
    const prev = prevQueueRef.current.queue;
    // Proceed only if the first problem differs and a row exists
    if (prev[0]?.id !== curr[0]?.id && rowsRef.current[0]?.cubes) {
      const firstRow = rowsRef.current.shift();
      if (firstRow?.cubes) {
        (async () => {
          await Promise.all(firstRow.cubes.map(m => explosionEffect(scene, m.position.clone())));
          firstRow.cubes.forEach(m => m.dispose());
          await Promise.all(
            rowsRef.current.flatMap(row =>
              row.cubes.map(mesh => animateZ(scene, mesh, mesh.position.z + spacingZ))
            )
          );
          // Always refill rows for all available problems (up to rowCount)
          rowsRef.current = rowsRef.current.filter(row => !!row.cubes && !!row.problemId);
          // Remove all rows, then rebuild for all remaining problems in the queue (up to rowCount)
          rowsRef.current.forEach(row => row.cubes.forEach(m => m.dispose()));
          rowsRef.current = [];
          for (let i = 0; i < Math.min(problemQueue.length, rowCount); i++) {
            const prob = problemQueue[i];
            if (!prob) break;
            const cubes = await createRow(scene, prob, -i * spacingZ, i);
            const blockTypes = cubes.map(cube => cube.metadata?.blockTypeId || cube.blockTypeId || cube.blockType || null);
            rowsRef.current.push({ cubes, blockTypes, problemId: prob.id });
          }
          // Debug: Log after row transition
          console.log('[BlockyMath Debug] useRowManager after row transition', {
            rows: rowsRef.current,
            problemQueue
          });
        })();
      }
    }
    prevQueueRef.current = { queue: curr, __resetKey: resetKey };
  }, [scene, problemQueue, spacingZ, rowCount, resetKey, rowsReady]);

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
