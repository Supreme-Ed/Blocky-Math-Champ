// src/components/CubePlatform.js
// Modular Babylon.js cube platform with math answer rendering and procedural texture fallback
import { loadBlockTexture, getBlockTypeById } from '../game/blockTypes.js';

import { MeshBuilder, Vector3, StandardMaterial, Color3, DynamicTexture, MultiMaterial, SubMesh, Texture } from '@babylonjs/core';
import { normalMapFromHeightmap } from './normalMapFromHeightmap.js';

/**
 * Creates a Babylon.js box mesh representing a cube platform with a math answer rendered on its face.
 * If the block texture is missing, uses a procedural Babylon.js texture as fallback.
 *
 * @param {object} params
 * @param {BABYLON.Scene} params.scene - Babylon.js scene
 * @param {string} params.blockTypeId - Block type ID (e.g., 'grass', 'stone')
 * @param {string|number} params.answer - Math answer to display
 * @param {object} params.position - { x, y, z } position for the cube
 * @param {number} [params.size=2] - Size of the cube
 * @returns {BABYLON.Mesh} The created cube mesh
 */
export async function createCubePlatform({ scene, blockTypeId, answer, position, size = 2 }) {
  if (!scene || !blockTypeId) throw new Error('scene and blockTypeId are required');
  const blockType = getBlockTypeById(blockTypeId);
  if (!blockType) throw new Error(`Block type '${blockTypeId}' not found`);

  // Create the box mesh
  const box = MeshBuilder.CreateBox(`cube_${blockTypeId}_${answer}`, { size }, scene);
  box.position = new Vector3(position.x, position.y, position.z);


  // Create a DynamicTexture for the answer text
  const dynTex = new DynamicTexture(
    `answerTex_${answer}`,
    { width: 256, height: 256 },
    scene,
    false
  );
  dynTex.hasAlpha = true;
  // Draw the answer text at the center of the DynamicTexture with centerInRect=true (no transforms)
  // Create a heightmap (white text on black background) for the number
  const heightmapTex = new DynamicTexture(
    `answerHeightmap_${answer}`,
    { width: 256, height: 256 },
    scene,
    false
  );
  heightmapTex.hasAlpha = false;
  const heightmapCtx = heightmapTex.getContext();
  heightmapCtx.clearRect(0, 0, heightmapTex.getSize().width, heightmapTex.getSize().height);
  heightmapCtx.fillStyle = 'black';
  heightmapCtx.fillRect(0, 0, heightmapTex.getSize().width, heightmapTex.getSize().height);
  heightmapCtx.font = 'bold 96px Arial';
  const text = String(answer);
  const metrics = heightmapCtx.measureText(text);
  const textWidth = metrics.width;
  const fontSize = 96;
  const x = (heightmapTex.getSize().width - textWidth) / 2;
  const y = (heightmapTex.getSize().height + fontSize * 0.7) / 2;
  heightmapCtx.fillStyle = 'white';
  heightmapCtx.textAlign = 'left';
  heightmapCtx.textBaseline = 'alphabetic';
  heightmapCtx.font = 'bold 96px Arial';
  heightmapCtx.fillText(text, x, y);
  heightmapTex.update();

  // Generate a normal map from the heightmap using the modular utility
  const normalMapCanvas = normalMapFromHeightmap(heightmapTex._canvas, 2.0);
  // Create a Babylon DynamicTexture from the normal map canvas (drawImage method for compatibility)
  const normalMapTex = new DynamicTexture(
    `answerNormalMap_${answer}`,
    { width: 256, height: 256 },
    scene,
    false
  );
  const normalMapCtx = normalMapTex.getContext();
  normalMapCtx.clearRect(0, 0, 256, 256);
  normalMapCtx.drawImage(normalMapCanvas, 0, 0);
  normalMapTex.update();
  normalMapTex.hasAlpha = false;

  // Load block texture (with procedural fallback) once and use for both materials
  const blockDiffuseTexture = await loadBlockTexture({
    texturePath: blockType.texture,
    procedural: blockType.procedural,
    scene,
  });
  // Disable smoothing (nearest neighbor filtering) for pixelated look
  if (blockDiffuseTexture && blockDiffuseTexture.updateSamplingMode) {
    blockDiffuseTexture.updateSamplingMode(Texture.NEAREST_NEAREST_MIPNEAREST);
  }

  // Material for the block texture (all faces except answer face)
  const blockMat = new StandardMaterial(`blockMat_${blockTypeId}_${answer}`, scene);
  blockMat.diffuseTexture = blockDiffuseTexture;

  // Create an overlay emissive texture for the number (white text on transparent)
  const overlayTex = new DynamicTexture(
    `answerOverlay_${answer}`,
    { width: 256, height: 256 },
    scene,
    false
  );
  overlayTex.hasAlpha = true;
  const overlayCtx = overlayTex.getContext();
  overlayCtx.clearRect(0, 0, overlayTex.getSize().width, overlayTex.getSize().height);
  overlayCtx.font = 'bold 96px Arial';
  overlayCtx.fillStyle = 'white';
  overlayCtx.textAlign = 'left';
  overlayCtx.textBaseline = 'alphabetic';
  const overlayText = String(answer);
  const overlayMetrics = overlayCtx.measureText(overlayText);
  const overlayTextWidth = overlayMetrics.width;
  const overlayFontSize = 96;
  const overlayX = (overlayTex.getSize().width - overlayTextWidth) / 2;
  const overlayY = (overlayTex.getSize().height + overlayFontSize * 0.7) / 2;
  // Rotate overlay canvas 180° so numbers render right-side-up on cube face
  const { width: tw, height: th } = overlayTex.getSize();
  overlayCtx.save();
  overlayCtx.translate(tw/2, th/2);
  overlayCtx.translate(-tw/2, -th/2);
  overlayCtx.fillText(overlayText, overlayX, overlayY);
  overlayCtx.restore();
  overlayTex.update();

  // Material for the answer face (number as bump/embossed + emissive overlay)
  const answerMat = new StandardMaterial(`answerMat_${blockTypeId}_${answer}`, scene);
  answerMat.diffuseTexture = blockDiffuseTexture; // keep block texture visible
  answerMat.bumpTexture = normalMapTex; // number as bump/embossed effect
  answerMat.bumpTexture.level = 3; // Stronger effect
  answerMat.emissiveTexture = overlayTex; // number as emissive overlay
  answerMat.useEmissiveAsIllumination = true;
  answerMat.alpha = 1.0; // Ensure not transparent
  answerMat.specularColor = new Color3(0,0,0);
  answerMat.emissiveColor = new Color3(0,0,0);

  // --- MultiMaterial setup for per-face materials ---
  // Babylon.js box face order: 0=front, 1=?, 2=?, 3=?, 4=top, 5=?
  const multiMat = new MultiMaterial(`multiMat_${blockTypeId}_${answer}`, scene);
  // Restore answer material on front face (index 0)
  multiMat.subMaterials = [answerMat, blockMat, blockMat, blockMat, blockMat, blockMat];
  box.material = multiMat;

  // Remove any existing subMeshes (important for re-use)
  if (box.subMeshes) box.subMeshes.forEach(sm => sm.dispose());
  box.subMeshes = [];
  // Each face: 2 triangles, 6 indices per face. Babylon.js box geometry is always 6 faces, 12 triangles, 36 indices.
  for (let i = 0; i < 6; i++) {
    box.subMeshes.push(new SubMesh(i, 0, box.getTotalVertices(), i * 6, 6, box));
  }

  // Rotate cube so the front face (index 0) faces the camera
  box.rotation = new Vector3(0, 0, Math.PI);

  // Optionally, assign the answer as metadata for interaction
  box.metadata = { answer, blockTypeId };

  return box;
}

// Example usage (for integration/testing):
// await createCubePlatform({
//   scene: myScene,
//   blockTypeId: 'grass',
//   answer: 42,
//   position: { x: 0, y: 1, z: 0 },
// });
