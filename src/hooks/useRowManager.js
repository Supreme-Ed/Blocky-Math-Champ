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
  console.log('[useRowManager] hook mounted');
  const rowsRef = useRef([]);
  const prevQueueRef = useRef(null);
  const [rowsReady, setRowsReady] = useState(false);

  // Initial row setup: run once when problemQueue first becomes available
  useEffect(() => {
    console.log('[useRowManager] setup effect started');
    if (!scene) { console.log('[useRowManager] setup effect: scene falsy, aborting'); return; }
    if (!Array.isArray(problemQueue)) { console.log('[useRowManager] setup effect: problemQueue not array, aborting'); return; }
    // Only run setup effect on initial mount or when resetKey changes
    rowsRef.current.forEach(row => row.cubes.forEach(m => m.dispose()));
    rowsRef.current = [];
    setRowsReady(false);
    prevQueueRef.current = null;
    (async () => {
      console.log('[useRowManager] setup effect: async row creation started');
      for (let i = 0; i < rowCount; i++) {
        const prob = problemQueue[i];
        if (!prob) break;
        console.log(`[useRowManager] calling createRow for row ${i} (problem:`, prob, ')');
        const cubes = await createRow(scene, prob, -i * spacingZ, i);
        console.log(`[useRowManager] createRow complete for row ${i}, cubes:`, cubes);
        // Assign and store block types for this row
        const blockTypes = cubes.map(cube => cube.metadata?.blockTypeId || cube.blockTypeId || cube.blockType || null);
        rowsRef.current.push({ cubes, blockTypes, problemId: prob.id });
      }
      prevQueueRef.current = { queue: problemQueue.slice(0, rowCount), __resetKey: resetKey };
      setRowsReady(true);
      console.log('[useRowManager] setup effect: rowsReady set to true');
    })();
  }, [scene, spacingZ, rowCount, resetKey]);

  // Handle row transition when the leading problem changes
  useEffect(() => {
    console.log('[useRowManager] transition effect started');
    if (!scene) return;
    if (!rowsReady) { console.log('[useRowManager] transition effect: rowsReady false, aborting'); return; } // Ensure row transition effect only runs after rows are ready
    if (!rowsRef.current[0]?.cubes) { console.log('[useRowManager] transition effect: no cubes in rowsRef.current[0], aborting'); return; }
    const curr = problemQueue.slice(0, rowCount);
    // Diagnostic logging
    console.log('[RowTransitionEffect] prevQueueRef.current:', prevQueueRef.current);
    console.log('[RowTransitionEffect] curr:', curr);
    // Initialize previous queue on first run
    if (!prevQueueRef.current || !prevQueueRef.current.queue) {
      prevQueueRef.current = { queue: curr, __resetKey: resetKey };
      return;
    }
    const prev = prevQueueRef.current.queue;
    console.log('[RowTransitionEffect] prev[0]?.id !== curr[0]?.id:', prev[0]?.id !== curr[0]?.id);
    console.log('[RowTransitionEffect] rowsRef.current[0]?.cubes:', rowsRef.current[0]?.cubes);
    // Proceed only if the first problem differs and a row exists
    if (prev[0]?.id !== curr[0]?.id && rowsRef.current[0]?.cubes) {
      console.log('[useRowManager] transition effect: triggering row transition logic (id changed)', prev[0]?.id, '->', curr[0]?.id);
      const firstRow = rowsRef.current.shift();
      if (firstRow?.cubes) {
        (async () => {
          console.log('Exploding first row');
          await Promise.all(firstRow.cubes.map(m => explosionEffect(scene, m.position.clone())));
          console.log('Explosion complete, disposing cubes');
          firstRow.cubes.forEach(m => m.dispose());
          console.log('Animating all remaining rows forward');
          await Promise.all(
            rowsRef.current.flatMap(row =>
              row.cubes.map(mesh => animateZ(scene, mesh, mesh.position.z + spacingZ))
            )
          );
          console.log('Row animation complete, adding new row');
          const nextProb = problemQueue[rowCount - 1];
          if (nextProb) {
            console.log(`[useRowManager] calling createRow for new row (problem:`, nextProb, ')');
            const cubes = await createRow(scene, nextProb, -(rowCount - 1) * spacingZ, rowCount - 1);
            console.log(`[useRowManager] createRow complete for new row, cubes:`, cubes);
            const blockTypes = cubes.map(cube => cube.metadata?.blockTypeId || cube.blockTypeId || cube.blockType || null);
            rowsRef.current.push({ cubes, blockTypes, problemId: nextProb.id });
            console.log('New row added');
          }
        })();
      }
    }
    prevQueueRef.current = { queue: curr, __resetKey: resetKey };
    console.log('[useRowManager] transition effect: prevQueueRef.current updated:', prevQueueRef.current);
    // Do not reset rowsReady here; setup should only run on mount/reset
    // console.log('[useRowManager] transition effect: rowsReady reset to false');
  }, [scene, problemQueue, spacingZ, rowCount, resetKey, rowsReady]);

  // Pointer handling: only cubes in the current front row respond
  useEffect(() => {
    console.log('[useRowManager] pointer effect started');
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
