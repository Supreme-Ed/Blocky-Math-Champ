// problemQueueManager.ts
// Handles mastery threshold, spaced repetition, and mistake logging for math problems

import { MathProblem, ProblemHistory, ExtendedMathProblem } from '../types/game';

interface MistakeLogEntry {
  id?: string | number;
  question: string;
  mistakeCount: number;
  answer: number | string;
  history?: ProblemHistory[];
  lastAnswer: number | string;
  lastTimestamp: number;
}

interface ProcessAnswerParams {
  queue: ExtendedMathProblem[];
  idx: number;
  choice: number | string;
  masteryThreshold: number;
  mistakesLog: MistakeLogEntry[];
}

interface ProcessAnswerResult {
  newQueue: ExtendedMathProblem[];
  updatedProblem: ExtendedMathProblem;
  newMistakesLog: MistakeLogEntry[];
  isCorrect: boolean;
}

/**
 * Processes an answer for the current problem, updating the queue and logs.
 * @param params - Parameters for processing the answer
 * @returns Object containing the updated queue, problem, and mistakes log
 */
export function processAnswer({
  queue,
  idx,
  choice,
  masteryThreshold,
  mistakesLog
}: ProcessAnswerParams): ProcessAnswerResult {
  const currentProblem = queue[idx];
  const isCorrect = choice === currentProblem.answer;
  const timestamp = Date.now();

  // Clone and update problem
  let updatedProblem: ExtendedMathProblem = {
    ...currentProblem,
    choices: currentProblem.choices ? [...currentProblem.choices] : undefined, // Deep clone choices array for immutability
    history: [
      ...(currentProblem.history || []),
      { answer: choice, correct: isCorrect, timestamp },
    ],
  };

  // On first attempt, set firstTryWasCorrect
  if ((currentProblem.history?.length || 0) === 0 && updatedProblem.firstTryWasCorrect === undefined) {
    updatedProblem.firstTryWasCorrect = isCorrect;
  }

  let newQueue = [...queue];
  let newMistakesLog = mistakesLog ? [...mistakesLog] : [];

  // Remove current problem from queue
  newQueue.splice(idx, 1);

  // Helper for spaced repetition: random interval 2-6
  function getRandomInterval(): number {
    return Math.floor(Math.random() * 5) + 2;
  }

  if (isCorrect) {
    updatedProblem.correctStreak = (currentProblem.correctStreak || 0) + 1;
    // Adaptive mastery: if first try was right (persistently tracked), require only 2 correct-in-a-row for mastery
    let requiredStreak = masteryThreshold;
    if (updatedProblem.firstTryWasCorrect === true) {
      requiredStreak = 2;
    }
    if ((updatedProblem.correctStreak || 0) < requiredStreak) {
      // Reinsert at random interval
      let insertAt;
      if (newQueue.length === 0) {
        insertAt = 0; // Only one problem, must go at front
      } else {
        insertAt = Math.max(1, Math.min(idx + getRandomInterval(), newQueue.length));
      }
      newQueue.splice(insertAt, 0, updatedProblem);
    }
    // else: mastered, do not reinsert
  } else {
    updatedProblem.mistakeCount = (currentProblem.mistakeCount || 0) + 1;
    updatedProblem.correctStreak = 0;
    let insertAt = Math.min(idx + getRandomInterval(), newQueue.length);
    newQueue.splice(insertAt, 0, updatedProblem);
    // Log mistake for review
    newMistakesLog.push({
      id: updatedProblem.id,
      question: updatedProblem.question,
      mistakeCount: updatedProblem.mistakeCount || 1,
      answer: updatedProblem.answer, // Ensure correct answer is always present
      history: updatedProblem.history,
      lastAnswer: choice,
      lastTimestamp: timestamp,
    });
  }

  return {
    newQueue,
    updatedProblem,
    newMistakesLog,
    isCorrect,
  };
}
