// src/components/StructureManager.tsx
// Component for viewing and managing built structures

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Divider,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import builtStructuresManager, { SerializableStructure } from '../game/builtStructuresManager';
import './StructureManager.css';

interface StructureManagerProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Component for viewing and managing built structures
 *
 * @param props - Component props
 * @returns React component
 */
const StructureManager: React.FC<StructureManagerProps> = ({ open, onClose }) => {
  const [structures, setStructures] = useState<SerializableStructure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<SerializableStructure | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load structures when the component mounts or when the dialog is opened
  useEffect(() => {
    if (open) {
      loadStructures();
    }
  }, [open]);

  // Load structures from builtStructuresManager
  const loadStructures = () => {
    const loadedStructures = builtStructuresManager.getStructures();
    setStructures(loadedStructures);
  };

  // Handle structure deletion
  const handleDeleteStructure = (id: string) => {
    // Remove from builtStructuresManager (which also updates localStorage)
    builtStructuresManager.removeStructure(id);

    // Update local state
    setStructures(prev => prev.filter(structure => structure.id !== id));

    // Close details dialog if the deleted structure was selected
    if (selectedStructure && selectedStructure.id === id) {
      setShowDetails(false);
      setSelectedStructure(null);
    }

    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('structureDeleted', { detail: { id } }));
  };

  // Handle structure selection for details view
  const handleShowDetails = (structure: SerializableStructure) => {
    setSelectedStructure(structure);
    setShowDetails(true);
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Clear all structures
  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all structures? This cannot be undone.')) {
      builtStructuresManager.clearStructures();
      setStructures([]);
      setShowDetails(false);
      setSelectedStructure(null);

      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('allStructuresDeleted'));
    }
  };

  // Clean up duplicate structures
  const handleCleanupDuplicates = () => {
    const removed = builtStructuresManager.cleanupDuplicatePositions();
    if (removed > 0) {
      // Reload structures
      loadStructures();
      alert(`Cleaned up ${removed} duplicate structures.`);

      // Dispatch a custom event to notify other components to reload
      window.dispatchEvent(new CustomEvent('allStructuresDeleted'));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('structuresReloaded'));
      }, 100);
    } else {
      alert('No duplicate structures found.');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        className="structure-manager-dialog"
      >
        <DialogTitle className="structure-manager-title">
          <Typography variant="h5">Structure Manager</Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            size="small"
            className="structure-manager-close-button"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {structures.length === 0 ? (
            <Box className="structure-manager-empty">
              <Typography variant="body1">
                No structures have been built yet.
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Build structures in the game to see them here.
              </Typography>
            </Box>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Built Structures ({structures.length})
              </Typography>
              <List>
                {structures.map((structure) => (
                  <ListItem key={structure.id} className="structure-manager-list-item">
                    <ListItemText
                      primary={structure.name}
                      secondary={`${structure.difficulty} • Built on ${formatDate(structure.createdAt)}`}
                    />
                    <ListItemSecondaryAction>
                      <Tooltip title="View Details">
                        <IconButton
                          edge="end"
                          aria-label="details"
                          onClick={() => handleShowDetails(structure)}
                          size="small"
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Structure">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteStructure(structure.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>

        <DialogActions className="structure-manager-actions">
          {structures.length > 0 && (
            <>
              <Button
                onClick={handleCleanupDuplicates}
                color="warning"
                variant="outlined"
                size="small"
                style={{ marginRight: '8px' }}
              >
                Fix Duplicates
              </Button>
              <Button
                onClick={handleClearAll}
                color="error"
                variant="outlined"
                size="small"
              >
                Clear All
              </Button>
            </>
          )}
          <Button
            onClick={onClose}
            color="primary"
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Structure Details Dialog */}
      <Dialog
        open={showDetails}
        onClose={() => setShowDetails(false)}
        maxWidth="xs"
        fullWidth
        className="structure-details-dialog"
      >
        {selectedStructure && (
          <>
            <DialogTitle className="structure-details-title">
              <Typography variant="h6">{selectedStructure.name}</Typography>
              <IconButton
                aria-label="close"
                onClick={() => setShowDetails(false)}
                size="small"
                className="structure-details-close-button"
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Box className="structure-details-content">
                <Typography variant="subtitle1" gutterBottom>
                  Structure Details
                </Typography>

                <Divider />

                <Box className="structure-details-item">
                  <Typography variant="body2" color="textSecondary">
                    Difficulty
                  </Typography>
                  <Typography variant="body1">
                    {selectedStructure.difficulty.charAt(0).toUpperCase() + selectedStructure.difficulty.slice(1)}
                  </Typography>
                </Box>

                <Box className="structure-details-item">
                  <Typography variant="body2" color="textSecondary">
                    Built On
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedStructure.createdAt)}
                  </Typography>
                </Box>

                <Box className="structure-details-item">
                  <Typography variant="body2" color="textSecondary">
                    Position
                  </Typography>
                  <Typography variant="body1">
                    X: {selectedStructure.position.x.toFixed(1)},
                    Y: {selectedStructure.position.y.toFixed(1)},
                    Z: {selectedStructure.position.z.toFixed(1)}
                  </Typography>
                </Box>

                <Box className="structure-details-item">
                  <Typography variant="body2" color="textSecondary">
                    Blueprint ID
                  </Typography>
                  <Typography variant="body1">
                    {selectedStructure.blueprintId}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions>
              <Button
                onClick={() => handleDeleteStructure(selectedStructure.id)}
                color="error"
                startIcon={<DeleteIcon />}
              >
                Delete
              </Button>
              <Button
                onClick={() => setShowDetails(false)}
                color="primary"
                variant="contained"
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default StructureManager;
