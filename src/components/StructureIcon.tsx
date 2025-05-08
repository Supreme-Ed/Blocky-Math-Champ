// src/components/StructureIcon.tsx
// Component for rendering structure icons in the structure panel using Babylon.js 3D rendering

import React, { useEffect, useState, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { StructureBlueprint } from '../game/structureBlueprints';
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
          // Get unique block types
          const uniqueBlockTypes = new Set<string>();
          blueprint.blocks.forEach(block => uniqueBlockTypes.add(block.blockTypeId));

          // Load all textures in parallel
          const texturePromises = Array.from(uniqueBlockTypes).map(async (blockTypeId) => {
            try {
              const texturePath = `/textures/block_textures/${blockTypeId}.png`;
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
              return { blockTypeId, texture };
            } catch (error) {
              console.warn(`Failed to load texture for ${blockTypeId}`, error);
              return { blockTypeId, texture: null };
            }
          });

          // Wait for all textures to load
          await Promise.all(texturePromises);
        };

        // Create blocks for the structure
        const createBlocks = () => {
          // Create a map to track which blocks are visible
          const visibilityMap: Record<string, boolean> = {};

          // First pass: create all blocks and track their positions
          blueprint.blocks.forEach(block => {
            const key = `${block.position.x},${block.position.y},${block.position.z}`;
            visibilityMap[key] = true;
          });

          // Second pass: determine which blocks are visible (have at least one face exposed)
          blueprint.blocks.forEach(block => {
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

              // Apply texture if available
              if (textureCache[block.blockTypeId]) {
                blockMaterial.diffuseTexture = textureCache[block.blockTypeId].clone();
                blockMaterial.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_NEAREST_MIPNEAREST);
              } else {
                // Fallback color if texture not available
                blockMaterial.diffuseColor = BABYLON.Color3.FromHexString('#FF00FF');
              }

              blockMesh.material = blockMaterial;
            }
          });
        };

        // Main rendering function
        const renderStructure = async () => {
          try {
            // First load all textures
            await loadTextures();

            // Then create all blocks
            createBlocks();

            // Adjust camera to frame the structure
            const structureSize = Math.max(
              blueprint.dimensions.width,
              blueprint.dimensions.height,
              blueprint.dimensions.depth
            );

            // Adjust camera distance based on structure size
            camera.radius = structureSize * 2;

            // Adjust orthographic camera settings based on structure size
            const orthoSize = structureSize * 1.2;
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
                // Capture the rendered image
                const dataUrl = canvas.toDataURL('image/png');

                // Cache the icon
                localStorage.setItem(`blocky_structure_icon_${blueprint.id}`, dataUrl);

                // Update the UI
                setIcon(dataUrl);

                // Clean up resources
                engine.dispose();
                scene.dispose();
              }
            };

            // Start rendering
            renderLoop();
          } catch (error) {
            console.error('Error rendering structure:', error);
          }
        };

        // Start the rendering process
        renderStructure();

      } catch (error) {
        console.error('Error generating isometric structure icon:', error);
      }
    };

    // Check if we need to regenerate icons due to version change
    const checkVersionAndGenerateIcon = async () => {
      const cacheKey = `blocky_structure_icon_${blueprint.id}`;
      const versionKey = `blocky_structure_icon_version`;
      const currentVersion = "v6-babylon-3d"; // Using Babylon.js 3D rendering like inventory icons
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

      // Check if we have a cached icon for this structure
      const cachedIcon = localStorage.getItem(cacheKey);

      if (cachedIcon) {
        // Use cached icon if available
        setIcon(cachedIcon);
      } else {
        // Generate a new icon using Babylon.js 3D rendering
        generateIsometricIcon();
      }
    };

    // Check version and generate icon
    checkVersionAndGenerateIcon();

  }, [blueprint.id, blueprint.name, blueprint.difficulty, blueprint.dimensions, blueprint.blocks]);

  // Handle mouse events for tooltip
  const handleMouseOver = (e: React.MouseEvent) => {
    if (!iconRef.current) return;

    const rect = iconRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      content: `${blueprint.name} (${blueprint.difficulty})${isAvailable ? ' - Ready to Build!' : ' - Need more blocks'}`,
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
