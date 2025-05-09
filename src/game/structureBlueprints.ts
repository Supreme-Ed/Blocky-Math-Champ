// src/game/structureBlueprints.ts
// Defines structure blueprints for each difficulty level using 2D/3D arrays of block type IDs
// Each blueprint represents a Minecraft-style structure that players can build by collecting blocks

/**
 * Represents a 3D position in the structure
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Represents the original Minecraft block data
 */
export interface MinecraftBlockData {
  id?: number;        // Classic format block ID
  data?: number;      // Classic format block data value
  name?: string;      // Modern format block name (e.g., 'minecraft:stone')
  state?: number;     // Modern format block state index
  properties?: any;   // Modern format block properties
}

/**
 * Represents a single block in the structure blueprint
 */
export interface BlueprintBlock {
  blockTypeId: string;
  position: Position3D;
  // Optional original Minecraft data for reference
  minecraftData?: MinecraftBlockData;
}

/**
 * Represents a complete structure blueprint
 */
export interface StructureBlueprint {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  blocks: BlueprintBlock[];
  // Dimensions of the structure for visualization purposes
  dimensions: {
    width: number;  // x-axis
    height: number; // y-axis
    depth: number;  // z-axis
  };
  // Optional thumbnail image path
  thumbnail?: string;
}

// Easy difficulty: Simple house (small cabin)
const easyHouseBlueprint: StructureBlueprint = {
  id: 'easy_house',
  name: 'Simple Cabin',
  difficulty: 'easy',
  description: 'A small, simple cabin with four walls and a roof.',
  dimensions: {
    width: 5,  // x-axis
    height: 4, // y-axis
    depth: 5,  // z-axis
  },
  blocks: [
    // Floor (planks)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).map((_, z) => ({
        blockTypeId: 'planks_spruce',
        position: { x, y: 0, z }
      }))
    ),

    // Walls (logs)
    // Front wall with door opening
    { blockTypeId: 'log_spruce', position: { x: 0, y: 1, z: 0 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 2, z: 0 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 1, z: 4 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 2, z: 4 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 1, z: 1 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 2, z: 1 } },
    // Door opening at x:0, y:1-2, z:2-3
    { blockTypeId: 'log_spruce', position: { x: 0, y: 3, z: 0 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 3, z: 1 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 3, z: 2 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 3, z: 3 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 3, z: 4 } },

    // Back wall
    ...Array.from({ length: 5 }).flatMap((_, z) =>
      Array.from({ length: 3 }).map((_, y) => ({
        blockTypeId: 'log_spruce',
        position: { x: 4, y: y + 1, z }
      }))
    ),

    // Side walls
    ...Array.from({ length: 3 }).flatMap((_, x) =>
      Array.from({ length: 3 }).map((_, y) => ({
        blockTypeId: 'log_spruce',
        position: { x: x + 1, y: y + 1, z: 0 }
      }))
    ),
    ...Array.from({ length: 3 }).flatMap((_, x) =>
      Array.from({ length: 3 }).map((_, y) => ({
        blockTypeId: 'log_spruce',
        position: { x: x + 1, y: y + 1, z: 4 }
      }))
    ),

    // Roof (stone)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).map((_, z) => ({
        blockTypeId: 'stone',
        position: { x, y: 4, z }
      }))
    ),
  ]
};

