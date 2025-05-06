// src/game/structureBuilder.ts
// Handles logic for reading blueprints, tracking blocks, and visualizing structures
// as blocks are collected during gameplay.

import * as BABYLON from '@babylonjs/core';
import type { StructureBlueprint, BlueprintBlock } from './structureBlueprints';
import { getBlueprintById } from './structureBlueprints';
import blockAwardManager from './blockAwardManager';
import { getBlockTypeById } from './blockTypes';

/**
 * Represents the current state of a structure being built
 */
export interface StructureState {
  blueprintId: string;
  blueprint: StructureBlueprint | null;
  completedBlocks: BlueprintBlock[];
  remainingBlocks: BlueprintBlock[];
  progress: number; // 0-1 (percentage complete)
  isComplete: boolean;
}

/**
 * Options for creating a structure visualization
 */
export interface StructureVisualizationOptions {
  position?: BABYLON.Vector3;
  scale?: number;
  showCompleted?: boolean;
  showRemaining?: boolean;
  remainingOpacity?: number;
  completedOpacity?: number;
}

/**
 * Class that manages structure building and visualization
 */
export class StructureBuilder {
  private scene: BABYLON.Scene | null = null;
  private currentState: StructureState | null = null;
  private meshes: BABYLON.Mesh[] = [];
  private options: StructureVisualizationOptions = {
    position: new BABYLON.Vector3(10, 0, 10), // Default position (away from player)
    scale: 0.5, // Default scale (smaller than gameplay blocks)
    showCompleted: true,
    showRemaining: true,
    remainingOpacity: 0.3, // Semi-transparent for remaining blocks
    completedOpacity: 1.0, // Fully opaque for completed blocks
  };
  private blockAwardListener: (() => void) | null = null;
  private blockRemoveListener: (() => void) | null = null;

  /**
   * Initialize the structure builder with a scene
   * @param scene - Babylon.js scene
   */
  initialize(scene: BABYLON.Scene): void {
    this.scene = scene;
    this.setupEventListeners();
  }

  /**
   * Clean up resources when no longer needed
   */
  dispose(): void {
    this.removeEventListeners();
    this.clearVisualization();
    this.scene = null;
  }

  /**
   * Set up event listeners for block awards and removals
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    this.blockAwardListener = () => {
      this.updateStructureState();
      this.updateVisualization();
    };

    this.blockRemoveListener = () => {
      this.updateStructureState();
      this.updateVisualization();
    };

    window.addEventListener('blockAwarded', this.blockAwardListener);
    window.addEventListener('blockRemoved', this.blockRemoveListener);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (typeof window === 'undefined' || !this.blockAwardListener || !this.blockRemoveListener) return;

    window.removeEventListener('blockAwarded', this.blockAwardListener);
    window.removeEventListener('blockRemoved', this.blockRemoveListener);

    this.blockAwardListener = null;
    this.blockRemoveListener = null;
  }

  /**
   * Set the current blueprint by ID
   * @param blueprintId - ID of the blueprint to use
   * @returns True if blueprint was found and set, false otherwise
   */
  setBlueprint(blueprintId: string): boolean {
    const blueprint = getBlueprintById(blueprintId);
    if (!blueprint) return false;

    this.currentState = {
      blueprintId,
      blueprint,
      completedBlocks: [],
      remainingBlocks: [...blueprint.blocks],
      progress: 0,
      isComplete: false,
    };

    this.updateStructureState();
    this.updateVisualization();
    return true;
  }

  /**
   * Set visualization options
   * @param options - Options for structure visualization
   */
  setVisualizationOptions(options: Partial<StructureVisualizationOptions>): void {
    this.options = { ...this.options, ...options };
    this.updateVisualization();
  }

