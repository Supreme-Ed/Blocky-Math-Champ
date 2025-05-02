# Babylon.js Shadow Debugging Checklist

This document tracks troubleshooting steps and results for shadows not appearing correctly on the tiled terrain texture.

## Issue
- **Problem:** Shadows are visible when the ground has no texture, but disappear when a tiled texture is applied. (Initial issue)
- **Secondary Problem:** During debugging, even a minimal test scene (ground + box) failed to render shadows correctly within the main application context, showing various artifacts (cyan/green checkerboard, white map, black map) in the shadow map texture preview.
- **Tertiary Problem:** When shadows started working, the ground texture filtering was incorrect (smooth instead of nearest neighbor).
- **Fourth Problem:** Shadows disappeared again when the skybox was re-introduced.

---

## Checklist: Things to Try (Original Issue)

| Step | Description | Code / Setting | Result |
|------|-------------|----------------|--------|
| 1 | Disable alpha on ground texture | `groundMat.diffuseTexture.hasAlpha = false;` | (Untested) |
| 2 | Change texture sampling mode | `grassTexture.updateSamplingMode(BABYLON.Texture.TRILINEAR_SAMPLINGMODE);` | (Nearest Neighbor tested - see log) |
| 3 | Ensure lighting is enabled on material | `groundMat.disableLighting = false;` | (Untested) |
| 4 | Try a different texture (non-tiled, or PNG with no alpha) | Use a different file | (Untested) |
| 5 | Remove blur ESM, use standard shadow map | `shadowGenerator.useBlurExponentialShadowMap = false;` | (Tested during debug - see log) |
| 6 | Check for mesh overlap/z-fighting | Raise ground Y or caster Y | (Tested during debug - see log) |
| 7 | Visualize shadow map in debug layer | Use Babylon Inspector | (Used extensively - see log) |
| 8 | Check for transparency in texture file | Inspect PNG in image editor | (Untested) |
| 9 | Test with StandardMaterial defaults | Don't set uScale/vScale or colors | (Tested during debug - see log) |
| 10 | Test with PBRMaterial | Use PBRMaterial for ground | (Untested) |

---

## Differences Between MinimalBabylonShadowDemo.jsx and Main Scene (Initial Analysis)

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

## Results Log (Original Issue)

(Record the outcome of each step here as you try them)

| Step | Result/Notes |
|------|--------------|
| 1    | Not visible. |
| 2    | Not visible. |
| 3    | Not visible. |
| 4    | Not visible. |
| 5    | Not visible. |
| 6    | Not visible. |
| 7    | Shadow map showed various issues (see log below) |

---

*Add more steps or notes as needed during troubleshooting.*

## Troubleshooting Log (2025-04) - Initial Attempts

### Additional Steps Tried

| Step | Description | Code / Setting | Result |
|------|-------------|----------------|--------|
| 11 | Direct minimal demo setup in main scene (white ground, box, direct light/shadowGenerator) | See BabylonSceneContent.jsx | **No shadow visible** |
| 12 | Changed ground color from green to white | `groundMat.diffuseColor = new BABYLON.Color3(1, 1, 1)` | No shadow visible |
| 13 | Confirmed render loop is running | `scene.registerBeforeRender(() => console.log('Rendering frame'))` | Console logs every frame, render loop active |
| 14 | Logged engine, scene, and canvas objects | `console.log(engine, scene, canvas)` | All objects valid and present |
| 15 | Compared engine/canvas/scene creation with minimal demo | Manual code review | No critical difference found, but minimal demo uses direct instantiation |
| 16 | Checked for multiple scenes/engines | Manual inspection | Only one engine/scene in use |
| 17 | Verified all Babylon.js packages are same version | Package.json inspection | All packages are at the same version |
| 18 | Converted project to TypeScript | Renamed all .js/.jsx files to .ts/.tsx | Fixed avatar rendering issues but shadows still not visible |
| 19 | Created dedicated shadow test scene | See BabylonSceneContent.tsx | Shadows still not appearing consistently |
| 20 | Attempted to use Babylon.js Inspector | `scene.debugLayer.show()` | Error: Cannot read properties of undefined (reading 'Debug') |
| 21 | Disabled all shadow filtering options | `useExponentialShadowMap = false`, etc. | No change in shadow visibility |
| 22 | Forced shadow map to render every frame | `shadowMap.refreshRate = 0` | No change in shadow visibility |
| 23 | Added explicit logging for shadow casters | `console.log("Added mesh to shadow casters:", mesh.name)` | Confirmed shadow casters are being added correctly |
| 24 | Created a shadow test comparison page | `ShadowTestPage.tsx` | Confirmed minimal demo works but main app doesn't |
| 25 | Enabled transparent shadows | `shadowGenerator.transparencyShadow = true` | Improved shadow visibility in some cases |
| 26 | Created a new shadow implementation | `FixedShadows.ts` | Shadows visible in test page but not in main game |
| 27 | Created direct shadow implementation | `DirectShadows.ts` | **Shadows now visible** in main game |
| 28 | Modified engine creation options | Removed `{ preserveDrawingBuffer: true, stencil: true }` | Improved shadow compatibility |
| 29 | Changed light direction | From `(0, -1, 0)` to `(-1, -2, -1)` | Better shadow angles and visibility |

