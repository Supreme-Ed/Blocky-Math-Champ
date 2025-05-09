// src/components/scene/BuiltStructures.tsx
// Component to manage built structures in the scene

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import type { FC } from 'react';
import * as BABYLON from '@babylonjs/core';
import { getBlockTypeById } from '../../game/blockTypes';
import builtStructuresManager from '../../game/builtStructuresManager';
import { getBlueprintById } from '../../game/structureBlueprints';
import type { BlueprintBlock as StructureBlueprintBlock } from '../../game/structureBlueprints';
import structureBuilder from '../../game/structureBuilder';

interface BuiltStructure {
  id: string;
  blueprintId: string;
  name: string;
  difficulty: string;
  position: BABYLON.Vector3;
  node: BABYLON.TransformNode | null;
  createdAt: number;
}

interface BuiltStructuresProps {
  scene: BABYLON.Scene;
}

/**
 * Grid cell for structure placement
 */
interface GridCell {
  x: number;
  z: number;
  occupied: boolean;
  structureId?: string;
}

/**
 * Blueprint block definition
 */
interface BlueprintBlock {
  blockTypeId: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface StructureBuiltEventDetail {
  blueprintId: string;
  name: string;
  difficulty: string;
  blocks?: BlueprintBlock[];
  position?: { x: number; y: number; z: number }; // Position from structureBuilder
}

/**
 * Component that manages built structures in the scene
 * - Listens for structureBuilt events
 * - Positions structures in a grid to prevent overlap (for normal gameplay)
 * - Uses specified position for debug spawns
 * - Adds visual effects for structure placement
 *
 * @param props - Component props
 * @returns React component
 */
const BuiltStructures: FC<BuiltStructuresProps> = ({ scene }) => {
  const [structures, setStructures] = useState<BuiltStructure[]>([]);
  const gridRef = useRef<GridCell[]>([]);

  // Configuration for the structure placement grid
  const gridConfig = useMemo(() => ({
    startX: -50, // Starting X position for the grid
    startZ: -50, // Starting Z position for the grid
    cellSize: 10, // Size of each grid cell
    gridWidth: 10, // Number of cells in the X direction
    gridDepth: 10, // Number of cells in the Z direction
  }), []);

  /**
   * Create a block mesh with the proper texture
   * @param blockTypeId - The type of block to create
   * @param position - The position of the block
   * @param parent - The parent node
   * @returns The created mesh
   */
  const createBlockMesh = useCallback(
    (
      blockTypeId: string,
      position: { x: number; y: number; z: number },
      parent: BABYLON.TransformNode
    ): BABYLON.Mesh | null => {
      if (!scene) return null;

      const blockType = getBlockTypeById(blockTypeId);
      if (!blockType) {
        console.warn(`[BuiltStructures] createBlockMesh: Block type not found for ID: ${blockTypeId}`);
        return null;
      }

      // Create a box mesh for the block
      const mesh = BABYLON.MeshBuilder.CreateBox(
        `structure_${blockTypeId}_${position.x}_${position.y}_${position.z}_${Date.now()}`,
        { size: 1 },
        scene
      );

      // Position the mesh according to the blueprint
      mesh.position = new BABYLON.Vector3(position.x, position.y, position.z);

      // Create material for the block
      const material = new BABYLON.StandardMaterial(
        `structure_material_${blockTypeId}_${Date.now()}_${Math.random()}`,
        scene
      );

      // Apply texture if available
      if (blockType.texture) {
        material.diffuseTexture = new BABYLON.Texture(blockType.texture, scene);

        // Force the texture to use nearest neighbor filtering for pixelated look
        if (material.diffuseTexture) {
          material.diffuseTexture.updateSamplingMode(BABYLON.Texture.NEAREST_SAMPLINGMODE);
        }
      }

      // Apply color if available
      if (blockType.color) {
        material.diffuseColor = BABYLON.Color3.FromHexString(blockType.color);
      }

      // Ensure material is fully opaque
      material.alpha = 1.0;
      material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
      material.useAlphaFromDiffuseTexture = false;

      // Apply material to mesh
      mesh.material = material;

      // Make the mesh pickable for interaction
      mesh.isPickable = true;

      // Add to parent
      mesh.parent = parent;

      return mesh;
    },
    [scene]
  );

  // Initialize the grid
  useEffect(() => {
    const grid: GridCell[] = [];

    for (let x = 0; x < gridConfig.gridWidth; x++) {
      for (let z = 0; z < gridConfig.gridDepth; z++) {
        grid.push({
          x,
          z,
          occupied: false
        });
      }
    }

    gridRef.current = grid;


  }, [gridConfig.gridWidth, gridConfig.gridDepth, gridConfig.startX, gridConfig.startZ, gridConfig.cellSize]);

  // Load saved structures from localStorage
  useEffect(() => {
    if (!scene) return;

    // Get saved structures from builtStructuresManager
    const savedStructures = builtStructuresManager.getStructures();

    if (savedStructures.length === 0) {
      return;
    }

    // Convert saved structures to BuiltStructure objects and create them in the scene
    const loadedStructures: BuiltStructure[] = [];

    // Track used positions to avoid overlapping structures
    const usedPositions: Set<string> = new Set();

    // Sort structures by creation date (oldest first) to ensure consistent loading
    const sortedStructures = [...savedStructures].sort((a, b) => a.createdAt - b.createdAt);

    sortedStructures.forEach(savedStructure => {
      // Check if this position is already used
      const posKey = `${savedStructure.position.x},${savedStructure.position.y},${savedStructure.position.z}`;

      if (usedPositions.has(posKey)) {
        // Find a new position in the grid
        const availableCell = gridRef.current.find(cell => !cell.occupied);

        if (!availableCell) {
          return;
        }

        // Calculate world position from grid cell
        const worldX = gridConfig.startX + (availableCell.x * gridConfig.cellSize);
        const worldZ = gridConfig.startZ + (availableCell.z * gridConfig.cellSize);

        // Update the position
        savedStructure.position.x = worldX;
        savedStructure.position.y = 0;
        savedStructure.position.z = worldZ;
      }

      // Mark this position as used
      usedPositions.add(posKey);

      // Create a new parent node for the structure
      const structureNode = new BABYLON.TransformNode(
        `grid_structure_${savedStructure.blueprintId}_${savedStructure.createdAt}`,
        scene
      );

      // Set position from saved data
      structureNode.position = new BABYLON.Vector3(
        savedStructure.position.x,
        savedStructure.position.y,
        savedStructure.position.z
      );

      // Get the blueprint for this structure
      const blueprint = getBlueprintById(savedStructure.blueprintId);

      if (blueprint) {
        // Create blocks based on the blueprint
        blueprint.blocks.forEach(block => {
          // Create a block mesh for each block in the blueprint
          createBlockMesh(
            block.blockTypeId,
            block.position,
            structureNode
          );
        });
      } else {

        // Create a fallback placeholder if blueprint not found
        const placeholderMesh = BABYLON.MeshBuilder.CreateBox(
          `placeholder_${savedStructure.id}`,
          { size: 1 },
          scene
        );

        // Create a material for the placeholder
        const material = new BABYLON.StandardMaterial(
          `placeholder_material_${savedStructure.id}`,
          scene
        );

        // Set material properties based on difficulty
        switch (savedStructure.difficulty) {
          case 'easy':
            material.diffuseColor = BABYLON.Color3.FromHexString('#4CAF50'); // Green
            break;
          case 'medium':
            material.diffuseColor = BABYLON.Color3.FromHexString('#2196F3'); // Blue
            break;
          case 'hard':
            material.diffuseColor = BABYLON.Color3.FromHexString('#F44336'); // Red
            break;
          default:
            material.diffuseColor = BABYLON.Color3.FromHexString('#9C27B0'); // Purple
        }

        // Apply material to mesh
        placeholderMesh.material = material;

        // Make the mesh pickable for interaction
        placeholderMesh.isPickable = true;

        // Add to parent
        placeholderMesh.parent = structureNode;
      }

      // Create BuiltStructure object
      const builtStructure: BuiltStructure = {
        id: savedStructure.id,
        blueprintId: savedStructure.blueprintId,
        name: savedStructure.name,
        difficulty: savedStructure.difficulty,
        position: structureNode.position,
        node: structureNode,
        createdAt: savedStructure.createdAt
      };

      loadedStructures.push(builtStructure);

      // Mark grid cell as occupied if the structure is in the grid
      const cellX = Math.floor((structureNode.position.x - gridConfig.startX) / gridConfig.cellSize);
      const cellZ = Math.floor((structureNode.position.z - gridConfig.startZ) / gridConfig.cellSize);

      // Check if the cell is within grid bounds
      if (cellX >= 0 && cellX < gridConfig.gridWidth && cellZ >= 0 && cellZ < gridConfig.gridDepth) {
        const cellIndex = gridRef.current.findIndex(c => c.x === cellX && c.z === cellZ);

        if (cellIndex !== -1) {
          const updatedGrid = [...gridRef.current];
          updatedGrid[cellIndex].occupied = true;
          updatedGrid[cellIndex].structureId = builtStructure.id;
          gridRef.current = updatedGrid;
        }
      }
    });

    // Update state with loaded structures
    setStructures(loadedStructures);

  }, [scene, gridConfig, createBlockMesh]);

  // Listen for structureBuilt events
  useEffect(() => {
    if (!scene) return;

    /**
     * Find the next available position in the grid
     * @returns Position for the next structure, or null if grid is full
     */
    const findNextAvailableGridPosition = (): BABYLON.Vector3 | null => {
      // Find the first unoccupied cell
      const availableCell = gridRef.current.find(cell => !cell.occupied);

      if (!availableCell) {
        return null;
      }

      // Mark the cell as occupied immediately to prevent race conditions
      // This is important when multiple structures are built in quick succession
      const cellIndex = gridRef.current.findIndex(c => c.x === availableCell.x && c.z === availableCell.z);
      if (cellIndex !== -1) {
        const updatedGrid = [...gridRef.current];
        updatedGrid[cellIndex].occupied = true;
        updatedGrid[cellIndex].structureId = 'pending'; // Will be updated with actual ID later
        gridRef.current = updatedGrid;
      }

      // Calculate world position from grid cell
      const worldX = gridConfig.startX + (availableCell.x * gridConfig.cellSize);
      const worldZ = gridConfig.startZ + (availableCell.z * gridConfig.cellSize);

      return new BABYLON.Vector3(worldX, 0, worldZ);
    };

    /**
     * Handle structure deletion
     * @param event - Custom event with structure ID
     */
    const handleStructureDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ id: string }>;
      const { id } = customEvent.detail;

      // Find the structure in our state
      const structureToDelete = structures.find(structure => structure.id === id);

      if (structureToDelete) {
        // Dispose of the node if it exists
        if (structureToDelete.node && !structureToDelete.node.isDisposed()) {
          structureToDelete.node.dispose(false, true);
        }

        // Update state
        setStructures(prev => prev.filter(structure => structure.id !== id));

        // Free up the grid cell
        const cellX = Math.floor((structureToDelete.position.x - gridConfig.startX) / gridConfig.cellSize);
        const cellZ = Math.floor((structureToDelete.position.z - gridConfig.startZ) / gridConfig.cellSize);

        // Check if the cell is within grid bounds
        if (cellX >= 0 && cellX < gridConfig.gridWidth && cellZ >= 0 && cellZ < gridConfig.gridDepth) {
          const cellIndex = gridRef.current.findIndex(c => c.x === cellX && c.z === cellZ);

          if (cellIndex !== -1) {
            const updatedGrid = [...gridRef.current];
            updatedGrid[cellIndex].occupied = false;
            updatedGrid[cellIndex].structureId = undefined;
            gridRef.current = updatedGrid;
          }
        }
      }
    };

    /**
     * Handle deletion of all structures
     */
    const handleAllStructuresDeleted = () => {
      // Dispose of all structure nodes
      structures.forEach(structure => {
        if (structure.node && !structure.node.isDisposed()) {
          structure.node.dispose(false, true);
        }
      });

      // Clear state
      setStructures([]);

      // Reset grid
      const updatedGrid = [...gridRef.current];
      updatedGrid.forEach(cell => {
        cell.occupied = false;
        cell.structureId = undefined;
      });
      gridRef.current = updatedGrid;
    };

    /**
     * Add visual effects when a structure is placed
     * @param node - The structure's transform node
     */
    const addPlacementEffects = (node: BABYLON.TransformNode): void => {
      if (!scene) return;

      // 1. Scale animation
      node.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);

      const scaleAnimation = new BABYLON.Animation(
        'scaleAnimation',
        'scaling',
        30,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      const scaleKeys = [
        { frame: 0, value: new BABYLON.Vector3(0.1, 0.1, 0.1) },
        { frame: 30, value: new BABYLON.Vector3(1, 1, 1) }
      ];

      scaleAnimation.setKeys(scaleKeys);

      // 2. Particle effect
      const particleSystem = new BABYLON.ParticleSystem('structurePlacementParticles', 200, scene);
      particleSystem.particleTexture = new BABYLON.Texture('textures/particle.png', scene);

      // Set particle system properties
      particleSystem.emitter = node.position;
      particleSystem.minEmitBox = new BABYLON.Vector3(-2, 0, -2);
      particleSystem.maxEmitBox = new BABYLON.Vector3(2, 5, 2);

      particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
      particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);

      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.5;

      particleSystem.minLifeTime = 0.5;
      particleSystem.maxLifeTime = 2.0;

      particleSystem.emitRate = 100;

      particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

      particleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);

