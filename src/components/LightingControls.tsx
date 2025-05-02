import React, { useState, useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { SketchPicker, ColorResult } from 'react-color';

interface Color {
  r: number;
  g: number;
  b: number;
}

interface Position {
  x: number;
  y: number;
  z: number;
}

/**
 * LightingControls: UI for toggling and adjusting Babylon.js lights in real time.
 */
export default function LightingControls() {
  const [hemi, setHemi] = useState<BABYLON.HemisphericLight | null>(null);
  const [sun, setSun] = useState<BABYLON.DirectionalLight | null>(null);

  // Light state - optimized for shadow shape detail
  const [hemiEnabled, setHemiEnabled] = useState<boolean>(true);
  const [hemiIntensity, setHemiIntensity] = useState<number>(0.2); // Reduced for better shadow contrast
  const [hemiColor, setHemiColor] = useState<Color>({ r: 1.0, g: 1.0, b: 1.0 }); // Pure white for cleaner shadows
  const [hemiGround, setHemiGround] = useState<Color>({ r: 0.2, g: 0.2, b: 0.2 }); // Darker ground color

  const [sunEnabled, setSunEnabled] = useState<boolean>(true);
  const [sunIntensity, setSunIntensity] = useState<number>(1.5); // Increased for better shadow definition
  const [sunColor, setSunColor] = useState<Color>({ r: 1, g: 1, b: 1 }); // Pure white for clearer shadows
  const [sunSpecular, setSunSpecular] = useState<Color>({ r: 0.1, g: 0.1, b: 0.1 }); // Minimal specular
  const [sunPos, setSunPos] = useState<Position>({ x: 5, y: 20, z: 3 }); // Higher position for better projection
  const [sunDir, setSunDir] = useState<Position>({ x: -0.5, y: -2.5, z: -0.3 }); // Steeper angle

  // Sync with Babylon scene
  useEffect(() => {
    const s = (window as any).babylonScene || ((window as any)._babylonScene && (window as any)._babylonScene.current) || null;
    if (s && s._hemiLight && s._sunLight) {
      setHemi(s._hemiLight);
      setSun(s._sunLight);
      setHemiEnabled(s._hemiLight.isEnabled());
      setHemiIntensity(s._hemiLight.intensity);
      setHemiColor({ ...s._hemiLight.diffuse });
      setHemiGround({ ...s._hemiLight.groundColor });
      setSunEnabled(s._sunLight.isEnabled());
      setSunIntensity(s._sunLight.intensity);
      setSunColor({ ...s._sunLight.diffuse });
      setSunSpecular({ ...s._sunLight.specular });
      setSunPos({ ...s._sunLight.position });
      setSunDir({ ...s._sunLight.direction });
    }
  }, []);

  // Handlers for live updates
  const updateHemi = (prop: string, value: any) => {
    if (!hemi) return;
    if (prop === 'enabled') { hemi.setEnabled(value); setHemiEnabled(value); }
    if (prop === 'intensity') { hemi.intensity = value; setHemiIntensity(value); }
    if (prop === 'diffuse') { hemi.diffuse = colorToBabylon(value); setHemiColor(value); }
    if (prop === 'groundColor') { hemi.groundColor = colorToBabylon(value); setHemiGround(value); }
  };

  const updateSun = (prop: string, value: any) => {
    if (!sun) return;
    if (prop === 'enabled') { sun.setEnabled(value); setSunEnabled(value); }
    if (prop === 'intensity') { sun.intensity = value; setSunIntensity(value); }
    if (prop === 'diffuse') { sun.diffuse = colorToBabylon(value); setSunColor(value); }
    if (prop === 'specular') { sun.specular = colorToBabylon(value); setSunSpecular(value); }
    if (prop === 'position') {
      const newPos = new BABYLON.Vector3(value.x, value.y, value.z);
      sun.position.copyFrom(newPos);
      setSunPos({ ...value });
      // Also update the visible sun mesh position
      const scene = (window as any).babylonScene || ((window as any)._babylonScene && (window as any)._babylonScene.current) || null;
      if (scene && scene.getMeshByName) {
        const sunMesh = scene.getMeshByName("sunMesh");
        if (sunMesh) sunMesh.position.copyFrom(newPos);
      }
    }
    if (prop === 'direction') {
      sun.direction = new BABYLON.Vector3(value.x, value.y, value.z);
      setSunDir(value);
    }
  };

  // Color helpers
  const colorToBabylon = (c: Color): BABYLON.Color3 => new BABYLON.Color3(c.r, c.g, c.b);

  return (
    <Box sx={{ mt: 2, mb: 2, p: 1, border: '1px solid #ff9800', borderRadius: 1, background: '#fffbe8' }}>
      <Typography variant="subtitle1" color="secondary">Lighting Controls</Typography>
      <Stack spacing={2}>
        {/* Hemispheric Light Controls */}
        <Box>
          <Typography fontWeight="bold">Ambient (Hemispheric) Light</Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography>Enabled</Typography>
            <Switch checked={hemiEnabled} onChange={e => updateHemi('enabled', e.target.checked)} size="small" />
            <Typography>Intensity</Typography>
            <Slider min={0} max={2} step={0.01} value={hemiIntensity} onChange={(_,v) => updateHemi('intensity', v)} sx={{ width: 80 }} size="small" />
            <Typography>{hemiIntensity.toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" alignItems="flex-start" spacing={1} flexWrap="wrap" mt={1}>
            <Box>
              <Typography variant="caption">Diffuse</Typography>
              <Box sx={{ maxWidth: 140 }}>
                <SketchPicker
                  color={hemiColor}
                  onChange={(c: ColorResult) => updateHemi('diffuse', c.rgb)}
                  presetColors={[]}
                  disableAlpha={true}
                  width={140}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption">Ground</Typography>
              <Box sx={{ maxWidth: 140 }}>
                <SketchPicker
                  color={hemiGround}
                  onChange={(c: ColorResult) => updateHemi('groundColor', c.rgb)}
                  presetColors={[]}
                  disableAlpha={true}
                  width={140}
                />
              </Box>
            </Box>
          </Stack>
        </Box>
        {/* Sun Light Controls */}
        <Box>
          <Typography fontWeight="bold">Sun (Directional Light)</Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography>Enabled</Typography>
            <Switch checked={sunEnabled} onChange={e => updateSun('enabled', e.target.checked)} size="small" />
            <Typography>Intensity</Typography>
            <Slider min={0} max={5} step={0.01} value={sunIntensity} onChange={(_,v) => updateSun('intensity', v)} sx={{ width: 80 }} size="small" />
            <Typography>{sunIntensity.toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" alignItems="flex-start" spacing={1} flexWrap="wrap" mt={1}>
            <Box>
              <Typography variant="caption">Diffuse</Typography>
              <Box sx={{ maxWidth: 140 }}>
                <SketchPicker
                  color={sunColor}
                  onChange={(c: ColorResult) => updateSun('diffuse', c.rgb)}
                  presetColors={[]}
                  disableAlpha={true}
                  width={140}
                />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption">Specular</Typography>
              <Box sx={{ maxWidth: 140 }}>
                <SketchPicker
                  color={sunSpecular}
                  onChange={(c: ColorResult) => updateSun('specular', c.rgb)}
                  presetColors={[]}
                  disableAlpha={true}
                  width={140}
                />
              </Box>
            </Box>
          </Stack>
          <Box mt={1}>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Sun Position</Typography>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">X</Typography>
                <Slider min={-300} max={300} step={1} value={typeof sunPos.x === 'number' ? sunPos.x : 0} onChange={(_,v) => updateSun('position', { ...sunPos, x: v })} sx={{ width: 120 }} size="small" />
                <Typography variant="caption">{sunPos.x}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">Y</Typography>
                <Slider min={-100} max={200} step={1} value={typeof sunPos.y === 'number' ? sunPos.y : 0} onChange={(_,v) => updateSun('position', { ...sunPos, y: v })} sx={{ width: 120 }} size="small" />
                <Typography variant="caption">{sunPos.y}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">Z</Typography>
                <Slider min={-300} max={300} step={1} value={typeof sunPos.z === 'number' ? sunPos.z : 0} onChange={(_,v) => updateSun('position', { ...sunPos, z: v })} sx={{ width: 120 }} size="small" />
                <Typography variant="caption">{sunPos.z}</Typography>
              </Stack>
            </Stack>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Sun Direction</Typography>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">X</Typography>
                <Slider min={-3} max={3} step={0.01} value={typeof sunDir.x === 'number' ? sunDir.x : 0} onChange={(_,v) => updateSun('direction', { ...sunDir, x: v })} sx={{ width: 120 }} size="small" />
                <Typography variant="caption">{Number(sunDir.x).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">Y</Typography>
                <Slider min={-3} max={3} step={0.01} value={typeof sunDir.y === 'number' ? sunDir.y : 0} onChange={(_,v) => updateSun('direction', { ...sunDir, y: v })} sx={{ width: 120 }} size="small" />
                <Typography variant="caption">{Number(sunDir.y).toFixed(2)}</Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="caption">Z</Typography>
                <Slider min={-3} max={3} step={0.01} value={typeof sunDir.z === 'number' ? sunDir.z : 0} onChange={(_,v) => updateSun('direction', { ...sunDir, z: v })} sx={{ width: 120 }} size="small" />
                <Typography variant="caption">{Number(sunDir.z).toFixed(2)}</Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