// Medium difficulty: Well structure
const mediumWellBlueprint: StructureBlueprint = {
  id: 'medium_well',
  name: 'Village Well',
  difficulty: 'medium',
  description: 'A decorative well structure with stone base and wooden roof.',
  dimensions: {
    width: 5,
    height: 6,
    depth: 5
  },
  blocks: [
    // Base platform (stone)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).map((_, z) => ({
        blockTypeId: 'stone',
        position: { x, y: 0, z }
      }))
    ),

    // Well walls (stone)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).filter((_, z) =>
        // Create a hollow square
        (x === 0 || x === 4 || z === 0 || z === 4)
      ).map((_, z) => ({
        blockTypeId: 'stone',
        position: { x, y: 1, z }
      }))
    ),

    // Second layer of well (stone)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).filter((_, z) =>
        // Create a hollow square
        (x === 0 || x === 4 || z === 0 || z === 4)
      ).map((_, z) => ({
        blockTypeId: 'stone',
        position: { x, y: 2, z }
      }))
    ),

    // Support pillars (logs)
    { blockTypeId: 'log_spruce', position: { x: 0, y: 3, z: 0 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 4, z: 0 } },
    { blockTypeId: 'log_spruce', position: { x: 4, y: 3, z: 0 } },
    { blockTypeId: 'log_spruce', position: { x: 4, y: 4, z: 0 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 3, z: 4 } },
    { blockTypeId: 'log_spruce', position: { x: 0, y: 4, z: 4 } },
    { blockTypeId: 'log_spruce', position: { x: 4, y: 3, z: 4 } },
    { blockTypeId: 'log_spruce', position: { x: 4, y: 4, z: 4 } },

    // Roof (planks)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).map((_, z) => ({
        blockTypeId: 'planks_spruce',
        position: { x, y: 5, z }
      }))
    ),

    // Water (sand as placeholder for water)
    { blockTypeId: 'sand', position: { x: 1, y: 1, z: 1 } },
    { blockTypeId: 'sand', position: { x: 2, y: 1, z: 1 } },
    { blockTypeId: 'sand', position: { x: 3, y: 1, z: 1 } },
    { blockTypeId: 'sand', position: { x: 1, y: 1, z: 2 } },
    { blockTypeId: 'sand', position: { x: 2, y: 1, z: 2 } },
    { blockTypeId: 'sand', position: { x: 3, y: 1, z: 2 } },
    { blockTypeId: 'sand', position: { x: 1, y: 1, z: 3 } },
    { blockTypeId: 'sand', position: { x: 2, y: 1, z: 3 } },
    { blockTypeId: 'sand', position: { x: 3, y: 1, z: 3 } },
  ]
};

// Hard difficulty: Tower structure
const hardTowerBlueprint: StructureBlueprint = {
  id: 'hard_tower',
  name: 'Watchtower',
  difficulty: 'hard',
  description: 'A tall watchtower with multiple levels and a lookout platform.',
  dimensions: {
    width: 7,
    height: 12,
    depth: 7
  },
  blocks: [
    // Base platform (stone)
    ...Array.from({ length: 7 }).flatMap((_, x) =>
      Array.from({ length: 7 }).map((_, z) => ({
        blockTypeId: 'stone',
        position: { x, y: 0, z }
      }))
    ),

    // First level walls (stone)
    ...Array.from({ length: 7 }).flatMap((_, x) =>
      Array.from({ length: 7 }).filter((_, z) =>
        // Create a hollow square
        (x === 0 || x === 6 || z === 0 || z === 6)
      ).flatMap((_, z) =>
        Array.from({ length: 3 }).map((_, y) => ({
          blockTypeId: 'stone',
          position: { x, y: y + 1, z }
        }))
      )
    ),

    // Door opening
    { blockTypeId: 'dirt', position: { x: 3, y: 1, z: 0 } },
    { blockTypeId: 'dirt', position: { x: 3, y: 2, z: 0 } },

    // Second level floor (planks)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).map((_, z) => ({
        blockTypeId: 'planks_spruce',
        position: { x: x + 1, y: 4, z: z + 1 }
      }))
    ),

    // Second level walls (logs)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).filter((_, z) =>
        // Create a hollow square
        (x === 0 || x === 4 || z === 0 || z === 4)
      ).flatMap((_, z) =>
        Array.from({ length: 3 }).map((_, y) => ({
          blockTypeId: 'log_spruce',
          position: { x: x + 1, y: y + 5, z: z + 1 }
        }))
      )
    ),

    // Top platform (stone)
    ...Array.from({ length: 5 }).flatMap((_, x) =>
      Array.from({ length: 5 }).map((_, z) => ({
        blockTypeId: 'stone',
        position: { x: x + 1, y: 8, z: z + 1 }
      }))
    ),

    // Lookout posts (logs)
    { blockTypeId: 'log_spruce', position: { x: 1, y: 9, z: 1 } },
    { blockTypeId: 'log_spruce', position: { x: 5, y: 9, z: 1 } },
    { blockTypeId: 'log_spruce', position: { x: 1, y: 9, z: 5 } },
    { blockTypeId: 'log_spruce', position: { x: 5, y: 9, z: 5 } },

    // Lookout roof (planks)
    ...Array.from({ length: 3 }).flatMap((_, x) =>
      Array.from({ length: 3 }).map((_, z) => ({
        blockTypeId: 'planks_spruce',
        position: { x: x + 2, y: 10, z: z + 2 }
      }))
    ),

    // Top decoration (dirt)
    { blockTypeId: 'dirt', position: { x: 3, y: 11, z: 3 } },
  ]
};

