import { useState } from 'react';

/**
 * Custom hook to encapsulate all UI-related state for MainGame.
 * Includes feedback banners, debug panel, and correctBlocks count.
 */
export default function useGameUIState() {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [correctBlocks, setCorrectBlocks] = useState(
    typeof window !== 'undefined' && window.correctBlocks ? window.correctBlocks : 0
  );

  return {
    showFeedback,
    setShowFeedback,
    showWrongFeedback,
    setShowWrongFeedback,
    showDebug,
    setShowDebug,
    correctBlocks,
    setCorrectBlocks,
  };
}