  /**
   * Update the current structure state based on available blocks
   */
  private updateStructureState(): void {
    if (!this.currentState || !this.currentState.blueprint) return;

    const availableBlocks = blockAwardManager.getBlocks();
    const blueprint = this.currentState.blueprint;

    // Count blocks by type in the blueprint
    const requiredBlocks: Record<string, number> = {};
    blueprint.blocks.forEach(block => {
      requiredBlocks[block.blockTypeId] = (requiredBlocks[block.blockTypeId] || 0) + 1;
    });

    // Determine how many blocks of each type we can place
    const placedBlocks: Record<string, number> = {};
    Object.keys(requiredBlocks).forEach(blockTypeId => {
      const available = availableBlocks[blockTypeId] || 0;
      const required = requiredBlocks[blockTypeId] || 0;
      placedBlocks[blockTypeId] = Math.min(available, required);
    });

    // Update completed and remaining blocks
    const completedBlocks: BlueprintBlock[] = [];
    const remainingBlocks: BlueprintBlock[] = [];

    // Group blocks by type for easier processing
    const blocksByType: Record<string, BlueprintBlock[]> = {};
    blueprint.blocks.forEach(block => {
      if (!blocksByType[block.blockTypeId]) {
        blocksByType[block.blockTypeId] = [];
      }
      blocksByType[block.blockTypeId].push(block);
    });

    // For each block type, add the appropriate number to completed/remaining
    Object.keys(blocksByType).forEach(blockTypeId => {
      const blocks = blocksByType[blockTypeId];
      const numCompleted = placedBlocks[blockTypeId] || 0;

      // Add blocks to completed (up to the number we can place)
      completedBlocks.push(...blocks.slice(0, numCompleted));

      // Add remaining blocks to the remaining list
      remainingBlocks.push(...blocks.slice(numCompleted));
    });

    // Update the state
    const totalBlocks = blueprint.blocks.length;
    const numCompleted = completedBlocks.length;
    const progress = totalBlocks > 0 ? numCompleted / totalBlocks : 0;
    const isComplete = numCompleted === totalBlocks;

    this.currentState = {
      ...this.currentState,
      completedBlocks,
      remainingBlocks,
      progress,
      isComplete,
    };
  }

  /**
   * Update the visual representation of the structure
   */
  private updateVisualization(): void {
    if (!this.scene || !this.currentState || !this.currentState.blueprint) return;

    // Clear existing visualization
    this.clearVisualization();

    const { position, scale, showCompleted, showRemaining, remainingOpacity, completedOpacity } = this.options;

    // Create parent node for the structure
    const structureNode = new BABYLON.TransformNode('structure', this.scene);
    structureNode.position = position || new BABYLON.Vector3(10, 0, 10);
    structureNode.scaling = new BABYLON.Vector3(scale || 0.5, scale || 0.5, scale || 0.5);

    // Create completed blocks
    if (showCompleted && this.currentState.completedBlocks.length > 0) {
      this.currentState.completedBlocks.forEach(block => {
        const mesh = this.createBlockMesh(block, completedOpacity || 1.0);
        if (mesh) {
          mesh.parent = structureNode;
          this.meshes.push(mesh);
        }
      });
    }

    // Create remaining blocks
    if (showRemaining && this.currentState.remainingBlocks.length > 0) {
      this.currentState.remainingBlocks.forEach(block => {
        const mesh = this.createBlockMesh(block, remainingOpacity || 0.3);
        if (mesh) {
          mesh.parent = structureNode;
          this.meshes.push(mesh);
        }
      });
    }
  }

  /**
   * Create a mesh for a block in the structure
   * @param block - Block data from the blueprint
   * @param opacity - Opacity for the block material
   * @returns The created mesh, or null if creation failed
   */
  private createBlockMesh(block: BlueprintBlock, opacity: number): BABYLON.Mesh | null {
    if (!this.scene) return null;

    const { blockTypeId, position } = block;
    const blockType = getBlockTypeById(blockTypeId);
    if (!blockType) return null;

    // Create a box mesh for the block
    const mesh = BABYLON.MeshBuilder.CreateBox(
      `structure_${blockTypeId}_${position.x}_${position.y}_${position.z}`,
      { size: 1 },
      this.scene
    );

    // Position the mesh according to the blueprint
    mesh.position = new BABYLON.Vector3(position.x, position.y, position.z);

    // Create material for the block
    const material = new BABYLON.StandardMaterial(`structure_material_${blockTypeId}`, this.scene);

    // Apply texture if available
    if (blockType.texture) {
      material.diffuseTexture = new BABYLON.Texture(blockType.texture, this.scene);
      material.diffuseTexture.hasAlpha = true;
    }

    // Apply color if available
    if (blockType.color) {
      material.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
    }

    // Set opacity
    material.alpha = opacity;

    // Apply material to mesh
    mesh.material = material;

    // Make the mesh not pickable (so it doesn't interfere with gameplay)
    mesh.isPickable = false;

    return mesh;
  }

