// src/server/structureService.ts
// Service for creating and managing Minecraft structures

import * as fs from 'fs';
import * as path from 'path';
import * as nbt from 'prismarine-nbt';
import { promisify } from 'util';
import * as zlib from 'zlib';

// Promisify the NBT parse function
const parseNBT = promisify(nbt.parse);
const gunzip = promisify(zlib.gunzip);

// Path to the structures directory
const STRUCTURES_DIR = path.join(process.cwd(), 'public', 'models', 'structures');

/**
 * Interface for a 3D position
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Interface for a structure block
 */
export interface StructureBlock {
  minecraftName: string;
  position: Position3D;
}

/**
 * Interface for a structure
 */
export interface Structure {
  name: string;
  blocks: StructureBlock[];
  fromFile?: boolean; // Flag to indicate if this structure was loaded from a file
}

/**
 * Create an Eiffel Tower structure
 * @returns The Eiffel Tower structure
 */
export function createEiffelTowerStructure(): Structure {
  const structure: Structure = {
    name: 'Eiffel Tower',
    blocks: []
  };

  // Create a more accurate Eiffel Tower structure
  const width = 11;
  const height = 25;
  const depth = 11;

  // Base of the tower (wider at the bottom)
  for (let y = 0; y < 5; y++) {
    const levelWidth = width - y;
    const offset = Math.floor(y / 2);

    // Create the four legs
    for (let x = 0; x < levelWidth; x++) {
      for (let z = 0; z < levelWidth; z++) {
        // Only add blocks for the four corners/legs
        if ((x < 3 && z < 3) ||
            (x < 3 && z >= levelWidth - 3) ||
            (x >= levelWidth - 3 && z < 3) ||
            (x >= levelWidth - 3 && z >= levelWidth - 3)) {

          structure.blocks.push({
            minecraftName: 'minecraft:iron_block',
            position: { x: x + offset, y, z: z + offset }
          });
        }
      }
    }

    // Add cross beams
    if (y % 2 === 0) {
      for (let x = 3; x < levelWidth - 3; x++) {
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: x + offset, y, z: 2 + offset }
        });
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: x + offset, y, z: levelWidth - 3 + offset }
        });
      }

      for (let z = 3; z < levelWidth - 3; z++) {
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: 2 + offset, y, z: z + offset }
        });
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: levelWidth - 3 + offset, y, z: z + offset }
        });
      }
    }
  }

  // Middle section of the tower (narrower)
  for (let y = 5; y < 15; y++) {
    const levelWidth = Math.max(7, width - y);
    const offset = Math.floor((width - levelWidth) / 2);

    // Create the four pillars
    for (let x = 0; x < levelWidth; x++) {
      for (let z = 0; z < levelWidth; z++) {
        // Only add blocks for the four corners/pillars
        if ((x < 2 && z < 2) ||
            (x < 2 && z >= levelWidth - 2) ||
            (x >= levelWidth - 2 && z < 2) ||
            (x >= levelWidth - 2 && z >= levelWidth - 2)) {

          structure.blocks.push({
            minecraftName: 'minecraft:iron_block',
            position: { x: x + offset, y, z: z + offset }
          });
        }
      }
    }

    // Add cross beams every few levels
    if (y % 3 === 0) {
      for (let x = 2; x < levelWidth - 2; x++) {
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: x + offset, y, z: 1 + offset }
        });
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: x + offset, y, z: levelWidth - 2 + offset }
        });
      }

      for (let z = 2; z < levelWidth - 2; z++) {
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: 1 + offset, y, z: z + offset }
        });
        structure.blocks.push({
          minecraftName: 'minecraft:iron_bars',
          position: { x: levelWidth - 2 + offset, y, z: z + offset }
        });
      }
    }
  }

  // Top section of the tower (narrowest)
  for (let y = 15; y < height; y++) {
    const levelWidth = Math.max(3, 7 - (y - 15) / 2);
    const offset = Math.floor((width - levelWidth) / 2);

    // Create a solid structure for the top
    for (let x = 0; x < levelWidth; x++) {
      for (let z = 0; z < levelWidth; z++) {
        // Make it more solid at the top
        if (y >= height - 3 ||
            (x === 0 || x === levelWidth - 1 || z === 0 || z === levelWidth - 1)) {

          // Use gold for the very top
          const blockType = y >= height - 2 ? 'minecraft:gold_block' : 'minecraft:iron_block';

          structure.blocks.push({
            minecraftName: blockType,
            position: { x: x + offset, y, z: z + offset }
          });
        }
      }
    }
  }

  return structure;
}

/**
 * Create a mansion structure
 * @param isMidevil - Whether to create a medieval mansion or a modern mansion
 * @returns The mansion structure
 */
