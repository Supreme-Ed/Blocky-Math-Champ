import React, { useRef } from 'react';
import useBabylonScene from './hooks/useBabylonScene.js';
import soundManager from '../game/soundManager.js';
import { handleRightAnswer } from '../game/rightAnswerHandler.js';
import { handleWrongAnswer } from '../game/wrongAnswerHandler.js';


// import { useState } from 'react';
import useGameUIState from './hooks/useGameUIState.js';
import useGameState from './hooks/useGameState.js';
import useGameEventListeners from './hooks/useGameEventListeners.js';

import DebugPanel, { DebugPanelToggle } from './DebugPanel.jsx';
import ProblemDisplay from './ProblemDisplay.jsx';
import SessionReview from './SessionReview.jsx';
import FeedbackBanner from './FeedbackBanner.jsx';
import BabylonSceneContent from './BabylonSceneContent.jsx';

import PropTypes from 'prop-types';

function MainGame({ problems }) {
  // Modular Babylon.js scene/engine setup
  const onSceneReady = async ({ scene }) => {
    await soundManager.preload(scene);
    console.log('[MainGame] Audio engine and sounds ready');
    // You can add additional scene setup here if needed
  };
  // Set up Babylon.js engine and scene, and expose refs for content logic
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  useBabylonScene(canvasRef, onSceneReady, undefined, sceneRef);

  // --- UI State (modularized) ---
  const {
    showFeedback,
    setShowFeedback,
    showWrongFeedback,
    setShowWrongFeedback,
    showDebug,
    setShowDebug,
    correctBlocks,
    setCorrectBlocks,
  } = useGameUIState();

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

  // --- Window Event Listeners (modularized) ---
  useGameEventListeners({ setShowFeedback, setShowWrongFeedback, setScore, setStructureBlocks });

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
      <FeedbackBanner show={showFeedback} type="correct" />
      <FeedbackBanner show={showWrongFeedback} type="wrong" />

      <SessionReview
        sessionComplete={sessionComplete}
        mistakesLog={mistakesLog}
        resetSession={resetSession}
      />
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
      <BabylonSceneContent scene={sceneRef.current} />

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
MainGame.propTypes = {
  problems: PropTypes.array.isRequired,
};

export default MainGame;