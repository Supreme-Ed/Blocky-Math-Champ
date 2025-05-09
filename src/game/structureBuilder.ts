// src/game/structureBuilder.ts
// Handles logic for reading blueprints, tracking blocks, and visualizing structures
// as blocks are collected during gameplay.

import * as BABYLON from '@babylonjs/core';
import type { StructureBlueprint, BlueprintBlock } from './structureBlueprints';
import { getBlueprintById, getBlueprintsByDifficulty } from './structureBlueprints';
import blockAwardManager from './blockAwardManager';
import { getBlockTypeById, BLOCK_TYPES } from './blockTypes';
import { getValidBlockTypeId } from './blockTypeMapper';
import type { SchematicBlueprint } from './schematicManager';

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
  isPermanentlyPlaced?: boolean; // Has this specific instance been placed by buildStructure?
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

    // Use debounced event handlers to prevent excessive updates
    let updateTimeout: number | null = null;

    const debouncedUpdate = () => {
      if (updateTimeout !== null) {
        window.clearTimeout(updateTimeout);
      }

      // Delay updates by 50ms to batch multiple events
      updateTimeout = window.setTimeout(() => {
        this.updateStructureState();
        this.updateVisualization();
        updateTimeout = null;
      }, 50);
    };

    this.blockAwardListener = () => {
      debouncedUpdate();
    };

    this.blockRemoveListener = () => {
      debouncedUpdate();
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
    try {
      console.log(`[EIFFEL_DEBUG] Setting blueprint with ID: ${blueprintId}`);
      const blueprint = getBlueprintById(blueprintId);
      if (!blueprint) {
        console.error(`[EIFFEL_DEBUG] Blueprint not found: ${blueprintId}`);
        return false;
      }

      // Count air blocks
      const airBlocks = blueprint.blocks.filter(block => block.blockTypeId === 'air').length;
      console.log(`[STRUCTURE_DEBUG] Blueprint has ${airBlocks} air blocks out of ${blueprint.blocks.length} total blocks`);


      console.log(`[EIFFEL_DEBUG] Blueprint found: ${blueprint.name} (${blueprint.id})`);

      // Validate blueprint structure
      if (!blueprint.blocks || !Array.isArray(blueprint.blocks)) {
        console.error(`Invalid blueprint structure: blocks array is missing or not an array for ${blueprintId}`);
        return false;
      }

      // Check if this is a schematic blueprint with fromFile flag
      const schematicBlueprint = blueprint as SchematicBlueprint;
      if ('fromFile' in blueprint && schematicBlueprint.fromFile) {
        console.log(`[EIFFEL_DEBUG] Blueprint is from file: ${schematicBlueprint.fromFile}`);
        console.log(`[EIFFEL_DEBUG] Original filename: ${schematicBlueprint.originalFilename || 'unknown'}`);
      }

      // Log the first few blocks to help with debugging
      console.log(`[EIFFEL_DEBUG] Blueprint has ${blueprint.blocks.length} blocks. First 3 blocks:`);
      blueprint.blocks.slice(0, 3).forEach((block, index) => {
        console.log(`[EIFFEL_DEBUG] Block ${index}:`, block);
      });

      try {
        // Validate the blueprint blocks before setting the state
        if (!blueprint.blocks || !Array.isArray(blueprint.blocks) || blueprint.blocks.length === 0) {
          console.error(`Invalid blueprint blocks for ${blueprintId}`);
          return false;
        }

        // Check a sample of blocks to ensure they have required properties
        const sampleSize = Math.min(5, blueprint.blocks.length);
        for (let i = 0; i < sampleSize; i++) {
          const block = blueprint.blocks[i];
          if (!block || typeof block.blockTypeId !== 'string' || !block.position) {
            console.error(`Invalid block at index ${i} in blueprint ${blueprintId}:`, block);
            return false;
          }

          // Check position properties
          if (typeof block.position.x !== 'number' ||
              typeof block.position.y !== 'number' ||
              typeof block.position.z !== 'number') {
            console.error(`Invalid block position at index ${i} in blueprint ${blueprintId}:`, block.position);
            return false;
          }
        }

        try {
          // Initialize the current state with default values
          this.currentState = {
            blueprintId,
            blueprint,
            completedBlocks: [],
            remainingBlocks: [...blueprint.blocks],
            progress: 0,
            isComplete: false,
            isPermanentlyPlaced: false, // Initialize here
          };

          // Update the structure state
          console.log(`[EIFFEL_DEBUG] Updating structure state for ${blueprint.name} (${blueprint.id})`);
          this.updateStructureState();

          // Update the visualization
          console.log(`[EIFFEL_DEBUG] Updating visualization for ${blueprint.name} (${blueprint.id})`);
          this.updateVisualization();

          return true;
        } catch (error) {
          console.error(`Error updating structure state or visualization for ${blueprintId}:`, error);
          return false;
        }
      } catch (error) {
        console.error(`Error initializing blueprint ${blueprintId}:`, error);
        return false;
      }
    } catch (error) {
      console.error(`Error setting blueprint ${blueprintId}:`, error);
      return false;
    }
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
   * This is a completely rewritten version to avoid any potential infinite recursion
   */
  private updateStructureState(): void {
    // Early return if no current state or blueprint
    if (!this.currentState || !this.currentState.blueprint) {
      console.log('No current state or blueprint to update');
      return;
    }

    try {
      // Get available blocks from inventory
      const availableBlocks = blockAwardManager.getBlocks();
      const blueprint = this.currentState.blueprint;

      // Safety check: ensure blueprint has blocks array
      if (!blueprint.blocks || !Array.isArray(blueprint.blocks)) {
        console.error('Invalid blueprint structure: blocks array is missing or not an array');
        return;
      }

      // Create a safe mapping of block types to valid block types
      // This avoids calling getValidBlockTypeId which might cause recursion
      const safeBlockTypeMapping: Record<string, string> = {};

      // First pass: create a mapping of all block types to safe fallbacks
      // We'll use the BLOCK_TYPES array directly to avoid any potential recursion
      for (const block of blueprint.blocks) {
        // Skip invalid blocks
        if (!block || typeof block.blockTypeId !== 'string') {
          continue;
        }

        // Special case for air blocks - preserve them as 'air'
        if (block.blockTypeId === 'air') {
          safeBlockTypeMapping[block.blockTypeId] = 'air';
          continue;
        }

        // If we haven't mapped this block type yet
        if (!safeBlockTypeMapping[block.blockTypeId]) {
          // First try: use the block type directly if it exists in BLOCK_TYPES
          const blockTypeExists = BLOCK_TYPES.some(type => type.id === block.blockTypeId);
          if (blockTypeExists) {
            safeBlockTypeMapping[block.blockTypeId] = block.blockTypeId;
            continue;
          }

          // Second try: use 'stone' as a safe fallback
          safeBlockTypeMapping[block.blockTypeId] = 'stone';
        }
      }

      // Count required blocks by type using our safe mapping
      const requiredBlockCounts: Record<string, number> = {};
      for (const block of blueprint.blocks) {
        // Skip invalid blocks
        if (!block || typeof block.blockTypeId !== 'string') {
          continue;
        }

        // Skip air blocks - they don't require inventory items
        if (block.blockTypeId === 'air') {
          continue;
        }

        // Get the mapped block type (or use stone as fallback)
        const mappedType = safeBlockTypeMapping[block.blockTypeId] || 'stone';
        requiredBlockCounts[mappedType] = (requiredBlockCounts[mappedType] || 0) + 1;
      }

      // Determine how many blocks of each type we can place
      const placedBlockCounts: Record<string, number> = {};
      for (const [blockType, requiredCount] of Object.entries(requiredBlockCounts)) {
        const availableCount = availableBlocks[blockType] || 0;
        placedBlockCounts[blockType] = Math.min(availableCount, requiredCount);
      }

      // Group blocks by their mapped type
      const blocksByMappedType: Record<string, BlueprintBlock[]> = {};
      for (const block of blueprint.blocks) {
        // Skip invalid blocks
        if (!block || typeof block.blockTypeId !== 'string') {
          continue;
        }

        // Get the mapped block type
        const mappedType = safeBlockTypeMapping[block.blockTypeId] || 'stone';

        // Initialize array if needed
        if (!blocksByMappedType[mappedType]) {
          blocksByMappedType[mappedType] = [];
        }

        // Add block to the appropriate group
        blocksByMappedType[mappedType].push(block);
      }

      // Create completed and remaining block lists
      const completedBlocks: BlueprintBlock[] = [];
      const remainingBlocks: BlueprintBlock[] = [];

      // For each block type, add the appropriate number to completed/remaining
      for (const [mappedType, blocks] of Object.entries(blocksByMappedType)) {
        const numCompleted = placedBlockCounts[mappedType] || 0;

        // Safety check: ensure we don't exceed array bounds
        if (numCompleted <= blocks.length) {
          // Add blocks to completed (up to the number we can place)
          completedBlocks.push(...blocks.slice(0, numCompleted));

          // Add remaining blocks to the remaining list
          remainingBlocks.push(...blocks.slice(numCompleted));
        } else {
          console.warn(`Invalid numCompleted (${numCompleted}) exceeds blocks length (${blocks.length}) for ${mappedType}`);
          // Add all blocks to completed as a fallback
          completedBlocks.push(...blocks);
        }
      }

      // Calculate progress, excluding air blocks from the total count
      const nonAirBlocks = blueprint.blocks.filter(block => block.blockTypeId !== 'air');
      const totalBlocks = nonAirBlocks.length;
      const numCompleted = completedBlocks.length;
      const progress = totalBlocks > 0 ? numCompleted / totalBlocks : 0;

      // Structure is complete if all non-air blocks are completed
      const isComplete = numCompleted >= totalBlocks;

      // Preserve isPermanentlyPlaced if it exists
      const currentPermanentlyPlaced = this.currentState.isPermanentlyPlaced;

      // Update the state
      this.currentState = {
        ...this.currentState,
        completedBlocks,
        remainingBlocks,
        progress,
        isComplete,
        isPermanentlyPlaced: currentPermanentlyPlaced, // Persist the flag
      };

      console.log(`Structure state updated: ${numCompleted}/${totalBlocks} blocks completed (${Math.round(progress * 100)}%)`);
    } catch (error) {
      console.error('Error in updateStructureState:', error);
      // Don't update state if there's an error to prevent infinite recursion
    }
  }

  /**
   * Update the visual representation of the structure
   */
  private updateVisualization(): void {
    if (!this.scene || !this.currentState || !this.currentState.blueprint) return;

    // Use setTimeout to defer the visualization update to the next frame
    // This prevents blocking the UI thread during event handling
    setTimeout(() => {
      if (!this.scene || !this.currentState || !this.currentState.blueprint) return;

      // Clear existing visualization
      this.clearVisualization();

      const { position, scale, showCompleted, showRemaining, remainingOpacity, completedOpacity } = this.options;

      // Create parent node for the structure
      const structureNode = new BABYLON.TransformNode('structure', this.scene);
      structureNode.position = position || new BABYLON.Vector3(10, 0, 10);
      structureNode.scaling = new BABYLON.Vector3(scale || 0.5, scale || 0.5, scale || 0.5);

      // Group blocks by type for more efficient creation
      const completedBlocksByType: Record<string, BlueprintBlock[]> = {};
      const remainingBlocksByType: Record<string, BlueprintBlock[]> = {};

      // Group completed blocks by type (skip air blocks)
      if (showCompleted && this.currentState.completedBlocks.length > 0) {
        this.currentState.completedBlocks.forEach(block => {
          // Skip air blocks - they should not be rendered
          if (block.blockTypeId === 'air') {
            console.log('Skipping air block in completed blocks');
            return;
          }

          if (!completedBlocksByType[block.blockTypeId]) {
            completedBlocksByType[block.blockTypeId] = [];
          }
          completedBlocksByType[block.blockTypeId].push(block);
        });
      }

      // Group remaining blocks by type (skip air blocks)
      if (showRemaining && this.currentState.remainingBlocks.length > 0) {
        this.currentState.remainingBlocks.forEach(block => {
          // Skip air blocks - they should not be rendered
          if (block.blockTypeId === 'air') {
            console.log('Skipping air block in remaining blocks');
            return;
          }

          if (!remainingBlocksByType[block.blockTypeId]) {
            remainingBlocksByType[block.blockTypeId] = [];
          }
          remainingBlocksByType[block.blockTypeId].push(block);
        });
      }

      // Create a safe mapping of block types to valid block types
      // This avoids calling getValidBlockTypeId which might cause recursion
      const safeBlockTypeMapping: Record<string, string> = {};

      // Get all unique block types from completed and remaining blocks
      const allBlockTypes = [
        ...Object.keys(completedBlocksByType),
        ...Object.keys(remainingBlocksByType)
      ];

      // Create a mapping for each block type
      for (const blockTypeId of allBlockTypes) {
        // Skip if we've already mapped this block type
        if (safeBlockTypeMapping[blockTypeId]) continue;

        // First try: use the block type directly if it exists in BLOCK_TYPES
        const blockTypeExists = BLOCK_TYPES.some(type => type.id === blockTypeId);
        if (blockTypeExists) {
          safeBlockTypeMapping[blockTypeId] = blockTypeId;
          continue;
        }

        // Second try: use 'stone' as a safe fallback
        safeBlockTypeMapping[blockTypeId] = 'stone';
      }

      // Create completed blocks by type (more efficient)
      Object.entries(completedBlocksByType).forEach(([blockTypeId, blocks]) => {
        // Use the safe mapping instead of calling getValidBlockTypeId
        const validBlockTypeId = safeBlockTypeMapping[blockTypeId] || 'stone';
        const blockType = getBlockTypeById(validBlockTypeId);

        if (!blockType) {
          console.error(`No valid block type found for ${blockTypeId}, even after fallback`);
          return;
        }

        // Create material once per block type
        if (!this.scene) return;
        const material = new BABYLON.StandardMaterial(`completed_material_${validBlockTypeId}`, this.scene);

        // Apply texture if available
        if (blockType.texture) {
          material.diffuseTexture = new BABYLON.Texture(blockType.texture, this.scene);
          material.diffuseTexture.hasAlpha = true;

          // Disable using alpha from diffuse texture for transparency
          material.useAlphaFromDiffuseTexture = false;

          // Force the texture to use nearest neighbor filtering for pixelated look
          if (material.diffuseTexture.updateSamplingMode) {
            material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
          }
        }

        // Apply color if available
        if (blockType.color) {
          material.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
        }

        // Set opacity and transparency mode
        material.alpha = completedOpacity || 1.0;

        // Set appropriate transparency mode based on opacity
        if (completedOpacity && completedOpacity < 1.0) {
          material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        } else {
          material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        }

        // Create meshes for each block of this type
        blocks.forEach(block => {
          const mesh = BABYLON.MeshBuilder.CreateBox(
            `structure_${validBlockTypeId}_${block.position.x}_${block.position.y}_${block.position.z}`,
            { size: 1 },
            this.scene
          );

          // Position the mesh according to the blueprint
          mesh.position = new BABYLON.Vector3(block.position.x, block.position.y, block.position.z);

          // Apply material to mesh
          mesh.material = material;

          // Make the mesh not pickable
          mesh.isPickable = false;

          // Add to parent
          mesh.parent = structureNode;

          this.meshes.push(mesh);
        });
      });

      // Create remaining blocks by type (more efficient)
      Object.entries(remainingBlocksByType).forEach(([blockTypeId, blocks]) => {
        // Use the safe mapping instead of calling getValidBlockTypeId
        const validBlockTypeId = safeBlockTypeMapping[blockTypeId] || 'stone';
        const blockType = getBlockTypeById(validBlockTypeId);

        if (!blockType) {
          console.error(`No valid block type found for ${blockTypeId}, even after fallback`);
          return;
        }

        // Create material once per block type
        if (!this.scene) return;
        const material = new BABYLON.StandardMaterial(`remaining_material_${validBlockTypeId}`, this.scene);

        // Apply texture if available
        if (blockType.texture) {
          material.diffuseTexture = new BABYLON.Texture(blockType.texture, this.scene);
          material.diffuseTexture.hasAlpha = true;

          // Disable using alpha from diffuse texture for transparency
          material.useAlphaFromDiffuseTexture = false;

          // Force the texture to use nearest neighbor filtering for pixelated look
          if (material.diffuseTexture.updateSamplingMode) {
            material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
          }
        }

        // Apply color if available
        if (blockType.color) {
          material.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
        }

        // Set opacity and transparency mode
        material.alpha = remainingOpacity || 0.3;

        // For remaining blocks, always use alpha blend since they're semi-transparent
        material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;

        // Create meshes for each block of this type
        blocks.forEach(block => {
          const mesh = BABYLON.MeshBuilder.CreateBox(
            `structure_${validBlockTypeId}_${block.position.x}_${block.position.y}_${block.position.z}`,
            { size: 1 },
            this.scene
          );

          // Position the mesh according to the blueprint
          mesh.position = new BABYLON.Vector3(block.position.x, block.position.y, block.position.z);

          // Apply material to mesh
          mesh.material = material;

          // Make the mesh not pickable
          mesh.isPickable = false;

          // Add to parent
          mesh.parent = structureNode;

          this.meshes.push(mesh);
        });
      });
    }, 0);
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
   * Check if a specific structure can be built with the current inventory
   * @param blueprintId - ID of the blueprint to check
   * @returns True if the structure can be built, false otherwise
   */
  canBuildStructure(blueprintId: string): boolean {
    const blueprint = getBlueprintById(blueprintId);
    if (!blueprint) return false;

    const availableBlocks = blockAwardManager.getBlocks();

    // Create a safe mapping of block types to valid block types
    // This avoids calling getValidBlockTypeId which might cause recursion
    const safeBlockTypeMapping: Record<string, string> = {};
    const mappedRequiredBlocks: Record<string, number> = {};

    // First pass: create a mapping of all block types to safe fallbacks
    for (const block of blueprint.blocks) {
      // Skip invalid blocks
      if (!block || typeof block.blockTypeId !== 'string') {
        console.warn('Invalid block in blueprint:', block);
        continue;
      }

      // Special case for air blocks - preserve them as 'air'
      if (block.blockTypeId === 'air') {
        safeBlockTypeMapping[block.blockTypeId] = 'air';
        continue;
      }

      // If we haven't mapped this block type yet
      if (!safeBlockTypeMapping[block.blockTypeId]) {
        // First try: use the block type directly if it exists in BLOCK_TYPES
        const blockTypeExists = BLOCK_TYPES.some(type => type.id === block.blockTypeId);
        if (blockTypeExists) {
          safeBlockTypeMapping[block.blockTypeId] = block.blockTypeId;
          continue;
        }

        // Second try: use 'stone' as a safe fallback
        safeBlockTypeMapping[block.blockTypeId] = 'stone';
      }
    }

    // Second pass: count required blocks by type using our safe mapping
    for (const block of blueprint.blocks) {
      // Skip invalid blocks
      if (!block || typeof block.blockTypeId !== 'string') {
        continue;
      }

      // Skip air blocks - they don't require inventory items
      if (block.blockTypeId === 'air') {
        continue;
      }

      // Get the mapped block type (or use stone as fallback)
      const validBlockTypeId = safeBlockTypeMapping[block.blockTypeId] || 'stone';
      mappedRequiredBlocks[validBlockTypeId] = (mappedRequiredBlocks[validBlockTypeId] || 0) + 1;
    }

    // Check if we have enough blocks of each type
    for (const [validBlockTypeId, count] of Object.entries(mappedRequiredBlocks)) {
      const available = availableBlocks[validBlockTypeId] || 0;
      if (available < count) {
        return false;
      }
    }

    return true;
  }

  /**
   * Build the current structure and add it to the scene
   * @param position - Position to place the built structure (optional)
   * @param forceRebuild - Force rebuild even if a structure exists at the position (default: false)
   * @returns True if the structure was built successfully, false otherwise
   */
  buildStructure(position?: BABYLON.Vector3, forceRebuild: boolean = false): boolean {
    if (!this.scene || !this.currentState || !this.currentState.blueprint || !this.currentState.isComplete) {
      console.log('Cannot build structure: ', {
        hasScene: !!this.scene,
        hasCurrentState: !!this.currentState,
        hasBlueprint: !!(this.currentState && this.currentState.blueprint),
        isComplete: !!(this.currentState && this.currentState.isComplete)
      });
      return false;
    }

    // Log the structure being built
    console.log(`[EIFFEL_DEBUG] Building structure: ${this.currentState.blueprint.name} (${this.currentState.blueprint.id})`);

    if (this.currentState.isPermanentlyPlaced && !forceRebuild) {
      console.log('[EIFFEL_DEBUG] Structure already permanently placed and forceRebuild is false');
      return false;
    }

    // First, clear any existing visualization to prevent conflicts
    this.clearVisualization(); // Clear preview before building permanent

    const blueprint = this.currentState.blueprint;
    console.log(`[EIFFEL_DEBUG] Building structure from blueprint: ${blueprint.name} (${blueprint.id})`);

    const buildPosition = position || new BABYLON.Vector3(-10, 0, -10); // Default position away from player
    console.log(`[EIFFEL_DEBUG] Build position: ${buildPosition.toString()}`);

    // Debug: Log the first few blocks of the blueprint
    console.log(`[EIFFEL_DEBUG] Blueprint has ${blueprint.blocks.length} blocks. First 3 blocks:`);
    blueprint.blocks.slice(0, 3).forEach((block, index) => {
      console.log(`[EIFFEL_DEBUG] Block ${index}: Type=${block.blockTypeId}, Position=(${block.position.x}, ${block.position.y}, ${block.position.z})`);
    });

    // Check if there's already a structure at this position
    // We'll dispatch a custom event to ask if this position is already occupied
    if (!forceRebuild) {
      const checkPositionEvent = new CustomEvent('checkPositionOccupied', {
        detail: {
          position: buildPosition,
          callback: (isOccupied: boolean, _existingStructureId?: string) => {
            if (isOccupied) {
              // Dispatch an event to notify that we need to find a new position
              const findNewPositionEvent = new CustomEvent('findNewPositionForStructure', {
                detail: {
                  blueprintId: blueprint.id,
                  name: blueprint.name,
                  difficulty: blueprint.difficulty,
                  blocks: blueprint.blocks,
                }
              });
              window.dispatchEvent(findNewPositionEvent);

              return false;
            } else {
              // Position is free, continue with building
              this.completeBuildStructure(buildPosition, blueprint);
              return true;
            }
          }
        }
      });

      window.dispatchEvent(checkPositionEvent);
      return true; // We'll handle the actual building in the callback
    }

    // If forceRebuild is true, just build without checking
    return this.completeBuildStructure(buildPosition, blueprint);
  }

  /**
   * Create a structure directly at the specified position
   * This is used when we need to create a structure without going through the normal build process
   * @param blueprintId - ID of the blueprint to build
   * @param position - Position to place the structure
   * @returns True if the structure was created successfully
   */
  createStructureAtPosition(blueprintId: string, position: BABYLON.Vector3): boolean {
    const blueprint = getBlueprintById(blueprintId);
    if (!blueprint) {
      return false;
    }

    return this.completeBuildStructure(position, blueprint);
  }

  /**
   * Complete the structure building process
   * @param buildPosition - Position to place the structure
   * @param blueprint - Blueprint to build
   * @returns True if the structure was built successfully
   */
  private completeBuildStructure(buildPosition: BABYLON.Vector3, blueprint: StructureBlueprint): boolean {
    if (!this.scene) {
      console.error('Cannot complete build structure: scene is null');
      return false;
    }

    console.log(`[EIFFEL_DEBUG] Completing build for structure: ${blueprint.name} (${blueprint.id})`);

    // Create a parent node for the built structure
    const nodeName = `built_structure_${blueprint.id}_${Date.now()}`;
    console.log(`[EIFFEL_DEBUG] Creating node: ${nodeName}`);
    const builtStructureNode = new BABYLON.TransformNode(nodeName, this.scene);
    builtStructureNode.position = buildPosition;

    // Count blocks by type in the blueprint
    const requiredBlocks: Record<string, number> = {};
    blueprint.blocks.forEach(block => {
      requiredBlocks[block.blockTypeId] = (requiredBlocks[block.blockTypeId] || 0) + 1;
    });

    // Remove the required blocks from the player's inventory
    Object.entries(requiredBlocks).forEach(([blockTypeId, count]) => {
      for (let i = 0; i < count; i++) {
        blockAwardManager.removeBlock(blockTypeId);
      }
    });

    // Create meshes for all blocks in the structure
    // Use a batch approach to improve performance
    const meshes: BABYLON.Mesh[] = [];
    const blocksByType: Record<string, BlueprintBlock[]> = {};

    // Group blocks by type for more efficient creation (skip air blocks)
    blueprint.blocks.forEach(block => {
      // Skip air blocks - they should not be rendered
      if (block.blockTypeId === 'air') {
        console.log('Skipping air block in blueprint blocks');
        return;
      }

      if (!blocksByType[block.blockTypeId]) {
        blocksByType[block.blockTypeId] = [];
      }
      blocksByType[block.blockTypeId].push(block);
    });

    // Create a safe mapping of block types to valid block types
    // This avoids calling getValidBlockTypeId which might cause recursion
    const safeBlockTypeMapping: Record<string, string> = {};

    // Get all unique block types
    const allBlockTypes = Object.keys(blocksByType);

    // Create a mapping for each block type
    for (const blockTypeId of allBlockTypes) {
      // Skip if we've already mapped this block type
      if (safeBlockTypeMapping[blockTypeId]) continue;

      // First try: use the block type directly if it exists in BLOCK_TYPES
      const blockTypeExists = BLOCK_TYPES.some(type => type.id === blockTypeId);
      if (blockTypeExists) {
        safeBlockTypeMapping[blockTypeId] = blockTypeId;
        continue;
      }

      // Second try: use 'stone' as a safe fallback
      safeBlockTypeMapping[blockTypeId] = 'stone';
    }

    // Create meshes by type (more efficient than one by one)
    Object.entries(blocksByType).forEach(([blockTypeId, blocks]) => {
      // Use the safe mapping instead of calling getValidBlockTypeId
      const validBlockTypeId = safeBlockTypeMapping[blockTypeId] || 'stone';

      // For Eiffel Tower debugging, log specific block types
      if (blockTypeId === 'iron_block' || blockTypeId === 'gold_block' || blockTypeId === 'diamond_block' || blockTypeId === 'glass') {
        console.log(`[EIFFEL_DEBUG] Creating ${blocks.length} meshes for block type: ${blockTypeId} -> ${validBlockTypeId}`);
      }

      const blockType = getBlockTypeById(validBlockTypeId);

      if (!blockType) {
        console.error(`[EIFFEL_DEBUG] No valid block type found for ${blockTypeId}, even after fallback`);
        return;
      }

      // Create material once per block type
      if (!this.scene) {
        return;
      }
      const material = new BABYLON.StandardMaterial(`built_structure_final_material_${validBlockTypeId}_${Date.now()}`, this.scene);

      // Apply texture if available
      if (blockType.texture && this.scene) {
        material.diffuseTexture = new BABYLON.Texture(blockType.texture, this.scene);
        material.diffuseTexture.hasAlpha = true;

        // Disable using alpha from diffuse texture for transparency
        material.useAlphaFromDiffuseTexture = false;

        // Force the texture to use nearest neighbor filtering for pixelated look
        if (material.diffuseTexture.updateSamplingMode) {
          material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
        }
      }

      // Apply color if available
      if (blockType.color) {
        material.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
      }

      // Set opacity and transparency mode
      material.alpha = 1.0; // Fully opaque
      material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
      material.needAlphaBlending = () => false;

      // Create meshes for each block of this type
      blocks.forEach(block => {
        if (!this.scene) {
          return;
        }

        const mesh = BABYLON.MeshBuilder.CreateBox(
          `structure_${validBlockTypeId}_${block.position.x}_${block.position.y}_${block.position.z}`,
          { size: 1 },
          this.scene
        );

        // Position the mesh according to the blueprint
        mesh.position = new BABYLON.Vector3(block.position.x, block.position.y, block.position.z);

        // Apply material to mesh
        mesh.material = material;

        // Make the mesh pickable for interaction
        mesh.isPickable = true;

        // Add to parent
        mesh.parent = builtStructureNode;

        meshes.push(mesh);
      });
    });

    // Dispatch an event to notify that a structure was built
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('structureBuilt', {
        detail: {
          blueprintId: blueprint.id,
          name: blueprint.name,
          difficulty: blueprint.difficulty,
          position: buildPosition,
          blocks: blueprint.blocks, // Include the blocks data for proper recreation
        },
      });
      window.dispatchEvent(event);
    }

    // Mark as permanently placed
    if (this.currentState) {
        this.currentState.isPermanentlyPlaced = true;

        // Set the next blueprint of the same difficulty
        if (blueprint.difficulty) {
            // Check if the current blueprint is a schematic blueprint
            const isSchematic = blueprint.id.includes('_mcbuild_org_');

            // Get all blueprints of the same difficulty
            const blueprints = getBlueprintsByDifficulty(blueprint.difficulty);

            // Filter blueprints based on type (schematic or built-in)
            const filteredBlueprints = isSchematic
                ? blueprints.filter(bp => bp.id.includes('_mcbuild_org_')) // Only schematic blueprints
                : blueprints.filter(bp => !bp.id.includes('_mcbuild_org_')); // Only built-in blueprints

            console.log(`[EIFFEL_DEBUG] Found ${filteredBlueprints.length} ${isSchematic ? 'schematic' : 'built-in'} blueprints of difficulty ${blueprint.difficulty}`);
            filteredBlueprints.forEach(bp => console.log(`[EIFFEL_DEBUG] - ${bp.name} (${bp.id})`));

            // Find the next blueprint (different from the current one)
            const nextBlueprint = filteredBlueprints.find(bp => bp.id !== blueprint.id);

            if (nextBlueprint) {
                // Set the next blueprint after a short delay to allow the UI to update
                setTimeout(() => {
                    console.log(`[EIFFEL_DEBUG] Setting next blueprint: ${nextBlueprint.name} (${nextBlueprint.id})`);
                    this.setBlueprint(nextBlueprint.id);
                }, 500);
            } else {
                console.log(`[EIFFEL_DEBUG] No next blueprint found for ${blueprint.name} (${blueprint.id})`);

                // If no next blueprint of the same type is found, try any blueprint of the same difficulty
                const anyBlueprint = blueprints.find(bp => bp.id !== blueprint.id);
                if (anyBlueprint) {
                    setTimeout(() => {
                        console.log(`[EIFFEL_DEBUG] Setting any blueprint of same difficulty: ${anyBlueprint.name} (${anyBlueprint.id})`);
                        this.setBlueprint(anyBlueprint.id);
                    }, 500);
                }
            }
        }
    }

    return true;
  }
}

// Singleton export for convenience

const structureBuilder = new StructureBuilder();
export default structureBuilder;