---

## Troubleshooting Log (2025-05) - Minimal Test Scene Debugging

After confirming the minimal demo worked standalone but not when integrated, focused on debugging a minimal setup (ground, box, light, shadow generator) directly within `BabylonSceneContent.tsx`.

| Step | Description | Code / Setting | Result | Shadow Map Preview |
|------|-------------|----------------|--------|--------------------|
| 30 | Initial minimal setup (Std. Generator, Dir. Light) | Basic setup | No shadow | Cyan/Green Checkerboard |
| 31 | Force Depth Buffer Clear | `flags.clearDepth = true` on RTT | No change | Cyan/Green Checkerboard |
| 32 | Use BackgroundMaterial for ground | `new BABYLON.BackgroundMaterial(...)` | No change | Cyan/Green Checkerboard |
| 33 | Set Engine Depth Function | `engine.setDepthFunction(BABYLON.Constants.LEQUAL)` | No change | Cyan/Green Checkerboard |
| 34 | Switch to PointLight | `new BABYLON.PointLight(...)` | No shadow | **White** (Depth clear OK, nothing rendered) |
| 35 | Adjust PointLight Frustum/Position | `shadowMinZ = 0.1`, `shadowMaxZ = 100`, `y=3` | No change | White |
| 36 | Force Depth Write on Caster Material | `testBoxMat.forceDepthWrite = true` | No change | White |
| 37 | Disable Picking on Caster | `testBox.isPickable = false` | No change | White |
| 38 | Disable Backface Culling / Set Visibility | `testBoxMat.backFaceCulling = false`, `testBox.visibility = 1` | No change | White |
| 39 | Force Engine State (Depth Write/Stencil) | `shadowGenerator.onBeforeShadowMapRenderObservable.add(...)` | No change | White |
| 40 | Explicitly Set Rendering Group ID | `testBox.renderingGroupId = 0` | No change | White |
| 41 | Explicitly Set Custom Shader Options (Default) | `shadowGenerator.customShaderOptions = { shaderName: "shadowMap" }` | No change | White |
| 42 | Explicitly Set Depth Scale (Default) | `shadowGenerator.depthScale = 50` | No change | White |
| 43 | Switch to CascadedShadowGenerator (CSM) | `new BABYLON.CascadedShadowGenerator(...)` + `DirectionalLight` | No shadow | **Black** (Depth comparison issue / bias?) |
| 44 | Increase CSM Bias | `shadowGenerator.bias = 0.05` | No change | Black |
| 45 | Add CSM Normal Bias | `shadowGenerator.normalBias = 0.02` | No change | Black |
| 46 | Reduce CSM Normal Bias | `shadowGenerator.normalBias = 0.005` | No change | Black |
| 47 | Switch CSM Filtering to PCF | `shadowGenerator.usePercentageCloserFiltering = true` | No change | Black |
| 48 | **Revert to Standard Generator + Minimal Demo Settings** | `ShadowGenerator`, `BlurESM`, `KernelBlur=32`, `bias=0.0005`, `transparencyShadow=true`, Light Dir `(-1,-2,-1)`, Pos `(5,15,5)` | **Shadow Visible on Test Cube!** | Correct Depth Silhouette |
| 49 | Re-introduce Textured Ground | `testGroundMat.diffuseTexture = grassTexture` | Shadow visible, but texture shows red/black checkerboard | Correct Depth Silhouette |
| 50 | Correct Texture Path | `new BABYLON.Texture("/textures/terrain_textures/grass.png", ...)` | Shadow visible, texture loads but is smoothed | Correct Depth Silhouette |
| 51 | Force Nearest Neighbor Filtering | `new BABYLON.Texture(..., true, true, BABYLON.Texture.NEAREST_SAMPLINGMODE)` | **Shadow visible, texture pixelated correctly!** | Correct Depth Silhouette |
| 52 | Restore Avatar | `useBabylonAvatar(...)` in `BabylonSceneContent.tsx` | Shadows still visible | Correct Depth Silhouette |
| 53 | Add all meshes to shadow caster list | `shadowGenerator.addShadowCaster(mesh)` in `forEach` and `onNewMeshAddedObservable` | Shadows still visible | Correct Depth Silhouette |
| 54 | Restore Skybox | `createSkybox(scene)` in `BabylonSceneContent.tsx` | **Shadows disappear**, Shadow Map Preview shows Cyan/Green Checkerboard | Cyan/Green Checkerboard |
| 55 | Modify Skybox Material | Remove `disableLighting`, `layerMask` from `StandardMaterial` in `createSkybox.ts` | No change | Cyan/Green Checkerboard |
| 56 | Disable Skybox | Comment out `createSkybox(scene)` | Shadows reappear | Correct Depth Silhouette |
| 57 | Modify Skybox Material | Set `renderingGroupId = 1` in `createSkybox.ts` | Scene disappears (only skybox visible) | N/A |
| 58 | Revert Skybox Material | Remove `renderingGroupId = 1` | Shadows disappear | Cyan/Green Checkerboard |
| 59 | Modify Skybox Material | Set `layerMask = 0x10000000` in `createSkybox.ts` | No change | Cyan/Green Checkerboard |
| 60 | Switch Skybox Material | Use `BackgroundMaterial` in `createSkybox.ts` | No change | Cyan/Green Checkerboard |
| 61 | Modify Skybox Material | Set `disableDepthWrite = true` on `BackgroundMaterial` | No change | Cyan/Green Checkerboard |
| 62 | Correct Shadow Caster Exclusion | Change `"skyBox"` to `"skybox_sphere"` in `BabylonSceneContent.tsx` | **Shadows visible!** | Correct Depth Silhouette |

