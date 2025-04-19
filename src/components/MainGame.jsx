import React, { useRef, useState } from 'react';
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
import styles from './MainGame.module.css';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function MainGame({ problems }) {
  // Modular Babylon.js scene/engine setup
  const [babylonScene, setBabylonScene] = useState(null);

  const onSceneReady = async ({ scene }) => {
    await soundManager.preload(scene);
    setBabylonScene(scene);
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
      <div className={styles.problemHeader}>
        <div className={styles.problemTitle}>Solve:</div>
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
      <BabylonSceneContent scene={babylonScene} currentProblem={currentProblem} onAnswerSelected={onUserAnswer} />

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

      <Snackbar open={showFeedback} autoHideDuration={1000} onClose={() => setShowFeedback(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" sx={{ width: '100%' }} variant="filled" onClose={() => setShowFeedback(false)}>
          Correct!
        </Alert>
      </Snackbar>
      <Snackbar open={showWrongFeedback} autoHideDuration={1000} onClose={() => setShowWrongFeedback(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="error" sx={{ width: '100%' }} variant="filled" onClose={() => setShowWrongFeedback(false)}>
          Wrong!
        </Alert>
      </Snackbar>
    </>
  );
}
MainGame.propTypes = {
  problems: PropTypes.array.isRequired,
};

export default MainGame;