import soundManager from './soundManager.js';
import blockAwardManager from './blockAwardManager.js';

/**
 * Handles logic for a wrong answer event.
 * Plays the wrong answer sound, removes a block if possible, and shows feedback.
 * @param {object} [options] - Optional playback options for soundManager.play (e.g., volume, offset, duration)
 */
export function handleWrongAnswer(options = {}) {
  soundManager.play('wrong', options);

  // Border flash removed


  // Modular block removal: remove last awarded block (future: can specify type)
  if (typeof window !== 'undefined') {
    blockAwardManager.removeBlock();

    // Maintain legacy correctBlocks count for UI compatibility
    window.correctBlocks = Math.max((window.correctBlocks || 0) - 1, 0);
    const event = new CustomEvent('correctBlocksUpdated', { detail: { count: window.correctBlocks } });
    window.dispatchEvent(event);
    // Trigger feedback UI for Snackbar
    window.dispatchEvent(new CustomEvent('showWrongFeedback'));
    // Dispatch score update event
    window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { delta: -1 } }));
  }

  // TODO: Add missed problem recording and reinsertion logic
}
