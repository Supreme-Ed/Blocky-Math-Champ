// src/game/minecraftBlockMapper.ts
// Maps Minecraft block IDs and names to our game's block types

import { BLOCK_TYPES, getBlockTypeById } from './blockTypes';
import { sendBlockMapping } from './blockMappingClient';

// Disable logging for block mapping operations
// This is a no-op function that will be used instead of console.debug
const noopLog = (...args: any[]) => { /* No operation */ };

/**
 * Map a Minecraft block ID to our game's block type
 * @param blockId - The Minecraft block ID
 * @param blockData - The Minecraft block data value
 * @param sourceFile - The source NBT file (optional)
 * @returns The corresponding block type in our game
 */
export function mapMinecraftBlockId(blockId: number, blockData: number, sourceFile: string = ''): string {
  // Block ID to block type mapping for classic schematic format
  const BLOCK_ID_MAPPING: Record<number, string> = {
    1: 'stone',
    2: 'dirt',
    3: 'dirt',
    4: 'cobblestone',
    5: 'planks_oak',
    6: 'sapling_oak',
    7: 'stone',
    8: 'water',
    9: 'water',
    12: 'sand',
    17: 'log_oak',
    18: 'leaves_oak',
    20: 'glass',
    24: 'sandstone',
    35: 'wool_white',
    41: 'gold_block',
    42: 'iron_block',
    43: 'stone_slab',
    44: 'stone_slab',
    45: 'brick',
    47: 'bookshelf',
    48: 'moss_stone',
    49: 'obsidian',
    50: 'torch',
    53: 'oak_stairs',
    54: 'chest',
    58: 'crafting_table',
    60: 'farmland',
    61: 'furnace',
    62: 'furnace_lit',
    64: 'wooden_door',
    65: 'ladder',
    67: 'stone_stairs',
    73: 'redstone_ore',
    78: 'snow',
    79: 'ice',
    80: 'snow_block',
    81: 'cactus',
    82: 'clay',
    85: 'fence_oak',
    89: 'glowstone',
    98: 'stone_brick',
    102: 'glass_pane',
    103: 'melon',
    107: 'fence_gate_oak',
    246: 'glowing_obsidian',
  };

  // Default fallback block type if mapping is not found
  const DEFAULT_BLOCK_TYPE = 'stone';

  // Get the mapped block type
  const mappedType = BLOCK_ID_MAPPING[blockId] || DEFAULT_BLOCK_TYPE;

  // Check if the mapped type exists in the game
  const isValidType = BLOCK_TYPES.some(type => type.id === mappedType);

  // If not valid, use stone as fallback
  const finalType = isValidType ? mappedType : DEFAULT_BLOCK_TYPE;

  // Log the mapping to the server
  sendBlockMapping(blockId.toString(), finalType, 'id', sourceFile);

  return finalType;
}

/**
 * Map a Minecraft block name to our game's block type
 * @param blockName - The Minecraft block name (with or without minecraft: prefix)
 * @param sourceFile - The source NBT file (optional)
 * @returns The corresponding block type in our game
 */
