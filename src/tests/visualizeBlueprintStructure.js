// src/tests/visualizeBlueprintStructure.js
// Simple script to visualize the structure blueprints in ASCII art

// Import the blueprints
const blueprints = {
  easy_house: {
    name: 'Simple Cabin',
    difficulty: 'easy',
    dimensions: { width: 5, height: 4, depth: 5 },
    blocks: [
      // Floor (25 planks_spruce blocks at y=0)
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
      { blockTypeId: 'log_spruce', position: { x: 0, y: 1, z: 1 } },
      { blockTypeId: 'log_spruce', position: { x: 0, y: 2, z: 1 } },
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
  },
  
  medium_well: {
    name: 'Village Well',
    difficulty: 'medium',
    dimensions: { width: 5, height: 6, depth: 5 },
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
  }
};

// Function to visualize a blueprint as ASCII art
function visualizeBlueprint(blueprintId) {
  const blueprint = blueprints[blueprintId];
  if (!blueprint) {
    console.log(`Blueprint with ID '${blueprintId}' not found.`);
    return;
  }

  console.log(`\n=== ${blueprint.name} (${blueprint.difficulty}) ===`);
  console.log(`Dimensions: ${blueprint.dimensions.width}x${blueprint.dimensions.height}x${blueprint.dimensions.depth}`);
  console.log(`Total blocks: ${blueprint.blocks.length}`);
  
  // Count blocks by type
  const blockCounts = {};
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
  const layers = {};
  
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

Object.keys(blueprints).forEach(blueprintId => {
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
