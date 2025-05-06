// src/tests/structureBlueprints.test.ts
// Simple test to verify the structure blueprints

import { STRUCTURE_BLUEPRINTS, getBlueprintById, getBlueprintsByDifficulty } from '../game/structureBlueprints';

describe('Structure Blueprints', () => {
  test('should have blueprints for each difficulty level', () => {
    expect(Object.keys(STRUCTURE_BLUEPRINTS).length).toBeGreaterThan(0);
    
    const easyBlueprints = getBlueprintsByDifficulty('easy');
    const mediumBlueprints = getBlueprintsByDifficulty('medium');
    const hardBlueprints = getBlueprintsByDifficulty('hard');
    
    expect(easyBlueprints.length).toBeGreaterThan(0);
    expect(mediumBlueprints.length).toBeGreaterThan(0);
    expect(hardBlueprints.length).toBeGreaterThan(0);
  });
  
  test('should be able to retrieve a blueprint by ID', () => {
    const blueprint = getBlueprintById('easy_house');
    expect(blueprint).not.toBeNull();
    expect(blueprint?.name).toBe('Simple Cabin');
    expect(blueprint?.difficulty).toBe('easy');
  });
  
  test('easy house blueprint should have the correct structure', () => {
    const blueprint = getBlueprintById('easy_house');
    expect(blueprint).not.toBeNull();
    
    // Check dimensions
    expect(blueprint?.dimensions).toEqual({
      width: 5,
      height: 4,
      depth: 5
    });
    
    // Check block count
    expect(blueprint?.blocks.length).toBeGreaterThan(0);
    
    // Check for floor blocks (planks)
    const floorBlocks = blueprint?.blocks.filter(block => 
      block.position.y === 0 && block.blockTypeId === 'planks_spruce'
    );
    expect(floorBlocks?.length).toBe(25); // 5x5 floor
    
    // Check for roof blocks (stone)
    const roofBlocks = blueprint?.blocks.filter(block => 
      block.position.y === 4 && block.blockTypeId === 'stone'
    );
    expect(roofBlocks?.length).toBe(25); // 5x5 roof
  });
  
  test('medium well blueprint should have the correct structure', () => {
    const blueprint = getBlueprintById('medium_well');
    expect(blueprint).not.toBeNull();
    
    // Check dimensions
    expect(blueprint?.dimensions).toEqual({
      width: 5,
      height: 6,
      depth: 5
    });
    
    // Check for water blocks (sand as placeholder)
    const waterBlocks = blueprint?.blocks.filter(block => 
      block.position.y === 1 && block.blockTypeId === 'sand'
    );
    expect(waterBlocks?.length).toBe(9); // 3x3 water area
  });
  
  test('hard tower blueprint should have the correct structure', () => {
    const blueprint = getBlueprintById('hard_tower');
    expect(blueprint).not.toBeNull();
    
    // Check dimensions
    expect(blueprint?.dimensions).toEqual({
      width: 7,
      height: 12,
      depth: 7
    });
    
    // Check for top decoration
    const topDecoration = blueprint?.blocks.find(block => 
      block.position.y === 11 && block.blockTypeId === 'dirt'
    );
    expect(topDecoration).toBeDefined();
    expect(topDecoration?.position).toEqual({ x: 3, y: 11, z: 3 });
  });
});