// Built-in blueprints - empty to only use schematic blueprints
export const BUILT_IN_BLUEPRINTS: Record<string, StructureBlueprint> = {};

// Combined blueprints (built-in + schematic)
export let STRUCTURE_BLUEPRINTS: Record<string, StructureBlueprint> = { ...BUILT_IN_BLUEPRINTS };

// Import schematic manager
import schematicManager from './schematicManager';

// Initialize function to load schematic blueprints
export async function initializeBlueprints(forceReload: boolean = false): Promise<void> {
  console.log('=== INITIALIZING BLUEPRINTS ===');
  console.log('Force reload:', forceReload);
  console.log('Initial STRUCTURE_BLUEPRINTS:', Object.keys(STRUCTURE_BLUEPRINTS));

  // Initialize the schematic manager to load schematic blueprints
  await schematicManager.initialize(forceReload);

  // Get all schematic blueprints
  const schematicBlueprints = schematicManager.getAllBlueprints();
  console.log('Schematic blueprints loaded:', schematicBlueprints.length);
  console.log('Schematic blueprint IDs:', schematicBlueprints.map(bp => bp.id));

  // Create a new blueprint record with ONLY schematic blueprints
  const schematicOnlyBlueprints: Record<string, StructureBlueprint> = {};

  // Add schematic blueprints
  for (const blueprint of schematicBlueprints) {
    console.log(`Adding blueprint: ${blueprint.name} (${blueprint.id})`);
    schematicOnlyBlueprints[blueprint.id] = blueprint;
  }

  // Update the exported blueprints - ONLY use schematic blueprints
  STRUCTURE_BLUEPRINTS = schematicOnlyBlueprints;
  console.log('STRUCTURE_BLUEPRINTS updated, now contains:', Object.keys(STRUCTURE_BLUEPRINTS));

  // Check if we have any blueprints
  if (Object.keys(STRUCTURE_BLUEPRINTS).length === 0) {
    console.error('⚠️ NO STRUCTURE BLUEPRINTS LOADED ⚠️');
    console.error('To load structures, you must:');
    console.error('1. Start the server with: npm run server:dev');
    console.error('2. Ensure there are valid .nbt files in public/models/structures/');
    console.error('See SERVER.md for more information about the server.');
  } else {
    console.log(`Initialized structure blueprints: ${Object.keys(STRUCTURE_BLUEPRINTS).length} total blueprints`);

    // Debug: Log all available blueprints
    console.log('Available blueprints:');
    Object.entries(STRUCTURE_BLUEPRINTS).forEach(([id, blueprint]) => {
      console.log(`- ${blueprint.name} (ID: ${id}, Difficulty: ${blueprint.difficulty})`);
    });
  }

  // Dispatch an event to notify that blueprints have been reloaded
  if (typeof window !== 'undefined' && forceReload) {
    const event = new CustomEvent('blueprintsReloaded', {
      detail: {
        timestamp: Date.now(),
        count: Object.keys(STRUCTURE_BLUEPRINTS).length
      }
    });
    window.dispatchEvent(event);
    console.log('Dispatched blueprintsReloaded event');
  }

  console.log('=== BLUEPRINT INITIALIZATION COMPLETE ===');
}

/**
 * Force a reload of all structure blueprints
 * This is useful for development when schematic files have been updated
 */
export async function reloadBlueprints(): Promise<void> {
  console.log('Forcing reload of all structure blueprints...');

  // Clear the structure icon cache to force regeneration
  if (typeof window !== 'undefined' && window.localStorage) {
    Object.keys(window.localStorage).forEach(key => {
      if (key.startsWith('blocky_structure_icon_')) {
        window.localStorage.removeItem(key);
      }
    });
    console.log('Cleared structure icon cache');
  }

  // Force reload of schematic blueprints
  return initializeBlueprints(true);
}

