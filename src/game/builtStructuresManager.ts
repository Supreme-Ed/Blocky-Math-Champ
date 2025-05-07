// src/game/builtStructuresManager.ts
// Manages persistence of built structures across page reloads

import * as BABYLON from '@babylonjs/core';
import { getBlueprintById } from './structureBlueprints';

/**
 * Serializable structure data for localStorage
 */
export interface SerializableStructure {
  id: string;
  blueprintId: string;
  name: string;
  difficulty: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  createdAt: number;
}

/**
 * Structure data with Babylon objects
 */
export interface BuiltStructure {
  id: string;
  blueprintId: string;
  name: string;
  difficulty: string;
  position: BABYLON.Vector3;
  node: BABYLON.TransformNode | null;
  createdAt: number;
}

/**
 * Class that manages persistence of built structures
 */
class BuiltStructuresManager {
  private localStorageKey: string;
  private structures: SerializableStructure[];

  constructor() {
    this.localStorageKey = 'blocky_builtStructures';
    this.structures = [];
    this.loadFromLocalStorage();
  }

  /**
   * Load structures from localStorage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage not available, structure persistence disabled');
      return;
    }

    try {
      const savedData = window.localStorage.getItem(this.localStorageKey);
      if (savedData) {
        this.structures = JSON.parse(savedData);
        console.log(`[BuiltStructuresManager] Loaded ${this.structures.length} structures from localStorage`);

        // Clean up any duplicate positions
        const removed = this.cleanupDuplicatePositions();
        if (removed > 0) {
          console.log(`[BuiltStructuresManager] Cleaned up ${removed} duplicate structures`);
        }
      } else {
        console.log('[BuiltStructuresManager] No saved structures found in localStorage');
        this.structures = [];
      }
    } catch (error) {
      console.error('[BuiltStructuresManager] Error loading structures from localStorage:', error);
      this.structures = [];
    }
  }

  /**
   * Save structures to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage not available, structure persistence disabled');
      return;
    }

    try {
      window.localStorage.setItem(this.localStorageKey, JSON.stringify(this.structures));
      console.log(`[BuiltStructuresManager] Saved ${this.structures.length} structures to localStorage`);
    } catch (error) {
      console.error('[BuiltStructuresManager] Error saving structures to localStorage:', error);
    }
  }

  /**
   * Add a new structure
   * @param structure - Structure data to add
   */
  addStructure(structure: BuiltStructure): void {
    // Convert BABYLON.Vector3 to serializable object
    const serializableStructure: SerializableStructure = {
      id: structure.id,
      blueprintId: structure.blueprintId,
      name: structure.name,
      difficulty: structure.difficulty,
      position: {
        x: structure.position.x,
        y: structure.position.y,
        z: structure.position.z,
      },
      createdAt: structure.createdAt,
    };

    // Add to structures array
    this.structures.push(serializableStructure);

    // Save to localStorage
    this.saveToLocalStorage();
  }

  /**
   * Remove a structure by ID
   * @param id - ID of the structure to remove
   * @returns True if the structure was found and removed, false otherwise
   */
  removeStructure(id: string): boolean {
    const initialLength = this.structures.length;
    this.structures = this.structures.filter(structure => structure.id !== id);

    const wasRemoved = initialLength > this.structures.length;

    if (wasRemoved) {
      this.saveToLocalStorage();
    }

    return wasRemoved;
  }

  /**
   * Get all structures
   * @returns Array of serializable structures
   */
  getStructures(): SerializableStructure[] {
    return [...this.structures];
  }

  /**
   * Clear all structures
   */
  clearStructures(): void {
    this.structures = [];
    this.saveToLocalStorage();
  }

  /**
   * Clean up structures with duplicate positions
   * @returns Number of structures removed
   */
  cleanupDuplicatePositions(): number {
    if (this.structures.length <= 1) {
      return 0; // No duplicates possible with 0 or 1 structures
    }

    // Track positions we've seen
    const seenPositions = new Map<string, string>(); // positionKey -> structureId
    const duplicates: string[] = []; // IDs to remove

    // Find duplicates
    this.structures.forEach(structure => {
      const posKey = `${structure.position.x},${structure.position.y},${structure.position.z}`;

      if (seenPositions.has(posKey)) {
        // This is a duplicate position
        // Keep the newer structure (higher createdAt timestamp)
        const existingId = seenPositions.get(posKey)!;
        const existingStructure = this.structures.find(s => s.id === existingId)!;

        if (structure.createdAt > existingStructure.createdAt) {
          // Current structure is newer, remove the old one
          duplicates.push(existingId);
          seenPositions.set(posKey, structure.id);
        } else {
          // Existing structure is newer, remove the current one
          duplicates.push(structure.id);
        }
      } else {
        // First time seeing this position
        seenPositions.set(posKey, structure.id);
      }
    });

    // Remove duplicates
    if (duplicates.length > 0) {
      this.structures = this.structures.filter(s => !duplicates.includes(s.id));
      this.saveToLocalStorage();
      console.log(`[BuiltStructuresManager] Removed ${duplicates.length} duplicate structures`);
    }

    return duplicates.length;
  }

  /**
   * Convert a serializable structure to a built structure with Babylon objects
   * @param serializable - Serializable structure data
   * @param scene - Babylon scene
   * @returns Built structure with Babylon objects
   */
  serializableToBuiltStructure(serializable: SerializableStructure, scene: BABYLON.Scene): BuiltStructure {
    return {
      id: serializable.id,
      blueprintId: serializable.blueprintId,
      name: serializable.name,
      difficulty: serializable.difficulty,
      position: new BABYLON.Vector3(
        serializable.position.x,
        serializable.position.y,
        serializable.position.z
      ),
      node: null, // Node will be created by BuiltStructures component
      createdAt: serializable.createdAt,
    };
  }
}

// Create singleton instance
const builtStructuresManager = new BuiltStructuresManager();

export default builtStructuresManager;
