import { useState, useEffect } from 'react';

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

  // Listen for correctBlocksUpdated events to keep React state in sync
  useEffect(() => {
    function handler(e) {
      setCorrectBlocks(e.detail?.count ?? 0);
    }
    window.addEventListener('correctBlocksUpdated', handler);
    return () => window.removeEventListener('correctBlocksUpdated', handler);
  }, []);

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
