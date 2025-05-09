// src/game/blockTypes.ts
import { Texture, DynamicTexture, Scene, BaseTexture } from '@babylonjs/core';
import { BlockType } from '../types/game';
import { getBabylonProceduralTexture } from './babylonProceduralWrappers';
import { getBlockTypes, refreshBlockTypes } from './dynamicBlockTypes';

// This file uses dynamic block types loaded from the texture files in public/textures/block_textures
// The block types are loaded from the server API when the game starts
// If new textures are added, they will be automatically loaded as new block types

// Initial block types - only air is included by default
// We'll load the rest from the server before the application starts
const INITIAL_BLOCK_TYPES: BlockType[] = [
  {
    id: 'air',
    name: 'Air',
    // Air has no texture as it's invisible
  }
];

// For backward compatibility, export the BLOCK_TYPES array
// This will be populated with the dynamic block types when they are loaded
export let BLOCK_TYPES: BlockType[] = [...INITIAL_BLOCK_TYPES];

// Flag to track if block types have been loaded
let blockTypesLoaded = false;

// Export a function to get all block types
// This is a wrapper around the dynamic block types loader
export async function getAllBlockTypes(forceRefresh = false): Promise<BlockType[]> {
  try {
    const types = await getBlockTypes(forceRefresh);
    BLOCK_TYPES = types; // Update the exported array
    blockTypesLoaded = true;
    return types;
  } catch (error) {
    console.error('Error loading dynamic block types:', error);
    throw error; // Re-throw to handle at application level
  }
}

// Function to check if block types are loaded
export function areBlockTypesLoaded(): boolean {
  return blockTypesLoaded;
}

// Function to load block types synchronously (blocks until complete)
export async function loadBlockTypesSync(): Promise<void> {
  if (!blockTypesLoaded) {
    BLOCK_TYPES = await getAllBlockTypes(true);
    console.log(`Loaded ${BLOCK_TYPES.length} block types synchronously`);
  }
}

// Utility: get block type by ID
export function getBlockTypeById(id: string): BlockType | null {
  // Special case for air blocks
  if (id === 'air') {
    return {
      id: 'air',
      name: 'Air',
    };
  }

  return BLOCK_TYPES.find(type => type.id === id) || null;
}

// Utility: refresh block types
export async function refreshAllBlockTypes(): Promise<BlockType[]> {
  try {
    BLOCK_TYPES = await refreshBlockTypes();
    console.log(`Refreshed ${BLOCK_TYPES.length} block types`);
    return BLOCK_TYPES;
  } catch (error) {
    console.error('Error refreshing block types:', error);
    return BLOCK_TYPES;
  }
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