// Utility: get blueprint by ID
export function getBlueprintById(id: string): StructureBlueprint | null {
  try {
    if (!id || typeof id !== 'string') {
      console.error(`Invalid blueprint ID: ${id}`);
      return null;
    }

    // First check combined blueprints (which should include both built-in and schematic)
    if (STRUCTURE_BLUEPRINTS[id]) {
      console.log(`Found blueprint in STRUCTURE_BLUEPRINTS: ${id}`);

      // Validate the blueprint structure
      const blueprint = STRUCTURE_BLUEPRINTS[id];
      if (!validateBlueprint(blueprint)) {
        console.error(`Invalid blueprint structure for ${id}`);
        return null;
      }

      return blueprint;
    }

    // If not found, check if this is a schematic ID that might be missing the _mcbuild_org_ suffix
    if (!id.includes('_mcbuild_org_')) {
      const schematicId = `${id}_mcbuild_org_`;
      if (STRUCTURE_BLUEPRINTS[schematicId]) {
        console.log(`Found blueprint with _mcbuild_org_ suffix: ${schematicId}`);

        // Validate the blueprint structure
        const blueprint = STRUCTURE_BLUEPRINTS[schematicId];
        if (!validateBlueprint(blueprint)) {
          console.error(`Invalid blueprint structure for ${schematicId}`);
          return null;
        }

        return blueprint;
      }
    }

    // Then check schematic blueprints directly as a fallback
    const schematicBlueprint = schematicManager.getBlueprintById(id);
    if (schematicBlueprint) {
      console.log(`Found blueprint in schematicManager: ${id}`);

      // Validate the blueprint structure
      if (!validateBlueprint(schematicBlueprint)) {
        console.error(`Invalid blueprint structure from schematicManager for ${id}`);
        return null;
      }

      return schematicBlueprint;
    }

    console.warn(`Blueprint not found: ${id}`);
    return null;
  } catch (error) {
    console.error(`Error getting blueprint by ID ${id}:`, error);
    return null;
  }
}

/**
 * Validates a blueprint structure to ensure it has all required properties
 * @param blueprint The blueprint to validate
 * @returns True if the blueprint is valid, false otherwise
 */
function validateBlueprint(blueprint: any): boolean {
  if (!blueprint) {
    console.error('Blueprint is null or undefined');
    return false;
  }

  // Check required properties
  if (!blueprint.id || typeof blueprint.id !== 'string') {
    console.error('Blueprint is missing valid id property');
    return false;
  }

  if (!blueprint.name || typeof blueprint.name !== 'string') {
    console.error(`Blueprint ${blueprint.id} is missing valid name property`);
    return false;
  }

  if (!blueprint.blocks || !Array.isArray(blueprint.blocks)) {
    console.error(`Blueprint ${blueprint.id} is missing valid blocks array`);
    return false;
  }

  if (blueprint.blocks.length === 0) {
    console.error(`Blueprint ${blueprint.id} has empty blocks array`);
    return false;
  }

  // Check dimensions
  if (!blueprint.dimensions ||
      typeof blueprint.dimensions.width !== 'number' ||
      typeof blueprint.dimensions.height !== 'number' ||
      typeof blueprint.dimensions.depth !== 'number') {
    console.error(`Blueprint ${blueprint.id} has invalid dimensions`);

    // Add default dimensions if missing
    blueprint.dimensions = {
      width: 5,
      height: 5,
      depth: 5
    };
    console.log(`Added default dimensions to blueprint ${blueprint.id}`);
  }

  // Check a sample of blocks to ensure they have required properties
  const sampleSize = Math.min(5, blueprint.blocks.length);
  for (let i = 0; i < sampleSize; i++) {
    const block = blueprint.blocks[i];
    if (!block || typeof block.blockTypeId !== 'string' || !block.position) {
      console.error(`Blueprint ${blueprint.id} has invalid block at index ${i}:`, block);
      return false;
    }

    // Check position properties
    if (typeof block.position.x !== 'number' ||
        typeof block.position.y !== 'number' ||
        typeof block.position.z !== 'number') {
      console.error(`Blueprint ${blueprint.id} has invalid block position at index ${i}:`, block.position);
      return false;
    }
  }

  return true;
}

// Utility: get blueprints by difficulty
export function getBlueprintsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): StructureBlueprint[] {
  // STRUCTURE_BLUEPRINTS already contains both built-in and schematic blueprints
  // No need to add schematic blueprints again
  const blueprints = Object.values(STRUCTURE_BLUEPRINTS).filter(blueprint => blueprint.difficulty === difficulty);

  console.log(`Found ${blueprints.length} blueprints for difficulty ${difficulty}:`);
  blueprints.forEach(bp => console.log(`- ${bp.name} (${bp.id})`));

  return blueprints;
}

// Utility: get default blueprint for a difficulty
export function getDefaultBlueprintForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): StructureBlueprint | null {
  const blueprints = getBlueprintsByDifficulty(difficulty);
  return blueprints.length > 0 ? blueprints[0] : null;
}