---

### Summary of Results (Updated 2025-05-01 - Final)
- Render loop is running and scene/canvas/engine are valid.
- Minimal demo logic (ground, box, light, generator) initially produced **no shadow** or incorrect shadow maps (cyan/white/black) in the main app context.
- Extensive debugging ruled out issues with:
  - Basic light/generator/caster/receiver setup.
  - Depth buffer clearing.
  - Ground material type (`StandardMaterial` vs `BackgroundMaterial`).
  - Engine depth function state.
  - Light type (`PointLight` vs `DirectionalLight`).
  - Caster material properties (`forceDepthWrite`, `backFaceCulling`).
  - Caster mesh properties (`isPickable`, `visibility`, `renderingGroupId`).
  - Forced engine states (`setDepthWrite`, `setStencilBuffer`).
  - Shadow generator properties (`depthScale`, `customShaderOptions`).
  - `CascadedShadowGenerator` with various bias/filtering settings.
- **Solution (for test setup):** Precisely replicating the *exact* settings from the working minimal demo within `BabylonSceneContent.tsx` finally rendered shadows correctly on the test cube. Additionally, ensuring the ground texture was loaded with `noMipmap=true` and `samplingMode=NEAREST_SAMPLINGMODE` fixed the texture filtering.
- **Solution (for skybox conflict):** The skybox mesh was being incorrectly added to the shadow caster list due to a typo in the exclusion logic (`"skyBox"` instead of `"skybox_sphere"`). Correcting the name in the `onNewMeshAddedObservable` and `forEach` loops in `BabylonSceneContent.tsx` resolved the issue, allowing shadows to render correctly with the skybox present.

### Key Differences That Fixed the Test Setup (Updated 2025-05-01)

The combination of settings that finally worked for the minimal test setup (textured ground + box) within the main application context:

1. **Engine Creation**: Using minimal engine options (`{ preserveDrawingBuffer: false, stencil: false }` or default `true`) seems crucial for compatibility. (From 2025-04 log)
2. **Light Type & Configuration**:
   - Type: `BABYLON.DirectionalLight`
   - Direction: `new BABYLON.Vector3(-1, -2, -1).normalize()`
   - Position: `new BABYLON.Vector3(5, 15, 5)`
3. **Shadow Generator Type & Configuration**:
   - Type: `BABYLON.ShadowGenerator` (Standard, not Cascaded)
   - Map Size: `1024`
   - Filtering: Blur Exponential Shadow Map (`useBlurExponentialShadowMap = true`)
   - Blur Kernel: `useKernelBlur = true`, `blurKernel = 32`
   - Bias: `bias = 0.0005` (Small bias is critical)
   - Transparency: `transparencyShadow = true`
4. **Ground Texture Configuration**:
   - Load with `noMipmap = true`
   - Load with `samplingMode = BABYLON.Texture.NEAREST_SAMPLINGMODE`

*Note: It appears the shadow system in this context is highly sensitive, and deviating even slightly from this specific combination caused rendering failures (white/black maps). Texture filtering also required explicit parameter setting during texture creation.*

### Implementation (Previous - Kept for reference)
We created two shadow implementations:

