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
    let disposed = false;

    async function generateIcon() {
      // Check if we already have a cached icon
      const cacheKey = `blocky_structure_icon_${blueprint.id}`;
      const cachedIcon = localStorage.getItem(cacheKey);
      if (cachedIcon) {
        setIcon(cachedIcon);
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = ICON_SIZE;
        canvas.height = ICON_SIZE;
        const engine = new BABYLON.Engine(canvas, false, { preserveDrawingBuffer: true });

        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent background

        // Create a camera that will show the structure from an isometric angle
        const camera = new BABYLON.ArcRotateCamera(
          'cam',
          Math.PI / 4,
          Math.PI / 3,
          Math.max(blueprint.dimensions.width, blueprint.dimensions.height, blueprint.dimensions.depth) * 1.5,
          new BABYLON.Vector3(0, 0, 0),
          scene
        );

        // Use orthographic camera for consistent size
        camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        const aspectRatio = canvas.width / canvas.height;
        const size = Math.max(blueprint.dimensions.width, blueprint.dimensions.height, blueprint.dimensions.depth) * 1.2;
        camera.orthoLeft = -size * aspectRatio;
        camera.orthoRight = size * aspectRatio;
        camera.orthoTop = size;
        camera.orthoBottom = -size;
        camera.minZ = 0.1;
        camera.maxZ = 100;

        // Create a light to illuminate the structure
        const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0.5, 1, 0.5), scene);
        light.intensity = 0.8;

        // Add a directional light for better shadows and definition
        const dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-0.5, -0.5, -0.5), scene);
        dirLight.intensity = 0.5;

        // Create a parent node for the structure
        const structureNode = new BABYLON.TransformNode('structure', scene);

        // Calculate the center of the structure
        const centerX = blueprint.dimensions.width / 2;
        const centerY = blueprint.dimensions.height / 2;
        const centerZ = blueprint.dimensions.depth / 2;

        // Adjust the structure position to center it
        structureNode.position = new BABYLON.Vector3(-centerX, -centerY, -centerZ);

        // Create meshes for each block in the structure
        const blocksByType: Record<string, { position: BABYLON.Vector3 }[]> = {};

        // Group blocks by type for more efficient creation
        blueprint.blocks.forEach(block => {
          const blockTypeId = block.blockTypeId;
          if (!blocksByType[blockTypeId]) {
            blocksByType[blockTypeId] = [];
          }
          blocksByType[blockTypeId].push({
            position: new BABYLON.Vector3(block.position.x, block.position.y, block.position.z)
          });
        });

        // Import block types from the game
        const { getBlockTypeById } = await import('../game/blockTypes');

        // Create meshes for each block type
        for (const [blockTypeId, blocks] of Object.entries(blocksByType)) {
          // Get the block type from the game's block types
          const blockType = getBlockTypeById(blockTypeId);

          // Create a material for this block type
          const material = new BABYLON.StandardMaterial(`${blockTypeId}_material`, scene);

          // Apply texture if available from blockType
          if (blockType && blockType.texture) {
            material.diffuseTexture = new BABYLON.Texture(blockType.texture, scene);
            material.diffuseTexture.hasAlpha = true;
            material.useAlphaFromDiffuseTexture = false;
            material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
          } else {
            // Fallback colors if no texture or blockType not found
            switch (blockTypeId) {
              case 'dirt':
                material.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.1);
                break;
              case 'stone':
                material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
                break;
              case 'planks_spruce':
                material.diffuseColor = new BABYLON.Color3(0.4, 0.3, 0.2);
                break;
              case 'log_spruce':
                material.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
                break;
              default:
                material.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
            }
          }

          // Create meshes for each block of this type
          blocks.forEach(block => {
            const mesh = BABYLON.MeshBuilder.CreateBox(
              `structure_${blockTypeId}`,
              { size: 1 },
              scene
            );

            mesh.position = block.position;
            mesh.material = material;
            mesh.parent = structureNode;
          });
        }

        // Adjust camera target to center of structure
        camera.target = new BABYLON.Vector3(0, 0, 0);

        // Render multiple frames to ensure textures are loaded
        const finishRender = () => {
          let frames = 0;
          const maxFrames = 5;

          function renderLoop() {
            scene.render();
            frames++;

            if (frames < maxFrames) {
              requestAnimationFrame(renderLoop);
            } else {
              try {
                const dataUrl = canvas.toDataURL('image/png');
                localStorage.setItem(cacheKey, dataUrl);

                if (!disposed) {
                  setIcon(dataUrl);
                }

                // Clean up
                scene.dispose();
                engine.dispose();
              } catch (err) {
                console.error('Error generating structure icon:', err);
                scene.dispose();
                engine.dispose();
              }
            }
          }

          renderLoop();
        };

        // Check if any textures need to be loaded
        const textures = scene.textures;
        if (textures.length > 0) {
          // Wait for textures to load
          let allTexturesReady = true;
          for (const texture of textures) {
            if (texture instanceof BABYLON.Texture && !texture.isReady()) {
              allTexturesReady = false;
              break;
            }
          }

          if (allTexturesReady) {
            finishRender();
          } else {
            // Poll for texture readiness
            let waited = 0;
            const poll = () => {
              let allReady = true;
              for (const texture of textures) {
                if (texture instanceof BABYLON.Texture && !texture.isReady()) {
                  allReady = false;
                  break;
                }
              }

              if (allReady) {
                finishRender();
              } else if (waited > 2000) {
                // Timeout after 2 seconds
                finishRender();
              } else {
                waited += 50;
                setTimeout(poll, 50);
              }
            };
            poll();
          }
        } else {
          // No textures to wait for
          finishRender();
        }
      } catch (error) {
        console.error('Error generating structure icon:', error);
      }
    }

    generateIcon();

    return () => { disposed = true; };
  }, [blueprint.id, blueprint.dimensions]);

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
