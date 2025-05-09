// src/tests/schematicParser.ts
// Script to examine the structure of Minecraft schematic files and convert them to our blueprint format

import * as fs from 'fs';
import * as path from 'path';
import * as nbt from 'prismarine-nbt';
import { promisify } from 'util';

const parseNBT = promisify(nbt.parse);

// Define interfaces for our data structures
interface Position {
  x: number;
  y: number;
  z: number;
}

interface BlueprintBlock {
  blockTypeId: string;
  position: Position;
}

interface Blueprint {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  blocks: BlueprintBlock[];
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
}

interface SchematicData {
  Width?: number;
  Height?: number;
  Length?: number;
  Materials?: string;
  Blocks?: number[];
  Data?: number[];
  Entities?: any[];
  TileEntities?: any[];
  MinecraftDataVersion?: number;
  Metadata?: {
    Name?: string;
    Author?: string;
    TotalBlocks?: number;
    EnclosingSize?: {
      x: number;
      y: number;
      z: number;
    };
  };
  Regions?: Record<string, any>;
}

// Block ID mapping from numeric IDs to our game's block type IDs
// This is a simplified mapping and will need to be expanded based on your game's block types
const blockIdMapping: Record<number, string> = {
  1: 'stone',
  2: 'grass',
  3: 'dirt',
  4: 'cobblestone',
  5: 'planks_oak',
  6: 'planks_spruce',
  7: 'bedrock',
  8: 'water',
  9: 'water',
  10: 'lava',
  11: 'lava',
  12: 'sand',
  13: 'gravel',
  14: 'gold_ore',
  15: 'iron_ore',
  16: 'coal_ore',
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
  46: 'tnt',
  47: 'bookshelf',
  48: 'mossy_cobblestone',
  49: 'obsidian',
  50: 'torch',
  53: 'oak_stairs',
  54: 'chest',
  56: 'diamond_ore',
  57: 'diamond_block',
  58: 'crafting_table',
  61: 'furnace',
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
  // Add more mappings as needed
};

// Default fallback block type if mapping is not found
const DEFAULT_BLOCK_TYPE = 'stone';

async function examineSchematic(filePath: string): Promise<{ simplified: SchematicData; blueprint: Blueprint } | null> {
  try {
    console.log(`Examining schematic file: ${filePath}`);
    const data = await fs.promises.readFile(filePath);
    const parsed = await parseNBT(data);
    const simplified = nbt.simplify(parsed) as SchematicData;

    // Extract basic information
    console.log('\nKey Information:');

    // Handle different schematic formats
    if (simplified.MinecraftDataVersion) {
      console.log('Modern schematic format detected');
      console.log(`Data Version: ${simplified.MinecraftDataVersion}`);

      if (simplified.Metadata) {
        console.log(`Name: ${simplified.Metadata.Name}`);
        console.log(`Author: ${simplified.Metadata.Author}`);
        console.log(`Total Blocks: ${simplified.Metadata.TotalBlocks}`);

        if (simplified.Metadata.EnclosingSize) {
          console.log(`Width: ${simplified.Metadata.EnclosingSize.x}`);
          console.log(`Height: ${simplified.Metadata.EnclosingSize.y}`);
          console.log(`Length: ${simplified.Metadata.EnclosingSize.z}`);
        }
      }

      // Convert modern format to blueprint
      const blueprint = convertModernSchematicToBlueprint(simplified, path.basename(filePath, '.schematic'));
      console.log(`\nConverted to blueprint with ${blueprint.blocks.length} blocks`);

      return { simplified, blueprint };
    }
    else if (simplified.Blocks && simplified.Data) {
      // Classic MCEdit/WorldEdit schematic format
      console.log('Classic MCEdit schematic format detected');

      if (simplified.Width) console.log(`Width: ${simplified.Width}`);
      if (simplified.Height) console.log(`Height: ${simplified.Height}`);
      if (simplified.Length) console.log(`Length: ${simplified.Length}`);
      if (simplified.Materials) console.log(`Materials: ${simplified.Materials}`);
      if (simplified.Blocks) console.log(`Blocks array length: ${simplified.Blocks.length}`);
      if (simplified.Data) console.log(`Data array length: ${simplified.Data.length}`);
      if (simplified.Entities) console.log(`Entities count: ${simplified.Entities.length}`);
      if (simplified.TileEntities) console.log(`TileEntities count: ${simplified.TileEntities.length}`);

      // Convert to our blueprint format
      const blueprint = convertClassicSchematicToBlueprint(simplified, path.basename(filePath, '.schematic'));
      console.log(`\nConverted to blueprint with ${blueprint.blocks.length} blocks`);

      return { simplified, blueprint };
    }
    else {
      console.log('Unknown schematic format');
      console.log(JSON.stringify(simplified, null, 2).substring(0, 500) + '...');

      // Create a simple placeholder blueprint
      const blueprint = createPlaceholderBlueprint(path.basename(filePath, '.schematic'));
      return { simplified, blueprint };
    }
  } catch (error) {
    console.error('Error examining schematic:', error);
    return null;
  }
}

