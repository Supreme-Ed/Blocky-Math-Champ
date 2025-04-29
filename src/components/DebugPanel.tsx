import React, { useState, useRef, useEffect } from 'react';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/procedural-textures';
import { CloudProceduralTexture } from '../procedural/CloudProceduralTexture';
import blockAwardManager from '../game/blockAwardManager';
import { BLOCK_TYPES } from '../game/blockTypes';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import LightingControls from './LightingControls';
import TerrainControls from './scene/TerrainControls';

interface DebugPanelProps {
  problemQueue: any[];
  soundManager: any;
  handleRightAnswer: () => void;
  handleWrongAnswer: () => void;
  correctBlocks: number;
  setCorrectBlocks: React.Dispatch<React.SetStateAction<number>>;
  score: number;
  structureBlocks: number;
  onClose: () => void;
}

interface DebugPanelToggleProps {
  onClick: () => void;
}

interface Position {
  x: number;
  y: number;
}

interface DragOffset {
  x: number;
  y: number;
}

interface Color {
  r: number;
  g: number;
  b: number;
}

function useBabylonFps(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let running = true;
    function update() {
      const scene = (window as any).babylonScene;
      if (scene && scene.getEngine && typeof scene.getEngine().getFps === 'function') {
        setFps(Math.round(scene.getEngine().getFps()));
      }
      if (running) requestAnimationFrame(update);
    }
    update();
    return () => { running = false; };
  }, []);
  return fps;
}

function clearAwardedBlocksStorage(): void {
  if (typeof window !== 'undefined') {
    window.localStorage?.removeItem('blocky_awardedBlocks');
    (window as any).awardedBlocks = {};
    window.dispatchEvent(new CustomEvent('blockAwarded', { detail: { blockTypeId: null, awardedBlocks: {} } }));
  }
}

