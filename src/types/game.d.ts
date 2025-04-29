export interface MathProblem {
  question: string;
  answer: number | string;
  options?: (number | string)[];
  difficulty?: number;
  type?: string;
  id?: string | number;
}

export interface ProblemHistory {
  answer: number | string;
  correct: boolean;
  timestamp: number;
}

export interface ExtendedMathProblem extends MathProblem {
  choices?: (number | string)[];
  history?: ProblemHistory[];
  correctStreak?: number;
  mistakeCount?: number;
  firstTryWasCorrect?: boolean;
}

export interface BlockType {
  id: string;
  name: string;
  texture?: string;
  color?: string;
  rarity?: number;
}

export interface GameState {
  currentProblem: MathProblem | null;
  score: number;
  level: number;
  blocks: Record<string, number>;
  mistakesLog: MathProblem[];
  sessionComplete: boolean;
}

export interface Avatar {
  file: string;
  name?: string;
}
