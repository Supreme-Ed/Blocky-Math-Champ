// problemQueueManager.js
// Handles mastery threshold, spaced repetition, and mistake logging for math problems

/**
 * Processes an answer for the current problem, updating the queue and logs.
 * @param {Object[]} queue - Current problem queue
 * @param {number} idx - Index of current problem
 * @param {number|string} choice - User's answer
 * @param {number} masteryThreshold - Number of correct-in-a-row needed to master
 * @param {Array} mistakesLog - Session mistakes log
 * @returns {Object} { newQueue, updatedProblem, newMistakesLog }
 */
export function processAnswer({ queue, idx, choice, masteryThreshold, mistakesLog }) {
  const currentProblem = queue[idx];
  const isCorrect = choice === currentProblem.answer;
  const timestamp = Date.now();

  // Clone and update problem
  let updatedProblem = {
    ...currentProblem,
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
  function getRandomInterval() {
    return Math.floor(Math.random() * 5) + 2;
  }

  if (isCorrect) {
    updatedProblem.correctStreak = (currentProblem.correctStreak || 0) + 1;
    // Adaptive mastery: if first try was right (persistently tracked), require only 2 correct-in-a-row for mastery
    let requiredStreak = masteryThreshold;
    if (updatedProblem.firstTryWasCorrect === true) {
      requiredStreak = 2;
    }
    if (updatedProblem.correctStreak < requiredStreak) {
      // Reinsert at random interval
      let insertAt = Math.min(idx + getRandomInterval(), newQueue.length);
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
      mistakeCount: updatedProblem.mistakeCount,
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
