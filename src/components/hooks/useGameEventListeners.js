import { useEffect } from 'react';

/**
 * Custom hook to encapsulate all window event listeners for feedback, score, and structure updates.
 * Keeps MainGame clean and event logic modular.
 */
export default function useGameEventListeners({ setShowFeedback, setShowWrongFeedback, setScore, setStructureBlocks }) {
  useEffect(() => {
    function showFeedbackHandler() {
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 1000);
    }
    function showWrongFeedbackHandler() {
      setShowWrongFeedback(true);
      setTimeout(() => setShowWrongFeedback(false), 2000);
    }
    function scoreUpdatedHandler(e) {
      setScore(prev => prev + (e.detail?.delta || 0));
    }
    function structureUpdatedHandler(e) {
      if (e.detail?.action === 'addBlock') setStructureBlocks(prev => prev + 1);
      if (e.detail?.action === 'removeBlock') setStructureBlocks(prev => Math.max(prev - 1, 0));
    }
    window.addEventListener('showCorrectFeedback', showFeedbackHandler);
    window.addEventListener('showWrongFeedback', showWrongFeedbackHandler);
    window.addEventListener('scoreUpdated', scoreUpdatedHandler);
    window.addEventListener('structureUpdated', structureUpdatedHandler);
    return () => {
      window.removeEventListener('showCorrectFeedback', showFeedbackHandler);
      window.removeEventListener('showWrongFeedback', showWrongFeedbackHandler);
      window.removeEventListener('scoreUpdated', scoreUpdatedHandler);
      window.removeEventListener('structureUpdated', structureUpdatedHandler);
    };
  }, [setShowFeedback, setShowWrongFeedback, setScore, setStructureBlocks]);
}
