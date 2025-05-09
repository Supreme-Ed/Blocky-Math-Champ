// src/game/schematicManager.ts
// Manages loading and accessing Minecraft schematic files as blueprints

import { StructureBlueprint } from './structureBlueprints';
import { parseSchematic } from './schematicParser';
import { mapMinecraftBlock } from './minecraftBlockMapper';
import { saveBlockMappings } from './blockMappingClient';

/**
 * Interface for a schematic blueprint loaded from a file
 */
export interface SchematicBlueprint extends StructureBlueprint {
  // Additional properties specific to schematic-based blueprints
  sourceFile: string;
  fromFile?: boolean; // Flag to indicate if this structure was loaded from a file
  originalFilename?: string; // The original filename of the structure
}

/**
 * Class to manage loading and accessing schematic blueprints
 */
export class SchematicManager {
  private blueprints: Record<string, SchematicBlueprint> = {};
  private initialized: boolean = false;

  /**
   * Initialize the schematic manager by loading all available schematic blueprints
   * @param forceReload - Whether to force a reload even if already initialized
   */
  async initialize(forceReload: boolean = false): Promise<void> {
    console.log('=== SCHEMATIC MANAGER INITIALIZE ===');
    console.log('Force reload:', forceReload);
    console.log('Already initialized:', this.initialized);

    if (this.initialized && !forceReload) {
      console.log('Already initialized and no force reload, returning early');
      return;
    }

    // Clear existing blueprints if reloading
    if (forceReload) {
      console.log('Forcing reload of schematic blueprints...');
      this.blueprints = {};
    }

    try {
      // Try to load structures from the server API first
      console.log('Attempting to load structures from server API...');
      const apiLoaded = await this.loadStructuresFromApi(forceReload);
      console.log('API loaded result:', apiLoaded);

      if (!apiLoaded) {
        // If API loading fails, display a clear message about the server requirement
        console.error('⚠️ STRUCTURE LOADING FAILED: The Express server is not running ⚠️');
        console.error('To load structures, you must start the server with: npm run server:dev');
        console.error('See SERVER.md for more information about the server.');

        // Don't try fallback methods - we want to make it clear that the server is required
        this.initialized = true;
        return;
      }

      console.log(`Loaded ${Object.keys(this.blueprints).length} schematic blueprints`);
      console.log('Blueprint IDs:', Object.keys(this.blueprints));

      // Save all block mappings after loading all structures
      // This ensures that any mappings that weren't saved during individual blueprint creation are sent to the server
      console.log('Saving all block mappings after loading all structures');
      saveBlockMappings();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing schematic manager:', error);
      console.error('⚠️ STRUCTURE LOADING FAILED: The Express server is not running ⚠️');
      console.error('To load structures, you must start the server with: npm run server:dev');
      console.error('See SERVER.md for more information about the server.');
    }

    console.log('=== SCHEMATIC MANAGER INITIALIZE COMPLETE ===');
  }

  /**
   * Load structures using the server-side API
   * @param forceReload - Whether to force a reload of the files
   * @returns Whether any files were successfully loaded
   */
  private async loadStructuresFromApi(forceReload: boolean = false): Promise<boolean> {
    console.log('=== LOADING STRUCTURES FROM API ===');
    console.log('Force reload:', forceReload);

    try {
      // Get the list of available structure files
      const cacheBuster = forceReload ? `?t=${Date.now()}` : '';
      // Use the full URL to the server
      const apiUrl = `http://localhost:3000/api/structures${cacheBuster}`;
      console.log('Fetching structure list from:', apiUrl);

      console.log('Fetching API URL:', apiUrl);
      const listResponse = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });
      console.log('API response status:', listResponse.status, listResponse.statusText);
      console.log('API response headers:', Object.fromEntries([...listResponse.headers.entries()]));

      if (!listResponse.ok) {
        console.warn('Could not fetch structure list from API:', listResponse.statusText);
        return false;
      }

