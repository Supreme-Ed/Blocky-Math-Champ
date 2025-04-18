import React from 'react';

import PropTypes from 'prop-types';

import { useState, useRef } from 'react';

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
  function onMouseUp() {
    setDragging(false);
    document.body.style.userSelect = '';
  }
  function onMouseMove(e) {
    if (!dragging) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 420, e.clientX - dragOffset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 80, e.clientY - dragOffset.current.y)),
    });
  }
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
  }, [dragging]);
  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 1200,
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid #ccc',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        minWidth: 380,
        maxWidth: 480,
        maxHeight: '90vh',
        overflowY: 'auto',
        fontSize: '0.98em',
        padding: 0,
      }}
    >
      <div
        style={{
          cursor: 'move',
          background: '#1976d2',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          padding: '10px 16px',
          fontWeight: 'bold',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onMouseDown={onMouseDown}
      >
        <span>Debug Panel</span>
        <button
          style={{
            background: 'transparent',
            border: 'none',
            color: 'white',
            fontWeight: 'bold',
            fontSize: 22,
            cursor: 'pointer',
            marginLeft: 10,
            lineHeight: 1,
          }}
          onClick={onClose}
          title="Close"
        >×</button>
      </div>
      <div style={{padding: 18}}>
        {/* Sound Testing Section */}
        <div style={{marginBottom:16}}>
          <h4 style={{margin:'0 0 10px 0',color:'#1976d2'}}>Sound Testing</h4>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <button onClick={() => soundManager.play('correct')}>Play Default</button>
            <button onClick={() => soundManager.stop('correct')}>Stop</button>
            <button onClick={() => soundManager.mute('correct')}>Mute</button>
            <button onClick={() => soundManager.unmute('correct')}>Unmute</button>
          </div>
          <button style={{marginBottom:12}} onClick={() => handleRightAnswer()}>Test handleRightAnswer (Correct Sound)</button>
          <button style={{marginBottom:12,background:'#F44336',color:'white',fontWeight:'bold'}} onClick={() => handleWrongAnswer()}>Test handleWrongAnswer (Wrong Sound)</button>
          <form style={{display:'flex',flexDirection:'column',gap:4,marginBottom:6}} onSubmit={e => {e.preventDefault();}}>
            <label style={{fontWeight:'bold'}}>Advanced Play Options:</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <span>Offset</span>
              <input id="offset" type="number" step={0.1} min="0" style={{width:48}} defaultValue={0} />
              <small style={{color: 'gray'}}>Note: Babylon.js has a limitation where offset values between 0 and 0.1 are not supported.</small>
              <span>Length</span>
              <input id="length" type="number" step={0.1} min="0" style={{width:48}} defaultValue={0} />
              <span>Volume</span>
              <input id="volume" type="number" step={0.1} min="0" max="1" style={{width:48}} defaultValue={1} />
            </div>
            <button style={{marginTop:8}} onClick={() => {
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
            }}>Play With Options</button>
          </form>
        </div>
        <hr style={{margin:'18px 0'}} />
        {/* Problem Queue & Other Testing Section */}
        <div style={{marginBottom:12}}>
          <h4 style={{margin:'0 0 10px 0',color:'#1976d2'}}>Problem Queue & Other Testing</h4>
          <div style={{display:'flex', flexWrap:'wrap', gap:8, marginBottom:12}}>
            <button onClick={() => window.dispatchEvent(new CustomEvent('showCorrectFeedback'))}>Show Correct Feedback</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('showWrongFeedback'))}>Show Wrong Feedback</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { delta: 1 } }))}>+1 Score</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { delta: -1 } }))}>-1 Score</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('structureUpdated', { detail: { action: 'addBlock' } }))}>Add Structure Block</button>
            <button onClick={() => window.dispatchEvent(new CustomEvent('structureUpdated', { detail: { action: 'removeBlock' } }))}>Remove Structure Block</button>
            <button style={{background:'#4CAF50',color:'white',fontWeight:'bold'}} onClick={() => window.location.reload()}>Simulate Session Complete</button>
          </div>
          <div style={{fontWeight:'bold',marginBottom:8}}>
            Queue length: {problemQueue.length}
          </div>
          <ol style={{paddingLeft:18}}>
            {problemQueue.map((p, idx) => (
              <li key={p.id + '-' + idx} style={{marginBottom:8}}>
                <div><strong>id:</strong> {p.id} <strong>question:</strong> {p.question}</div>
                <div><strong>correctStreak:</strong> {p.correctStreak} <strong>mistakeCount:</strong> {p.mistakeCount}</div>
                <div><strong>answer:</strong> {p.answer} <strong>choices:</strong> [{p.choices && p.choices.join(', ')}]</div>
                <div style={{fontSize:'0.92em',color:'#888'}}><strong>history:</strong> {p.history && p.history.length ? (
                  <ul style={{margin:'2px 0 0 16px'}}>
                    {p.history.map((h, i) => (
                      <li key={i} style={{color: h.correct ? '#4CAF50' : '#F44336'}}>
                        {new Date(h.timestamp).toLocaleTimeString()}: {h.answer} {h.correct ? '✅' : '❌'}
                      </li>
                    ))}
                  </ul>
                ) : '[]'}</div>
              </li>
            ))}
          </ol>
          <div style={{marginTop:12}}>
            <div style={{marginBottom:8,fontWeight:'bold'}}>Correct Blocks Awarded: <span id="correct-blocks-count">{correctBlocks}</span></div>
            <div style={{marginBottom:8,fontWeight:'bold'}}>Score: <span id="score-value">{score}</span></div>
            <div style={{marginBottom:8,fontWeight:'bold'}}>Structure Blocks: <span id="structure-blocks-count">{structureBlocks}</span></div>
            <button style={{marginBottom:8}} onClick={() => {
              window.correctBlocks = 0;
              setCorrectBlocks(0);
              window.dispatchEvent(new CustomEvent('correctBlocksUpdated', { detail: { count: 0 } }));
            }}>Reset Correct Blocks</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Button to open the debug panel (default hidden)
export function DebugPanelToggle({ onClick }) {
  return (
    <button
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1201,
        background: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: '10px 18px',
        fontWeight: 'bold',
        fontSize: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      Show Debug Panel
    </button>
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
};
