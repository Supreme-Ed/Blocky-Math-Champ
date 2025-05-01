// src/components/scene/TerrainControls.tsx
// Modular React component for controlling terrain (ground) parameters and anisotropy in Babylon.js
import React, { useState, useEffect } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import * as BABYLON from '@babylonjs/core';

import { applyAnisotropy } from './Anisotropy';

interface TerrainControlsProps {
  getGroundMaterial: () => BABYLON.PBRMaterial | null;
  onTerrainChange?: (params: { amplitude: number; frequency: number }) => void;
}

/**
 * TerrainControls
 * Sliders for terrain amplitude, frequency, and anisotropy filtering for the ground material.
 */
export default function TerrainControls({ getGroundMaterial, onTerrainChange }: TerrainControlsProps) {
  // UI state
  const [anisotropy, setAnisotropy] = useState<number>(16);
  const [amplitude, setAmplitude] = useState<number>(20);
  const [frequency, setFrequency] = useState<number>(0.008);

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
    if (mat && mat.anisotropy) {
      try {
        applyAnisotropy(mat, { level: anisotropy });
      } catch (error) {
        console.warn("Could not apply anisotropy:", error);
      }
    }
  }, [anisotropy, getGroundMaterial]);

  return (
    <Box sx={{ mt: 2, mb: 2, p: 1, border: '1px solid #388e3c', borderRadius: 1, background: '#e8f5e9' }}>
      <Typography variant="subtitle1" color="success.main">Terrain Controls</Typography>
      <Stack spacing={2}>
        <Box>
          <Typography gutterBottom>Anisotropy Level</Typography>
          <Slider
            min={1}
            max={16}
            step={1}
            value={anisotropy}
            onChange={(_, v) => setAnisotropy(v as number)}
            valueLabelDisplay="auto"
            marks={[
              {value:1,label:'1x'},
              {value:2,label:'2x'},
              {value:4,label:'4x'},
              {value:8,label:'8x'},
              {value:16,label:'16x'}
            ]}
          />
        </Box>
        <Box>
          <Typography gutterBottom>Amplitude (Hill Height)</Typography>
          <Slider
            min={1}
            max={100}
            step={1}
            value={amplitude}
            onChange={(_, v) => {
              const value = v as number;
              setAmplitude(value);
              onTerrainChange?.({ amplitude: value, frequency });
            }}
            valueLabelDisplay="auto"
          />
        </Box>
        <Box>
          <Typography gutterBottom>Frequency (Terrain Detail)</Typography>
          <Slider
            min={0.001}
            max={0.05}
            step={0.001}
            value={frequency}
            onChange={(_, v) => {
              const value = v as number;
              setFrequency(value);
              onTerrainChange?.({ amplitude, frequency: value });
            }}
            valueLabelDisplay="auto"
          />
        </Box>
        <Button
          variant="outlined"
          onClick={() => {
            setAnisotropy(16);
            setAmplitude(20);
            setFrequency(0.008);
            onTerrainChange?.({ amplitude: 20, frequency: 0.008 });
          }}
        >
          Reset Terrain
        </Button>
      </Stack>
    </Box>
  );
}
