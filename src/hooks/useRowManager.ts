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
  const isTransitioningRef = useRef(false); // Lock to prevent concurrent transitions

  // Initial row setup: run once when problemQueue first becomes available
  useEffect(() => {
    if (!scene) return;
    if (!Array.isArray(problemQueue)) return;

    rowsRef.current.forEach(row => row.cubes.forEach(m => {
        if (m && !m.isDisposed()) m.dispose();
    }));
    rowsRef.current = [];
    setRowsReady(false);
    prevQueueRef.current = null;
    isTransitioningRef.current = false; // Reset lock on full reset

    (async () => {
      for (let i = 0; i < rowCount; i++) {
        const prob = problemQueue[i];
        if (!prob) {
          break;
        }
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
  }, [scene, spacingZ, rowCount, resetKey]); // problemQueue is intentionally omitted for initial setup

  // Handle row transition when the leading problem changes
  useEffect(() => {
    if (!scene) return;
    if (!rowsReady) {
      return;
    }
    if (!rowsRef.current[0]?.cubes) {
      return;
    }

    const curr = problemQueue.slice(0, rowCount);

    if (!prevQueueRef.current || !prevQueueRef.current.queue) {
      prevQueueRef.current = { queue: curr, __resetKey: resetKey };
      return;
    }

    const prev = prevQueueRef.current.queue;

    if (prev[0]?.id !== curr[0]?.id && rowsRef.current[0]?.cubes) {
      if (isTransitioningRef.current) {
        // Update prevQueueRef here so the *next* non-ignored transition sees the correct "previous" state
        prevQueueRef.current = { queue: curr, __resetKey: resetKey };
        return;
      }
      isTransitioningRef.current = true;
      const firstRow = rowsRef.current.shift();

      if (firstRow?.cubes) {
        (async () => {
          try {
            await Promise.all(firstRow.cubes.map(m => explosionEffect(scene, m.position.clone())));

            firstRow.cubes.forEach(m => {
              if (m && !m.isDisposed()) {
                m.dispose();
              } else if (m && m.isDisposed()) {
              } else {
              }
            });

            if (window.soundManager && typeof window.soundManager.play === 'function') {
              window.soundManager.play('blocks slide');
            }

            await Promise.all(
              rowsRef.current.flatMap(row =>
                row.cubes.map(mesh => animateZ(scene, mesh, mesh.position.z + spacingZ))
              )
            );

            rowsRef.current = rowsRef.current.filter(row => {
              const isValid = !!row.cubes && !!row.problemId;
              // if (!isValid) ; // Removed empty statement
              return isValid;
            });

            if (window.shadowGenerator) {
              const shadowMap = window.shadowGenerator.getShadowMap();
              if (shadowMap) shadowMap.refreshRate = 0;
            }

            const existingRows = [...rowsRef.current];
            rowsRef.current = [];

            for (let i = 0; i < Math.min(problemQueue.length, rowCount); i++) {
              const prob = problemQueue[i];
              if (!prob) {
                break;
              }

              const existingRowIndex = existingRows.findIndex(row => row.problemId === prob.id);

              if (existingRowIndex >= 0) {
                const existingRow = existingRows[existingRowIndex];
                existingRows.splice(existingRowIndex, 1);

                const expectedZ = -i * spacingZ;
                if (existingRow.cubes[0] && Math.abs(existingRow.cubes[0].position.z - expectedZ) > 0.01) {
                  existingRow.cubes.forEach(cube => { cube.position.z = expectedZ; });
                }
                rowsRef.current.push(existingRow);
              } else {
                const preservedBlockTypes = existingRows.length > 0 ? existingRows[0].blockTypes : null;
                // if (preservedBlockTypes) ; // Removed empty statement

                const cubes = await createRow(scene, prob, -i * spacingZ, i, preservedBlockTypes);

                const blockTypes = cubes.map(cube => cube.metadata?.blockTypeId || (cube as any).blockTypeId || (cube as any).blockType || null);
                rowsRef.current.push({ cubes, blockTypes, problemId: prob.id });

                if (existingRows.length > 0 && preservedBlockTypes) {
                  existingRows.shift();
                }
              }
            }

            existingRows.forEach(row => {
              row.cubes.forEach(m => {
                if (m && !m.isDisposed()) {
                  m.dispose();
                } else if (m && m.isDisposed()) {
                } else {
                }
              });
            });

            if (window.shadowGenerator) {
              const shadowMap = window.shadowGenerator.getShadowMap();
              if (shadowMap) shadowMap.refreshRate = 0;
            }

          } catch (error) {
          } finally {
            isTransitioningRef.current = false;
          }
        })();
      } else {
        isTransitioningRef.current = false; // Release lock if firstRow was invalid
      }
    } else {
      // if (prev[0]?.id === curr[0]?.id) {
      //   // console.log(LOG_PREFIX, 'Transition Condition NOT Met: IDs are the same.');
      // }
      // if (!rowsRef.current[0]?.cubes && rowsReady) { // only log if ready but no cubes
      //   console.log(LOG_PREFIX, 'Transition Condition NOT Met: No front row cubes (and rowsReady is true).');
      // }
    }

    prevQueueRef.current = { queue: curr, __resetKey: resetKey };
  }, [scene, problemQueue, spacingZ, rowCount, resetKey, rowsReady, onAnswerSelected]);

  // Pointer handling: only cubes in the current front row respond
  useEffect(() => {
    if (!scene) return;

    const observer = scene.onPointerObservable.add(pi => {
      if (pi.type === BABYLON.PointerEventTypes.POINTERPICK) {
        if (isTransitioningRef.current) {
          return;
        }
        const mesh = pi.pickInfo?.pickedMesh;
        const frontRowCubes = rowsRef.current[0]?.cubes;

        if (mesh && frontRowCubes && frontRowCubes.some(m => m === mesh)) {
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
  }, [scene, onAnswerSelected, rowsReady]);
}
