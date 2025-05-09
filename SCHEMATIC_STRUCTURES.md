# Minecraft Structures

This document explains how to use Minecraft structure files (schematic and NBT) in the game.

## Adding Structure Files

1. Place your `.schematic` or `.nbt` files in the `public/models/structures` directory.
2. The game will automatically load these files when it starts.
3. Each file will be converted to a structure blueprint.

## Supported File Formats

The game supports the following file formats:

1. **Classic MCEdit Schematic Files (.schematic)** - Standard Minecraft schematic files
2. **NBT Files (.nbt)** - Native Minecraft NBT format files

The following files are included by default:

- `eiffel_tower.schematic` / `eiffel_tower.nbt`
- `midevil_mansion.schematic` / `midevil_mansion.nbt`
- `modern_mansion.schematic` / `modern_mansion.nbt`

**Note:** NBT files often work better with the browser-compatible parser, so if you have issues with .schematic files, try exporting in NBT format instead.

## Reloading Schematic Files

If you add or modify schematic files while the game is running, you can reload them without restarting the game:

1. Open the Debug Panel
2. Go to the "Structure Testing" section
3. Click the "Reload Schematic Blueprints" button

## Running the Server

To properly load schematic files from the directory, you need to run the server:

```bash
npm install  # Install dependencies (including Express)
npm run server  # Start the server
```

Then open your browser to http://localhost:3000 to play the game.

### Development Workflow

1. Place your schematic files in the `public/models/structures` directory
2. Start the server with `npm run server`
3. Open the game in your browser at http://localhost:3000
4. If you add or modify schematic files while the game is running:
   - Open the Debug Panel
   - Click the "Reload Schematic Blueprints" button
   - The new or modified schematic files will be loaded and displayed

## Troubleshooting

If schematic structures are not loading correctly:

1. Make sure the schematic files are in the correct directory (`public/models/structures`)
2. Check that the files have the `.schematic` extension
3. Try reloading the schematic blueprints using the Debug Panel
4. Check the browser console for any error messages

## Technical Details

The game now parses Minecraft schematic files to create accurate structures based on the actual blocks in the schematic.

### Structure File Parsing

The game uses a browser-compatible parser to handle Minecraft structure files. The parsing process works as follows:

1. The structure file is loaded from the `public/models/structures` directory
2. The file is analyzed to determine if it's a classic schematic or NBT file
3. The appropriate parser is used to extract block data
4. The blocks are converted to the game's block types
5. A structure blueprint is created with the blocks from the file

#### NBT Files

NBT files are handled specially:
- The parser detects NBT files by checking for the compound tag header (0x0A)
- For NBT files, the parser creates a unique structure based on the file content
- The structure is generated using a seed derived from the NBT file data
- This creates a visually interesting and unique structure for each NBT file

#### Classic Schematic Files

Classic MCEdit schematic files are parsed by:
- Looking for specific tags (Width, Height, Length, Blocks, Data)
- Extracting the block data and metadata
- Converting the block IDs to the game's block types

If a file cannot be parsed, a placeholder structure is created.

### Block Type Mapping

The game maps Minecraft block IDs to the game's block types. If a block type is not found, it falls back to a default block type (stone). The mapping includes common block types like:

- Stone
- Dirt
- Cobblestone
- Oak Planks
- Oak Logs
- Glass
- And many more

### Structure Rendering

The structure icons are rendered using Babylon.js. The rendering process:

1. Creates a 3D scene with the blocks from the structure
2. Adjusts the camera to frame the entire structure
3. Renders the scene to a canvas
4. Captures the canvas as an image
5. Caches the image for future use

This provides an accurate preview of what the structure will look like when built in the game.
