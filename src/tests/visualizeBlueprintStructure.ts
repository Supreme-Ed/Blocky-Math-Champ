// src/tests/visualizeBlueprintStructure.ts
// Simple script to visualize the structure blueprints in ASCII art

import { STRUCTURE_BLUEPRINTS, getBlueprintById } from '../game/structureBlueprints';

// Function to visualize a blueprint as ASCII art
function visualizeBlueprint(blueprintId: string): void {
  const blueprint = getBlueprintById(blueprintId);
  if (!blueprint) {
    console.log(`Blueprint with ID '${blueprintId}' not found.`);
    return;
  }

  console.log(`\n=== ${blueprint.name} (${blueprint.difficulty}) ===`);
  console.log(`Dimensions: ${blueprint.dimensions.width}x${blueprint.dimensions.height}x${blueprint.dimensions.depth}`);
  console.log(`Total blocks: ${blueprint.blocks.length}`);
  
  // Count blocks by type
  const blockCounts: Record<string, number> = {};
  blueprint.blocks.forEach(block => {
    blockCounts[block.blockTypeId] = (blockCounts[block.blockTypeId] || 0) + 1;
  });
  
  console.log('\nBlock types:');
  Object.entries(blockCounts).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  // Visualize top-down view (x-z plane)
  console.log('\nTop-down view (x-z plane):');
  
  // Create a grid for each layer
  const layers: Record<number, Record<string, string>> = {};
  
  // Initialize layers
  for (let y = 0; y < blueprint.dimensions.height; y++) {
    layers[y] = {};
  }
  
  // Fill in the blocks
  blueprint.blocks.forEach(block => {
    const { x, y, z } = block.position;
    const key = `${x},${z}`;
    
    // Use first character of block type as marker
    const marker = block.blockTypeId.charAt(0).toUpperCase();
    
    if (!layers[y]) {
      layers[y] = {};
    }
    
    layers[y][key] = marker;
  });
  
  // Print each layer
  for (let y = blueprint.dimensions.height - 1; y >= 0; y--) {
    console.log(`\nLayer ${y}:`);
    
    for (let z = 0; z < blueprint.dimensions.depth; z++) {
      let row = '';
      
      for (let x = 0; x < blueprint.dimensions.width; x++) {
        const key = `${x},${z}`;
        row += layers[y][key] || '.';
      }
      
      console.log(row);
    }
  }
}

// Visualize all blueprints
console.log('=== STRUCTURE BLUEPRINTS VISUALIZATION ===\n');

Object.keys(STRUCTURE_BLUEPRINTS).forEach(blueprintId => {
  visualizeBlueprint(blueprintId);
  console.log('\n' + '-'.repeat(50) + '\n');
});

// Legend
console.log('Legend:');
console.log('D - Dirt');
console.log('S - Stone');
console.log('P - Planks');
console.log('L - Log');
console.log('. - Empty space');
