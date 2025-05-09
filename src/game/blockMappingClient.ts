// src/game/blockMappingClient.ts
// Client-side code to send block mappings to the server

// Store mappings in memory to avoid excessive API calls
const mappingCache: Record<string, string> = {};

/**
 * Clear the mapping cache to force remapping of blocks
 * This is useful when new block types are added to the game
 */
export function clearMappingCache(): void {
  Object.keys(mappingCache).forEach(key => {
    delete mappingCache[key];
  });
  console.log('Block mapping cache cleared');
}

/**
 * Add some test mappings to the cache for debugging
 */
export function addTestMappings(): void {
  sendBlockMapping('minecraft:stone', 'stone', 'name', 'test.nbt');
  sendBlockMapping('minecraft:dirt', 'dirt', 'name', 'test.nbt');
  sendBlockMapping('minecraft:oak_planks', 'planks_oak', 'name', 'test.nbt');
  sendBlockMapping('minecraft:air', 'air', 'name', 'test.nbt');
  sendBlockMapping('1', 'stone', 'id', 'test.nbt');
  sendBlockMapping('2', 'dirt', 'id', 'test.nbt');
  sendBlockMapping('5', 'planks_oak', 'id', 'test.nbt');
  sendBlockMapping('0', 'air', 'id', 'test.nbt'); // Add air block ID mapping

  // Add airplane-specific mappings
  sendBlockMapping('minecraft:air', 'air', 'name', 'airplane.nbt');
  sendBlockMapping('minecraft:white_wool', 'wool_white', 'name', 'airplane.nbt');
  sendBlockMapping('minecraft:gray_wool', 'wool_white', 'name', 'airplane.nbt'); // Map to closest available
  sendBlockMapping('minecraft:light_gray_wool', 'wool_white', 'name', 'airplane.nbt'); // Map to closest available

  console.log('Added test mappings to cache');
}

/**
 * Add a block mapping to the local cache
 * @param source - The source block (Minecraft block ID or name)
 * @param target - The target block (game block type)
 * @param type - The type of mapping ('id' or 'name')
 * @param sourceFile - The source NBT file (optional)
 */
export function sendBlockMapping(source: string, target: string, type: 'id' | 'name', sourceFile: string = ''): void {
  try {
    // Only log if we're in a browser environment
    if (typeof window === 'undefined') return;

    // Create a unique key for this mapping
    // Include the source file in the key to distinguish mappings from different files
    const key = `${type}:${source}:${sourceFile}`;

    // Only store if we haven't seen this mapping before
    if (!mappingCache[key]) {
      // Store the target and source file together
      mappingCache[key] = `${target}:${sourceFile}`;
     }
  } catch (error) {
    console.error('Error adding block mapping to cache:', error);
  }
}

/**
 * Save all block mappings to file
 */
export async function saveBlockMappings(): Promise<void> {
  try {

    // Only log if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Not in browser environment, skipping');
      return;
    }

    // Check if we have any mappings to send
    const mappingCount = Object.keys(mappingCache).length;
    console.log(`Current mapping cache has ${mappingCount} entries`);

    if (mappingCount === 0) {
      console.log('No block mappings to save - cache is empty');
      return;
    }

    console.log(`Saving ${mappingCount} block mappings to server...`);
    console.log('Mapping cache contents:', mappingCache);

    // Send all mappings to the server in one request
    try {
      console.log('Sending fetch request to /api/bulk-block-mappings');
      const response = await fetch('http://localhost:3000/api/bulk-block-mappings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173',
        },
        body: JSON.stringify({ mappings: mappingCache }),
      });

      if (response.ok) {
        console.log('Block mappings saved successfully');
        // Clear the cache after successful save
        Object.keys(mappingCache).forEach(key => {
          delete mappingCache[key];
        });
      } else {
        console.error('Failed to save block mappings:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (fetchError) {
      console.error('Fetch error when saving block mappings:', fetchError);
    }
  } catch (error) {
    console.error('Error saving block mappings:', error);
  }
}
