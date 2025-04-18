import { useState } from 'react';
import { processAnswer } from '../../game/problemQueueManager.js';

// Mastery threshold for all problems (move here from MainGame)
const MASTERY_THRESHOLD = 3;

/**
 * Custom hook to manage game state and problem queue logic for MainGame.
 * @param {Array} problems - Initial set of problems
 * @returns {Object} State and handlers for game logic
 */
export default function useGameState(problems) {
  // Problem queue and progression
  const [problemQueue, setProblemQueue] = useState(() =>
    problems && problems.length > 0
      ? problems.map((p, i) => ({ ...p, mistakeCount: 0, correctStreak: 0, history: [], id: p.id || i }))
      : []
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [mistakesLog, setMistakesLog] = useState([]); // For end-of-session review
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [structureBlocks, setStructureBlocks] = useState(0);

  const currentProblem = problemQueue[currentIdx];

  function handleAnswer(choice) {
    if (!currentProblem || answered) return;
    const { newQueue, isCorrect, newMistakesLog } = processAnswer({
      queue: problemQueue,
      idx: currentIdx,
      choice,
      masteryThreshold: MASTERY_THRESHOLD,
      mistakesLog,
    });
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
        if (typeof window !== 'undefined') window.correctBlocks = 0;
      }
    }, 1200);
    return isCorrect;
  }

  function resetSession() {
    setProblemQueue(
      problems && problems.length > 0
        ? problems.map((p, i) => ({ ...p, mistakeCount: 0, correctStreak: 0, history: [], id: p.id || i }))
        : []
    );
    setCurrentIdx(0);
    setAnswered(false);
    setMistakesLog([]);
    setSessionComplete(false);
    setScore(0);
    setStructureBlocks(0);
    if (typeof window !== 'undefined') window.correctBlocks = 0;
  }

  return {
    problemQueue,
    currentIdx,
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
    MASTERY_THRESHOLD,
  };
}