export function createMansionStructure(isMidevil: boolean): Structure {
  const structure: Structure = {
    name: isMidevil ? 'Midevil Mansion' : 'Modern Mansion',
    blocks: []
  };

  const width = 11;
  const height = 9;
  const depth = 11;

  // Determine block types based on style
  const wallBlockType = isMidevil ? 'minecraft:stone_bricks' : 'minecraft:white_wool';
  const roofBlockType = isMidevil ? 'minecraft:oak_planks' : 'minecraft:glass';
  const floorBlockType = isMidevil ? 'minecraft:cobblestone' : 'minecraft:sandstone';

  // Build the structure
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        let blockType = null;

        // Floor
        if (y === 0) {
          blockType = floorBlockType;
        }
        // Roof
        else if (y === height - 1) {
          blockType = roofBlockType;
        }
        // Walls
        else if (x === 0 || x === width - 1 || z === 0 || z === depth - 1) {
          blockType = wallBlockType;

          // Add windows
          if ((x === 3 || x === width - 4 || z === 3 || z === depth - 4) &&
              y > 1 && y < height - 2) {
            blockType = 'minecraft:glass';
          }

          // Add door
          if (x === Math.floor(width / 2) && z === 0 && y > 0 && y < 4) {
            blockType = null; // No block for doorway
          }
        }
        // Interior features
        else if (y === 1 && (x === 3 || x === width - 4) && (z === 3 || z === depth - 4)) {
          blockType = 'minecraft:crafting_table';
        }

        // Add the block to the structure if a block type was assigned
        if (blockType) {
          structure.blocks.push({
            minecraftName: blockType,
            position: { x, y, z }
          });
        }
      }
    }
  }

  return structure;
}

/**
 * Get a structure by filename
 * @param filename - The filename of the structure
 * @returns The structure
 */
