// Modular Block Award Manager
// Handles storage, retrieval, and event-driven updates for awarded blocks by type.
// Extendable: works with any block type id.

import { BlockType } from '../types/game';

interface AwardedBlocks {
  [blockTypeId: string]: number;
}

declare global {
  interface Window {
    awardedBlocks: AwardedBlocks;
  }
}

export class BlockAwardManager {
  private localStorageKey: string;
  private blockTypes: BlockType[];

  constructor() {
    // Use localStorage for persistence
    this.localStorageKey = 'blocky_awardedBlocks';
    if (typeof window !== 'undefined') {
      // Try to load from localStorage
      const saved = window.localStorage?.getItem(this.localStorageKey);
      if (saved) {
        try {
          window.awardedBlocks = JSON.parse(saved);
        } catch {
          window.awardedBlocks = {};
        }
      } else {
        window.awardedBlocks = {};
      }
    }
    this.blockTypes = [];
  }

  // Set block types for initialization (call this at app/game init)
  setBlockTypes(blockTypes: BlockType[]): void {
    // Filter out air blocks - we don't want them in the inventory
    this.blockTypes = blockTypes.filter(type => type.id !== 'air');

    if (typeof window !== 'undefined') {
      if (!window.awardedBlocks) window.awardedBlocks = {};

      // Initialize block counts for all non-air blocks
      this.blockTypes.forEach(type => {
        if (!(type.id in window.awardedBlocks)) {
          window.awardedBlocks[type.id] = 0;
        }
      });

      // Remove any air blocks that might have been added previously
      if ('air' in window.awardedBlocks) {
        delete window.awardedBlocks['air'];
      }
    }
  }

  // Award a block of a given type
  awardBlock(blockTypeId: string): void {
    // Don't award air blocks
    if (blockTypeId === 'air') {
      return;
    }

    if (typeof window !== 'undefined') {
      if (!window.awardedBlocks[blockTypeId] && window.awardedBlocks[blockTypeId] !== 0) {
        window.awardedBlocks[blockTypeId] = 0;
      }
      window.awardedBlocks[blockTypeId] += 1;
      // Persist to localStorage
      window.localStorage?.setItem(this.localStorageKey, JSON.stringify(window.awardedBlocks));
      const event = new CustomEvent('blockAwarded', {
        detail: {
          blockTypeId,
          awardedBlocks: { ...window.awardedBlocks },
        },
      });
      window.dispatchEvent(event);
    }
  }

  // Remove a block of a given type (or first available if none specified)
  removeBlock(blockTypeId: string | null = null): void {
    if (typeof window !== 'undefined') {
      let removedType = blockTypeId;
      if (!blockTypeId) {
        // remove from the first type that has >0
        removedType = Object.keys(window.awardedBlocks).find(
          typeId => window.awardedBlocks[typeId] > 0
        ) || null;
      }
      if (removedType && window.awardedBlocks[removedType] > 0) {
        window.awardedBlocks[removedType] -= 1;
        // Persist to localStorage
        window.localStorage?.setItem(this.localStorageKey, JSON.stringify(window.awardedBlocks));
      }
      const event = new CustomEvent('blockRemoved', {
        detail: {
          blockTypeId: removedType,
          awardedBlocks: { ...window.awardedBlocks },
        },
      });
      window.dispatchEvent(event);
    }
  }

  // Get all awarded blocks (as object)
  getBlocks(): AwardedBlocks {
    if (typeof window !== 'undefined') {
      return { ...window.awardedBlocks };
    }
    return {};
  }

  // Get count of a specific type
  getBlockCount(blockTypeId: string): number {
    if (typeof window !== 'undefined') {
      return window.awardedBlocks[blockTypeId] || 0;
    }
    return 0;
  }
}

// Singleton export for convenience
const blockAwardManager = new BlockAwardManager();
export default blockAwardManager;
