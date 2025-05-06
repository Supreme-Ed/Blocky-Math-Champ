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
    const handleBlockChange = () => {
      const state = structureBuilder.getStructureState();
      if (state) {
        setIsComplete(state.isComplete);
        setStructureName(state.blueprint?.name || '');
        setStructureDescription(state.blueprint?.description || '');
      }
    };

    // Initial check
    handleBlockChange();

    // Add event listeners
    window.addEventListener('blockAwarded', handleBlockChange);
    window.addEventListener('blockRemoved', handleBlockChange);

    // Clean up
    return () => {
      window.removeEventListener('blockAwarded', handleBlockChange);
      window.removeEventListener('blockRemoved', handleBlockChange);
    };
  }, []);

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
