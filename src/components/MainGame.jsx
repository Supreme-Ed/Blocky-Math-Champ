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

function MainGame({ problems, avatar, onReturnToStart }) {
  // Modular Babylon.js scene/engine setup
  // Persistent Babylon.js engine/scene/canvas setup
  const canvasRef = useRef(null);
  const sceneRef = useRef(null); // Always stable
  const [sceneReady, setSceneReady] = useState(false);

  // Only set up engine/scene once
  const onSceneReady = async ({ scene }) => {
    await soundManager.preload(scene);
    sceneRef.current = scene;
    setSceneReady(true);

  };
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

  // Store last wrong problem and answer for the snackbar
  const [lastWrongProblem, setLastWrongProblem] = useState(null);
  const [lastWrongAnswer, setLastWrongAnswer] = useState(null);

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
  function onUserAnswer({ mesh, answer, blockTypeId }) {
    const isCorrect = handleAnswer(answer);
    if (isCorrect === true) {
      handleRightAnswer({ mesh, blockTypeId });
      setLastWrongProblem(null);
      setLastWrongAnswer(null);
    } else if (isCorrect === false) {
      handleWrongAnswer({ mesh, blockTypeId });
      setLastWrongProblem(currentProblem);
      setLastWrongAnswer(answer);
    }
  }

  // Handler for returning to the Start Screen
  function handleReturnToStart() {
    if (typeof onReturnToStart === 'function') {
      onReturnToStart();
    }
  }

  return (
    <>
      {/* Return to Start Screen Button (upper left) */}
      <button className={styles.returnToStartBtn} onClick={handleReturnToStart}>
        ⬅ Return to Start
      </button>
      {/* Math Problem Display (fixed at top center) */}
      <div className={styles.problemHeader}>
        <div className={styles.problemTitle}>Solve:</div>
        <ProblemDisplay
          currentProblem={currentProblem}
          answered={answered}
          onUserAnswer={onUserAnswer}
        />
      </div>
      <FeedbackBanner
        show={showFeedback}
        type="correct"
        onClose={() => setShowFeedback(false)}
      />
      <FeedbackBanner
        show={showWrongFeedback}
        type="wrong"
        message={lastWrongProblem ? (() => {
          const q = lastWrongProblem.question.replace(/\?$/, '').trim();
          return q.endsWith('=') ? `WRONG!\n${q} ${lastWrongProblem.answer}` : `WRONG!\n${q} = ${lastWrongProblem.answer}`;
        })() : undefined}
        onClose={() => setShowWrongFeedback(false)}
      />

      <SessionReview
        sessionComplete={sessionComplete}
        mistakesLog={mistakesLog}
        resetSession={resetSession}
        onReturnToStart={handleReturnToStart}
      />
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: 'block' }} />
      {/* Only render BabylonSceneContent when scene is ready and sceneRef is set */}
      {sceneReady && sceneRef.current && (
        <BabylonSceneContent
          scene={sceneRef.current}
          problemQueue={problemQueue}
          onAnswerSelected={onUserAnswer}
          selectedAvatar={avatar ? { file: avatar } : null}
        />
      )}

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

    </>
  );
}
MainGame.propTypes = {
  problems: PropTypes.array.isRequired,
  avatar: PropTypes.string,
  onReturnToStart: PropTypes.func.isRequired,
};

export default MainGame;