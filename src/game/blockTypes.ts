// src/game/blockTypes.ts
import { Texture, DynamicTexture, Scene, BaseTexture } from '@babylonjs/core';
import { BlockType } from '../types/game';
import { getBabylonProceduralTexture } from './babylonProceduralWrappers';

// Modular config for all block types used in the game
// Each block type has a unique ID, display name, and texture path (relative to assets/textures/)
// Extendable: add new block types here without changing core logic
// If a texture file is not found at runtime, a Babylon.js procedural texture will be used as a fallback.

// BLOCK_TYPES now uses Minecraft-compatible textures from public/textures/block_textures
export const BLOCK_TYPES: BlockType[] = [
  {
    id: 'dirt',
    name: 'Dirt Block',
    texture: '/textures/block_textures/dirt.png',
  },
  {
    id: 'stone',
    name: 'Stone Block',
    texture: '/textures/block_textures/stone.png',
  },
  {
    id: 'sand',
    name: 'Sand Block',
    texture: '/textures/block_textures/sand.png',
  },
  {
    id: 'log_spruce',
    name: 'Spruce Log',
    texture: '/textures/block_textures/log_spruce.png',
  },
  {
    id: 'planks_spruce',
    name: 'Spruce Planks',
    texture: '/textures/block_textures/planks_spruce.png',
  },
  {
    id: 'leaves_spruce',
    name: 'Spruce Leaves',
    texture: '/textures/block_textures/leaves_spruce.png',
  },
];

// Utility: get block type by ID
export function getBlockTypeById(id: string): BlockType | null {
  return BLOCK_TYPES.find(type => type.id === id) || null;
}

interface LoadBlockTextureParams {
  texturePath: string;
  procedural: string;
  scene: Scene;
}

/**
 * Loads a Babylon.js texture for a block, using a procedural texture if the file is missing or fails to load.
 * @param params - Parameters for loading the texture
 * @param params.texturePath - Relative path to the texture file
 * @param params.procedural - Name of the Babylon.js procedural texture class
 * @param params.scene - Babylon.js scene
 * @returns Promise resolving to a Babylon.js Texture or ProceduralTexture
 */
export async function loadBlockTexture({ texturePath, procedural, scene }: LoadBlockTextureParams): Promise<BaseTexture> {
  return new Promise((resolve) => {
    const url = texturePath;
    const tex = new Texture(url, scene, false, false, Texture.TRILINEAR_SAMPLINGMODE,
      () => resolve(tex),
      () => {
        // On error, use Babylon.js built-in procedural texture fallback (modular)
        let procTex = getBabylonProceduralTexture(procedural, procedural + '_fallback', 256, scene);
        if (!procTex) {
          // fallback: blank dynamic texture with question mark
          const dynamicTexture = new DynamicTexture('fallback', { width: 256, height: 256 }, scene, false);
          dynamicTexture.drawText('?', 100, 150, 'bold 120px Arial', 'red', 'white', true);
          procTex = dynamicTexture;
        }
        resolve(procTex);
      }
    );
  });
}
