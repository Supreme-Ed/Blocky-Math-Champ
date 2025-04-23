import soundManager from './soundManager.js';

/**
 * Handles logic for a wrong answer event.
 * Plays the wrong answer sound, removes a block if possible, and shows feedback.
 * @param {object} [options] - Optional playback options for soundManager.play (e.g., volume, offset, duration)
 */
export function handleWrongAnswer(options = {}) {
  soundManager.play('wrong', options);

  // Border flash removed


  // Remove a block if possible
  if (typeof window !== 'undefined') {
    window.correctBlocks = Math.max((window.correctBlocks || 0) - 1, 0);
    const event = new CustomEvent('correctBlocksUpdated', { detail: { count: window.correctBlocks } });
    window.dispatchEvent(event);
    // Trigger feedback UI
    window.dispatchEvent(new CustomEvent('showWrongFeedback'));
  }

  // TODO: Add missed problem recording and reinsertion logic
}
