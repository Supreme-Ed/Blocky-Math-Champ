// src/components/StructurePanel.tsx
// Panel component that shows available structures to build

import React, { useEffect, useState } from 'react';
import { STRUCTURE_BLUEPRINTS } from '../game/structureBlueprints';
import structureBuilder from '../game/structureBuilder';
import StructureIcon from './StructureIcon';
import type { SchematicBlueprint } from '../game/schematicManager';
import './StructurePanel.css';

interface StructurePanelProps {
  onBuild: () => void;
}

/**
 * Panel component that shows available structures to build
 *
 * @param props - Component props
 * @returns React component
 */
const StructurePanel: React.FC<StructurePanelProps> = ({ onBuild }) => {
  const [availableStructures, setAvailableStructures] = useState<Record<string, boolean>>({});
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(true);

  // Clear structure icon cache and force reload on mount
  useEffect(() => {
    // Log the available blueprints
    console.log('=== STRUCTURE PANEL MOUNT ===');
    console.log('Available blueprints in STRUCTURE_BLUEPRINTS:', Object.keys(STRUCTURE_BLUEPRINTS));
    console.log('Blueprint details:');
    Object.entries(STRUCTURE_BLUEPRINTS).forEach(([id, blueprint]) => {
      console.log(`- ${blueprint.name} (ID: ${id}, Difficulty: ${blueprint.difficulty})`);

      // Check if this is a schematic blueprint with fromFile flag
      if ('fromFile' in blueprint) {
        const schematicBlueprint = blueprint as SchematicBlueprint;
        console.log(`  - From file: ${schematicBlueprint.fromFile}`);
        console.log(`  - Original filename: ${schematicBlueprint.originalFilename || 'unknown'}`);
      }
    });

    // Clear any cached structure icons to force regeneration
    Object.keys(STRUCTURE_BLUEPRINTS).forEach(id => {
      localStorage.removeItem(`blocky_structure_icon_${id}`);
    });

    // Force reload blueprints on mount
    // We need to use setTimeout to avoid the React warning about calling handleForceReload
    // during render, since it's not yet defined when this effect runs on first render
    setTimeout(() => {
      handleForceReload();
    }, 100);
  }, []);

  // Listen for blueprint reload events
  useEffect(() => {
    const handleBlueprintsReloaded = (event: Event) => {
      console.log('Blueprints reloaded event received in StructurePanel');

      // Force re-render by updating state
      setAvailableStructures({});

      // Clear any cached structure icons to force regeneration
      Object.keys(STRUCTURE_BLUEPRINTS).forEach(id => {
        localStorage.removeItem(`blocky_structure_icon_${id}`);
      });

      // Re-check which structures can be built
      const newAvailability: Record<string, boolean> = {};
      Object.keys(STRUCTURE_BLUEPRINTS).forEach(blueprintId => {
        const canBuild = structureBuilder.canBuildStructure(blueprintId);
        newAvailability[blueprintId] = canBuild;
      });
      setAvailableStructures(newAvailability);

      // Reset selected blueprint
      setSelectedBlueprintId(null);
    };

    // Add event listener
    window.addEventListener('blueprintsReloaded', handleBlueprintsReloaded);

    // Clean up
    return () => {
      window.removeEventListener('blueprintsReloaded', handleBlueprintsReloaded);
    };
  }, []);

  // Listen for block award/removal events to update structure availability
  useEffect(() => {
    // Use a debounced handler to prevent excessive re-renders
    let updateTimeout: number | null = null;

    const handleBlockChange = () => {
      // Clear any pending update
      if (updateTimeout !== null) {
        window.clearTimeout(updateTimeout);
      }

      // Delay updates by 100ms to batch multiple events
      updateTimeout = window.setTimeout(() => {
        // Check which structures can be built with current blocks
        const newAvailability: Record<string, boolean> = {};

        Object.keys(STRUCTURE_BLUEPRINTS).forEach(blueprintId => {
          const canBuild = structureBuilder.canBuildStructure(blueprintId);
          newAvailability[blueprintId] = canBuild;
        });

        setAvailableStructures(newAvailability);

        // Update selected blueprint if needed
        if (selectedBlueprintId) {
          const state = structureBuilder.getStructureState();
          if (state && state.isComplete) {
            // If the current structure is complete, keep it selected
          } else {
            // Find the first available structure if the current one isn't available
            if (!newAvailability[selectedBlueprintId]) {
              const firstAvailable = Object.keys(newAvailability).find(id => newAvailability[id]);
              if (firstAvailable) {
                setSelectedBlueprintId(firstAvailable);
                structureBuilder.setBlueprint(firstAvailable);
              }
            }
          }
        } else {
          // If no blueprint is selected, select the first available one
          const firstAvailable = Object.keys(newAvailability).find(id => newAvailability[id]);
          if (firstAvailable) {
            setSelectedBlueprintId(firstAvailable);
            structureBuilder.setBlueprint(firstAvailable);
          }
        }

        updateTimeout = null;
      }, 100);
    };

    // Initial check
    handleBlockChange();

    // Add event listeners
    window.addEventListener('blockAwarded', handleBlockChange);
    window.addEventListener('blockRemoved', handleBlockChange);
    window.addEventListener('structureBuilt', handleBlockChange);

    // Clean up
    return () => {
      if (updateTimeout !== null) {
        window.clearTimeout(updateTimeout);
      }
      window.removeEventListener('blockAwarded', handleBlockChange);
      window.removeEventListener('blockRemoved', handleBlockChange);
      window.removeEventListener('structureBuilt', handleBlockChange);
    };
  }, [selectedBlueprintId]);

  // Handle structure selection
  const handleSelectStructure = (blueprintId: string) => {
    try {
      console.log(`Selecting structure: ${blueprintId}`);
      setSelectedBlueprintId(blueprintId);

      // Get the blueprint first to validate it
      const blueprint = STRUCTURE_BLUEPRINTS[blueprintId];
      if (!blueprint) {
        console.error(`Blueprint not found: ${blueprintId}`);
        return;
      }

      // Log the blueprint details to help with debugging
      console.log(`Blueprint details:`, {
        id: blueprint.id,
        name: blueprint.name,
        difficulty: blueprint.difficulty,
        blocksCount: blueprint.blocks?.length || 0,
        dimensions: blueprint.dimensions
      });

      // Check if the blueprint has valid blocks
      if (!blueprint.blocks || !Array.isArray(blueprint.blocks) || blueprint.blocks.length === 0) {
        console.error(`Invalid blueprint structure for ${blueprintId}: blocks array is missing, not an array, or empty`);
        return;
      }

      // Check if the blueprint has valid dimensions
      if (!blueprint.dimensions ||
          typeof blueprint.dimensions.width !== 'number' ||
          typeof blueprint.dimensions.height !== 'number' ||
          typeof blueprint.dimensions.depth !== 'number') {
        console.error(`Invalid dimensions for blueprint ${blueprintId}:`, blueprint.dimensions);

        // Add default dimensions if missing
        blueprint.dimensions = {
          width: 5,
          height: 5,
          depth: 5
        };
        console.log(`Added default dimensions to blueprint ${blueprintId}`);
      }

      // Validate a sample of blocks to ensure they have required properties
      const sampleSize = Math.min(5, blueprint.blocks.length);
      for (let i = 0; i < sampleSize; i++) {
        const block = blueprint.blocks[i];
        if (!block || typeof block.blockTypeId !== 'string' || !block.position) {
          console.error(`Blueprint ${blueprintId} has invalid block at index ${i}:`, block);
          return;
        }

        // Check position properties
        if (typeof block.position.x !== 'number' ||
            typeof block.position.y !== 'number' ||
            typeof block.position.z !== 'number') {
          console.error(`Blueprint ${blueprintId} has invalid block position at index ${i}:`, block.position);
          return;
        }
      }

      // Set the blueprint in the structure builder
      const success = structureBuilder.setBlueprint(blueprintId);
      if (!success) {
        console.error(`Failed to set blueprint: ${blueprintId}`);
      } else {
        console.log(`Successfully set blueprint: ${blueprintId}`);
      }
    } catch (error) {
      console.error(`Error selecting structure ${blueprintId}:`, error);
    }
  };

  // Handle build button click
  const handleBuild = () => {
    if (selectedBlueprintId && availableStructures[selectedBlueprintId]) {
      onBuild();
    }
  };

  // Toggle panel visibility
  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  // Function to force reload blueprints
  const handleForceReload = async () => {
    try {
      // Import the reloadBlueprints function
      const { reloadBlueprints } = await import('../game/structureBlueprints');

      // Force reload
      await reloadBlueprints();
      console.log('Structure blueprints reloaded successfully');

      // Clear any cached structure icons to force regeneration
      Object.keys(STRUCTURE_BLUEPRINTS).forEach(id => {
        localStorage.removeItem(`blocky_structure_icon_${id}`);
      });

      // Force re-check which structures can be built
      const newAvailability: Record<string, boolean> = {};
      Object.keys(STRUCTURE_BLUEPRINTS).forEach(blueprintId => {
        const canBuild = structureBuilder.canBuildStructure(blueprintId);
        newAvailability[blueprintId] = canBuild;
      });
      setAvailableStructures(newAvailability);

      // Reset selected blueprint
      setSelectedBlueprintId(null);
    } catch (error) {
      console.error('Error reloading blueprints:', error);
    }
  };

  return (
    <div className={`structure-panel ${showPanel ? 'expanded' : 'collapsed'}`}>
      <div className="structure-panel-toggle" onClick={togglePanel}>
        {showPanel ? '◀' : '▶'}
      </div>

      <div className="structure-panel-content">
        <h3 className="structure-panel-title">
          Structures
          <button
            type="button"
            onClick={handleForceReload}
            style={{
              marginLeft: '10px',
              fontSize: '0.7em',
              padding: '2px 5px',
              background: '#555',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
            title="Force reload structure blueprints"
          >
            Reload
          </button>
        </h3>

        <div className="structure-icons-container">
          {Object.keys(STRUCTURE_BLUEPRINTS).length === 0 ? (
            <div className="no-structures-message">
              <p>No structures available</p>
              <p>To load structures:</p>
              <ol>
                <li>Start the server with: <code>npm run server:dev</code></li>
                <li>Ensure there are valid .nbt files in public/models/structures/</li>
              </ol>
              <p>See SERVER.md for more information</p>
            </div>
          ) : (
            Object.entries(STRUCTURE_BLUEPRINTS)
              // Filter to only show eiffel_tower structures
              .filter(([blueprintId, blueprint]) =>
                blueprintId.includes('eiffel') ||
                blueprint.name.toLowerCase().includes('eiffel')
              )
              .map(([blueprintId, blueprint]) => (
                <StructureIcon
                  key={blueprintId}
                  blueprint={blueprint}
                  isAvailable={availableStructures[blueprintId] || false}
                  isSelected={selectedBlueprintId === blueprintId}
                  onClick={() => handleSelectStructure(blueprintId)}
                />
              ))
          )}
        </div>

        {selectedBlueprintId && availableStructures[selectedBlueprintId] && (
          <button
            type="button"
            className="structure-build-button"
            onClick={handleBuild}
          >
            Build Now!
          </button>
        )}
      </div>
    </div>
  );
};

export default StructurePanel;
