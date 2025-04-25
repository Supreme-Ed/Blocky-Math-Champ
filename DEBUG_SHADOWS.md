# Babylon.js Shadow Debugging Checklist

This document tracks troubleshooting steps and results for shadows not appearing correctly on the tiled terrain texture.

## Issue
- **Problem:** Shadows are visible when the ground has no texture, but disappear when a tiled texture is applied.

---

## Checklist: Things to Try

| Step | Description | Code / Setting | Result |
|------|-------------|----------------|--------|
| 1 | Disable alpha on ground texture | `groundMat.diffuseTexture.hasAlpha = false;` | |
| 2 | Change texture sampling mode | `grassTexture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);` | |
| 3 | Ensure lighting is enabled on material | `groundMat.disableLighting = false;` | |
| 4 | Try a different texture (non-tiled, or PNG with no alpha) | Use a different file | |
| 5 | Remove blur ESM, use standard shadow map | `shadowGenerator.useBlurExponentialShadowMap = false;` | |
| 6 | Check for mesh overlap/z-fighting | Raise ground Y or caster Y | |
| 7 | Visualize shadow map in debug layer | Use Babylon Inspector | |
| 8 | Check for transparency in texture file | Inspect PNG in image editor | |
| 9 | Test with StandardMaterial defaults | Don't set uScale/vScale or colors | |
| 10 | Test with PBRMaterial | Use PBRMaterial for ground | |

---

## Differences Between MinimalBabylonShadowDemo.jsx and Main Scene

1. Engine & Scene Creation:
   - Minimal: directly instantiates `Engine` and `Scene` in the component.
   - Main: uses `useBabylonScene` hook to create engine/scene with a default `HemisphericLight`.

2. Camera Setup:
   - Minimal: `ArcRotateCamera('camera', Math.PI/2, Math.PI/3, 10, new Vector3(0,1,0))`.
   - Main: `useBabylonCamera` hook with position `(0,0.5,8)` and target `(0,0.5,0)`.

3. Light Types:
   - Minimal: single `DirectionalLight` for shadows.
   - Main: default `HemisphericLight` from hook plus a `DirectionalLight` for shadows.

4. Shadow Generator Initialization:
   - Minimal: `new ShadowGenerator(1024, light)` with `useBlurExponentialShadowMap` and `useKernelBlur` enabled.
   - Main: `addBlurESMShadows(..., [], ground)` uses `mapSize=2048`, blur disabled, `useExponentialShadowMap=true`.

5. Shadow Casters Addition Timing:
   - Minimal: box mesh created before generator and added manually.
   - Main: initial meshes (ground, skybox) are created before generator; dynamic meshes automatically added via `scene.onNewMeshAddedObservable`.

6. Ground Mesh Position & Material:
   - Minimal: at `y=0`, green `StandardMaterial`.
   - Main: at `y=-0.1`, plain white `StandardMaterial`.

7. Render Loop Management:
   - Minimal: uses `engine.runRenderLoop` inside component.
   - Main: render loop managed by `useBabylonScene` hook.

8. Shadow Map Size & Bias:
   - Minimal: `mapSize=1024`, `bias=0.0005`.
   - Main: `mapSize=2048`, `bias=0.0005`.

---

## Results Log

(Record the outcome of each step here as you try them)

| Step | Result/Notes |
|------|--------------|
| 1    | Not visible. |
| 2    | Not visible. |
| 3    | Not visible. |
| 4    | Not visible. |
| 5    | Not visible. |
| 6    | Not visible. |
| 7    | (pending)    |

---

*Add more steps or notes as needed during troubleshooting.*

## Troubleshooting Log (2025-04)

### Additional Steps Tried

| Step | Description | Code / Setting | Result |
|------|-------------|----------------|--------|
| 11 | Direct minimal demo setup in main scene (white ground, box, direct light/shadowGenerator) | See BabylonSceneContent.jsx | **No shadow visible** |
| 12 | Changed ground color from green to white | `groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1)` | No shadow visible |
| 13 | Confirmed render loop is running | `scene.registerBeforeRender(() => console.log('Rendering frame'))` | Console logs every frame, render loop active |
| 14 | Logged engine, scene, and canvas objects | `console.log(engine, scene, canvas)` | All objects valid and present |
| 15 | Compared engine/canvas/scene creation with minimal demo | Manual code review | No critical difference found, but minimal demo uses direct instantiation |
| 16 | Checked for multiple scenes/engines | Manual inspection | Only one engine/scene in use |
| 17 | Verified all Babylon.js packages are same version | (To do if not already) | |

### Summary of Results
- Render loop is running and scene/canvas/engine are valid.
- Direct minimal demo logic (white ground, box, direct light/shadowGenerator) produces **no shadow** in main app, even though it works in the minimal demo file.
- No difference in shadow generator settings, light, or mesh creation order explains the issue.
- Shadow map in inspector remains blank; no silhouette or shadow visible.

### Remaining Hypotheses
- There may be a subtle difference in engine or scene instantiation between the minimal demo and main app (possibly due to the use of `useBabylonScene` hook or engine options).
- Possible interference from default lights, post-processes, or render pipeline in the main app.
- Potential version mismatch or module import issue with Babylon.js packages.

### Next Steps
- Restore last known working commit and incrementally reintroduce changes.
- If issue persists, try instantiating engine/scene directly in the main component as in the minimal demo.
- Double-check all package versions and module imports for consistency.

---
