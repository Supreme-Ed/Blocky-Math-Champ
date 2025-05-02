import { useEffect, useRef, useState } from 'react';
import * as BABYLON from '@babylonjs/core';
import { createRow, animateZ, explosionEffect } from './useRowManager.helpers';
import { ExtendedMathProblem } from '../types/game';

interface RowData {
  cubes: BABYLON.Mesh[];
  blockTypes: (string | null)[];
  problemId?: string | number;
}

interface PrevQueueRef {
  queue: ExtendedMathProblem[];
  __resetKey?: number;
}

interface AnswerSelectedParams {
  mesh: BABYLON.AbstractMesh;
  answer: number | string;
  blockTypeId: string;
}

interface UseRowManagerProps {
  scene: BABYLON.Scene | null;
  problemQueue: ExtendedMathProblem[];
  onAnswerSelected: (params: AnswerSelectedParams) => void;
  spacingZ?: number;
  rowCount?: number;
  resetKey?: number;
}

/**
 * Hook to manage multiple rows of answer cubes in a Babylon.js scene.
 * @param props - Hook properties
 * @returns void
 */
export default function useRowManager({
  scene,
  problemQueue,
  onAnswerSelected,
  spacingZ = 2,
  rowCount = 3,
  resetKey
}: UseRowManagerProps): void {
  const rowsRef = useRef<RowData[]>([]);
  const prevQueueRef = useRef<PrevQueueRef | null>(null);
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
        const blockTypes = cubes.map(cube =>
          cube.metadata?.blockTypeId ||
          (cube as any).blockTypeId ||
          (cube as any).blockType ||
          null
        );
        rowsRef.current.push({ cubes, blockTypes, problemId: prob.id });
      }
      prevQueueRef.current = { queue: problemQueue.slice(0, rowCount), __resetKey: resetKey };
      setRowsReady(true);
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

          if (window.soundManager && typeof window.soundManager.play === 'function') {
            window.soundManager.play('blocks slide');
          }

          await Promise.all(
            rowsRef.current.flatMap(row =>
              row.cubes.map(mesh => animateZ(scene, mesh, mesh.position.z + spacingZ))
            )
          );

          // Filter out any invalid rows
          rowsRef.current = rowsRef.current.filter(row => !!row.cubes && !!row.problemId);

          // Map existing rows to their new positions
          // The rows have already been animated to their new positions
          const existingRows = [...rowsRef.current];
          rowsRef.current = [];

          // Create a map of existing problems to avoid duplicates
          const existingProblemIds = new Set(existingRows.map(row => row.problemId));

          // Process all problems in the queue
          for (let i = 0; i < Math.min(problemQueue.length, rowCount); i++) {
            const prob = problemQueue[i];
            if (!prob) break;

            // Check if we already have a row for this problem
            const existingRowIndex = existingRows.findIndex(row => row.problemId === prob.id);

            if (existingRowIndex >= 0) {
              // We already have a row for this problem, just update its position if needed
              const existingRow = existingRows[existingRowIndex];

              // Remove from existingRows to mark it as processed
              existingRows.splice(existingRowIndex, 1);

              // Update the row's position if needed (it should already be at the correct position from animation)
              // This is just a safety check
              const expectedZ = -i * spacingZ;
              if (existingRow.cubes[0] && Math.abs(existingRow.cubes[0].position.z - expectedZ) > 0.01) {
                // If position is significantly different, update it
                existingRow.cubes.forEach(cube => {
                  cube.position.z = expectedZ;
                });
              }

              // Add the row back to rowsRef.current
              rowsRef.current.push(existingRow);
            } else {
              // We don't have a row for this problem, create a new one
              // If there are any remaining existingRows, use their block types
              const preservedBlockTypes = existingRows.length > 0 ? existingRows[0].blockTypes : null;

              // Create a new row
              const cubes = await createRow(
                scene,
                prob,
                -i * spacingZ,
                i,
                preservedBlockTypes
              );

              // Get the block types from the created cubes
              const blockTypes = cubes.map(cube =>
                cube.metadata?.blockTypeId ||
                (cube as any).blockTypeId ||
                (cube as any).blockType ||
                null
              );

              // Add the new row to rowsRef.current
              rowsRef.current.push({ cubes, blockTypes, problemId: prob.id });

              // Remove the first existingRow if we used its block types
              if (existingRows.length > 0) {
                existingRows.shift();
              }
            }
          }

          // Dispose of any remaining existingRows that weren't used
          existingRows.forEach(row => {
            row.cubes.forEach(m => m.dispose());
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

        if (mesh && frontRow && frontRow.some(m => m === mesh)) {
          if (window.soundManager && typeof window.soundManager.play === 'function') {
            window.soundManager.play('click block');
          }

          if (mesh.metadata && typeof mesh.metadata.answer !== 'undefined' && typeof mesh.metadata.blockTypeId !== 'undefined') {
            onAnswerSelected({
              mesh,
              answer: mesh.metadata.answer,
              blockTypeId: mesh.metadata.blockTypeId
            });
          }
        }
      }
    });

    return () => {
      if (observer) {
        scene.onPointerObservable.remove(observer);
      }
    };
  }, [scene, onAnswerSelected]);
}
