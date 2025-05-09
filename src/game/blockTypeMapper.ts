// src/game/blockTypeMapper.ts
// Utility for mapping and handling block types with fallbacks

// Disable logging for block type mapping operations
// This is a no-op function that will be used instead of console.log
const noopLog = (...args: any[]) => { /* No operation */ };

import { getBlockTypeById, BLOCK_TYPES } from './blockTypes';

// Map of block type categories to fallback block types
// This helps ensure that even if a specific block type isn't available,
// we can use a similar block type as a fallback
const BLOCK_TYPE_CATEGORIES: Record<string, string[]> = {
  // Wood-related blocks
  wood: ['log_spruce', 'planks_spruce', 'planks_oak', 'log_oak'],

  // Stone-related blocks
  stone: ['stone', 'cobblestone', 'stone_brick', 'mossy_cobblestone'],

  // Dirt-related blocks
  dirt: ['dirt', 'grass', 'gravel'],

  // Sand-related blocks
  sand: ['sand', 'sandstone'],

  // Decorative blocks
  decorative: ['glass', 'glass_pane', 'bookshelf', 'wool_white'],

  // Ore blocks
  ore: ['gold_ore', 'iron_ore', 'coal_ore', 'diamond_ore', 'redstone_ore'],

  // Metal blocks
  metal: ['gold_block', 'iron_block', 'diamond_block'],

  // Miscellaneous blocks
  misc: ['brick', 'clay', 'obsidian', 'glowstone', 'snow_block', 'ice']
};

// Map of block types to their categories
const BLOCK_TYPE_TO_CATEGORY: Record<string, string> = {};

// Initialize the block type to category mapping
Object.entries(BLOCK_TYPE_CATEGORIES).forEach(([category, blockTypes]) => {
  blockTypes.forEach(blockType => {
    BLOCK_TYPE_TO_CATEGORY[blockType] = category;
  });
});

// Default fallback order for block types
const DEFAULT_FALLBACK_ORDER = ['stone', 'dirt', 'planks_spruce', 'log_spruce', 'sand'];

/**
 * Get a valid block type ID, using fallbacks if necessary
 *
 * @param blockTypeId - The requested block type ID
 * @returns A valid block type ID that exists in the game
 */
export function getValidBlockTypeId(blockTypeId: string): string {
  try {
    // Safety check for invalid input
    if (!blockTypeId || typeof blockTypeId !== 'string') {
      console.error(`Invalid blockTypeId: ${blockTypeId}, using stone as fallback`);
      return 'stone';
    }

    // Special case for air blocks - preserve them as 'air'
    if (blockTypeId === 'air') {
      return 'air';
    }

    // Check if the block type exists directly
    if (getBlockTypeById(blockTypeId)) {
      return blockTypeId;
    }

    // Try to find a fallback in the same category
    const category = BLOCK_TYPE_TO_CATEGORY[blockTypeId];
    if (category) {
      // Get all block types in this category
      const categoryBlockTypes = BLOCK_TYPE_CATEGORIES[category];

      // Find the first available block type in this category
      for (const fallbackType of categoryBlockTypes) {
        if (getBlockTypeById(fallbackType)) {
          noopLog(`Using fallback block type ${fallbackType} for ${blockTypeId} (same category)`);
          return fallbackType;
        }
      }
    }

    // If no category fallback found, use the default fallback order
    for (const fallbackType of DEFAULT_FALLBACK_ORDER) {
      if (getBlockTypeById(fallbackType)) {
        noopLog(`Using fallback block type ${fallbackType} for ${blockTypeId} (default fallback)`);
        return fallbackType;
      }
    }

    // If all else fails, return the first available block type
    const firstAvailableType = BLOCK_TYPES[0]?.id;
    if (firstAvailableType) {
      noopLog(`Using first available block type ${firstAvailableType} for ${blockTypeId} (last resort)`);
      return firstAvailableType;
    }

    // This should never happen unless there are no block types defined
    console.error(`No valid block types found for ${blockTypeId}`);
    return 'stone';
  } catch (error) {
    // Catch any unexpected errors and return a safe fallback
    console.error(`Unexpected error in getValidBlockTypeId for ${blockTypeId}:`, error);
    return 'stone';
  }
}

/**
 * Get a mapping of all block types in a blueprint to valid block types
 *
 * @param blockTypeIds - Array of block type IDs used in a blueprint
 * @returns Mapping of original block type IDs to valid block type IDs
 */
export function getBlockTypeMapping(blockTypeIds: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  try {
    // Safety check for invalid input
    if (!blockTypeIds || !Array.isArray(blockTypeIds)) {
      console.error(`Invalid blockTypeIds: ${blockTypeIds}, returning empty mapping`);
      return mapping;
    }

    blockTypeIds.forEach(blockTypeId => {
      try {
        // Skip invalid block type IDs
        if (!blockTypeId || typeof blockTypeId !== 'string') {
          console.warn(`Invalid blockTypeId in array: ${blockTypeId}, skipping`);
          return;
        }

        mapping[blockTypeId] = getValidBlockTypeId(blockTypeId);
      } catch (error) {
        // If there's an error, use a safe fallback
        console.error(`Error mapping block type ID ${blockTypeId}:`, error);
        mapping[blockTypeId] = 'stone'; // Safe fallback
      }
    });
  } catch (error) {
    // Catch any unexpected errors
    console.error(`Unexpected error in getBlockTypeMapping:`, error);
  }

  return mapping;
}
