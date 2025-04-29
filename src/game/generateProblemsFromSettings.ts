// generateProblemsFromSettings.ts
// Utility to generate a problem set based on user StartScreen settings
import { problemGenerators } from './problemBank';
import { MathProblem } from '../types/game';

interface MathTypeSettings {
  type: string;
  min?: number;
  max?: number;
  tables?: number[];
  [key: string]: any;
}

interface UserSettings {
  mathTypes: MathTypeSettings[];
  difficulty?: string;
  avatar?: string;
}

interface GenerateOptions {
  numProblems?: number;
}

/**
 * Generate a set of math problems based on user settings
 * @param settings User settings from the StartScreen
 * @param options Generation options
 * @returns Array of generated math problems
 */
export default function generateProblemsFromSettings(
  settings: UserSettings,
  options: GenerateOptions = {}
): MathProblem[] {
  const numProblems = options.numProblems || 10;
  const problems: MathProblem[] = [];
  const { mathTypes } = settings;
  if (!Array.isArray(mathTypes) || mathTypes.length === 0) return problems;

  // Evenly distribute problems across selected types
  for (let i = 0; i < numProblems; i++) {
    const typeIdx = i % mathTypes.length;
    const typeSettings = mathTypes[typeIdx];
    const { type, ...params } = typeSettings;
    const generator = problemGenerators[type];
    if (typeof generator !== 'function') continue;
    // Defensive: avoid accidental duplicate IDs
    let problem: MathProblem;
    let tries = 0;
    do {
      problem = generator(params);
      tries++;
    } while (
      problem && 'id' in problem &&
      problems.find(p => 'id' in p && p.id === problem.id) &&
      tries < 10
    );
    problems.push(problem);
  }
  return problems;
}
