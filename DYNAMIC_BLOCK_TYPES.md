# Dynamic Block Types System

This document outlines the implementation of the dynamic block types system in the Blocky Math Champ game.

## Overview

The dynamic block types system allows the game to automatically load block types from texture files in the `public/textures/block_textures` directory. This means that new block types can be added to the game simply by adding new texture files to this directory, without having to modify any code.

## Implementation Details

### 1. Server-Side API Endpoint

The server provides an API endpoint to list all texture files in the `public/textures/block_textures` directory:

```typescript
// API endpoint to get the list of block texture files
app.get('/api/block-textures', (_req: Request, res: Response) => {
  const texturesDir = path.join(process.cwd(), 'public', 'textures', 'block_textures');
  
  // Check if directory exists
  if (!fs.existsSync(texturesDir)) {
    console.error(`Block textures directory not found: ${texturesDir}`);
    res.status(500).json({ 
      error: 'Block textures directory not found',
      path: texturesDir
    });
    return;
  }

  // Read the directory
  fs.readdir(texturesDir, (err, files) => {
    if (err) {
      console.error('Error reading block textures directory:', err);
      res.status(500).json({ 
        error: 'Error reading block textures directory',
        details: err.message
      });
      return;
    }

    // Filter for image files
    const textureFiles = files.filter(file =>
      file.endsWith('.png') ||
      file.endsWith('.jpg') ||
      file.endsWith('.jpeg') ||
      file.endsWith('.webp')
    );

    console.log(`[API] Block texture files found: ${textureFiles.join(', ')}`);

    // Return the list of files as JSON
    res.json(textureFiles);
  });
});
```

### 2. Client-Side Dynamic Block Type Generation

The client-side code fetches the list of texture files from the server and generates block types dynamically:

#### dynamicBlockTypes.ts

This file contains the core functionality for fetching texture files and creating block types:

```typescript
// Special block types
const AIR_BLOCK: BlockType = {
  id: 'air',
  name: 'Air',
  // Air has no texture as it's invisible
};

// Cache for block types to avoid repeated API calls
let blockTypesCache: BlockType[] = [];
let lastRefreshTime = 0;

// Fetch texture files from the server
async function fetchTextureFiles(): Promise<string[]> {
  try {
    const timestamp = Date.now();
    const response = await fetch(`/api/block-textures?t=${timestamp}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch texture files: ${response.statusText}`);
    }
    
    const textureFiles = await response.json();
    return textureFiles;
  } catch (error) {
    console.error('Error fetching texture files:', error);
    throw error;
  }
}

// Create a block type from a texture filename
function createBlockTypeFromFilename(filename: string): BlockType {
  // Extract the block type ID from the filename (remove extension)
  const id = formatBlockTypeId(filename);
  
  // Create a readable name from the ID
  const name = formatBlockTypeName(id);
  
  // Create the block type
  return {
    id,
    name,
    texture: `/textures/block_textures/${filename}`,
  };
}

// Get all block types (with optional refresh)
export async function getBlockTypes(forceRefresh = false): Promise<BlockType[]> {
  const currentTime = Date.now();
  const cacheExpired = currentTime - lastRefreshTime > CACHE_EXPIRY_MS;
  
  // Use cache if available and not expired
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

    // Combine air block and dynamic block types
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

// Force refresh of block types
export async function refreshBlockTypes(): Promise<BlockType[]> {
  return getBlockTypes(true);
}
```

#### blockTypes.ts

This file exports the block types for use throughout the application:

```typescript
// Export a function to get all block types
export async function getAllBlockTypes(forceRefresh = false): Promise<BlockType[]> {
  try {
    const types = await getBlockTypes(forceRefresh);
    BLOCK_TYPES = types; // Update the exported array
    blockTypesLoaded = true;
    return types;
  } catch (error) {
    console.error('Error loading dynamic block types:', error);
    throw error; // Re-throw to handle at application level
  }
}

// Function to check if block types are loaded
export function areBlockTypesLoaded(): boolean {
  return blockTypesLoaded;
}

// Function to load block types synchronously (blocks until complete)
export async function loadBlockTypesSync(): Promise<void> {
  if (!blockTypesLoaded) {
    BLOCK_TYPES = await getAllBlockTypes(true);
    console.log(`Loaded ${BLOCK_TYPES.length} block types synchronously`);
  }
}
```

### 3. Application Initialization

The application now waits for block types to load before rendering:

```typescript
function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Load resources before showing the game
  useEffect(() => {
    async function loadResources() {
      try {
        // Load block types synchronously
        await loadBlockTypesSync();
        
        // Initialize block award manager with the loaded block types
        blockAwardManager.setBlockTypes(BLOCK_TYPES);
        
        console.log('Resources loaded successfully');
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load resources:', error);
        // Show error message to user
        alert('Failed to load game resources. Please refresh the page and try again.');
      }
    }
    
    loadResources();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Rest of the application...
}
```

### 4. Air Block Handling

Air blocks are special and are handled differently:

1. They are not rendered in the game world
2. They are not shown in the inventory
3. They are not counted as required blocks for structures

```typescript
// Filter out air blocks from the inventory display
const allTypes = BLOCK_TYPES.filter(type => type.id !== 'air');

// Skip air blocks when rendering
if (blockType.id === 'air') {
  continue; // Skip rendering air blocks
}

// Skip air blocks when awarding
if (blockTypeId === 'air') {
  return; // Don't award air blocks
}
```

## Usage

### Adding New Block Types

To add a new block type to the game:

1. Add a new texture file to the `public/textures/block_textures` directory
2. The file name will be used to generate the block type ID and name
   - Example: `oak_planks.png` becomes a block type with ID `oak_planks` and name `Oak Planks`
3. Restart the game or click the "Refresh Block Types" button in the debug panel
4. The new block type will be automatically available in the game

### Refreshing Block Types

The game provides a "Refresh Block Types" button in the debug panel that:

1. Clears the block types cache
2. Fetches the latest texture files from the server
3. Regenerates all block types
4. Updates the game with the new block types

## Benefits

1. **Modularity**: Block types are loaded dynamically, making the system more modular
2. **Extensibility**: New block types can be added without modifying code
3. **Maintainability**: The system is easier to maintain as it has fewer hardcoded values
4. **Flexibility**: The system can adapt to changes in the texture files directory

## Limitations

1. The system requires the server to be running to fetch texture files
2. Block type IDs and names are derived from filenames, which may not always be ideal
3. Additional block properties (like transparency, hardness, etc.) cannot be specified through this system

## Future Improvements

1. Add support for a configuration file to specify additional block properties
2. Implement a more sophisticated naming system for block types
3. Add support for block variants and states
4. Create a UI for managing block types in the game