export async function getStructureByFilename(filename: string): Promise<Structure> {
  // Get the list of available structure files
  const files = fs.readdirSync(STRUCTURES_DIR)
    .filter(file => file.endsWith('.nbt') || file.endsWith('.schematic'));

  console.log(`[NBT] Available structure files: ${files.join(', ')}`);

  // Check if the requested file exists
  if (!files.includes(filename)) {
    console.error(`[NBT ERROR] File ${filename} not found in available files`);
    throw new Error(`Structure file not found: ${filename}`);
  }

  // Get the full path to the file
  const filePath = path.join(STRUCTURES_DIR, filename);
  console.log(`[EIFFEL_DEBUG] Loading structure from file: ${filePath}`);

  try {
    // Read the file
    const fileData = fs.readFileSync(filePath);
    console.log(`[EIFFEL_DEBUG] Read file data: ${fileData.length} bytes`);
    console.log(`[EIFFEL_DEBUG] File signature (first 20 bytes): ${Array.from(fileData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);

    // Parse the NBT file
    console.log(`[EIFFEL_DEBUG] Attempting to parse NBT file: ${filename}`);

    // Check if the file is gzipped (NBT files are usually gzipped)
    let parsedNbt;
    let parsingMethod = '';

    try {
      // Try to parse as gzipped NBT
      console.log(`[EIFFEL_DEBUG] Attempting to parse as gzipped NBT file...`);
      const uncompressedData = await gunzip(fileData);
      console.log(`[EIFFEL_DEBUG] Successfully uncompressed data: ${uncompressedData.length} bytes`);

      parsedNbt = await parseNBT(uncompressedData);
      parsingMethod = 'gzipped';
      console.log('[EIFFEL_DEBUG] Successfully parsed gzipped NBT file');
    } catch (gzipError) {
      console.warn('[NBT WARNING] Error parsing as gzipped NBT:', gzipError);
      console.log('[NBT] Attempting to parse as uncompressed NBT file...');

      try {
        // Try to parse as uncompressed NBT
        parsedNbt = await parseNBT(fileData);
        parsingMethod = 'uncompressed';
        console.log('[NBT] Successfully parsed uncompressed NBT file');
      } catch (nbtError) {
        console.error('[NBT ERROR] Failed to parse NBT file using both gzip and direct methods');
        console.error('[NBT ERROR] Gzip error details:', gzipError instanceof Error ? gzipError.message : String(gzipError));
        console.error('[NBT ERROR] Direct parsing error details:', nbtError instanceof Error ? nbtError.message : String(nbtError));
        console.error('[NBT ERROR] Error stack:', nbtError instanceof Error ? nbtError.stack : 'No stack trace');

        // Dump file information for debugging
        console.error(`[NBT ERROR] File information:
          - Path: ${filePath}
          - Size: ${fileData.length} bytes
          - First 50 bytes: ${Array.from(fileData.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' ')}
        `);

        throw new Error(`Failed to parse NBT file: ${filename}. The file may be corrupted or in an unsupported format.`);
      }
    }

    // Simplify the NBT data
    const simplifiedNbt = nbt.simplify(parsedNbt);
    console.log(`[EIFFEL_DEBUG] Successfully simplified NBT data (parsed as ${parsingMethod})`);
    console.log('[EIFFEL_DEBUG] NBT structure preview:', JSON.stringify(simplifiedNbt).substring(0, 200) + '...');

    // Log the root keys to help with debugging
    const rootKeys = Object.keys(simplifiedNbt);
    console.log(`[EIFFEL_DEBUG] Root keys in NBT data: ${rootKeys.join(', ')}`);

    // Create a structure from the NBT data
    return createStructureFromNbt(simplifiedNbt, filename);
  } catch (error) {
    console.error(`[NBT ERROR] Fatal error loading structure from file: ${filePath}`, error);
    throw new Error(`Failed to load structure from file: ${filename}. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a structure from NBT data
 * @param nbtData - The simplified NBT data
 * @param filename - The filename of the structure
 * @returns The structure
 */
function createStructureFromNbt(nbtData: any, filename: string): Structure {
  console.log(`[EIFFEL_DEBUG] Creating structure from NBT data for ${filename}`);

  // Create a new structure
  const structure: Structure = {
    name: `${filename.replace(/\.(nbt|schematic)$/, '').replace(/_/g, ' ')} (from ${filename})`,
    blocks: [],
    fromFile: true
  };

  try {
    // Check if this is a structure NBT file (modern format)
    if (nbtData.size && nbtData.blocks && Array.isArray(nbtData.blocks)) {
      console.log('[EIFFEL_DEBUG] Modern structure NBT format detected');
      console.log(`[EIFFEL_DEBUG] Structure size: ${JSON.stringify(nbtData.size)}`);
      console.log(`[EIFFEL_DEBUG] Number of blocks in NBT: ${nbtData.blocks.length}`);
      console.log(`[EIFFEL_DEBUG] Palette size: ${nbtData.palette ? Object.keys(nbtData.palette).length : 'undefined'}`);

      // Extract the blocks from the NBT data
      for (const block of nbtData.blocks) {
        if (block.pos && block.state !== undefined) {
          // Extract position
          const [x, y, z] = block.pos;

          // Get the block state from the palette
          const blockState = nbtData.palette[block.state];

          if (!blockState) {
            console.warn(`[NBT WARNING] Block state ${block.state} not found in palette`);
            continue;
          }

          // Extract the block name from the block state
          // Format is usually "minecraft:block_name"
          let blockName = blockState.Name;

          if (!blockName) {
            console.warn(`[NBT WARNING] Block state ${block.state} has no Name property`);
            continue;
          }

          // Add the block to the structure
          structure.blocks.push({
            minecraftName: blockName,
            position: { x, y, z }
          });
        } else {
          console.warn(`[NBT WARNING] Block missing pos or state: ${JSON.stringify(block)}`);
        }
      }

      console.log(`[EIFFEL_DEBUG] Created structure with ${structure.blocks.length} blocks from modern NBT format`);

      // Log a sample of blocks for debugging
      if (structure.blocks.length > 0) {
        console.log(`[EIFFEL_DEBUG] Sample blocks: ${JSON.stringify(structure.blocks.slice(0, 3))}`);
      }
    }
    // Check if this is a schematic file (classic format)
    else if (nbtData.Blocks && nbtData.Data) {
      console.log('[NBT] Classic schematic format detected');

      // Extract dimensions
      const width = nbtData.Width || 0;
      const height = nbtData.Height || 0;
      const length = nbtData.Length || 0;

      console.log(`[NBT] Dimensions: ${width}x${height}x${length}`);
      console.log(`[NBT] Blocks array length: ${nbtData.Blocks.length}`);
      console.log(`[NBT] Data array length: ${nbtData.Data.length}`);

      // Validate dimensions
      if (width * height * length !== nbtData.Blocks.length) {
        console.error(`[NBT ERROR] Dimensions (${width}x${height}x${length} = ${width * height * length}) don't match Blocks array length (${nbtData.Blocks.length})`);
        throw new Error(`Invalid schematic dimensions: expected ${width * height * length} blocks but got ${nbtData.Blocks.length}`);
      }

      // Extract blocks
      const blocks = nbtData.Blocks;
      const data = nbtData.Data;

      // Map of block IDs to block names
      const blockIdToName: { [id: number]: string } = {
        0: 'minecraft:air',
        1: 'minecraft:stone',
        2: 'minecraft:grass_block',
        3: 'minecraft:dirt',
        4: 'minecraft:cobblestone',
        5: 'minecraft:oak_planks',
        6: 'minecraft:sapling',
        7: 'minecraft:bedrock',
        8: 'minecraft:water',
        9: 'minecraft:water',
        10: 'minecraft:lava',
        11: 'minecraft:lava',
        12: 'minecraft:sand',
        13: 'minecraft:gravel',
        14: 'minecraft:gold_ore',
        15: 'minecraft:iron_ore',
        16: 'minecraft:coal_ore',
        17: 'minecraft:oak_log',
        18: 'minecraft:oak_leaves',
        19: 'minecraft:sponge',
        20: 'minecraft:glass',
        // Add more mappings as needed
      };

      // Track unknown block IDs for debugging
      const unknownBlockIds = new Set<number>();

      // Convert blocks
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < length; z++) {
          for (let x = 0; x < width; x++) {
            const index = y * width * length + z * width + x;
            const blockId = blocks[index];
            const blockData = data[index];

            // Skip air blocks (id 0)
            if (blockId === 0) continue;

            // Map block ID to block name
            let blockName: string;
            if (blockIdToName[blockId]) {
              blockName = blockIdToName[blockId];
            } else {
              blockName = `minecraft:unknown_${blockId}`;
              unknownBlockIds.add(blockId);
            }

            // Add the block to the structure
            structure.blocks.push({
              minecraftName: blockName,
              position: { x, y, z }
            });
          }
        }
      }

      // Log unknown block IDs
      if (unknownBlockIds.size > 0) {
        console.warn(`[NBT WARNING] Unknown block IDs encountered: ${Array.from(unknownBlockIds).join(', ')}`);
      }

      console.log(`[NBT] Created structure with ${structure.blocks.length} blocks from classic schematic format`);

      // Log a sample of blocks for debugging
      if (structure.blocks.length > 0) {
        console.log(`[NBT] Sample blocks: ${JSON.stringify(structure.blocks.slice(0, 3))}`);
      }
    }
    // If we couldn't identify the format, try to extract blocks from other properties
    else {
      console.log('[NBT] Unknown NBT format, examining NBT structure');
      console.log(`[NBT] Root keys: ${Object.keys(nbtData).join(', ')}`);

      // Dump more detailed information about the NBT structure
      for (const key of Object.keys(nbtData)) {
        const value = nbtData[key];
        if (Array.isArray(value)) {
          console.log(`[NBT] Key ${key} is an array with ${value.length} elements`);
          if (value.length > 0) {
            console.log(`[NBT] First element type: ${typeof value[0]}`);
            if (typeof value[0] === 'object') {
              console.log(`[NBT] First element keys: ${Object.keys(value[0]).join(', ')}`);
            }
          }
        } else if (typeof value === 'object') {
          console.log(`[NBT] Key ${key} is an object with keys: ${Object.keys(value).join(', ')}`);
        } else {
          console.log(`[NBT] Key ${key} is a ${typeof value}: ${value}`);
        }
      }

      console.error('[NBT ERROR] Could not identify NBT format - no recognized structure pattern');
      throw new Error(`Unsupported NBT format: ${filename}. The file structure is not recognized as a valid Minecraft structure or schematic.`);
    }

    // If we couldn't extract any blocks, throw an error
    if (structure.blocks.length === 0) {
      console.error('[NBT ERROR] No blocks extracted from NBT data');
      throw new Error(`No blocks could be extracted from the NBT file: ${filename}. The file may be empty or in an unsupported format.`);
    }

    return structure;
  } catch (error) {
    console.error('[NBT ERROR] Error creating structure from NBT data:', error);
    throw new Error(`Failed to create structure from NBT data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Create a simple box structure
 * @param name - The name of the structure
 * @returns The structure
 */
export function createSimpleBoxStructure(name: string): Structure {
  const structure: Structure = {
    name: name.replace(/\.(schematic|nbt)$/, '').replace(/_/g, ' '),
    blocks: []
  };

  const width = 5;
  const height = 5;
  const depth = 5;

  // Create a simple box structure
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < depth; z++) {
      for (let x = 0; x < width; x++) {
        // Only add blocks on the outer shell
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1 || z === 0 || z === depth - 1) {
          // Use different block types for different parts
          let minecraftName;
          if (y === 0) {
            minecraftName = 'minecraft:stone';
          } else if (y === height - 1) {
            minecraftName = 'minecraft:spruce_planks';
          } else {
            minecraftName = 'minecraft:oak_planks';
          }

          structure.blocks.push({
            minecraftName,
            position: { x, y, z }
          });
        }
      }
    }
  }

  return structure;
}
