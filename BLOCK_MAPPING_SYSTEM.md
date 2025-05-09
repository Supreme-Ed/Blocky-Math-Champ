# Block Mapping System Documentation

This document explains how the block mapping system works in the Blocky Math Champ project.

## Overview

The block mapping system is responsible for converting Minecraft block IDs and names from NBT structure files into the game's internal block types. This is a critical component for rendering structures correctly in the game.

The system consists of several components:

1. **Client-Side Mapping**: Converts Minecraft block data to game block types
2. **Client-Side Caching**: Collects mappings to reduce API calls
3. **Server-Side Logging**: Records mappings to a Markdown file
4. **Bulk API Endpoint**: Processes multiple mappings in a single request

## Block Mapping Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  NBT Structure  │────▶│  Block Mapper   │────▶│  Game Renderer  │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │ Mapping Cache   │
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │                 │     │                 │
                        │  API Endpoint   │────▶│ Mapping Logger  │
                        │                 │     │                 │
                        └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │                 │
                                                │BLOCK_MAPPING.md │
                                                │                 │
                                                └─────────────────┘
```

## Key Components

### 1. Minecraft Block Mapper (`minecraftBlockMapper.ts`)

This component is responsible for mapping Minecraft block IDs and names to the game's block types.

**Key Functions:**

- `mapMinecraftBlockId(blockId, blockData, sourceFile)`: Maps classic Minecraft block IDs to game block types
- `mapMinecraftBlockName(blockName, sourceFile)`: Maps modern Minecraft block names to game block types
- `mapMinecraftBlock(block, sourceFile)`: Main entry point that handles both formats

**Mapping Logic:**

- Uses predefined mappings for common block types
- Falls back to 'stone' for unknown block types
- Special handling for 'air' blocks (not rendered)
- Validates that mapped block types exist in the game
- Includes the source NBT file name in the mapping

### 2. Block Mapping Client (`blockMappingClient.ts`)

This component caches mappings on the client side and sends them to the server in bulk.

**Key Functions:**

- `sendBlockMapping(source, target, type, sourceFile)`: Adds a mapping to the cache
- `saveBlockMappings()`: Sends all cached mappings to the server
- `addTestMappings()`: Adds test mappings for debugging

**Caching Logic:**

- Stores mappings in a client-side cache
- Uses a unique key format: `${type}:${source}:${sourceFile}`
- Prevents duplicate mappings
- Sends mappings in bulk to reduce API calls

### 3. Block Mapping Logger (`blockMappingLogger.ts`)

This server-side component logs mappings to the BLOCK_MAPPING.md file.

**Key Functions:**

- `logMapping(source, target, type, sourceFile)`: Adds a mapping to the log
- `saveMappingLog()`: Saves all mappings to BLOCK_MAPPING.md
- `addMapping(source, target, type, sourceFile)`: Adds a single mapping
- `addBulkMappings(mappings)`: Adds multiple mappings at once

**Logging Format:**

- Markdown tables for ID and name mappings
- Includes source NBT file for each mapping
- Automatically updates when new mappings are received

### 4. Schematic Manager (`schematicManager.ts`)

This component loads structure files and creates blueprints.

**Key Functions:**

- `createBlueprintFromApiData(structureData, filename)`: Creates a blueprint from API data
- `initialize()`: Loads all structure files

**Integration with Block Mapping:**

- Calls `mapMinecraftBlock` for each block in the structure
- Passes the source filename to track the origin of each mapping
- Calls `saveBlockMappings()` after creating each blueprint
- Calls `saveBlockMappings()` after loading all structures

## BLOCK_MAPPING.md File

The BLOCK_MAPPING.md file is automatically generated and contains:

1. A timestamp of when it was generated
2. A table of Block ID Mappings
3. A table of Block Name Mappings

Each table includes:
- The Minecraft block ID or name
- The corresponding game block type
- The source NBT file

Example:

```markdown
# Minecraft Block Mapping Log

This file is automatically generated each time the game runs.

Generated: 2025-05-09T15:39:37.729Z

## Block ID Mappings

| Minecraft Block ID | Game Block Type | Source NBT File |
|-------------------|----------------|----------------|
| 1 | stone | test.nbt |
| 2 | dirt | test.nbt |
| 5 | planks_oak | test.nbt |

## Block Name Mappings

| Minecraft Block Name | Game Block Type | Source NBT File |
|---------------------|----------------|----------------|
| black_wool | stone | airplane.nbt |
| glass | glass | airplane.nbt |
| stone_slab | stone | airplane.nbt |
```

## API Endpoints

### `/api/bulk-block-mappings`

- **Method**: POST
- **Purpose**: Receives bulk mappings from the client
- **Request Body**: JSON object with mappings
- **Response**: Success/failure message

## Fallback Mechanism

When a Minecraft block doesn't have a defined mapping:

1. The system defaults to 'stone' as the fallback block type
2. The mapping is logged to BLOCK_MAPPING.md
3. Developers can review the log and add proper mappings

## Air Block Handling

Air blocks are handled specially:

1. They are mapped to the 'air' block type
2. They are not rendered in the structure visualization
3. They are still logged to BLOCK_MAPPING.md for completeness

## Future Improvements

1. **Unified Block Mapper**: Combine `minecraftBlockMapper.ts` and `blockTypeMapper.ts` into a single class
2. **Expanded Mappings**: Add more mappings based on the BLOCK_MAPPING.md file
3. **Unit Tests**: Create unit tests for the BlockMapper class
4. **Dynamic Mapping Updates**: Allow updating mappings without restarting the server

## Troubleshooting

If block mappings are not being logged:

1. Check that structures are being loaded correctly
2. Verify that `saveBlockMappings()` is being called after structure loading
3. Check the server logs for any errors related to the mapping process
4. Try adding test mappings using the debug panel

## References

- [Minecraft Block IDs](https://minecraft-ids.grahamedgecombe.com/)
- [Minecraft Wiki - Block States](https://minecraft.fandom.com/wiki/Block_states)
- [NBT Format Specification](https://minecraft.fandom.com/wiki/NBT_format)
