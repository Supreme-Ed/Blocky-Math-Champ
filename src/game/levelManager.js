// levelManager.js
// Manages level selection, difficulty filtering, and blueprint loading for Blocky Math Champ

import gameEngine from './gameEngine.js';

// levelManager.js
// Central module for difficulty and level settings in Blocky Math Champ

export const DIFFICULTY_SETTINGS = {
  easy: {
    label: 'Easy',
    problemTypes: ['addition', 'subtraction'],
    min: 1,
    max: 10,
    distractors: 1,
    problemCounts: [10, 15, 20, 25, 30, 35, 40], // min & default is 10
    defaultProblemCount: 10,
  },
  medium: {
    label: 'Medium',
    problemTypes: ['addition', 'subtraction', 'multiplication'],
    min: 1,
    max: 20,
    distractors: 2,
    problemCounts: [10, 15, 20, 25, 30, 35, 40],
    defaultProblemCount: 10,
  },
  hard: {
    label: 'Hard',
    problemTypes: ['addition', 'subtraction', 'multiplication', 'division'],
    min: 1,
    max: 100,
    distractors: 3,
    problemCounts: [10, 15, 20, 25, 30, 35, 40],
    defaultProblemCount: 10,
  },
};

class LevelManager {
  constructor() {
    this.currentDifficulty = 'easy';
    this.selectedProblemCount = DIFFICULTY_SETTINGS['easy'].defaultProblemCount;
  }

  setDifficulty(diff) {
    if (DIFFICULTY_SETTINGS[diff]) {
      this.currentDifficulty = diff;
      // Reset problem count to default for new difficulty
      this.selectedProblemCount = DIFFICULTY_SETTINGS[diff].defaultProblemCount;
      return true;
    }
    return false;
  }

  getDifficulty() {
    return this.currentDifficulty;
  }

  getProblemCounts() {
    return DIFFICULTY_SETTINGS[this.currentDifficulty].problemCounts;
  }

  setProblemCount(count) {
    if (this.getProblemCounts().includes(count)) {
      this.selectedProblemCount = count;
      return true;
    }
    return false;
  }

  getProblemCount() {
    return this.selectedProblemCount;
  }

  getCurrentConfig() {
    return {
      ...DIFFICULTY_SETTINGS[this.currentDifficulty],
      selectedProblemCount: this.selectedProblemCount,
    };
  }
}

const levelManager = new LevelManager();
export default levelManager;

