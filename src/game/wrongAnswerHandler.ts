import soundManager from './soundManager';
import { playWrongAnswerEffect } from '../effects/wrongAnswerEffects';
import blockAwardManager from './blockAwardManager';
import { Mesh, AbstractMesh } from '@babylonjs/core';

interface WrongAnswerOptions {
  mesh?: AbstractMesh;
  volume?: number;
  offset?: number;
  duration?: number;
  [key: string]: any;
}

declare global {
  interface Window {
    correctBlocks: number;
  }
}

/**
 * Handles logic for a wrong answer event.
 * Plays the wrong answer sound, removes a block if possible, and shows feedback.
 * @param options - Optional playback options for soundManager.play (e.g., volume, offset, duration)
 */
export function handleWrongAnswer(options: WrongAnswerOptions = {}): void {
  // Play visual effect if mesh is provided
  if (options.mesh) {
    playWrongAnswerEffect(options.mesh);
  }
  soundManager.play('wrong', options);

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
}
