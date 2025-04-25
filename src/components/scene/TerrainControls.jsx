// src/components/scene/TerrainControls.jsx
// Modular React component for controlling terrain (ground) parameters and anisotropy in Babylon.js
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';

import { applyAnisotropy } from './Anisotropy';

/**
 * TerrainControls
 * Sliders for terrain amplitude, frequency, and anisotropy filtering for the ground material.
 *
 * Props:
 *   - getGroundMaterial: () => BABYLON.PBRMaterial | null
 *   - onTerrainChange: (params) => void
 */
export default function TerrainControls({ getGroundMaterial, onTerrainChange }) {
  // UI state
  const [anisotropy, setAnisotropy] = useState(16);
  const [amplitude, setAmplitude] = useState(20);
  const [frequency, setFrequency] = useState(0.008);

  // Sync with current material on mount
  useEffect(() => {
    const mat = getGroundMaterial?.();
    if (mat && mat.anisotropy?.isEnabled) {
      setAnisotropy(mat.anisotropy.intensity || 4);
    }
  }, [getGroundMaterial]);

  // Apply anisotropy to ground material
  useEffect(() => {
    const mat = getGroundMaterial?.();
    if (mat) {
      applyAnisotropy(mat, { level: anisotropy });
    }
  }, [anisotropy, getGroundMaterial]);

  return (
    <Box sx={{ mt: 2, mb: 2, p: 1, border: '1px solid #388e3c', borderRadius: 1, background: '#e8f5e9' }}>
      <Typography variant="subtitle1" color="success.main">Terrain Controls</Typography>
      <Stack spacing={2}>
        <Box>
          <Typography gutterBottom>Anisotropy Level</Typography>
          <Slider min={1} max={16} step={1} value={anisotropy} onChange={(_, v) => setAnisotropy(v)} valueLabelDisplay="auto" marks={[{value:1,label:'1x'},{value:2,label:'2x'},{value:4,label:'4x'},{value:8,label:'8x'},{value:16,label:'16x'}]} />
        </Box>
        <Box>
          <Typography gutterBottom>Amplitude (Hill Height)</Typography>
          <Slider min={1} max={100} step={1} value={amplitude} onChange={(_, v) => { setAmplitude(v); onTerrainChange?.({ amplitude: v, frequency }); }} valueLabelDisplay="auto" />
        </Box>
        <Box>
          <Typography gutterBottom>Frequency (Terrain Detail)</Typography>
          <Slider min={0.001} max={0.05} step={0.001} value={frequency} onChange={(_, v) => { setFrequency(v); onTerrainChange?.({ amplitude, frequency: v }); }} valueLabelDisplay="auto" />
        </Box>
        <Button variant="outlined" onClick={() => { setAnisotropy(16); setAmplitude(20); setFrequency(0.008); onTerrainChange?.({ amplitude: 20, frequency: 0.008 }); }}>Reset Terrain</Button>
      </Stack>
    </Box>
  );
}

TerrainControls.propTypes = {
  getGroundMaterial: PropTypes.func.isRequired,
  onTerrainChange: PropTypes.func,
};
