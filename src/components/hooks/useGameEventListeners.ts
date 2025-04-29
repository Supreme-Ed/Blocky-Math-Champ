import { useEffect } from 'react';

interface GameEventListenersProps {
  setShowFeedback: (show: boolean) => void;
  setShowWrongFeedback: (show: boolean) => void;
  setScore: (score: number | ((prev: number) => number)) => void;
  setStructureBlocks: (blocks: number | ((prev: number) => number)) => void;
}

interface ScoreUpdatedEvent extends Event {
  detail?: {
    delta?: number;
  };
}

interface StructureUpdatedEvent extends Event {
  detail?: {
    action?: 'addBlock' | 'removeBlock';
  };
}

/**
 * Custom hook to encapsulate all window event listeners for feedback, score, and structure updates.
 * Keeps MainGame clean and event logic modular.
 */
export default function useGameEventListeners({
  setShowFeedback,
  setShowWrongFeedback,
  setScore,
  setStructureBlocks
}: GameEventListenersProps): void {
  useEffect(() => {
    function showFeedbackHandler() {
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1000);
    }
    
    function showWrongFeedbackHandler() {
      setShowWrongFeedback(true);
      setTimeout(() => setShowWrongFeedback(false), 2000);
    }
    
    function scoreUpdatedHandler(e: ScoreUpdatedEvent) {
      setScore(prev => prev + (e.detail?.delta || 0));
    }
    
    function structureUpdatedHandler(e: StructureUpdatedEvent) {
      if (e.detail?.action === 'addBlock') setStructureBlocks(prev => prev + 1);
      if (e.detail?.action === 'removeBlock') setStructureBlocks(prev => Math.max(prev - 1, 0));
    }
    
    window.addEventListener('showCorrectFeedback', showFeedbackHandler);
    window.addEventListener('showWrongFeedback', showWrongFeedbackHandler);
    window.addEventListener('scoreUpdated', scoreUpdatedHandler as EventListener);
    window.addEventListener('structureUpdated', structureUpdatedHandler as EventListener);
    
    return () => {
      window.removeEventListener('showCorrectFeedback', showFeedbackHandler);
      window.removeEventListener('showWrongFeedback', showWrongFeedbackHandler);
      window.removeEventListener('scoreUpdated', scoreUpdatedHandler as EventListener);
      window.removeEventListener('structureUpdated', structureUpdatedHandler as EventListener);
    };
  }, [setShowFeedback, setShowWrongFeedback, setScore, setStructureBlocks]);
}
