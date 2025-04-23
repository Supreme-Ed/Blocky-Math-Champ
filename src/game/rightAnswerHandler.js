import soundManager from './soundManager.js';

/**
 * Handles logic for a correct answer event.
 * Plays the correct answer sound and can be extended to trigger animations, award blocks, etc.
 * @param {object} [options] - Optional playback options for soundManager.play (e.g., volume, offset, duration)
 */
export function handleRightAnswer(options = {}) {
  soundManager.play('correct', options);

  // Border flash removed


  // Block awarding placeholder: increment global correctBlocks count
  if (typeof window !== 'undefined') {
    window.correctBlocks = (window.correctBlocks || 0) + 1;
    const event = new CustomEvent('correctBlocksUpdated', { detail: { count: window.correctBlocks } });
    window.dispatchEvent(event);
    // Trigger feedback UI for Snackbar
    window.dispatchEvent(new CustomEvent('showCorrectFeedback'));
    // Dispatch score update event
    window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { delta: 1 } }));
  }

  // TODO: Add structure update and advanced feedback logic here
}