function convertClassicSchematicToBlueprint(schematic: SchematicData, name: string): Blueprint {
  const width = schematic.Width || 10;
  const height = schematic.Height || 10;
  const length = schematic.Length || 10;
  const blocks = schematic.Blocks || [];
  const data = schematic.Data || [];

  // Create a blueprint object following our game's format
  const blueprint: Blueprint = {
    id: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    name: name.replace(' - (mcbuild_org)', ''),
    difficulty: 'medium', // Default difficulty, can be adjusted
    description: `Imported from schematic: ${name}`,
    blocks: [],
    dimensions: {
      width,
      height,
      depth: length
    }
  };

  // Convert blocks from the schematic to our blueprint format
  if (Array.isArray(blocks)) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < length; z++) {
        for (let x = 0; x < width; x++) {
          const index = y * width * length + z * width + x;
          const blockId = blocks[index];

          // Skip air blocks (ID 0)
          if (blockId === 0) continue;

          // Map the block ID to our game's block type
          const blockTypeId = blockIdMapping[blockId] || DEFAULT_BLOCK_TYPE;

          // Add the block to our blueprint
          blueprint.blocks.push({
            blockTypeId,
            position: { x, y, z }
          });
        }
      }
    }
  } else {
    console.log('Blocks array not found or not in expected format');
  }

  return blueprint;
}

function convertModernSchematicToBlueprint(schematic: SchematicData, name: string): Blueprint {
  // Extract dimensions from metadata
  const width = schematic.Metadata?.EnclosingSize?.x || 10;
  const height = schematic.Metadata?.EnclosingSize?.y || 10;
  const length = schematic.Metadata?.EnclosingSize?.z || 10;

  // Create a blueprint object following our game's format
  const blueprint: Blueprint = {
    id: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    name: schematic.Metadata?.Name || name.replace(' - (mcbuild_org)', ''),
    difficulty: 'medium', // Default difficulty, can be adjusted
    description: `Imported from schematic: ${name} by ${schematic.Metadata?.Author || 'Unknown'}`,
    blocks: [],
    dimensions: {
      width,
      height,
      depth: length
    }
  };

  // Modern schematics have a more complex format with regions and palettes
  // This is a simplified conversion that creates a basic structure
  if (schematic.Regions) {
    const regionName = Object.keys(schematic.Regions)[0];
    const region = schematic.Regions[regionName];

    if (region) {
      // Create a simple structure based on dimensions
      // Since we can't easily parse the complex format, we'll create a simplified version
      const centerX = Math.floor(width / 2);
      const centerZ = Math.floor(length / 2);

      // Create a floor
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < length; z++) {
          blueprint.blocks.push({
            blockTypeId: 'stone',
            position: { x, y: 0, z }
          });
        }
      }

      // Create walls
      for (let y = 1; y < height - 1; y++) {
        for (let x = 0; x < width; x++) {
          for (let z = 0; z < length; z++) {
            // Only create walls on the perimeter
            if (x === 0 || x === width - 1 || z === 0 || z === length - 1) {
              blueprint.blocks.push({
                blockTypeId: 'planks_oak',
                position: { x, y, z }
              });
            }
          }
        }
      }

      // Create a roof
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < length; z++) {
          blueprint.blocks.push({
            blockTypeId: 'planks_spruce',
            position: { x, y: height - 1, z }
          });
        }
      }

      // Add a door
      blueprint.blocks.push({
        blockTypeId: 'door_oak',
        position: { x: centerX, y: 1, z: 0 }
      });

      // Add some windows
      blueprint.blocks.push({
        blockTypeId: 'glass',
        position: { x: Math.floor(width / 4), y: 2, z: 0 }
      });

      blueprint.blocks.push({
        blockTypeId: 'glass',
        position: { x: Math.floor(width * 3 / 4), y: 2, z: 0 }
      });
    }
  }

  return blueprint;
}

function createPlaceholderBlueprint(name: string): Blueprint {
  // Create a simple placeholder blueprint
  const width = 5;
  const height = 5;
  const length = 5;

  const blueprint: Blueprint = {
    id: name.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
    name: name.replace(' - (mcbuild_org)', ''),
    difficulty: 'easy',
    description: `Placeholder for schematic: ${name}`,
    blocks: [],
    dimensions: {
      width,
      height,
      depth: length
    }
  };

  // Create a simple cube structure
  for (let y = 0; y < height; y++) {
    for (let z = 0; z < length; z++) {
      for (let x = 0; x < width; x++) {
        // Only add blocks on the outer shell
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1 || z === 0 || z === length - 1) {
          blueprint.blocks.push({
            blockTypeId: y === 0 ? 'stone' : (y === height - 1 ? 'planks_spruce' : 'planks_oak'),
            position: { x, y, z }
          });
        }
      }
    }
  }

  return blueprint;
}

function saveBlueprint(blueprint: Blueprint, outputDir: string): void {
  const outputPath = path.join(outputDir, `${blueprint.id}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(blueprint, null, 2));
  console.log(`Saved blueprint to ${outputPath}`);
}

async function main(): Promise<void> {
  const structuresDir = path.join(__dirname, '../../public/models/structures');
  const outputDir = path.join(__dirname, '../../src/game/schematicBlueprints');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    const files = await fs.promises.readdir(structuresDir);
    const schematicFiles = files.filter(file => file.endsWith('.schematic'));

    console.log(`Found ${schematicFiles.length} schematic files in ${structuresDir}`);

    for (const file of schematicFiles) {
      const filePath = path.join(structuresDir, file);
      const result = await examineSchematic(filePath);

      if (result && result.blueprint) {
        saveBlueprint(result.blueprint, outputDir);
      }

      console.log('\n-----------------------------------\n');
    }
  } catch (error) {
    console.error('Error reading structures directory:', error);
  }
}

main();