      particleSystem.direction1 = new BABYLON.Vector3(-1, 8, -1);
      particleSystem.direction2 = new BABYLON.Vector3(1, 8, 1);

      particleSystem.minAngularSpeed = 0;
      particleSystem.maxAngularSpeed = Math.PI;

      particleSystem.minEmitPower = 1;
      particleSystem.maxEmitPower = 3;

      // Start the particle system
      particleSystem.start();

      // Stop after 2 seconds
      setTimeout(() => {
        particleSystem.stop();

        // Dispose after all particles are gone
        setTimeout(() => {
          particleSystem.dispose();
        }, 2000);
      }, 2000);

      // Start the animation
      scene.beginAnimation(node, 0, 30, false, 1, () => {
        if (!node.isDisposed()) {
          node.scaling = new BABYLON.Vector3(1, 1, 1); // Ensure final scale
          // console.log(`[BuiltStructures] Animation completed, final scale set to: ${node.scaling.toString()}`);
        }
      });
    };

    const handleStructureBuilt = (event: Event) => {
      const customEvent = event as CustomEvent<StructureBuiltEventDetail>;
      const { blueprintId, name, difficulty, position: eventPosition } = customEvent.detail;

      let finalPlacementPosition: BABYLON.Vector3 | null;

      if (eventPosition) {
        // If a position is provided in the event (e.g., from debug panel), use it
        // console.log('[BuiltStructures] Using position from event detail:', eventPosition);
        finalPlacementPosition = new BABYLON.Vector3(eventPosition.x, eventPosition.y, eventPosition.z);
      } else {
        // Otherwise, find the next available position in our grid
        // console.log('[BuiltStructures] No position in event detail, finding next grid position.');
        finalPlacementPosition = findNextAvailableGridPosition();
      }

      if (!finalPlacementPosition) {
        console.warn('Could not place structure - no available position found (grid full or event position missing).');
        return;
      }

      // Create a new parent node for the structure at the determined position
      const structureNode = new BABYLON.TransformNode(`grid_structure_${blueprintId}_${Date.now()}`, scene);
      structureNode.position = finalPlacementPosition;

      // Find the structure node in the scene that was created by structureBuilder.ts
      console.log(`Looking for structure node with prefix: built_structure_${blueprintId}_`);

      // Log all transform nodes for debugging
      console.log('All transform nodes in scene:');
      scene.transformNodes.forEach(node => {
        console.log(`- ${node.name} (enabled: ${node.isEnabled()})`);
      });

      // Try to find the node with the exact blueprint ID first
      let nodeNamePrefix = `built_structure_${blueprintId}_`;
      let recentStructureNodes = scene.transformNodes.filter(node =>
        node.name.startsWith(nodeNamePrefix) &&
        parseInt(node.name.substring(nodeNamePrefix.length)) > Date.now() - 5000 && // Increased window to 5s
        node.isEnabled()
      );

      // If not found, try with _mcbuild_org_ suffix
      if (recentStructureNodes.length === 0 && !blueprintId.includes('_mcbuild_org_')) {
        const schematicId = `${blueprintId}_mcbuild_org_`;
        console.log(`No nodes found, trying with schematic ID: ${schematicId}`);
        nodeNamePrefix = `built_structure_${schematicId}_`;
        recentStructureNodes = scene.transformNodes.filter(node =>
          node.name.startsWith(nodeNamePrefix) &&
          parseInt(node.name.substring(nodeNamePrefix.length)) > Date.now() - 5000 && // Increased window to 5s
          node.isEnabled()
        );
      }

      console.log(`Found ${recentStructureNodes.length} matching structure nodes`);
      recentStructureNodes.forEach(node => console.log(`- ${node.name}`));

      const originalStructureNode = recentStructureNodes.sort((a, b) => {
        const timeA = parseInt(a.name.substring(nodeNamePrefix.length));
        const timeB = parseInt(b.name.substring(nodeNamePrefix.length));
        return timeB - timeA; // Sort descending by timestamp, newest first
      })[0] || null;

      if (originalStructureNode) {
        // console.log(`[BuiltStructures] Found original node: ${originalStructureNode.name} at ${originalStructureNode.position.toString()}`);
        const childMeshes = originalStructureNode.getChildMeshes(true); // Get direct children only

        childMeshes.forEach(originalMesh => {
          const localPosition = originalMesh.position.clone();
          const meshNameParts = originalMesh.name.split('_');
          let blockTypeId = 'stone'; // Default fallback
          if (meshNameParts.length >= 2 && meshNameParts[0] === 'structure') {
            // Attempt to reconstruct blockTypeId which might contain underscores
            // e.g., structure_planks_spruce_0_0_0 -> planks_spruce
            // e.g., structure_stone_0_0_0 -> stone
            let i = 1;
            let potentialTypeId = meshNameParts[i];
            // Keep adding parts as long as the next part is not a number (or we run out of parts)
            while(i + 1 < meshNameParts.length && isNaN(parseInt(meshNameParts[i+1]))){
              potentialTypeId += "_" + meshNameParts[i+1];
              i++;
            }
            blockTypeId = potentialTypeId;
          }
          // console.log(`[BuiltStructures] Recreating mesh: ${originalMesh.name}, Original LocalPos: ${localPosition.toString()}, Parsed BlockTypeID: ${blockTypeId}`);
          const newMesh = createBlockMesh(blockTypeId, { x: localPosition.x, y: localPosition.y, z: localPosition.z }, structureNode);
          if (!newMesh) {
            console.warn(`[BuiltStructures] Failed to recreate mesh for ${originalMesh.name} with blockTypeId ${blockTypeId}`);
          }
          // Note: The line below was likely a copy-paste error from inserting the log above, removing it.
          // createBlockMesh(blockTypeId, { x: localPosition.x, y: localPosition.y, z: localPosition.z }, structureNode);
        });

        // console.log(`[BuiltStructures] Disposing original node: ${originalStructureNode.name}`);
        originalStructureNode.dispose(false, true); // Dispose node and its children

        addPlacementEffects(structureNode);

        const newStructure: BuiltStructure = {
          id: structureNode.name,
          blueprintId,
          name,
          difficulty,
          position: finalPlacementPosition,
          node: structureNode,
          createdAt: Date.now()
        };

        // Add to local state
        setStructures(prev => [...prev, newStructure]);

        // Save to localStorage via builtStructuresManager
        builtStructuresManager.addStructure(newStructure);

        // Always update the grid cell, whether we used a grid position or an explicit position
        const cellX = Math.floor((finalPlacementPosition.x - gridConfig.startX) / gridConfig.cellSize);
        const cellZ = Math.floor((finalPlacementPosition.z - gridConfig.startZ) / gridConfig.cellSize);

        // Check if the cell is within grid bounds
        if (cellX >= 0 && cellX < gridConfig.gridWidth && cellZ >= 0 && cellZ < gridConfig.gridDepth) {
          const cellIndex = gridRef.current.findIndex(c => c.x === cellX && c.z === cellZ);

          if (cellIndex !== -1) {
            const updatedGrid = [...gridRef.current];
            updatedGrid[cellIndex].occupied = true;
            updatedGrid[cellIndex].structureId = newStructure.id;
            gridRef.current = updatedGrid;
          }
        }
      }
    };

    /**
     * Handle structures reloaded event
     */
    const handleStructuresReloaded = () => {
      // Clear existing structures
      structures.forEach(structure => {
        if (structure.node && !structure.node.isDisposed()) {
          structure.node.dispose(false, true);
        }
      });

      // Reset state
      setStructures([]);

      // Reset grid
      const updatedGrid = [...gridRef.current];
      updatedGrid.forEach(cell => {
        cell.occupied = false;
        cell.structureId = undefined;
      });
      gridRef.current = updatedGrid;

      // The useEffect will handle reloading the structures
    };

    /**
     * Handle check position occupied event
     * This is called by structureBuilder to check if a position is already occupied
     */
    const handleCheckPositionOccupied = (event: Event) => {
      const customEvent = event as CustomEvent<{
        position: BABYLON.Vector3;
        callback: (isOccupied: boolean, existingStructureId?: string) => void;
      }>;

      const { position, callback } = customEvent.detail;

      // Calculate grid cell from position
      const cellX = Math.floor((position.x - gridConfig.startX) / gridConfig.cellSize);
      const cellZ = Math.floor((position.z - gridConfig.startZ) / gridConfig.cellSize);

      // Check if the cell is within grid bounds
      if (cellX >= 0 && cellX < gridConfig.gridWidth && cellZ >= 0 && cellZ < gridConfig.gridDepth) {
        const cellIndex = gridRef.current.findIndex(c => c.x === cellX && c.z === cellZ);

        if (cellIndex !== -1) {
          const cell = gridRef.current[cellIndex];

          if (cell.occupied) {
            callback(true, cell.structureId);
            return;
          }
        }
      }

      // If we get here, the position is not occupied
      callback(false);
    };

    /**
     * Handle find new position for structure event
     * This is called when a structure needs to be built but the default position is occupied
     */
    const handleFindNewPosition = (event: Event) => {
      const customEvent = event as CustomEvent<{
        blueprintId: string;
        name: string;
        difficulty: string;
        blocks: StructureBlueprintBlock[];
      }>;

      const { blueprintId } = customEvent.detail;

      // Find a new position in the grid
      const newPosition = findNextAvailableGridPosition();

      if (!newPosition) {
        return;
      }

      // Instead of dispatching an event, directly create the structure at the new position
      // This avoids the issue where the original structure node can't be found
      structureBuilder.createStructureAtPosition(blueprintId, newPosition);
    };

    window.addEventListener('structureBuilt', handleStructureBuilt as EventListener);
    window.addEventListener('structureDeleted', handleStructureDeleted as EventListener);
    window.addEventListener('allStructuresDeleted', handleAllStructuresDeleted as EventListener);
    window.addEventListener('structuresReloaded', handleStructuresReloaded as EventListener);
    window.addEventListener('checkPositionOccupied', handleCheckPositionOccupied as EventListener);
    window.addEventListener('findNewPositionForStructure', handleFindNewPosition as EventListener);

    return () => {
      window.removeEventListener('structureBuilt', handleStructureBuilt as EventListener);
      window.removeEventListener('structureDeleted', handleStructureDeleted as EventListener);
      window.removeEventListener('allStructuresDeleted', handleAllStructuresDeleted as EventListener);
      window.removeEventListener('structuresReloaded', handleStructuresReloaded as EventListener);
      window.removeEventListener('checkPositionOccupied', handleCheckPositionOccupied as EventListener);
      window.removeEventListener('findNewPositionForStructure', handleFindNewPosition as EventListener);
    };
  }, [scene, gridConfig, createBlockMesh, structures]);

  return null;
};

export default BuiltStructures;
