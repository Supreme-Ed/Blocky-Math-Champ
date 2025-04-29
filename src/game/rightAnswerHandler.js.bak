import soundManager from './soundManager.js';
import * as BABYLON from '@babylonjs/core';
import { playRightAnswerEffect, playCubeFlyToAvatarEffect } from '../effects/rightAnswerEffects.js';
import { BLOCK_TYPES } from './blockTypes.js';
import blockAwardManager from './blockAwardManager.js';

/**
 * Handles logic for a correct answer event.
 * Plays the correct answer sound and can be extended to trigger animations, award blocks, etc.
 * @param {object} [options] - Optional playback options for soundManager.play (e.g., volume, offset, duration)
 */
export function handleRightAnswer(options = {}) {
  // Play visual effect if mesh is provided
  if (options.mesh) {
    playRightAnswerEffect(options.mesh);
    // Animate cube flying to avatar after green glow
    setTimeout(() => {
      playCubeFlyToAvatarEffect(options.mesh, new BABYLON.Vector3(0, 0.5, 3));
    }, 400);
  }
  soundManager.play('correct', options);

  // Modular block awarding: use provided blockTypeId if present
  if (typeof window !== 'undefined') {
    let blockTypeId = options.blockTypeId;
    if (!blockTypeId) {
      // Fallback to random for legacy calls
      const blockTypeIdx = Math.floor(Math.random() * BLOCK_TYPES.length);
      blockTypeId = BLOCK_TYPES[blockTypeIdx].id;
    }
    blockAwardManager.awardBlock(blockTypeId);

    // Maintain legacy correctBlocks count for UI compatibility
    window.correctBlocks = (window.correctBlocks || 0) + 1;
    const event = new CustomEvent('correctBlocksUpdated', { detail: { count: window.correctBlocks } });
    window.dispatchEvent(event);
    // Trigger feedback UI for Snackbar
    window.dispatchEvent(new CustomEvent('showCorrectFeedback'));
    // Dispatch score update event
    window.dispatchEvent(new CustomEvent('scoreUpdated', { detail: { delta: 1 } }));
  }

  
}