      // Check the content type to make sure we're getting JSON
      const contentType = listResponse.headers.get('content-type');
      console.log('Content-Type header:', contentType);
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('API response is not JSON:', contentType);
        const text = await listResponse.text();
        console.log('Response text (first 100 chars):', text.substring(0, 100));
        return false;
      }

      let data;
      try {
        data = await listResponse.json();
      } catch (jsonError) {
        console.warn('Error parsing API response as JSON:', jsonError);
        return false;
      }

      console.log('API response data:', data);
      const files = data.files || [];
      console.log('Structure files from API:', files);

      if (files.length === 0) {
        console.warn('No structure files found in API response');
        return false;
      }

      // Load each structure file
      let loadedAny = false;

      for (const filename of files) {
        try {
          console.log(`Processing file: ${filename}`);

          // Get the structure data from the server
          const structureUrl = `http://localhost:3000/api/structures/${filename}${cacheBuster}`;
          console.log('[EIFFEL_DEBUG] Fetching structure data from:', structureUrl);

          const structureResponse = await fetch(structureUrl, {
            headers: {
              'Accept': 'application/json'
            }
          });
          console.log(`[EIFFEL_DEBUG] Structure response for ${filename}:`, structureResponse.status, structureResponse.statusText);

          if (!structureResponse.ok) {
            console.warn(`Could not fetch structure data for ${filename}:`, structureResponse.statusText);
            continue;
          }

          // Check the content type to make sure we're getting JSON
          const structureContentType = structureResponse.headers.get('content-type');
          if (!structureContentType || !structureContentType.includes('application/json')) {
            console.warn(`API response for ${filename} is not JSON:`, structureContentType);
            continue;
          }

          let structureData;
          try {
            structureData = await structureResponse.json();
          } catch (jsonError) {
            console.warn(`Error parsing JSON for ${filename}:`, jsonError);
            continue;
          }

          console.log(`[EIFFEL_DEBUG] Structure data for ${filename}:`, structureData ? 'received' : 'null');

          // Check if we got a valid structure
          if (structureData.blocks && Array.isArray(structureData.blocks)) {
            console.log(`[EIFFEL_DEBUG] Got structure data for ${filename} with ${structureData.blocks.length} blocks`);
            console.log(`[EIFFEL_DEBUG] Structure metadata:`, structureData.metadata);

            // Log the first few blocks to help with debugging
            console.log(`[EIFFEL_DEBUG] First 3 blocks of ${filename}:`);
            structureData.blocks.slice(0, 3).forEach((block: any, index: number) => {
              console.log(`[EIFFEL_DEBUG] Block ${index}:`, {
                position: block.position,
                minecraftName: block.minecraftName,
                minecraftId: block.minecraftId,
                minecraftData: block.minecraftData
              });
            });

            // Create a blueprint from the structure data
            const blueprint = this.createBlueprintFromApiData(structureData, filename);
            console.log(`[EIFFEL_DEBUG] Blueprint created for ${filename}:`, blueprint ? 'success' : 'failed');

            // Add the blueprint to the manager
            if (blueprint) {
              // Add metadata to the blueprint
              if (structureData.metadata) {
                blueprint.fromFile = structureData.metadata.fromFile;
                blueprint.originalFilename = structureData.metadata.filename;
              }

              this.addBlueprint(blueprint, filename);
              console.log(`[EIFFEL_DEBUG] Successfully loaded ${filename} from API`);
              loadedAny = true;
            }
          } else if (structureData.error) {
            console.warn(`Error loading ${filename} from API:`, structureData.error);

            // If the file is not gzipped, try to parse it client-side
            if (structureData.rawData && structureData.error.includes('not gzipped')) {
              console.log(`Trying to parse ${filename} client-side...`);

              // Convert base64 to ArrayBuffer
              const binaryString = atob(structureData.rawData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }

              // Parse the schematic file
              const blueprint = await parseSchematic(bytes.buffer, filename);

              // Add the blueprint to the manager
              if (blueprint) {
                this.addBlueprint(blueprint as SchematicBlueprint, filename);
                console.log(`Successfully parsed ${filename} client-side`);
                loadedAny = true;
              }
            }
          }
        } catch (error) {
          console.warn(`Error processing ${filename}:`, error);
        }
      }

      return loadedAny;
    } catch (error) {
      console.warn('Error loading structures from API:', error);
      return false;
    }
  }

  /**
   * Create a blueprint from API structure data
   * @param structureData - The structure data from the API
   * @param filename - The filename of the structure
   * @returns A blueprint
   */
  private createBlueprintFromApiData(structureData: any, filename: string): SchematicBlueprint {
    // Extract the base name without extension
    const baseName = filename.replace(/\.(schematic|nbt)$/, '');

    // Create a blueprint ID
    const blueprintId = `${baseName.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_mcbuild_org_`;

    // Create a display name
    const displayName = structureData.name || baseName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word

    // Calculate dimensions
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (const block of structureData.blocks) {
      const { x, y, z } = block.position;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      minZ = Math.min(minZ, z);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      maxZ = Math.max(maxZ, z);
    }

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const depth = maxZ - minZ + 1;

    // Create a blueprint
    const blueprint: SchematicBlueprint = {
      id: blueprintId,
      name: displayName,
      difficulty: 'medium', // Default difficulty
      description: `Imported from server: ${filename}`,
      blocks: [],
      dimensions: {
        width,
        height,
        depth
      },
      sourceFile: filename
    };

    // Add the blocks to the blueprint
    for (const block of structureData.blocks) {
      // Map the Minecraft block to our game's block type
      // Pass the filename to track the source of each mapping
      const blockTypeId = mapMinecraftBlock(block, filename);

      // Log the mapping for the first few blocks
      if (blueprint.blocks.length < 3) {
        console.log(`[EIFFEL_DEBUG] Block mapping: ${block.minecraftName || block.minecraftId} -> ${blockTypeId} (from ${filename})`);
      }

      // For Eiffel Tower debugging, log specific block types
      if ((block.minecraftName && (
          block.minecraftName.includes('iron') ||
          block.minecraftName.includes('gold') ||
          block.minecraftName.includes('diamond') ||
          block.minecraftName.includes('glass'))) &&
          blueprint.blocks.length < 100) {
        console.log(`[EIFFEL_DEBUG] Adding block: ${block.minecraftName || block.minecraftId} -> ${blockTypeId} at position (${block.position.x}, ${block.position.y}, ${block.position.z})`);
      }

      // Store both the original Minecraft data and our mapped block type
      blueprint.blocks.push({
        blockTypeId,
        position: {
          x: block.position.x - minX, // Normalize positions to start at 0
          y: block.position.y - minY,
          z: block.position.z - minZ
        },
        // Store the original Minecraft data for future reference
        minecraftData: {
          id: block.minecraftId,
          data: block.minecraftData,
          name: block.minecraftName,
          state: block.minecraftState,
          properties: block.minecraftProperties
        }
      });
    }

    console.log(`[EIFFEL_DEBUG] Created blueprint from API data with ${blueprint.blocks.length} blocks`);

    // Add metadata from the API response
    if (structureData.metadata) {
      blueprint.fromFile = structureData.metadata.fromFile;
      blueprint.originalFilename = structureData.metadata.filename;
      console.log(`[EIFFEL_DEBUG] Blueprint metadata: fromFile=${blueprint.fromFile}, originalFilename=${blueprint.originalFilename}`);
    }

    // Save block mappings to the server after creating the blueprint
    // This ensures that all mappings generated during structure loading are sent to the server
    console.log(`[EIFFEL_DEBUG] Saving block mappings after creating blueprint for ${filename}`);
    saveBlockMappings();

    return blueprint;
  }

  /**
   * Load schematic files from the public/models/structures directory
   * @param forceReload - Whether to force a reload of the files
   */
  private async loadSchematicFiles(forceReload: boolean = false): Promise<void> {
    try {
      console.log('Loading schematic files...');

      // Try to use the API endpoint first
      try {
        const apiResponse = await fetch('http://localhost:3000/api/structures', {
          headers: {
            'Accept': 'application/json'
          }
        });

        if (apiResponse.ok) {
          // Check the content type to make sure we're getting JSON
          const contentType = apiResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await apiResponse.json();
              const files = data.files || [];

              console.log('Files from API:', files);

              if (files.length > 0) {
                // Process each file from the API
                for (const filename of files) {
                  try {
                    // Convert the file to a blueprint
                    const blueprint = await this.convertSchematicToBlueprint(filename, forceReload);

                    // Add the blueprint to the manager
                    if (blueprint) {
                      this.addBlueprint(blueprint, filename);
                    }
                  } catch (error) {
                    console.warn(`Error processing file ${filename}:`, error);
                  }
                }
                return;
              }
            } catch (jsonError) {
              console.warn('Error parsing API response as JSON:', jsonError);
            }
          } else {
            console.warn('API response is not JSON:', contentType);
          }
        }
      } catch (apiError) {
        console.warn('Error using API endpoint:', apiError);
      }

      // If API fails, try direct file loading
      console.log('Trying direct file loading...');

      // Try to load specific NBT files directly - only include files that actually exist
      const directFiles = ['eiffel_tower.nbt']; // Only include the file we know exists
      let loadedAnyDirectFile = false;

      for (const filename of directFiles) {
        try {
          console.log(`Trying to load ${filename} directly...`);

          // Check if the file exists
          const headResponse = await fetch(`/models/structures/${filename}${forceReload ? `?t=${Date.now()}` : ''}`, { method: 'HEAD' });

          if (headResponse.ok) {
            console.log(`File exists: ${filename}`);

            // Convert the file to a blueprint
            const blueprint = await this.convertSchematicToBlueprint(filename, forceReload);

            // Add the blueprint to the manager
            if (blueprint) {
              this.addBlueprint(blueprint, filename);
              console.log(`Successfully loaded ${filename}`);
              loadedAnyDirectFile = true;
            }
          } else {
            console.warn(`File does not exist: ${filename}`);
          }
        } catch (directError) {
          console.warn(`Error loading ${filename} directly:`, directError);
        }
      }

      if (loadedAnyDirectFile) {
        console.log('Successfully loaded at least one file directly');
        return;
      }

      // If all else fails, try the directory listing approach
      console.log('Trying directory listing approach...');

      // In a browser environment, we need to fetch the list of files
      const response = await fetch('/models/structures/');

      if (!response.ok) {
        console.warn('Could not fetch schematic files list:', response.statusText);

        // Fallback to hardcoded list if we can't fetch the directory
        await this.loadHardcodedSchematicFiles(forceReload);
        return;
      }

      // Try to parse the directory listing
      const text = await response.text();
      console.log('Directory listing response:', text.substring(0, 200) + '...');

      // Extract filenames from the directory listing
      // Look for both .schematic and .nbt files
      const fileRegex = /href="([^"]+\.(schematic|nbt))"/g;
      const matches = [...text.matchAll(fileRegex)];

      if (matches.length === 0) {
        console.warn('No schematic or NBT files found in directory listing, using hardcoded list');
        await this.loadHardcodedSchematicFiles(forceReload);
        return;
      }

      console.log(`Found ${matches.length} schematic/NBT files in directory listing`);

      // Extract filenames from matches
      const filenames = matches.map(match => match[1]);
      console.log(`Found ${filenames.length} files in directory listing:`, filenames);

      // Process each file directly without checking existence
      for (const filename of filenames) {
        try {
          // Convert the file to a blueprint
          const blueprint = await this.convertSchematicToBlueprint(filename, forceReload);

          // Add the blueprint to the manager
          if (blueprint) {
            this.addBlueprint(blueprint, filename);
          }
        } catch (error) {
          console.warn(`Error processing file ${filename}:`, error);
        }
      }
    } catch (error) {
      console.warn('Error loading schematic files:', error);

      // Fallback to hardcoded list
      await this.loadHardcodedSchematicFiles(forceReload);
    }
  }

  /**
   * Convert a schematic file to a blueprint
   * @param filename - The filename of the schematic file
   * @param forceReload - Whether to force a reload of the file
   * @returns The converted blueprint
   */
  private async convertSchematicToBlueprint(filename: string, forceReload: boolean = false): Promise<SchematicBlueprint | null> {
    try {
      console.log(`Converting schematic file to blueprint: ${filename}`);

      // Fetch the schematic file
      const cacheBuster = forceReload ? `?t=${Date.now()}` : '';
      const response = await fetch(`/models/structures/${filename}${cacheBuster}`);

      if (!response.ok) {
        console.warn(`Could not fetch schematic file ${filename}:`, response.statusText);
        return null;
      }

      // Get the binary data
      const arrayBuffer = await response.arrayBuffer();

      // Parse the schematic file
      const blueprint = await parseSchematic(arrayBuffer, filename);

      return blueprint as SchematicBlueprint;
    } catch (error) {
      console.warn(`Error converting schematic file ${filename} to blueprint:`, error);
      return null;
    }
  }

  /**
   * Load hardcoded schematic files as a fallback
   * @param forceReload - Whether to force a reload of the files
   */
  private async loadHardcodedSchematicFiles(forceReload: boolean = false): Promise<void> {
    try {
      // Use cache-busting query parameter to force reload when needed
      const cacheBuster = forceReload ? `?t=${Date.now()}` : '';

      // Hardcoded list of schematic and NBT files to check - only include files that actually exist
      const filesToCheck = [
        'eiffel_tower.nbt'
      ];

      // Check which files actually exist
      const existingFiles: string[] = [];

      for (const filename of filesToCheck) {
        try {
          // Try to fetch the file to see if it exists
          const response = await fetch(`/models/structures/${filename}${cacheBuster}`, { method: 'HEAD' });

          if (response.ok) {
            console.log(`File exists: ${filename}`);
            existingFiles.push(filename);
          } else {
            console.log(`File does not exist: ${filename}`);
          }
        } catch (error) {
          console.warn(`Error checking if file exists: ${filename}`, error);
        }
      }

      console.log(`Found ${existingFiles.length} existing files:`, existingFiles);

      // If no files exist, log an error message
      if (existingFiles.length === 0) {
        console.error('⚠️ NO STRUCTURE FILES FOUND ⚠️');
        console.error('To load structures, you must:');
        console.error('1. Start the server with: npm run server:dev');
        console.error('2. Ensure there are valid .nbt files in public/models/structures/');
        console.error('See SERVER.md for more information about the server.');
        return;
      }

      // Process each existing file
      for (const filename of existingFiles) {
        try {
          // Convert the schematic file to a blueprint
          const blueprint = await this.convertSchematicToBlueprint(filename, forceReload);

          // Add the blueprint to the manager
          if (blueprint) {
            this.addBlueprint(blueprint, filename);
          }
        } catch (error) {
          console.warn(`Error processing file ${filename}:`, error);
        }
      }
    } catch (error) {
      console.warn('Error loading hardcoded schematic files:', error);
    }
  }

  /**
   * Force a reload of all schematic blueprints
   * This is useful for development when schematic files have been updated
   */
  async forceReload(): Promise<void> {
    console.log('Forcing reload of schematic blueprints...');
    this.initialized = false;
    return this.initialize(true);
  }

  /**
   * Add a blueprint to the manager
   * @param blueprint - The blueprint to add
   * @param filename - The source filename
   */
  private addBlueprint(blueprint: SchematicBlueprint, filename: string): void {
    // Add source file information
    blueprint.sourceFile = filename;

    // Ensure the ID contains the mcbuild_org marker to distinguish from built-in blueprints
    if (!blueprint.id.includes('_mcbuild_org_')) {
      blueprint.id = `${blueprint.id}_mcbuild_org_`;
    }

    // Store the blueprint
    this.blueprints[blueprint.id] = blueprint;

    console.log(`Loaded schematic blueprint: ${blueprint.name} (${blueprint.id}) with ${blueprint.blocks.length} blocks`);
  }

  /**
   * Get all available schematic blueprints
   */
  getAllBlueprints(): SchematicBlueprint[] {
    return Object.values(this.blueprints);
  }

  /**
   * Get a specific schematic blueprint by ID
   * @param id - The ID of the blueprint to retrieve
   */
  getBlueprintById(id: string): SchematicBlueprint | null {
    // First try with the exact ID
    if (this.blueprints[id]) {
      console.log(`Found schematic blueprint with exact ID: ${id}`);
      return this.blueprints[id];
    }

    // If not found and ID doesn't have _mcbuild_org_ suffix, try adding it
    if (!id.includes('_mcbuild_org_')) {
      const schematicId = `${id}_mcbuild_org_`;
      if (this.blueprints[schematicId]) {
        console.log(`Found schematic blueprint with _mcbuild_org_ suffix: ${schematicId}`);
        return this.blueprints[schematicId];
      }
    }

    // If not found and ID has _mcbuild_org_ suffix, try removing it
    if (id.includes('_mcbuild_org_')) {
      const baseId = id.replace('_mcbuild_org_', '');
      if (this.blueprints[baseId]) {
        console.log(`Found schematic blueprint with base ID: ${baseId}`);
        return this.blueprints[baseId];
      }
    }

    console.log(`Schematic blueprint not found: ${id}`);
    return null;
  }

  /**
   * Get schematic blueprints by difficulty
   * @param difficulty - The difficulty level to filter by
   */
  getBlueprintsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): SchematicBlueprint[] {
    return Object.values(this.blueprints).filter(blueprint => blueprint.difficulty === difficulty);
  }
}

// Create and export a singleton instance
const schematicManager = new SchematicManager();
export default schematicManager;