1. `FixedShadows.ts` - Provides functions that match the working minimal demo:
   - `createReliableShadows()` - Creates a shadow generator with settings that match the working minimal demo
   - `createShadowTestScene()` - Creates a complete test scene with a ground, box, and light for shadow testing

2. `DirectShadows.ts` - A more direct approach that works in the main game:
   - `applyDirectShadows()` - Applies shadows directly to the scene with minimal configuration
   - `createShadowTestBox()` - Creates a simple test box that casts shadows

The `DirectShadows.ts` implementation is the one that finally worked in the main game. *(Self-correction: This was true before the deep dive debug, the current working solution is directly in BabylonSceneContent.tsx)*

### Final Solution (2025-05-01)
- The core issue was the skybox mesh (`"skybox_sphere"`) being incorrectly included in the shadow caster list due to a typo (`"skyBox"`) in the exclusion logic within `BabylonSceneContent.tsx`.
- Correcting the mesh name in the `onNewMeshAddedObservable` and `forEach` loops resolved the shadow map corruption and allowed shadows to render correctly alongside the skybox.
- The engine creation options (`preserveDrawingBuffer: false, stencil: false`) and specific shadow generator settings (Blur ESM, bias, etc.) remain important for overall shadow stability.

### Remaining Considerations (Updated 2025-05-01)
- **Performance**: Blur ESM with a large kernel can be performance-intensive. May need optimization later.
- **Browser Compatibility**: Test across different browsers.
- **Hardware Acceleration**: Test on different hardware if possible.

---

## Troubleshooting Log (2025-05-15) - Villager Shadow Casting Issues

After fixing the initial shadow issues, we encountered problems when trying to make the villager model cast shadows.

| Step | Description | Code / Setting | Result | Notes |
|------|-------------|----------------|--------|-------|
| 63 | Initial attempt to include villager in shadow casting | Removed "villager" from exclusion list in `createMinimalDemoShadows` | **No shadows visible at all** | Complete shadow system failure |
| 64 | Attempted to add villager meshes directly to shadow generator | Added code in VillagerNPC.tsx to call `shadowGenerator.addShadowCaster(mesh)` | Game crashed | Error in standardMaterial.ts about `_needNormals` property |
| 65 | Tried to force shadow generator compilation | Added `shadowGenerator.forceCompilation()` | Game crashed | Error in shader compilation |
| 66 | Reverted to original exclusion list | Re-added "villager" to exclusion list | Shadows working again, but villager not casting shadows | Confirmed shadow system is very sensitive |
| 67 | Minimal approach - only remove from exclusion list | Removed "villager" from exclusion list but kept all other code the same | **Shadows working with villager casting shadows** | Success! |

### Summary of Villager Shadow Casting Issues (2025-05-15)

The shadow system in Babylon.js proved to be extremely sensitive to changes. When attempting to make the villager model cast shadows, we encountered several issues:

1. **Complete Shadow Failure**: Our initial attempts to modify the shadow system to include the villager resulted in all shadows disappearing from the scene.

2. **Game Crashes**: More aggressive approaches, such as directly adding villager meshes to the shadow generator or forcing shadow generator compilation, caused the game to crash with errors related to shader compilation and material properties.

3. **Root Cause**: The shadow system's stability depends on a very specific configuration. Any deviation from this configuration, such as:
   - Attempting to manually add meshes to the shadow generator after it's created
   - Forcing shadow generator compilation
   - Modifying shadow parameters after initialization
   can cause the entire shadow system to fail.

4. **Solution**: The simplest and most effective approach was to make a minimal change - just removing "villager" from the exclusion list in the `createMinimalDemoShadows` function call:
   ```typescript
   const { shadowLight, shadowGenerator } = createMinimalDemoShadows(
     scene,
     ground,
     [ground.name, "skybox_sphere"] // Removed "villager" to allow it to cast shadows
   );
   ```

5. **Key Insight**: The shadow system works best when:
   - Configuration is set once at initialization
   - Minimal changes are made after initialization
   - The exclusion list is used to control which meshes cast shadows, rather than trying to manually add/remove meshes from the shadow generator

### Lessons Learned (2025-05-15)

1. **Minimal Changes**: When working with the shadow system, make the smallest possible changes to achieve the desired result.

2. **Avoid Runtime Modifications**: Avoid modifying the shadow generator or its parameters after initialization.

3. **Use Exclusion List**: Control shadow casting through the exclusion list rather than manually adding/removing meshes.

4. **Test Incrementally**: Make one small change at a time and test thoroughly before proceeding.

5. **Revert Quickly**: If shadows disappear or the game crashes, immediately revert to the last working configuration.

These insights will be valuable for future shadow-related modifications, such as adding new models or optimizing shadow performance.

---
