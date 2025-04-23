// Modular Block Award Manager
// Handles storage, retrieval, and event-driven updates for awarded blocks by type.
// Extendable: works with any block type id.

export class BlockAwardManager {
  constructor() {
    // Use an object for efficient block type quantity tracking
    if (typeof window !== 'undefined') {
      if (!window.awardedBlocks) {
        window.awardedBlocks = {};
      }
    }
    this.blockTypes = [];
  }

  // Set block types for initialization (call this at app/game init)
  setBlockTypes(blockTypes) {
    this.blockTypes = blockTypes;
    if (typeof window !== 'undefined') {
      if (!window.awardedBlocks) window.awardedBlocks = {};
      blockTypes.forEach(type => {
        if (!(type.id in window.awardedBlocks)) {
          window.awardedBlocks[type.id] = 0;
        }
      });
    }
  }

  // Award a block of a given type
  awardBlock(blockTypeId) {
    if (typeof window !== 'undefined') {
      if (!window.awardedBlocks[blockTypeId] && window.awardedBlocks[blockTypeId] !== 0) {
        window.awardedBlocks[blockTypeId] = 0;
      }
      window.awardedBlocks[blockTypeId] += 1;
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
  removeBlock(blockTypeId = null) {
    if (typeof window !== 'undefined') {
      let removedType = blockTypeId;
      if (!blockTypeId) {
        // remove from the first type that has >0
        removedType = Object.keys(window.awardedBlocks).find(
          typeId => window.awardedBlocks[typeId] > 0
        );
      }
      if (removedType && window.awardedBlocks[removedType] > 0) {
        window.awardedBlocks[removedType] -= 1;
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
  getBlocks() {
    if (typeof window !== 'undefined') {
      return { ...window.awardedBlocks };
    }
    return {};
  }

  // Get count of a specific type
  getBlockCount(blockTypeId) {
    if (typeof window !== 'undefined') {
      return window.awardedBlocks[blockTypeId] || 0;
    }
    return 0;
  }
}

// Singleton export for convenience
const blockAwardManager = new BlockAwardManager();
export default blockAwardManager;
