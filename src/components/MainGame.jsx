import React, { useRef, useEffect } from 'react';
import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import soundManager from '../game/soundManager.js';
import { handleRightAnswer } from '../game/rightAnswerHandler.js';
import { handleWrongAnswer } from '../game/wrongAnswerHandler.js';
import gameEngine from '../game/gameEngine.js';

import { useState } from 'react';
import { processAnswer } from '../game/problemQueueManager.js';
// Sample problems for testing
const sampleProblems = [
  { id: 1, question: '2 + 2 = ?', choices: [3, 4, 5], answer: 4 },
  { id: 2, question: '5 - 3 = ?', choices: [1, 2, 3], answer: 2 },
  { id: 3, question: '3 x 3 = ?', choices: [6, 8, 9], answer: 9 },
  { id: 4, question: '8 / 2 = ?', choices: [2, 4, 6], answer: 4 },
  { id: 5, question: '7 + 5 = ?', choices: [12, 13, 14], answer: 12 },
  { id: 6, question: '10 - 7 = ?', choices: [2, 3, 4], answer: 3 },
].map(p => ({ ...p, mistakeCount: 0, correctStreak: 0, history: [] }));

export default function MainGame() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);

  useEffect(() => {
    const run = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
      engineRef.current = engine;

      const scene = new BABYLON.Scene(engine);
      sceneRef.current = scene;

      // Preload sounds and ensure audio engine is ready before proceeding
      await soundManager.preload(scene);
      console.log('[MainGame] Audio engine and sounds ready');

      // Example: add a simple camera and light
      const camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 2, 8, BABYLON.Vector3.Zero(), scene);
      camera.attachControl(canvas, true);


      engine.runRenderLoop(() => {
        if (scene) scene.render();
      });

      // Cleanup
      return () => {
        engine.stopRenderLoop();
        scene.dispose();
        engine.dispose();
      };
    };
    run();
    // No dependencies: run once on mount
  }, []);

  const [correctBlocks, setCorrectBlocks] = useState(typeof window !== 'undefined' && window.correctBlocks ? window.correctBlocks : 0);

  // Listen for global correctBlocksUpdated event
  React.useEffect(() => {
    function updateCount(e) {
      setCorrectBlocks(e.detail.count);
    }
    window.addEventListener('correctBlocksUpdated', updateCount);
    return () => window.removeEventListener('correctBlocksUpdated', updateCount);
  }, []);

  const [showFeedback, setShowFeedback] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [structureBlocks, setStructureBlocks] = useState(0);

  // Math problem state
  const [problemQueue, setProblemQueue] = useState([...sampleProblems]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const currentProblem = problemQueue[currentIdx];
  const [answered, setAnswered] = useState(false);
  const [mistakesLog, setMistakesLog] = useState([]); // For end-of-session review
  const [sessionComplete, setSessionComplete] = useState(false);

  // Mastery threshold for all problems
  const MASTERY_THRESHOLD = 3;

  function handleAnswer(choice) {
    if (!currentProblem || answered) return;
    // Use modularized logic
    const { newQueue, isCorrect, newMistakesLog } = processAnswer({
      queue: problemQueue,
      idx: currentIdx,
      choice,
      masteryThreshold: MASTERY_THRESHOLD,
      mistakesLog,
    });
    gameEngine.handleAnswerSelection({ isCorrect, problem: currentProblem });
    setAnswered(true);
    setTimeout(() => {
      if (newQueue.length > 0) {
        setProblemQueue(newQueue);
        setMistakesLog(newMistakesLog);
        setCurrentIdx(idx => Math.min(idx, newQueue.length - 1));
        setAnswered(false);
      } else {
        setMistakesLog(newMistakesLog);
        setSessionComplete(true);
        setAnswered(false);
        setScore(0);
        setStructureBlocks(0);
        window.correctBlocks = 0;
      }
    }, 1200);
  }

  // Listen for feedback UI events and game state events
  React.useEffect(() => {
    function showFeedbackHandler() {
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1000);
    }
    function showWrongFeedbackHandler() {
      setShowWrongFeedback(true);
      setTimeout(() => setShowWrongFeedback(false), 1000);
    }
    function scoreUpdatedHandler(e) {
      setScore(prev => prev + (e.detail?.delta || 0));
    }
    function structureUpdatedHandler(e) {
      if (e.detail?.action === 'addBlock') setStructureBlocks(prev => prev + 1);
      if (e.detail?.action === 'removeBlock') setStructureBlocks(prev => Math.max(prev - 1, 0));
    }
    window.addEventListener('showCorrectFeedback', showFeedbackHandler);
    window.addEventListener('showWrongFeedback', showWrongFeedbackHandler);
    window.addEventListener('scoreUpdated', scoreUpdatedHandler);
    window.addEventListener('structureUpdated', structureUpdatedHandler);
    return () => {
      window.removeEventListener('showCorrectFeedback', showFeedbackHandler);
      window.removeEventListener('showWrongFeedback', showWrongFeedbackHandler);
      window.removeEventListener('scoreUpdated', scoreUpdatedHandler);
      window.removeEventListener('structureUpdated', structureUpdatedHandler);
    };
  }, []);

  return (
    <>
      {/* Math Problem Display (fixed at top center) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: 'white',
          borderBottom: '2px solid #2196F3',
          borderRadius: '0 0 16px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
          maxWidth: 520,
          width: '90vw',
          margin: '0 auto',
          padding: '14px 20px 10px 20px', // less vertical padding
          textAlign: 'center'
        }}
      >
        <div style={{fontWeight:'bold', fontSize:22, marginBottom:12}}>Solve:</div>
        {currentProblem ? (
          <>
            <div style={{fontSize:20, marginBottom:14}}>{currentProblem.question}</div>
            <div style={{display:'flex', justifyContent:'center', gap:16, marginBottom:8}}>
              {currentProblem.choices.map((choice, i) => (
                <button
                  key={i}
                  style={{
                    minWidth:60,
                    padding:'10px 20px',
                    fontSize:18,
                    borderRadius:8,
                    background: answered ? (choice === currentProblem.answer ? '#4CAF50' : '#F44336') : '#2196F3',
                    color: 'white',
                    opacity: answered && choice !== currentProblem.answer ? 0.7 : 1,
                    pointerEvents: answered ? 'none' : 'auto',
                    border:'none',
                    cursor:'pointer',
                    fontWeight:'bold',
                    transition:'background 0.2s, opacity 0.2s'
                  }}
                  onClick={() => handleAnswer(choice)}
                  disabled={answered}
                >
                  {choice}
                </button>
              ))}
            </div>
            {answered && (
              <div style={{marginTop:10, fontWeight:'bold', color:'#333'}}>
                {`The answer is ${currentProblem.answer}.`}
              </div>
            )}
          </>
        ) : (
          <div>All problems complete!</div>
        )}
      </div>

      {sessionComplete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.75)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            padding: 32,
            maxWidth: 600,
            width: '90vw',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
          }}>
            <h2 style={{marginTop:0}}>Session Review</h2>
            {mistakesLog.length === 0 ? (
              <div style={{fontWeight:'bold', color:'#4CAF50'}}>No mistakes! Perfect session!</div>
            ) : (
              <>
                <div style={{marginBottom:12, fontWeight:'bold'}}>Problems you missed (with answer history):</div>
                <ul style={{paddingLeft:18}}>
                  {mistakesLog.map((m, idx) => (
                    <li key={idx} style={{marginBottom:12}}>
                      <div><strong>Q:</strong> {m.question}</div>
                      <div><strong>Mistakes:</strong> {m.mistakeCount}</div>
                      <div><strong>Correct answer:</strong> <span style={{color:'#4CAF50'}}>{m.answer ?? '[unknown]'}</span></div>
                      <div style={{fontSize:'0.95em',marginTop:4}}>
                        <strong>Answer history:</strong>
                        <ul style={{margin:'4px 0 0 16px'}}>
                          {m.history.map((h, i) => (
                            <li key={i} style={{color: h.correct ? '#4CAF50' : '#F44336'}}>
                              {new Date(h.timestamp).toLocaleTimeString()}: <strong>{h.answer}</strong> {h.correct ? '✅' : <span style={{color:'#F44336'}}>❌ (incorrect, should be {m.answer ?? '[unknown]'})</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button style={{marginTop:24, padding:'10px 24px', fontWeight:'bold', borderRadius:8, background:'#4CAF50', color:'white', fontSize:18}} onClick={() => window.location.reload()}>Play Again</button>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />

      {/* Debug: Problem Queue Inspector */}
      <div style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 1200,
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid #ccc',
        borderRadius: 12,
        padding: 18,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        minWidth: 380,
        maxHeight: '80vh',
        overflowY: 'auto',
        fontSize: '0.98em',
      }}>
        <h3 style={{marginTop:0,marginBottom:8}}>Problem Queue Debug</h3>
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
      </div>

      {/* Sound Test Panel */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 20,
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid #ccc',
          borderRadius: 12,
          padding: 18,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          minWidth: 320
        }}
      >
        <h3 style={{marginTop:0}}>Sound Test Panel</h3>
        {showFeedback && (
          <div style={{
            background: '#4CAF50', color: 'white', fontWeight: 'bold', fontSize: 20,
            padding: '8px 0', borderRadius: 8, textAlign: 'center', marginBottom: 8,
            boxShadow: '0 2px 8px rgba(76,175,80,0.2)'
          }}>Correct!</div>
        )}
        {showWrongFeedback && (
          <div style={{
            background: '#F44336', color: 'white', fontWeight: 'bold', fontSize: 20,
            padding: '8px 0', borderRadius: 8, textAlign: 'center', marginBottom: 8,
            boxShadow: '0 2px 8px rgba(244,67,54,0.2)'
          }}>Wrong!</div>
        )}
        <button style={{marginBottom:8,background:'#4CAF50',color:'white',fontWeight:'bold'}} onClick={() => {
          window.dispatchEvent(new CustomEvent('showCorrectFeedback'));
        }}>Test Feedback UI</button>
        <button style={{marginBottom:8,background:'#F44336',color:'white',fontWeight:'bold'}} onClick={() => {
          window.dispatchEvent(new CustomEvent('showWrongFeedback'));
        }}>Test Wrong Feedback UI</button>
        <div style={{marginBottom:8,fontWeight:'bold'}}>Correct Blocks Awarded: <span id="correct-blocks-count">{correctBlocks}</span></div>
        <div style={{marginBottom:8,fontWeight:'bold'}}>Score: <span id="score-value">{score}</span></div>
        <div style={{marginBottom:8,fontWeight:'bold'}}>Structure Blocks: <span id="structure-blocks-count">{structureBlocks}</span></div>
        <button style={{marginBottom:8}} onClick={() => {
          window.correctBlocks = 0;
          setCorrectBlocks(0);
          window.dispatchEvent(new CustomEvent('correctBlocksUpdated', { detail: { count: 0 } }));
        }}>Reset Correct Blocks</button>
        <div style={{display:'flex',gap:8,marginBottom:8}}>
          <button onClick={() => soundManager.play('correct')}>Play Default</button>
          <button onClick={() => soundManager.stop('correct')}>Stop</button>
          <button onClick={() => soundManager.mute('correct')}>Mute</button>
          <button onClick={() => soundManager.unmute('correct')}>Unmute</button>
        </div>
        <button style={{marginBottom:12}} onClick={() => handleRightAnswer()}>Test handleRightAnswer (Correct Sound)</button>
        <button style={{marginBottom:12,background:'#F44336',color:'white',fontWeight:'bold'}} onClick={() => handleWrongAnswer()}>Test handleWrongAnswer (Wrong Sound)</button>
        <form style={{display:'flex',flexDirection:'column',gap:4}} onSubmit={e => {e.preventDefault();}}>
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
          <div style={{display:'flex',gap:8,alignItems:'center'}}>

          </div>
          <button style={{marginTop:8}} onClick={() => {
            const offset = parseFloat(document.getElementById('offset').value) || 0;
            const duration = parseFloat(document.getElementById('length').value) || 0;
            const volume = parseFloat(document.getElementById('volume').value);
            soundManager.play('correct', {
              offset,
              duration,
              volume: isNaN(volume) ? undefined : volume
            });
          }}>Play With Options</button>
        </form>
      </div>
    </>
  );
}