function AwardedBlocksDisplay(): JSX.Element {
  const [awardedBlocks, setAwardedBlocks] = useState<Record<string, number>>(blockAwardManager.getBlocks());
  useEffect(() => {
    function updateBlocks() {
      setAwardedBlocks(blockAwardManager.getBlocks());
    }
    window.addEventListener('blockAwarded', updateBlocks);
    window.addEventListener('blockRemoved', updateBlocks);
    return () => {
      window.removeEventListener('blockAwarded', updateBlocks);
      window.removeEventListener('blockRemoved', updateBlocks);
    };
  }, []);
  // awardedBlocks is now an object: { grass: 2, stone: 1, ... }
  const allTypes = BLOCK_TYPES;
  const hasAny = Object.values(awardedBlocks).some(qty => qty > 0);
  if (!hasAny) {
    return <Typography variant="body2" color="text.secondary">No blocks awarded yet.</Typography>;
  }
  return (
    <Box sx={{ overflowX: 'auto', border: '1px solid #ccc', borderRadius: 1, p: 1, mb: 1 }}>
      <Button size="small" variant="outlined" color="error" sx={{ mb: 1 }} onClick={clearAwardedBlocksStorage}>
        Clear Block Storage
      </Button>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
        <thead>
          <tr>
            {allTypes.map(type => (
              <th key={type.id} style={{ padding: 4, borderBottom: '1px solid #aaa', minWidth: 80, background: '#f5f5f5' }}>{type.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {allTypes.map(type => (
              <td key={type.id} style={{ padding: 4, fontWeight: 'bold', fontSize: 16, color: '#1976d2' }}>{awardedBlocks[type.id] || 0}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </Box>
  );
}

function clamp01(x: number): number { 
  return Math.max(0, Math.min(1, x)); 
}

/**
 * SkyboxControls: UI controls for adjusting the procedural skybox colors in real time.
 *
 * - 'Sky Color (Background)' sets the background (cloudColor property of CloudProceduralTexture).
 * - 'Cloud Color (Cloud Shapes)' sets the color of the clouds (skyColor property).
 *
 * Babylon.js quirk: 'cloudColor' is the background, 'skyColor' is the color of the cloud shapes.
 * The Apply button triggers the update; changes are not live until applied.
 */
function SkyboxControls(): JSX.Element {
  const [skyColor, setSkyColor] = useState<Color>({ r: 0.2, g: 0.35, b: 0.7 });
  const [cloudColor, setCloudColor] = useState<Color>({ r: 0.95, g: 0.95, b: 0.95 });
  const [amplitude, setAmplitude] = useState<number>(1.0);
  const [numOctaves, setNumOctaves] = useState<number>(12);

  // On mount, sync with current skybox texture values if available
  useEffect(() => {
    const scene = (window as any).babylonScene || ((window as any)._babylonScene && (window as any)._babylonScene.current) || null;
    if (scene && scene._skybox && scene._skybox.material && scene._skybox.material.emissiveTexture) {
      const tex = scene._skybox.material.emissiveTexture;
      if (tex.cloudColor && tex.cloudColor.r !== undefined) setSkyColor({ r: tex.cloudColor.r, g: tex.cloudColor.g, b: tex.cloudColor.b });
      if (tex.skyColor && tex.skyColor.r !== undefined) setCloudColor({ r: tex.skyColor.r, g: tex.skyColor.g, b: tex.skyColor.b });
      if (typeof tex.amplitude === 'number') setAmplitude(tex.amplitude);
      if (typeof tex.numOctaves === 'number') setNumOctaves(tex.numOctaves);
    }
  }, []);

  // Only update skybox when Apply is clicked
  const applySkyboxColors = () => {
    const scene = (window as any).babylonScene || ((window as any)._babylonScene && (window as any)._babylonScene.current) || null;
    if (scene && scene._skybox && scene._skybox.material) {
      // Dispose old texture if present
      const oldTex = scene._skybox.material.emissiveTexture;
      if (oldTex && typeof oldTex.dispose === 'function') oldTex.dispose();
      // Create new CloudProceduralTexture with all settings
      const cloudTex = new CloudProceduralTexture('cloudTex', 1024, scene);
      cloudTex.refreshRate = 1; // update every frame for animation
      cloudTex.cloudColor = new BABYLON.Color3(clamp01(skyColor.r), clamp01(skyColor.g), clamp01(skyColor.b)); // background
      cloudTex.skyColor = new BABYLON.Color3(clamp01(cloudColor.r), clamp01(cloudColor.g), clamp01(cloudColor.b)); // clouds
      cloudTex.amplitude = amplitude;
      cloudTex.numOctaves = numOctaves;
      if (typeof cloudTex.update === 'function') cloudTex.update();
      scene._skybox.material.emissiveTexture = cloudTex;
    }
  };

  function handleSkyColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSkyColor({ ...skyColor, [e.target.name]: parseFloat(e.target.value) });
  }
  
  function handleCloudColorChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCloudColor({ ...cloudColor, [e.target.name]: parseFloat(e.target.value) });
  }
  
  function handleReset() {
    setSkyColor({ r: 0.2, g: 0.35, b: 0.7 });
    setCloudColor({ r: 0.95, g: 0.95, b: 0.95 });
    setAmplitude(1.0);
    setNumOctaves(12);
  }

  return (
    <Box sx={{ mt: 2, mb: 2, p: 1, border: '1px solid #2196F3', borderRadius: 1, background: '#e3f2fd' }}>
      <Typography variant="subtitle1" color="primary">Skybox Controls</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <>
        <Typography variant="subtitle2" sx={{ mt: 1 }}>Sky Color (Background)</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">R</Typography>
          <input type="range" min="0" max="1" step="0.01" name="r" value={skyColor.r} onChange={handleSkyColorChange} style={{ flex: 1 }} />
          <Typography variant="caption">G</Typography>
          <input type="range" min="0" max="1" step="0.01" name="g" value={skyColor.g} onChange={handleSkyColorChange} style={{ flex: 1 }} />
          <Typography variant="caption">B</Typography>
          <input type="range" min="0" max="1" step="0.01" name="b" value={skyColor.b} onChange={handleSkyColorChange} style={{ flex: 1 }} />
        </Stack>

        <Typography variant="subtitle2" sx={{ mt: 2 }}>Cloud Color (Cloud Shapes)</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">R</Typography>
          <input type="range" min="0" max="1" step="0.01" name="r" value={cloudColor.r} onChange={handleCloudColorChange} style={{ flex: 1 }} />
          <Typography variant="caption">G</Typography>
          <input type="range" min="0" max="1" step="0.01" name="g" value={cloudColor.g} onChange={handleCloudColorChange} style={{ flex: 1 }} />
          <Typography variant="caption">B</Typography>
          <input type="range" min="0" max="1" step="0.01" name="b" value={cloudColor.b} onChange={handleCloudColorChange} style={{ flex: 1 }} />
        </Stack>

        <Typography variant="subtitle2" sx={{ mt: 2 }}>Amplitude (Contrast)</Typography>
        <input type="range" min="0.1" max="5" step="0.01" value={amplitude} onChange={e => setAmplitude(parseFloat(e.target.value))} style={{ width: '100%' }} />
        <Typography variant="caption">{amplitude.toFixed(2)}</Typography>

        <Typography variant="subtitle2" sx={{ mt: 2 }}>Cloud Detail (numOctaves)</Typography>
        <input type="range" min="1" max="12" step="1" value={numOctaves} onChange={e => setNumOctaves(parseInt(e.target.value, 10))} style={{ width: '100%' }} />
        <Typography variant="caption">{numOctaves}</Typography>
        <Stack direction="row" spacing={2}>
          <Button onClick={applySkyboxColors} size="small" variant="contained" color="primary">Apply</Button>
          <Button onClick={handleReset} size="small" variant="outlined">Reset Skybox Colors</Button>
        </Stack>
        </>
      </Box>
    </Box>
  );
}

function FpsCounter(): JSX.Element {
  const fps = useBabylonFps();
  return (
    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, ml: 2 }} title="Frames Per Second">{fps} FPS</Typography>
  );
}

export default function DebugPanel({ 
  problemQueue, 
  soundManager, 
  handleRightAnswer, 
  handleWrongAnswer, 
  correctBlocks, 
  setCorrectBlocks, 
  score, 
  structureBlocks, 
  onClose 
}: DebugPanelProps): JSX.Element {
  const [freeSceneRotation, setFreeSceneRotation] = React.useState(!!((window as any).enableFreeSceneRotation));

  // Keep local state in sync if toggled from elsewhere
  React.useEffect(() => {
    function syncFromGlobal() {
      setFreeSceneRotation(!!((window as any).enableFreeSceneRotation));
    }
    window.addEventListener('freeSceneRotationToggled', syncFromGlobal);
    return () => window.removeEventListener('freeSceneRotationToggled', syncFromGlobal);
  }, []);
  
  const [dragging, setDragging] = useState<boolean>(false);
  const [pos, setPos] = useState<Position>({ x: window.innerWidth - 520, y: 40 });
  const dragOffset = useRef<DragOffset>({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y
    };
    document.body.style.userSelect = 'none';
  }
  
  const onMouseUp = React.useCallback(() => {
    setDragging(false);
    document.body.style.userSelect = '';
  }, []);

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 420, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y)),
    });
  }, [dragging]);

  // Attach/remove drag listeners
  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, onMouseMove, onMouseUp]);
  
  return (
    <Paper
      ref={panelRef}
      elevation={6}
      sx={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 1200,
        minWidth: 380,
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 2,
        p: 2,
        bgcolor: 'background.paper',
        cursor: dragging ? 'move' : 'default',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1} onMouseDown={onMouseDown} sx={{ cursor: 'move', bgcolor: '#1976d2', color: 'white', borderRadius: '12px 12px 0 0', p: '10px 16px', fontWeight: 'bold', userSelect: 'none' }}>
        <Typography fontWeight="bold">Debug Panel</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <FpsCounter />
        </Box>
        <IconButton onClick={onClose} size="small" title="Close" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Stack>
      {/* Free Scene Rotation Toggle */}
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography>Free Scene Rotation</Typography>
        <Switch
          checked={freeSceneRotation}
          onChange={e => {
            setFreeSceneRotation(e.target.checked);
            (window as any).enableFreeSceneRotation = e.target.checked;
            window.dispatchEvent(new CustomEvent('freeSceneRotationToggled'));
          }}
          color="primary"
        />
      </Stack>
      {/* Awarded Block Types Display */}
      <Box mt={2} mb={2}>
        <Typography variant="subtitle1" gutterBottom>Block Awards (Live)</Typography>
        <AwardedBlocksDisplay />
        <LightingControls />
        <SkyboxControls />
        <TerrainControls
          getGroundMaterial={() => {
            // Access ground material via Babylon.js scene global
            const scene = (window as any).babylonScene;
            if (scene && scene.meshes) {
              const ground = scene.meshes.find((m: BABYLON.Mesh) => m.name === 'ground');
              return ground?.material || null;
            }
            return null;
          }}
          onTerrainChange={({ amplitude, frequency }: { amplitude: number, frequency: number }) => {
            // Update terrain amplitude/frequency via Babylon.js scene global
            const scene = (window as any).babylonScene;
            if (scene && scene.meshes) {
              const ground = scene.meshes.find((m: BABYLON.Mesh) => m.name === 'ground');
              if (ground && ground.metadata && typeof ground.metadata.updateTerrain === 'function') {
                ground.metadata.updateTerrain({ amplitude, frequency });
              }
            }
          }}
        />
      </Box>
      {/* Sound Testing Section */}
      <Stack direction="column" spacing={2} mb={2}>
        <Typography variant="h6" color="#1976d2">Sound Testing</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => soundManager.play('correct')}>Play Default</Button>
          <Button onClick={() => soundManager.stop('correct')}>Stop</Button>
          <Button onClick={() => soundManager.mute('correct')}>Mute</Button>
          <Button onClick={() => soundManager.unmute('correct')}>Unmute</Button>
        </Stack>
        <Button onClick={() => handleRightAnswer()}>Test handleRightAnswer (Correct Sound)</Button>
        <Button variant="contained" color="error" onClick={() => handleWrongAnswer()}>Test handleWrongAnswer (Wrong Sound)</Button>
        <form onSubmit={e => {e.preventDefault();}}>
          <Stack direction="column" spacing={1}>
            <Typography fontWeight="bold">Advanced Play Options:</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography>Offset</Typography>
              <input id="offset" type="number" step={0.1} min="0" defaultValue={0} />
              <Typography>Length</Typography>
              <input id="length" type="number" step={0.1} min="0" defaultValue={0} />
              <Typography>Volume</Typography>
              <input id="volume" type="number" step={0.1} min="0" max="1" defaultValue={1} />
            </Stack>
            <Button onClick={() => {
              const offsetEl = document.getElementById('offset') as HTMLInputElement;
              const lengthEl = document.getElementById('length') as HTMLInputElement;
              const volumeEl = document.getElementById('volume') as HTMLInputElement;
              
              const offset = parseFloat(offsetEl?.value || '0') || 0;
              const duration = parseFloat(lengthEl?.value || '0') || 0;
              const volume = parseFloat(volumeEl?.value || '1');
              
              // Babylon.js v8+ bug workaround: don't call play(0, duration)
              if (offset > 0) {
                soundManager.play('correct', {
                  offset,
                  duration,
                  volume: isNaN(volume) ? undefined : volume
                });
              } else if (duration > 0) {
                soundManager.play('correct', {
                  duration,
                  volume: isNaN(volume) ? undefined : volume
                });
              } else {
                soundManager.play('correct', {
                  volume: isNaN(volume) ? undefined : volume
                });
              }
            }}>Play With Options</Button>
          </Stack>
        </form>
      </Stack>
      <hr style={{ margin: '18px 0' }} />
      {/* Problem Queue & Other Testing Section */}
      <Stack spacing={1} mb={2}>
        <Typography variant="h6" color="#1976d2">
          Problem Queue & Other Testing
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button onClick={() => window.dispatchEvent(new CustomEvent('showCorrectFeedback'))}>
            Show Correct Feedback
          </Button>
          <Button onClick={() => window.dispatchEvent(new CustomEvent('showWrongFeedback'))}>
            Show Wrong Feedback
          </Button>
          <Button
            onClick={() =>
              window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { delta: 1 } }))
            }
          >
            +1 Score
          </Button>
          <Button
            onClick={() =>
              window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { delta: -1 } }))
            }
          >
            -1 Score
          </Button>
          <Button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('structureUpdated', { detail: { action: 'addBlock' } })
              )
            }
          >
            Add Structure Block
          </Button>
          <Button
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('structureUpdated', { detail: { action: 'removeBlock' } })
              )
            }
          >
            Remove Structure Block
          </Button>
          <Button variant="contained" color="success" onClick={() => window.location.reload()}>
            Simulate Session Complete
          </Button>
        </Stack>
        <Typography fontWeight="bold">Queue length: {problemQueue.length}</Typography>
        <ol style={{ paddingLeft: 18 }}>
          {problemQueue.map((p, idx) => (
            <li key={p.id + '-' + idx} style={{ marginBottom: 8 }}>
              <Typography>
                <strong>id:</strong> {p.id} <strong>question:</strong> {p.question}
              </Typography>
              <Typography>
                <strong>correctStreak:</strong> {p.correctStreak}{' '}
                <strong>mistakeCount:</strong> {p.mistakeCount}
              </Typography>
              <Typography>
                <strong>answer:</strong> {p.answer}{' '}
                <strong>choices:</strong> [{p.choices && p.choices.join(', ')}]
              </Typography>
              <div style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
                <strong>history:</strong>{' '}
                {p.history && p.history.length ? (
                  <ul style={{ margin: '2px 0 0 16px' }}>
                    {p.history.map((h: any, i: number) => (
                      <li key={i} style={{ color: h.correct ? '#4CAF50' : '#F44336' }}>
                        {new Date(h.timestamp).toLocaleTimeString()}: {h.answer}{' '}
                        {h.correct ? '✅' : '❌'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  '[]'
                )}
              </div>
            </li>
          ))}
        </ol>
        <Stack spacing={1} mt={2}>
          <Typography fontWeight="bold">
            Correct Blocks Awarded: <span id="correct-blocks-count">{correctBlocks}</span>
          </Typography>
          <Typography fontWeight="bold">
            Score: <span id="score-value">{score}</span>
          </Typography>
          <Typography fontWeight="bold">
            Structure Blocks: <span id="structure-blocks-count">{structureBlocks}</span>
          </Typography>
          <Button
            onClick={() => {
              (window as any).correctBlocks = 0;
              setCorrectBlocks(0);
              window.dispatchEvent(new CustomEvent('correctBlocksUpdated', { detail: { count: 0 } }));
            }}
          >
            Reset Correct Blocks
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

// Button to open the debug panel (default hidden)
export function DebugPanelToggle({ onClick }: DebugPanelToggleProps): JSX.Element {
  return (
    <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1201 }}>
      <Button variant="contained" color="primary" onClick={onClick} sx={{ borderRadius: 2, fontWeight: 'bold', fontSize: 16, p: '10px 18px', boxShadow: 3 }}>
        Show Debug Panel
      </Button>
    </Box>
  );
}
