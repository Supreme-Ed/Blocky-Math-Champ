// src/components/scene/ShadowOnlyMaterial.ts
// A specialized material that only shows shadows

import * as BABYLON from '@babylonjs/core';

/**
 * Helper function to recursively set shadow properties on all meshes in a model.
 * This is especially useful for imported models where the root node might be a TransformNode.
 *
 * @param node - The node to process (can be a Mesh, TransformNode, or any other node)
 * @param shadowGenerator - The shadow generator to use
 * @param shouldCastShadow - Whether the node should cast shadows
 * @param shouldReceiveShadow - Whether the node should receive shadows
 */
export function setShadowsRecursively(
  node: BABYLON.Node,
  shadowGenerator: BABYLON.ShadowGenerator,
  shouldCastShadow: boolean = true,
  shouldReceiveShadow: boolean = false
): void {
  // Skip null nodes
  if (!node) return;

  // Process the current node if it's a mesh
  if (node instanceof BABYLON.AbstractMesh) {
    // Skip skybox, ground, and sun meshes
    if (node.name === 'skybox' || node.name === 'sunMesh' || node.name.includes('ground')) {
      return;
    }

    // Set shadow casting
    if (shouldCastShadow) { // Removed !node.name.includes('ground') as it's checked above
      try {
        shadowGenerator.addShadowCaster(node, true);
        console.log(`Added shadow caster (recursive): ${node.name}`);
      } catch (error) {
        console.warn(`Failed to add shadow caster for mesh (recursive): ${node.name}`, error);
      }
    }

    // Set shadow receiving
    if (shouldReceiveShadow) { // Removed || node.name.includes('ground') as ground is handled separately
      node.receiveShadows = true;
      console.log(`Set to receive shadows (recursive): ${node.name}`);
    }
  }

  // Process children recursively
  if (node.getChildren) {
    const children = node.getChildren();
    for (let i = 0; i < children.length; i++) {
      setShadowsRecursively(children[i], shadowGenerator, shouldCastShadow, shouldReceiveShadow);
    }
  }
}

/**
 * Creates a shadow-only material that can be used to visualize shadows.
 * This material will only show shadows and nothing else.
 *
 * @param scene - The Babylon.js scene
 * @returns The created shadow-only material
 */
export function createShadowOnlyMaterial(scene: BABYLON.Scene): BABYLON.ShaderMaterial {
  // Define the vertex shader
  const vertexShader = `
    precision highp float;

    // Attributes
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec2 uv;

    // Uniforms
    uniform mat4 world;
    uniform mat4 worldViewProjection;

    // Varying
    varying vec2 vUV;

    void main(void) {
      gl_Position = worldViewProjection * vec4(position, 1.0);
      vUV = uv;
    }
  `;

  // Define the fragment shader
  const fragmentShader = `
    precision highp float;

    // Varying
    varying vec2 vUV;

    // Uniforms
    uniform sampler2D textureSampler;

    void main(void) {
      // Just output white color - shadows will be applied by the shadow receiver
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
  `;

  // Register the shader code in the ShadersStore
  BABYLON.Effect.ShadersStore["customVertexShader"] = vertexShader;
  BABYLON.Effect.ShadersStore["customFragmentShader"] = fragmentShader;

  // Create a custom shader material using the registered shaders
  const shaderMaterial = new BABYLON.ShaderMaterial(
    "shadowOnly",
    scene,
    {
      vertex: "custom", // Use the name registered in ShadersStore
      fragment: "custom", // Use the name registered in ShadersStore
    },
    {
      attributes: ["position", "normal", "uv"],
      uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"]
    }
  );

  // Make it receive shadows and disable alpha blending
  shaderMaterial.alphaMode = BABYLON.Constants.ALPHA_DISABLE; // Correct way to disable alpha blending
  shaderMaterial.backFaceCulling = false;

  return shaderMaterial;
}

/**
 * Creates a simple shadow visualization scene.
 * This creates a ground plane with a shadow-only material.
 *
 * @param scene - The Babylon.js scene
 * @returns Object containing the created ground mesh, shadow generator, and light
 */
