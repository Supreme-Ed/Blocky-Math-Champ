import React, { useState, useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Slider from '@mui/material/Slider';
import Box from '@mui/material/Box';
import { SketchPicker } from 'react-color';

/**
 * LightingControls: UI for toggling and adjusting Babylon.js lights in real time.
 */
export default function LightingControls() {

  const [hemi, setHemi] = useState(null);
  const [sun, setSun] = useState(null);

  // Light state
  const [hemiEnabled, setHemiEnabled] = useState(true);
  const [hemiIntensity, setHemiIntensity] = useState(0.15);
  const [hemiColor, setHemiColor] = useState({ r: 0.7, g: 0.8, b: 1.0 });
  const [hemiGround, setHemiGround] = useState({ r: 0.4, g: 0.4, b: 0.4 });

  const [sunEnabled, setSunEnabled] = useState(true);
  const [sunIntensity, setSunIntensity] = useState(2.2);
  const [sunColor, setSunColor] = useState({ r: 1, g: 0.95, b: 0.8 });
  const [sunSpecular, setSunSpecular] = useState({ r: 1, g: 1, b: 0.9 });
  const [sunPos, setSunPos] = useState({ x: -150, y: 60, z: 0 });
  const [sunDir, setSunDir] = useState({ x: -2, y: -1, z: 0 });

  // Sync with Babylon scene
  useEffect(() => {
    const s = window.babylonScene || (window._babylonScene && window._babylonScene.current) || null;
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
  const updateHemi = (prop, value) => {
    if (!hemi) return;
    if (prop === 'enabled') { hemi.setEnabled(value); setHemiEnabled(value); }
    if (prop === 'intensity') { hemi.intensity = value; setHemiIntensity(value); }
    if (prop === 'diffuse') { hemi.diffuse = colorToBabylon(value); setHemiColor(value); }
    if (prop === 'groundColor') { hemi.groundColor = colorToBabylon(value); setHemiGround(value); }
  };
  const updateSun = (prop, value) => {
    if (!sun) return;
    if (prop === 'enabled') { sun.setEnabled(value); setSunEnabled(value); }
    if (prop === 'intensity') { sun.intensity = value; setSunIntensity(value); }
    if (prop === 'diffuse') { sun.diffuse = colorToBabylon(value); setSunColor(value); }
    if (prop === 'specular') { sun.specular = colorToBabylon(value); setSunSpecular(value); }
    if (prop === 'position') { sun.position = value; setSunPos(value); }
    if (prop === 'direction') { sun.direction = value; setSunDir(value); }
  };

  // Color helpers
  const colorToBabylon = c => new BABYLON.Color3(c.r, c.g, c.b);

  return (
    <Box sx={{ mt: 2, mb: 2, p: 1, border: '1px solid #ff9800', borderRadius: 1, background: '#fffbe8' }}>
      <Typography variant="subtitle1" color="secondary">Lighting Controls</Typography>
      <Stack spacing={2}>
        {/* Hemispheric Light Controls */}
        <Box>
          <Typography fontWeight="bold">Ambient (Hemispheric) Light</Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography>Enabled</Typography>
            <Switch checked={hemiEnabled} onChange={e => updateHemi('enabled', e.target.checked)} />
            <Typography>Intensity</Typography>
            <Slider min={0} max={2} step={0.01} value={hemiIntensity} onChange={(_,v) => updateHemi('intensity', v)} sx={{ width: 120 }} />
            <Typography>{hemiIntensity.toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2} mt={1}>
            <Typography>Diffuse</Typography>
            <Box><SketchPicker color={hemiColor} onChange={c => updateHemi('diffuse', colorToBabylon(c.rgb))} presetColors={[]} /></Box>
            <Typography>Ground</Typography>
            <Box><SketchPicker color={hemiGround} onChange={c => updateHemi('groundColor', colorToBabylon(c.rgb))} presetColors={[]} /></Box>
          </Stack>
        </Box>
        {/* Sun Light Controls */}
        <Box>
          <Typography fontWeight="bold">Sun (Directional Light)</Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography>Enabled</Typography>
            <Switch checked={sunEnabled} onChange={e => updateSun('enabled', e.target.checked)} />
            <Typography>Intensity</Typography>
            <Slider min={0} max={5} step={0.01} value={sunIntensity} onChange={(_,v) => updateSun('intensity', v)} sx={{ width: 120 }} />
            <Typography>{sunIntensity.toFixed(2)}</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2} mt={1}>
            <Typography>Diffuse</Typography>
            <Box><SketchPicker color={sunColor} onChange={c => updateSun('diffuse', colorToBabylon(c.rgb))} presetColors={[]} /></Box>
            <Typography>Specular</Typography>
            <Box><SketchPicker color={sunSpecular} onChange={c => updateSun('specular', colorToBabylon(c.rgb))} presetColors={[]} /></Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={2} mt={1}>
            <Typography>Position</Typography>
            <input type="number" value={typeof sunPos.x === 'number' ? sunPos.x : 0} step="1" style={{ width: 60 }} onChange={e => updateSun('position', { ...sunPos, x: parseFloat(e.target.value) })} />
            <input type="number" value={typeof sunPos.y === 'number' ? sunPos.y : 0} step="1" style={{ width: 60 }} onChange={e => updateSun('position', { ...sunPos, y: parseFloat(e.target.value) })} />
            <input type="number" value={typeof sunPos.z === 'number' ? sunPos.z : 0} step="1" style={{ width: 60 }} onChange={e => updateSun('position', { ...sunPos, z: parseFloat(e.target.value) })} />
            <Typography>Direction</Typography>
            <input type="number" value={typeof sunDir.x === 'number' ? sunDir.x : 0} step="0.01" style={{ width: 60 }} onChange={e => updateSun('direction', { ...sunDir, x: parseFloat(e.target.value) })} />
            <input type="number" value={typeof sunDir.y === 'number' ? sunDir.y : 0} step="0.01" style={{ width: 60 }} onChange={e => updateSun('direction', { ...sunDir, y: parseFloat(e.target.value) })} />
            <input type="number" value={typeof sunDir.z === 'number' ? sunDir.z : 0} step="0.01" style={{ width: 60 }} onChange={e => updateSun('direction', { ...sunDir, z: parseFloat(e.target.value) })} />
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
