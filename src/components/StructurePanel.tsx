// src/components/StructurePanel.tsx
// Panel component that shows available structures to build

import React, { useEffect, useState } from 'react';
import { STRUCTURE_BLUEPRINTS } from '../game/structureBlueprints';
import structureBuilder from '../game/structureBuilder';
import StructureIcon from './StructureIcon';
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

  // Clear structure icon cache on mount
  useEffect(() => {
    // Clear any cached structure icons to force regeneration
    Object.keys(STRUCTURE_BLUEPRINTS).forEach(id => {
      localStorage.removeItem(`blocky_structure_icon_${id}`);
    });
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
    setSelectedBlueprintId(blueprintId);
    structureBuilder.setBlueprint(blueprintId);
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

  return (
    <div className={`structure-panel ${showPanel ? 'expanded' : 'collapsed'}`}>
      <div className="structure-panel-toggle" onClick={togglePanel}>
        {showPanel ? '◀' : '▶'}
      </div>

      <div className="structure-panel-content">
        <h3 className="structure-panel-title">Structures</h3>

        <div className="structure-icons-container">
          {Object.entries(STRUCTURE_BLUEPRINTS).map(([blueprintId, blueprint]) => (
            <StructureIcon
              key={blueprintId}
              blueprint={blueprint}
              isAvailable={availableStructures[blueprintId] || false}
              isSelected={selectedBlueprintId === blueprintId}
              onClick={() => handleSelectStructure(blueprintId)}
            />
          ))}
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
