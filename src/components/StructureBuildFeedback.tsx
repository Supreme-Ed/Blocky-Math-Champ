// src/components/StructureBuildFeedback.tsx
// Provides feedback when a structure is built

import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import './StructureBuildFeedback.css';

interface StructureBuildFeedbackProps {
  onClose?: () => void;
  autoHideDuration?: number;
}

interface StructureBuiltEvent {
  blueprintId: string;
  name: string;
  difficulty: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
}

/**
 * StructureBuildFeedback component that shows a congratulatory message when a structure is built
 * 
 * @param props - Component props
 * @returns React component
 */
const StructureBuildFeedback: React.FC<StructureBuildFeedbackProps> = ({ 
  onClose,
  autoHideDuration = 5000 
}) => {
  const [show, setShow] = useState(false);
  const [structureInfo, setStructureInfo] = useState<StructureBuiltEvent | null>(null);

  useEffect(() => {
    const handleStructureBuilt = (event: CustomEvent<StructureBuiltEvent>) => {
      setStructureInfo(event.detail);
      setShow(true);

      // Auto-hide after duration
      const timer = setTimeout(() => {
        setShow(false);
        if (onClose) onClose();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    };

    // Add event listener
    window.addEventListener('structureBuilt', handleStructureBuilt as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('structureBuilt', handleStructureBuilt as EventListener);
    };
  }, [autoHideDuration, onClose]);

  if (!show || !structureInfo) {
    return null;
  }

  return (
    <Fade in={show}>
      <Box className="structure-feedback-container">
        <Box className="structure-feedback-inner">
          <Typography variant="h4" className="structure-feedback-title">
            Structure Built!
          </Typography>
          <Typography variant="h5" className="structure-feedback-name">
            {structureInfo.name}
          </Typography>
          <Typography variant="body1" className="structure-feedback-difficulty">
            {structureInfo.difficulty.charAt(0).toUpperCase() + structureInfo.difficulty.slice(1)} Difficulty
          </Typography>
          <Box className="structure-feedback-fireworks">
            <div className="firework"></div>
            <div className="firework"></div>
            <div className="firework"></div>
          </Box>
        </Box>
      </Box>
    </Fade>
  );
};

export default StructureBuildFeedback;
