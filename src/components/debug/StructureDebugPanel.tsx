// src/components/debug/StructureDebugPanel.tsx
// Debug panel section for testing structures

import React, { useState, useEffect } from 'react';
import { STRUCTURE_BLUEPRINTS, reloadBlueprints } from '../../game/structureBlueprints';
import structureBuilder from '../../game/structureBuilder';
import { saveBlockMappings } from '../../game/blockMappingClient';
import * as BABYLON from '@babylonjs/core';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';

interface StructureDebugPanelProps {
  scene: BABYLON.Scene | null;
}

const StructureDebugPanel: React.FC<StructureDebugPanelProps> = ({ scene }) => {
  const [blueprints, setBlueprints] = useState<Record<string, any>>({});
  const [selectedBlueprint, setSelectedBlueprint] = useState<string>('');
  const [position, setPosition] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });

  // Load blueprints when component mounts
  useEffect(() => {
    setBlueprints(STRUCTURE_BLUEPRINTS);
  }, []);

  // Listen for blueprint reload events
  useEffect(() => {
    const handleBlueprintsReloaded = () => {
      console.log('Blueprints reloaded event received in StructureDebugPanel');
      setBlueprints(STRUCTURE_BLUEPRINTS);
    };

    // Add event listener
    window.addEventListener('blueprintsReloaded', handleBlueprintsReloaded);

    // Clean up
    return () => {
      window.removeEventListener('blueprintsReloaded', handleBlueprintsReloaded);
    };
  }, []);

  // Handle reload button click
  const handleReloadBlueprints = async () => {
    try {
      await reloadBlueprints();
      console.log('Blueprints reloaded successfully');
    } catch (error) {
      console.error('Error reloading blueprints:', error);
    }
  };

  // Handle blueprint selection
  const handleBlueprintChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedBlueprint(event.target.value as string);
  };

  // Handle position changes
  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: string) => {
    const numValue = parseFloat(value) || 0;
    setPosition(prev => ({ ...prev, [axis]: numValue }));
  };

  // Handle visualization
  const handleVisualize = () => {
    if (!scene || !selectedBlueprint) return;

    // Set the blueprint in the structure builder
    structureBuilder.setBlueprint(selectedBlueprint);

    // Update visualization options
    structureBuilder.setVisualizationOptions({
      position: new BABYLON.Vector3(position.x, position.y, position.z),
      scale: 1.0,
      showCompleted: true,
      showRemaining: true,
      completedOpacity: 1.0,
      remainingOpacity: 0.5
    });
  };

  // Handle building the structure
  const handleBuild = () => {
    if (!scene || !selectedBlueprint) return;

    // Set the blueprint in the structure builder
    structureBuilder.setBlueprint(selectedBlueprint);

    // Force the structure to be complete for debug purposes
    const currentState = structureBuilder.getStructureState();
    if (currentState) {
      currentState.isComplete = true;
    }

    // Build the structure at the specified position
    structureBuilder.buildStructure(
      new BABYLON.Vector3(position.x, position.y, position.z),
      true // Force rebuild even if already built
    );

    // Save block mappings for any structure
    saveBlockMappings();
  };

  return (
    <Box sx={{ mt: 2, mb: 2, p: 1, border: '1px solid #9C27B0', borderRadius: 1, background: '#f3e5f5' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" color="secondary">Schematic Structures</Typography>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          onClick={handleReloadBlueprints}
        >
          Reload Structures
        </Button>
      </Box>

      <Box sx={{ mt: 1, mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="blueprint-select-label">Blueprint</InputLabel>
          <Select
            labelId="blueprint-select-label"
            id="blueprint-select"
            value={selectedBlueprint}
            label="Blueprint"
            onChange={handleBlueprintChange}
          >
            <MenuItem value="">
              <em>Select a blueprint</em>
            </MenuItem>
            {Object.keys(blueprints).map(id => (
              <MenuItem key={id} value={id}>
                {blueprints[id].name} ({blueprints[id].difficulty})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          label="X"
          type="number"
          size="small"
          value={position.x}
          onChange={(e) => handlePositionChange('x', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Y"
          type="number"
          size="small"
          value={position.y}
          onChange={(e) => handlePositionChange('y', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Z"
          type="number"
          size="small"
          value={position.z}
          onChange={(e) => handlePositionChange('z', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleVisualize}
          disabled={!selectedBlueprint}
        >
          Visualize
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleBuild}
          disabled={!selectedBlueprint}
        >
          Build
        </Button>
      </Stack>
    </Box>
  );
};

export default StructureDebugPanel;
