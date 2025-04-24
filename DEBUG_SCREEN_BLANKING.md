# Babylon.js Scene Blanking Debug Log

**[COMPLETED – 2025-04-23]**

The screen blanking/scene flashing issue has been resolved and all planned fixes have been implemented. No further action is needed unless new related bugs are reported.

## Objective
Eliminate flashing or blanking of the Babylon.js scene during gameplay by ensuring new cubes are fully created and visible before hiding or disposing of old cubes (double-buffering), guaranteeing a seamless user experience.

---

## Summary of Attempts and Findings

### 1. Initial Problem
- The scene would flash or blank (showing only ground or empty) during answer cube transitions.
- Mesh count would temporarily drop to 2 (ground + helper), indicating all answer cubes were removed before new ones were visible.

### 2. Implemented Solutions

#### a. Double-Buffering Logic (`updateAnswerCubesNoBlank`)
- **Approach:**
  - Add new cubes to the scene and ensure they are visible before hiding/disposing of old cubes.
  - Wait for at least one Babylon.js render frame with both old and new cubes present.
  - Only after this frame, hide/dispose old cubes.
- **Implementation:**
  - Used `scene.onAfterRenderObservable` to await a render frame.
  - Modular helper functions for cube creation and disposal.
  - Extensive debug logging for mesh visibility, material readiness, and texture states.
- **Result:**
  - Scene blanking/flashing significantly reduced, but not always eliminated. Timing issues may still occur due to React/Babylon async updates.

#### b. Debug Logging
- **Added logs:**
  - Mesh/Light count after each update.
  - Cube properties after creation and after readiness check: `isVisible`, `hasMaterial`, `textureReady`.
  - Mesh lists after adding new cubes and after readiness check.
- **Findings:**
  - Mesh count and cube readiness are as expected after new cubes are added.
  - No frames observed with 0 cubes when logging is enabled, but visual blanking can still be seen.

#### c. Modularity
- All changes made as modular functions/components, per project guidelines.
- No direct coupling between cube update logic and other scene elements.

---

## Latest Debug Logs (Sample)

```
[Mesh/Light count changed] {meshCount: 2, ...}
[Meshes after adding new cubes] (24) ['ground', 'cube_grass_17', ...]
[Cube after creation] {name: 'cube_grass_17', isVisible: true, hasMaterial: true, textureReady: 'n/a'}
[Meshes after readiness check] (24) [...]
[Cube after readiness check] {name: 'cube_grass_17', isVisible: true, hasMaterial: true, textureReady: 'n/a'}
```

---

## [2025-04-22] Debug Entry: Issue Persists

### Summary of Current State
- The double-buffering logic in `updateAnswerCubesNoBlank` (BabylonSceneContent.jsx) creates new cubes, waits for them to be ready, and only then disposes of old cubes.
- Extensive debug logging confirms that mesh counts, cube visibility, and readiness are as expected after each update.
- Despite this, **scene blanking/flashing still occurs** during some transitions, particularly under rapid or specific timing conditions.
- No Babylon.js or React errors/warnings are present in the console.
- All changes and debug code remain modular, as per project guidelines.

### Key Code Observations
- `updateAnswerCubesNoBlank` uses:
  - Asynchronous cube creation (with `await createCubePlatform`)
  - Readiness polling for all cubes
  - Forcing a render and waiting for `scene.onAfterRenderObservable`
  - Only then, old cubes are disposed
- All mesh/material/texture readiness checks pass in logs.
- Mesh count never drops to zero in logs, but blanking is still visually observed.

### Hypotheses & Next Debug Steps
1. **React/Babylon Timing Mismatch:**
   - React effect or state batching may be causing Babylon scene updates to be out-of-sync with actual rendering.
   - Hypothesis: Even with forced renders, the React update cycle may be causing a momentary scene reset.
2. **Try requestAnimationFrame for Disposal:**
   - After new cubes are ready and a render is observed, schedule disposal of old cubes with `requestAnimationFrame` to further decouple from React's effect timing.
3. **Profile Babylon Render Loop:**
   - Add logs directly to Babylon's render loop callbacks to trace exactly when meshes are present/absent each frame.
4. **Explore Layers or Multi-Scene:**
   - Investigate using Babylon.js layers or multiple scenes for atomic swaps.
5. **Add Video/Frame Capture:**
   - Consider capturing frames or video for frame-by-frame analysis if the above steps do not reveal the issue.

---

## [2025-04-22] Debug Entry: Blanking Persists, Click Handler Broken

### Observations
- Scene blanking still occurs, sometimes showing only ground or a single cube.
- Clicking on cubes (answer selection) is now broken after last refactor.
- `[RenderLoop] Meshes:` logs show mesh count sometimes drops below expected (e.g., only ground or 1-2 meshes).

### Suspected Issues
1. Pointer observer is being recreated per update, causing broken click handlers.
2. Old cubes are disposed asynchronously, possibly racing with new cube creation.
3. React/Babylon effect overlap may be causing a fleeting empty scene.

### Next Steps (Fix Plan)

**[COMPLETION NOTE – 2025-04-23]**
All next steps have been completed. The double-buffering and pointer observer logic are now robust, and the scene blanking issue is resolved. No further steps are required unless new issues arise.

- Refactor pointer observer logic: create it once per scene, clean up only on unmount.
- In cube update logic, hide old cubes (`isVisible=false`) before creating new ones. Only dispose old cubes after new cubes are confirmed visible and a render has occurred.
- Add a warning log if mesh count drops below 3 in any frame.

### Immediate Actions
- Refactor code as above and retest. If blanking or click issues persist, escalate to multi-scene or atomic swap strategies.

---

## [2025-04-22] Fix: Prevent flash on answer click
### Root Cause
- The answer-cube update effect listed `onAnswerSelected` in its dependency array, so every click triggered the cleanup and re-creation of cubes.

### Solution
- Removed `onAnswerSelected` from the `useEffect` dependency list so the effect only re-runs when the problem truly changes.

### Verification
- Clicking an answer no longer disposes and recreates answer cubes; no more flashing observed during answer selection.

---

**All changes and debug steps are being tracked in this file for ongoing reference.**

---

## Modular Design Compliance
- All changes and debug utilities are implemented as modular, swappable helpers or components.
- No hard-coded dependencies; all update logic is isolated for easy testing and extension.

---

## References
- [Babylon.js Documentation](https://doc.babylonjs.com/)
- [React Docs: State and Effects](https://react.dev/learn/adding-interactivity)

---

**This file will be updated as further debugging and solutions are attempted.**
