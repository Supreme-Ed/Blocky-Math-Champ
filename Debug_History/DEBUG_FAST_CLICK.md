# Debugging: Fast Click Issue Causing Extra Rows and Texture Glitches

## Issue Description
When the user clicks the answer cubes repeatedly and quickly, an extra front row of cubes sometimes appears that is not disposed of, and textures start glitching. No console errors are reported when this happens. The issue is not present with normal-speed clicks.

## Initial Hypothesis
The issue is likely a race condition or a problem with how quickly state updates are processed and reconciled in the scene, especially concerning asynchronous operations for creating/disposing of rows or updating textures.

Potential sources considered:
1.  Asynchronous Row Creation/Deletion
2.  State Management Latency
3.  Event Handler Overlap / Lack of Debouncing
4.  Resource Management for Meshes/Textures
5.  Incorrect Indexing or Referencing

Most likely: Asynchronous Row Creation/Deletion and State Management Latency.

## Debugging Steps and Observations

### Step 1: Add Detailed Logging to `useRowManager.ts`
- **Change:** Added extensive `console.log` statements within the `useEffect` hooks in `src/hooks/useRowManager.ts` to trace the state of `rowsRef.current` and the sequence of operations during row transitions. Each async transition instance was given a unique ID for easier tracking.
- **Observation (User Reported):** Console was too noisy with logs from other files.
- **Action:** Commented out `console.log` statements in `src/components/BabylonSceneContent.tsx`, `src/components/scene/VillagerNPC.tsx`, `src/components/AvatarRunner3D.ts`, and `src/components/scene/Shadows.ts`. This also involved fixing some minor TypeScript errors that were unmasked by commenting out logs.

### Step 2: Analyze Logs after Silencing Other Components
- **Action:** User reproduced the bug with the cleaned-up console.
- **Observation (Log Analysis):**
    - Multiple `Async transition STARTED` logs appeared for different `transitionInstanceId`s before previous ones logged `Async transition FINISHED`.
    - The `rowsRef.current` state logged at the beginning of an async transition often differed from the state it was operating on by the time it reached its rebuild phase, due to other transitions modifying it in the interim.
    - Example: Transition `cmtnf6` logged a `Final rowsRef.current state` with 5 rows, including duplicates: `[{"problemId":"add-2-10"},{"problemId":"add-7-9"},{"problemId":"add-7-9"},{"problemId":"add-1-5"},{"problemId":"add-1-5"}]`.
    - This clearly showed `rowsRef.current` being corrupted by overlapping asynchronous operations.
- **Diagnosis Confirmed:** The rapid clicks trigger multiple overlapping asynchronous row update operations. Because these operations share and modify `rowsRef.current`, they interfere with each other, leading to an inconsistent and incorrect state of the rows in the scene. This manifests as extra rows and visual glitches.

## Solution Attempts

### Attempt 1: Implement a Transition Lock
- **Change:**
    1.  Introduced `isTransitioningRef = useRef(false)` in `useRowManager.ts`.
    2.  In the row transition `useEffect`:
        - If `isTransitioningRef.current` is `true` when a new transition is triggered, log a warning and ignore the new transition. `prevQueueRef.current` is updated to ensure the *next* non-ignored transition has the correct context.
        - If `isTransitioningRef.current` is `false` and a transition condition is met, set `isTransitioningRef.current = true` before starting async operations.
    3.  In the `finally` block of the async transition logic, set `isTransitioningRef.current = false` to release the lock.
    4.  Added a check in the pointer event `useEffect` to ignore clicks if `isTransitioningRef.current` is true.
- **Reasoning:** This lock should prevent multiple asynchronous row transition operations from running concurrently, thereby avoiding the race condition that corrupts `rowsRef.current`.
- **Result:** **SUCCESSFUL.** The user confirmed that the bug (extra rows and texture glitches) is fixed. Console logs show new transitions being ignored when a transition is already in progress, as expected.

---