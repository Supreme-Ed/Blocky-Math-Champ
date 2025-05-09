# Server Documentation

This document provides an overview of the server architecture for the Blocky Math Champ project.

## Server Structure

The server consists of two main files:

1. **server.ts** (root directory)
   - Main server file used in production
   - Handles API requests and serves static files
   - Includes CORS middleware and detailed logging
   - Referenced in package.json scripts (npm run server:dev)

2. **src/server/structureService.ts**
   - Core service that handles structure creation and NBT file parsing
   - Imported by server.ts
   - Contains the logic for parsing NBT files and creating structures
   - Provides fallback mechanisms for when parsing fails

## API Endpoints

The server provides the following API endpoints:

### GET /models/structures/
Returns an HTML page listing all available structure files (.nbt and .schematic) in the public/models/structures directory.

### GET /api/structures
Returns a JSON list of all available structure files (.nbt and .schematic) in the public/models/structures directory.

Example response:
```json
{
  "files": ["eiffel_tower.nbt"]
}
```

### GET /api/structures/:filename
Parses and returns the structure data for the specified file.

Example request: `/api/structures/eiffel_tower.nbt`

Example response:
```json
{
  "name": "Eiffel Tower",
  "blocks": [
    {
      "minecraftName": "minecraft:iron_block",
      "position": { "x": 0, "y": 0, "z": 0 }
    },
    // ... more blocks
  ],
  "fromFile": true,
  "metadata": {
    "fromFile": true,
    "filename": "eiffel_tower.nbt",
    "timestamp": 1620000000000
  }
}
```

## Running the Server

The server can be run in several ways:

### Development Mode
For development, you only need to run a single command:

```bash
npm run dev
```

This starts:
1. The Vite development server on port 5173
2. The Express API server on port 3000 (automatically started by a Vite plugin)

The Vite server is configured to proxy API requests to the Express server, so you only need to access http://localhost:5173 in your browser.

If you need to run only the Express server (for debugging or testing), you can use:

```bash
npm run server:dev
```

This runs the API server on port 3000 using ts-node, which allows for direct execution of TypeScript files without prior compilation.

### Production Mode
```bash
npm run build:all
npm start
```
This first builds both the frontend and the server, then runs the Express server in production mode, which serves both the API and the frontend files from a single server on port 3000.

## Structure Loading Requirements

For structure loading to work properly:

1. The Express server must be running (`npm run server:dev`)
2. Valid NBT files must be present in the `public/models/structures/` directory
3. The NBT files must be in a supported format (modern structure or classic schematic)

If the server is not running or no valid NBT files are found, the application will display a message in the structure panel with instructions.

## Structure Service

The structure service (structureService.ts) provides the following functionality:

1. **NBT File Parsing**
   - Parses both gzipped and uncompressed NBT files
   - Supports different NBT formats (modern structure, classic schematic)
   - Falls back to binary parsing for unknown formats

2. **Structure Creation**
   - Creates structures from NBT data
   - Provides fallback structures when parsing fails
   - Maps Minecraft block IDs/names to game block types

3. **Predefined Structures**
   - Includes predefined structures like Eiffel Tower and Mansions
   - Used as fallbacks when file parsing fails

## TypeScript Configuration

The server uses a separate TypeScript configuration (tsconfig.node.json) that is optimized for Node.js applications:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "CommonJS",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "target": "ES2020",
    "strict": true,
    "forceConsistentCasingInFileNames": true
  },
  "ts-node": {
    "transpileOnly": true,
    "files": true,
    "compilerOptions": {
      "module": "CommonJS"
    }
  },
  "include": ["vite.config.ts", "server.ts", "src/server/**/*"]
}
```

## Troubleshooting

If you encounter issues with the server, check the following:

1. **Port Conflicts**: The server runs on port 3000 by default. Make sure this port is not in use by another application.

2. **Missing Structure Files**: Ensure that the structure files (.nbt or .schematic) are placed in the public/models/structures directory.

3. **TypeScript Errors**: If you encounter TypeScript errors, make sure you're using the correct TypeScript configuration (tsconfig.node.json) when running the server.

4. **NBT Parsing Errors**: If you encounter errors parsing NBT files, check that the files are valid and in a supported format. The server will fall back to a simple box structure if parsing fails.
