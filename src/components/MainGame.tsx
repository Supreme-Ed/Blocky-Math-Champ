import React, { useRef, useState } from 'react';
import useBabylonScene from './hooks/useBabylonScene';
import soundManager from '../game/soundManager';
import { handleRightAnswer } from '../game/rightAnswerHandler';
import { handleWrongAnswer } from '../game/wrongAnswerHandler';

import useGameUIState from './hooks/useGameUIState';
import useGameState from './hooks/useGameState';
import useGameEventListeners from './hooks/useGameEventListeners';

import DebugPanel, { DebugPanelToggle } from './DebugPanel';
import ProblemDisplay from './ProblemDisplay';
import SessionReview from './SessionReview';
import FeedbackBanner from './FeedbackBanner';
import BabylonSceneContent from './BabylonSceneContent';

import styles from './MainGame.module.css';
import { MathProblem, ExtendedMathProblem, Avatar } from '../types/game';
import { Scene, AbstractMesh } from '@babylonjs/core';

interface MainGameProps {
  problems: MathProblem[];
  avatar?: Avatar | null;
  onReturnToStart: () => void;
}

interface AnswerSelectionParams {
  mesh: AbstractMesh;
  answer: number | string;
  blockTypeId: string;
}

function MainGame({ problems, avatar, onReturnToStart }: MainGameProps) {
  // Modular Babylon.js scene/engine setup
  // Persistent Babylon.js engine/scene/canvas setup
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null); // Always stable
  const [sceneReady, setSceneReady] = useState(false);

  // Only set up engine/scene once
  const onSceneReady = async ({ scene }: { scene: Scene }) => {
    await soundManager.preload(scene);
    sceneRef.current = scene;
    setSceneReady(true);
  };

  useBabylonScene(canvasRef, onSceneReady, undefined, sceneRef as React.RefObject<Scene>);

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

  // Store last wrong problem for the snackbar
  const [lastWrongProblem, setLastWrongProblem] = useState<ExtendedMathProblem | null>(null);

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
    sessionId,
  } = useGameState(problems);

  // --- Window Event Listeners (modularized) ---
  useGameEventListeners({ setShowFeedback, setShowWrongFeedback, setScore, setStructureBlocks });

  // Handles user answer selection
  function onUserAnswer({ mesh, answer, blockTypeId }: AnswerSelectionParams) {
    const isCorrect = handleAnswer(answer);
    if (isCorrect === true) {
      handleRightAnswer({ mesh, blockTypeId });
      setLastWrongProblem(null);
    } else if (isCorrect === false) {
      handleWrongAnswer({ mesh, blockTypeId });
      setLastWrongProblem(currentProblem || null);
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
          currentProblem={currentProblem || null}
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
          selectedAvatar={avatar}
          resetKey={sessionId}
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

export default MainGame;
