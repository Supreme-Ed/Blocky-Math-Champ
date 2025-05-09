// src/game/dynamicBlockTypes.ts
// Dynamically loads block types from texture files in the public/textures/block_textures directory

import { BlockType } from '../types/game';

// Cache for block types to avoid unnecessary file system operations
let blockTypesCache: BlockType[] = [];
let lastRefreshTime = 0;

// Air block definition - will be added to the block types
const AIR_BLOCK: BlockType = {
  id: 'air',
  name: 'Air',
  // Air has no texture as it's invisible
};

/**
 * Formats a block type ID from a filename
 * Removes file extension and converts to lowercase
 * @param filename The filename to format
 * @returns The formatted block type ID
 */
function formatBlockTypeId(filename: string): string {
  // Remove file extension and convert to lowercase
  return filename.replace(/\.[^/.]+$/, '').toLowerCase();
}

/**
 * Formats a block type name from a block type ID
 * Capitalizes each word and replaces underscores with spaces
 * @param id The block type ID to format
 * @returns The formatted block type name
 */
function formatBlockTypeName(id: string): string {
  // Replace underscores with spaces and capitalize each word
  return id
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Fetches the list of texture files from the server
 * @returns A promise that resolves to an array of filenames
 */
async function fetchTextureFiles(): Promise<string[]> {
  try {
    console.log('Fetching texture files from server...');

    // Use the correct server URL (port 3000)
    // In development, the Vite server runs on port 5173, but the Express server runs on port 3000
    const serverUrl = 'http://localhost:3000';

    // Add a timestamp to prevent caching
    const timestamp = Date.now();
    const url = `${serverUrl}/api/block-textures?t=${timestamp}`;

    console.log(`Requesting URL: ${url}`);

    // Add CORS mode and credentials
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch texture files: ${response.status} ${response.statusText}`);

      // Try to get more detailed error information
      try {
        const errorData = await response.text();
        console.error('Error response:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }

      throw new Error(`Failed to fetch texture files: ${response.statusText}`);
    }

    const files = await response.json();
    console.log('Texture files fetched successfully:', files);
    return files;
  } catch (error) {
    console.error('Error fetching texture files:', error);

    // For debugging purposes, let's try a direct fetch to see if the server is responding
    try {
      console.log('Trying direct fetch to server root...');
      const response = await fetch('http://localhost:3000/');
      console.log('Server root response status:', response.status);
    } catch (e) {
      console.error('Server root fetch failed:', e);
    }

    // Don't use fallbacks - throw an error to be handled at the application level
    throw new Error('Failed to fetch texture files from server');
  }
}

/**
 * Creates a block type from a texture filename
 * @param filename The texture filename
 * @returns The created block type
 */
function createBlockTypeFromFilename(filename: string): BlockType {
  const id = formatBlockTypeId(filename);
  return {
    id,
    name: formatBlockTypeName(id),
    texture: `/textures/block_textures/${filename}`,
  };
}

/**
 * Loads block types from texture files
 * @param forceRefresh Whether to force a refresh of the block types
 * @returns A promise that resolves to an array of block types
 */
export async function loadBlockTypes(forceRefresh = false): Promise<BlockType[]> {
  const currentTime = Date.now();
  const cacheExpired = currentTime - lastRefreshTime > 60000; // Cache expires after 1 minute

  // Return cached block types if available and not expired
  if (blockTypesCache.length > 0 && !forceRefresh && !cacheExpired) {
    return blockTypesCache;
  }

  try {
    // Fetch texture files from the server
    const textureFiles = await fetchTextureFiles();

    if (!textureFiles || textureFiles.length === 0) {
      throw new Error('No texture files found. Server may not be running or directory is empty.');
    }

    // Create block types from texture files
    const dynamicBlockTypes = textureFiles.map(createBlockTypeFromFilename);

    // Add air block and dynamic block types
    blockTypesCache = [
      AIR_BLOCK,
      ...dynamicBlockTypes
    ];
    lastRefreshTime = currentTime;

    console.log(`Loaded ${blockTypesCache.length} block types (1 special, ${dynamicBlockTypes.length} dynamic)`);
    return blockTypesCache;
  } catch (error) {
    console.error('Error loading block types:', error);
    throw error; // Re-throw the error to be handled at the application level
  }
}

/**
 * Gets all block types
 * @param forceRefresh Whether to force a refresh of the block types
 * @returns A promise that resolves to an array of block types
 */
export async function getBlockTypes(forceRefresh = false): Promise<BlockType[]> {
  return blockTypesCache.length > 0 && !forceRefresh
    ? blockTypesCache
    : loadBlockTypes(forceRefresh);
}

/**
 * Gets a block type by ID
 * @param id The block type ID to get
 * @param blockTypes Optional array of block types to search in
 * @returns The block type with the given ID, or null if not found
 */
export async function getBlockTypeById(id: string, blockTypes?: BlockType[]): Promise<BlockType | null> {
  const types = blockTypes || await getBlockTypes();
  return types.find(type => type.id === id) || null;
}

/**
 * Refreshes the block types
 * @returns A promise that resolves to the refreshed block types
 */
export async function refreshBlockTypes(): Promise<BlockType[]> {
  return loadBlockTypes(true);
}
