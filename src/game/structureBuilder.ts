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
  private _visibilityObserver: number | null = null;

  /**
   * Initialize the structure builder with a scene
   * @param scene - Babylon.js scene
   */
  initialize(scene: BABYLON.Scene): void {
    this.scene = scene;

    // Configure scene for optimal rendering without breaking picking
    if (scene) {
      // Don't disable frustum clipping as it affects picking
      // scene.skipFrustumClipping = true;

      // Use balanced performance priority
      scene.performancePriority = BABYLON.ScenePerformancePriority.Balanced;

      // Add an observer to ensure only our structure meshes stay visible
      const visibilityObserver = scene.onBeforeRenderObservable.add(() => {
        // Only ensure visibility for structure meshes
        this.meshes.forEach(mesh => {
          if (mesh && !mesh.isDisposed()) {
            mesh.isVisible = true;
            mesh.visibility = 1.0;
          }
        });
      });

      // Store the observer for cleanup
      this._visibilityObserver = visibilityObserver;

      console.log(`[EIFFEL_DEBUG] Scene optimization settings configured for structure visibility`);
    }

    this.setupEventListeners();
  }

  /**
   * Clean up resources when no longer needed
   */
  dispose(): void {
    this.removeEventListeners();
    this.clearVisualization();

    // Remove the visibility observer
    if (this.scene && this._visibilityObserver !== null) {
      this.scene.onBeforeRenderObservable.remove(this._visibilityObserver);
      this._visibilityObserver = null;
    }

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
   * This version uses chunking to handle large structures without stack overflow
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

      // Log the size of the structure for debugging
      console.log(`[EIFFEL_DEBUG] Processing structure with ${blueprint.blocks.length} blocks`);

      // Create a safe mapping of block types to valid block types
      // This avoids calling getValidBlockTypeId which might cause recursion
      const safeBlockTypeMapping: Record<string, string> = {};

      // Define chunk size for processing blocks
      const CHUNK_SIZE = 500;
      const totalChunks = Math.ceil(blueprint.blocks.length / CHUNK_SIZE);

      console.log(`[EIFFEL_DEBUG] Processing in ${totalChunks} chunks of ${CHUNK_SIZE} blocks each`);

      // First pass: create a mapping of all block types to safe fallbacks
      // Process in chunks to avoid stack overflow
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, blueprint.blocks.length);

        // Process this chunk of blocks
        for (let i = startIdx; i < endIdx; i++) {
          const block = blueprint.blocks[i];

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
      }

      // Count required blocks by type using our safe mapping
      const requiredBlockCounts: Record<string, number> = {};

      // Process in chunks to avoid stack overflow
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, blueprint.blocks.length);

        // Process this chunk of blocks
        for (let i = startIdx; i < endIdx; i++) {
          const block = blueprint.blocks[i];

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
      }

      // Determine how many blocks of each type we can place
      const placedBlockCounts: Record<string, number> = {};
      for (const [blockType, requiredCount] of Object.entries(requiredBlockCounts)) {
        const availableCount = availableBlocks[blockType] || 0;
        placedBlockCounts[blockType] = Math.min(availableCount, requiredCount);
      }

      // Group blocks by their mapped type - using a more memory-efficient approach
      // Instead of storing all blocks in memory, we'll just track indices
      const blockIndicesByType: Record<string, number[]> = {};

      // Process in chunks to avoid stack overflow
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, blueprint.blocks.length);

        // Process this chunk of blocks
        for (let i = startIdx; i < endIdx; i++) {
          const block = blueprint.blocks[i];

          // Skip invalid blocks
          if (!block || typeof block.blockTypeId !== 'string') {
            continue;
          }

          // Get the mapped block type
          const mappedType = safeBlockTypeMapping[block.blockTypeId] || 'stone';

          // Initialize array if needed
          if (!blockIndicesByType[mappedType]) {
            blockIndicesByType[mappedType] = [];
          }

          // Store the index instead of the block itself
          blockIndicesByType[mappedType].push(i);
        }
      }

      // Create completed and remaining block lists
      const completedBlocks: BlueprintBlock[] = [];
      const remainingBlocks: BlueprintBlock[] = [];

      // For each block type, add the appropriate number to completed/remaining
      for (const [mappedType, indices] of Object.entries(blockIndicesByType)) {
        const numCompleted = placedBlockCounts[mappedType] || 0;

        // Safety check: ensure we don't exceed array bounds
        if (numCompleted <= indices.length) {
          // Add blocks to completed (up to the number we can place)
          for (let i = 0; i < numCompleted; i++) {
            completedBlocks.push(blueprint.blocks[indices[i]]);
          }

          // Add remaining blocks to the remaining list
          for (let i = numCompleted; i < indices.length; i++) {
            remainingBlocks.push(blueprint.blocks[indices[i]]);
          }
        } else {
          console.warn(`Invalid numCompleted (${numCompleted}) exceeds indices length (${indices.length}) for ${mappedType}`);
          // Add all blocks to completed as a fallback
          for (let i = 0; i < indices.length; i++) {
            completedBlocks.push(blueprint.blocks[indices[i]]);
          }
        }
      }

      // Calculate progress, excluding air blocks from the total count
      // Use a chunked approach for filtering air blocks
      let nonAirBlockCount = 0;

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const startIdx = chunkIndex * CHUNK_SIZE;
        const endIdx = Math.min(startIdx + CHUNK_SIZE, blueprint.blocks.length);

        // Count non-air blocks in this chunk
        for (let i = startIdx; i < endIdx; i++) {
          const block = blueprint.blocks[i];
          if (block && block.blockTypeId !== 'air') {
            nonAirBlockCount++;
          }
        }
      }

      const totalBlocks = nonAirBlockCount;
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
   * This version uses chunking and progressive rendering to handle large structures
   */
  private updateVisualization(): void {
    if (!this.scene || !this.currentState || !this.currentState.blueprint) return;

    // Clear existing visualization first
    this.clearVisualization();

    // Set a flag to track if visualization is in progress
    let visualizationInProgress = true;

    // Add a timeout to ensure visualization completes even if there's an error
    const visualizationTimeout = setTimeout(() => {
      if (visualizationInProgress) {
        console.warn(`[EIFFEL_DEBUG] Visualization timeout reached, forcing completion`);
        visualizationInProgress = false;
      }
    }, 10000); // 10 second timeout

    // Use setTimeout to defer the visualization update to the next frame
    // This prevents blocking the UI thread during event handling
    setTimeout(() => {
      this.updateVisualizationChunked()
        .then(() => {
          // Mark visualization as complete
          visualizationInProgress = false;

          // Clear the timeout
          clearTimeout(visualizationTimeout);

          console.log(`[EIFFEL_DEBUG] Visualization completed successfully`);
        })
        .catch(error => {
          // Mark visualization as complete
          visualizationInProgress = false;

          // Clear the timeout
          clearTimeout(visualizationTimeout);

          console.error(`[EIFFEL_DEBUG] Error in visualization: ${error}`);
        });
    }, 0);
  }

  /**
   * Update the visualization in chunks to prevent stack overflow and browser lockup
   * This method processes blocks in smaller batches and renders them progressively
   * @returns A promise that resolves when visualization is complete
   */
  private updateVisualizationChunked(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.scene || !this.currentState || !this.currentState.blueprint) {
        reject(new Error('Scene or current state is null'));
        return;
      }

      const { position, scale, showCompleted, showRemaining, remainingOpacity, completedOpacity } = this.options;

      // Create parent node for the structure
      const structureNode = new BABYLON.TransformNode('structure', this.scene);
      structureNode.position = position || new BABYLON.Vector3(10, 0, 10);
      structureNode.scaling = new BABYLON.Vector3(scale || 0.5, scale || 0.5, scale || 0.5);

      // Log the size of the structure for debugging
      console.log(`[EIFFEL_DEBUG] Visualizing structure with ${this.currentState.blueprint.blocks.length} blocks`);
      console.log(`[EIFFEL_DEBUG] Completed blocks: ${this.currentState.completedBlocks.length}, Remaining blocks: ${this.currentState.remainingBlocks.length}`);

      // Group blocks by type for more efficient creation
      const completedBlocksByType: Record<string, BlueprintBlock[]> = {};
      const remainingBlocksByType: Record<string, BlueprintBlock[]> = {};

      // Define chunk size for processing blocks
      const CHUNK_SIZE = 500;

      // Process completed blocks in chunks
      if (showCompleted && this.currentState.completedBlocks.length > 0) {
        const totalCompletedChunks = Math.ceil(this.currentState.completedBlocks.length / CHUNK_SIZE);
        console.log(`[EIFFEL_DEBUG] Processing completed blocks in ${totalCompletedChunks} chunks`);

        for (let chunkIndex = 0; chunkIndex < totalCompletedChunks; chunkIndex++) {
          const startIdx = chunkIndex * CHUNK_SIZE;
          const endIdx = Math.min(startIdx + CHUNK_SIZE, this.currentState.completedBlocks.length);

          // Process this chunk of blocks
          for (let i = startIdx; i < endIdx; i++) {
            const block = this.currentState.completedBlocks[i];

            // Skip air blocks - they should not be rendered
            if (block.blockTypeId === 'air') {
              continue;
            }

            if (!completedBlocksByType[block.blockTypeId]) {
              completedBlocksByType[block.blockTypeId] = [];
            }
            completedBlocksByType[block.blockTypeId].push(block);
          }
        }
      }

      // Process remaining blocks in chunks
      if (showRemaining && this.currentState.remainingBlocks.length > 0) {
        const totalRemainingChunks = Math.ceil(this.currentState.remainingBlocks.length / CHUNK_SIZE);
        console.log(`[EIFFEL_DEBUG] Processing remaining blocks in ${totalRemainingChunks} chunks`);

        for (let chunkIndex = 0; chunkIndex < totalRemainingChunks; chunkIndex++) {
          const startIdx = chunkIndex * CHUNK_SIZE;
          const endIdx = Math.min(startIdx + CHUNK_SIZE, this.currentState.remainingBlocks.length);

          // Process this chunk of blocks
          for (let i = startIdx; i < endIdx; i++) {
            const block = this.currentState.remainingBlocks[i];

            // Skip air blocks - they should not be rendered
            if (block.blockTypeId === 'air') {
              continue;
            }

            if (!remainingBlocksByType[block.blockTypeId]) {
              remainingBlocksByType[block.blockTypeId] = [];
            }
            remainingBlocksByType[block.blockTypeId].push(block);
          }
        }
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

      // Process block types in batches to avoid UI freezing
      const allBlockTypeEntries = [
        ...Object.entries(completedBlocksByType).map(entry => ({ isCompleted: true, entry })),
        ...Object.entries(remainingBlocksByType).map(entry => ({ isCompleted: false, entry }))
      ];

      // Track the current batch index
      let currentBatchIndex = 0;
      const BATCH_SIZE = 5; // Process 5 block types at a time

      // Function to process the next batch of block types
      const processNextBatch = () => {
        if (currentBatchIndex >= allBlockTypeEntries.length) {
          console.log(`[EIFFEL_DEBUG] Visualization complete: ${this.meshes.length} meshes created`);
          resolve(); // Resolve the promise when all batches are processed
          return;
        }

        // Get the current batch
        const endIndex = Math.min(currentBatchIndex + BATCH_SIZE, allBlockTypeEntries.length);
        const currentBatch = allBlockTypeEntries.slice(currentBatchIndex, endIndex);

        // Process each block type in the current batch
        try {
          currentBatch.forEach(({ isCompleted, entry }) => {
            const [blockTypeId, blocks] = entry;

            // Use the safe mapping instead of calling getValidBlockTypeId
            const validBlockTypeId = safeBlockTypeMapping[blockTypeId] || 'stone';
            const blockType = getBlockTypeById(validBlockTypeId);

            if (!blockType) {
              console.error(`No valid block type found for ${blockTypeId}, even after fallback`);
              return;
            }

            // Create material once per block type
            if (!this.scene) return;
            const material = new BABYLON.StandardMaterial(
              `${isCompleted ? 'completed' : 'remaining'}_material_${validBlockTypeId}`,
              this.scene
            );

            // Special handling for glass blocks
            const isGlassBlock = validBlockTypeId.includes('glass');

            // Apply texture if available
            if (blockType.texture) {
              material.diffuseTexture = new BABYLON.Texture(blockType.texture, this.scene);

              // Only set hasAlpha for glass blocks
              material.diffuseTexture.hasAlpha = isGlassBlock || !isCompleted;

              // Disable using alpha from diffuse texture for transparency for non-glass blocks
              material.useAlphaFromDiffuseTexture = isGlassBlock;

              // Force the texture to use nearest neighbor filtering for pixelated look
              if (material.diffuseTexture.updateSamplingMode) {
                material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
              }
            }

            // Apply color if available
            if (blockType.color) {
              material.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
            }

            // Set opacity and transparency mode based on whether it's completed or remaining
            if (isCompleted) {
              material.alpha = completedOpacity || 1.0;

              // Set appropriate transparency mode based on opacity and block type
              if ((completedOpacity && completedOpacity < 1.0) || isGlassBlock) {
                material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
              } else {
                material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
              }
            } else {
              material.alpha = remainingOpacity || 0.3;
              // For remaining blocks, always use alpha blend since they're semi-transparent
              material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
            }

            // Process blocks in chunks to avoid stack overflow
            const totalBlockChunks = Math.ceil(blocks.length / CHUNK_SIZE);

            for (let chunkIndex = 0; chunkIndex < totalBlockChunks; chunkIndex++) {
              const startIdx = chunkIndex * CHUNK_SIZE;
              const endIdx = Math.min(startIdx + CHUNK_SIZE, blocks.length);

              // Create meshes for each block in this chunk
              for (let i = startIdx; i < endIdx; i++) {
                const block = blocks[i];

                if (!this.scene) continue;

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
              }
            }
          });
        } catch (error) {
          console.error(`[EIFFEL_DEBUG] Error processing batch: ${error}`);
          // Continue to the next batch even if there's an error
        }

        // Move to the next batch
        currentBatchIndex = endIndex;

        // Schedule the next batch to be processed in the next frame
        // This gives the browser time to render and respond to user input
        try {
          setTimeout(processNextBatch, 0);
        } catch (error) {
          console.error(`[EIFFEL_DEBUG] Error scheduling next batch: ${error}`);
          // If we can't schedule the next batch, resolve the promise to prevent hanging
          resolve();
        }
      };

      // Start processing batches
      try {
        processNextBatch();
      } catch (error) {
        console.error(`[EIFFEL_DEBUG] Error starting batch processing: ${error}`);
        reject(error);
      }
    });
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
   * Uses chunking and progressive rendering to handle large structures
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
    console.log(`[EIFFEL_DEBUG] Structure has ${blueprint.blocks.length} blocks`);

    // Create a parent node for the built structure
    const nodeName = `built_structure_${blueprint.id}`;
    console.log(`[EIFFEL_DEBUG] Creating node: ${nodeName}`);
    const builtStructureNode = new BABYLON.TransformNode(nodeName, this.scene);
    builtStructureNode.position = buildPosition;

    // Ensure the parent node stays visible
    builtStructureNode.isVisible = true;

    // Log the node creation
    console.log(`[EIFFEL_DEBUG] Created parent node at position: ${buildPosition.x}, ${buildPosition.y}, ${buildPosition.z}`);

    // Block scene updates during mesh creation to improve performance
    // This is a Babylon.js optimization technique from Context7
    this.scene.blockfreeActiveMeshesAndRenderingGroups = true;

    // Process blocks in chunks to avoid stack overflow
    const CHUNK_SIZE = 500;
    const totalChunks = Math.ceil(blueprint.blocks.length / CHUNK_SIZE);

    console.log(`[EIFFEL_DEBUG] Processing structure in ${totalChunks} chunks of ${CHUNK_SIZE} blocks each`);

    // Count blocks by type in the blueprint (using chunking)
    const requiredBlocks: Record<string, number> = {};

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startIdx = chunkIndex * CHUNK_SIZE;
      const endIdx = Math.min(startIdx + CHUNK_SIZE, blueprint.blocks.length);

      // Process this chunk of blocks
      for (let i = startIdx; i < endIdx; i++) {
        const block = blueprint.blocks[i];
        // Skip air blocks when counting required blocks
        if (block.blockTypeId !== 'air') {
          requiredBlocks[block.blockTypeId] = (requiredBlocks[block.blockTypeId] || 0) + 1;
        }
      }
    }

    // Remove the required blocks from the player's inventory
    Object.entries(requiredBlocks).forEach(([blockTypeId, count]) => {
      for (let i = 0; i < count; i++) {
        blockAwardManager.removeBlock(blockTypeId);
      }
    });

    // Group blocks by type for more efficient creation (skip air blocks)
    // Use chunking to avoid stack overflow
    const blocksByType: Record<string, BlueprintBlock[]> = {};

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const startIdx = chunkIndex * CHUNK_SIZE;
      const endIdx = Math.min(startIdx + CHUNK_SIZE, blueprint.blocks.length);

      // Process this chunk of blocks
      for (let i = startIdx; i < endIdx; i++) {
        const block = blueprint.blocks[i];

        // Skip air blocks - they should not be rendered
        if (block.blockTypeId === 'air') {
          continue;
        }

        if (!blocksByType[block.blockTypeId]) {
          blocksByType[block.blockTypeId] = [];
        }
        blocksByType[block.blockTypeId].push(block);
      }
    }

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

    // Track all created meshes for optimization
    const allMeshes: BABYLON.Mesh[] = [];

    // Process block types in batches to avoid UI freezing
    const allBlockTypeEntries = Object.entries(blocksByType);

    // Create a coroutine to build the structure progressively
    const buildStructureCoroutine = function* (
      this: StructureBuilder,
      scene: BABYLON.Scene,
      blockTypeEntries: [string, BlueprintBlock[]][],
      safeMapping: Record<string, string>,
      parentNode: BABYLON.TransformNode,
      meshCollection: BABYLON.Mesh[]
    ) {
      // Process each block type
      for (let typeIndex = 0; typeIndex < blockTypeEntries.length; typeIndex++) {
        const [blockTypeId, blocks] = blockTypeEntries[typeIndex];

        // Use the safe mapping instead of calling getValidBlockTypeId
        const validBlockTypeId = safeMapping[blockTypeId] || 'stone';

        // Log progress for large structures
        console.log(`[EIFFEL_DEBUG] Processing block type ${typeIndex + 1}/${blockTypeEntries.length}: ${blockTypeId} -> ${validBlockTypeId} (${blocks.length} blocks)`);

        const blockType = getBlockTypeById(validBlockTypeId);

        if (!blockType) {
          console.error(`[EIFFEL_DEBUG] No valid block type found for ${blockTypeId}, even after fallback`);
          continue;
        }

        // Skip air blocks entirely
        if (validBlockTypeId === 'air') {
          continue;
        }

        // Create material with a simple name
        const materialName = `built_structure_material_${validBlockTypeId}`;
        const material = new BABYLON.StandardMaterial(materialName, scene);

        // Special handling for glass blocks
        const isGlassBlock = validBlockTypeId.includes('glass');

        // Apply texture if available
        if (blockType.texture) {
          material.diffuseTexture = new BABYLON.Texture(blockType.texture, scene);

          // Set texture properties
          if (material.diffuseTexture) {
            // Only set hasAlpha for glass blocks
            material.diffuseTexture.hasAlpha = isGlassBlock;
            material.useAlphaFromDiffuseTexture = isGlassBlock;

            // Use nearest sampling for pixelated look
            material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
          }
        }

        // Apply color if available
        if (blockType.color) {
          material.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
        }

        // Set basic material properties
        material.alpha = 1.0; // Fully opaque

        // Simple transparency settings based on block type
        if (isGlassBlock) {
          material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        } else {
          material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        }

        // Filter out air blocks - they should not be rendered
        // Also filter out invalid blocks to prevent errors
        const nonAirBlocks = blocks.filter(block => {
          // Skip air blocks
          if (block && block.blockTypeId === 'air') {
            return false;
          }

          // Skip invalid blocks
          if (!block || !block.position ||
              typeof block.position.x !== 'number' ||
              typeof block.position.y !== 'number' ||
              typeof block.position.z !== 'number') {
            return false;
          }

          return true;
        });

        console.log(`[EIFFEL_DEBUG] Filtered out ${blocks.length - nonAirBlocks.length} blocks (air or invalid), processing ${nonAirBlocks.length} valid blocks`);

        // Process blocks in chunks to avoid stack overflow
        const totalBlockChunks = Math.ceil(nonAirBlocks.length / CHUNK_SIZE);

        // Dynamically adjust chunk size based on the number of blocks
        // For very large structures, use smaller chunks to prevent timeouts
        const MAX_TOTAL_CHUNKS = 100;
        let effectiveChunkSize = CHUNK_SIZE;

        // For extremely large structures (like Eiffel Tower), use even smaller chunks
        if (nonAirBlocks.length > 50000) {
          // For extremely large structures, use very small chunks
          effectiveChunkSize = Math.min(100, Math.ceil(nonAirBlocks.length / 1000));
          console.log(`[EIFFEL_DEBUG] Extremely large structure detected (${nonAirBlocks.length} blocks), using very small chunk size: ${effectiveChunkSize}`);
        } else if (totalBlockChunks > MAX_TOTAL_CHUNKS) {
          // For large structures, adjust chunk size to limit total chunks
          effectiveChunkSize = Math.ceil(nonAirBlocks.length / MAX_TOTAL_CHUNKS);
          console.log(`[EIFFEL_DEBUG] Adjusting chunk size to ${effectiveChunkSize} to limit total chunks to ${MAX_TOTAL_CHUNKS}`);
        }

        // Track progress for large structures
        let totalBlocksProcessed = 0;
        const totalBlocksToProcess = nonAirBlocks.length;

        // Calculate the actual number of chunks based on effective chunk size
        const actualTotalChunks = Math.ceil(nonAirBlocks.length / effectiveChunkSize);

        for (let chunkIndex = 0; chunkIndex < actualTotalChunks; chunkIndex++) {
          const startIdx = chunkIndex * effectiveChunkSize;
          const endIdx = Math.min(startIdx + effectiveChunkSize, nonAirBlocks.length);

          // Log progress for large structures
          totalBlocksProcessed += (endIdx - startIdx);
          const progressPercent = Math.round((totalBlocksProcessed / totalBlocksToProcess) * 100);

          if (chunkIndex % 10 === 0 || chunkIndex === actualTotalChunks - 1) {
            console.log(`[EIFFEL_DEBUG] Processing chunk ${chunkIndex + 1}/${actualTotalChunks} (${progressPercent}% complete)`);
          }

          // Create a merged mesh for this chunk if it's large enough and we have blocks to render
          // For extremely large structures, always use individual meshes to prevent memory issues
          if (endIdx - startIdx > 50 && scene && nonAirBlocks.length < 100000) {
            // For large chunks, create a merged mesh for better performance
            const positions: number[] = [];
            const indices: number[] = [];
            let vertexIndex = 0;

            // Collect positions and indices for all blocks in this chunk
            for (let i = startIdx; i < endIdx; i++) {
              const block = nonAirBlocks[i];

              // Skip invalid blocks
              if (!block || !block.position || typeof block.position.x !== 'number' ||
                  typeof block.position.y !== 'number' || typeof block.position.z !== 'number') {
                console.warn(`[EIFFEL_DEBUG] Skipping invalid block at index ${i}`);
                continue;
              }

              // Add cube vertices (8 vertices per cube)
              const x = block.position.x;
              const y = block.position.y;
              const z = block.position.z;
              const s = 0.5; // half size

              // Add 8 vertices of the cube
              positions.push(
                x - s, y - s, z - s,
                x + s, y - s, z - s,
                x + s, y + s, z - s,
                x - s, y + s, z - s,
                x - s, y - s, z + s,
                x + s, y - s, z + s,
                x + s, y + s, z + s,
                x - s, y + s, z + s
              );

              // Add 12 triangles (36 indices)
              // Front face
              indices.push(vertexIndex + 0, vertexIndex + 1, vertexIndex + 2);
              indices.push(vertexIndex + 0, vertexIndex + 2, vertexIndex + 3);
              // Back face
              indices.push(vertexIndex + 4, vertexIndex + 7, vertexIndex + 6);
              indices.push(vertexIndex + 4, vertexIndex + 6, vertexIndex + 5);
              // Top face
              indices.push(vertexIndex + 3, vertexIndex + 2, vertexIndex + 6);
              indices.push(vertexIndex + 3, vertexIndex + 6, vertexIndex + 7);
              // Bottom face
              indices.push(vertexIndex + 0, vertexIndex + 4, vertexIndex + 5);
              indices.push(vertexIndex + 0, vertexIndex + 5, vertexIndex + 1);
              // Left face
              indices.push(vertexIndex + 0, vertexIndex + 3, vertexIndex + 7);
              indices.push(vertexIndex + 0, vertexIndex + 7, vertexIndex + 4);
              // Right face
              indices.push(vertexIndex + 1, vertexIndex + 5, vertexIndex + 6);
              indices.push(vertexIndex + 1, vertexIndex + 6, vertexIndex + 2);

              vertexIndex += 8;
            }

            // Only create mesh if we have positions and indices
            if (positions.length > 0 && indices.length > 0) {
              // Create a simple name for the chunk mesh
              const chunkMeshName = `chunk_${validBlockTypeId}_${chunkIndex}`;
              const chunkMesh = new BABYLON.Mesh(chunkMeshName, scene);

              // Create vertex data
              const vertexData = new BABYLON.VertexData();
              vertexData.positions = positions;
              vertexData.indices = indices;

              // Compute normals
              // First create the normals array to avoid "Cannot set properties of undefined" error
              vertexData.normals = [];
              // Only compute normals if we have valid positions and indices
              if (positions.length > 0 && indices.length > 0) {
                try {
                  BABYLON.VertexData.ComputeNormals(positions, indices, vertexData.normals);
                } catch (error) {
                  console.error(`[EIFFEL_DEBUG] Error computing normals: ${error}`);
                  // Create default normals if computation fails
                  for (let i = 0; i < positions.length / 3; i++) {
                    vertexData.normals.push(0, 1, 0); // Default normal pointing up
                  }
                }
              }

              // Create UVs if they don't exist
              if (!vertexData.uvs) {
                const uvs = [];
                for (let i = 0; i < positions.length / 3; i++) {
                  uvs.push(0, 0); // Default UVs
                }
                vertexData.uvs = uvs;
              }

              // Apply vertex data to mesh
              vertexData.applyToMesh(chunkMesh);

              // Apply material
              chunkMesh.material = material;

              // Set parent
              chunkMesh.parent = parentNode;

              // Add to collection
              meshCollection.push(chunkMesh);

              // Basic visibility settings - don't overdo it
              chunkMesh.isVisible = true;
              chunkMesh.visibility = 1.0;

              // Only use essential optimizations
              chunkMesh.alwaysSelectAsActiveMesh = true;

              console.log(`[EIFFEL_DEBUG] Created chunk mesh for ${validBlockTypeId} with ${positions.length / 3} vertices`);
            } else {
              console.warn(`[EIFFEL_DEBUG] No valid positions/indices for chunk ${chunkIndex} of ${validBlockTypeId}`);
            }

            // Yield to allow the UI to update
            yield;
          } else {
            // For smaller chunks, create individual meshes
            let meshesCreated = 0;
            for (let i = startIdx; i < endIdx; i++) {
              const block = nonAirBlocks[i];

              // Skip invalid blocks
              if (!block || !block.position || typeof block.position.x !== 'number' ||
                  typeof block.position.y !== 'number' || typeof block.position.z !== 'number') {
                console.warn(`[EIFFEL_DEBUG] Skipping invalid block at index ${i}`);
                continue;
              }

              if (!scene) continue;

              try {
                // Create a simple name for the mesh - unique names can cause issues
                const meshName = `structure_${validBlockTypeId}_${block.position.x}_${block.position.y}_${block.position.z}`;

                const mesh = BABYLON.MeshBuilder.CreateBox(
                  meshName,
                  { size: 1 },
                  scene
                );

                // Position the mesh according to the blueprint
                mesh.position = new BABYLON.Vector3(block.position.x, block.position.y, block.position.z);

                // Apply material to mesh
                mesh.material = material;

                // Make the mesh pickable for interaction
                mesh.isPickable = true;

                // Add to parent
                mesh.parent = parentNode;

                // Add to collection
                meshCollection.push(mesh);

                // Basic visibility settings - don't overdo it
                mesh.isVisible = true;
                mesh.visibility = 1.0;

                // Only use essential optimizations
                mesh.alwaysSelectAsActiveMesh = true;

                // Don't freeze the world matrix as it can cause issues
                // mesh.freezeWorldMatrix();

                meshesCreated++;
              } catch (error) {
                console.error(`[EIFFEL_DEBUG] Error creating mesh for block at index ${i}: ${error}`);
              }

              // Yield after processing a small batch to allow the UI to update
              // For very large structures, yield more frequently
              const yieldFrequency = nonAirBlocks.length > 50000 ? 5 : 20;
              if ((i - startIdx) % yieldFrequency === 0) {
                yield;
              }
            }

            console.log(`[EIFFEL_DEBUG] Created ${meshesCreated} individual meshes for ${validBlockTypeId}`);

            // Yield after processing the chunk
            yield;
          }
        }

        // Yield after each block type to allow the UI to update
        yield;
      }
    }.bind(this);

    // Start the coroutine to build the structure progressively
    if (this.scene) {
      // Set a flag to track if the coroutine is running
      let coroutineRunning = true;

      // Add a timeout to ensure the coroutine completes even if there's an error
      // Use a longer timeout for very large structures
      const isLargeStructure = blueprint.blocks.length > 10000;
      const timeoutDuration = isLargeStructure ? 120000 : 30000; // 2 minutes for large structures, 30 seconds otherwise

      console.log(`[EIFFEL_DEBUG] Setting coroutine timeout to ${timeoutDuration/1000} seconds for structure with ${blueprint.blocks.length} blocks`);

      const coroutineTimeout = setTimeout(() => {
        if (coroutineRunning) {
          console.warn(`[EIFFEL_DEBUG] Coroutine timeout reached after ${timeoutDuration/1000} seconds, forcing completion`);
          coroutineRunning = false;

          // Unblock scene updates
          if (this.scene) {
            this.scene.blockfreeActiveMeshesAndRenderingGroups = false;
          }

          // Dispatch the structureBuilt event
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('structureBuilt', {
              detail: {
                blueprintId: blueprint.id,
                name: blueprint.name,
                difficulty: blueprint.difficulty,
                position: buildPosition,
                blocks: blueprint.blocks,
                timedOut: true, // Indicate that the coroutine timed out
              },
            });
            window.dispatchEvent(event);
          }
        }
      }, timeoutDuration);

      // Run the coroutine
      this.scene.onBeforeRenderObservable.runCoroutineAsync(
        buildStructureCoroutine(this.scene, allBlockTypeEntries, safeBlockTypeMapping, builtStructureNode, allMeshes)
      ).then(() => {
        // Mark coroutine as complete
        coroutineRunning = false;

        // Clear the timeout
        clearTimeout(coroutineTimeout);

        // Unblock scene updates after mesh creation is complete
        if (this.scene) {
          this.scene.blockfreeActiveMeshesAndRenderingGroups = false;
        }

        console.log(`[EIFFEL_DEBUG] Structure building complete: ${allMeshes.length} meshes created`);

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
      }).catch(error => {
        // Mark coroutine as complete
        coroutineRunning = false;

        // Clear the timeout
        clearTimeout(coroutineTimeout);

        // Log the error
        console.error(`[EIFFEL_DEBUG] Error in structure building coroutine: ${error}`);

        // Unblock scene updates
        if (this.scene) {
          this.scene.blockfreeActiveMeshesAndRenderingGroups = false;
        }

        // Dispatch the structureBuilt event anyway to prevent UI from getting stuck
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('structureBuilt', {
            detail: {
              blueprintId: blueprint.id,
              name: blueprint.name,
              difficulty: blueprint.difficulty,
              position: buildPosition,
              blocks: blueprint.blocks,
              error: true, // Indicate there was an error
            },
          });
          window.dispatchEvent(event);
        }
      });
    }

    // Create an octree for the structure to optimize picking and rendering
    // This is done outside the coroutine to ensure it happens even if the coroutine fails
    if (this.scene && allMeshes.length > 100) {
      console.log(`[EIFFEL_DEBUG] Creating octree for structure with ${allMeshes.length} meshes`);
      try {
        const octree = new BABYLON.Octree<BABYLON.AbstractMesh>(nodeName + "_octree");
        octree.blocks = [];
        const capacity = 8; // Maximum capacity per block
        const maxDepth = 8; // Maximum depth of the octree
        octree.create(allMeshes, capacity, maxDepth);

        // Register the octree with the scene
        if (!this.scene.octrees) {
          this.scene.octrees = [];
        }
        this.scene.octrees.push(octree);
        console.log(`[EIFFEL_DEBUG] Octree created successfully`);
      } catch (error) {
        console.error(`[EIFFEL_DEBUG] Error creating octree: ${error}`);
      }
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
