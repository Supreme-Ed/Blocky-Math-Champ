import React from 'react';
import PropTypes from 'prop-types';
import { useState, useRef } from 'react';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';

export default function DebugPanel({ problemQueue, soundManager, handleRightAnswer, handleWrongAnswer, correctBlocks, setCorrectBlocks, score, structureBlocks, onClose }) {
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: window.innerWidth - 520, y: 40 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef(null);

  function onMouseDown(e) {
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

  const onMouseMove = React.useCallback((e) => {
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
        <IconButton onClick={onClose} size="small" title="Close" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Stack>
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
              const offset = parseFloat(document.getElementById('offset').value) || 0;
              const duration = parseFloat(document.getElementById('length').value) || 0;
              const volume = parseFloat(document.getElementById('volume').value);
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
      {p.history.map((h, i) => (
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
              window.correctBlocks = 0;
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
export function DebugPanelToggle({ onClick }) {
  return (
    <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1201 }}>
      <Button variant="contained" color="primary" onClick={onClick} sx={{ borderRadius: 2, fontWeight: 'bold', fontSize: 16, p: '10px 18px', boxShadow: 3 }}>
        Show Debug Panel
      </Button>
    </Box>
  );
}


DebugPanel.propTypes = {
  problemQueue: PropTypes.array.isRequired,
  soundManager: PropTypes.object.isRequired,
  handleRightAnswer: PropTypes.func.isRequired,
  handleWrongAnswer: PropTypes.func.isRequired,
  correctBlocks: PropTypes.number.isRequired,
  setCorrectBlocks: PropTypes.func.isRequired,
  score: PropTypes.number.isRequired,
  structureBlocks: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
};

DebugPanelToggle.propTypes = {
  onClick: PropTypes.func.isRequired,
};