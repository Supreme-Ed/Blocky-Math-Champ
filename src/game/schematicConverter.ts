// src/game/schematicConverter.ts
// Utility to convert schematic blueprints to proper structures

import { StructureBlueprint, BlueprintBlock } from './structureBlueprints';
import { getBlockTypeById } from './blockTypes';

/**
 * Converts a placeholder schematic blueprint to a proper structure
 * @param blueprint The placeholder blueprint to convert
 * @returns A new blueprint with the proper structure
 */
export function convertPlaceholderToProperStructure(blueprint: StructureBlueprint): StructureBlueprint {
  // Check if this is a cozy cabin
  if (blueprint.id.includes('cozy_cabin')) {
    return convertToCozyCabin(blueprint);
  }
  
  // Check if this is a watermill
  if (blueprint.id.includes('watermill')) {
    return convertToWatermill(blueprint);
  }
  
  // Default: return the original blueprint
  return blueprint;
}

/**
 * Converts a placeholder blueprint to a cozy cabin
 * @param blueprint The placeholder blueprint
 * @returns A new blueprint with a proper cozy cabin structure
 */
function convertToCozyCabin(blueprint: StructureBlueprint): StructureBlueprint {
  // Create a new blueprint with the same metadata
  const newBlueprint: StructureBlueprint = {
    ...blueprint,
    description: "A cozy cabin with wooden walls and a pitched roof",
    blocks: []
  };
  
  const width = 5;
  const depth = 5;
  const height = 5;
  
  // Create a proper cozy cabin structure
  
  // Stone foundation
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      newBlueprint.blocks.push({
        blockTypeId: 'stone',
        position: { x, y: 0, z }
      });
    }
  }
  
  // Wooden walls (first floor)
  for (let y = 1; y < 3; y++) {
    // Front wall with door
    for (let x = 0; x < width; x++) {
      if (!(y === 1 && x === 2)) { // Door position
        newBlueprint.blocks.push({
          blockTypeId: 'planks_oak',
          position: { x, y, z: 0 }
        });
      }
    }
    
    // Back wall
    for (let x = 0; x < width; x++) {
      newBlueprint.blocks.push({
        blockTypeId: 'planks_oak',
        position: { x, y, z: depth - 1 }
      });
    }
    
    // Side walls
    for (let z = 1; z < depth - 1; z++) {
      newBlueprint.blocks.push({
        blockTypeId: 'planks_oak',
        position: { x: 0, y, z }
      });
      
      newBlueprint.blocks.push({
        blockTypeId: 'planks_oak',
        position: { x: width - 1, y, z }
      });
    }
  }
  
  // Windows
  newBlueprint.blocks.push({
    blockTypeId: 'glass',
    position: { x: 1, y: 2, z: 0 }
  });
  
  newBlueprint.blocks.push({
    blockTypeId: 'glass',
    position: { x: 3, y: 2, z: 0 }
  });
  
  newBlueprint.blocks.push({
    blockTypeId: 'glass',
    position: { x: 1, y: 2, z: depth - 1 }
  });
  
  newBlueprint.blocks.push({
    blockTypeId: 'glass',
    position: { x: 3, y: 2, z: depth - 1 }
  });
  
  // Pitched roof
  for (let y = 3; y < height; y++) {
    const roofWidth = width - 2 * (y - 3);
    const startX = (width - roofWidth) / 2;
    
    for (let x = startX; x < startX + roofWidth; x++) {
      for (let z = 0; z < depth; z++) {
        newBlueprint.blocks.push({
          blockTypeId: 'planks_spruce',
          position: { x, y, z }
        });
      }
    }
  }
  
  return newBlueprint;
}

/**
 * Converts a placeholder blueprint to a watermill
 * @param blueprint The placeholder blueprint
 * @returns A new blueprint with a proper watermill structure
 */
function convertToWatermill(blueprint: StructureBlueprint): StructureBlueprint {
  // Create a new blueprint with the same metadata
  const newBlueprint: StructureBlueprint = {
    ...blueprint,
    description: "A traditional watermill with a water wheel",
    blocks: []
  };
  
  const width = 7;
  const depth = 9;
  const height = 8;
  
  // Create a proper watermill structure
  
  // Stone foundation and water channel
  for (let x = 0; x < width; x++) {
    for (let z = 0; z < depth; z++) {
      // Water channel in the middle
      if (z === Math.floor(depth / 2) && x > 0 && x < width - 1) {
        newBlueprint.blocks.push({
          blockTypeId: 'water',
          position: { x, y: 0, z }
        });
      } else {
        newBlueprint.blocks.push({
          blockTypeId: 'stone',
          position: { x, y: 0, z }
        });
      }
    }
  }
  
  // Wooden structure
  for (let y = 1; y < height - 2; y++) {
    // Front and back walls
    for (let x = 0; x < width; x++) {
      // Front door
      if (!(y === 1 && x === Math.floor(width / 2) && z === 0)) {
        newBlueprint.blocks.push({
          blockTypeId: 'planks_oak',
          position: { x, y, z: 0 }
        });
      }
      
      newBlueprint.blocks.push({
        blockTypeId: 'planks_oak',
        position: { x, y, z: depth - 1 }
      });
    }
    
    // Side walls
    for (let z = 1; z < depth - 1; z++) {
      // Skip the water wheel area
      if (!(z === Math.floor(depth / 2) && y < 4)) {
        newBlueprint.blocks.push({
          blockTypeId: 'planks_oak',
          position: { x: 0, y, z }
        });
        
        newBlueprint.blocks.push({
          blockTypeId: 'planks_oak',
          position: { x: width - 1, y, z }
        });
      }
    }
  }
  
  // Water wheel
  const wheelCenterX = 0;
  const wheelCenterY = 2;
  const wheelCenterZ = Math.floor(depth / 2);
  const wheelRadius = 2;
  
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.round(wheelCenterX - wheelRadius * Math.cos(angle));
    const y = Math.round(wheelCenterY + wheelRadius * Math.sin(angle));
    
    newBlueprint.blocks.push({
      blockTypeId: 'planks_spruce',
      position: { x, y, z: wheelCenterZ }
    });
  }
  
  // Roof
  for (let y = height - 2; y < height; y++) {
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        if (y === height - 1 && (x === 0 || x === width - 1 || z === 0 || z === depth - 1)) {
          continue; // Skip corners of the top layer
        }
        
        newBlueprint.blocks.push({
          blockTypeId: 'planks_spruce',
          position: { x, y, z }
        });
      }
    }
  }
  
  return newBlueprint;
}
