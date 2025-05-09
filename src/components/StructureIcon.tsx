// src/components/StructureIcon.tsx
// Component for rendering structure icons in the structure panel using Babylon.js 3D rendering

import React, { useEffect, useState, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { StructureBlueprint } from '../game/structureBlueprints';
import structureBuilder from '../game/structureBuilder';
import blockAwardManager from '../game/blockAwardManager';
import { getBlockTypeById } from '../game/blockTypes';
import { getValidBlockTypeId } from '../game/blockTypeMapper';
import type { SchematicBlueprint } from '../game/schematicManager';
import Tooltip from './Tooltip';
import './StructureIcon.css';

const ICON_WIDTH = 200; // px
const ICON_HEIGHT = 150; // px

interface StructureIconProps {
  blueprint: StructureBlueprint;
  isAvailable: boolean;
  isSelected: boolean;
  onClick: () => void;
}

interface TooltipState {
  visible: boolean;
  content: string;
  position: {
    x: number;
    y: number;
  };
}

/**
 * Component for rendering a structure icon
 *
 * @param props - Component props
 * @returns React component
 */
const StructureIcon: React.FC<StructureIconProps> = ({
  blueprint,
  isAvailable,
  isSelected,
  onClick
}) => {
  const [icon, setIcon] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    content: '',
    position: { x: 0, y: 0 }
  });
  const iconRef = useRef<HTMLDivElement>(null);

  // Helper functions for color manipulation
  const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
    // Remove # if present
    hex = hex.replace(/^#/, '');

    // Handle potential invalid hex values
    if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
      console.warn(`Invalid hex color: ${hex}, using fallback`);
      hex = 'A0A0A0'; // Default gray
    }

    // Parse hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return { r, g, b };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const lightenColor = (color: string, percent: number): string => {
    try {
      const { r, g, b } = hexToRgb(color);
      const amount = Math.floor(255 * (percent / 100));

      return rgbToHex(
        Math.min(r + amount, 255),
        Math.min(g + amount, 255),
        Math.min(b + amount, 255)
      );
    } catch (error) {
      console.warn(`Error lightening color ${color}:`, error);
      return color;
    }
  };

  const darkenColor = (color: string, percent: number): string => {
    try {
      const { r, g, b } = hexToRgb(color);
      const amount = Math.floor(255 * (percent / 100));

      return rgbToHex(
        Math.max(r - amount, 0),
        Math.max(g - amount, 0),
        Math.max(b - amount, 0)
      );
    } catch (error) {
      console.warn(`Error darkening color ${color}:`, error);
      return color;
    }
  };

  // Generate icon for the structure
  useEffect(() => {
    // Create a 3D rendered view of the structure using Babylon.js
    const generateIsometricIcon = async () => {
      try {
        console.log(`Generating icon for structure: ${blueprint.name} (${blueprint.id})`);

        // Validate blueprint structure
        if (!blueprint.blocks || !Array.isArray(blueprint.blocks) || blueprint.blocks.length === 0) {
          console.error(`Invalid blueprint structure for ${blueprint.id}: blocks array is missing, not an array, or empty`);
          // Create a simple placeholder icon instead
          createPlaceholderIcon();
          return;
        }

        // Log the first few blocks to help with debugging
        console.log(`Blueprint has ${blueprint.blocks.length} blocks. First 3 blocks:`);
        blueprint.blocks.slice(0, 3).forEach((block, index) => {
          console.log(`Block ${index}:`, block);
        });

        // Create a canvas for Babylon.js rendering
        const canvas = document.createElement('canvas');
        canvas.width = ICON_WIDTH;
        canvas.height = ICON_HEIGHT;

        // Create a Babylon.js engine
        const engine = new BABYLON.Engine(canvas, false, { preserveDrawingBuffer: true });

        // Create a scene with transparent background
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.2, 1); // Dark gray background to match game

        // Create an orthographic camera for isometric view
        // Use the same camera settings as the inventory icons for consistency
        const camera = new BABYLON.ArcRotateCamera(
          'camera',
          Math.PI / 4, // Alpha - horizontal rotation (45 degrees)
          Math.PI / 3, // Beta - vertical angle (60 degrees)
          10,          // Radius - distance from target
          new BABYLON.Vector3(0, 0, 0),
          scene
        );

        // Set to orthographic mode for consistent block sizes
        camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        camera.orthoLeft = -5;
        camera.orthoRight = 5;
        camera.orthoTop = 5;
        camera.orthoBottom = -5;

        // Add lighting
        const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(1, 1, 0), scene);
        light1.intensity = 0.7;
        const light2 = new BABYLON.DirectionalLight('light2', new BABYLON.Vector3(0, -1, 1), scene);
        light2.intensity = 0.5;

        // Draw a colored border based on difficulty
        let borderColor;
        switch (blueprint.difficulty) {
          case 'easy':
            borderColor = '#4CAF50'; // Green
            break;
          case 'medium':
            borderColor = '#FFC107'; // Amber
            break;
          case 'hard':
            borderColor = '#F44336'; // Red
            break;
          default:
            borderColor = '#2196F3'; // Blue
        }

        // Create a border plane that will be rendered on top of the scene
        const borderPlane = BABYLON.MeshBuilder.CreatePlane('border', { width: 10, height: 10 }, scene);
        borderPlane.position = new BABYLON.Vector3(0, 0, -5);

        // Create a dynamic texture for the border
        const borderTexture = new BABYLON.DynamicTexture('borderTexture', { width: 1024, height: 1024 }, scene);
        const borderContext = borderTexture.getContext();
        borderContext.strokeStyle = borderColor;
        borderContext.lineWidth = 40;
        borderContext.strokeRect(40, 40, 944, 944);
        borderTexture.update();

        // Create material for the border
        const borderMaterial = new BABYLON.StandardMaterial('borderMaterial', scene);
        borderMaterial.diffuseTexture = borderTexture;
        borderMaterial.emissiveColor = BABYLON.Color3.White();
        borderMaterial.alpha = 0.5;
        borderPlane.material = borderMaterial;

        // Validate dimensions
        if (!blueprint.dimensions ||
            typeof blueprint.dimensions.width !== 'number' ||
            typeof blueprint.dimensions.height !== 'number' ||
            typeof blueprint.dimensions.depth !== 'number') {
          console.error(`Invalid dimensions for blueprint ${blueprint.id}:`, blueprint.dimensions);
          // Use default dimensions
          blueprint.dimensions = {
            width: 5,
            height: 5,
            depth: 5
          };
        }

        // Calculate block size to fit the structure in the icon
        // We want to make sure the entire structure is visible
        const maxDimension = Math.max(
          blueprint.dimensions.width,
          blueprint.dimensions.height,
          blueprint.dimensions.depth
        );

        // Create a parent container for all blocks
        const structureRoot = new BABYLON.TransformNode('structureRoot', scene);

        // Calculate the center of the structure for positioning
        const centerX = blueprint.dimensions.width / 2;
        const centerZ = blueprint.dimensions.depth / 2;
        const centerY = blueprint.dimensions.height / 2;

        // Adjust the camera target to center on the structure
        camera.target = new BABYLON.Vector3(0, centerY / 2, 0);

        // Create a ground plane
        const groundSize = Math.max(blueprint.dimensions.width, blueprint.dimensions.depth) + 2;
        const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: groundSize, height: groundSize }, scene);
        ground.position.y = -0.5;

        // Create ground material
        const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
        groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#333333');
        groundMaterial.specularColor = BABYLON.Color3.Black();
        ground.material = groundMaterial;

        // Track loaded textures to avoid reloading the same texture multiple times
        const textureCache: Record<string, BABYLON.Texture> = {};

        // Create a promise to load all block textures
        const loadTextures = async () => {
          try {
            // Get unique block types
            const uniqueBlockTypes = new Set<string>();
            blueprint.blocks.forEach(block => {
              if (!block || typeof block.blockTypeId !== 'string') {
                console.warn('Invalid block in blueprint:', block);
                return;
              }
              // Use the valid block type ID
              const validBlockTypeId = getValidBlockTypeId(block.blockTypeId);
              uniqueBlockTypes.add(validBlockTypeId);
            });

            console.log(`Loading textures for ${uniqueBlockTypes.size} unique block types`);

            // Load all textures in parallel
            const texturePromises = Array.from(uniqueBlockTypes).map(async (blockTypeId) => {
              try {
                const texturePath = `/textures/block_textures/${blockTypeId}.png`;
                console.log(`Loading texture: ${texturePath}`);
                const texture = new BABYLON.Texture(texturePath, scene);

                // Use nearest neighbor filtering for pixelated look
                texture.updateSamplingMode(BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST);

                // Wait for texture to load
                await new Promise<void>((resolve) => {
                  if (texture.isReady()) {
                    resolve();
                  } else {
                    texture.onLoadObservable.addOnce(() => resolve());
                  }
                });

                textureCache[blockTypeId] = texture;
                console.log(`Texture loaded for ${blockTypeId}`);
                return { blockTypeId, texture };
              } catch (error) {
                console.warn(`Failed to load texture for ${blockTypeId}`, error);
                return { blockTypeId, texture: null };
              }
            });

            // Wait for all textures to load
            await Promise.all(texturePromises);
            console.log('All textures loaded');
          } catch (error) {
            console.error('Error loading textures:', error);
          }
        };

        // Create blocks for the structure
        const createBlocks = () => {
          try {
            console.log('Creating blocks for structure');

            // Create a map to track which blocks are visible
            const visibilityMap: Record<string, boolean> = {};

            // First pass: create all blocks and track their positions
            blueprint.blocks.forEach(block => {
              if (!block || !block.position) {
                console.warn('Invalid block in blueprint (missing position):', block);
                return;
              }
              const key = `${block.position.x},${block.position.y},${block.position.z}`;
              visibilityMap[key] = true;
            });

            // Second pass: determine which blocks are visible (have at least one face exposed)
            let visibleBlocksCount = 0;
            blueprint.blocks.forEach(block => {
              if (!block || !block.position) {
                return;
              }

              const { x, y, z } = block.position;
              const key = `${x},${y},${z}`;

              // Check if all six faces are covered by other blocks
              const topCovered = visibilityMap[`${x},${y+1},${z}`] === true;
              const bottomCovered = visibilityMap[`${x},${y-1},${z}`] === true;
              const leftCovered = visibilityMap[`${x-1},${y},${z}`] === true;
              const rightCovered = visibilityMap[`${x+1},${y},${z}`] === true;
              const frontCovered = visibilityMap[`${x},${y},${z-1}`] === true;
              const backCovered = visibilityMap[`${x},${y},${z+1}`] === true;

              // Only create blocks that have at least one face visible
              if (!(topCovered && bottomCovered && leftCovered && rightCovered && frontCovered && backCovered)) {
                visibleBlocksCount++;

                try {
                  // Create a cube for this block
                  const blockMesh = BABYLON.MeshBuilder.CreateBox(
                    `block_${key}`,
                    { size: 1 },
                    scene
                  );

                  // Position the block relative to the structure center
                  blockMesh.position = new BABYLON.Vector3(
                    x - centerX,
                    y,
                    z - centerZ
                  );

                  // Parent to the structure root
                  blockMesh.parent = structureRoot;

                  // Create material for the block
                  const blockMaterial = new BABYLON.StandardMaterial(`mat_${key}`, scene);

                  // Get a valid block type ID
                  const validBlockTypeId = getValidBlockTypeId(block.blockTypeId);

                  // Apply texture if available
                  if (textureCache[validBlockTypeId]) {
                    blockMaterial.diffuseTexture = textureCache[validBlockTypeId].clone();
                    blockMaterial.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST);
                  } else {
                    // Fallback color if texture not available
                    blockMaterial.diffuseColor = BABYLON.Color3.FromHexString('#FF00FF');
                    console.warn(`No texture found for ${validBlockTypeId} (original: ${block.blockTypeId})`);
                  }

                  blockMesh.material = blockMaterial;
                } catch (blockError) {
                  console.error(`Error creating block at ${key}:`, blockError);
                }
              }
            });

            console.log(`Created ${visibleBlocksCount} visible blocks out of ${blueprint.blocks.length} total blocks`);
          } catch (error) {
            console.error('Error creating blocks:', error);
          }
        };

        // Main rendering function
        const renderStructure = async () => {
          try {
            // First load all textures
            await loadTextures();

            // Then create all blocks
            createBlocks();

            // Calculate the actual bounds of the structure based on blocks
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

            blueprint.blocks.forEach(block => {
              if (!block || !block.position) return;

              minX = Math.min(minX, block.position.x);
              minY = Math.min(minY, block.position.y);
              minZ = Math.min(minZ, block.position.z);
              maxX = Math.max(maxX, block.position.x);
              maxY = Math.max(maxY, block.position.y);
              maxZ = Math.max(maxZ, block.position.z);
            });

            // Calculate the actual size of the structure
            const actualWidth = maxX - minX + 1;
            const actualHeight = maxY - minY + 1;
            const actualDepth = maxZ - minZ + 1;

            console.log(`Actual structure dimensions: ${actualWidth}x${actualHeight}x${actualDepth}`);

            // Use the actual size instead of the dimensions from the blueprint
            const structureSize = Math.max(actualWidth, actualHeight, actualDepth);

            // Adjust camera distance based on structure size
            camera.radius = structureSize * 2;

            // Adjust camera target to the center of the actual structure
            const centerX = (minX + maxX) / 2 - blueprint.dimensions.width / 2;
            const centerY = (minY + maxY) / 2;
            const centerZ = (minZ + maxZ) / 2 - blueprint.dimensions.depth / 2;
            camera.target = new BABYLON.Vector3(centerX, centerY, centerZ);

            // Adjust orthographic camera settings based on structure size
            const orthoSize = structureSize * 1.5; // Increased for better visibility
            camera.orthoLeft = -orthoSize;
            camera.orthoRight = orthoSize;
            camera.orthoTop = orthoSize;
            camera.orthoBottom = -orthoSize;

            // Render multiple frames to ensure textures are loaded
            let frames = 0;
            const maxFrames = 10;

            const renderLoop = () => {
              scene.render();
              frames++;

              if (frames < maxFrames) {
                requestAnimationFrame(renderLoop);
              } else {
                try {
                  // Capture the rendered image
                  const dataUrl = canvas.toDataURL('image/png');

                  // Cache the icon
                  localStorage.setItem(`blocky_structure_icon_${blueprint.id}`, dataUrl);

                  // Update the UI
                  setIcon(dataUrl);

                  console.log(`Successfully generated icon for ${blueprint.name} (${blueprint.id})`);
                } catch (captureError) {
                  console.error('Error capturing rendered image:', captureError);
                  createPlaceholderIcon();
                } finally {
                  // Clean up resources
                  engine.dispose();
                  scene.dispose();
                }
              }
            };

            // Start rendering
            renderLoop();
          } catch (error) {
            console.error('Error rendering structure:', error);
            createPlaceholderIcon();
          }
        };

        // Start the rendering process
        renderStructure();

      } catch (error) {
        console.error('Error generating isometric structure icon:', error);
        createPlaceholderIcon();
      }
    };

    // Create a simple placeholder icon if we can't generate a proper one
    const createPlaceholderIcon = () => {
      try {
        console.log(`Creating placeholder icon for ${blueprint.name} (${blueprint.id})`);

        // Create a canvas for the placeholder
        const canvas = document.createElement('canvas');
        canvas.width = ICON_WIDTH;
        canvas.height = ICON_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Could not get 2D context for placeholder canvas');
          return;
        }

        // Fill with a gray background
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, ICON_WIDTH, ICON_HEIGHT);

        // Draw a colored border based on difficulty
        let borderColor;
        switch (blueprint.difficulty) {
          case 'easy':
            borderColor = '#4CAF50'; // Green
            break;
          case 'medium':
            borderColor = '#FFC107'; // Amber
            break;
          case 'hard':
            borderColor = '#F44336'; // Red
            break;
          default:
            borderColor = '#2196F3'; // Blue
        }

        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, ICON_WIDTH - 10, ICON_HEIGHT - 10);

        // Draw a cube in the center
        ctx.fillStyle = '#666666';
        ctx.fillRect(ICON_WIDTH / 2 - 30, ICON_HEIGHT / 2 - 30, 60, 60);

        // Add some text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(blueprint.name, ICON_WIDTH / 2, ICON_HEIGHT - 20);

        // Convert to data URL and set as icon
        const dataUrl = canvas.toDataURL('image/png');
        localStorage.setItem(`blocky_structure_icon_${blueprint.id}`, dataUrl);
        setIcon(dataUrl);

        console.log(`Created placeholder icon for ${blueprint.name} (${blueprint.id})`);
      } catch (error) {
        console.error('Error creating placeholder icon:', error);
      }
    };

    // Check if we need to regenerate icons due to version change
    const checkVersionAndGenerateIcon = async () => {
      const cacheKey = `blocky_structure_icon_${blueprint.id}`;
      const versionKey = `blocky_structure_icon_version`;
      const currentVersion = "v15-placeholder-only"; // Updated version to use placeholder icons only
      const cachedVersion = localStorage.getItem(versionKey);

      // Check if version has changed
      if (cachedVersion !== currentVersion) {
        console.log("Structure icon version changed, regenerating all icons");
        // Clear all structure icons if version has changed
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('blocky_structure_icon_')) {
            localStorage.removeItem(key);
          }
        });
        localStorage.setItem(versionKey, currentVersion);
      }

      // Get cached placeholder icon if available
      const cachedIcon = localStorage.getItem(cacheKey);

      if (cachedIcon) {
        // Use cached icon if available
        console.log(`Using cached placeholder icon for ${blueprint.name} (${blueprint.id})`);
        setIcon(cachedIcon);
      } else {
        // Create a new placeholder icon
        console.log(`Creating new placeholder icon for ${blueprint.name} (${blueprint.id})`);
        createPlaceholderIcon();
      }
    };

    // Check version and generate icon
    checkVersionAndGenerateIcon();

  }, [blueprint.id, blueprint.name, blueprint.difficulty, blueprint.dimensions, blueprint.blocks]);

  // Get required blocks for the structure as JSX
  const getRequiredBlocksInfo = (): React.ReactNode => {
    // Calculate total required blocks from the blueprint definition
    const requiredCounts: Record<string, number> = {};
    blueprint.blocks.forEach(block => {
      // Use the valid block type ID
      const validBlockTypeId = getValidBlockTypeId(block.blockTypeId);
      requiredCounts[validBlockTypeId] = (requiredCounts[validBlockTypeId] || 0) + 1;
    });

    // Get current inventory
    const availableBlocks = blockAwardManager.getBlocks();

    // Format the required blocks information
    const blockEntries = Object.entries(requiredCounts).map(([blockTypeId, count]) => {
      const blockType = getBlockTypeById(blockTypeId);
      const available = availableBlocks[blockTypeId] || 0;
      const blockName = blockType?.name || blockTypeId;
      const isAvailable = available >= count;

      // Format: BlockName: 5/10 (have/need)
      return `${blockName}: ${available}/${count} ${isAvailable ? '✓' : '✗'}`;
    });

    return blockEntries.join('\n');
  };

  // Handle mouse events for tooltip
  const handleMouseOver = (e: React.MouseEvent) => {
    if (!iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();

    // Create tooltip content with structure info and required blocks
    const structureInfo = `${blueprint.name} (${blueprint.difficulty})`;
    const statusInfo = isAvailable ? 'Ready to Build!' : 'Need more blocks';

    // Check if this is a schematic blueprint with fromFile flag
    const schematicBlueprint = blueprint as SchematicBlueprint;
    const sourceInfo = schematicBlueprint.fromFile
      ? `Source: ${schematicBlueprint.originalFilename || 'NBT file'}`
      : '';

    const blocksInfo = getRequiredBlocksInfo();

    // Format the tooltip content
    const content = `${structureInfo}\n${statusInfo}${sourceInfo ? '\n' + sourceInfo : ''}\n\nRequired Blocks:\n${blocksInfo}`;

    setTooltip({
      visible: true,
      content,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();
    setTooltip(prev => ({
      ...prev,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    }));
  };

  const handleMouseOut = () => {
    setTooltip(prev => ({
      ...prev,
      visible: false
    }));
  };

  return (
    <>
      <div
        ref={iconRef}
        className={`structure-icon ${isAvailable ? 'available' : 'unavailable'} ${isSelected ? 'selected' : ''}`}
        onClick={onClick}
        onMouseOver={handleMouseOver}
        onMouseMove={handleMouseMove}
        onMouseOut={handleMouseOut}
      >
        {icon ? (
          <img
            src={icon}
            alt={blueprint.name}
            width={ICON_WIDTH}
            height={ICON_HEIGHT}
            className="structure-icon-image"
          />
        ) : (
          <div className="structure-icon-placeholder" />
        )}
        <div className="structure-icon-name">{blueprint.name}</div>
        <div className="structure-icon-difficulty">{blueprint.difficulty.charAt(0).toUpperCase()}</div>
      </div>
      <Tooltip
        content={tooltip.content}
        visible={tooltip.visible}
        position={tooltip.position}
      />
    </>
  );
};

export default StructureIcon;
