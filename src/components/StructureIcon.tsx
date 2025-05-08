// src/components/StructureIcon.tsx
// Component for rendering structure icons in the structure panel

import React, { useEffect, useState, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';
import { StructureBlueprint } from '../game/structureBlueprints';
import Tooltip from './Tooltip';
import './StructureIcon.css';

const ICON_SIZE = 64; // px

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
    // Create a simple colored icon based on the structure type
    // This is a simpler approach that doesn't rely on Babylon.js rendering
    const generateSimpleIcon = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = ICON_SIZE;
        canvas.height = ICON_SIZE;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          console.error('Could not get 2D context for canvas');
          return;
        }

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, ICON_SIZE, ICON_SIZE);

        // Draw a background
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, ICON_SIZE, ICON_SIZE);

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
        ctx.strokeRect(2, 2, ICON_SIZE - 4, ICON_SIZE - 4);

        // Draw a simple representation of the structure
        const blockSize = Math.min(8, Math.floor(ICON_SIZE / Math.max(blueprint.dimensions.width, blueprint.dimensions.depth)));
        const offsetX = (ICON_SIZE - blueprint.dimensions.width * blockSize) / 2;
        const offsetY = (ICON_SIZE - blueprint.dimensions.height * blockSize) / 2;

        // Count blocks by type
        const blockCounts: Record<string, number> = {};
        blueprint.blocks.forEach(block => {
          blockCounts[block.blockTypeId] = (blockCounts[block.blockTypeId] || 0) + 1;
        });

        // Find the most common block type
        let mostCommonType = '';
        let maxCount = 0;
        for (const [type, count] of Object.entries(blockCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostCommonType = type;
          }
        }

        // Set color based on most common block type
        let mainColor;
        switch (mostCommonType) {
          case 'dirt':
            mainColor = '#8B4513'; // Brown
            break;
          case 'stone':
            mainColor = '#808080'; // Gray
            break;
          case 'planks_spruce':
            mainColor = '#8B5A2B'; // Saddle Brown
            break;
          case 'log_spruce':
            mainColor = '#654321'; // Dark Brown
            break;
          case 'sand':
            mainColor = '#F4A460'; // Sandy Brown
            break;
          default:
            mainColor = '#A0A0A0'; // Light Gray
        }

        // Draw a simple 2D representation of the structure (top-down view)
        ctx.fillStyle = mainColor;

        // Create a top-down view (x-z plane)
        const topView: Record<string, boolean> = {};
        blueprint.blocks.forEach(block => {
          const key = `${block.position.x},${block.position.z}`;
          topView[key] = true;
        });

        // Draw the top view
        for (let x = 0; x < blueprint.dimensions.width; x++) {
          for (let z = 0; z < blueprint.dimensions.depth; z++) {
            if (topView[`${x},${z}`]) {
              ctx.fillRect(
                offsetX + x * blockSize,
                offsetY + z * blockSize,
                blockSize,
                blockSize
              );
            }
          }
        }

        // Add a small shadow effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        for (let x = 0; x < blueprint.dimensions.width; x++) {
          for (let z = 0; z < blueprint.dimensions.depth; z++) {
            if (topView[`${x},${z}`]) {
              ctx.fillRect(
                offsetX + x * blockSize + 2,
                offsetY + z * blockSize + 2,
                blockSize,
                blockSize
              );
            }
          }
        }

        // Add the first letter of the structure name
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          blueprint.name.charAt(0).toUpperCase(),
          ICON_SIZE / 2,
          ICON_SIZE / 2
        );

        // Get the data URL and set it as the icon
        const dataUrl = canvas.toDataURL('image/png');
        localStorage.setItem(`blocky_structure_icon_${blueprint.id}`, dataUrl);
        setIcon(dataUrl);

      } catch (error) {
        console.error('Error generating simple structure icon:', error);
      }
    };

    // Check if we already have a cached icon
    const cacheKey = `blocky_structure_icon_${blueprint.id}`;
    const cachedIcon = localStorage.getItem(cacheKey);

    if (cachedIcon) {
      setIcon(cachedIcon);
    } else {
      // Generate a new icon
      generateSimpleIcon();
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
            width={ICON_SIZE}
            height={ICON_SIZE}
            className="structure-icon-image"
          />
        ) : (
          <div className="structure-icon-placeholder" />
        )}
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
