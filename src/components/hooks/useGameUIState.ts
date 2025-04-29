import { useState, useEffect } from 'react';

interface GameUIState {
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
  showWrongFeedback: boolean;
  setShowWrongFeedback: (show: boolean) => void;
  showDebug: boolean;
  setShowDebug: (show: boolean) => void;
  correctBlocks: number;
  setCorrectBlocks: (blocks: number) => void;
}

interface CorrectBlocksEvent extends Event {
  detail?: {
    count?: number;
  };
}

declare global {
  interface Window {
    correctBlocks: number;
  }
}

/**
 * Custom hook to encapsulate all UI-related state for MainGame.
 * Includes feedback banners, debug panel, and correctBlocks count.
 */
export default function useGameUIState(): GameUIState {
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWrongFeedback, setShowWrongFeedback] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [correctBlocks, setCorrectBlocks] = useState(
    typeof window !== 'undefined' && window.correctBlocks ? window.correctBlocks : 0
  );

  // Listen for correctBlocksUpdated events to keep React state in sync
  useEffect(() => {
    function handler(e: CorrectBlocksEvent) {
      setCorrectBlocks(e.detail?.count ?? 0);
    }
    window.addEventListener('correctBlocksUpdated', handler as EventListener);
    return () => window.removeEventListener('correctBlocksUpdated', handler as EventListener);
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
