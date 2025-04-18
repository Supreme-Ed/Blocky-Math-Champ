import React, { useRef } from 'react';
import useBabylonScene from './hooks/useBabylonScene.js';
import soundManager from '../game/soundManager.js';
import { handleRightAnswer } from '../game/rightAnswerHandler.js';
import { handleWrongAnswer } from '../game/wrongAnswerHandler.js';


import { useState } from 'react';
import useGameState from './hooks/useGameState.js';

import DebugPanel, { DebugPanelToggle } from './DebugPanel.jsx';
import ProblemDisplay from './ProblemDisplay.jsx';
import SessionReview from './SessionReview.jsx';
import PropTypes from 'prop-types';

export default function MainGame({ problems }) {
  const canvasRef = useRef(null);
  // Modular Babylon.js scene/engine setup
  const onSceneReady = async ({ scene }) => {
    await soundManager.preload(scene);
    console.log('[MainGame] Audio engine and sounds ready');
    // You can add additional scene setup here if needed
  };
  useBabylonScene(canvasRef, onSceneReady);


MainGame.propTypes = {
  problems: PropTypes.array,
};

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

  // Debug panel visibility
  const [showDebug, setShowDebug] = useState(false);

  // Modularized game state and logic
  const {
    problemQueue,
    currentProblem,
    answered,
    sessionComplete,
    mistakesLog,
    handleAnswer,
    score,
    setScore,
    structureBlocks,
    setStructureBlocks,
    resetSession,
  } = useGameState(problems);

  // Handles user answer selection
  function onUserAnswer(choice) {
    const isCorrect = handleAnswer(choice);
    if (isCorrect === true) {
      handleRightAnswer();
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1000);
    } else if (isCorrect === false) {
      handleWrongAnswer();
      setShowWrongFeedback(true);
      setTimeout(() => setShowWrongFeedback(false), 1000);
    }
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
        <ProblemDisplay
          currentProblem={currentProblem}
          answered={answered}
          onUserAnswer={onUserAnswer}
        />
      </div>

      <SessionReview
        sessionComplete={sessionComplete}
        mistakesLog={mistakesLog}
        resetSession={resetSession}
      />
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />

      {/* Debug Panel (modularized, now includes sound test controls) */}
      {!showDebug && <DebugPanelToggle onClick={() => setShowDebug(true)} />}
      {showDebug && (
        <DebugPanel
          problemQueue={problemQueue}
          soundManager={soundManager}
          handleRightAnswer={handleRightAnswer}
          handleWrongAnswer={handleWrongAnswer}
          correctBlocks={correctBlocks}
          setCorrectBlocks={setCorrectBlocks}
          score={score}
          structureBlocks={structureBlocks}
          onClose={() => setShowDebug(false)}
        />
      )}

      {showFeedback && (
        <div style={{
          background: '#4CAF50', color: 'white', fontWeight: 'bold', fontSize: 20,
          borderRadius: 8, padding: '10px 24px', margin: '10px 0', display: 'inline-block', position: 'absolute', left: 24, bottom: 180,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
        }}>
          Correct!
        </div>
      )}
      {showWrongFeedback && (
        <div style={{
          background: '#F44336', color: 'white', fontWeight: 'bold', fontSize: 20,
          borderRadius: 8, padding: '10px 24px', margin: '10px 0', display: 'inline-block', position: 'absolute', left: 24, bottom: 120,
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)'
        }}>
          Wrong!
        </div>
      )}
    </>
  );
}
