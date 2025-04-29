// problemBank.ts
// Defines and exports all math problems and generators (static and dynamic) for Blocky Math Champ

import { MathProblem } from '../types/game';

interface ProblemHistory {
  timestamp: number;
  correct: boolean;
}

interface GeneratedMathProblem extends MathProblem {
  id: string;
  choices: (number | string)[];
  type: string;
  generated: boolean;
  history: ProblemHistory[];
  mastery: number;
  correctStreak: number;
  mistakeCount: number;
}

interface AdditionProblemOptions {
  min?: number;
  max?: number;
}

interface SubtractionProblemOptions {
  min?: number;
  max?: number;
}

interface MultiplicationProblemOptions {
  tables?: number[];
}

interface DivisionProblemOptions {
  tables?: number[];
}

type ProblemGenerator<T> = (options?: T) => GeneratedMathProblem;

// Dynamic generator for addition problems
export function generateAdditionProblem({ min = 1, max = 10 }: AdditionProblemOptions = {}): GeneratedMathProblem {
  const a = Math.floor(Math.random() * (max - min + 1)) + min;
  const b = Math.floor(Math.random() * (max - min + 1)) + min;
  const answer = a + b;
  const choices = generateChoices(answer);
  return {
    id: `add-${a}-${b}`,
    question: `${a} + ${b} = ?`,
    choices,
    answer,
    type: 'addition',
    generated: true,
    history: [],
    mastery: 0,
    correctStreak: 0,
    mistakeCount: 0,
  };
}

// Dynamic generator for subtraction problems
export function generateSubtractionProblem({ min = 1, max = 10 }: SubtractionProblemOptions = {}): GeneratedMathProblem {
  let a = Math.floor(Math.random() * (max - min + 1)) + min;
  let b = Math.floor(Math.random() * (max - min + 1)) + min;
  if (b > a) [a, b] = [b, a]; // ensure non-negative result
  const answer = a - b;
  const choices = generateChoices(answer);
  return {
    id: `sub-${a}-${b}`,
    question: `${a} - ${b} = ?`,
    choices,
    answer,
    type: 'subtraction',
    generated: true,
    history: [],
    mastery: 0,
    correctStreak: 0,
    mistakeCount: 0,
  };
}

// Dynamic generator for multiplication problems (tables: array of table numbers)
export function generateMultiplicationProblem({ tables = [2,3,4,5,6,7,8,9,10,11,12] }: MultiplicationProblemOptions = {}): GeneratedMathProblem {
  const a = tables[Math.floor(Math.random() * tables.length)];
  const b = Math.floor(Math.random() * 13); // 0-12
  const answer = a * b;
  const choices = generateChoices(answer);
  return {
    id: `mul-${a}-${b}`,
    question: `${a} × ${b} = ?`,
    choices,
    answer,
    type: 'multiplication',
    generated: true,
    history: [],
    mastery: 0,
    correctStreak: 0,
    mistakeCount: 0,
  };
}

// Dynamic generator for division problems (tables: array of allowed divisors)
export function generateDivisionProblem({ tables = [2,3,4,5,6,7,8,9,10,11,12] }: DivisionProblemOptions = {}): GeneratedMathProblem {
  const divisor = tables[Math.floor(Math.random() * tables.length)];
  // Prevent divide by zero: quotient must be at least 1
  const quotient = Math.floor(Math.random() * 12) + 1; // 1-12
  const dividend = divisor * quotient;
  const answer = quotient;
  const choices = generateChoices(answer);
  return {
    id: `div-${dividend}-${divisor}`,
    question: `${dividend} ÷ ${divisor} = ?`,
    choices,
    answer,
    type: 'division',
    generated: true,
    history: [],
    mastery: 0,
    correctStreak: 0,
    mistakeCount: 0,
  };
}

// Helper to generate 3 unique wrong choices (total 4 choices)
function generateChoices(answer: number): number[] {
  const choices: number[] = [answer];
  while (choices.length < 4) {
    let wrong = answer + (Math.floor(Math.random() * 9) - 4); // wider range
    if (wrong === answer || choices.includes(wrong) || wrong < 0) continue;
    choices.push(wrong);
  }
  // Shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

// Export a mapping of type to generator
export const problemGenerators: Record<string, ProblemGenerator<any>> = {
  addition: generateAdditionProblem,
  subtraction: generateSubtractionProblem,
  multiplication: generateMultiplicationProblem,
  division: generateDivisionProblem,
};
