import soundManager from './soundManager.js';

/**
 * Handles logic for a correct answer event.
 * Plays the correct answer sound and can be extended to trigger animations, award blocks, etc.
 * @param {object} [options] - Optional playback options for soundManager.play (e.g., volume, offset, duration)
 */
export function handleRightAnswer(options = {}) {
  soundManager.play('correct', options);

  // Positive animation placeholder: flash green border around the canvas
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const originalBorder = canvas.style.border;
    canvas.style.border = '4px solid #4CAF50';
    setTimeout(() => {
      canvas.style.border = originalBorder;
    }, 300);
  }
  console.log('[handleRightAnswer] Positive animation triggered');

  // Block awarding placeholder: increment global correctBlocks count
  if (typeof window !== 'undefined') {
    window.correctBlocks = (window.correctBlocks || 0) + 1;
    const event = new CustomEvent('correctBlocksUpdated', { detail: { count: window.correctBlocks } });
    window.dispatchEvent(event);
    // Trigger feedback UI
    window.dispatchEvent(new CustomEvent('showCorrectFeedback'));
  }
  console.log('[handleRightAnswer] Block awarded. Total correct blocks:', window.correctBlocks);
  // TODO: Add structure update and advanced feedback logic here
}