export function mapMinecraftBlockName(blockName: string, sourceFile: string = ''): string {
  // Remove the minecraft: prefix if present
  const name = blockName.replace('minecraft:', '');

  // Special case for air blocks - these should not be rendered
  if (name === 'air') {
    // Make sure to send this mapping to the server
    sendBlockMapping('minecraft:air', 'air', 'name', sourceFile);
    return 'air';
  }

  // Map of Minecraft block names to our game's block types
  const BLOCK_NAME_MAPPING: Record<string, string> = {
    'stone': 'stone',
    'dirt': 'dirt',
    'grass_block': 'dirt',
    'cobblestone': 'cobblestone',
    'oak_planks': 'planks_oak',
    'spruce_planks': 'planks_spruce',
    'birch_planks': 'planks_birch',
    'jungle_planks': 'planks_jungle',
    'acacia_planks': 'planks_acacia',
    'dark_oak_planks': 'planks_dark_oak',
    'oak_sapling': 'sapling_oak',
    'water': 'water',
    'lava': 'lava',
    'sand': 'sand',
    'oak_log': 'log_oak',
    'spruce_log': 'log_spruce',
    'birch_log': 'log_birch',
    'jungle_log': 'log_jungle',
    'oak_leaves': 'leaves_oak',
    'spruce_leaves': 'leaves_spruce',
    'birch_leaves': 'leaves_birch',
    'jungle_leaves': 'leaves_jungle',
    'glass': 'glass',
    'sandstone': 'sandstone',
    // Eiffel Tower specific blocks
    'andesite': 'stone',
    'polished_andesite': 'stone',
    'iron_bars': 'iron_bars',
    'iron_block': 'iron_block',
    'white_wool': 'wool_white',
    'gold_block': 'gold_block',
    'stone_slab': 'stone_slab',
    'brick': 'brick',
    'bookshelf': 'bookshelf',
    'mossy_cobblestone': 'moss_stone',
    'obsidian': 'obsidian',
    'torch': 'torch',
    'oak_stairs': 'oak_stairs',
    'chest': 'chest',
    'crafting_table': 'crafting_table',
    'farmland': 'farmland',
    'furnace': 'furnace',
    'ladder': 'ladder',
    'stone_stairs': 'stone_stairs',
    'redstone_ore': 'redstone_ore',
    'snow': 'snow',
    'ice': 'ice',
    'snow_block': 'snow_block',
    'cactus': 'cactus',
    'clay': 'clay',
    'oak_fence': 'fence_oak',
    'glowstone': 'glowstone',
    'stone_bricks': 'stone_brick',
    'glass_pane': 'glass_pane',
    'melon': 'melon',
    'oak_fence_gate': 'fence_gate_oak',
  };

  // Default fallback block type if mapping is not found
  const DEFAULT_BLOCK_TYPE = 'stone';

  // Get the mapped block type
  const mappedType = BLOCK_NAME_MAPPING[name] || DEFAULT_BLOCK_TYPE;

  // Check if the mapped type exists in the game
  const isValidType = BLOCK_TYPES.some(type => type.id === mappedType);

  // If not valid, use stone as fallback
  const finalType = isValidType ? mappedType : DEFAULT_BLOCK_TYPE;

  // No debug logging for production

  // Log the mapping to the server
  sendBlockMapping(name, finalType, 'name', sourceFile);

  return finalType;
}

/**
 * Map a Minecraft block to our game's block type
 * @param block - The Minecraft block data from the API
 * @param sourceFile - The source NBT file (optional)
 * @returns The corresponding block type in our game
 */
export function mapMinecraftBlock(block: any, sourceFile: string = ''): string {
  // If we have a Minecraft ID (classic format)
  if (block.minecraftId !== undefined) {
    const mappedType = mapMinecraftBlockId(block.minecraftId, block.minecraftData || 0, sourceFile);
    // Only log unusual mappings to reduce console spam
    if (mappedType === 'stone' && block.minecraftId !== 1) {
      noopLog(`Mapping unknown Minecraft ID ${block.minecraftId} to fallback stone`);
    }
    return mappedType;
  }

  // If we have a Minecraft name (modern format)
  if (block.minecraftName) {
    const mappedType = mapMinecraftBlockName(block.minecraftName, sourceFile);

    // No debug logging for production

    // Only log unusual mappings to reduce console spam
    // Skip common blocks like air, wool, etc. that we know will fall back to stone
    const commonFallbackBlocks = [
      'minecraft:air',
      'air',
      'minecraft:light_gray_wool',
      'minecraft:gray_wool',
      'minecraft:white_wool',
      'minecraft:black_wool',
      'minecraft:blue_wool',
      'minecraft:brown_wool',
      'minecraft:cyan_wool',
      'minecraft:green_wool',
      'minecraft:light_blue_wool',
      'minecraft:lime_wool',
      'minecraft:magenta_wool',
      'minecraft:orange_wool',
      'minecraft:pink_wool',
      'minecraft:purple_wool',
      'minecraft:red_wool',
      'minecraft:yellow_wool'
    ];

    // No debug logging for production

    return mappedType;
  }

  // If we have a Minecraft state but no name (structure format)
  if (block.minecraftState !== undefined) {
    // We don't have enough information to map this properly
    // Use a default block type based on the state
    noopLog(`Mapping Minecraft state to stone (fallback)`);
    return 'stone';
  }

  // Fallback
  noopLog(`No mapping information available, using stone (fallback)`);
  return 'stone';
}
