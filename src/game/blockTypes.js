// src/game/blockTypes.js
/* global BABYLON */
// Modular config for all block types used in the game
// Each block type has a unique ID, display name, and texture path (relative to assets/textures/)
// Extendable: add new block types here without changing core logic
// If a texture file is not found at runtime, a Babylon.js procedural texture will be used as a fallback.

export const BLOCK_TYPES = [
  {
    id: 'grass',
    name: 'Grass Block',
    texture: 'textures/grass.png',
    procedural: 'GrassProceduralTexture', // fallback procedural type
  },
  {
    id: 'stone',
    name: 'Stone Block',
    texture: 'textures/stone.png',
    procedural: 'MarbleProceduralTexture',
  },
  {
    id: 'wood',
    name: 'Wood Block',
    texture: 'textures/wood.png',
    procedural: 'WoodProceduralTexture',
  },
  {
    id: 'sand',
    name: 'Sand Block',
    texture: 'textures/sand.png',
    procedural: 'CloudProceduralTexture',
  },
  // Add more block types as needed
];

// Utility: get block type by ID
export function getBlockTypeById(id) {
  return BLOCK_TYPES.find(type => type.id === id) || null;
}

/**
 * Loads a Babylon.js texture for a block, using a procedural texture if the file is missing or fails to load.
 * @param {object} params
 * @param {string} params.texturePath - Relative path to the texture file
 * @param {string} params.procedural - Name of the Babylon.js procedural texture class
 * @param {BABYLON.Scene} params.scene - Babylon.js scene
 * @returns {Promise<BABYLON.BaseTexture>} Resolves to a Babylon.js Texture or ProceduralTexture
 */
export async function loadBlockTexture({ texturePath, procedural, scene }) {
  return new Promise((resolve) => {
    const url = texturePath;
    const tex = new window.BABYLON.Texture(url, scene, false, false, BABYLON.Texture.TRILINEAR_SAMPLINGMODE, 
      () => resolve(tex),
      () => {
        // On error, use procedural
        let procTex;
        switch (procedural) {
          case 'GrassProceduralTexture':
            procTex = new window.BABYLON.GrassProceduralTexture('grassProc', 256, scene);
            break;
          case 'MarbleProceduralTexture':
            procTex = new window.BABYLON.MarbleProceduralTexture('marbleProc', 256, scene);
            break;
          case 'WoodProceduralTexture':
            procTex = new window.BABYLON.WoodProceduralTexture('woodProc', 256, scene);
            break;
          case 'CloudProceduralTexture':
            procTex = new window.BABYLON.CloudProceduralTexture('cloudProc', 256, scene);
            break;
          default:
            procTex = new window.BABYLON.DynamicTexture('fallbackDyn', {width:256, height:256}, scene, false);
            procTex.drawText('?', 100, 150, 'bold 120px Arial', 'red', 'white', true);
        }
        resolve(procTex);
      }
    );
  });
}
