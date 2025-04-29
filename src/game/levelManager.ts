// levelManager.ts
// Manages level selection, difficulty filtering, and blueprint loading for Blocky Math Champ

import gameEngine from './gameEngine';

interface DifficultySettings {
  label: string;
  problemTypes: string[];
  min: number;
  max: number;
  distractors: number;
  problemCounts: number[];
  defaultProblemCount: number;
}

interface DifficultyConfig extends DifficultySettings {
  selectedProblemCount: number;
}

export const DIFFICULTY_SETTINGS: Record<string, DifficultySettings> = {
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
  private currentDifficulty: string;
  private selectedProblemCount: number;

  constructor() {
    this.currentDifficulty = 'easy';
    this.selectedProblemCount = DIFFICULTY_SETTINGS['easy'].defaultProblemCount;
  }

  setDifficulty(diff: string): boolean {
    if (DIFFICULTY_SETTINGS[diff]) {
      this.currentDifficulty = diff;
      // Reset problem count to default for new difficulty
      this.selectedProblemCount = DIFFICULTY_SETTINGS[diff].defaultProblemCount;
      return true;
    }
    return false;
  }

  getDifficulty(): string {
    return this.currentDifficulty;
  }

  getProblemCounts(): number[] {
    return DIFFICULTY_SETTINGS[this.currentDifficulty].problemCounts;
  }

  setProblemCount(count: number): boolean {
    if (this.getProblemCounts().includes(count)) {
      this.selectedProblemCount = count;
      return true;
    }
    return false;
  }

  getProblemCount(): number {
    return this.selectedProblemCount;
  }

  getCurrentConfig(): DifficultyConfig {
    return {
      ...DIFFICULTY_SETTINGS[this.currentDifficulty],
      selectedProblemCount: this.selectedProblemCount,
    };
  }
}

const levelManager = new LevelManager();
export default levelManager;