export function createShadowVisualizationScene(scene: BABYLON.Scene): {
  ground: BABYLON.Mesh;
  shadowGenerator: BABYLON.ShadowGenerator;
  light: BABYLON.DirectionalLight;
} {
  // Create a ground plane
  const ground = BABYLON.MeshBuilder.CreateGround(
    "shadowVisualizationGround",
    { width: 20, height: 20 },
    scene
  );

  // Create a standard white material for the ground (shadows will be projected onto this)
  const groundMaterial = new BABYLON.StandardMaterial("shadowGroundMaterial", scene);
  groundMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1); // White
  groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // No specular
  groundMaterial.ambientColor = new BABYLON.Color3(1, 1, 1); // Full ambient to see shadows clearly
  ground.material = groundMaterial;

  // Create a directional light for shadows
  const light = new BABYLON.DirectionalLight(
    "shadowLight",
    // new BABYLON.Vector3(0, -1, 0.2).normalize(), // Slight angle for better shadows
    new BABYLON.Vector3(0, -1, 0).normalize(), // Try straight down
    scene
  );
  light.position = new BABYLON.Vector3(0, 10, 0); // Position directly above origin
  light.intensity = 1.0;

  // Set shadow parameters - try very wide frustum
  light.shadowMinZ = 0.1; // Very close near plane
  light.shadowMaxZ = 100; // Very far far plane

  console.log("Shadow light created:", {
    name: light.name,
    direction: light.direction,
    position: light.position,
    shadowMinZ: light.shadowMinZ,
    shadowMaxZ: light.shadowMaxZ
  });

  // Create a shadow generator with improved settings
  const shadowGenerator = new BABYLON.ShadowGenerator(2048, light); // Higher resolution

  // --- Use Standard Shadow Mapping ---
  shadowGenerator.useCloseExponentialShadowMap = false;
  shadowGenerator.useBlurExponentialShadowMap = false;
  shadowGenerator.usePoissonSampling = true; // Use standard Poisson sampling
  shadowGenerator.setDarkness(0.5); // Standard darkness
  shadowGenerator.bias = 0.005; // Adjust bias for standard shadows (might need tuning)
  shadowGenerator.depthScale = 50.0; // Explicitly set default depth scale
  console.log("Set shadowGenerator.depthScale to:", shadowGenerator.depthScale);
  // --- End Settings ---

  const shadowMap = shadowGenerator.getShadowMap();
  if (shadowMap) {
    // --- Explicitly set texture type and format for depth ---
    const internalTexture = shadowMap.getInternalTexture();
    if (internalTexture) {
      // Check engine capabilities for depth textures
      const engine = scene.getEngine();
      const caps = engine.getCaps();
      if (caps.depthTextureExtension) { // Corrected property name
        internalTexture.type = BABYLON.Constants.TEXTURETYPE_UNSIGNED_INT; // Common for depth
        internalTexture.format = BABYLON.Constants.TEXTUREFORMAT_DEPTH16; // Corrected constant name
        console.log("Set shadow map texture type to UNSIGNED_INT and format to DEPTH16.");
      } else if (caps.textureFloat && caps.textureFloatLinearFiltering) {
        // Fallback to float texture if depth textures not fully supported
        internalTexture.type = BABYLON.Constants.TEXTURETYPE_FLOAT;
        internalTexture.format = BABYLON.Constants.TEXTUREFORMAT_R; // Store depth in Red channel
        console.log("Set shadow map texture type to FLOAT and format to R (depth texture fallback).");
      } else {
        console.warn("Neither Depth Texture Extension nor Float Textures seem fully supported. Shadow map format might be incorrect.");
      }
    }
    // --- End Texture Format Setting ---

    shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE; // Render once initially
    // Or use BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME for continuous updates
  }

  // Disable contact hardening as it's often used with ESM/VSM variants
  shadowGenerator.useContactHardeningShadow = false;

  console.log("Shadow generator created (Standard Poisson):", {
    mapSize: shadowMap?.getRenderSize(), // Add null check
    darkness: shadowGenerator.getDarkness(),
    bias: shadowGenerator.bias,
    usePoissonSampling: shadowGenerator.usePoissonSampling,
    depthScale: shadowGenerator.depthScale // Log depth scale
  });

  // Make the ground receive shadows
  ground.receiveShadows = true;

  // --- MODIFY SHADOW CASTERS ---
  // Comment out automatic adding for now
  /*
  scene.onNewMeshAddedObservable.add(mesh => {
    // Skip meshes that shouldn't cast shadows
    if (mesh.name === 'skybox' || mesh.name.includes('ground') || mesh.name === 'sunMesh') {
      return;
    }

    try {
      // Add mesh to shadow casters
      shadowGenerator.addShadowCaster(mesh, true);
      console.log(`Added new mesh to shadow casters: ${mesh.name}`);
    } catch (error) {
      console.warn(`Failed to add shadow caster for mesh: ${mesh.name}`, error);
    }
  });

  scene.rootNodes.forEach(node => {
    setShadowsRecursively(node, shadowGenerator, true, false);
  });

  scene.transformNodes.forEach(node => {
    setShadowsRecursively(node, shadowGenerator, true, false);
  });
  */

  // Explicitly add ONLY the test box
  // Use a timeout to ensure the box exists in the scene when this runs
  setTimeout(() => {
    const testBox = scene.getMeshByName("shadowTestBox");
    if (testBox) {
      shadowGenerator.addShadowCaster(testBox, true);
      console.log(`Explicitly added shadow caster: ${testBox.name}`);
      // Force shadow map refresh after adding caster
      if (shadowMap) {
        shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME;
        shadowMap.refreshRate = BABYLON.RenderTargetTexture.REFRESHRATE_RENDER_ONCE; // Set back if needed
      }
    } else {
      console.warn("Could not find shadowTestBox to add as caster.");
    }
  }, 100); // Delay slightly (100ms)

  // --- END MODIFY SHADOW CASTERS ---

  // Create a debug layer to visualize the shadow map (uncomment to enable)
  /*
  const shadowMapViewer = new BABYLON.DebugLayer(scene);
  shadowMapViewer.displayShadowMap(shadowGenerator);
  console.log("Shadow map viewer enabled");
  */

  return {
    ground,
    shadowGenerator,
    light
  };
}
