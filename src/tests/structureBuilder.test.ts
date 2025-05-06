// src/tests/structureBuilder.test.ts
// Tests for the structure builder module

import structureBuilder from '../game/structureBuilder';
import blockAwardManager from '../game/blockAwardManager';
import { BLOCK_TYPES } from '../game/blockTypes';
import * as BABYLON from '@babylonjs/core';

// Mock the window object
declare global {
  interface Window {
    awardedBlocks: Record<string, number>;
    dispatchEvent: (event: Event) => boolean;
    addEventListener: (event: string, callback: () => void) => void;
    removeEventListener: (event: string, callback: () => void) => void;
  }
}

// Mock blockAwardManager
jest.mock('../game/blockAwardManager', () => ({
  getBlocks: jest.fn(),
  awardBlock: jest.fn(),
  removeBlock: jest.fn(),
  setBlockTypes: jest.fn(),
  getBlockCount: jest.fn(),
}));

// Mock getBlueprintById
jest.mock('../game/structureBlueprints', () => ({
  getBlueprintById: jest.fn(),
}));

describe('StructureBuilder', () => {
  let mockScene: BABYLON.Scene;
  let mockBlueprint: any;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock BABYLON.Scene
    mockScene = {
      dispose: jest.fn(),
    } as unknown as BABYLON.Scene;
    
    // Mock blueprint
    mockBlueprint = {
      id: 'test_blueprint',
      name: 'Test Blueprint',
      difficulty: 'easy',
      description: 'A test blueprint',
      blocks: [
        { blockTypeId: 'dirt', position: { x: 0, y: 0, z: 0 } },
        { blockTypeId: 'stone', position: { x: 1, y: 0, z: 0 } },
        { blockTypeId: 'log_spruce', position: { x: 0, y: 1, z: 0 } },
      ],
      dimensions: {
        width: 2,
        height: 2,
        depth: 1,
      },
    };
    
    // Mock getBlueprintById
    const { getBlueprintById } = require('../game/structureBlueprints');
    getBlueprintById.mockReturnValue(mockBlueprint);
    
    // Mock blockAwardManager.getBlocks
    const mockBlocks = {
      dirt: 1,
      stone: 1,
      log_spruce: 0,
    };
    blockAwardManager.getBlocks = jest.fn().mockReturnValue(mockBlocks);
    
    // Mock window
    global.window = {
      awardedBlocks: { ...mockBlocks },
      dispatchEvent: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as Window;
  });
  
  test('setBlueprint should set the current blueprint', () => {
    structureBuilder.initialize(mockScene);
    const result = structureBuilder.setBlueprint('test_blueprint');
    
    expect(result).toBe(true);
    expect(structureBuilder.getStructureState()).not.toBeNull();
    expect(structureBuilder.getStructureState()?.blueprintId).toBe('test_blueprint');
  });
  
  test('updateStructureState should correctly calculate completed and remaining blocks', () => {
    structureBuilder.initialize(mockScene);
    structureBuilder.setBlueprint('test_blueprint');
    
    const state = structureBuilder.getStructureState();
    
    expect(state).not.toBeNull();
    expect(state?.completedBlocks.length).toBe(2); // dirt and stone
    expect(state?.remainingBlocks.length).toBe(1); // log_spruce
    expect(state?.progress).toBeCloseTo(2/3); // 2 out of 3 blocks
    expect(state?.isComplete).toBe(false);
  });
  
  test('getRemainingBlockCounts should return correct counts', () => {
    structureBuilder.initialize(mockScene);
    structureBuilder.setBlueprint('test_blueprint');
    
    const counts = structureBuilder.getRemainingBlockCounts();
    
    expect(counts).toEqual({
      log_spruce: 1,
    });
  });
  
  test('isComplete should return false when structure is not complete', () => {
    structureBuilder.initialize(mockScene);
    structureBuilder.setBlueprint('test_blueprint');
    
    expect(structureBuilder.isComplete()).toBe(false);
  });
  
  test('isComplete should return true when structure is complete', () => {
    // Mock all blocks as available
    blockAwardManager.getBlocks = jest.fn().mockReturnValue({
      dirt: 1,
      stone: 1,
      log_spruce: 1,
    });
    
    structureBuilder.initialize(mockScene);
    structureBuilder.setBlueprint('test_blueprint');
    
    expect(structureBuilder.isComplete()).toBe(true);
  });
  
  test('getProgress should return correct progress value', () => {
    structureBuilder.initialize(mockScene);
    structureBuilder.setBlueprint('test_blueprint');
    
    expect(structureBuilder.getProgress()).toBeCloseTo(2/3);
  });
  
  test('dispose should clean up resources', () => {
    structureBuilder.initialize(mockScene);
    structureBuilder.dispose();
    
    expect(window.removeEventListener).toHaveBeenCalled();
  });
});
