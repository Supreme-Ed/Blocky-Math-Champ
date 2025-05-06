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
 * Represents a single block in the structure blueprint
 */
export interface BlueprintBlock {
  blockTypeId: string;
  position: Position3D;
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

// Export all blueprints
export const STRUCTURE_BLUEPRINTS: Record<string, StructureBlueprint> = {
  easy_house: easyHouseBlueprint,
  medium_well: mediumWellBlueprint,
  hard_tower: hardTowerBlueprint
};

// Utility: get blueprint by ID
export function getBlueprintById(id: string): StructureBlueprint | null {
  return STRUCTURE_BLUEPRINTS[id] || null;
}

// Utility: get blueprints by difficulty
export function getBlueprintsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): StructureBlueprint[] {
  return Object.values(STRUCTURE_BLUEPRINTS).filter(blueprint => blueprint.difficulty === difficulty);
}

// Utility: get default blueprint for a difficulty
export function getDefaultBlueprintForDifficulty(difficulty: 'easy' | 'medium' | 'hard'): StructureBlueprint | null {
  const blueprints = getBlueprintsByDifficulty(difficulty);
  return blueprints.length > 0 ? blueprints[0] : null;
}
