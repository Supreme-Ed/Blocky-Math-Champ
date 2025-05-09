// src/tests/visualizeStructureBuilder.ts
// Simple script to visualize the structure builder functionality

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
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  blocks: BlueprintBlock[];
}

interface StructureState {
  blueprintId: string;
  blueprint: Blueprint;
  completedBlocks: BlueprintBlock[];
  remainingBlocks: BlueprintBlock[];
  progress: number;
  isComplete: boolean;
}

// Mock the structure builder and related modules
const structureBuilder = {
  initialize: (): void => console.log('Structure builder initialized'),
  setBlueprint: (id: string): boolean => {
    console.log(`Setting blueprint: ${id}`);
    return true;
  },
  getStructureState: (): StructureState => ({
    blueprintId: 'easy_house',
    blueprint: blueprints.easy_house,
    completedBlocks: completedBlocks,
    remainingBlocks: remainingBlocks,
    progress: completedBlocks.length / (completedBlocks.length + remainingBlocks.length),
    isComplete: remainingBlocks.length === 0,
  }),
  getProgress: (): number => completedBlocks.length / (completedBlocks.length + remainingBlocks.length),
  isComplete: (): boolean => remainingBlocks.length === 0,
  getRemainingBlockCounts: (): Record<string, number> => {
    const counts: Record<string, number> = {};
    remainingBlocks.forEach(block => {
      counts[block.blockTypeId] = (counts[block.blockTypeId] || 0) + 1;
    });
    return counts;
  },
};

// Mock blueprints
const blueprints: Record<string, Blueprint> = {
  easy_house: {
    id: 'easy_house',
    name: 'Simple Cabin',
    difficulty: 'easy',
    description: 'A small, simple cabin with four walls and a roof.',
    dimensions: {
      width: 5,
      height: 4,
      depth: 5,
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
      { blockTypeId: 'log_spruce', position: { x: 0, y: 1, z: 0 } },
      { blockTypeId: 'log_spruce', position: { x: 0, y: 2, z: 0 } },
      { blockTypeId: 'log_spruce', position: { x: 0, y: 1, z: 4 } },
      { blockTypeId: 'log_spruce', position: { x: 0, y: 2, z: 4 } },
      
      // Roof (stone)
      ...Array.from({ length: 5 }).flatMap((_, x) => 
        Array.from({ length: 5 }).map((_, z) => ({
          blockTypeId: 'stone',
          position: { x, y: 3, z }
        }))
      ),
    ]
  }
};

// Mock available blocks
const availableBlocks: Record<string, number> = {
  'planks_spruce': 15, // Enough for most of the floor
  'log_spruce': 2,     // Enough for some walls
  'stone': 5,          // Enough for part of the roof
};

// Calculate completed and remaining blocks
const allBlocks = blueprints.easy_house.blocks;
const blocksByType: Record<string, BlueprintBlock[]> = {};

// Group blocks by type
allBlocks.forEach(block => {
  if (!blocksByType[block.blockTypeId]) {
    blocksByType[block.blockTypeId] = [];
  }
  blocksByType[block.blockTypeId].push(block);
});

// Determine completed and remaining blocks
const completedBlocks: BlueprintBlock[] = [];
const remainingBlocks: BlueprintBlock[] = [];

Object.keys(blocksByType).forEach(blockTypeId => {
  const blocks = blocksByType[blockTypeId];
  const available = availableBlocks[blockTypeId] || 0;
  
  // Add blocks to completed (up to the number we can place)
  completedBlocks.push(...blocks.slice(0, available));
  
  // Add remaining blocks to the remaining list
  remainingBlocks.push(...blocks.slice(available));
});

// Visualize the structure state
function visualizeStructureState(): void {
  const state = structureBuilder.getStructureState();
  
  console.log(`\n=== ${state.blueprint.name} (${state.blueprint.difficulty}) ===`);
  console.log(`Progress: ${(state.progress * 100).toFixed(1)}% (${completedBlocks.length}/${allBlocks.length} blocks)`);
  console.log(`Complete: ${state.isComplete ? 'Yes' : 'No'}`);
  
  // Count blocks by type
  const completedByType: Record<string, number> = {};
  completedBlocks.forEach(block => {
    completedByType[block.blockTypeId] = (completedByType[block.blockTypeId] || 0) + 1;
  });
  
  const remainingByType: Record<string, number> = {};
  remainingBlocks.forEach(block => {
    remainingByType[block.blockTypeId] = (remainingByType[block.blockTypeId] || 0) + 1;
  });
  
  console.log('\nCompleted blocks:');
  Object.entries(completedByType).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  console.log('\nRemaining blocks:');
  Object.entries(remainingByType).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  // Visualize structure (top-down view of each layer)
  console.log('\nStructure visualization:');
  
  // Create a grid for each layer
  const layers: Record<number, Record<string, string>> = {};
  
  // Initialize layers
  for (let y = 0; y < state.blueprint.dimensions.height; y++) {
    layers[y] = {};
  }
  
  // Fill in completed blocks
  completedBlocks.forEach(block => {
    const { x, y, z } = block.position;
    const key = `${x},${z}`;
    
    // Use first character of block type as marker
    const marker = block.blockTypeId.charAt(0).toUpperCase();
    
    if (!layers[y]) {
      layers[y] = {};
    }
    
    layers[y][key] = marker;
  });
  
  // Fill in remaining blocks (with lowercase letters)
  remainingBlocks.forEach(block => {
    const { x, y, z } = block.position;
    const key = `${x},${z}`;
    
    // Use first character of block type as marker (lowercase for remaining)
    const marker = block.blockTypeId.charAt(0).toLowerCase();
    
    if (!layers[y]) {
      layers[y] = {};
    }
    
    layers[y][key] = marker;
  });
  
  // Print each layer
  for (let y = state.blueprint.dimensions.height - 1; y >= 0; y--) {
    console.log(`\nLayer ${y}:`);
    
    for (let z = 0; z < state.blueprint.dimensions.depth; z++) {
      let row = '';
      
      for (let x = 0; x < state.blueprint.dimensions.width; x++) {
        const key = `${x},${z}`;
        row += layers[y][key] || '.';
      }
      
      console.log(row);
    }
  }
}

// Simulate structure building
console.log('=== STRUCTURE BUILDER VISUALIZATION ===\n');
structureBuilder.initialize();
structureBuilder.setBlueprint('easy_house');
visualizeStructureState();

// Legend
console.log('\nLegend:');
console.log('UPPERCASE (P, L, S) - Completed blocks');
console.log('lowercase (p, l, s) - Remaining blocks');
console.log('. - Empty space');
console.log('\nP/p - Planks');
console.log('L/l - Log');
console.log('S/s - Stone');
