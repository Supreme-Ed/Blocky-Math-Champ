// src/components/StructureIcon.tsx
// Component for rendering structure icons in the structure panel

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

  // Generate icon for the structure
  useEffect(() => {
    // Create a detailed isometric view of the structure
    const generateIsometricIcon = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = ICON_WIDTH;
        canvas.height = ICON_HEIGHT;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Could not get 2D context for canvas');
          return;
        }

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, ICON_WIDTH, ICON_HEIGHT);

        // Draw a background
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

        // Draw border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, ICON_WIDTH - 4, ICON_HEIGHT - 4);

        // Calculate block size to fit the structure in the icon
        // We want to make sure the entire structure is visible
        const maxDimension = Math.max(
          blueprint.dimensions.width,
          blueprint.dimensions.height,
          blueprint.dimensions.depth
        );

        // Calculate block size based on available space and structure dimensions
        // Use a smaller size for larger structures
        const blockSize = Math.min(
          20, // Maximum block size
          Math.floor((ICON_WIDTH - 40) / (blueprint.dimensions.width + blueprint.dimensions.depth)),
          Math.floor((ICON_HEIGHT - 40) / (blueprint.dimensions.height + blueprint.dimensions.depth / 2))
        );

        // Isometric projection constants
        const isoX = 0.7; // X-axis projection factor
        const isoY = 0.4; // Y-axis projection factor

        // Calculate center position to place the structure
        const centerX = ICON_WIDTH / 2;
        const centerY = ICON_HEIGHT / 2;

        // Calculate offset to center the structure
        const offsetX = centerX - ((blueprint.dimensions.width + blueprint.dimensions.depth) * blockSize * isoX) / 2;
        const offsetY = centerY - ((blueprint.dimensions.height + (blueprint.dimensions.width + blueprint.dimensions.depth) * isoY) * blockSize) / 2;

        // Create a 3D grid to track which blocks are visible
        const grid: Record<string, {
          blockTypeId: string;
          x: number;
          y: number;
          z: number;
          visible: boolean;
        }> = {};

        // Fill the grid with blocks from the blueprint
        blueprint.blocks.forEach(block => {
          const key = `${block.position.x},${block.position.y},${block.position.z}`;
          grid[key] = {
            blockTypeId: block.blockTypeId,
            x: block.position.x,
            y: block.position.y,
            z: block.position.z,
            visible: true
          };
        });

        // Determine which blocks are visible (not completely obscured by other blocks)
        // A block is visible if at least one of its faces is exposed
        Object.keys(grid).forEach(key => {
          const block = grid[key];
          const { x, y, z } = block;

          // Check if all six faces are covered by other blocks
          const topCovered = grid[`${x},${y+1},${z}`] !== undefined;
          const bottomCovered = grid[`${x},${y-1},${z}`] !== undefined;
          const frontCovered = grid[`${x},${y},${z+1}`] !== undefined;
          const backCovered = grid[`${x},${y},${z-1}`] !== undefined;
          const leftCovered = grid[`${x-1},${y},${z}`] !== undefined;
          const rightCovered = grid[`${x+1},${y},${z}`] !== undefined;

          // If all faces are covered, the block is not visible
          if (topCovered && bottomCovered && frontCovered && backCovered && leftCovered && rightCovered) {
            block.visible = false;
          }
        });

        // Define block colors based on block type
        const blockColors: Record<string, { top: string, left: string, right: string }> = {
          'dirt': {
            top: '#8B4513',
            left: '#6B3811',
            right: '#7B3F12'
          },
          'stone': {
            top: '#808080',
            left: '#606060',
            right: '#707070'
          },
          'planks_spruce': {
            top: '#8B5A2B',
            left: '#6B4A1B',
            right: '#7B521F'
          },
          'log_spruce': {
            top: '#654321',
            left: '#453111',
            right: '#553919'
          },
          'sand': {
            top: '#F4A460',
            left: '#D48440',
            right: '#E49450'
          }
        };

        // Default color for unknown block types
        const defaultColor = {
          top: '#A0A0A0',
          left: '#808080',
          right: '#909090'
        };

        // Draw blocks in isometric view
        // We need to draw from back to front, top to bottom
        // Sort blocks by z, y, x for correct drawing order
        const sortedBlocks = Object.values(grid)
          .filter(block => block.visible)
          .sort((a, b) => {
            // Sort by z (depth) first (descending)
            if (a.z !== b.z) return b.z - a.z;
            // Then by y (height) (descending)
            if (a.y !== b.y) return b.y - a.y;
            // Finally by x (width) (ascending)
            return a.x - b.x;
          });

        // Draw each visible block
        sortedBlocks.forEach(block => {
          const { blockTypeId, x, y, z } = block;

          // Get block color (or use default if not defined)
          const color = blockColors[blockTypeId] || defaultColor;

          // Calculate isometric position
          const isoPos = {
            x: offsetX + (x - z) * blockSize * isoX,
            y: offsetY + (blueprint.dimensions.height - y - 1) * blockSize + (x + z) * blockSize * isoY
          };

          // Draw top face (if visible)
          if (!grid[`${x},${y+1},${z}`]) {
            ctx.fillStyle = color.top;
            ctx.beginPath();
            ctx.moveTo(isoPos.x, isoPos.y);
            ctx.lineTo(isoPos.x + blockSize * isoX, isoPos.y - blockSize * isoY);
            ctx.lineTo(isoPos.x, isoPos.y - blockSize * isoY * 2);
            ctx.lineTo(isoPos.x - blockSize * isoX, isoPos.y - blockSize * isoY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          // Draw left face (if visible)
          if (!grid[`${x-1},${y},${z}`]) {
            ctx.fillStyle = color.left;
            ctx.beginPath();
            ctx.moveTo(isoPos.x - blockSize * isoX, isoPos.y - blockSize * isoY);
            ctx.lineTo(isoPos.x, isoPos.y - blockSize * isoY * 2);
            ctx.lineTo(isoPos.x, isoPos.y - blockSize * isoY * 2 + blockSize);
            ctx.lineTo(isoPos.x - blockSize * isoX, isoPos.y - blockSize * isoY + blockSize);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          // Draw right face (if visible)
          if (!grid[`${x},${y},${z-1}`]) {
            ctx.fillStyle = color.right;
            ctx.beginPath();
            ctx.moveTo(isoPos.x, isoPos.y);
            ctx.lineTo(isoPos.x + blockSize * isoX, isoPos.y - blockSize * isoY);
            ctx.lineTo(isoPos.x + blockSize * isoX, isoPos.y - blockSize * isoY + blockSize);
            ctx.lineTo(isoPos.x, isoPos.y + blockSize);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });

        // Get the data URL and set it as the icon
        const dataUrl = canvas.toDataURL('image/png');
        localStorage.setItem(`blocky_structure_icon_${blueprint.id}`, dataUrl);
        setIcon(dataUrl);

      } catch (error) {
        console.error('Error generating isometric structure icon:', error);
      }
    };

    // Check if we already have a cached icon
    const cacheKey = `blocky_structure_icon_${blueprint.id}`;
    const cachedIcon = localStorage.getItem(cacheKey);

    if (cachedIcon) {
      setIcon(cachedIcon);
    } else {
      // Generate a new icon
      generateIsometricIcon();
    }

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
