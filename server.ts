// server.ts
// TypeScript server to serve structure files and handle API requests

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { getStructureByFilename } from './src/server/structureService';
import { addMapping, addBulkMappings, saveMappingLog } from './src/server/blockMappingLogger';

// CORS middleware
const corsMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
};

const app = express();
const port = process.env.PORT || 3000;

// Use CORS middleware
app.use(corsMiddleware);

// Parse JSON request bodies
app.use(express.json());

// API middleware to ensure proper content type
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  console.log(`API middleware for ${req.url}`);

  // Set CORS headers for all API endpoints
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Set content type
  res.setHeader('Content-Type', 'application/json');

  // Log the full URL for debugging
  console.log(`[API] Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`);

  next();
});

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

// Serve static files from the public directory
app.use(express.static('public'));

// In production, serve the built frontend files
if (isProduction) {
  console.log('[SERVER] Running in production mode, serving frontend files from dist directory');
  app.use(express.static('dist'));
} else {
  console.log('[SERVER] Running in development mode');
}

// Serve the directory listing for the structures directory
app.get('/models/structures/', (_req: Request, res: Response) => {
  const structuresDir = path.join(__dirname, 'public', 'models', 'structures');

  // Read the directory
  fs.readdir(structuresDir, (err, files) => {
    if (err) {
      console.error('Error reading structures directory:', err);
      res.status(500).send('Error reading structures directory');
      return;
    }

    // Filter for .schematic and .nbt files
    const structureFiles = files.filter(file => file.endsWith('.schematic') || file.endsWith('.nbt'));
    console.log('Structure files found:', structureFiles);

    // Create a simple HTML directory listing
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Structure Files</title>
        </head>
        <body>
          <h1>Structure Files</h1>
          <ul>
            ${structureFiles.map(file => `<li><a href="${file}">${file}</a></li>`).join('')}
          </ul>
        </body>
      </html>
    `;

    res.send(html);
  });
});

// API endpoint to get the list of structure files
app.get('/api/structures', (req: Request, res: Response) => {
  console.log('API request received for /api/structures');
  console.log('Request headers:', req.headers);

  const structuresDir = path.join(__dirname, 'public', 'models', 'structures');
  console.log('Structures directory path:', structuresDir);

  // Read the directory
  fs.readdir(structuresDir, (err, files) => {
    if (err) {
      console.error('Error reading structures directory:', err);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({ error: 'Error reading structures directory' });
      return;
    }

    // Filter for .schematic and .nbt files
    const structureFiles = files.filter(file => file.endsWith('.schematic') || file.endsWith('.nbt'));
    console.log('Structure files found:', structureFiles);

    // Set the content type explicitly
    res.setHeader('Content-Type', 'application/json');
    console.log('Response headers set:', res.getHeaders());

    // Return the list of files as JSON
    const responseData = { files: structureFiles };
    console.log('Sending JSON response:', responseData);
    res.json(responseData);

    console.log('Sent structure files list response');
  });
});

// API endpoint to parse and return NBT file data
app.get('/api/structures/:filename', (req: Request, res: Response) => {
  console.log('[API] Request received for /api/structures/:filename');
  console.log('[API] Request headers:', req.headers);

  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'models', 'structures', filename);

  console.log(`[API] Attempting to load structure file: ${filename}`);
  console.log(`[API] File path: ${filePath}`);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log(`[API ERROR] File not found: ${filePath}`);
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
      error: 'File not found',
      message: `The requested structure file '${filename}' does not exist.`,
      availableFiles: fs.readdirSync(path.join(__dirname, 'public', 'models', 'structures'))
        .filter(file => file.endsWith('.nbt') || file.endsWith('.schematic'))
    });
    return;
  }

  // Get the structure based on the filename
  console.log(`[API] Getting structure for file: ${filename}`);
  getStructureByFilename(filename)
    .then(structure => {
      console.log(`[API] Successfully created structure with ${structure.blocks.length} blocks, fromFile: ${structure.fromFile}`);

      // Set the content type explicitly
      res.setHeader('Content-Type', 'application/json');
      console.log('[API] Response headers set:', res.getHeaders());

      // Create the response object
      const responseObj = {
        ...structure,
        metadata: {
          fromFile: structure.fromFile || false,
          filename: filename,
          timestamp: Date.now(),
          success: true
        }
      };

      console.log(`[API] Sending structure response for ${filename}`);

      // Return the structure with additional metadata
      res.json(responseObj);
    })
    .catch(error => {
      console.error('[API ERROR] Error creating structure:', error);

      // Get detailed file information for troubleshooting
      let fileInfo = {};
      try {
        const stats = fs.statSync(filePath);
        const fileData = fs.readFileSync(filePath);
        const firstBytes = Buffer.alloc(20);
        const bytesRead = Math.min(fileData.length, 20);
        fileData.copy(firstBytes, 0, 0, bytesRead);

        fileInfo = {
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
          firstBytes: Array.from(firstBytes.subarray(0, bytesRead)).map(b => b.toString(16).padStart(2, '0')).join(' '),
          isGzipped: fileData.length >= 2 && fileData[0] === 0x1f && fileData[1] === 0x8b
        };
      } catch (fileError) {
        fileInfo = { error: 'Could not read file details', message: String(fileError) };
      }

      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        error: 'Error creating structure',
        message: error instanceof Error ? error.message : String(error),
        fileInfo: fileInfo,
        availableFiles: fs.readdirSync(path.join(__dirname, 'public', 'models', 'structures'))
          .filter(file => file.endsWith('.nbt') || file.endsWith('.schematic'))
      });
    });
});

// Define all API routes before this point

// API routes should be defined before the catch-all handler
// This is a special handler for the block textures endpoint
app.get('/api/block-textures', (_req: Request, res: Response) => {
  console.log('[API] Block textures endpoint called directly');

  // Set CORS headers explicitly for this endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Use the correct path to the block textures directory
  const texturesDir = path.join(process.cwd(), 'public', 'textures', 'block_textures');
  console.log('[API] Block textures directory path:', texturesDir);

  // Check if the directory exists
  if (!fs.existsSync(texturesDir)) {
    console.error(`[API] Block textures directory does not exist: ${texturesDir}`);
    res.status(500).json({ error: `Block textures directory does not exist: ${texturesDir}` });
    return;
  }

  // Read the directory
  fs.readdir(texturesDir, (err, files) => {
    if (err) {
      console.error('[API] Error reading block textures directory:', err);
      res.status(500).json({ error: 'Error reading block textures directory' });
      return;
    }

    // Filter for image files
    const textureFiles = files.filter(file =>
      file.endsWith('.png') ||
      file.endsWith('.jpg') ||
      file.endsWith('.jpeg') ||
      file.endsWith('.webp')
    );

    console.log('[API] Block texture files found:', textureFiles);
    res.json(textureFiles);
  });
});

// Serve the React app for all other routes
app.get('*', (req: Request, res: Response) => {
  console.log(`[SERVER] Catch-all route handling request for: ${req.url}`);

  // Skip API routes - this should never happen since we have specific handlers above
  if (req.url.startsWith('/api/')) {
    console.log(`[SERVER WARNING] API request ${req.url} reached catch-all handler`);
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }

  // Serve the React app for non-API routes
  console.log(`[SERVER] Serving index.html for: ${req.url}`);

  // In production, serve from the dist directory, otherwise from public
  const indexPath = isProduction
    ? path.join(__dirname, 'dist', 'index.html')
    : path.join(__dirname, 'public', 'index.html');

  console.log(`[SERVER] Index path: ${indexPath}`);
  res.sendFile(indexPath);
});

// API endpoint to log block mappings
app.post('/api/block-mapping', (req: Request, res: Response) => {
  try {
    const { source, target, type } = req.body;

    if (!source || !target || !type || (type !== 'id' && type !== 'name')) {
      res.status(400).json({ error: 'Invalid mapping data' });
      return;
    }

    console.log(`[BLOCK_MAPPING] Adding mapping: ${type}:${source} -> ${target}`);
    addMapping(source, target, type as 'id' | 'name');
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding mapping:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to log multiple block mappings at once
app.post('/api/bulk-block-mappings', (req: Request, res: Response) => {
  try {
    const { mappings } = req.body;

    if (!mappings || typeof mappings !== 'object') {
      res.status(400).json({ error: 'Invalid mappings data' });
      return;
    }

    const mappingCount = Object.keys(mappings).length;
    console.log(`[BLOCK_MAPPING] Adding ${mappingCount} mappings in bulk`);

    // Add all mappings at once
    addBulkMappings(mappings);

    // Save the mappings to file
    saveMappingLog();

    res.json({ success: true, count: mappingCount });
  } catch (error) {
    console.error('Error adding bulk mappings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API endpoint to save block mappings to file
app.post('/api/save-block-mappings', (_req: Request, res: Response) => {
  try {
    saveMappingLog();
    res.json({ success: true, message: 'Block mappings saved to BLOCK_MAPPING.md' });
  } catch (error) {
    console.error('Error saving block mappings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to check if the API is working
app.get('/api/test', (_req: Request, res: Response) => {
  console.log('[API] Test endpoint called');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.json({ message: 'API is working' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);

  // Create an empty BLOCK_MAPPING.md file at startup
  saveMappingLog();

  // Add some test ID mappings
  addMapping('1', 'stone', 'id', 'test.nbt');
  addMapping('2', 'dirt', 'id', 'test.nbt');
  addMapping('5', 'planks_oak', 'id', 'test.nbt');
  saveMappingLog();
});