  /**
   * Clear the current visualization
   */
  private clearVisualization(): void {
    this.meshes.forEach(mesh => {
      if (mesh && !mesh.isDisposed()) {
        mesh.dispose();
      }
    });
    this.meshes = [];
  }

  /**
   * Get the current structure state
   * @returns The current structure state, or null if no blueprint is set
   */
  getStructureState(): StructureState | null {
    return this.currentState;
  }

  /**
   * Get the progress of the current structure (0-1)
   * @returns Progress as a number between 0 and 1, or 0 if no blueprint is set
   */
  getProgress(): number {
    return this.currentState?.progress || 0;
  }

  /**
   * Check if the current structure is complete
   * @returns True if the structure is complete, false otherwise
   */
  isComplete(): boolean {
    return this.currentState?.isComplete || false;
  }

  /**
   * Get the remaining blocks needed to complete the structure
   * @returns Record of block type IDs to counts
   */
  getRemainingBlockCounts(): Record<string, number> {
    if (!this.currentState) return {};

    const counts: Record<string, number> = {};
    this.currentState.remainingBlocks.forEach(block => {
      counts[block.blockTypeId] = (counts[block.blockTypeId] || 0) + 1;
    });

    return counts;
  }

  /**
   * Build the current structure and add it to the scene
   * @param position - Position to place the built structure (optional)
   * @returns True if the structure was built successfully, false otherwise
   */
  buildStructure(position?: BABYLON.Vector3): boolean {
    if (!this.scene || !this.currentState || !this.currentState.blueprint || !this.currentState.isComplete) {
      return false;
    }

    const blueprint = this.currentState.blueprint;
    const buildPosition = position || new BABYLON.Vector3(-10, 0, -10); // Default position away from player

    // Create a parent node for the built structure
    const builtStructureNode = new BABYLON.TransformNode(`built_structure_${blueprint.id}_${Date.now()}`, this.scene);
    builtStructureNode.position = buildPosition;

    // Create meshes for all blocks in the structure
    blueprint.blocks.forEach(block => {
      const mesh = this.createBlockMesh(block, 1.0); // Fully opaque
      if (mesh) {
        mesh.parent = builtStructureNode;
        // Make the mesh pickable for interaction
        mesh.isPickable = true;
      }
    });

    // Remove the blocks from the player's inventory
    const requiredBlocks: Record<string, number> = {};
    blueprint.blocks.forEach(block => {
      requiredBlocks[block.blockTypeId] = (requiredBlocks[block.blockTypeId] || 0) + 1;
    });

    // Remove blocks from inventory
    Object.entries(requiredBlocks).forEach(([blockTypeId, count]) => {
      for (let i = 0; i < count; i++) {
        blockAwardManager.removeBlock(blockTypeId);
      }
    });

    // Clear the current visualization
    this.clearVisualization();

    // Reset the structure state for the next structure
    // Get the next blueprint for the same difficulty
    const difficulty = blueprint.difficulty;
    const availableBlueprints = getBlueprintsByDifficulty(difficulty);
    const nextBlueprintIndex = availableBlueprints.findIndex(bp => bp.id === blueprint.id) + 1;
    const nextBlueprint = availableBlueprints[nextBlueprintIndex % availableBlueprints.length];

    // Set the next blueprint
    if (nextBlueprint) {
      this.setBlueprint(nextBlueprint.id);
    }

    // Dispatch an event to notify that a structure was built
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('structureBuilt', {
        detail: {
          blueprintId: blueprint.id,
          name: blueprint.name,
          difficulty: blueprint.difficulty,
          position: buildPosition,
        },
      });
      window.dispatchEvent(event);
    }

    return true;
  }
}

// Singleton export for convenience
const structureBuilder = new StructureBuilder();
export default structureBuilder;
