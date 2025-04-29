import { useState } from 'react';
import { processAnswer } from '../../game/problemQueueManager';
import { MathProblem, ExtendedMathProblem } from '../../types/game';

// Mastery threshold for all problems (move here from MainGame)
const MASTERY_THRESHOLD = 3;

interface GameState {
  problemQueue: ExtendedMathProblem[];
  currentIdx: number;
  currentProblem: ExtendedMathProblem | undefined;
  answered: boolean;
  sessionComplete: boolean;
  mistakesLog: any[];
  handleAnswer: (choice: number | string) => boolean | undefined;
  score: number;
  setScore: (score: number | ((prevScore: number) => number)) => void;
  structureBlocks: number;
  setStructureBlocks: (blocks: number | ((prevBlocks: number) => number)) => void;
  resetSession: () => void;
  sessionId: number;
  MASTERY_THRESHOLD: number;
}

/**
 * Custom hook to manage game state and problem queue logic for MainGame.
 * @param problems - Initial set of problems
 * @returns State and handlers for game logic
 */
export default function useGameState(problems: MathProblem[]): GameState {
  // Problem queue and progression
  const [problemQueue, setProblemQueue] = useState<ExtendedMathProblem[]>(() =>
    problems && problems.length > 0
      ? problems.map((p, i) => ({ ...p, mistakeCount: 0, correctStreak: 0, history: [], id: p.id || i }))
      : []
  );
  const [sessionId, setSessionId] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [mistakesLog, setMistakesLog] = useState<any[]>([]); // For end-of-session review
  const [sessionComplete, setSessionComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [structureBlocks, setStructureBlocks] = useState(0);

  const currentProblem = problemQueue[currentIdx];

  function handleAnswer(choice: number | string): boolean | undefined {
    if (!currentProblem || answered) return;
    const { newQueue, isCorrect, newMistakesLog } = processAnswer({
      queue: problemQueue,
      idx: currentIdx,
      choice,
      masteryThreshold: MASTERY_THRESHOLD,
      mistakesLog,
    });
    setAnswered(true);
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
    return isCorrect;
  }

  function resetSession(): void {
    setProblemQueue(
      problems && problems.length > 0
        ? problems.map((p, i) => ({ ...p, mistakeCount: 0, correctStreak: 0, history: [], id: p.id || i }))
        : []
    );
    setSessionId(id => id + 1);
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
    sessionId,
    MASTERY_THRESHOLD,
  };
}
