import soundManager from './soundManager.js';

/**
 * Handles logic for a wrong answer event.
 * Plays the wrong answer sound, triggers negative animation, removes a block if possible, and shows feedback.
 * @param {object} [options] - Optional playback options for soundManager.play (e.g., volume, offset, duration)
 */
export function handleWrongAnswer(options = {}) {
  soundManager.play('wrong', options);

  // Negative animation: flash red border around the canvas
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const originalBorder = canvas.style.border;
    canvas.style.border = '4px solid #F44336';
    setTimeout(() => {
      canvas.style.border = originalBorder;
    }, 300);
  }
  console.log('[handleWrongAnswer] Negative animation triggered');

  // Remove a block if possible
  if (typeof window !== 'undefined') {
    window.correctBlocks = Math.max((window.correctBlocks || 0) - 1, 0);
    const event = new CustomEvent('correctBlocksUpdated', { detail: { count: window.correctBlocks } });
    window.dispatchEvent(event);
    // Trigger feedback UI
    window.dispatchEvent(new CustomEvent('showWrongFeedback'));
  }
  console.log('[handleWrongAnswer] Block removed. Total correct blocks:', window.correctBlocks);
  // TODO: Add missed problem recording and reinsertion logic
}
