// src/components/BuildButton.tsx
// Button component that appears when a structure can be built

import React, { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import structureBuilder from '../game/structureBuilder';
import './BuildButton.css';

interface BuildButtonProps {
  onBuild: () => void;
}

/**
 * BuildButton component that appears when a structure can be built
 * Shows the name of the structure and a "Build Now!" button
 * Only appears when all required blocks are collected
 *
 * @param props - Component props
 * @returns React component
 */
const BuildButton: React.FC<BuildButtonProps> = ({ onBuild }) => {
  const [isComplete, setIsComplete] = useState(false);
  const [structureName, setStructureName] = useState('');
  const [structureDescription, setStructureDescription] = useState('');

  // Listen for block award/removal events to update button visibility
  useEffect(() => {
    // Use a debounced handler to prevent excessive re-renders
    let updateTimeout: number | null = null;

    const handleBlockChange = () => {
      if (updateTimeout !== null) {
        window.clearTimeout(updateTimeout);
      }

      // Delay updates by 100ms to batch multiple events
      updateTimeout = window.setTimeout(() => {
        const state = structureBuilder.getStructureState();
        if (state) {
          // Only update state if values have changed to prevent unnecessary re-renders
          if (state.isComplete !== isComplete) {
            setIsComplete(state.isComplete);
          }

          const newName = state.blueprint?.name || '';
          if (newName !== structureName) {
            setStructureName(newName);
          }

          const newDescription = state.blueprint?.description || '';
          if (newDescription !== structureDescription) {
            setStructureDescription(newDescription);
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

    // Clean up
    return () => {
      if (updateTimeout !== null) {
        window.clearTimeout(updateTimeout);
      }
      window.removeEventListener('blockAwarded', handleBlockChange);
      window.removeEventListener('blockRemoved', handleBlockChange);
    };
  }, [isComplete, structureName, structureDescription]);

  // Don't render if structure is not complete
  if (!isComplete) {
    return null;
  }

  return (
    <Box className="build-button-container">
      <Box className="build-button-inner">
        <Typography variant="h5" className="build-button-title">
          {structureName} Ready to Build!
        </Typography>
        <Typography variant="body1" className="build-button-description">
          {structureDescription}
        </Typography>
        <Button
          variant="contained"
          color="success"
          size="large"
          className="build-button"
          onClick={onBuild}
        >
          Build Now!
        </Button>
      </Box>
    </Box>
  );
};

export default BuildButton;
